import { authenticate, forwardAuthenticated } from "./authentication";
import { Router } from "express";
const router = Router();

// route for login.html
router.get("/lobby", authenticate, (req, res) => {
  const page_name = "Game Lobby";
  res.render("lobby", { page_name });
});

export default router;
