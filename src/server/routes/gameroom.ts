import { authenticate } from "./authentication";
import { Router } from "express";
const router = Router();
import pool from "../config/db";

// route for gameroom.html
router.get("/gameroom/:gameId", authenticate, async (req, res) => {
  const page_name = "Game Room";
  const gameId = req.params.gameId;

  const result = await pool.query(
    `
    SELECT users.name
    FROM players
    JOIN users ON players.user_id = users.id
    WHERE players.game_id = $1
  `,
    [gameId]
  );

  const currentUserId = (req.user as { id: number }).id;
  const playerResult = await pool.query(`SELECT name FROM users WHERE id = $1`, [
    currentUserId,
  ]);
  const playerName = playerResult.rows[0]?.name || "Unknown Player";

  res.render("gameroom", { page_name, gameId, playerName });
});

router.post("/declare-uno", (req, res) => {
  // TODO: Mark that this player has declared UNO in your game state
  // Example: req.session.userId or req.user.id
  // Set a flag in DB or in-memory game state
  // Redirect back to game room
  res.redirect("/gameroom");
});

router.post("/declare-uno", (req, res) => {
  // TODO: Mark that this player has declared UNO in your game state
  // Example: req.session.userId or req.user.id
  // Set a flag in DB or in-memory game state
  // Redirect back to game room
  res.redirect("/gameroom");
});

export default router;
