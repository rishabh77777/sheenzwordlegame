// Game variables
let targetWord = "";
let currentRow = 0;
let currentCol = 0;
let attempts = [];
const maxAttempts = 6;

const chosenWord = "happy"; // Change this to any 5-letter word you want

// Initialize the game
async function initializeGame() {
    targetWord = chosenWord.toLowerCase();
    createGrid();
    setupKeyListeners();
    createKeyboard();

    const submitButton = document.getElementById("submit-button");
    submitButton.addEventListener("click", () => {
        if (currentCol === 5) {
            checkGuess();
        } else {
            document.getElementById("message").textContent =
                "Complete your guess before submitting!";
        }
    });
}

// Create the game grid
function createGrid() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
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

function createKeyboard() {
    const keyboard = document.getElementById("keyboard");
    keyboard.innerHTML = ""; // Clear any existing content
  
    const firstRow = [..."QWERTYUIOP"];
    const secondRow = [..."ASDFGHJKL"];
    const thirdRow = ["Enter", ... "ZXCVBNM", "Backspace"];
  
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
    document.addEventListener("keydown", handleKeyInput);
}

function showMessage(text, type, persistent) {
    const message = document.getElementById("message");
    message.textContent = text; // Add type and animation
    message.className = `message ${type}`;
    message.style.display = "block"; // Make the message visible

    // Hide the message after 1.5 seconds
    if (!persistent){
    setTimeout(() => {
        message.style.display = "none";
        message.className = "message"; // Reset class
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
            showMessage("Complete Your Guess!",false);
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
    if (key) {
        if (color === "absent") {
            key.style.backgroundColor = "#ff4d4d"; // Mark eliminated letters as red
        } else if (color === "present") {
            key.style.backgroundColor = "#f3c237"; // Yellow for present
        } else if (color === "correct") {
            key.style.backgroundColor = "#78c478"; // Green for correct
        }
    }
}
// Check the guess
async function checkGuess() {
    const guess = attempts[currentRow].join("").toLowerCase();
    const message = document.getElementById("message");

    message.className = "message";

    if (guess.length !== 5) {
        showMessage("Guess must be 5 letters!",false);
        return;
    }

    const isValid = await validateWord(guess);
    if (!isValid) {
        showMessage("Not In Dictionary!",false);
        return;
    }

    updateTileColors();
    if (guess === targetWord) {
        showMessage("You Won!!")
        
        // Trigger celebration animation
        const grid = document.getElementById("grid");
        grid.classList.add("celebrate");

        // Optional: Trigger confetti effect
        confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.6 },
        });
    } else if (currentRow === maxAttempts) {
        showMessage(`Game Over! The word was: ${targetWord}`, true)
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

const newGameButton = document.getElementById("new-game-button");
newGameButton.addEventListener("click", () => {
    location.reload(); // Refresh the page to start a new game
});
