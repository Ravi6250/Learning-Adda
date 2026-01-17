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
    // Connect to DB and cloud
    await connectDB();
    await connectCloudinary();

    const app = express();

    // ✅ Stripe webhook (requires raw body, must be first)
    app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

    // ✅ Use CORS BEFORE all other middlewares
    app.use(cors({
      origin: (origin, callback) => {
        
        const allowedOrigins = [
          'http://localhost:5173',  // Default Vite Port
          'http://localhost:5174',  // Tumhara Custom Port
          'https://learning-adda.vercel.app', // ✅ Tumhara Main Vercel App
          'https://learning-adda-frontend.vercel.app', // (Optional) Agar naam change hua ho
          process.env.FRONTEND_URL // Render Env variable fallback
        ];

        // Agar origin allowed list me hai, ya request server-to-server (no origin) hai:
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true); // Allow the request
        } else {
          console.log("Blocked by CORS:", origin); // Logs me dikhega kisne block kiya
          callback(new Error('Not allowed by CORS')); // Block all others
        }
      },
      credentials: true,
    }));

    // ✅ Must go after raw Stripe handler and before routes
    app.use(express.json());

    // ✅ Clerk middleware (must come after CORS and body parsers)
    app.use(clerkMiddleware());

    // ✅ Test route
    app.get('/', (req, res) => {
      res.send("✅ Learning Adda API is running");
    });

    // ✅ Webhook from Clerk
    app.post('/clerk', clerkWebhooks);

    // ✅ Main API routes
    app.use('/api/user', userRouter);
    app.use('/api/educator', educatorRouter);
    app.use('/api/course', courseRouter);
    app.use('/api/ai', aiRoutes);

    // ✅ Start listening
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