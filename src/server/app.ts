import express from "express";
import dotenv from "dotenv"; // moved up
dotenv.config(); // ✅ called immediately after import

import authRoutes from "./routes/authRoutes";
import indexRoutes from "./routes/landing";
import loginRoutes from "./routes/login";
import registerRoutes from "./routes/register";
import forgotRoutes from "./routes/forgot";
import lobbyRoutes from "./routes/lobby";
import gameRoomRoutes from "./routes/gameroom";
import logoutRoutes from "./routes/logout";

import path from "path";
import httpErrors from "http-errors";
import { timeMiddleware } from "./middleware/time";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import pool from "./config/db";
import session from "express-session";
import flash from "express-flash";
import passport from "passport";
import initialize from "./config/passportConfig";

const app = express();
initialize(passport);
const PORT = process.env.PORT || 3000;

// logging
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname + "/views/public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret", // ✅ add fallback if missing
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

// EJS template
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Routes
app.use("/", indexRoutes);
app.use("/", loginRoutes);
app.use("/", logoutRoutes);
app.use("/", registerRoutes);
app.use("/", forgotRoutes);
app.use("/", lobbyRoutes);
app.use("/api/auth", authRoutes);
app.use("/", gameRoomRoutes);

// Test route
app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.send(`PostgreSQL time is: ${result.rows[0].now}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Middlewares
app.use((_request, _response, next) => {
  next(httpErrors(404));
});
app.use(timeMiddleware);

export default app;
