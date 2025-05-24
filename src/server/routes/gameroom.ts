import { authenticate } from "./authentication";
import { Router } from "express";
import pool from "../config/db";

const router = Router();

router.get("/gameroom/:gameId", authenticate, async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const gameId = req.params.gameId;

  try {
    // 1. Get all players with seat and name
    const playerRes = await pool.query(
      `SELECT p.user_id, p.seat_number, u.name FROM players p JOIN users u ON p.user_id = u.id WHERE p.game_id = $1 ORDER BY seat_number`,
      [gameId]
    );
    const players = playerRes.rows;

    // 2. Get game info (top card and current turn)
    const gameRes = await pool.query("SELECT * FROM games WHERE id = $1", [gameId]);
    const game = gameRes.rows[0];

    // 3. Get top card details
    const cardRes = await pool.query("SELECT * FROM card WHERE id = $1", [game.card_id]);
    const topCard = cardRes.rows[0];

    // 4. Get this user's hand (card faces)
    const handRes = await pool.query(
      `
      SELECT c.*
      FROM hand h
      JOIN card c ON h.card_id = c.id
      JOIN players p ON h.player_id = p.id
      WHERE p.user_id = $1 AND p.game_id = $2
      `,
      [userId, gameId]
    );
    
    const playerHand = handRes.rows;

    // 5. Determine if it's this user's turn
    const seatRes = await pool.query(
      "SELECT seat_number FROM players WHERE game_id = $1 AND user_id = $2",
      [gameId, userId]
    );
    const seatNumber = seatRes.rows[0]?.seat_number;
    const isMyTurn = game.turn_order === seatNumber;

    res.render("gameroom", {
      page_name: "Game Room",
      gameId,
      game,
      players,
      playerHand,
      topCard,
      isMyTurn,
      user: req.user
    });
  } catch (error) {
    console.error("Error loading game room:", error);
    res.status(500).send("Failed to load game room");
  }
});

export default router;

