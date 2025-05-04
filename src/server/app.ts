import express from "express";
import authRoutes from './routes/authRoutes';
import indexRoutes from './routes/landing';
import loginRoutes from './routes/login';
import registerRoutes from './routes/register';
import forgotRoutes from './routes/forgot';
import lobbyRoutes from './routes/lobby';
import gameRoomRoutes from './routes/gameroom';
import path from "path";
import httpErrors from "http-errors";
import { timeMiddleware } from "./middleware/time";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import pool from "./config/db";
import session from 'express-session';

const app = express();
const PORT = process.env.PORT || 3000;


// logging library [ morgan ]
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname + "/views/public")));

app.use(
    session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  })
);

// using ejs templating engine
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Routes [ *** add your routes here *** ]
app.use("/", indexRoutes);          // route for landing page
app.use('/', loginRoutes);          // route for login page
app.use('/', registerRoutes);       // route for registration page
app.use('/', forgotRoutes);         // route for forgot page
app.use('/', lobbyRoutes);          // route for game lobby
app.use("/api/auth", authRoutes);  
app.use('/', gameRoomRoutes);          // route for game room

dotenv.config();      

app.get('/', async (req, res) => {
  const result = await pool.query('SELECT NOW()');
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