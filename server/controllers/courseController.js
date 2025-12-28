import Course from "../models/Course.js";

export const getAllCourses = async (req, res) => {
    try {
        // Populate hata diya hai kyunki ab String ID use ho rahi hai
        const courses = await Course.find({ isPublished: true })
                                    .select(['-courseContent', '-enrolledStudents']);

        res.json({ success: true, courses });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getCourseId = async (req, res) => {
    const { id } = req.params;
    try {
        // Yahan bhi populate hata diya
        const courseData = await Course.findById(id);
        
        if (!courseData) {
            return res.json({ success: false, message: 'Course not found' });
        }
        
        res.json({ success: true, courseData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};