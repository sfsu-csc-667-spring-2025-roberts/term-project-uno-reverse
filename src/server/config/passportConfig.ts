import { Strategy as LocalStrategy } from "passport-local";
import pool from "../config/db";
import bcrypt from "bcrypt";
import { PassportStatic } from "passport";

function initialize(passport: PassportStatic) {
  const authenticateUser = async (
    email: string,
    password: string,
    done: any
  ) => {
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      const user = result.rows[0];

      if (!user) {
        return done(null, false, {
          message:
            "It looks like you don't have an account. Please register to continue.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, {
          message: "The password you entered is incorrect.",
        });
      }
    } catch (err) {
      return done(err);
    }
  };

  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);
      return done(null, result.rows[0]);
    } catch (err) {
      return done(err);
    }
  });
}

export default initialize;
