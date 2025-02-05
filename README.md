# DICE DOMINION

A strategic, multiplayer dice-based board game where players take turns rolling two ***DICE***, placing blocks whose size is based on the results of the dice on a grid, and place as many as possible in an attempt to ***DOMINATE*** the board! Play against friends in private or public lobbies and destroy them!

### Teammates

* **Can Hacioglu** (1354982)
* **Berke Sevenler** (1378788)
* **Elvin Alirzayev**
* **Sabina Grisi** 

## Table of contents

* [Introduction](#introduction)
* [Installation](#installation)
* [Quick start](#quick-start)
* [Usage](#usage)
* [Known issues and limitations](#known-issues-and-limitations)
* [Getting help](#getting-help)
* [Contributing](#contributing)
* [License](#license)
* [Acknowledgments](#acknowledgments)



## Introduction

Welcome to **Dice Dominion**, a strategy-based multiplayer board game that challenges players to think ahead, adapt, and compete for dominance. This project was developed as part of our university coursework called **Bachelor Project**, with the goal of designing *"awesone software as a team to achieve greater results than you would be able to on your own"*.   

The idea for **Dice Dominion** came from dice that one of us had at home, a notebook, two stabilo pens, and our desire to create a game that we could enjoy together, inspired by classic tile-placement mechanics and bored-student classroom games with an added element of chance through dice rolls.

### What does this software do?  
- Provides an interactive, web-based board game where players take turns rolling dice and placing blocks.  
- Supports multiplayer functionality, allowing 2 players to compete in real-time.  
- Includes a customizable grid (from 10 up to 20 cells) and player colors for a personalized experience.  

We have designed **Dice Dominion** with simplicity in mind, making it easy to learn while still offering depth for strategic play. Whether you're a casual player or a board game enthusiast, we hope this game brings whoever is playing it as much enjoyment as it brought us while developing it.  

For more details, please explore the sections below.



## Installation

### **1️. Clone the Repository**
```sh
git clone https://github.com/berkesevenler/DiceDominion.git
```
and
``` sh
cd DiceDominion
```

### **2️. Install Dependencies: Dice Dominion now uses Firebase for online multiplayer. You will need to install the necessary dependencies:**
```sh
npm install
```

### **3️. Set Up Firebase**
- Go to Firebase Console and create a new project.
- Set up Firebase Realtime Database and Authentication.
- Copy your Firebase configuration and update the firebaseConfig object in `index.html`.

### **4️. Run the Game** 
To start the game locally with Firebase support, you can use a local server:
npm start
This will start the game, and you can access it via http://localhost:3000.



## Quick Start

### Starting the Game

Once you open [the game in your browser](https://berkesevenler.github.io/HostingTest-DiceDominion/), you'll be greeted with the game board. You can either:

1. **Create a Lobby:** Choose the grid size, select a color for your blocks, and start a lobby. You will then wait for another player to join, either through an invitation link or by finding your lobby in the public list.
2. **Join a Lobby:** Select your color and join an existing lobby by either clicking an invitation link or selecting a public lobby.

### How to Play

- Start from a designated corner:
  - **Player 1:** Upper left corner.
  - **Player 2:** Lower right corner.
- Roll the dice to determine your block size.
- Press **R** to rotate blocks before placing them.
- Your next block must be connected to one of your previous blocks.
- You can skip your turn up to **three times** if you have no valid moves.
- The game ends when no moves are left.
- The first player to **occupy at least half of the grid** is declared the winner!

### After the Game

- If someone wins, the game automatically ends, and all players are redirected to the main menu.
- If you want to leave mid-game, you can use the **Exit** button, which will prompt a warning message before confirming.
- Once the game ends or you exit, you return to the menu, and the cycle repeats.



## Usage

- **Rolling Dice:** Click the "Roll Dice" button to determine the size of your block.
- **Placing Blocks:** Click on the board to place your block. It must be connected to your existing territory.
- **Rotating Blocks:** Press **R** before placing a block to rotate it.
- **Skipping Turns:** You can skip up to **3 times** if you have no valid moves.
- **Winning:** The game ends when no moves are left. The player with the most blocks wins!



## Known issues and limitations

* The game currently requires two players; no AI opponents are implemented.
* Some UI/UX elements may need further optimization for mobile devices, and smaller screen sizes than a laptop.
* There is currently no timer implemented to avoid a turn being dragged for too long.
* No login implemented. Free to play whenever.
* It's not keyboard-friendly.
* ...



## Getting help

If you encounter any issues, please come to our [Discord](https://discord.gg/wT3dqwhp) and let us know about it in *i-found-a-problem*. We would love to hear it from you, so you can have an enjoyable experience with the game.

Or you can also reach out to our Project Manager via email at **can.hacioglu@lt.hs-fulda.de**.



## Contributing

We welcome contributions! If you'd like to improve the game, feel free to:
 - join our [Discord](https://discord.gg/wT3dqwhp) to collaborate with other contributors to see if something is already being worked on.
 - fork the repository.
 - create a new branch for your feature or fix.
 - submit a pull request with a clear explanation of your changes.



## License

This project is licensed under the MIT License.



## Acknowledgments

We would like to express our gratitude to everyone who contributed to this project, whether through feedback, testing, or coding. A special thanks to our professors and classmates for their support and insights.

Our 'thank you's include the following: 
* [Tracesoccer](https://tracesoccer.io/) to help us see what needs to be done for a cute UI design.
* **Google** for their fonts.
* **Firebase** for providing real-time database services.
* [READMINE](https://github.com/mhucka/readmine?tab=readme-ov-file) for providing us the structure for this humble README.md file
* ...


Finally, we would like to acknowledge the original inspiration behind this game. It was initially conceived as a fun way for one of our team members and their partner to spend more time playing together on weekends. What started as a simple idea, just a small, lighthearted game, was brought up in our first team meeting as a potential project for this course. Since then, it has evolved from a physical game to a virtual one! And we are excited to share it with others.

---

We hope you enjoy playing it as much as we enjoyed developing it!

