import { Router, Request, Response } from "express";
import pool from "../config/db";
import bcrypt from "bcrypt";

const router = Router()

// route for registration.html
router.get("/register", (req: Request, res: Response) => {
    const page_name = 'Registration'
    res.render('register', { page_name });
});

router.post('/register', async (req: Request, res: Response) => {
    const { name, email, password, confirmPassword} = req.body;
    
    console.log('Attempting to register user:', { name, email, password, confirmPassword });
    
    if (password !== confirmPassword) {
        res.status(400).send("Passwords do not match.");
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 OR name = $2', [email, name]);

        if (result.rows.length > 0) {
            console.error('User already exists with the same email or username');
            res.status(400).send('User with that email or username already exists')
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        await pool.query(
            'INSERT INTO public.users (name, email, password) VALUES ($1, $2, $3)',
            [name, email, hashedPassword]
        );

        console.log('User registered successfully:', { name, email, hashedPassword });

        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
  });

export default router