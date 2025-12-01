import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDB } from "./db/dbConfig.js";
import AuthRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import UserRouter from "./routes/user.route.js";
import journalRouter from "./routes/journal.route.js";
import modelRouter from "./routes/model.routes.js";
import notificationRouter from "./routes/notification.route.js";
import supportChatRouter from "./routes/supportChat.route.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { setIO } from "./utils/agenda.js";

dotenv.config({ path: "config.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || "development";
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { 
    origin: "http://localhost:5173",
    credentials: true 
  },
});

// Set io instance for Agenda jobs to use
setIO(io);

app.use("/img/users", express.static(path.join(__dirname, "public/img/users")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ 
  origin: "http://localhost:5173",
  credentials: true 
}));

app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/users", UserRouter);
app.use("/api/v1/journals", journalRouter);
app.use("/api/v1/model", modelRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/support-chat", supportChatRouter);

// Make io accessible to routes
app.set("io", io);

// Socket.io connection handling
const userSockets = new Map(); // Map userId to socket IDs

// Make userSockets accessible globally
app.set("userSockets", userSockets);

io.on("connection", (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  // User joins their personal room
  socket.on("user:join", (userId) => {
    const key = userId.toString();
    if (!userSockets.has(key)) {
      userSockets.set(key, []);
    }
    userSockets.get(key).push(socket.id);
    socket.join(`user:${key}`);
    console.log(`[Socket] User ${userId} joined room`);

    // Emit user online event to all connected clients
    io.emit("user:online", { userId, isOnline: true });
  });

  // User is typing in support chat
  socket.on("support:typing", (data) => {
    socket.broadcast.emit("support:user:typing", data);
  });

  // User stopped typing
  socket.on("support:stop-typing", (data) => {
    socket.broadcast.emit("support:user:stop-typing", data);
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    for (const [userId, socketIds] of userSockets.entries()) {
      const index = socketIds.indexOf(socket.id);
      if (index > -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          userSockets.delete(userId);
          // Emit user offline event to all connected clients
          io.emit("user:offline", { userId, isOnline: false });
        }
        console.log(`[Socket] User ${userId} disconnected`);
        break;
      }
    }
  });
});

app.get("/", (_, res) => {
  res.send(`Hello, World! Running in ${ENV} mode.`);
});

httpServer.listen(PORT, () => {
  console.log(`Server is running in ${ENV} mode on http://localhost:${PORT}/`);
  connectToDB();
});
