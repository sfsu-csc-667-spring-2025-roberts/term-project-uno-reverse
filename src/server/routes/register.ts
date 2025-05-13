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
    req.flash("error_message", `Passwords do not match.`);
    res.redirect("/register");
  } else {
    try {
      const result = await pool.query(
        "SELECT * FROM public.users WHERE email = $1 AND name = $2",
        [email, name]
      );

      if (result.rows.length > 0) {
        // user exists
        console.error("User already exists with the same email or username");
        req.flash(
          "error_message",
          `An account with the email address ${email} already exists. Please choose a different one.`
        );
        res.redirect("/register");
      } else {
        // register a new user
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
      }
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).send("Error registering user");
    }
  }
});

export default router;
