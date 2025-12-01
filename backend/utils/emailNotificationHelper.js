/**
 * Email Notification Helper
 * Centralized logic for checking user preferences and sending emails
 */

import User from "../models/user.model.js";
import { 
  sendDeviationAlertEmail, 
  sendEmotionSpikeEmail, 
  sendPersistentNegativityEmail,
  sendPatternWarningEmail,
  sendPositiveMilestoneEmail,
  sendBaselineUpdateEmail,
  sendJournalEntryEmail
} from "../mailtrap/emails.js";

/**
 * Check if user has email notifications enabled for a specific type
 */
export const shouldSendEmailNotification = (user, notificationType) => {
  if (!user || !user.email) return false;
  
  const prefs = user.emailNotificationPreferences || {};
  
  // If email notifications are globally disabled, don't send
  if (prefs.enabled === false) return false;
  
  // Check specific notification type preference
  switch (notificationType) {
    case 'journalEntries':
      return prefs.journalEntries !== false;
    case 'deviationAlerts':
      return prefs.deviationAlerts !== false;
    case 'emotionSpikes':
      return prefs.emotionSpikes !== false;
    case 'persistentNegativity':
      return prefs.persistentNegativity !== false;
    case 'patternWarnings':
      return prefs.patternWarnings !== false;
    case 'positiveMilestones':
      return prefs.positiveMilestones === true;
    case 'baselineUpdates':
      return prefs.baselineUpdates === true;
    default:
      return true; // Default to enabled for unknown types
  }
};

/**
 * Send email notification with preference checking
 */
export const sendEmailWithPreferences = async (userId, notificationType, emailFunction, emailData) => {
  try {
    const user = await User.findById(userId).select('email name emailNotificationPreferences');
    
    if (!user || !user.email) {
      console.log(`[EmailHelper] ⚠️ No user or email found for userId: ${userId}`);
      return false;
    }
    
    if (!shouldSendEmailNotification(user, notificationType)) {
      console.log(`[EmailHelper] 📧 Email notification skipped for ${notificationType} (user preference)`);
      return false;
    }
    
    await emailFunction(user.email, user.name, emailData);
    console.log(`[EmailHelper] ✉️ ${notificationType} email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[EmailHelper] ❌ Error sending ${notificationType} email:`, error.message);
    return false;
  }
};

/**
 * Send deviation alert email with preference check
 */
export const sendDeviationAlertWithPreferences = async (userId, alertData) => {
  return await sendEmailWithPreferences(
    userId,
    'deviationAlerts',
    sendDeviationAlertEmail,
    alertData
  );
};

/**
 * Send emotion spike email with preference check
 */
export const sendEmotionSpikeWithPreferences = async (userId, spikeData) => {
  return await sendEmailWithPreferences(
    userId,
    'emotionSpikes',
    sendEmotionSpikeEmail,
    spikeData
  );
};

/**
 * Send persistent negativity email with preference check
 */
export const sendPersistentNegativityWithPreferences = async (userId, persistenceData) => {
  // Always send critical alerts regardless of preferences
  const user = await User.findById(userId).select('email name emailNotificationPreferences');
  
  if (!user || !user.email) {
    return false;
  }
  
  try {
    await sendPersistentNegativityEmail(user.email, user.name, persistenceData);
    console.log(`[EmailHelper] ✉️ CRITICAL: Persistent negativity email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[EmailHelper] ❌ Error sending persistent negativity email:`, error.message);
    return false;
  }
};

/**
 * Send pattern warning email with preference check
 */
export const sendPatternWarningWithPreferences = async (userId, patternData) => {
  return await sendEmailWithPreferences(
    userId,
    'patternWarnings',
    sendPatternWarningEmail,
    patternData
  );
};

/**
 * Send positive milestone email with preference check
 */
export const sendPositiveMilestoneWithPreferences = async (userId, milestoneData) => {
  return await sendEmailWithPreferences(
    userId,
    'positiveMilestones',
    sendPositiveMilestoneEmail,
    milestoneData
  );
};

/**
 * Send baseline update email with preference check
 */
export const sendBaselineUpdateWithPreferences = async (userId, baselineData) => {
  return await sendEmailWithPreferences(
    userId,
    'baselineUpdates',
    sendBaselineUpdateEmail,
    baselineData
  );
};

/**
 * Send journal entry email with preference check
 */
export const sendJournalEntryWithPreferences = async (userId, journalData) => {
  return await sendEmailWithPreferences(
    userId,
    'journalEntries',
    sendJournalEntryEmail,
    journalData
  );
};
