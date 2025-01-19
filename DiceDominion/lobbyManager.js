import { writeData, readData, listenToChanges } from "./networking.js";


export function displayPublicLobbies() {
  const lobbiesDiv = document.getElementById("publicLobbiesList");
  
  listenToChanges('lobbies', (lobbies) => {
    lobbiesDiv.innerHTML = '';

    if (!lobbies) {
      lobbiesDiv.innerHTML = '<p>No public lobbies available</p>';
      return;
    }

    Object.entries(lobbies).forEach(([code, data]) => {
      if (data.public) { 
        const lobbyElement = document.createElement('div');
        lobbyElement.className = 'public-lobby-item';
        lobbyElement.innerHTML = `
          <span>Lobby: ${code} (${data.players || 0}/2 players)</span>
          <button onclick="window.joinPublicLobby('${code}')">Join</button>
        `;
        lobbiesDiv.appendChild(lobbyElement);
      }
    });
  });
}


export function handlePublicLobby(lobbyCode, boardSize) {
  const isPublic = document.getElementById("isPublicLobby").checked;

  writeData(`lobbies/${lobbyCode}`, {
    boardSize: boardSize,
    createdAt: Date.now(),
    players: 1,
    public: isPublic
  });
}


export function updatePublicLobbyPlayers(lobbyCode) {
  readData(`lobbies/${lobbyCode}`).then((lobby) => {
    if (lobby) {
      const updatedPlayers = (lobby.players || 0) + 1;
      writeData(`lobbies/${lobbyCode}/players`, updatedPlayers);
    }
  });
}

export function cleanupPublicLobby(lobbyCode) {
  writeData(`lobbies/${lobbyCode}`, null);
}


export function joinPublicLobby(code) {
  document.getElementById("lobbyCodeInput").value = code;
  window.startGame(true);
}

window.joinPublicLobby = joinPublicLobby;

document.addEventListener('DOMContentLoaded', () => {
  displayPublicLobbies();
});
