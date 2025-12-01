# Email Notification System for Early Mental Health Warning System

## Overview
This system sends automated email notifications to users for journal entries and mental health deviation alerts, working alongside the in-app notification system.

## Features

### Email Types Implemented

1. **Journal Entry Confirmation** ✍️
   - Sent when user creates a new journal entry
   - Includes emotion analysis summary
   - Preference: `journalEntries` (default: enabled)

2. **Deviation Alert** 📊
   - Sent when emotions deviate significantly from baseline
   - Includes severity level and percentage change
   - Preference: `deviationAlerts` (default: enabled)

3. **Emotion Spike Warning** ⚡
   - Sent when sudden emotion increase is detected
   - Shows comparison with previous entry
   - Preference: `emotionSpikes` (default: enabled)

4. **Persistent Negativity Alert** ⚠️
   - **CRITICAL** - Always sent regardless of preferences
   - Triggered after 3+ consecutive negative entries
   - Includes crisis resources and professional help recommendations
   - Preference: `persistentNegativity` (always enabled for safety)

5. **Pattern Warning** 📊
   - Sent when unusual emotional patterns detected
   - Provides context-aware recommendations
   - Preference: `patternWarnings` (default: enabled)

6. **Positive Milestone** 🎉
   - Sent for achievements and improvements
   - Celebrates user progress
   - Preference: `positiveMilestones` (default: disabled)

7. **Baseline Update** 📈
   - Sent at milestone entries (5, 10, 20, 50, 100)
   - Explains baseline improvements
   - Preference: `baselineUpdates` (default: disabled)

## Email Notification Preferences

### User Model Schema
```javascript
emailNotificationPreferences: {
  enabled: { type: Boolean, default: true },      // Master switch
  journalEntries: { type: Boolean, default: true },
  deviationAlerts: { type: Boolean, default: true },
  emotionSpikes: { type: Boolean, default: true },
  persistentNegativity: { type: Boolean, default: true },  // Critical alerts
  patternWarnings: { type: Boolean, default: true },
  positiveMilestones: { type: Boolean, default: false },   // Opt-in
  baselineUpdates: { type: Boolean, default: false }       // Opt-in
}
```

### API Endpoints

#### Get Email Preferences
```
GET /api/user/email-preferences
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "enabled": true,
    "journalEntries": true,
    "deviationAlerts": true,
    "emotionSpikes": true,
    "persistentNegativity": true,
    "patternWarnings": true,
    "positiveMilestones": false,
    "baselineUpdates": false
  }
}
```

#### Update Email Preferences
```
PATCH /api/user/email-preferences
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "enabled": true,
  "journalEntries": false,
  "deviationAlerts": true,
  "positiveMilestones": true
}

Response:
{
  "success": true,
  "message": "Email notification preferences updated successfully",
  "data": {
    "enabled": true,
    "journalEntries": false,
    "deviationAlerts": true,
    "emotionSpikes": true,
    "persistentNegativity": true,
    "patternWarnings": true,
    "positiveMilestones": true,
    "baselineUpdates": false
  }
}
```

## Implementation Details

### File Structure
```
backend/
├── mailtrap/
│   ├── emails.js                      # Email templates
│   └── mailtrap.config.js            # Mailtrap configuration
├── utils/
│   ├── emailNotificationHelper.js     # Preference-aware email sending
│   └── notificationTriggers.js       # Notification trigger logic
├── controllers/
│   ├── journal.controller.js         # Journal entry emails
│   └── user.controller.js            # Preference management
├── models/
│   └── user.model.js                 # User preferences schema
└── routes/
    └── user.route.js                 # API routes
```

### Email Templates

All emails follow this structure:
- **Subject**: Clear, concise with emoji indicator
- **Greeting**: Personalized with user's name
- **Alert Details**: Specific information about the trigger
- **Analysis**: Context and interpretation
- **Action Items**: Specific, actionable recommendations
- **Resources**: Crisis resources for critical alerts
- **Signature**: From "Early Mental Health Warning System"

### Email Categories (Mailtrap)
- `journal_activity` - Journal entries
- `mental_health_alert` - All deviation/spike/pattern alerts
- `positive_milestone` - Achievements
- `baseline_update` - Baseline changes

## Usage Examples

### Triggering Emails

Emails are automatically sent when:

1. **Journal Entry Created**
   ```javascript
   // In journal.controller.js
   await sendJournalEntryWithPreferences(userId, {
     title: 'My Journal Entry',
     emotions: { sadness: 0.45, joy: 0.25 },
     analysisDate: '12/1/2025'
   });
   ```

2. **Deviation Detected**
   ```javascript
   // In notificationTriggers.js
   await sendDeviationAlertWithPreferences(userId, {
     emotion: 'sadness',
     currentValue: 0.65,
     baselineValue: 0.30,
     deviationScore: 0.55,
     percentageChange: 1.17,
     severity: 'high'
   });
   ```

3. **Persistent Negativity**
   ```javascript
   await sendPersistentNegativityWithPreferences(userId, {
     negativeEmotions: { sadness: true, anxiety: true },
     consecutiveCount: 5,
     severity: 'critical'
   });
   ```

### Checking Preferences Programmatically

```javascript
import { shouldSendEmailNotification } from './utils/emailNotificationHelper.js';

const user = await User.findById(userId);

if (shouldSendEmailNotification(user, 'deviationAlerts')) {
  // Send email
}
```

## Testing

### Manual Testing

1. Create a journal entry
2. Check Mailtrap inbox for confirmation email
3. Create entries that trigger deviations
4. Verify alert emails are received
5. Update preferences via API
6. Verify emails respect preferences

### Test User Preferences

```bash
# Get current preferences
curl -X GET http://localhost:5000/api/user/email-preferences \
  -H "Authorization: Bearer YOUR_TOKEN"

# Disable journal entry emails
curl -X PATCH http://localhost:5000/api/user/email-preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"journalEntries": false}'

# Enable positive milestones
curl -X PATCH http://localhost:5000/api/user/email-preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"positiveMilestones": true}'
```

## Error Handling

- Email failures don't block core functionality
- All email errors are logged with context
- Critical alerts (persistent negativity) bypass most restrictions
- User operations continue even if email service is down

## Best Practices

1. **Respect User Preferences**: Always check preferences before sending
2. **Critical Safety First**: Persistent negativity emails bypass preferences
3. **Milestone Emails**: Only send baseline updates on milestones (5, 10, 20, 50, 100 entries)
4. **Clear Communication**: Include actionable advice in every email
5. **Crisis Resources**: Always include help resources in critical alerts
6. **Error Resilience**: Don't fail operations due to email errors

## Crisis Resources in Emails

Critical emails include:
- National Crisis Hotline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- IASP: https://www.iasp.info/resources/Crisis_Centres/

## Future Enhancements

Potential improvements:
- [ ] HTML email templates with better formatting
- [ ] Email scheduling/digest options
- [ ] Weekly summary emails
- [ ] Customizable email frequency
- [ ] Email analytics and delivery tracking
- [ ] Localization for different languages
- [ ] Rich text formatting with charts/graphs

## Configuration

Environment variables needed:
```env
MAILTRAP_TOKEN=your_token_here
MAILTRAP_SENDER_EMAIL=your_sender@domain.com
```

## Support

For issues or questions:
1. Check Mailtrap dashboard for delivery status
2. Verify user email preferences in database
3. Check server logs for email errors
4. Ensure environment variables are set correctly
