import "./theme.js";
import { startGame } from "./gameSetup.js";
import { rollDice, skipTurn, handleReroll, declareOtherPlayerWinner, clearPreview } from "./gameLogic.js";


window.startGame = startGame;
window.rollDice = rollDice;
window.skipTurn = skipTurn;
window.handleReroll = handleReroll;
window.declareOtherPlayerWinner = declareOtherPlayerWinner;

//to rotate using r
document.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    // Import the module and update the rotation.
    import("./gameLogic.js").then((module) => {
      module.rotation = (module.rotation + 90) % 360;
      module.clearPreview();
      document.getElementById("status").innerText = `Rotated to ${module.rotation} degrees`;
    });
  }
});
