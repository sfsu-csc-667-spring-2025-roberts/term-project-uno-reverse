import { Router } from "express";
const router = Router()

// route for registration.html
router.get("/register", (req, res) => {
    const page_name = 'Registration'
    res.render('register', { page_name });
});

export default router