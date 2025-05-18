import { authenticate } from "./authentication";
import { Router } from "express";
const router = Router();

// route for profile
router.get("/profile", authenticate, (req, res) => {
  res.render("profile");
});

export default router;
