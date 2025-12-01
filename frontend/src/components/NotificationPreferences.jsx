import React, { useState } from "react";
import { Bell, Volume2, Vibrate, Eye } from "lucide-react";
import toast from "react-hot-toast";

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    deviationAlerts: true,
    spikeWarnings: true,
    positiveMilestones: true,
    riskAlerts: true,
    patternWarnings: true,
    baselineUpdates: false,
    sound: true,
    vibration: true,
    showInCenter: true,
    emailNotifications: false,
    criticalOnly: false,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNestedToggle = (parent, key) => {
    setPreferences((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: !prev[parent][key],
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to backend (when ready)
      // await updateNotificationPreferences(preferences);
      toast.success("Notification preferences saved");
      console.log("Saved preferences:", preferences);
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                Notification Preferences
              </h2>
              <p className="text-emerald-100 text-sm">
                Customize how you receive notifications
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Notification Types */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-500" />
              Notification Types
            </h3>
            <div className="space-y-3">
              {[
                {
                  key: "deviationAlerts",
                  label: "Deviation Alerts",
                  description:
                    "When your emotions deviate from baseline",
                },
                {
                  key: "spikeWarnings",
                  label: "Spike Warnings",
                  description: "When there are sudden emotional spikes",
                },
                {
                  key: "riskAlerts",
                  label: "Risk Alerts",
                  description: "Critical mental health warnings",
                },
                {
                  key: "patternWarnings",
                  label: "Pattern Warnings",
                  description: "Unusual patterns detected",
                },
                {
                  key: "positiveMilestones",
                  label: "Positive Milestones",
                  description: "Celebrate your achievements",
                },
                {
                  key: "baselineUpdates",
                  label: "Baseline Updates",
                  description: "When your baseline is updated",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={preferences[item.key]}
                    onChange={() => handleToggle(item.key)}
                    className="mt-1 w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Delivery Methods */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-emerald-500" />
              Delivery Methods
            </h3>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sound}
                  onChange={() => handleToggle("sound")}
                  className="w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <span className="ml-3 font-medium text-gray-900 dark:text-white">
                  🔔 Sound Notifications
                </span>
              </label>

              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.vibration}
                  onChange={() => handleToggle("vibration")}
                  className="w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <span className="ml-3 font-medium text-gray-900 dark:text-white">
                  📳 Vibration
                </span>
              </label>

              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.showInCenter}
                  onChange={() => handleToggle("showInCenter")}
                  className="w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <span className="ml-3 font-medium text-gray-900 dark:text-white">
                  <Eye className="w-4 h-4 inline mr-1" />
                  Show in Notification Center
                </span>
              </label>

              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={() => handleToggle("emailNotifications")}
                  className="w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <span className="ml-3 font-medium text-gray-900 dark:text-white">
                  📧 Email Notifications
                </span>
              </label>
            </div>
          </section>

          {/* Advanced Options */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ⚙️ Advanced Options
            </h3>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.criticalOnly}
                  onChange={() => handleToggle("criticalOnly")}
                  className="w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <span className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Critical Notifications Only
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Only receive critical and high severity alerts
                  </p>
                </span>
              </label>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <label className="flex items-center cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={preferences.quietHours.enabled}
                    onChange={() =>
                      handleNestedToggle("quietHours", "enabled")
                    }
                    className="w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="ml-3 font-medium text-gray-900 dark:text-white">
                    🌙 Quiet Hours
                  </span>
                </label>

                {preferences.quietHours.enabled && (
                  <div className="ml-8 space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        Start:
                      </label>
                      <input
                        type="time"
                        value={preferences.quietHours.start}
                        onChange={(e) => {
                          setPreferences((prev) => ({
                            ...prev,
                            quietHours: {
                              ...prev.quietHours,
                              start: e.target.value,
                            },
                          }));
                        }}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        End:
                      </label>
                      <input
                        type="time"
                        value={preferences.quietHours.end}
                        onChange={(e) => {
                          setPreferences((prev) => ({
                            ...prev,
                            quietHours: {
                              ...prev.quietHours,
                              end: e.target.value,
                            },
                          }));
                        }}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button className="px-6 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
