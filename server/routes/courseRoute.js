import express from 'express';
import { getAllCourses, getCourseId } from '../controllers/courseController.js';

const courseRouter = express.Router();

// --- IMPORTANT: ORDER MATTERS ---

// 1. Pehle ye "Static" routes aane chahiye
// Agar frontend '/api/course' call kare ya '/api/course/all' call kare, dono handle honge
courseRouter.get('/', getAllCourses);
courseRouter.get('/all', getAllCourses); 

// 2. Sabse LAST mein ye ID wala route aana chahiye
// Agar upar wala match nahi hua, tabhi code maanega ki ye koi ID hai
courseRouter.get('/:id', getCourseId);

export default courseRouter;