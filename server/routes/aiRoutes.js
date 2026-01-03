import express from 'express';
import { generateQuiz, generateSummary } from '../controllers/aiController.js'; 

const router = express.Router();

router.post('/generate-quiz', generateQuiz);
router.post('/generate-summary', generateSummary);

export default router;