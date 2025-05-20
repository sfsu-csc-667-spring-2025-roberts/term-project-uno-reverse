import express from "express";
import {
  startGame,
  drawCard,
  playCard,
  checkTurn
} from "../controllers/unoGameController";

const router = express.Router();

router.get("/start/:gameId", startGame);
router.post("/draw", (req, res, next) => {
  drawCard(req, res).catch(next);
});

router.post("/play", (req, res, next) => {
  playCard(req, res).catch(next);
});

router.get("/turn/:gameId", checkTurn);

export default router;
