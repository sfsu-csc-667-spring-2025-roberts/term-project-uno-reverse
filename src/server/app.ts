import express from "express";
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
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import pool from "./config/db";
import session from "express-session";
import flash from "express-flash";
import passport from "passport";
import initialize from "./config/passportConfig";

const app = express();
initialize(passport);
const PORT = process.env.PORT || 3000;

// logging library [ morgan ]
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname + "/views/public")));

app.use(
<<<<<<< HEAD
    session({
    secret: 'uno-reverse-hardcoded-secret',
=======
  session({
    secret: process.env.SESSION_SECRET!,
>>>>>>> 4868572 (Add login, registration, and authentication implementations)
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

// using ejs templating engine
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Routes [ *** add your routes here *** ]
app.use("/", indexRoutes); // route for landing page
app.use("/", loginRoutes); // route for login page
app.use("/", logoutRoutes); // route for logout
app.use("/", registerRoutes); // route for registration page
app.use("/", forgotRoutes); // route for forgot page
app.use("/", lobbyRoutes); // route for game lobby
app.use("/api/auth", authRoutes);
app.use("/", gameRoomRoutes); // route for game room

dotenv.config();

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.send(`PostgreSQL time is: ${result.rows[0].now}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// middlewares
app.use((_request, _response, next) => {
  next(httpErrors(404));
});
app.use(timeMiddleware);

export default app;
