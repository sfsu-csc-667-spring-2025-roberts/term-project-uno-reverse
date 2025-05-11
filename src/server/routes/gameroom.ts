import { authenticate } from "./authentication";
import { Router } from "express";
const router = Router();

// route for gameroom.html
router.get("/gameroom", authenticate, (req, res) => {
  const page_name = "Game Room";
  res.render("gameroom", { page_name });
});

export default router;
