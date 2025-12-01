import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, Heart, Zap, Sparkles, Activity } from 'lucide-react';
import { useJournalStore } from '../store/journalStore';

/**
 * Production-Grade Mood Visualization
 * 
 * Enterprise-level mood analytics with sophisticated animations,
 * interactive elements, and creative data visualization inspired by
 * leading SF tech companies like Figma, Stripe, and Notion.
 */

// Animated emotion ring component for radial visualization with CSS animations
const EmotionRing = ({ emotions }) => { 
  // Safety check for empty or invalid emotions
  if (!emotions || !Array.isArray(emotions) || emotions.length === 0) {
    return (
      <svg viewBox="0 0 400 400" className="w-full h-full max-w-md mx-auto">
        <circle cx="200" cy="200" r="180" fill="rgba(16, 185, 129, 0.03)" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
        <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" />
        <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="2" />
        <text x="200" y="200" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="14">No emotions detected</text>
      </svg>
    );
  }

  // Comprehensive data validation and enrichment
  const enrichedEmotions = emotions.slice(0, 12)
    .map((emotion, idx) => {
      // Validate emotion object structure
      if (!emotion || typeof emotion !== 'object') {
        console.warn('Invalid emotion object:', emotion);
        return null;
      }

      const hues = [0, 30, 60, 120, 180, 240, 270, 300, 15, 45, 75, 150];
      const score = Number(emotion?.score);
      
      // Strict validation - reject invalid scores
      if (isNaN(score) || score < 0 || score > 1) {
        console.warn('Invalid emotion score:', emotion);
        return null;
      }

      return { 
        ...emotion, 
        hue: hues[idx % hues.length],
        name: String(emotion.name || `emotion-${idx}`),
        score: Math.max(0, Math.min(1, score)) // Clamp between 0 and 1
      };
    })
    .filter(e => e !== null); // Remove invalid emotions

  // If all emotions were filtered out, show empty state
  if (enrichedEmotions.length === 0) {
    return (
      <svg viewBox="0 0 400 400" className="w-full h-full max-w-md mx-auto">
        <circle cx="200" cy="200" r="180" fill="rgba(16, 185, 129, 0.03)" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
        <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" />
        <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="2" />
        <text x="200" y="200" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="14">Invalid emotion data</text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-full max-w-md mx-auto"
      style={{ filter: 'drop-shadow(0 0 30px rgba(16, 185, 129, 0.15))' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { r: var(--size); opacity: var(--opacity); }
          50% { r: calc(var(--size) + 12); opacity: calc(var(--opacity) * 0.5); }
        }
        .emotion-dot { animation: scaleIn 0.8s ease-out forwards; transform-origin: center; }
        .emotion-glow { animation: scaleIn 0.6s ease-out forwards; transform-origin: center; }
        .emotion-label { animation: fadeIn 0.8s ease-out forwards; }
      `}</style>

      {/* Background rings */}
      <circle cx="200" cy="200" r="180" fill="rgba(16, 185, 129, 0.03)" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
      <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" />
      <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="2" />

      {/* Animated emotion points */}
      {enrichedEmotions.map((emotion, idx) => {
        // Triple-validated calculations
        const score = emotion.score; // Already validated in enrichment
        const angle = (idx / enrichedEmotions.length) * Math.PI * 2 - Math.PI / 2;
        const baseRadius = 100;
        const radius = baseRadius + score * 70;
        
        // Calculate positions with guaranteed numeric values
        const x = Number((200 + Math.cos(angle) * radius).toFixed(2));
        const y = Number((200 + Math.sin(angle) * radius).toFixed(2));
        const size = Number(Math.max(6, score * 35).toFixed(2));
        const outerSize = Number((size * 1.2).toFixed(2));
        const hue = emotion.hue; // Already validated
        const opacity = Number(Math.min(1, 0.15 + score * 0.35).toFixed(2));
        const pulseOpacity = Number((score * 0.6).toFixed(2));

        // Final safety check - should never trigger with new validation
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(size)) {
          console.error('Critical: NaN detected after validation', { emotion, x, y, size });
          return null;
        }

        return (
          <g key={`${emotion.name}-${idx}`}>
            {/* Connecting line */}
            <line
              x1={200}
              y1={200}
              x2={x}
              y2={y}
              stroke={`hsl(${hue}, 70%, 50%)`}
              strokeWidth={2}
              opacity={opacity}
              strokeDasharray="300"
              strokeDashoffset="0"
              style={{
                animation: `fadeIn 1.2s ease-out ${idx * 0.04}s forwards`
              }}
            />

            {/* Emotion dot with glow */}
            <g>
              <circle
                className="emotion-glow"
                cx={x}
                cy={y}
                r={outerSize}
                fill={`hsl(${hue}, 70%, 50%)`}
                opacity={0.2}
                style={{ animationDelay: `${idx * 0.05}s` }}
              />
              <circle
                className="emotion-dot"
                cx={x}
                cy={y}
                r={size}
                fill={`hsl(${hue}, 70%, 50%)`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              />
            </g>

            {/* Pulsing ring */}
            {score > 0.05 && (
              <circle
                cx={x}
                cy={y}
                r={size}
                fill="none"
                stroke={`hsl(${hue}, 70%, 50%)`}
                strokeWidth={1.5}
                opacity={pulseOpacity}
                style={{
                  animation: `pulse 2s ease-in-out ${idx * 0.08}s infinite`,
                  '--size': `${size}`,
                  '--opacity': pulseOpacity
                }}
              />
            )}

            {/* Label */}
            {score > 0.08 && (
              <text
                className="emotion-label"
                x={x}
                y={y + size + 20}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill={`hsl(${hue}, 70%, 50%)`}
                opacity={0.8}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                {emotion.name.substring(0, 5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// Mood spectrum bar - positive/neutral/challenging
const MoodSpectrumBar = ({ positive, negative, neutral }) => {
  // Ensure all values are numbers and prevent division by zero
  const safePositive = Math.max(0, Number(positive) || 0);
  const safeNegative = Math.max(0, Number(negative) || 0);
  const safeNeutral = Math.max(0, Number(neutral) || 0);
  
  const total = Math.max(safePositive + safeNegative + safeNeutral, 0.001);
  const posPercent = (safePositive / total) * 100;
  const negPercent = (safeNegative / total) * 100;
  const neuPercent = (safeNeutral / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-700/50 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${posPercent}%` }}
          transition={{ duration: 1.2, delay: 0.1 }}
          className="bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${neuPercent}%` }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="bg-gradient-to-r from-gray-500 to-gray-600"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${negPercent}%` }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600"
        />
      </div>
      <div className="flex justify-between text-xs font-medium text-gray-300 px-1">
        <span className="text-emerald-400">{posPercent.toFixed(0)}% Positive</span>
        <span className="text-gray-400">{neuPercent.toFixed(0)}% Neutral</span>
        <span className="text-red-400">{negPercent.toFixed(0)}% Challenging</span>
      </div>
    </div>
  );
};

const MoodVisualization = () => {
  const { deviation: deviationObj, getDeviationStatus, isLoading } = useJournalStore();

  useEffect(() => {
    getDeviationStatus();
  }, [getDeviationStatus]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <motion.div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            className="flex justify-center"
          >
            <Heart className="w-16 h-16 text-emerald-400" />
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-emerald-300 font-light text-lg tracking-wide"
          >
            Analyzing your emotional patterns...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!deviationObj) {
    return (
      <div className="w-full max-w-7xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 border border-emerald-500/25 rounded-2xl p-20 text-center backdrop-blur-md"
        >
          <Sparkles className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
          <p className="text-emerald-100 text-2xl font-semibold mb-3">No mood data available yet</p>
          <p className="text-emerald-400/70 text-base">Write your first journal entry to unlock your mood analytics dashboard</p>
        </motion.div>
      </div>
    );
  }

  // Extract data from full object structure with safety checks
  const emotions = deviationObj?.emotions || {};
  const deviation = deviationObj?.deviation || {};
  const response = deviation?.response || {};
  const alerts = response?.alerts || [];
  const summary = response?.summary || '';
  const recommendations = response?.recommendations || [];
  const supportiveNote = response?.supportiveNote || '';
  const updatedAt = deviationObj?.updatedAt;
  
  // Extract emotions from full object (not nested in response)
  const emotionsObj = emotions;

  // Advanced emotion analysis with comprehensive validation
  const analyzeEmotions = () => {
    // Validate emotionsObj is a proper object
    if (!emotionsObj || typeof emotionsObj !== 'object' || Array.isArray(emotionsObj)) {
      console.warn('Invalid emotions object:', emotionsObj);
      return {
        topEmotion: { name: 'neutral', score: 0 },
        topFive: [],
        allEmotions: [],
        positive: 0,
        negative: 0,
        neutral: 0,
        total: 0,
        valence: 0,
      };
    }

    // Filter out non-emotion properties like _id, userId, updatedAt, etc.
    const emotionsList = Object.entries(emotionsObj)
      .filter(([name, score]) => {
        // Exclude metadata fields
        const excludeFields = ['_id', 'id', 'userId', 'createdAt', 'updatedAt', '__v'];
        if (excludeFields.includes(name)) return false;
        
        // Validate score is a valid number
        const numScore = Number(score);
        if (!Number.isFinite(numScore) || numScore < 0 || numScore > 1) {
          console.warn(`Invalid score for ${name}:`, score);
          return false;
        }
        
        return true;
      })
      .map(([name, score]) => ({ 
        name: String(name).trim(), 
        score: Math.max(0, Math.min(1, Number(score))) // Clamp between 0 and 1
      }))
      .filter(e => e.score > 0 && e.name) // Only include emotions with positive scores and valid names
      .sort((a, b) => b.score - a.score);

    // If no valid emotions, return empty state
    if (emotionsList.length === 0) {
      return {
        topEmotion: { name: 'neutral', score: 0 },
        topFive: [],
        allEmotions: [],
        positive: 0,
        negative: 0,
        neutral: 0,
        total: 0,
        valence: 0,
      };
    }

    const positiveEmotions = ['joy', 'relief', 'amusement', 'excitement', 'approval', 'caring', 'admiration', 'pride', 'realization', 'optimism', 'desire', 'gratitude', 'love'];
    const negativeEmotions = ['grief', 'sadness', 'fear', 'embarrassment', 'nervousness', 'annoyance', 'disgust', 'confusion', 'disappointment', 'anger', 'disapproval', 'remorse', 'sorrow'];

    const positive = emotionsList
      .filter(e => positiveEmotions.includes(e.name.toLowerCase()))
      .reduce((sum, e) => sum + e.score, 0);

    const negative = emotionsList
      .filter(e => negativeEmotions.includes(e.name.toLowerCase()))
      .reduce((sum, e) => sum + e.score, 0);

    const neutral = emotionsList
      .filter(e => !positiveEmotions.includes(e.name.toLowerCase()) && !negativeEmotions.includes(e.name.toLowerCase()))
      .reduce((sum, e) => sum + e.score, 0);

    return {
      topEmotion: emotionsList[0] || { name: 'neutral', score: 0 },
      topFive: emotionsList.slice(0, 5),
      allEmotions: emotionsList,
      positive,
      negative,
      neutral,
      total: emotionsList.reduce((sum, e) => sum + e.score, 0),
      valence: positive - negative,
    };
  };

  const emotionData = analyzeEmotions();
  const topEmotion = emotionData.topEmotion;

  // Emotion emoji mapping with extended palette
  const emotionToEmoji = {
    joy: { emoji: '😊', label: 'Joyful', color: 'from-yellow-400 to-orange-500' },
    relief: { emoji: '😌', label: 'Relief', color: 'from-green-400 to-emerald-500' },
    amusement: { emoji: '😄', label: 'Amused', color: 'from-yellow-300 to-yellow-500' },
    excitement: { emoji: '🤩', label: 'Excited', color: 'from-pink-400 to-orange-500' },
    optimism: { emoji: '✨', label: 'Optimistic', color: 'from-green-400 to-teal-500' },
    sadness: { emoji: '😢', label: 'Sad', color: 'from-blue-400 to-indigo-600' },
    fear: { emoji: '😨', label: 'Afraid', color: 'from-purple-400 to-red-600' },
    anger: { emoji: '😠', label: 'Angry', color: 'from-red-500 to-orange-600' },
    confusion: { emoji: '😕', label: 'Confused', color: 'from-gray-400 to-purple-500' },
    anxiety: { emoji: '😰', label: 'Anxious', color: 'from-purple-400 to-pink-500' },
    disappointment: { emoji: '😔', label: 'Disappointed', color: 'from-gray-400 to-blue-500' },
    disgust: { emoji: '🤮', label: 'Disgusted', color: 'from-green-600 to-emerald-700' },
    pride: { emoji: '😌', label: 'Proud', color: 'from-amber-400 to-yellow-500' },
    love: { emoji: '💕', label: 'Loving', color: 'from-red-400 to-pink-500' },
    gratitude: { emoji: '🙏', label: 'Grateful', color: 'from-amber-400 to-yellow-500' },
    approval: { emoji: '👍', label: 'Approved', color: 'from-green-400 to-emerald-500' },
    caring: { emoji: '🤗', label: 'Caring', color: 'from-pink-400 to-rose-500' },
    admiration: { emoji: '🌟', label: 'Admiring', color: 'from-yellow-400 to-amber-600' },
    desire: { emoji: '✨', label: 'Desirous', color: 'from-rose-400 to-pink-600' },
    surprise: { emoji: '😲', label: 'Surprised', color: 'from-blue-400 to-cyan-500' },
    neutral: { emoji: '😐', label: 'Neutral', color: 'from-gray-400 to-gray-600' },
  };

  const topEmojiData = emotionToEmoji[topEmotion.name.toLowerCase()] || emotionToEmoji.neutral;
  const alertSeverity = alerts?.length === 0 ? 'none' : alerts.some(a => a.priority === 'critical') ? 'critical' : alerts.some(a => a.priority === 'warning') ? 'warning' : 'info';

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-2 mb-12"
        >
          <h1 className="text-5xl font-bold text-white flex items-center justify-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="w-12 h-12 text-emerald-400" />
            </motion.div>
            Mood Visualization
          </h1>
          <p className="text-gray-400 text-lg font-light">Real-time emotional intelligence analysis</p>
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Emotion Ring Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-2 bg-gray-800/60 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl"
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Emotional Spectrum</h2>
                <p className="text-gray-400 text-sm">Interactive ring shows emotion intensity • Bar below shows positive/neutral/challenging balance</p>
              </div>
              <div className="relative h-80">
                <EmotionRing emotions={emotionData.allEmotions} />
              </div>

              {/* Mood Spectrum Bar */}
              <div className="pt-4 border-t border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Emotional Polarity</h3>
                <MoodSpectrumBar
                  positive={emotionData.positive}
                  negative={emotionData.negative}
                  neutral={emotionData.neutral}
                />
              </div>
            </div>
          </motion.div>

          {/* Right: Primary Emotion Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            {/* Top Emotion - Large Card */}
            <div className={`bg-gradient-to-br ${topEmojiData.color} bg-opacity-5 border border-emerald-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-xl`}>
              <div className="text-center space-y-4">
                <motion.div
                  animate={{
                    y: emotionData.valence > 0 ? [0, -8, 0] : [0, 4, 0],
                    rotate: emotionData.valence < 0 ? [-1, 1, -1] : 0,
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="text-6xl"
                >
                  {topEmojiData.emoji}
                </motion.div>

                <div>
                  <p className="text-gray-400 text-sm font-semibold mb-1 uppercase tracking-wide">Primary Emotion</p>
                  <h3 className="text-3xl font-bold text-white">{topEmojiData.label}</h3>
                </div>

                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">{topEmotion.name.charAt(0).toUpperCase() + topEmotion.name.slice(1)}</p>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                    className="h-1 bg-gray-700/50 rounded-full overflow-hidden"
                  >
                    <motion.div
                      animate={{
                        width: `${(topEmotion.score * 100) || 0}%`,
                      }}
                      transition={{ duration: 1.2, delay: 0.5 }}
                      className={`h-full bg-gradient-to-r ${topEmojiData.color} rounded-full`}
                    />
                  </motion.div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Intensity</span>
                    <span className="text-white font-bold">{((topEmotion.score * 100) || 0).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deviation Score Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-gray-800/60 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm font-semibold uppercase">Deviation Score</span>
              </div>
              <p className="text-3xl font-bold text-white mb-2">{((deviation.deviationScore * 100) || 0).toFixed(1)}%</p>
              <p className="text-xs text-gray-500">
                {deviation.deviationScore > 0.5
                  ? '🔴 Significant change detected'
                  : deviation.deviationScore > 0.3
                  ? '🟡 Moderate variation'
                  : '🟢 Within baseline'}
              </p>
            </motion.div>

            {/* Similarity Score Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-gray-800/60 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-400 text-sm font-semibold uppercase">Baseline Match</span>
              </div>
              <p className="text-3xl font-bold text-white mb-2">{((deviation.similarity * 100) || 0).toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Pattern similarity to your baseline</p>
            </motion.div>

            {/* Status Indicator */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className={`rounded-2xl p-6 backdrop-blur-xl border ${
                alertSeverity === 'critical'
                  ? 'bg-red-500/10 border-red-500/30'
                  : alertSeverity === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-green-500/10 border-green-500/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    alertSeverity === 'critical'
                      ? 'bg-red-500 animate-pulse'
                      : alertSeverity === 'warning'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-green-500'
                  }`}
                />
                <span className={`text-sm font-bold uppercase tracking-wide ${
                  alertSeverity === 'critical'
                    ? 'text-red-400'
                    : alertSeverity === 'warning'
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }`}>
                  {alertSeverity === 'critical' ? 'Critical' : alertSeverity === 'warning' ? 'Warning' : 'Stable'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {alertSeverity === 'critical'
                  ? 'Immediate attention recommended'
                  : alertSeverity === 'warning'
                  ? 'Potential concerns detected'
                  : 'All systems normal'}
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Alerts Section */}
        {alerts && Array.isArray(alerts) && alerts?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="space-y-3"
          >
            {alerts.map((alert, idx) => {
              // Handle both nested object structure and string values
              const alertData = typeof alert === 'object' && alert !== null ? alert : {};
              const alertType = alertData.type || 'Alert';
              const alertMessage = alertData.message || '';
              const alertPriority = alertData.priority || 'info';

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className={`rounded-xl p-4 border backdrop-blur-xl ${
                    alertPriority === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : alertPriority === 'warning'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      {alertPriority === 'critical' ? '🚨' : alertPriority === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm mb-1 ${
                        alertPriority === 'critical'
                          ? 'text-red-300'
                          : alertPriority === 'warning'
                          ? 'text-yellow-300'
                          : 'text-blue-300'
                      }`}>
                        {alertType}
                      </p>
                      {alertMessage && (
                        <p className="text-xs text-gray-300">{alertMessage}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Insights Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-gray-800/60 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl"
        >
          {/* Supportive Note & Summary */}
          {(summary || supportiveNote) && (
            <div className="mb-8 pb-8 border-b border-gray-700/50">
              {summary && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4"
                >
                  <p className="text-blue-200 text-sm leading-relaxed italic">"{summary}"</p>
                </motion.div>
              )}
              {supportiveNote && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.75 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"
                >
                  <p className="text-emerald-200 text-sm leading-relaxed">💚 {supportiveNote}</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {recommendations && Array.isArray(recommendations) && recommendations?.length > 0 && (
            <div className="mb-8 pb-8 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">💡 Recommendations</h3>
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((rec, idx) => {
                  // Handle both string and object recommendations
                  const recText = typeof rec === 'string' ? rec : typeof rec === 'object' && rec?.text ? rec.text : typeof rec === 'object' && rec?.message ? rec.message : String(rec || '');
                  
                  return recText ? (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + idx * 0.05 }}
                      className="bg-gray-700/30 border border-amber-500/20 rounded-lg p-3 text-sm text-gray-300"
                    >
                      <span className="text-amber-400 font-semibold">→</span> {recText}
                    </motion.div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Positive Emotions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Positive Emotions
              </h3>
              <div className="space-y-2">
                {emotionData.topFive
                  .filter(e => ['joy', 'relief', 'amusement', 'excitement', 'optimism', 'pride', 'love', 'gratitude', 'approval', 'caring', 'admiration', 'desire'].includes(e.name.toLowerCase()))
                  .slice(0, 3)
                  .map(emotion => (
                    <div key={emotion.name} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300 capitalize">{emotion.name}</span>
                        <span className="text-emerald-400 font-semibold">{(emotion.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${emotion.score * 100}%` }}
                          transition={{ duration: 1, delay: 0.7 }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Neutral Emotions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-400 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Neutral Emotions
              </h3>
              <div className="space-y-2">
                {emotionData.allEmotions
                  .filter(e => !['joy', 'relief', 'amusement', 'excitement', 'optimism', 'pride', 'love', 'gratitude', 'approval', 'caring', 'admiration', 'desire', 'sadness', 'fear', 'anger', 'disappointment', 'disgust', 'anxiety', 'remorse', 'embarrassment', 'nervousness', 'surprise', 'confusion', 'disapproval', 'grief'].includes(e.name.toLowerCase()))
                  .slice(0, 3)
                  .map(emotion => (
                    <div key={emotion.name} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300 capitalize">{emotion.name}</span>
                        <span className="text-gray-400 font-semibold">{(emotion.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${emotion.score * 100}%` }}
                          transition={{ duration: 1, delay: 0.8 }}
                          className="h-full bg-gradient-to-r from-gray-500 to-gray-600"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Challenging Emotions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Challenging Emotions
              </h3>
              <div className="space-y-2">
                {emotionData.allEmotions
                  .filter(e => ['sadness', 'fear', 'anger', 'disappointment', 'disgust', 'anxiety', 'remorse', 'embarrassment', 'nervousness', 'surprise', 'confusion', 'disapproval', 'grief'].includes(e.name.toLowerCase()))
                  .slice(0, 3)
                  .map(emotion => (
                    <div key={emotion.name} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300 capitalize">{emotion.name}</span>
                        <span className="text-orange-400 font-semibold">{(emotion.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${emotion.score * 100}%` }}
                          transition={{ duration: 1, delay: 0.9 }}
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* All Emotions Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-8 backdrop-blur-xl"
        >
          <h3 className="text-xl font-bold text-white mb-6">All Emotions ({emotionData.allEmotions?.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {emotionData.allEmotions.map(emotion => (
              <motion.div
                key={emotion.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-3 text-center hover:border-emerald-500/50 transition-colors"
              >
                <p className="text-xs font-semibold text-gray-300 capitalize mb-1">{emotion.name}</p>
                <p className="text-lg font-bold text-emerald-400">{(emotion.score * 100).toFixed(0)}%</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Metadata Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-between text-xs text-gray-500 pt-8 border-t border-gray-700/30"
        >
          <span>Analysis Date: {updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A'}</span>
          <span>Status: {deviation?.status || 'Analyzed'}</span>
        </motion.div>
      </div>
    </div>
  );
};

export default MoodVisualization;
