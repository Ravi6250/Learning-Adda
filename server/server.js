import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';
import educatorRouter from './routes/educatorRoutes.js';
import courseRouter from './routes/courseRoute.js';
import { clerkMiddleware } from '@clerk/express';
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js';
import aiRoutes from './routes/aiRoutes.js';

const startServer = async () => {
  try {
    await connectDB();
    await connectCloudinary();

    const app = express();

    // ✅ Stripe Webhook (Sabse pehle)
    app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

    // ✅ CORS FIX: Allow All Origins (Taaki koi URL reject na ho)
    app.use(cors({
      origin: true, // "True" ka matlab: Jo bhi aaye, aane do.
      credentials: true
    }));

    // ✅ JSON Middleware
    app.use(express.json());

    // ✅ Clerk Middleware
    app.use(clerkMiddleware());

    // ✅ Test Route
    app.get('/', (req, res) => {
      res.send("✅ Learning Adda API is running");
    });

    app.post('/clerk', clerkWebhooks);

    // ✅ Routes
    app.use('/api/user', userRouter);
    app.use('/api/educator', educatorRouter);
    app.use('/api/course', courseRouter);
    app.use('/api/ai', aiRoutes);

    const PORT = process.env.PORT || 3300;
    app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Server startup error:", err.message);
    process.exit(1);
  }
};

startServer();