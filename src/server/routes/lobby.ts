import { authenticate } from "./authentication";
import pool from "../config/db";
import { Router } from "express";
const router = Router();

// route for login.html
router.get("/lobby", authenticate, async (req, res) => {
  const page_name = "Game Lobby";
  const success_game_creation = req.flash("success_game_creation");
  const error_existing_game_message = req.flash("error_existing_game_message");

  const results = await pool.query(`
  SELECT 
    "Game".*, 
    users.name AS creator_name 
  FROM "Game"
  JOIN users 
    ON "Game".creator_id = users.id
`);

  const games = results.rows;

  res.render("lobby", {
    page_name,
    success_game_creation,
    error_existing_game_message,
    games,
  });
});

router.post("/games/create", authenticate, async (req, res) => {
  const { gamepassword, numberofplayers } = req.body;
  const gamename = req.body.gamename.toLowerCase();
  const userId = (req.user as { id: number }).id;
  const gameStatus = "waiting";

  try {
    const results = await pool.query(
      "SELECT * FROM public.games WHERE creator_id = $1",
      [userId]
    );

    if (results.rows.length == 0) {
      // create game
      await pool.query(
        "INSERT INTO public.games (name, password, creator_id, max_players, status) VALUES ($1, $2, $3, $4, $5)",
        [gamename, gamepassword, userId, numberofplayers, gameStatus]
      );
      req.flash(
        "success_game_creation",
        `The game with the name ${gamename} has been created. Players now can join to play.`
      );
      res.redirect("/lobby");
    } else {
      req.flash(
        "error_existing_game_message",
        `A user can only create a single game.`
      );
      res.redirect("/lobby");
    }
  } catch (error) {
    console.error("Error selecting games", error);
    res.status(500).send("Error selecting games");
  }
});

router.post("/join", authenticate, async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const { gameId } = req.body;
  try {
    const results = await pool.query(
      `SELECT * FROM public.players WHERE game_id = $1 AND user_id = $2`,
      [gameId, userId]
    );

    if (results.rows.length > 0) {
      req.flash("error_existing_game_message", "You already joined this game.");
      return res.redirect("/lobby");
    }

    // join the player to the game he clicked
    await pool.query(`INSERT INTO players (game_id, user_id) VALUES ($1, $2)`, [
      gameId,
      userId,
    ]);

    req.flash("success_game_creation", "Successfully joined the game.");
    return res.redirect(`/gameroom/${gameId}`);
  } catch (error) {
    req.flash(
      "error_existing_game_message",
      "A user can only join one game at a time."
    );
    return res.redirect("/lobby");
  }
});

export default router;
