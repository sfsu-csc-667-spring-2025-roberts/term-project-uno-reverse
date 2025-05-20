import { Router, Request, Response } from "express";
import pool from "../config/db";
import bcrypt from "bcrypt";
import { error } from "console";

const router = Router();

// route for login.html
router.get("/forgot", (req, res) => {
  const page_name = "Forgot";
  const error_password_change = req.flash("error_password_change");
  const email_error_message = req.flash("email_error_message");
  res.render("forgot", {
    page_name,
    error_password_change,
    email_error_message,
  });
});

router.post("/forgot", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(email, password);

  try {
    const results = await pool.query(
      "SELECT * FROM public.users WHERE email = $1",
      [email]
    );

    if (results.rows.length > 0) {
      const oldHashedPassword = results.rows[0]["password"];
      const isMatch = await bcrypt.compare(password, oldHashedPassword);

      console.log(isMatch);
      if (isMatch) {
        req.flash(
          "error_password_change",
          "New password must be different from the old password"
        );
        res.redirect("/forgot");
      } else {
        //   hash the new password
        const hashedNewPassword = bcrypt.hashSync(password, 10);

        //   update the password
        await pool.query(
          "UPDATE public.users SET password = $1 WHERE email = $2",
          [hashedNewPassword, email]
        );

        req.flash(
          "password_change",
          "Password changed successfully. Please use your new password to log in."
        );

        res.redirect("/login");
      }
    } else {
      req.flash(
        "email_error_message",
        `No account was found with ${email}. Please check your email and try again.`
      );
      res.redirect("/forgot");
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Error registering user");
  }
});

export default router;
