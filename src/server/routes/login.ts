import { Router, Request, Response } from "express";
import pool from "../config/db";
import bcrypt from "bcrypt";

const router = Router()

// route for login.html
router.get("/login", (req: Request, res: Response) => {
    const page_name = 'Login';
    const registration = 'Register';
    res.render('login', { page_name, registration });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  console.log('Attempting to log in user:', { email });

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('User not found:', { email });
      res.status(404).send('User not found');
    }

    const user = result.rows[0]; // actual user record
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      console.log('User logged in successfully:', { email });
      res.redirect('/');
    } else {
      console.log('Invalid password for user:', { email });
      res.status(401).send('Invalid password');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});
  

export default router