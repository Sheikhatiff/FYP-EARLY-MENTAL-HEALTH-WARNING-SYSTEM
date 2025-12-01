import { sendEmail } from "../mailtrap/emails.js";
import User from "../models/user.model.js";
import UserBaseline from "../models/baseline.model.js";
import UserHistory from "../models/baseline_history.model.js";
import Agenda, { getIO } from "../utils/agenda.js";
import { createOrUpdateBaseline
  // , detectDeviation 
} from "./baseline_deviation.controller.js";
import { detectDeviation } from "./deviation.controller.js";
import { initializeNotificationScheduler } from "../services/notificationScheduler.js";


const checkVerificationAgenda = () => {
  Agenda.define("checkVerification", async (job) => {
    try {
      const { userId } = job.attrs.data;
      const searchedUser = await User.findById(userId);
      if (!searchedUser) return;
      if (searchedUser.isVerified) {
        console.log(`User ${searchedUser.name} is verified.`);
      } else {
        await User.findByIdAndDelete(userId);
        // TODO: send email to user about deletion
        await sendEmail(searchedUser.email, {
          subject: "Account Deletion Notice",
          text: `Dear ${searchedUser.name}, your account has been deleted due to not to verify account in a given time. Please register again if you wish to use our services.`,
          category: "account-deletion",
        });
        console.log(
          "Deleted user ",
          searchedUser.name,
          "! due to not to verify account in a given time!"
        );
      }
      await job.remove();
      console.log("Job completed and removed for user:", searchedUser.name);
    } catch (error) {
      console.error("Error in checkVerification job:", error);
    }
  });
};

export const startAgenda = async () => {
  checkVerificationAgenda();
  
  // 🔔 NEW: Initialize notification scheduler
  try {
    await initializeNotificationScheduler();
    console.log("[Agenda] ✅ Notification scheduler initialized");
  } catch (error) {
    console.error("[Agenda] ❌ Error initializing notification scheduler:", error);
  }

  await Agenda.start();
  console.log("Agenda started");
};

const baselineCreation_DeviationDetectionAgenda = () => {
  Agenda.define("baselineCreation_DeviationDetection", async (job) => {
    try { 
      const { userId, prediction, totalJournals } = job.attrs.data;
      console.log("[Agenda] 📋 Job data:", { userId, totalJournals, predictionKeys: Object.keys(prediction || {}) });
      const searchedUser = await User.findById(userId);
      if (!searchedUser) return;
      console.log("[Agenda] 👤 Running baselineCreation_DeviationDetection for user:", userId);
      await createOrUpdateBaseline(userId, prediction);
      console.log("[Agenda] ✅ Completed baselineCreation for user:", userId);
      if(totalJournals && totalJournals >= 2){  // Start deviation detection from 2nd entry
        const io = getIO();
        console.log(`[Agenda] 🔌 Socket.io instance available: ${io ? "✅ YES" : "❌ NO"}`);
        // await detectDeviation(userId, prediction);
        await detectDeviation(userId, prediction, UserHistory, UserBaseline, {}, io);  
        console.log("[Agenda] ✅ Completed DeviationDetection for user:", userId)
      } else {
        console.log(`[Agenda] ℹ️ Skipping deviation detection - only ${totalJournals} entry/entries (need 2+)`);
      }
      await job.remove();
    } catch (error) {
      console.error("[Agenda] ❌ Error in baselineCreation_DeviationDetection job:", error);
    }
  });
};

export const startBaselineAgenda = async () => {
  baselineCreation_DeviationDetectionAgenda();
  
  // 🔔 NEW: Initialize notification scheduler
  try {
    await initializeNotificationScheduler();
    console.log("[Agenda] ✅ Notification scheduler initialized");
  } catch (error) {
    console.error("[Agenda] ❌ Error initializing notification scheduler:", error);
  }

  await Agenda.start();
  console.log("Baseline Creation & Deviation Detection Agenda started");
};