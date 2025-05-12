import { Router, Request, Response } from "express";
import passport from "passport";
import { forwardAuthenticated } from "./authentication";

const router = Router();

router.get("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Error logging out");
    }

    res.redirect("/login");
  });
});

export default router;
