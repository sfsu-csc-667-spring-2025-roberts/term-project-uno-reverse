// socket/gameSocket.ts
import { Server } from "socket.io";

export function socketSetUp(io: Server) {
  io.on("connection", (socket) => {
    socket.on("join_game", ({ gameId, playerName }) => {
      socket.join(gameId);
      socket.to(gameId).emit("player_joined", playerName);

      socket.data.gameId = gameId;
      socket.data.playerName = playerName;
    });

    socket.on("message", ({ gameId, playerName, message }) => {
      io.to(gameId).emit("message", { playerName, message });
    });
  });
}
