import express from "express";
import path from "path";

const router = express.Router();
const rootDir = path.join(__dirname, "..");

router.get("/", (_request, response) => {
    response.sendFile(path.join(rootDir, "views", "index.html"));
});

export default router;