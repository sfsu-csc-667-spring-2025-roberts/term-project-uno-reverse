import { Router } from "express";
const router = Router()

// route for login.html
router.get("/login", (req, res) => {
    res.render('login');
});

export default router