import express from "express";
import rootRoutes from "./routes/root";
import path from "path";
import httpErrors from "http-errors";
import { timeMiddleware } from "./middleware/time";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3000;

// logging library [ morgan ]
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname + "/views/public")));

// using ejs templating engine
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

app.use("/", rootRoutes);
dotenv.config();

app.listen(PORT, () => { 
    console.log(`Server is running on http://localhost:${PORT}`);
});

// middlewares
app.use((_request, _response, next) => { 
    next(httpErrors(404));
});
app.use(timeMiddleware);

export default app;