import Course from "../models/Course.js"
import { CourseProgress } from "../models/CourseProgress.js"
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"
import stripe from "stripe"

// Get User Data
export const getUserData = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found in database' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Purchase Course
export const purchaseCourse = async (req, res) => {
    console.log('\n--- DEBUG: "purchaseCourse" endpoint was hit! ---');
    try {
        const { courseId } = req.body;
        const { origin } = req.headers;
        const userId = req.auth.userId;

        const courseData = await Course.findById(courseId);
        const userData = await User.findOne({ _id: userId });

        if (!userData || !courseData) {
            return res.status(404).json({ success: false, message: 'User or Course not found' });
        }

        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2),
        };

        const newPurchase = await Purchase.create(purchaseData);

        // 🚨🚨🚨 MAJOR FIX: YE LINE ADD KARNA ZAROORI HAI 🚨🚨🚨
        // Ye line User ke account mein Course ID daalegi
        await User.findByIdAndUpdate(userId, {
            $addToSet: { enrolledCourses: courseId } // $addToSet use kiya taaki duplicate na ho
        });
        // -------------------------------------------------------

        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        const currency = process.env.CURRENCY.toLowerCase();

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
        console.error('--- DEBUG: Error in purchaseCourse ---', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Users Enrolled Courses (Baaki functions same rahenge)
export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const userData = await User.findById(userId).populate('enrolledCourses');
        if (!userData) {
            return res.json({ success: true, enrolledCourses: [] });
        }
        res.json({ success: true, enrolledCourses: userData.enrolledCourses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.body;
        const progressData = await CourseProgress.findOne({ userId, courseId });
        res.json({ success: true, progressData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addUserRating = async (req, res) => {
    const userId = req.auth.userId;
    const { courseId, rating } = req.body;
    if (!courseId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Invalid Details' });
    }
    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        if (!user.enrolledCourses.includes(courseId)) {
            return res.status(403).json({ success: false, message: 'User has not purchased this course.' });
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
        return res.status(500).json({ success: false, message: error.message });
    }
};