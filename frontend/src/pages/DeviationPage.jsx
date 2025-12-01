import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, TrendingUp, Calendar, Heart, Loader } from 'lucide-react';
import { useJournalStore } from "../store/journalStore";

const EmotionalAnalysisDashboard = ({ isDashboard = true }) => {
  const { deviation : deviationObj , getDeviationStatus, isLoading, error } = useJournalStore();
const deviation = deviationObj?.deviation
  useEffect(() => {
    getDeviationStatus();
  }, [getDeviationStatus]);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-950/30';
      case 'warning':
        return 'border-yellow-500 bg-yellow-950/30';
      case 'info':
        return 'border-emerald-500 bg-emerald-950/30';
      default:
        return 'border-emerald-500 bg-emerald-950/30';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'journaling':
        return '📝';
      case 'meditation':
        return '🧘';
      case 'exercise':
        return '💪';
      case 'social':
        return '👥';
      default:
        return '✨';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`relative w-full ${isDashboard ? "h-full" : "min-h-screen"} flex items-center justify-center`}>
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-emerald-300 text-lg">Loading analysis...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`relative w-full ${isDashboard ? "h-full" : "min-h-screen"} flex items-center justify-center p-4`}>
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-200 text-center">{error}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!deviation) {
    return (
      <div className={`relative w-full ${isDashboard ? "h-full" : "min-h-screen"} flex items-center justify-center p-4`}>
        <div className="bg-emerald-900/30 border border-emerald-500 rounded-xl p-6 max-w-md text-center">
          <Info className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-emerald-200">No analysis data available</p>
        </div>
      </div>
    );
  }

  const response = deviation?.response || {};

  return (
    <div className={`relative w-full ${isDashboard ? "h-full overflow-y-auto" : "min-h-screen overflow-auto"} p-4 sm:p-6 lg:p-8 dashboard-scrollbar`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-emerald-400 animate-pulse" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-100">
              Emotion Tracking
            </h1>
          </div>
          <p className="text-emerald-300/80 text-sm sm:text-base flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(deviation?.timestamp)}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-emerald-900/30 backdrop-blur-sm border border-emerald-700/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/20 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-emerald-100">Analysis Complete</h2>
              <p className="text-emerald-300/70 text-sm capitalize">Status: {deviation?.status || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-emerald-900/20 backdrop-blur-sm border border-emerald-700/40 rounded-xl p-5 lg:p-6 hover:border-emerald-500/60 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-300/80 text-sm lg:text-base">Similarity Score</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl lg:text-4xl font-bold text-emerald-100">
              {deviation?.similarity ? (deviation.similarity * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
          
          <div className="bg-emerald-900/20 backdrop-blur-sm border border-emerald-700/40 rounded-xl p-5 lg:p-6 hover:border-emerald-500/60 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-300/80 text-sm lg:text-base">Deviation Score</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl lg:text-4xl font-bold text-emerald-100">
              {deviation?.deviationScore ? (deviation.deviationScore * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
        </div>

        {/* Summary Card */}
        {response.summary && (
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 backdrop-blur-sm border border-emerald-600/50 rounded-2xl p-6 lg:p-8 shadow-xl">
            <h3 className="text-lg lg:text-xl font-semibold text-emerald-100 mb-3 flex items-center gap-2">
              <span className="text-2xl">💚</span>
              Summary
            </h3>
            <p className="text-emerald-200 leading-relaxed text-base sm:text-lg">
              {response.summary}
            </p>
          </div>
        )}

        {/* Alerts Section */}
        {response.alerts && response.alerts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xl lg:text-2xl font-semibold text-emerald-100 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-emerald-400" />
              Active Alerts
            </h3>
            <div className="space-y-3 lg:space-y-4">
              {response.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`${getPriorityColor(alert.priority)} backdrop-blur-sm border-l-4 rounded-xl p-5 lg:p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-emerald-300 mt-1">
                      {getPriorityIcon(alert.priority)}
                    </div>
                    <div className="flex-1">
                      <p className="text-emerald-100 font-medium mb-1 capitalize text-base lg:text-lg">
                        {alert.type} Alert
                      </p>
                      <p className="text-emerald-200/90 text-sm lg:text-base">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-900/20 backdrop-blur-sm border border-emerald-700/40 rounded-xl p-6 lg:p-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-emerald-200 font-medium text-base lg:text-lg">No alerts at this time</p>
            <p className="text-emerald-300/70 text-sm lg:text-base mt-1">Everything looks good!</p>
          </div>
        )}

        {/* Recommendations Section */}
        {response.recommendations && response.recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xl lg:text-2xl font-semibold text-emerald-100 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              Recommendations
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {response.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`${getPriorityColor(rec.priority)} backdrop-blur-sm border rounded-xl p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{getTypeIcon(rec.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="text-emerald-100 font-semibold capitalize text-lg">
                          {rec.type}
                        </h4>
                        <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full capitalize">
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-emerald-200 leading-relaxed text-sm lg:text-base">{rec.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supportive Note */}
        {response.supportiveNote && (
          <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 backdrop-blur-sm border border-emerald-600/50 rounded-2xl p-6 lg:p-8 shadow-xl text-center">
            <div className="inline-block bg-emerald-500/20 p-3 rounded-full mb-3">
              <Heart className="w-6 h-6 text-emerald-300" />
            </div>
            <p className="text-emerald-100 text-lg lg:text-xl italic">"{response.supportiveNote}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionalAnalysisDashboard;