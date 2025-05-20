import { Request, Response } from "express";
import pool from "../config/db";

// Helper to get current player turn
async function getCurrentPlayer(gameId: number) {
  const gameRes = await pool.query("SELECT turn_order FROM Game WHERE id = $1", [gameId]);
  return gameRes.rows[0]?.turn_order ?? 0;
}

// GET: Start a new game
export async function startGame(req: Request, res: Response) {
  const { gameId } = req.params;

  try {
    // Get shuffled deck
    const cardRes = await pool.query("SELECT id FROM Card ORDER BY RANDOM()");
    const cardIds = cardRes.rows.map(row => row.id);

    // Insert cards into GameDeck
    for (let i = 0; i < cardIds.length; i++) {
      await pool.query("INSERT INTO GameDeck (game_id, card_id) VALUES ($1, $2)", [gameId, cardIds[i]]);
    }

    // Set the top card to start
    await pool.query("UPDATE Game SET card_id = $1, status = 'active' WHERE id = $2", [cardIds[0], gameId]);

    res.status(200).json({ message: "Game started successfully" });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({ error: "Could not start game" });
  }
}

// POST: Draw a card
export async function drawCard(req: Request, res: Response) {
  const { gameId, playerId } = req.body;

  try {
    const deckRes = await pool.query(
      "SELECT gd.card_id FROM GameDeck gd LEFT JOIN Hand h ON gd.card_id = h.card_id WHERE gd.game_id = $1 AND h.card_id IS NULL LIMIT 1",
      [gameId]
    );

    if (deckRes.rows.length === 0) {
      return res.status(400).json({ error: "No more cards to draw" });
    }

    const cardId = deckRes.rows[0].card_id;

    await pool.query("INSERT INTO Hand (player_id, card_id) VALUES ($1, $2)", [playerId, cardId]);

    res.status(200).json({ message: "Card drawn", cardId });
  } catch (error) {
    console.error("Error drawing card:", error);
    res.status(500).json({ error: "Could not draw card" });
  }
}

// POST: Play a card
export async function playCard(req: Request, res: Response) {
  const { gameId, playerId, cardId } = req.body;

  try {
    const gameRes = await pool.query("SELECT card_id FROM Game WHERE id = $1", [gameId]);
    const topCardId = gameRes.rows[0].card_id;

    const [topCard, playedCard] = await Promise.all([
      pool.query("SELECT * FROM Card WHERE id = $1", [topCardId]),
      pool.query("SELECT * FROM Card WHERE id = $1", [cardId]),
    ]);

    const valid =
      topCard.rows[0].color === playedCard.rows[0].color ||
      topCard.rows[0].value === playedCard.rows[0].value ||
      playedCard.rows[0].type === "wild";

    if (!valid) {
      return res.status(400).json({ error: "Invalid move" });
    }

    // Update top card
    await pool.query("UPDATE Game SET card_id = $1 WHERE id = $2", [cardId, gameId]);

    // Remove card from hand
    await pool.query("DELETE FROM Hand WHERE player_id = $1 AND card_id = $2", [playerId, cardId]);

    res.status(200).json({ message: "Card played" });
  } catch (error) {
    console.error("Error playing card:", error);
    res.status(500).json({ error: "Could not play card" });
  }
}

// GET: Check whose turn it is
export async function checkTurn(req: Request, res: Response) {
  const { gameId } = req.params;

  try {
    const order = await getCurrentPlayer(Number(gameId));
    res.status(200).json({ currentPlayer: order });
  } catch (error) {
    console.error("Error checking turn:", error);
    res.status(500).json({ error: "Could not check turn" });
  }
}
