function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
  }


let boardSize = 10;
let board = [];
let currentPlayer = 1;

let dice1, dice2;
let hasRolledDice = false;

let rotation = 0;

let canPlaceBlockFlag = false;

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


document.addEventListener("keydown", (e) => {
    if (e.key === "r" || e.key === "R") {
      rotation = (rotation + 90) % 360;
      document.getElementById("status").innerText = `Rotated to ${rotation} degrees`;
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
        document.getElementById("status").innerText = `Player ${currentPlayer}, you have already rolled the dice. Place your block or skip your turn.`;
        return;
      }

    dice1 = Math.floor(Math.random() * 6) + 1;
    dice2 = Math.floor(Math.random() * 6) + 1;
    hasRolledDice = true;
    canPlaceBlockFlag = true;
    rotation = 0;

    document.getElementById("status").innerText = 
     `Player ${currentPlayer} rolled ${dice1}x${dice2}`;

   document.getElementById("controls").style.display = "block";
   document.getElementById("currentPlayerDisplay").innerText = currentPlayer;
   document.getElementById("diceResult").innerText = `${dice1}x${dice2}`;
}


function previewBlock(e) {
    if (!canPlaceBlockFlag) return;
    if (!dice1 || !dice2) return;
  
    const col = parseInt(e.target.dataset.col);
    const row = parseInt(e.target.dataset.row);
  
    const [w, h] = applyRotation(dice1, dice2);
  
    if (row + h > boardSize || col + w > boardSize) return;
  
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        const cell = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
        if (board[r][c] === null) {
          const previewClass = (currentPlayer === 1) ? 'preview-blue' : 'preview-red';
          cell.classList.add(previewClass);
        }
      }
    }
  }
  
  function clearPreview() {
    document.querySelectorAll('.preview-blue, .preview-red')
      .forEach(cell => cell.classList.remove('preview-blue', 'preview-red'));
  }
  
  function placeBlock(e) {
    if (!canPlaceBlockFlag) return;
  
    const startCol = parseInt(e.target.dataset.col);
    const startRow = parseInt(e.target.dataset.row);
    const [w, h] = applyRotation(dice1, dice2);
  
    if (startRow + h > boardSize || startCol + w > boardSize) {
      document.getElementById("status").innerText = 
        `Player ${currentPlayer} cannot place block here (out of bounds).`;
      return;
    }
  
    for (let r = startRow; r < startRow + h; r++) {
      for (let c = startCol; c < startCol + w; c++) {
        if (board[r][c] !== null) {
          document.getElementById("status").innerText = 
            `Player ${currentPlayer} cannot place block here (overlap).`;
          return;
        }
      }
    }
  
    for (let r = startRow; r < startRow + h; r++) {
      for (let c = startCol; c < startCol + w; c++) {
        board[r][c] = currentPlayer;
        document.querySelector(`[data-row='${r}'][data-col='${c}']`)
          .classList.add(`player${currentPlayer}`);
      }
    }
  
    endTurn();
  }
  
  function applyRotation(width, height) {
    if (rotation === 90 || rotation === 270) {
      return [height, width];
    }
    return [width, height];
  }
  
  function endTurn() {
    canPlaceBlockFlag = false;
    hasRolledDice = false;
    document.getElementById("controls").style.display = "none";
    currentPlayer = (currentPlayer === 1) ? 2 : 1;
    document.getElementById("status").innerText = 
      `Player ${currentPlayer}'s turn. Roll the dice.`;
  }