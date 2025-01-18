function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
  }


let boardSize = 10;
let board = [];


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
}
function createBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";
} 

