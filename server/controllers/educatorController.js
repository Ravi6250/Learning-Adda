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

// Get Enrolled Students Data with Course Details
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educatorId = req.auth.userId; // Educator ki Clerk ID
        
        // 1. Educator ke saare courses dhoondo
        const courses = await Course.find({ educator: educatorId });
        
        const studentsData = [];

        // 2. Har course ke andar check karo kaun enrolled hai
        for (const course of courses) {
            // Course ke enrolledStudents array mein IDs hain
            for (const studentId of course.enrolledStudents) {
                // 3. User (Student) ka data dhoondo
                // Hum clerkId ya _id dono se check kar rahe hain taaki error na aaye
                const user = await User.findOne({ 
                    $or: [{ clerkId: studentId }, { _id: studentId }] 
                });

                if (user) {
                    studentsData.push({
                        courseTitle: course.courseTitle,
                        student: {
                            _id: user._id,
                            name: user.name,
                            imageUrl: user.imageUrl
                        },
                        enrolledOn: new Date().toLocaleDateString() // Filhal current date (schema mein date nahi hai isliye)
                    });
                }
            }
        }

        res.json({ success: true, enrolledStudents: studentsData });

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