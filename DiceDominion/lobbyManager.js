import { writeData, readData, listenToChanges } from "./networking.js";


export function displayPublicLobbies() {
  const lobbiesDiv = document.getElementById("publicLobbiesList");
  
  listenToChanges('publicLobbies', (lobbies) => {
    lobbiesDiv.innerHTML = '';
    
    if (!lobbies) {
      lobbiesDiv.innerHTML = '<p>No public lobbies available</p>';
      return;
    }

    Object.entries(lobbies).forEach(([code, data]) => {
      const lobbyElement = document.createElement('div');
      lobbyElement.className = 'public-lobby-item';
      lobbyElement.innerHTML = `
        <span>Lobby: ${code} (${data.players}/2 players)</span>
        <button onclick="window.joinPublicLobby('${code}')">Join</button>
      `;
      lobbiesDiv.appendChild(lobbyElement);
    });
  });
}

export function handlePublicLobby(lobbyCode, boardSize) {
  const isPublic = document.getElementById("isPublicLobby").checked;
  
  if (isPublic) {
    writeData(`publicLobbies/${lobbyCode}`, {
      boardSize: boardSize,
      createdAt: Date.now(),
      players: 1
    });
  }
}

export function updatePublicLobbyPlayers(lobbyCode) {
  readData(`publicLobbies/${lobbyCode}`).then((publicLobby) => {
    if (publicLobby) {
      writeData(`publicLobbies/${lobbyCode}/players`, 2);
    }
  });
}

export function cleanupPublicLobby(lobbyCode) {
  readData(`publicLobbies/${lobbyCode}`).then((publicLobby) => {
    if (publicLobby) {
      writeData(`publicLobbies/${lobbyCode}`, null);
    }
  });
}

export function joinPublicLobby(code) {
  document.getElementById("lobbyCodeInput").value = code;
  window.startGame(true);
}

window.joinPublicLobby = joinPublicLobby;

document.addEventListener('DOMContentLoaded', () => {
  displayPublicLobbies();
});