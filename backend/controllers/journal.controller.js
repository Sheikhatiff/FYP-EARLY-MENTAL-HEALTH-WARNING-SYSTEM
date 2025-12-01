import Journal from "../models/journal.model.js";
import Agenda from "../utils/agenda.js";
import { startBaselineAgenda } from "./agenda.controller.js";
import { updateUserEngagement } from "../services/notificationScheduler.js";
import { sendJournalEntryWithPreferences } from "../utils/emailNotificationHelper.js";

export const createJournal = async (req, res) => {
  try {
    const { title, content } = req.body;
    const {result} = req;
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Content is required" });
    }

    const user = req.user._id;
    const newJournal = new Journal({ title, content, user });

    if(result?.result_dict){
      const sum = Object.values(result?.result_dict).reduce((a, b) => a + b, 0);
      newJournal.analysis = {...result.result_dict,"others": (1 - sum)};
    }

    const savedJournal = await newJournal.save();

    // 🔔 NEW: Track user engagement on journal entry
    try {
      await updateUserEngagement(user, "journal_entry");
      console.log(`[Journal] 📝 Updated engagement state for user ${user} on journal entry`);
    } catch (engagementError) {
      console.error(`[Journal] ⚠️ Error updating engagement state:`, engagementError);
      // Don't fail journal creation due to engagement tracking error
    }

    // ✉️ Send journal entry confirmation email
    await sendJournalEntryWithPreferences(user, {
      title: title || 'New Entry',
      emotions: result?.result_dict,
      analysisDate: new Date().toLocaleDateString()
    });

    if(user && result?.result_var)
    {startBaselineAgenda()
    await Agenda.schedule(new Date(Date.now() + 60 * 2000), "baselineCreation_DeviationDetection", { userId: user, prediction: result?.result_var || {} , totalJournals: await Journal.countDocuments({user})});  
}
    res
      .status(201)
      .json({ message: "Journal entry created", data: { savedJournal },result });
  } catch (error) {
    console.log("createJournal error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getJournals = async (req, res) => {
  try {
    const filter = (req?.user?._id && req.user.role!=="admin") ? { user: req.user._id } : {};
    const journals = await Journal.find(filter).sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, result: journals.length, data: journals });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getJournalById = async (req, res) => {
  try {
    const { _id } = req.params;
    const journal = await Journal.findById(_id);
    if (!journal) {
      return res
        .status(404)
        .json({ success: false, message: "Journal entry not found" });
    }
    res.status(200).json({ success: true, data: { journal } });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateJournal = async (req, res) => {
  try {
    const { _id } = req.params;
    const { title, content } = req.body;

    const updatedJournal = await Journal.findById(_id);
    if (!updatedJournal) {
      return res
        .status(404)
        .json({ success: false, message: "Journal entry not found" });
    }
    if (title) updatedJournal.title = title;
    if (content) updatedJournal.content = content;
    await updatedJournal.save();
    res.status(200).json({
      success: true,
      message: "Journal entry updated",
      data: { updatedJournal },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const deleteJournal = async (req, res) => {
  try {
    const { _id } = req.params;
    const deletedJournal = await Journal.findByIdAndDelete(_id);
    if (!deletedJournal) {
      return res
        .status(404)
        .json({ success: false, message: "Journal entry not found" });
    }
    res.status(200).json({
      success: true,
      message: "Journal entry deleted",
      data: { deletedJournal },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
