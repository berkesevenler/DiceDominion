import { writeData } from "./networking.js";
import { listenToChanges } from "./networking.js";
import { readData } from "./networking.js";
import { auth } from "./networking.js";
import { handlePublicLobby, updatePublicLobbyPlayers, cleanupPublicLobby } from "./lobbyManager.js";
import { setupPresenceMonitoring, isLobbyActive } from "./networking.js";

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

const REROLL_LIMIT = 3;
const rerollCount = {
  1: 0,
  2: 0,
};

//function for stating whos trun it is. (on the top left side of the game)
function displayTurnStatus(lobbyCode) {
  setupLobbyTerminationListener(lobbyCode);
  
  const turnStatusElement = document.getElementById("turnStatusDisplay");

  listenToChanges(`lobbies/${lobbyCode}/turnStatus`, (turnStatus) => {
    currentPlayer = turnStatus;

    readData(`lobbies/${lobbyCode}/players/player${currentPlayer}/name`).then((name) => {
      turnStatusElement.innerText = `It's ${name || `Player ${currentPlayer}`}'s turn!`;
    });

    if (currentPlayer === myPlayerCode) {
      // It's the current player's turn
      readData(`lobbies/${lobbyCode}/players/player${myPlayerCode}/name`).then((name) => {
        document.getElementById("status").innerText = `Your turn, ${name || `Player ${myPlayerCode}`}!`;
      });
    } else {
      // It's the opponent's turn
      readData(`lobbies/${lobbyCode}/players/player${currentPlayer}/name`).then((name) => {
        document.getElementById("status").innerText = `It's ${name || `Player ${currentPlayer}`}'s turn – please wait.`;
      });
    }

    fetchBoardFromServer(lobbyCode, myPlayerCode);
  });
}

//function to call the game-board data from firebase
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

//update game-grid when a player claims it
function updateGridCell(row, col, playerCode) {
  const cellElement = document.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
  if (cellElement) {
    cellElement.classList.add(`player${playerCode}`);
  }
}



//basic function to generate (private) lobby code
function generateLobbyCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let lobbyCode = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    lobbyCode += characters[randomIndex];
  }
  return lobbyCode;
}



//determines whos turn it is, when a player tries to place a block even though its not their turn
function isPlayerTurn() {
  if (currentPlayer !== myPlayerCode) {
    readData(`lobbies/${lobbyCode}/players/player${currentPlayer}/name`).then((opponentName) => {
      document.getElementById(
      "status"
    ).innerText = `It's not your turn! ${opponentName || `Player ${currentPlayer}`} is playing.`;
    });
    return false;
  }
  return true;
}




//really important function
//this function handles creating and joining a game/lobby
function startGame(join) {
  if (join) {
    //joining an existing game
    //gets lobby code
    lobbyCode = document.getElementById("lobbyCodeInput").value;
    //check if lobby is active
    isLobbyActive(lobbyCode).then(active => {
      if (!active) {
        //if not active, display error message
        alert("This lobby is no longer available!");
        location.reload();
        return;
      }
      //if active starts the game
      initializeGame(join);
    });
  } 
  
  else {
    //else creats a new game & new lobby code
    lobbyCode = generateLobbyCode();
    boardSize = parseInt(document.getElementById("boardSizeInput").value);
    handlePublicLobby(lobbyCode, boardSize);
    initializeGame(join);
  }
}





//Important function
//sets up everythign needed for the game to start
function initializeGame(join) {

  //UI setup
  document.getElementById("menu").style.display = "none";
  document.getElementById("container").style.display = "flex";
  document.getElementById("container").style.justifyContent = "center";
  document.getElementById("container").style.alignItems = "flex-start";
  document.getElementById("container").style.flexDirection = "column";
  document.getElementById("container").style.width = "100%";
  document.getElementById("container").style.paddingTop = "50px";

  document.getElementById("lobbyCodeDisplay").innerText = `Lobby Code: ${lobbyCode}`;

  //to automatically assign player ids
  readData(`lobbies/${lobbyCode}/players`).then((players) => {
    //player 1 setup
    if (!players || !players.player1) {
      myPlayerCode = 1;
      const player1ChosenColor = document.getElementById("playerColor").value;
      const player1ChosenName = document.getElementById("playerName").value;
      //save player 1s data to firebase
      writeData(`lobbies/${lobbyCode}/players/player1`, {
        uid: auth.currentUser.uid,
        name: player1ChosenName,
        color: player1ChosenColor,
      }).then(() => {
        setupPresenceMonitoring(lobbyCode, 1);
      });
      //set player 1s color and listen to player2s color
      document.documentElement.style.setProperty(
        "--player1-color",
        player1ChosenColor
      );
      listenToChanges(`lobbies/${lobbyCode}/players/player2/color`, (data) => {
        document.documentElement.style.setProperty("--player2-color", data);
      });
      //initialize board
      writeData(`lobbies/${lobbyCode}/boardSize`, boardSize);
      board = Array.from({ length: boardSize }, () =>
        Array(boardSize).fill(null)
      );
      createBoard();
      document.getElementById("status").innerText = `You are Player 1, ${player1ChosenName}!`;
    } 

    //player 2 setup
    else if (!players.player2) {
      myPlayerCode = 2;
      const player2ChosenColor = document.getElementById("playerColor").value;
      const player2ChosenName = document.getElementById("playerName").value;
      
      writeData(`lobbies/${lobbyCode}/players/player2`, {
        uid: auth.currentUser.uid,
        name: player2ChosenName,
        color: player2ChosenColor,
      }).then(() => {
        setupPresenceMonitoring(lobbyCode, 2);
      });
      document.documentElement.style.setProperty(
        "--player2-color",
        player2ChosenColor
      );
      //read data of player 1 from firebase
      readData(`lobbies/${lobbyCode}/players/player1/color`).then((data) => {
        document.documentElement.style.setProperty("--player1-color", data);
      });
      //read data of game-board from firebase
      readData(`lobbies/${lobbyCode}/boardSize`).then((size) => {
        boardSize = size;
        board = Array.from({ length: boardSize }, () =>
          Array(boardSize).fill(null)
        );
        createBoard();
      });

      document.getElementById("status").innerText = `You are Player 2, ${player2ChosenName}!`;
    } 
    
    //if lobby is full
    else {
      alert("The lobby is already full!");
      location.reload();
      return;
    }

    displayTurnStatus(lobbyCode);
    displayGameOver(lobbyCode);
    writeData(`lobbies/${lobbyCode}/gameOver`, 0);
    
    //sets initial turn to player 1 to start the game.
    if (myPlayerCode === 1) {
      writeData(`lobbies/${lobbyCode}/turnStatus`, 1);
    }
  });

  //chat setup
  document.getElementById("chatContainer").style.display = "block";
  initializeChat(lobbyCode);
}






//chat system between players
function initializeChat(lobbyCode) {
  const messageInput = document.getElementById("messageInput");
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  //function to listen for new messages
  listenToChanges(`lobbies/${lobbyCode}/chat`, (messages) => {
    
    if (!messages) return; //if no messages, exit
    //get chat box and clear it
    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = "";
    //converts messages object to array and then organizes by timestamp
     const messageArray = Object.entries(messages)
      .map(([key, msg]) => ({...msg, key}))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (messageArray.length > 20) {
      //if there are more than 20 messages=delete the oldest ones
      const messagesToDelete = messageArray.slice(0, messageArray.length - 20);
      //deletes old messages from firebase
      messagesToDelete.forEach(msg => {
        firebase.database().ref(`lobbies/${lobbyCode}/chat/${msg.key}`).remove();
      });
    
      //only displays the 20 most recent messages. the others are deleted.
    messageArray.slice(-20).forEach(msg => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `chat-message player${msg.player}`;
        messageDiv.textContent = msg.text;
        chatMessages.appendChild(messageDiv);
      });
    } 
    
    else {
      //if there are 20 or less messages = it displays all of them (like normal)
      messageArray.forEach(msg => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `chat-message player${msg.player}`;
        messageDiv.textContent = `${msg.name}: ${msg.text}`;
        chatMessages.appendChild(messageDiv);
      });
    }
    //auto scroll function. always scrolls to the bottom of the chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}





//function to handle sending messages back and forth
function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  
  //.trim is for removing not needed white spaces from text
  const message = messageInput.value.trim();

  const playerName = document.getElementById("playerName").value;
  
  if (message) {
    //creates a reference to the chat in firebase
    const chatRef = firebase.database().ref(`lobbies/${lobbyCode}/chat`).push();
    
    //sets the message data in firebase
    chatRef.set({
      player: myPlayerCode,
      name: playerName,
      text: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    //after sending a message, clear the input field
    messageInput.value = "";
  }
}



//attach functions to the global window object
window.startGame = startGame;
window.sendMessage = sendMessage;




//function to rotate block 90degrees when pressed "r" key
document.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    rotation = (rotation + 90) % 360;
    clearPreview();
    document.getElementById(
      "status"
    ).innerText = `Rotated to ${rotation} degrees`;
  }
});




//function to generate game-board
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




//this function handles dice rolling functionallity between players
export function rollDice() {
  if (!isPlayerTurn()) return; //check if player turn
  if (hasRolledDice) {
    document.getElementById(
      "status"
    ).innerText = `You have already rolled the dice. Place your block or skip your turn.`;
    return;
  }

  dice1 = Math.floor(Math.random() * 6) + 1;
  dice2 = Math.floor(Math.random() * 6) + 1;
  document.getElementById(
    "status"
  ).innerText = `You rolled ${dice1}x${dice2}`;
  document.getElementById("controls").style.display = "block";
  
  readData(`lobbies/${lobbyCode}/players/player${currentPlayer}/name`).then(playerName => {
    document.getElementById("currentPlayerDisplay").innerText = playerName || `Player ${currentPlayer}`;
  });

  document.getElementById("diceResult").innerText = `${dice1}x${dice2}`;
  canPlaceBlockFlag = true;
  rotation = 0;
  hasRolledDice = true;

  showRerollButton();

  if (!canPlayerPlace()) {
    handleNoValidMoves();
  } else {
    hideSkipTurnButton();
    hideDeclareWinnerButton();
  }
}


window.rollDice = rollDice;



//helper function to calculate centered position
function getCenteredPosition(clickedX, clickedY, width, height) {
  return {
    x: clickedX - Math.floor(width/2),
    y: clickedY - Math.floor(height/2)
  };
}


function previewBlock(event) {
  if (!dice1 || !dice2 || !canPlaceBlockFlag) return;
  clearPreview();

  const [width, height] = applyRotation(dice1, dice2);
  const clickedX = parseInt(event.target.dataset.col);
  const clickedY = parseInt(event.target.dataset.row);
  const { x: startX, y: startY } = getCenteredPosition(clickedX, clickedY, width, height);
  
  const previewClass = currentPlayer === 1 ? "preview-blue" : "preview-red";

  for (let row = startY; row < startY + height; row++) {
    for (let col = startX; col < startX + width; col++) {
      const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (cell && board[row][col] === null) {
        cell.classList.add(previewClass);
      }
    }
  }
  isPreviewing = true;
}


// if previewing is not active anymore, exits function
function clearPreview() {
  if (!isPreviewing) return;
  document
    .querySelectorAll(".preview-blue, .preview-red")
    .forEach((cell) => cell.classList.remove("preview-blue", "preview-red"));
  isPreviewing = false;
}



//when a player has won the game, a message pops up stating the other player has won
function displayGameOver(lobbyCode) {
  listenToChanges(`lobbies/${lobbyCode}/gameOver`, (gameOver) => {
    if (gameOver) {
      readData(`lobbies/${lobbyCode}/players/player${gameOver}/name`).then(winnerName => {
        
        document.getElementById(
          "status"
        ).innerText = 
          `Game Over! ${winnerName || `Player ${gameOver}`} has won!`;
        alert(`Game Over! ${winnerName || `Player ${gameOver}`} has won! Please start a new game.`);
      });
    }
  });
}



//writes data to firebase when a player has won.
function handleGameOver(lobbyCode, winningPlayer) {
  readData(`lobbies/${lobbyCode}/players/player${winningPlayer}/name`).then(winnerName => {
    console.log(`Game over! ${winnerName || `Player ${winningPlayer}`} has won.`);
    cleanupPublicLobby(lobbyCode);
    writeData(`lobbies/${lobbyCode}/gameOver`, winningPlayer);
  }).catch((error) => {
      console.error("Failed to set game over state:", error);
    });
}




//function to handle placing blocks in the game
function placeBlock(event) {
  if (!canPlaceBlockFlag) return;

  const [width, height] = applyRotation(dice1, dice2);
  const clickedX = parseInt(event.target.dataset.col);
  const clickedY = parseInt(event.target.dataset.row);
  const { x: startX, y: startY } = getCenteredPosition(clickedX, clickedY, width, height);

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
    ).innerText = `You cannot place block here.`;
  }
}


//function to adjust the dimension of the block according to the angle it turns
function applyRotation(width, height) {
  if (rotation === 90 || rotation === 270) {
    return [height, width];
  }
  return [width, height];
}




//checks if the block placed is within bounds
function isWithinBounds(x, y, width, height) {
  return x >= 0 && y >= 0 && x + width <= boardSize && y + height <= boardSize;
}



//checks if the blocks placed are connected
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



//this fucntion determines wether the cell(block) at the positions is adjacent to any placed cells
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
  readData(`lobbies/${lobbyCode}/players/player${winner}/name`).then((name) => {
    alert(`${name || `Player ${winner}`} wins!`);
    handleGameOver(lobbyCode, winner);
    location.reload();
  });
}

export function skipTurn() {
  readData(`lobbies/${lobbyCode}/players/player${currentPlayer}/name`).then(playerName => {

    if (skipTurnCount[currentPlayer] < skipTurnLimit) {
      skipTurnCount[currentPlayer]++;
      document.getElementById(
        "status"
      ).innerText = 
        `${playerName || `Player ${currentPlayer}`} skipped their turn. ` +
        `${skipTurnLimit - skipTurnCount[currentPlayer]} skips remaining.`;
      endTurn();
    } else {
      handleNoValidMoves();
    }
  });
}
window.skipTurn = skipTurn;
function handleNoValidMoves() {
  readData(`lobbies/${lobbyCode}/players/player${currentPlayer}/name`).then(currentPlayerName => {
    const otherPlayer = currentPlayer === 1 ? 2 : 1;

    readData(`lobbies/${lobbyCode}/players/player${otherPlayer}/name`).then(otherPlayerName => {

      if (skipTurnCount[currentPlayer] >= skipTurnLimit && !canPlayerPlace()) {
        
        document.getElementById(
          "status"
        ).innerText = 
          `You cannot place block and have exhausted all skips. ` +
          `${otherPlayerName || `Player ${otherPlayer}`} wins.`;
        showDeclareWinnerButton();
      } else {
        if (skipTurnCount[currentPlayer] < skipTurnLimit) {
          document.getElementById(
            "status"
          ).innerText = 
            `You cannot place block. You may skip your turn.`;
          showSkipTurnButton();
        }
      }
    });
  });
}

function endTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  writeData(`lobbies/${lobbyCode}/turnStatus`, currentPlayer);
  canPlaceBlockFlag = false;
  hasRolledDice = false;
  
  document.getElementById("controls").style.display = "none";
  hideSkipTurnButton();
  hideDeclareWinnerButton();
  hideRerollButton();
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

  readData(`lobbies/${lobbyCode}/players/player${otherPlayer}/name`).then(winnerName => {
    document.getElementById("winnerPlayerDisplay").innerText = winnerName || `Player ${otherPlayer}`;
  });
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



//function to handle exiting game
function exitGame() {

  const confirmation = confirm("Are you sure you want to be a loser? Your enemy will win if you leave.");

  if (confirmation) {
    declareWinner((currentPlayer == 1 ) ? 2:1);
    
    document.getElementById("container").style.display = "none";
    document.getElementById("menu").style.display = "block";
    
    board = [];
    currentPlayer = 1;
    dice1 = null;
    dice2 = null;
    isPreviewing = false;
    canPlaceBlockFlag = false;
    rotation = 0;
    hasRolledDice = false;

    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    document.getElementById("status").innerText = "Waiting for the game to start...";
    document.getElementById("lobbyCodeDisplay").innerText = "";
    
    if (lobbyCode) {
      writeData(`lobbies/${lobbyCode}/turnStatus`, null);
      writeData(`lobbies/${lobbyCode}/gameOver`, null);
      writeData(`lobbies/${lobbyCode}/board`, null);
      writeData(`lobbies/${lobbyCode}/players`, null);
    }
    
    console.log("Game exited. Returning to menu.");
  } else {
    console.log("Exit game canceled by the player.");
  }
}


document.getElementById("exitButton").addEventListener("click", exitGame);


//set up listener to minitor wether the host (player1) leave the game, if so, the game for player 2 will be alerted and reloaded
function setupLobbyTerminationListener(lobbyCode) {
  listenToChanges(`lobbies/${lobbyCode}`, (data) => {
    if (!data) {
      alert("The lobby has been terminated because the host left.");
      location.reload();
    }
  });
}


function handleReroll() {
  if (!isPlayerTurn()) return;

  readData(`lobbies/${lobbyCode}/players/player${currentPlayer}/name`).then(playerName => {
    if (!hasRolledDice) {
      document.getElementById("status").innerText = 
        `${playerName || `Player ${currentPlayer}`}, you need to roll the dice first.`;
        return; 
    }
    if (rerollCount[currentPlayer] >= REROLL_LIMIT) {
      document.getElementById("status").innerText = 
          `${playerName || `Player ${currentPlayer}`}, you have used all your re-rolls.`;
      return;
    }
    rerollCount[currentPlayer]++;

    dice1 = Math.floor(Math.random() * 6) + 1;
    dice2 = Math.floor(Math.random() * 6) + 1;

    const remaining = REROLL_LIMIT - rerollCount[currentPlayer];
    let statusMessage = `${playerName || `Player ${currentPlayer}`} re-rolled: ${dice1}x${dice2}`;
    statusMessage += ` (${remaining} re-roll${remaining !== 1 ? 's' : ''} remaining)`;

    if (remaining <= 0) {
      statusMessage = `${playerName || `Player ${currentPlayer}`}, you have used all your re-rolls.`;
    }

    document.getElementById("status").innerText = statusMessage;
    document.getElementById("diceResult").innerText = `${dice1}x${dice2}`;

    rotation = 0;
    clearPreview();

    if (!canPlayerPlace()) {
      handleNoValidMoves();
    } else {
      hideSkipTurnButton();
      hideDeclareWinnerButton();
    }
    showRerollButton();
  });
}
function showRerollButton() {
  const rerollBtn = document.getElementById("rerollButton");
  const remaining = REROLL_LIMIT - rerollCount[currentPlayer];
  if (remaining > 0) {
    rerollBtn.style.display = "block";
    `Re-roll (${remaining} left)`;
  } else {
    rerollBtn.style.display = "none";
  }
}
function hideRerollButton() {
  document.getElementById("rerollButton").style.display = "none";
}
window.handleReroll = handleReroll;

