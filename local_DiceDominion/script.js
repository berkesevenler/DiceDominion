function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
  }


let boardSize = 10;
let board = [];
let currentPlayer = 1;

let dice1, dice2;

let hasRolledDice = false;

function startGame() {
    boardSize = parseInt(document.getElementById("boardSizeInput").value);

    const player1Color = document.getElementById("player1Color").value;
    const player2Color = document.getElementById("player2Color").value;

  document.documentElement.style.setProperty('--player1-color', player1Color);
  document.documentElement.style.setProperty('--player2-color', player2Color);

  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));

  document.getElementById("menu").style.display = "none";
  document.getElementById("container").style.display = "flex";
  document.getElementById("container").style.flexDirection = "column";
  document.getElementById("container").style.alignItems = "flex-start";
  document.getElementById("container").style.width = "100%";
  document.getElementById("container").style.paddingTop = "50px";
  document.getElementById("container").style.justifyContent = "center";

  createBoard();
  document.getElementById("status").innerText = `Player ${currentPlayer}'s turn. Roll the dice.`;
}

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
        document.getElementById("status").innerText = `Player ${currentPlayer}, you have already rolled the dice. Place your block or skip your turn.`;
        return;
      }

dice1 = Math.floor(Math.random() * 6) + 1;
dice2 = Math.floor(Math.random() * 6) + 1;
hasRolledDice = true;

document.getElementById("status").innerText = 
   `Player ${currentPlayer} rolled ${dice1}x${dice2}`;
}

