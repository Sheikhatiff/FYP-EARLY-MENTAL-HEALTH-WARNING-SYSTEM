import agenda from "agenda";
import dotenv from "dotenv";
dotenv.config({ path: "config.env" });

const Agenda = new agenda({
  db: {
    address: process.env.DB_URI.replace(
      "<username>",
      process.env.DB_USER
    ).replace("<password>", process.env.DB_PASS),

    collection: "jobs",
  },
});

// Store io instance for use in job definitions
let io = null;

export const setIO = (ioInstance) => {
  io = ioInstance;
  console.log("[Agenda] ✅ Socket.io instance set successfully");
};

export const getIO = () => {
  if (!io) {
    console.warn("[Agenda] ⚠️ Socket.io instance not available yet");
  }
  return io;
};

export default Agenda;
