/* JournalApp.js */
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import CanvasJSReact from "@canvasjs/react-charts";
import { Trash2 } from "lucide-react";
import { useJournalStore } from "../store/journalStore";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import Header from "../components/Header"; 

const CanvasJS = CanvasJSReact.CanvasJS;
const CanvasJSChart = CanvasJSReact.CanvasJSChart;

/* ---------- CanvasCharts: splineArea + doughnut using emotions ---------- */
const CanvasCharts = ({ emotions = {} }) => {
  const preferredOrder = ["sadness", "anger", "joy"];
  const keys = Object.keys(emotions).length
    ? preferredOrder
        .filter((k) => k in emotions)
        .concat(Object.keys(emotions).filter((k) => !preferredOrder.includes(k)))
    : [];

  const rawKeys = keys.length ? keys : Object.keys(emotions);
  const rawVals = rawKeys.map((k) => emotions[k] ?? 0);
  const total = rawVals.reduce((s, v) => s + v, 0) || 1;
const max = Math.max(...Object.values(emotions))*100 || 100;
  const dataPoints = rawKeys.map((key, i) => ({
    x: i + 1,
    label: key,
    y: +((rawVals[i] / total) * 100).toFixed(2),
  }));

  const splineOptions = {
    theme: "dark2",
    animationEnabled: true,
    exportEnabled: false,
    backgroundColor: "transparent",
    axisY: {
      suffix: "%",
      labelFontColor: "#cbd5e1",
      gridColor: "rgba(255,255,255,0.04)",
      titleFontColor: "#cbd5e1",
      minimum: 0,
      maximum: max>=50?100:50,
      interval: max>=50?20:10,
    },
    axisX: {
      interval: 1,
      labelFontColor: "#cbd5e1",
      labelFormatter: function (e) {
        const idx = e.value - 1;
        return dataPoints[idx] ? dataPoints[idx].label : "";
      },
    },
    toolTip: {
      shared: true,
      borderColor: "rgba(0,0,0,0.6)",
      backgroundColor: "rgba(10,10,10,0.75)",
      fontColor: "#fff",
      contentFormatter: function (e) {
        return e.entries
          .map(
            (entry) =>
              `<div style="padding:6px;color:${entry.dataSeries.color};font-weight:600;">${entry.dataPoint.label}: ${entry.dataPoint.y}%</div>`
          )
          .join("");
      },
    },
    data: [
      {
        type: "splineArea",
        color: "rgba(79, 209, 197, 0.9)",
        markerSize: 6,
        markerColor: "#7AF0C3",
        markerBorderColor: "#0b1220",
        name: "Emotions",
        showInLegend: false,
        dataPoints,
      },
    ],
  };

  const doughnutOptions = {
    theme: "dark2",
    animationEnabled: true,
    exportEnabled: false,
    backgroundColor: "transparent",
    legend: {
      verticalAlign: "bottom",
      horizontalAlign: "center",
      fontColor: "#cbd5e1",
      cursor: "pointer",
    },
    data: [
      {
        type: "doughnut",
        showInLegend: true,
        legendText: "{label}",
        indexLabel: "{label}: {y}%",
        dataPoints,
      },
    ],
  };

  return (
    <div className="w-full flex gap-4 items-stretch">
      <div style={{ flex: "0 0 40%", minHeight: 240 }}>
        <CanvasJSChart options={splineOptions} />
      </div>
      <div style={{ flex: "0 0 60%", minHeight: 240 }}>
        <CanvasJSChart options={doughnutOptions} />
      </div>
    </div>
  );
};

/* ---------- Main JournalApp ---------- */
const JournalApp = ({ isDashboard = true }) => {
  const { journals, getAllJournals, deleteJournal } = useJournalStore();
  const { logout } = useAuthStore();
  const location = useLocation();
  
  // Get entry ID from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const entryIdFromUrl = queryParams.get('entry');
    
    const handleLogout = () => {
      logout();
      toast.success("Logged out successfully!");
    };
  
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [filter, setFilter] = useState("all");
  
    // fetch journals on mount
    useEffect(() => {
      getAllJournals();
    }, [getAllJournals]);

    // Select entry from URL query parameter if provided
    useEffect(() => {
      if (entryIdFromUrl && journals.length > 0) {
        const entry = journals.find(j => j._id === entryIdFromUrl);
        if (entry) {
          setSelectedEntry(entry);
        }
      }
    }, [entryIdFromUrl, journals]);

  const getMostRecent = (arr) => {
    if (!arr || !arr.length) return null;
    const validEntries = arr.filter(entry => entry?.createdAt && !isNaN(new Date(entry.createdAt).getTime()));
    if (validEntries.length === 0) return null;
    return validEntries.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  };

  const computeFiltered = (allEntries, currentFilter) => {
    if (!allEntries || allEntries.length === 0) return [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayInMs = 1000 * 60 * 60 * 24;
    
    const filtered = allEntries.filter((entry) => {
      // Skip entries without createdAt
      if (!entry?.createdAt) {
        console.warn("Entry missing createdAt:", entry);
        return false;
      }
      
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);
      if (isNaN(entryDate.getTime())) {
        console.warn("Invalid date for entry:", entry);
        return false;
      }
      
      const timeDiffMs = now.getTime() - entryDate.getTime();
      const timeDiffDays = timeDiffMs / dayInMs;
      
      switch (currentFilter) {
        case "today":
          return timeDiffDays === 0;
        case "yesterday":
          return timeDiffDays === 1;
        case "week":
          return timeDiffDays > 1 && timeDiffDays <= 7;
        case "month":
          return timeDiffDays > 7 && timeDiffDays <= 30;
        case "year":
          return timeDiffDays > 30 && timeDiffDays <= 365;
        case "all":
        default:
          return true;
      }
    });
    
    console.log(`Filter: ${currentFilter}, Total entries: ${allEntries.length}, Filtered: ${filtered.length}`);
    return filtered;
  };

  useEffect(() => {
    if (!selectedEntry && journals?.length) {
      setSelectedEntry(getMostRecent(journals));
    }
  }, [journals, selectedEntry]);

  useEffect(() => {
    const filtered = computeFiltered(journals, filter);
    if (filtered.length === 0) {
      setSelectedEntry(null);
      return;
    }
    if (!selectedEntry) {
      setSelectedEntry(filtered[0]);
      return;
    }
    const stillVisible = filtered.some((e) => e?._id === selectedEntry?._id);
    if (!stillVisible) {
      setSelectedEntry(filtered[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, journals]);

  const handleDelete = async (entryId) => {
    try {
      await deleteJournal(entryId);
      setSelectedEntry(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filteredEntries = computeFiltered(journals, filter);

  return (
    <div className={`relative w-full flex flex-col ${isDashboard ? "h-full bg-gradient-to-br from-gray-900 via-green-900/30 to-emerald-900/20" : "min-h-screen bg-gradient-to-br from-gray-900 via-green-900/30 to-emerald-900/20"}`}>
      {!isDashboard && <Header logoSrc={"/LOGO-1.svg"} handleLogout={handleLogout} />}

      {/* Main Content */}
      <div className={`flex flex-1 text-gray-100 ${isDashboard ? "overflow-hidden" : "pt-20"}`}>
      {/* Sidebar */}
      <div className={`${isDashboard ? "flex-1 max-w-xs" : "w-80 flex-shrink-0"} bg-gray-800/80 border-r border-green-500/30 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-green-500/30">
          <h1 className="text-green-400 text-3xl font-extrabold">ENTRIES</h1>
        </div>

        {/* Filter Buttons */}
        <div className="p-3 border-b border-green-500/30 flex flex-wrap gap-2 items-center relative z-10 bg-gray-800/80">
          {["all", "today", "yesterday", "week", "month", "year"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1 rounded-lg text-sm capitalize transition ${
                filter === f ? "bg-green-500 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "today"
                ? "Today"
                : f === "yesterday"
                ? "Yesterday"
                : f === "week"
                ? "This Week"
                : f === "month"
                ? "This Month"
                : "This Year"}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto dashboard-scrollbar">
          {filteredEntries.map((entry) => (
            <div
              key={entry?._id}
              onClick={() => setSelectedEntry(entry)}
              className={`p-3 cursor-pointer border-b border-green-500/20 hover:bg-green-500/10 transition ${
                selectedEntry?._id === entry?._id ? "bg-green-500/20" : ""
              }`}
            >
              <p className="text-green-400 font-semibold">{entry?.title}</p>
              <p className="text-gray-500 text-xs">{new Date(entry?.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 p-6 flex justify-center overflow-auto dashboard-scrollbar">
        {selectedEntry ? (
          <div className="flex flex-col h-full w-full max-w-[1200px]">
            <div className="mb-3 border-b border-green-500/30 pb-2">
              <h2 className="text-green-400 text-3xl font-extrabold">{selectedEntry?.title}</h2>
              <p className="text-gray-400 text-sm">{new Date(selectedEntry?.createdAt).toLocaleDateString()}</p>
            </div>

            {/* ENTRY CARD */}
            <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-green-500/30 rounded-2xl p-5 shadow-xl flex-1 flex flex-col min-h-0">
              {/* SCROLLABLE CONTENT (this gets the scrollbar) */}
              <div className="flex-1 overflow-y-auto pr-4 dashboard-scrollbar">
                {/* Text content */}
                <div className="px-1">
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap mb-6">{selectedEntry?.content}</p>

                  <div className="mt-3 text-gray-400 text-sm mb-10">
                    <p>Word count: {selectedEntry?.content.split(/\s+/).length}</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="w-full border-t border-green-500/20 mt-4 pt-4">
                  <div className="w-full h-[320px] flex items-stretch justify-center">
                    <div className="w-full max-w-[1100px] h-full px-3 pb-10">
                      <CanvasCharts emotions={selectedEntry?.analysis} />
                    </div>
                  </div>
                </div>
              </div>

              {/* BUTTON FOOTER: outside the scroll area so it's never under the scrollbar */}
              <div className="flex-none flex justify-end pt-4">
                <button
                  onClick={() => handleDelete(selectedEntry?._id)}
                  className="p-2 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition bg-transparent mr-2"
                  aria-label="Delete entry"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Entries Found</h3>
            <p className="text-gray-400 text-sm">
              {filter === "today" && "No entries for today yet. Start writing!"}
              {filter === "yesterday" && "No entries for yesterday."}
              {filter === "week" && "No entries from this week."}
              {filter === "month" && "No entries from this month."}
              {filter === "year" && "No entries from this year."}
              {filter === "all" && "No journal entries yet. Start writing!"}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">Select a journal entry from the left</div>
        )}
      </div>
      </div>
    </div>
  );
};

export default JournalApp;
