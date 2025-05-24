import { Request, Response } from "express";
import pool from "../config/db";

async function getCurrentPlayer(gameId: number) {
  const gameRes = await pool.query("SELECT turn_order FROM games WHERE id = $1", [gameId]);
  return gameRes.rows[0]?.turn_order ?? 0;
}

export async function startGame(req: Request<{ gameId: string }>, res: Response) {
  const { gameId } = req.params;
  console.log("Start Game triggered for game ID:", gameId);

  try {
    const cardRes = await pool.query("SELECT id FROM card ORDER BY RANDOM()");
    const cardIds = cardRes.rows.map((row) => row.id);

    for (const cardId of cardIds) {
      await pool.query("INSERT INTO gamedeck (game_id, card_id) VALUES ($1, $2)", [gameId, cardId]);
    }

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

    // Use the first number/action card as the initial top card
    let topCardId: number | undefined;

    while (cardIndex < cardIds.length) {
      const result = await pool.query("SELECT * FROM card WHERE id = $1", [cardIds[cardIndex]]);
      const card = result.rows[0];

      if (card.type === "number" || card.type === "action") {
        topCardId = card.id;
        cardIndex++;
        break;
      }

      cardIndex++;
    }

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

export async function drawCard(req: Request, res: Response) {
  const { gameId, playerId } = req.body;

  try {
    const result = await pool.query(
      `SELECT gd.card_id FROM gamedeck gd
       LEFT JOIN hand h ON gd.card_id = h.card_id
       WHERE gd.game_id = $1 AND h.card_id IS NULL
       LIMIT 1`,
      [gameId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "No more cards to draw" });
    }

    const cardId = result.rows[0].card_id;

    await pool.query("INSERT INTO hand (player_id, card_id) VALUES ($1, $2)", [playerId, cardId]);

    res.status(200).json({ message: "Card drawn", cardId });
  } catch (error) {
    console.error("Error drawing card:", error);
    res.status(500).json({ error: "Could not draw card" });
  }
}

export async function playCard(req: Request, res: Response) {
  const { gameId, playerId, cardId } = req.body;

  try {
    await playCardInGame(Number(gameId), playerId, Number(cardId));
    res.status(200).json({ message: "Card played. Turn advanced." });
  } catch (error) {
    console.error("Error playing card:", error);
    const message = error instanceof Error ? error.message : "Could not play card";
    res.status(500).json({ error: message });
  }
}

export async function checkTurn(req: Request, res: Response) {
  const { gameId } = req.params;

  try {
    const currentPlayer = await getCurrentPlayer(Number(gameId));
    res.status(200).json({ currentPlayer });
  } catch (error) {
    console.error("Error checking turn:", error);
    res.status(500).json({ error: "Could not check turn" });
  }
}

export async function playCardInGame(gameId: number, playerId: string, cardId: number) {
  const seatRes = await pool.query(
    "SELECT seat_number FROM players WHERE game_id = $1 AND user_id = $2",
    [gameId, playerId]
  );
  const seatNumber = seatRes.rows[0]?.seat_number;

  const turnRes = await pool.query("SELECT turn_order FROM games WHERE id = $1", [gameId]);
  const currentTurn = turnRes.rows[0]?.turn_order;

  if (seatNumber !== currentTurn) throw new Error("Not your turn");

  const gameRes = await pool.query("SELECT card_id FROM games WHERE id = $1", [gameId]);
  const topCardId = gameRes.rows[0].card_id;

  const [topCardRes, playedCardRes] = await Promise.all([
    pool.query("SELECT * FROM card WHERE id = $1", [topCardId]),
    pool.query("SELECT * FROM card WHERE id = $1", [cardId]),
  ]);

  const topCard = topCardRes.rows[0];
  const playedCard = playedCardRes.rows[0];

  const isValid =
    playedCard.type === "wild" ||
    playedCard.color === topCard.color ||
    playedCard.value === topCard.value;

  if (!isValid) throw new Error("Invalid card play");

  await pool.query("DELETE FROM hand WHERE player_id = $1 AND card_id = $2", [
    playerId,
    cardId,
  ]);

  await pool.query("UPDATE games SET card_id = $1 WHERE id = $2", [cardId, gameId]);

  const players = await pool.query(
    "SELECT seat_number FROM players WHERE game_id = $1 ORDER BY seat_number",
    [gameId]
  );

  const currentIndex = players.rows.findIndex((p) => p.seat_number === seatNumber);
  const nextIndex = (currentIndex + 1) % players.rows.length;
  const nextSeat = players.rows[nextIndex].seat_number;

  await pool.query("UPDATE games SET turn_order = $1 WHERE id = $2", [nextSeat, gameId]);

  return {
    newTopCard: playedCard,
    nextTurnSeat: nextSeat,
  };
}

export async function drawCardForPlayer(gameId: number, playerId: string) {
  const result = await pool.query(
    `SELECT gd.card_id FROM gamedeck gd
     LEFT JOIN hand h ON gd.card_id = h.card_id
     WHERE gd.game_id = $1 AND h.card_id IS NULL
     LIMIT 1`,
    [gameId]
  );

  if (result.rows.length === 0) {
    throw new Error("No more cards to draw");
  }

  const cardId = result.rows[0].card_id;

  await pool.query("INSERT INTO hand (player_id, card_id) VALUES ($1, $2)", [playerId, cardId]);

  const cardRes = await pool.query("SELECT * FROM card WHERE id = $1", [cardId]);
  return cardRes.rows[0];
}

export async function resetGame(req: Request, res: Response) {
  const { gameId } = req.params;

  try {
    await pool.query(
      "DELETE FROM hand WHERE player_id IN (SELECT user_id FROM players WHERE game_id = $1)",
      [gameId]
    );

    await pool.query("DELETE FROM gamedeck WHERE game_id = $1", [gameId]);

    await pool.query(
      "UPDATE games SET card_id = NULL, turn_order = 1, status = 'waiting' WHERE id = $1",
      [gameId]
    );

    res.redirect(`/gameroom/${gameId}`);
  } catch (error) {
    console.error("Error resetting game:", error);
    res.status(500).send("Could not reset game");
  }
}
