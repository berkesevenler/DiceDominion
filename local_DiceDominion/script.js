function toggleTheme() {
  const body = document.body;
  body.classList.toggle("dark-mode");
}

let boardSize = 10;
let board = [];
let currentPlayer = 1;

let dice1, dice2;
let hasRolledDice = false;
let canPlaceBlockFlag = false;
let rotation = 0;

const skipTurnLimit = 3;
const skipTurnCount = {
  1: 0,
  2: 0,
};

function startGame() {
  boardSize = parseInt(document.getElementById("boardSizeInput").value);

  const player1Color = document.getElementById("player1Color").value;
  const player2Color = document.getElementById("player2Color").value;

  document.documentElement.style.setProperty("--player1-color", player1Color);
  document.documentElement.style.setProperty("--player2-color", player2Color);

  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));

  document.getElementById("menu").style.display = "none";
  document.getElementById("container").style.display = "flex";
  document.getElementById("container").style.flexDirection = "column";
  document.getElementById("container").style.alignItems = "flex-start";
  document.getElementById("container").style.width = "100%";
  document.getElementById("container").style.paddingTop = "50px";
  document.getElementById("container").style.justifyContent = "center";

  createBoard();
  document.getElementById(
    "status"
  ).innerText = `Player ${currentPlayer}'s turn. Roll the dice.`;
}

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

function rollDice() {
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
  hasRolledDice = true;
  canPlaceBlockFlag = true;
  rotation = 0;

  if (!canPlayerPlace()) {
    handleNoValidMoves();
  } else {
    hideSkipTurnButton();
  }
}

function previewBlock(event) {
  if (!dice1 || !dice2 || !canPlaceBlockFlag) return;
  clearPreview();

  const startX = parseInt(event.target.dataset.col);
  const startY = parseInt(event.target.dataset.row);
  const previewClass = currentPlayer === 1 ? "preview-blue" : "preview-red";
  const [width, height] = applyRotation(dice1, dice2);

  if (startX + width <= boardSize && startY + height <= boardSize) {
    for (let row = startY; row < startY + height; row++) {
      for (let col = startX; col < startX + width; col++) {
        if (board[row][col] === null) {
          document
            .querySelector(`[data-row='${row}'][data-col='${col}']`)
            .classList.add(previewClass);
        }
      }
    }
  }
}

function clearPreview() {
  document
    .querySelectorAll(".preview-blue, .preview-red")
    .forEach((cell) => cell.classList.remove("preview-blue", "preview-red"));
}

function placeBlock(event) {
  if (!canPlaceBlockFlag) return;

  const startX = parseInt(event.target.dataset.col);
  const startY = parseInt(event.target.dataset.row);
  const [width, height] = applyRotation(dice1, dice2);

  if (startX + width > boardSize || startY + height > boardSize) {
    document.getElementById(
      "status"
    ).innerText = `Player ${currentPlayer} cannot place block here (out of bounds).`;
    return;
  }

  for (let row = startY; row < startY + height; row++) {
    for (let col = startX; col < startX + width; col++) {
      if (board[row][col] !== null) {
        document.getElementById(
          "status"
        ).innerText = `Player ${currentPlayer} cannot place block here (overlap).`;
        return;
      }
    }
  }

  for (let row = startY; row < startY + height; row++) {
    for (let col = startX; col < startX + width; col++) {
      board[row][col] = currentPlayer;
      document
        .querySelector(`[data-row='${row}'][data-col='${col}']`)
        .classList.add(`player${currentPlayer}`);
    }
  }

  endTurn();
}

function applyRotation(w, h) {
  if (rotation === 90 || rotation === 270) {
    return [h, w];
  }
  return [w, h];
}

function endTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  canPlaceBlockFlag = false;
  hasRolledDice = false;
  document.getElementById("controls").style.display = "none";
  document.getElementById(
    "status"
  ).innerText = `Player ${currentPlayer}'s turn. Roll the dice.`;
  clearPreview();
  hideSkipTurnButton();
}

function skipTurn() {
  if (skipTurnCount[currentPlayer] < skipTurnLimit) {
    skipTurnCount[currentPlayer]++;
    document.getElementById(
      "status"
    ).innerText = `Player ${currentPlayer} skipped their turn. ${
      skipTurnLimit - skipTurnCount[currentPlayer]
    } skips remaining.`;
    endTurn();
  } else {
    document.getElementById(
      "status"
    ).innerText = `Player ${currentPlayer} cannot skip anymore.`;
  }
}

function handleNoValidMoves() {
  if (skipTurnCount[currentPlayer] < skipTurnLimit) {
    document.getElementById(
      "status"
    ).innerText = `Player ${currentPlayer} cannot place block. You may skip your turn.`;
    showSkipTurnButton();
  } else {
    document.getElementById(
      "status"
    ).innerText = `Player ${currentPlayer} cannot place block and has no skips left.`;
  }
}

function showSkipTurnButton() {
  document.getElementById("skipTurnButton").style.display = "block";
}
function hideSkipTurnButton() {
  document.getElementById("skipTurnButton").style.display = "none";
}

function canPlayerPlace() {
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      for (let rot of [0, 90, 180, 270]) {
        const [width, height] =
          rot === 90 || rot === 270 ? [dice2, dice1] : [dice1, dice2];

        if (col + width <= boardSize && row + height <= boardSize) {
          let canPlaceHere = true;
          for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
              if (board[r][c] !== null) {
                canPlaceHere = false;
                break;
              }
            }
            if (!canPlaceHere) break;
          }
          if (canPlaceHere) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
