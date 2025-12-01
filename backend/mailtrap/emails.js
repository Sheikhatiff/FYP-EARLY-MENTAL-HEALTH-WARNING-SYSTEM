import { mailtrapClient, sender } from "./mailtrap.config.js";

export const sendEmail = async (email, data) => {
  const recipient = [{ email }];
  try {
    await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: data.subject,
      text: data.text,
      category: data.category || "general",
    });
  } catch (err) {
    console.log(`Error sending email! : ${err.message}`);
    console.log(`Error sending email! : ${err.stack}`);
    console.log(`Error sending email! : ${err}`);
    throw err;
  }
};

/**
 * Send deviation alert email
 */
export const sendDeviationAlertEmail = async (email, userName, alertData) => {
  const { emotion, currentValue, baselineValue, deviationScore, percentageChange, severity } = alertData;
  
  const percentChange = Math.round(percentageChange * 100);
  const direction = currentValue > baselineValue ? "increased" : "decreased";
  
  const severityEmoji = {
    critical: "🚨",
    high: "⚠️",
    moderate: "📊",
    low: "ℹ️"
  }[severity] || "📊";

  const subject = `${severityEmoji} Mental Health Alert: ${emotion} Level Change`;
  
  const text = `Hi ${userName},

We've detected a significant change in your emotional patterns:

${severityEmoji} Alert Type: Deviation Alert
Emotion: ${emotion}
Change: ${direction} by ${Math.abs(percentChange)}%
Severity: ${severity.toUpperCase()}

Your ${emotion} level has ${direction} significantly from your baseline. This deviation might indicate a shift in your emotional state that's worth reflecting on.

Current Value: ${(currentValue * 100).toFixed(1)}%
Baseline Value: ${(baselineValue * 100).toFixed(1)}%
Deviation Score: ${(deviationScore * 100).toFixed(1)}%

💡 What you can do:
- Take a moment to reflect on recent events or changes in your life
- Consider journaling about what might be influencing these feelings
- Practice mindfulness or breathing exercises
- Reach out to someone you trust if you need support

Remember: These alerts are here to help you stay aware of your mental health patterns. If you're concerned about persistent changes, consider speaking with a mental health professional.

Stay well,
Early Mental Health Warning System`;

  await sendEmail(email, {
    subject,
    text,
    category: "mental_health_alert"
  });
};

/**
 * Send emotion spike alert email
 */
export const sendEmotionSpikeEmail = async (email, userName, spikeData) => {
  const { emotion, spikeValue, previousValue, severity } = spikeData;
  
  const percentage = Math.round(((spikeValue - previousValue) / previousValue) * 100);
  
  const subject = `⚡ Sudden ${emotion} Increase Detected`;
  
  const text = `Hi ${userName},

We've noticed a sudden spike in your emotional state:

⚡ Alert Type: Emotion Spike
Emotion: ${emotion}
Increase: +${percentage}%
Severity: ${severity.toUpperCase()}

Your latest journal entry shows a sharp increase in ${emotion} compared to your previous entry. This sudden change is worth noticing.

Current Value: ${(spikeValue * 100).toFixed(1)}%
Previous Value: ${(previousValue * 100).toFixed(1)}%

💡 Take a moment to:
- Reflect on what triggered this emotional shift
- Acknowledge your feelings without judgment
- Consider what support or coping strategies might help
- Journal about the experience to process your emotions

Remember: Emotions naturally fluctuate, but awareness is the first step to managing them effectively.

Take care,
Early Mental Health Warning System`;

  await sendEmail(email, {
    subject,
    text,
    category: "mental_health_alert"
  });
};

/**
 * Send persistent negativity alert email
 */
export const sendPersistentNegativityEmail = async (email, userName, persistenceData) => {
  const { negativeEmotions, consecutiveCount, severity } = persistenceData;
  
  const emotionList = Object.keys(negativeEmotions).join(", ");
  
  const subject = `⚠️ Persistent Negative Pattern Detected`;
  
  const text = `Hi ${userName},

This is an important mental health alert:

⚠️ Alert Type: Persistent Negativity
Pattern: ${consecutiveCount} consecutive entries
Emotions: ${emotionList}
Severity: ${severity.toUpperCase()}

We've noticed you've been experiencing challenging emotions consistently across your recent journal entries. This persistent pattern suggests you might benefit from additional support.

📊 Pattern Analysis:
- Consecutive entries with elevated negative emotions: ${consecutiveCount}
- Primary emotions detected: ${emotionList}

🆘 Important Actions:
- Consider reaching out to a mental health professional
- Talk to someone you trust about what you're experiencing
- Review your support network and coping strategies
- Practice self-care activities that have helped you in the past
- If you're in crisis, please contact a crisis helpline immediately

💚 Support Resources:
- National Crisis Hotline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

Your mental health matters. Please don't hesitate to seek support.

We're here for you,
Early Mental Health Warning System`;

  await sendEmail(email, {
    subject,
    text,
    category: "mental_health_alert"
  });
};

/**
 * Send pattern warning email
 */
export const sendPatternWarningEmail = async (email, userName, patternData) => {
  const { pattern, message, description, severity } = patternData;
  
  const subject = `📊 Pattern Detected: ${pattern}`;
  
  const text = `Hi ${userName},

We've identified an important pattern in your mental health data:

📊 Alert Type: Pattern Warning
Pattern: ${pattern}
Severity: ${severity.toUpperCase()}

${message}

${description}

💡 What this means:
This pattern in your emotional data suggests a trend worth paying attention to. Understanding your patterns can help you make proactive choices for your wellbeing.

🔍 Recommended Actions:
- Review your recent journal entries for insights
- Consider what factors might be contributing to this pattern
- Reflect on whether you need to adjust your self-care routine
- Track if this pattern continues in future entries

Remember: Awareness of patterns is a powerful tool for maintaining mental health.

Stay mindful,
Early Mental Health Warning System`;

  await sendEmail(email, {
    subject,
    text,
    category: "mental_health_alert"
  });
};

/**
 * Send journal entry confirmation email
 */
export const sendJournalEntryEmail = async (email, userName, journalData) => {
  const { title, emotions, analysisDate } = journalData;
  
  const subject = `✍️ Journal Entry Recorded - ${title || 'New Entry'}`;
  
  let emotionSummary = "Your entry has been analyzed.";
  if (emotions && Object.keys(emotions).length > 0) {
    const topEmotions = Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion, value]) => `${emotion}: ${(value * 100).toFixed(1)}%`)
      .join(", ");
    emotionSummary = `Top emotions: ${topEmotions}`;
  }
  
  const text = `Hi ${userName},

Your journal entry has been successfully recorded and analyzed.

✍️ Entry: ${title || 'Untitled Entry'}
📅 Date: ${analysisDate || new Date().toLocaleDateString()}

${emotionSummary}

Your emotional patterns are being monitored to help you stay aware of your mental health. If any significant changes are detected, you'll receive targeted alerts.

💡 Keep journaling regularly to:
- Build a comprehensive emotional baseline
- Track your progress over time
- Receive more accurate mental health insights
- Identify patterns and triggers

Thank you for prioritizing your mental health.

Best regards,
Early Mental Health Warning System`;

  await sendEmail(email, {
    subject,
    text,
    category: "journal_activity"
  });
};

/**
 * Send positive milestone email
 */
export const sendPositiveMilestoneEmail = async (email, userName, milestoneData) => {
  const { achievement, message, description } = milestoneData;
  
  const subject = `🎉 Achievement Unlocked: ${achievement}`;
  
  const text = `Hi ${userName},

Congratulations! We have some great news to share:

🎉 ${achievement}

${message}

${description}

Keep up the excellent work! Your commitment to tracking and understanding your mental health is making a real difference.

Celebrate this milestone and continue your journey toward better mental wellbeing.

Proud of you,
Early Mental Health Warning System`;

  await sendEmail(email, {
    subject,
    text,
    category: "positive_milestone"
  });
};

/**
 * Send baseline update email
 */
export const sendBaselineUpdateEmail = async (email, userName, baselineData) => {
  const { entryCount, changes } = baselineData;
  
  const subject = `📊 Your Emotional Baseline Has Been Updated`;
  
  const text = `Hi ${userName},

Your emotional baseline has been updated with your latest journal entry.

📊 Baseline Update
Entry Number: #${entryCount}
Changes: ${changes || 'Your baseline now reflects your most recent emotional patterns.'}

🔍 What is a baseline?
Your baseline represents your typical emotional patterns. As you add more journal entries, this baseline becomes more accurate and helps us identify meaningful changes in your mental health.

💡 Benefits:
- More accurate deviation detection
- Better personalized insights
- Improved trend analysis
- Enhanced early warning system

Keep journaling to maintain an up-to-date baseline!

Best regards,
Early Mental Health Warning System`;

  await sendEmail(email, {
    subject,
    text,
    category: "baseline_update"
  });
};
