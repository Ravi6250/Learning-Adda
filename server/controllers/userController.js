import Course from "../models/Course.js"
import { CourseProgress } from "../models/CourseProgress.js"
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"
import Stripe from "stripe" // Capital 'S' use kiya hai standard practice ke liye

// Get User Data
export const getUserData = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Purchase Course (Updated Logic)
export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const { origin } = req.headers;
        const userId = req.auth.userId; // Clerk ID

        // 1. Data Validate karein
        const courseData = await Course.findById(courseId);
        
        // Note: Hum yahan findById use kar rahe hain
        const userData = await User.findById(userId); 

        if (!userData || !courseData) {
            return res.json({ success: false, message: 'User or Course not found' });
        }

        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2),
        };

        const newPurchase = await Purchase.create(purchaseData);

        // --- UPDATE 1: User ke list mein Course add karo ---
        await User.findByIdAndUpdate(
            userId, 
            { $addToSet: { enrolledCourses: courseId } },
            { new: true }
        );

        // --- UPDATE 2: Course ke list mein Student add karo (MAJOR FIX) ---
        // Is line se Educator Dashboard mein data dikhega
        await Course.findByIdAndUpdate(
            courseId,
            { $addToSet: { enrolledStudents: userId } },
            { new: true }
        );
        // -------------------------------------------------------------------

        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
        const currency = process.env.CURRENCY ? process.env.CURRENCY.toLowerCase() : 'usd';

        const line_items = [{
            price_data: {
                currency,
                product_data: { name: courseData.courseTitle },
                unit_amount: Math.round((courseData.coursePrice - courseData.discount * courseData.coursePrice / 100) * 100)
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        });

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Users Enrolled Courses
export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const userData = await User.findById(userId).populate('enrolledCourses');

        if (!userData) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, enrolledCourses: userData.enrolledCourses });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update Course Progress
export const updateUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId, lectureId } = req.body;
        const progressData = await CourseProgress.findOne({ userId, courseId });

        if (progressData) {
            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture Already Completed' });
            }
            progressData.lectureCompleted.push(lectureId);
            await progressData.save();
        } else {
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            });
        }
        res.json({ success: true, message: 'Progress Updated' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Course Progress
export const getUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.body;
        const progressData = await CourseProgress.findOne({ userId, courseId });
        res.json({ success: true, progressData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Add User Rating
export const addUserRating = async (req, res) => {
    const userId = req.auth.userId;
    const { courseId, rating } = req.body;

    if (!courseId || !rating || rating < 1 || rating > 5) {
        return res.json({ success: false, message: 'Invalid Details' });
    }

    try {
        const course = await Course.findById(courseId);

        if (!course) {
            return res.json({ success: false, message: 'Course not found.' });
        }

        const user = await User.findById(userId);

        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: 'User has not purchased this course.' });
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId);

        if (existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating = rating;
        } else {
            course.courseRatings.push({ userId, rating });
        }

        await course.save();

        return res.json({ success: true, message: 'Rating added' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};