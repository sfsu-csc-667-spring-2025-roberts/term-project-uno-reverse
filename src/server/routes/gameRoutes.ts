import express from "express";
import { authenticate } from "./authentication";
import {
  startGame,
  drawCard,
  playCard,
  checkTurn
} from "../controllers/unoGameController";

const router = express.Router();



router.post("/games/:gameId/start", authenticate, async (req, res) => {
  const { gameId } = req.params;
  try {
    await startGame(req as any, res); // call your startGame logic
  } catch (err) {
    console.error("Error starting game:", err);
    res.status(500).send("Could not start game");
  }
});


router.post("/draw", (req, res, next) => {
  drawCard(req, res).catch(next);
});

router.post("/play", (req, res, next) => {
  playCard(req, res).catch(next);
});

router.get("/turn/:gameId", checkTurn);

export default router;
