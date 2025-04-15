import { Router } from "express";
const router = Router()

// route for registration.html
router.get("/register", (req, res) => {
    res.render('register');
});

export default router