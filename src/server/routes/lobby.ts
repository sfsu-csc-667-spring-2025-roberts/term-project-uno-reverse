import { authenticate } from "./authentication";
import pool from "../config/db";
import { Router } from "express";
const router = Router();

// route for login.html
router.get("/lobby", authenticate, async (req, res) => {
  const page_name = "Game Lobby";
  const success_game_creation = req.flash("success_game_creation");
  const error_existing_game_message = req.flash("error_existing_game_message");

  // 1. Get all games and creators
  const results = await pool.query(`
    SELECT 
      games.*, 
      users.name AS creator_name 
    FROM games
    JOIN users ON games.creator_id = users.id
  `);

  const games = results.rows;

  // 2. Get all players with game info
  const playerResults = await pool.query(`
    SELECT p.game_id, u.name AS player_name
    FROM players p
    JOIN users u ON p.user_id = u.id
  `);

  // 3. Group players by game_id
  const playersByGame: { [key: number]: string[] } = {};
  for (const row of playerResults.rows) {
    if (!playersByGame[row.game_id]) {
      playersByGame[row.game_id] = [];
    }
    playersByGame[row.game_id].push(row.player_name);
  }

  // After fetching games and playersByGame
  const userId = (req.user as { id: number }).id;

  const joinedGamesRes = await pool.query(
    `SELECT game_id FROM players WHERE user_id = $1`,
    [userId]
  );

  const joinedGameIds = joinedGamesRes.rows.map((row) => row.game_id);


  // 4. Pass everything to view
  res.render("lobby", {
    page_name,
    success_game_creation,
    error_existing_game_message,
    games,
    playersByGame,
    user: req.user,
    joinedGameIds,
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
      `SELECT * FROM players WHERE game_id = $1 AND user_id = $2`,
      [gameId, userId]
    );

    if (results.rows.length > 0) {
      req.flash("error_existing_game_message", "You already joined this game.");
      return res.redirect("/lobby");
    }

    await pool.query(
      `INSERT INTO players (game_id, user_id, seat_number)
       VALUES ($1, $2, (
         SELECT COALESCE(MAX(seat_number), 0) + 1 FROM players WHERE game_id = $1
       ))`,
      [gameId, userId]
    );

    req.flash("success_game_creation", "Successfully joined the game.");
    return res.redirect(`/gameroom/${gameId}`);
  } catch (error) {
    console.error("Error joining game:", error);
    req.flash("error_existing_game_message", "A user can only join one game at a time.");
    return res.redirect("/lobby");
  }
});


// Delete a game
router.post("/games/:gameId/delete", authenticate, async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const { gameId } = req.params;

  try {
    // 1. Verify game exists and user is creator
    const gameRes = await pool.query("SELECT creator_id FROM games WHERE id = $1", [gameId]);
    const game = gameRes.rows[0];

    if (!game || game.creator_id !== userId) {
      req.flash("error_existing_game_message", "You are not authorized to delete this game.");
      return res.redirect("/lobby");
    }

    // 2. Clean up related data manually
    await pool.query("DELETE FROM hand WHERE player_id IN (SELECT user_id FROM players WHERE game_id = $1)", [gameId]);
    await pool.query("DELETE FROM gamedeck WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM players WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM games WHERE id = $1", [gameId]);

    // 3. Bonus: delete orphaned players just in case
    await pool.query("DELETE FROM players WHERE game_id NOT IN (SELECT id FROM games)");

    req.flash("success_game_creation", "Game successfully deleted.");
    return res.redirect("/lobby");
  } catch (error) {
    console.error("Error deleting game:", error);
    req.flash("error_existing_game_message", "Failed to delete game.");
    return res.redirect("/lobby");
  }
});


export default router;
