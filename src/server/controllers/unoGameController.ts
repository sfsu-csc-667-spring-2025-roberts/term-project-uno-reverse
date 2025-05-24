import { Request, Response } from "express";
import pool from "../config/db";

// Helper to get current player turn
async function getCurrentPlayer(gameId: number) {
  const gameRes = await pool.query("SELECT turn_order FROM games WHERE id = $1", [gameId]);
  return gameRes.rows[0]?.turn_order ?? 0;
}

// POST: Start a new game (shuffle, deal cards, set top card, set turn)
export async function startGame(req: Request<{ gameId: string }>, res: Response) {
  const { gameId } = req.params;
  console.log("Start Game triggered for game ID:", gameId);
  try {
    // 1. Get a shuffled deck
    const cardRes = await pool.query("SELECT id FROM card ORDER BY RANDOM()");
    const cardIds = cardRes.rows.map((row) => row.id);

    // 2. Insert full deck into gamedeck
    for (const cardId of cardIds) {
      await pool.query("INSERT INTO gamedeck (game_id, card_id) VALUES ($1, $2)", [gameId, cardId]);
    }

    // 3. Get all players in seat order
    const playersRes = await pool.query(
      "SELECT user_id FROM players WHERE game_id = $1 ORDER BY seat_number",
      [gameId]
    );
    const players = playersRes.rows;
    
    let cardIndex = 0;
    for (const player of players) {
      for (let i = 0; i < 7; i++) {
        await pool.query("INSERT INTO hand (player_id, card_id) VALUES ($1, $2)", [
          player.user_id, 
          cardIds[cardIndex++],
        ]);
      }
    }
    

    // 5. Set the top card
    const topCardId = cardIds[cardIndex++];

    // 6. Set game to active and turn to player 1
    await pool.query(
      "UPDATE games SET card_id = $1, status = 'active', turn_order = 1 WHERE id = $2",
      [topCardId, gameId]
    );

    res.redirect(`/gameroom/${gameId}`);
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).send("Could not start game");
  }
}

// POST: Draw a card
export async function drawCard(req: Request, res: Response) {
  const { gameId, playerId } = req.body;

  try {
    const deckRes = await pool.query(
      `SELECT gd.card_id FROM gamedeck gd LEFT JOIN hand h ON gd.card_id = h.card_id WHERE gd.game_id = $1 AND h.card_id IS NULL LIMIT 1`,
      [gameId]
    );

    if (deckRes.rows.length === 0) {
      return res.status(400).json({ error: "No more cards to draw" });
    }

    const cardId = deckRes.rows[0].card_id;

    await pool.query("INSERT INTO hand (player_id, card_id) VALUES ($1, $2)", [
      playerId,
      cardId,
    ]);

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
    // 1. Get seat number of player trying to play
    const seatRes = await pool.query(
      `SELECT seat_number FROM players WHERE game_id = $1 AND user_id = $2`,
      [gameId, playerId]
    );
    const seatNumber = seatRes.rows[0]?.seat_number;

    // 2. Get current turn order
    const turnRes = await pool.query(
      `SELECT turn_order FROM games WHERE id = $1`,
      [gameId]
    );
    const currentTurn = turnRes.rows[0]?.turn_order;

    // 3. Reject if not player's turn
    if (seatNumber !== currentTurn) {
      return res.status(403).json({ error: "Not your turn." });
    }

    // 4. Validate card play
    const gameRes = await pool.query("SELECT card_id FROM games WHERE id = $1", [gameId]);
    const topCardId = gameRes.rows[0].card_id;

    const [topCard, playedCard] = await Promise.all([
      pool.query("SELECT * FROM card WHERE id = $1", [topCardId]),
      pool.query("SELECT * FROM card WHERE id = $1", [cardId]),
    ]);

    const valid =
      topCard.rows[0].color === playedCard.rows[0].color ||
      topCard.rows[0].value === playedCard.rows[0].value ||
      playedCard.rows[0].type === "wild";

    if (!valid) {
      return res.status(400).json({ error: "Invalid move." });
    }

    // 5. Play the card
    await pool.query("DELETE FROM hand WHERE player_id = $1 AND card_id = $2", [
      playerId,
      cardId,
    ]);

    await pool.query("UPDATE games SET card_id = $1 WHERE id = $2", [
      cardId,
      gameId,
    ]);

    // 6. Advance to next player
    const players = await pool.query(
      `SELECT seat_number FROM players WHERE game_id = $1 ORDER BY seat_number`,
      [gameId]
    );

    const currentIndex = players.rows.findIndex(p => p.seat_number === seatNumber);
    const nextIndex = (currentIndex + 1) % players.rows.length;
    const nextSeat = players.rows[nextIndex].seat_number;

    await pool.query("UPDATE games SET turn_order = $1 WHERE id = $2", [
      nextSeat,
      gameId,
    ]);

    res.status(200).json({ message: "Card played. Turn advanced." });
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
