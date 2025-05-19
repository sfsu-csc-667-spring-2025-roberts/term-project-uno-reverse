import { Router, Request, Response } from "express";
import pool from "../config/db";
import bcrypt from "bcrypt";
import passport, { authenticate } from "passport";
import { forwardAuthenticated } from "./authentication";

const router = Router();

// route for login.html
router.get("/login", forwardAuthenticated, (req: Request, res: Response) => {
  const page_name = "Login";
  const registration = "Register";
  const success_message = req.flash("success_message");
  const password_change = req.flash("password_change");
  res.render("login", {
    page_name,
    registration,
    success_message,
    password_change,
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/lobby",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

export default router;
