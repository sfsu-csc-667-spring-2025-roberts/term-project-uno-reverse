import { Server, Socket } from "socket.io";
import { drawCardForPlayer, playCardInGame } from "../controllers/unoGameController";


// Merged function to handle all game-related socket events
export function registerGameHandlers(io: Server, socket: Socket) {
  socket.on("play-card", async ({ roomId, playerId, cardId }) => {
    try {
      const gameId = parseInt(roomId);
      const { newTopCard } = await playCardInGame(gameId, playerId, cardId);

      io.to(roomId).emit("card-played", {
        card: newTopCard,
        playerId,
      });
    } catch (error) {
      console.error("❌ play-card error:", (error as Error).message);
      socket.emit("card-error", { error: (error as Error).message });
    }
  });

  socket.on("draw-card", async ({ roomId, playerId }) => {
    try {
      const gameId = parseInt(roomId);
      const newCard = await drawCardForPlayer(gameId, playerId);

      socket.emit("card-drawn", { card: newCard });
    } catch (error) {
      console.error("❌ draw-card error:", (error as Error).message);
      socket.emit("draw-error", { error: (error as Error).message });
    }
  });
}

