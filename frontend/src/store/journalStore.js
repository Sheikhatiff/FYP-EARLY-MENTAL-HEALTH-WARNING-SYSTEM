import { create } from "zustand";

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const USER_API_URL = `${API_BASE_URL}/api/v1/journals`;
axios.defaults.withCredentials = true;

export const useJournalStore = create((set) => ({
  journals: [],
  selectedJournal: null,
  error: null,
  isLoading: false,
  message: null,
  deviation: null,
  getAllJournals: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(USER_API_URL);
      console.log(res.data.data);
      set({ journals: res.data.data, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Error fetching journals",
        isLoading: false,
      });
      throw err;
    }
  },

  getDeviationStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`${USER_API_URL}/deviation`);
      set({ deviation: res.data.deviation, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.error || "Error fetching journals",
        isLoading: false,
      });
      throw err;
    }
  },

  getJournalById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`${USER_API_URL}/${id}`);
      set({ selectedJournal: res.data.data.journal, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Error fetching journal",
        isLoading: false,
      });
      throw err;
    }
  },
  createJournal: async (journalData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(USER_API_URL, journalData);
      set((state) => ({
        journals: [...state.journals, res.data.data.journal],
        message: "Journal created successfully",
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Error creating journal",
        isLoading: false,
      });
      throw err;
    }
  },
  updateJournal: async (id, updatedData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.patch(`${USER_API_URL}/${id}`, updatedData);
      set((state) => ({
        journals: state.journals.map((journal) =>
          journal._id === id ? res.data.data.journal : journal
        ),
        message: "Journal updated successfully",
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Error updating journal",
        isLoading: false,
      });
      throw err;
    }
  },
  deleteJournal: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${USER_API_URL}/${id}`);
      set((state) => ({
        journals: state.journals.filter((journal) => journal._id !== id),
        message: "Journal deleted successfully",
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Error deleting journal",
        isLoading: false,
      });
      throw err;
    }
  },
  clearMessage: () => set({ message: null }),
  clearError: () => set({ error: null }),
}));
