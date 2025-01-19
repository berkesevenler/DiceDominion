import { writeData } from "./networking.js";
import { listenToChanges } from "./networking.js";
import { readData } from "./networking.js";
import { auth } from "./networking.js";

let myPlayerCode = 0; //to determine which player i am

let lobbyCode = "TESTLOBBY";

function toggleTheme() {
  const body = document.body;
  body.classList.toggle("dark-mode");
}

let boardSize = 10;
let board = [];
let currentPlayer = 1;
let dice1, dice2;
let isPreviewing = false;
let canPlaceBlockFlag = false;
let rotation = 0;
let hasRolledDice = false;

const skipTurnLimit = 3;
const skipTurnCount = {
  1: 0,
  2: 0,
};
function displayTurnStatus(lobbyCode) {
  const turnStatusElement = document.getElementById("turnStatusDisplay");

  listenToChanges(`lobbies/${lobbyCode}/turnStatus`, (turnStatus) => {
    let turnText = "Waiting for the game to start...";
    if (turnStatus === 1) {
      turnText = "It's Player 1's turn!";
    } else if (turnStatus === 2) {
      turnText = "It's Player 2's turn!";
    }
    currentPlayer = turnStatus;
    turnStatusElement.innerText = turnText;

    fetchBoardFromServer(lobbyCode, myPlayerCode);
  });
}

function fetchBoardFromServer(lobbyCode, myPlayerCode) {
  listenToChanges(`lobbies/${lobbyCode}/board`, (serverBoard) => {
    if (!serverBoard) return; //exit if no board data

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const serverCell = serverBoard[row]?.[col];
        const localCell = board[row][col];

        if (
          serverCell &&
          serverCell !== myPlayerCode &&
          serverCell !== localCell
        ) {
          board[row][col] = serverCell; 
          updateGridCell(row, col, serverCell);
        }
      }
    }
  });
}
function updateGridCell(row, col, playerCode) {
  const cellElement = document.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
  if (cellElement) {
    cellElement.classList.add(`player${playerCode}`);
  }
}
function generateLobbyCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let lobbyCode = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    lobbyCode += characters[randomIndex];
  }
  return lobbyCode;
}

function isPlayerTurn() {
  if (currentPlayer !== myPlayerCode) {
    document.getElementById(
      "status"
    ).innerText = `It's not your turn! Player ${currentPlayer} is playing.`;
    return false;
  }
  return true;
}

function startGame(join) {
  if (join === false) {
    lobbyCode = generateLobbyCode();
  } else {
    lobbyCode = document.getElementById("lobbyCodeInput").value;
  }
  boardSize = parseInt(document.getElementById("boardSizeInput").value);
  const player1Color = document.getElementById("player1Color").value;
  const player2Color = document.getElementById("player2Color").value;

  document.documentElement.style.setProperty("--player1-color", player1Color);
  document.documentElement.style.setProperty("--player2-color", player2Color);

  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));

  document.getElementById("menu").style.display = "none";
  document.getElementById("container").style.display = "flex";
  document.getElementById("container").style.justifyContent = "center";
  document.getElementById("container").style.alignItems = "flex-start";
  document.getElementById("container").style.flexDirection = "column";
  document.getElementById("container").style.width = "100%";
  document.getElementById("container").style.paddingTop = "50px";

  // Display the lobby code on the screen
  document.getElementById(
    "lobbyCodeDisplay"
  ).innerText = `Lobby Code: ${lobbyCode}`;

//to automatically assign player ids
  readData(`lobbies/${lobbyCode}/players`).then((players) => {
    if (!players || !players.player1) {
      //assign as player 1
      myPlayerCode = 1;
      writeData(`lobbies/${lobbyCode}/players/player1`, {
        uid: auth.currentUser.uid,
      });
      document.getElementById("status").innerText = "You are Player 1!";
    } else if (!players.player2) {
      //assign player 2
      myPlayerCode = 2;
      writeData(`lobbies/${lobbyCode}/players/player2`, {
        uid: auth.currentUser.uid,
      });
      document.getElementById("status").innerText = "You are Player 2!";
    } else {
      // lobby full
      alert("The lobby is already full!");
      location.reload();
      return;
    }

    createBoard();
    displayTurnStatus(lobbyCode);
    displayGameOver(lobbyCode);
    writeData(`lobbies/${lobbyCode}/gameOver`, 0)
      .then(() => {
        console.log("Game over state initialized to 0.");
      })
      .catch((error) => {
        console.error("Failed to initialize game over state:", error);
      });

    if (myPlayerCode === 1) {
      writeData(`lobbies/${lobbyCode}/turnStatus`, 1);
    }
  });
}

window.startGame = startGame;

document.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    rotation = (rotation + 90) % 360;
    clearPreview();
    document.getElementById(
      "status"
    ).innerText = `Rotated to ${rotation} degrees`;
  }
});

function createBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";
  boardDiv.style.gridTemplateColumns = `repeat(${boardSize}, 40px)`;
  boardDiv.style.gridTemplateRows = `repeat(${boardSize}, 40px)`;
  boardDiv.style.width = `${boardSize * 40}px`;
  boardDiv.style.height = `${boardSize * 40}px`;
  boardDiv.style.margin = "auto";
  boardDiv.style.position = "relative";

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("mouseover", previewBlock);
      cell.addEventListener("mouseout", clearPreview);
      cell.addEventListener("click", placeBlock);
      boardDiv.appendChild(cell);
    }
  }
}

export function rollDice() {
  if (!isPlayerTurn()) return; //check if player turn
  if (hasRolledDice) {
    document.getElementById(
      "status"
    ).innerText = `Player ${currentPlayer}, you have already rolled the dice. Place your block or skip your turn.`;
    return;
  }

  dice1 = Math.floor(Math.random() * 6) + 1;
  dice2 = Math.floor(Math.random() * 6) + 1;
  document.getElementById(
    "status"
  ).innerText = `Player ${currentPlayer} rolled ${dice1}x${dice2}`;
  document.getElementById("controls").style.display = "block";
  document.getElementById("currentPlayerDisplay").innerText = currentPlayer;
  document.getElementById("diceResult").innerText = `${dice1}x${dice2}`;
  canPlaceBlockFlag = true;
  rotation = 0;
  hasRolledDice = true;

  if (!canPlayerPlace()) {
    handleNoValidMoves();
  } else {
    hideSkipTurnButton();
    hideDeclareWinnerButton();
  }
}
window.rollDice = rollDice;
function previewBlock(event) {
  if (!dice1 || !dice2 || !canPlaceBlockFlag) return;
  clearPreview();

  const startX = parseInt(event.target.dataset.col);
  const startY = parseInt(event.target.dataset.row);
  const previewClass = currentPlayer === 1 ? "preview-blue" : "preview-red";
  const [width, height] = applyRotation(dice1, dice2);

  if (
    isWithinBounds(startX, startY, width, height) &&
    isConnected(startX, startY, width, height)
  ) {
    for (let row = startY; row < startY + height; row++) {
      for (let col = startX; col < startX + width; col++) {
        if (board[row][col] === null) {
          document
            .querySelector(`[data-row="${row}"][data-col="${col}"]`)
            .classList.add(previewClass);
        }
      }
    }
    isPreviewing = true;
  }
}

function clearPreview() {
  if (!isPreviewing) return;
  document
    .querySelectorAll(".preview-blue, .preview-red")
    .forEach((cell) => cell.classList.remove("preview-blue", "preview-red"));
  isPreviewing = false;
}

function displayGameOver(lobbyCode) {
  listenToChanges(`lobbies/${lobbyCode}/gameOver`, (gameOver) => {
    if (gameOver) {
      const winner = gameOver === 1 ? "Player 1" : "Player 2";
      document.getElementById(
        "status"
      ).innerText = `Game Over! ${winner} has won!`;
      alert(`Game Over! ${winner} has won! Please start a new game.`);
    }
  });
}

function handleGameOver(lobbyCode, winningPlayer) {
  writeData(`lobbies/${lobbyCode}/gameOver`, winningPlayer)
    .then(() => {
      console.log(`Game over! Player ${winningPlayer} has won.`);
    })
    .catch((error) => {
      console.error("Failed to set game over state:", error);
    });
}

function placeBlock(event) {
  if (!canPlaceBlockFlag) return;

  const startX = parseInt(event.target.dataset.col);
  const startY = parseInt(event.target.dataset.row);
  const [width, height] = applyRotation(dice1, dice2);

  if (
    isWithinBounds(startX, startY, width, height) &&
    isConnected(startX, startY, width, height) &&
    canPlaceBlock(startX, startY, width, height)
  ) {
    for (let row = startY; row < startY + height; row++) {
      for (let col = startX; col < startX + width; col++) {
        board[row][col] = currentPlayer;
        writeData(
          `lobbies/${lobbyCode}/board/` + row + "/" + col,
          currentPlayer
        );
        document
          .querySelector(`[data-row="${row}"][data-col="${col}"]`)
          .classList.add(`player${currentPlayer}`);
      }
    }

    if (checkWinCondition()) {
      declareWinner(currentPlayer);
    } else {
      endTurn();
    }
  } else {
    document.getElementById(
      "status"
    ).innerText = `Player ${currentPlayer} cannot place block here.`;
  }
}

function applyRotation(width, height) {
  if (rotation === 90 || rotation === 270) {
    return [height, width];
  }
  return [width, height];
}

function isWithinBounds(x, y, width, height) {
  return x >= 0 && y >= 0 && x + width <= boardSize && y + height <= boardSize;
}

function isConnected(x, y, width, height) {
  if (getPlacedBlocks(currentPlayer).length === 0) {
    return (
      (currentPlayer === 1 && x === 0 && y === 0) ||
      (currentPlayer === 2 &&
        x + width - 1 === boardSize - 1 &&
        y + height - 1 === boardSize - 1)
    );
  }

  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      if (isAdjacentToCurrentPlayer(row, col)) return true;
    }
  }
  return false;
}

function isAdjacentToCurrentPlayer(row, col) {
  const adjacentPositions = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];
  return adjacentPositions.some(
    ([r, c]) => board[r] && board[r][c] === currentPlayer
  );
}

function getPlacedBlocks(player) {
  return board.flat().filter((cell) => cell === player);
}

function canPlaceBlock(x, y, width, height) {
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      if (row >= boardSize || col >= boardSize || board[row][col] !== null)
        return false;
    }
  }
  return true;
}

function checkWinCondition() {
  const totalCells = boardSize * boardSize;
  const playerCells = board
    .flat()
    .filter((cell) => cell === currentPlayer).length;
  return playerCells >= totalCells / 2;
}

function declareWinner(winner) {
  alert(`Player ${winner} wins!`);
  handleGameOver(lobbyCode, winner);
  location.reload();
}

export function skipTurn() {
  if (skipTurnCount[currentPlayer] < skipTurnLimit) {
    skipTurnCount[currentPlayer]++;
    document.getElementById(
      "status"
    ).innerText = `Player ${currentPlayer} skipped their turn. ${
      skipTurnLimit - skipTurnCount[currentPlayer]
    } skips remaining.`;
    endTurn();
  } else {
    handleNoValidMoves();
  }
}
window.skipTurn = skipTurn;
function handleNoValidMoves() {
  if (skipTurnCount[currentPlayer] >= skipTurnLimit && !canPlayerPlace()) {
    const otherPlayer = currentPlayer === 1 ? 2 : 1;
    document.getElementById(
      "status"
    ).innerText = `Player ${currentPlayer} cannot place block and has exhausted all skips. Player ${otherPlayer} wins.`;
    showDeclareWinnerButton();
  } else {
    if (skipTurnCount[currentPlayer] < skipTurnLimit) {
      document.getElementById(
        "status"
      ).innerText = `Player ${currentPlayer} cannot place block. You may skip your turn.`;
      showSkipTurnButton();
    }
  }
}

function endTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  writeData(`lobbies/${lobbyCode}/turnStatus`, currentPlayer);
  canPlaceBlockFlag = false;
  hasRolledDice = false;
  document.getElementById("controls").style.display = "none";
  document.getElementById(
    "status"
  ).innerText = `Player ${currentPlayer}'s turn. Roll the dice.`;
  hideSkipTurnButton();
  hideDeclareWinnerButton();
  clearPreview();
}

function showSkipTurnButton() {
  if (skipTurnCount[currentPlayer] < skipTurnLimit) {
    document.getElementById("skipTurnButton").style.display = "block";
  }
}

function hideSkipTurnButton() {
  document.getElementById("skipTurnButton").style.display = "none";
}

function showDeclareWinnerButton() {
  const otherPlayer = currentPlayer === 1 ? 2 : 1;
  document.getElementById("declareWinnerButton").style.display = "block";
  document.getElementById("winnerPlayerDisplay").innerText = otherPlayer;
}

function hideDeclareWinnerButton() {
  document.getElementById("declareWinnerButton").style.display = "none";
}

export function declareOtherPlayerWinner() {
  const otherPlayer = currentPlayer === 1 ? 2 : 1;
  declareWinner(otherPlayer);
}
window.declareOtherPlayerWinner = declareOtherPlayerWinner;

function canPlayerPlace() {
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      for (let rot of [0, 90, 180, 270]) {
        const [width, height] = applyRotation(dice1, dice2);
        if (
          canPlaceBlock(col, row, width, height) &&
          isConnected(col, row, width, height)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}
