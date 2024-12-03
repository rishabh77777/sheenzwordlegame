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
    const wordList = await fetchWordList();
    targetWord = wordList[Math.floor(Math.random() * wordList.length)];
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

// Create the on-screen keyboard
function createKeyboard() {
    const keyboard = document.getElementById("keyboard");
    const firstRow = [..."QWERTYUIOP"];
    const secondRow = [..."ASDFGHJKL"];
    const thirdRow = ["Backspace", ..."ZXCVBNM"];

    const addKeys = (row) => {
        row.forEach((key) => {
            const keyElement = document.createElement("button");
            keyElement.textContent = key === "Backspace" ? "⌫" : key;
            keyElement.classList.add("key");
            if (key === "Enter") keyElement.classList.add("enter");
            if (key === "Backspace") keyElement.classList.add("backspace");
            keyElement.dataset.key = key;
            keyElement.addEventListener("click", (e) => {
                handleKeyInput(e);
            });
            keyboard.appendChild(keyElement);
        });
    };

    addKeys(firstRow);
    keyboard.appendChild(document.createElement("br"));
    addKeys(secondRow);
    keyboard.appendChild(document.createElement("br"));
    addKeys(thirdRow);
}

// Set up keyboard listeners for direct typing
function setupKeyListeners() {
    document.addEventListener("keydown", handleKeyInput);
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
            document.getElementById("message").textContent =
                "Complete your guess before submitting!";
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
        key.style.backgroundColor = "#ff4d4d"; // Mark eliminated letters as red
    } else if (color === "present") {
        key.style.backgroundColor = "#f3c237"; // Yellow for present
    } else if (color === "correct") {
        key.style.backgroundColor = "#78c478"; // Green for correct
    }
}

// Check the guess
async function checkGuess() {
    const guess = attempts[currentRow].join("").toLowerCase();
    const message = document.getElementById("message");

    if (guess.length !== 5) {
        message.textContent = "Guess must be 5 letters!";
        return;
    }

    const isValid = await validateWord(guess);
    if (!isValid) {
        message.textContent = "Not in word list!";
        return;
    }

    updateTileColors();
    if (guess === targetWord) {
        message.textContent = "Great! You guessed the word!";
    } else if (currentRow === maxAttempts) {
        message.textContent = `Game Over! The word was: ${targetWord}`;
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