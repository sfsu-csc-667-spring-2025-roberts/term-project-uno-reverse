import { authenticate } from "./authentication";
import { Router } from "express";
const router = Router();

// route for gameroom.html
router.get("/gameroom", authenticate, (req, res) => {
  const page_name = "Game Room";
  res.render("gameroom", { page_name });
});

router.post('/declare-uno', (req, res) => {
    // TODO: Mark that this player has declared UNO in your game state
    // Example: req.session.userId or req.user.id
    // Set a flag in DB or in-memory game state
    // Redirect back to game room
    res.redirect('/gameroom');
});

router.post('/declare-uno', (req, res) => {
    // TODO: Mark that this player has declared UNO in your game state
    // Example: req.session.userId or req.user.id
    // Set a flag in DB or in-memory game state
    // Redirect back to game room
    res.redirect('/gameroom');
});

export default router;
