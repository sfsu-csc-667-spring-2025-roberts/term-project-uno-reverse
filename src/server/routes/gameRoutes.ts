import express from "express";
import {
  startGame,
  drawCard,
  playCard,
  checkTurn
} from "../controllers/unoGameController";

const router = express.Router();

router.get("/start/:gameId", startGame);
router.post("/draw", drawCard);
router.post("/play", playCard);
router.get("/turn/:gameId", checkTurn);

export default router;
