import { Router } from "express";
const router = Router()

// route for index.html
router.get("/", (req, res) => {
    const page = {
        'logo': 'Uno Reverse', 
        'login': 'Login', 
        'register': 'Create Account'
    }
    res.render('landing', { page });
});

export default router