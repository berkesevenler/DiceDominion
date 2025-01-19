import { writeData, readData, listenToChanges, isLobbyActive } from "./networking.js";


export function displayPublicLobbies() {
  const lobbiesDiv = document.getElementById("publicLobbiesList");
  
  listenToChanges('lobbies', (lobbies) => {
    lobbiesDiv.innerHTML = '';

    if (!lobbies) {
      lobbiesDiv.innerHTML = '<p>No public lobbies available</p>';
      return;
    }

    //converts to array and sorts by player count
    const lobbiesArray = Object.entries(lobbies)
      .filter(([_, data]) => data.public)
      .map(([code, data]) => ({
        code,
        playerCount: data.players ? Object.keys(data.players).length : 0
      }))
      //empties lobbies first
      .sort((a, b) => a.playerCount - b.playerCount);


    //displays sorted lobbies
    lobbiesArray.forEach(({code, playerCount}) => {
      const lobbyElement = document.createElement('div');
      lobbyElement.className = 'public-lobby-item';
      const isLobbyFull = playerCount >= 2;
      
      lobbyElement.innerHTML = `
        <span>Lobby: ${code} (${playerCount}/2 players)</span>
        <button onclick="window.joinPublicLobby('${code}')" 
                ${isLobbyFull ? 'disabled' : ''}>
          ${isLobbyFull ? 'Join' : 'Join'}
        </button>
      `;
      lobbiesDiv.appendChild(lobbyElement);
    });
  });
}



export function handlePublicLobby(lobbyCode, boardSize) {
  const isPublic = document.getElementById("isPublicLobby").checked;

  writeData(`lobbies/${lobbyCode}`, {
    boardSize: boardSize,
    createdAt: Date.now(),
    players: [],
    public: isPublic
  });
}


export function updatePublicLobbyPlayers(lobbyCode, playerId) {
  readData(`lobbies/${lobbyCode}`).then((lobby) => {
    if (lobby) {
      const updatedPlayers = lobby.players ? [...lobby.players, playerId] : [playerId];
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

export function updatePublicLobbiesList() {
  const lobbiesRef = database.ref('lobbies');
  lobbiesRef.on('value', (snapshot) => {
    const lobbies = snapshot.val();
    const lobbiesList = document.getElementById('publicLobbiesList');
    lobbiesList.innerHTML = '';

    if (lobbies) {
      Object.entries(lobbies).forEach(([code, data]) => {
        if (data && data.public && data.players?.player1?.online === true) {
          const lobbyElement = document.createElement('div');
          lobbyElement.textContent = `Lobby ${code} - ${data.players.player2 ? 'Full' : 'Available'}`;
          
          if (!data.players.player2) {
            const joinButton = document.createElement('button');
            joinButton.textContent = 'Join';
            joinButton.onclick = () => {
              isLobbyActive(code).then(active => {
                if (active) {
                  document.getElementById('lobbyCodeInput').value = code;
                  startGame(true);
                } else {
                  alert("This lobby is no longer available.");
                  location.reload();
                }
              });
            };
            lobbyElement.appendChild(joinButton);
          }
          lobbiesList.appendChild(lobbyElement);
        }
      });
    }
  });
}
