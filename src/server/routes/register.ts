import { Router, Request, Response } from "express";
import pool from "../config/db";
import bcrypt from "bcrypt";
import session from "express-session";
import flash from "express-flash";
import { forwardAuthenticated } from "./authentication";

const router = Router();

// route for registration.html
router.get("/register", forwardAuthenticated, (req: Request, res: Response) => {
  const error_message = req.flash("error_message");
  res.render("register", { passwordMisMatchError: "", error_message });
});

router.post("/register", async (req: Request, res: Response) => {
  // get name, email, and password from the registration form
  const { name, email, password, confirmPassword } = req.body;

  console.log("Attempting to register user:", {
    name,
    email,
    password,
    confirmPassword,
  });

  // passwords do not match
  if (password !== confirmPassword) {
    // res.status(400).send("Passwords do not match.");
    res.render("register", {
      passwordMisMatchError: "Passwords do not match.",
    });
  } else {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND name = $2",
        [email, name]
      );

      if (result.rows.length > 0) {
        console.error("User already exists with the same email or username");
        req.flash(
          "error_message",
          '"User already exists with the same email or username"'
        );
        // res.status(400).send("User with that email or username already exists");
        res.redirect("/register");
      }

      
      const hashedPassword = bcrypt.hashSync(password, 10);
      await pool.query(
        "INSERT INTO public.users (name, email, password) VALUES ($1, $2, $3)",
        [name, email, hashedPassword]
      );

      console.log("User registered successfully:", {
        name,
        email,
        hashedPassword,
      });

      req.flash(
        "success_message",
        "You have been registered successfully. Please log in."
      );
      res.redirect("/login");
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).send("Error registering user");
    }
  }
});

export default router;
