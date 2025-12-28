import { v2 as cloudinary } from 'cloudinary'
import Course from '../models/Course.js'
import User from '../models/User.js'

// Add New Course
export const addCourse = async (req, res) => {
    try {
        const { courseTitle, courseDescription, coursePrice, discount, courseContent } = req.body;
        const imageFile = req.file;
        
        // Direct Clerk ID (String)
        const educatorId = req.auth.userId; 

        if (!imageFile) {
            return res.json({ success: false, message: 'Thumbnail Image is required' });
        }

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });

        const courseData = {
            courseTitle,
            courseDescription,
            coursePrice: Number(coursePrice),
            discount: Number(discount),
            courseContent: JSON.parse(courseContent),
            courseThumbnail: imageUpload.secure_url,
            // Direct String ID save kar rahe hain
            educator: educatorId 
        };

        const newCourse = await Course.create(courseData);

        res.json({ success: true, message: "Course Added Successfully", course: newCourse });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        const courses = await Course.find({ educator: educatorId });
        res.json({ success: true, courses });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Educator Dashboard Data
export const educatorDashboardData = async (req, res) => {
    try {
        const educatorId = req.auth.userId; // Clerk ID (String)
        const courses = await Course.find({ educator: educatorId });
        const totalCourses = courses.length;

        const courseIds = courses.map(c => c._id);
        
        // Earnings calculation (dummy logic for now)
        const totalEarnings = 0; 
        
        // Enrolled Students (dummy array for now to prevent crash)
        const enrolledStudents = []; 

        res.json({ 
            success: true, 
            dashboardData: {
                totalCourses,
                totalEarnings,
                enrolledStudents // Ye ensure karega ki ye field hamesha frontend ko mile
            } 
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        // Logic simplified to avoid errors
        res.json({ success: true, enrolledStudents: [] });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = req.auth.userId;
        await User.findOneAndUpdate({ clerkId: userId }, { role: 'educator' });
        res.json({ success: true, message: 'Role updated to educator' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}