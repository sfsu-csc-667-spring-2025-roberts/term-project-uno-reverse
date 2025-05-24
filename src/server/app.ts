import express from "express";
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import http from "http";
import { Server } from "socket.io";

import morgan from "morgan";
import session from "express-session";
import flash from "express-flash";
import passport from "passport";
import cookieParser from "cookie-parser";

import pool from "./config/db";
import initialize from "./config/passportConfig";
import { timeMiddleware } from "./middleware/time";
import { registerGameHandlers } from "./socketHandlers/gameHandlers";

// Route imports
import authRoutes from "./routes/authRoutes";
import indexRoutes from "./routes/landing";
import loginRoutes from "./routes/login";
import registerRoutes from "./routes/register";
import forgotRoutes from "./routes/forgot";
import logoutRoutes from "./routes/logout";
import lobbyRoutes from "./routes/lobby";
import gameRoomRoutes from "./routes/gameroom";
import profileRoutes from "./routes/profile";
import gameRoutes from "./routes/gameRoutes";

const app = express();
initialize(passport);
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "views", "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Route handlers
app.use("/", indexRoutes);
app.use("/", loginRoutes);
app.use("/", logoutRoutes);
app.use("/", registerRoutes);
app.use("/", forgotRoutes);
app.use("/", lobbyRoutes);
app.use("/", gameRoomRoutes);
app.use("/api/auth", authRoutes);
app.use("/", profileRoutes);
app.use("/", gameRoutes);

// Test connection to DB
app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.send(`PostgreSQL time is: ${result.rows[0].now}`);
});

// WebSocket setup
const httpServer = http.createServer(app);
const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log("✅ A user connected");

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`🟢 User joined room: ${roomId}`);
  });

  socket.on("chat-message", ({ roomId, message, sender }) => {
    io.to(roomId).emit("chat-message", {
      message,
      sender,
      timestamp: Date.now(),
    });
  });

  registerGameHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected");
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

app.use(timeMiddleware);

export default app;
