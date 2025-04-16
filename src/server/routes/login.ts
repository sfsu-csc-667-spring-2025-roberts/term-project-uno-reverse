import { Router } from "express";
const router = Router()

// route for login.html
router.get("/login", (req, res) => {
    const page_name = 'Login';
    const registration = 'Register';
    res.render('login', { page_name, registration });
});

export default router