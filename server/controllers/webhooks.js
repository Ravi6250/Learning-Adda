import { Webhook } from "svix";
import User from "../models/User.js";
import stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

// API Controller Function to Manage Clerk User with database
export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"]
    });
    const { data, type } = req.body;

    switch (type) {
      case 'user.created': {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          // 🚨 FIX: Agar naam nahi hai toh "User" save karega, "null null" nahi.
          name: (data.first_name ? data.first_name : "User") + " " + (data.last_name ? data.last_name : ""),
          imageUrl: data.image_url,
          enrolledCourses: []
        };
        await User.create(userData);
        break;
      }
      case 'user.updated': {
        const userData = {
          email: data.email_addresses[0].email_address,
          // 🚨 FIX: Same fix for update
          name: (data.first_name ? data.first_name : "User") + " " + (data.last_name ? data.last_name : ""),
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        break;
      }
      case 'user.deleted': {
        await User.findByIdAndDelete(data.id);
        break;
      }
    }
    res.json({});
  } catch (error) {
    console.error('Clerk Webhook Error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Stripe Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

// Stripe Webhooks to Manage Payments Action
export const stripeWebhooks = async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe webhook signature verification failed.', err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the 'checkout.session.completed' event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { purchaseId } = session.metadata;

    if (!purchaseId) {
      console.error('❌ Error: purchaseId not found in webhook metadata.');
      return response.status(400).send('Error: Missing purchaseId in metadata.');
    }

    try {
      console.log('✅ Stripe Webhook received. Processing purchaseId:', purchaseId);

      const purchaseData = await Purchase.findById(purchaseId);
      if (!purchaseData) {
        console.error(`❌ Error: Purchase with ID ${purchaseId} not found.`);
        return response.status(404).send('Purchase not found.');
      }

      if (purchaseData.status === 'completed') {
        console.log('ℹ️ Webhook for already completed purchase received. Ignoring.');
        return response.json({ received: true });
      }

      const userData = await User.findById(purchaseData.userId);
      const courseData = await Course.findById(purchaseData.courseId);

      if (!userData || !courseData) {
        console.error('❌ Error: User or Course not found for this purchase.');
        return response.status(404).send('User or Course not found.');
      }

      // 🚨 FIX: Use $addToSet to prevent duplicates
      await Course.findByIdAndUpdate(courseData._id, {
        $addToSet: { enrolledStudents: userData._id }
      });

      // 🚨 FIX: Use $addToSet to ensure user gets course only once
      await User.findByIdAndUpdate(userData._id, {
        $addToSet: { enrolledCourses: courseData._id }
      });

      // Update Purchase Status
      purchaseData.status = 'completed';
      await purchaseData.save();

      console.log(`✅ Success: User ${userData._id} enrolled in course ${courseData._id}.`);

    } catch (dbError) {
      console.error('❌ Database update failed after webhook received:', dbError);
      return response.status(500).send('Internal server error during database update.');
    }
  }

  // Acknowledge receipt of the event
  response.json({ received: true });
};