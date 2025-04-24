import { Router } from "express";
const router = Router()

// route for login.html
router.get("/forgot", (req, res) => {
    const page_name = 'Forgot';
    res.render('forgot', { page_name });
});

export default router