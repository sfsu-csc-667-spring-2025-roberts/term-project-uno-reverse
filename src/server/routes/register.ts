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
    const { name, email, password } = req.body;
    
    console.log('Attempting to register user:', { name, email });

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
            [name, email, hashedPassword]
        );

        console.log('User registered successfully:', { name, email, hashedPassword });

        res.redirect('/');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }

  });

export default router