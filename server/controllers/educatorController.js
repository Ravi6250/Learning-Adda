import { v2 as cloudinary } from 'cloudinary';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to find user by Clerk ID or MongoDB _id (Universal Fix)
const findUserSafe = async (clerkId) => {
    return await User.findOne({ 
        $or: [{ _id: clerkId }, { clerkId: clerkId }] 
    });
};

// 1. Add New Course
export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body;
        const imageFile = req.file;
        const clerkId = req.auth.userId;

        let user = await findUserSafe(clerkId);

        if (!user) {
            console.log("User not found in DB, creating new Educator...");
            user = await User.create({
                _id: clerkId,
                name: "New Educator",
                email: "educator@example.com",
                imageUrl: "https://via.placeholder.com/150",
                role: "educator"
            });
        }

        if (!imageFile) {
            return res.json({ success: false, message: "Thumbnail Image is required" });
        }

        const parsedCourseData = JSON.parse(courseData);
        const imageUpload = await cloudinary.uploader.upload(imageFile.path);
        
        const newCourseData = {
            courseTitle: parsedCourseData.courseTitle,
            courseDescription: parsedCourseData.courseDescription,
            coursePrice: Number(parsedCourseData.coursePrice),
            discount: Number(parsedCourseData.discount),
            courseContent: parsedCourseData.courseContent,
            courseThumbnail: imageUpload.secure_url,
            educator: user._id, 
        };

        const newCourse = await Course.create(newCourseData);

        res.json({ success: true, message: "Course Added Successfully", course: newCourse });

    } catch (error) {
        console.error("Error in Add Course:", error);
        res.json({ success: false, message: error.message });
    }
};

// 2. Get Educator Courses (FIXED: Variable Name 'courses')
export const getEducatorCourses = async (req, res) => {
    try {
        const clerkId = req.auth.userId;
        const user = await findUserSafe(clerkId);
        
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const courses = await Course.find({ educator: user._id });
        
        // ✅ FIX: 'courseData' ki jagah 'courses' bheja hai (Frontend yehi expect kar raha hoga)
        res.json({ success: true, courses }); 

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 3. Educator Dashboard Data
export const educatorDashboardData = async (req, res) => {
    try {
        const clerkId = req.auth.userId;
        const user = await findUserSafe(clerkId);

        if (!user) {
             return res.json({ success: false, message: "User not found" });
        }

        const courses = await Course.find({ educator: user._id });
        const totalCourses = courses.length;

        const totalEarnings = 0; 
        const enrolledStudents = []; 

        res.json({ 
            success: true, 
            dashboardData: {
                totalCourses,
                totalEarnings,
                enrolledStudents
            } 
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 4. Get Enrolled Students Data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const clerkId = req.auth.userId;
        const user = await findUserSafe(clerkId);

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        
        const courses = await Course.find({ educator: user._id });
        const studentsData = [];

        for (const course of courses) {
            for (const studentId of course.enrolledStudents) {
                const student = await findUserSafe(studentId); // Safe check for students too

                if (student) {
                    studentsData.push({
                        courseTitle: course.courseTitle,
                        student: {
                            _id: student._id,
                            name: student.name,
                            imageUrl: student.imageUrl
                        },
                        enrolledOn: new Date().toLocaleDateString()
                    });
                }
            }
        }

        res.json({ success: true, enrolledStudents: studentsData });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 5. Update Role to Educator
export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = req.auth.userId;
        // Universal update logic
        await User.findOneAndUpdate(
            { $or: [{ _id: userId }, { clerkId: userId }] }, 
            { role: 'educator' }
        );
        res.json({ success: true, message: 'Role updated to educator' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 6. Generate Course with AI (Fixed for Frontend 'lectureUrl' error)
export const generateCourseWithAI = async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic) {
            return res.json({ success: false, message: 'Topic is required' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using correct model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Create a detailed course outline for the topic: "${topic}".
        The output MUST be a valid JSON object.
        Do not add any markdown formatting (like \`\`\`json). Just return the raw JSON.
        
        The structure should match this strictly:
        {
            "courseTitle": "Creative title for the course",
            "courseDescription": "A short engaging description",
            "coursePrice": 0,
            "discount": 0,
            "courseContent": [
                {
                    "chapterTitle": "Chapter 1 Title",
                    "chapterContent": [
                        {
                            "lectureTitle": "Lecture 1 Title",
                            "lectureDuration": 10,
                            "lectureUrl": "https://www.youtube.com/embed/xyz", 
                            "isPreviewFree": false
                        }
                    ]
                }
            ]
        }
        
        Important: "lectureUrl" MUST NOT be empty. Use a placeholder URL.
        Generate at least 3 chapters with 2-3 lectures in each chapter.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const courseData = JSON.parse(cleanText);

        res.json({ success: true, courseData });

    } catch (error) {
        console.error("AI Error:", error);
        res.json({ success: false, message: "Failed to generate course. Try again." });
    }
}