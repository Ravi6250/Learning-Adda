import express from 'express';
import { 
    getUserData, 
    userEnrolledCourses, 
    purchaseCourse, 
    updateUserCourseProgress, 
    getUserCourseProgress, 
    addUserRating 
} from '../controllers/userController.js';

const userRouter = express.Router();

// Get User Data
userRouter.get('/data', getUserData);

// Get Enrolled Courses
userRouter.get('/enrolled-courses', userEnrolledCourses);

// Purchase Course
userRouter.post('/purchase', purchaseCourse);

// Course Progress Update
userRouter.post('/update-course-progress', updateUserCourseProgress);

// Get Course Progress
userRouter.post('/get-course-progress', getUserCourseProgress);

// Add Rating
userRouter.post('/add-rating', addUserRating);

export default userRouter;