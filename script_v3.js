// Fetch words from the GitHub JSON file
async function fetchWordList() {
    const response = await fetch(
        "https://raw.githubusercontent.com/stuartpb/wordles/main/wordles.json"
    );
    if (!response.ok) {
        throw new Error("Failed to fetch the word list.");
    }
    const words = await response.json();
    return words;
}

// Game variables
let targetWord = "";
let currentRow = 0;
let currentCol = 0;
let attempts = [];
const maxAttempts = 6;

// Initialize the game
async function initializeGame() {
    // Clear game variables
    currentRow = 0;
    currentCol = 0;

    // Fetch a new target word
    const wordList = await fetchWordList();
    targetWord = wordList[Math.floor(Math.random() * wordList.length)];

    // Recreate the grid and keyboard
    createGrid();
    createKeyboard();

    // Reattach the key listeners for typing
    setupKeyListeners();

    // Clear any previous messages
    const message = document.getElementById("message");
    if (message) {
        message.textContent = "";
        message.style.display = "none";
    }
}

// Create the game grid
function createGrid() {
    const grid = document.getElementById("grid");
    grid.innerHTML = ""; // Clear existing grid
    attempts = [];
    for (let i = 0; i < maxAttempts; i++) {
        const row = [];
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement("div");
            tile.className = "tile";
            tile.id = `tile-${i}-${j}`;
            grid.appendChild(tile);
            row.push("");
        }
        attempts.push(row);
    }
}

// Create the on-screen keyboard
function createKeyboard() {
    const keyboard = document.getElementById("keyboard");
    keyboard.innerHTML = ""; // Clear any existing content

    const firstRow = [..."QWERTYUIOP"];
    const secondRow = [..."ASDFGHJKL"];
    const thirdRow = ["Enter", ..."ZXCVBNM", "Backspace"];

    const createKeyRow = (rowKeys) => {
        const rowElement = document.createElement("div");
        rowElement.classList.add("keyboard-row");
        rowKeys.forEach((key) => {
            const keyElement = document.createElement("button");
            keyElement.textContent = key === "Backspace" ? "⌫" : key;
            keyElement.classList.add("key");
            if (key === "Enter") keyElement.classList.add("enter");
            if (key === "Backspace") keyElement.classList.add("backspace");
            keyElement.dataset.key = key;
            keyElement.addEventListener("click", handleKeyInput);
            rowElement.appendChild(keyElement);
        });
        return rowElement;
    };

    // Append rows
    keyboard.appendChild(createKeyRow(firstRow));
    keyboard.appendChild(createKeyRow(secondRow));
    keyboard.appendChild(createKeyRow(thirdRow));
}

// Set up keyboard listeners for direct typing
function setupKeyListeners() {
    document.removeEventListener("keydown", handleKeyInput); // Remove old listener
    document.addEventListener("keydown", handleKeyInput); // Add new listener
}

function showMessage(text, persistent) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.style.display = "block";

    // Hide the message after 1.5 seconds if not persistent
    if (!persistent) {
        setTimeout(() => {
            message.style.display = "none";
        }, 1500);
    }
}

// Handle key input
function handleKeyInput(event) {
    const key = event.key || event.target.dataset.key;

    if (key === "Backspace") {
        if (currentCol > 0) {
            currentCol--;
            attempts[currentRow][currentCol] = "";
            updateGrid();
        }
        return;
    }

    if (key === "Enter") {
        if (currentCol === 5) {
            checkGuess();
        } else {
            showMessage("Complete Your Guess!");
        }
        return;
    }

    if (/^[a-zA-Z]$/.test(key)) {
        if (currentCol < 5) {
            attempts[currentRow][currentCol] = key.toUpperCase();
            currentCol++;
            updateGrid();
        }
    }
}

// Update the grid
function updateGrid() {
    attempts.forEach((row, rowIndex) => {
        row.forEach((letter, colIndex) => {
            const tile = document.getElementById(`tile-${rowIndex}-${colIndex}`);
            tile.textContent = letter || "";
        });
    });
}

// Update tile and keyboard colors
function updateTileColors() {
    const guess = attempts[currentRow];
    const targetArray = targetWord.split("");
    const colors = Array(5).fill("absent");

    guess.forEach((letter, index) => {
        if (letter === targetArray[index].toUpperCase()) {
            colors[index] = "correct";
            targetArray[index] = null;
        }
    });

    guess.forEach((letter, index) => {
        if (colors[index] === "absent" && targetArray.includes(letter.toLowerCase())) {
            colors[index] = "present";
            targetArray[targetArray.indexOf(letter.toLowerCase())] = null;
        }
    });

    colors.forEach((color, index) => {
        const tile = document.getElementById(`tile-${currentRow}-${index}`);
        tile.classList.add(color);
        updateKeyboardColor(guess[index], color);
    });

    currentRow++;
    currentCol = 0;
}

// Update keyboard colors based on the tile status
function updateKeyboardColor(letter, color) {
    const key = document.querySelector(`.key[data-key="${letter.toUpperCase()}"]`);
    if (color === "absent") {
        key.style.backgroundColor = "#ff4d4d"; // Red for absent
    } else if (color === "present") {
        key.style.backgroundColor = "#f3c237"; // Yellow for present
    } else if (color === "correct") {
        key.style.backgroundColor = "#78c478"; // Green for correct
    }
}

// Function to create a Play Again modal
function showPlayAgainModal(message) {
    const modal = document.createElement("div");
    modal.id = "play-again-modal";
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "20px";
    modal.style.borderRadius = "10px";
    modal.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)";
    modal.style.textAlign = "center";
    modal.style.zIndex = "1000";

    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    messageElement.style.marginBottom = "20px";
    modal.appendChild(messageElement);

    const playAgainButton = document.createElement("button");
    playAgainButton.textContent = "Play Again";
    playAgainButton.style.padding = "10px 20px";
    playAgainButton.style.fontSize = "16px";
    playAgainButton.style.cursor = "pointer";
    playAgainButton.style.border = "none";
    playAgainButton.style.backgroundColor = "#2575fc";
    playAgainButton.style.color = "#fff";
    playAgainButton.style.borderRadius = "5px";
    playAgainButton.addEventListener("click", () => {
        document.body.removeChild(modal);
        initializeGame();
    });
    modal.appendChild(playAgainButton);
    document.body.appendChild(modal);
}

// Check the guess
async function checkGuess() {
    const guess = attempts[currentRow].join("").toLowerCase();

    if (guess.length !== 5) {
        showMessage("Guess must be 5 letters!", false);
        return;
    }

    const isValid = await validateWord(guess);
    if (!isValid) {
        showMessage("Not in Dictionary!", false);
        return;
    }

    updateTileColors();
    if (guess === targetWord) {
        showMessage("You Won!", true);
        confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.6 },
        });
        setTimeout(() => showPlayAgainModal("Congratulations! Want to play again?"), 2000);
    } else if (currentRow === maxAttempts) {
        showMessage(`Game Over: The word was ${targetWord.toUpperCase()}`, true);
        setTimeout(() => showPlayAgainModal("Game Over! Want to try again?"), 2000);
    }
}

// Validate the word
async function validateWord(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        return response.ok;
    } catch {
        return false;
    }
}

// Initialize the game
initializeGame();
