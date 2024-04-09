/**
 * @AUTHOR: Param - Jiaxi - Evan
 * @FILE: script.js
 * @Instructor: Ben Dicken
 * @ASSIGNMENT: Final Project - Wordle
 * @COURSE: CSc 337; Spring 2023
 * @Purpose: Wordle Logic and Buttons needed for wordle.
 */

let dailyWord = "";
let practiceWord = "";
let challengeWord = "";
let username = "";
let currTheme = "";
let currMode = "standard";
let totalGuess = 6;

readCookieVal(document.cookie.split("%22"));
getDailyWord();

function printDailyWord() {
  console.log("Daily Word:", dailyWord);
}

function printPracticeWord() {
  console.log("Practice Word:", practiceWord);
}

function printChallengeWord() {
  console.log("Challenge Word:", challengeWord);
}

function removeElementsByClass(className) {
  const elements = document.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }
}

function closeLeaderBoard() {
  removeElementsByClass("lrow");
  document.getElementById("Leaderboard").style.visibility = "hidden";
}

function loadLeaderBoard() {
  /*
        Description: This function runs the code
                      needed to show the leaderboard
                      to the screen

        Parameters: n/a

    */

  var standardHtml = "";
  var challengeHtml = "";

  fetch("/loadLeaderboard/standard", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => {
      
      let parsedResponse = [];
      let zerosEntries = [];

      for (var v = 0; v < response.length; v++) {
        let entry = JSON.parse(response[v]);

        if (
          entry.score == "0" &&
          entry.gamesPlayed == "0" &&
          entry.gamesWon == "0"
        ) {
          zerosEntries.push(entry);
        } else {
          parsedResponse.push(entry);
        }
      }

      let sortedEntries = parsedResponse.sort(function (a, b) {
        return parseFloat(a.score) === parseFloat(b.score)
          ? b.gamesWon - a.gamesWon
          : parseFloat(b.score) - parseFloat(a.score);
      });

      let sortedResponses = sortedEntries.concat(zerosEntries);

      for (var j = 0; j < sortedResponses.length; j++) {
        let row = sortedResponses[j];

        let name = row.name;
        let score = String(row.score);
        let numGames = String(row.gamesPlayed);
        let numWins = String(row.gamesWon);

        standardHtml +=
          "<tr class='lrow'><td>" +
          name +
          "</td><td>" +
          score +
          "</td><td>" +
          numGames +
          "</td><td>" +
          numWins +
          "</td></tr>";
      }

      document
        .getElementById("standardTable")
        .insertAdjacentHTML("beforeend", standardHtml);
    });

  fetch("/loadLeaderboard/challenging", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => {
      
      let parsedResponse = [];
      let zerosEntries = [];

      for (var g = 0; g < response.length; g++) {
        let entry = JSON.parse(response[g]);

        if (
          entry.score == "0" &&
          entry.gamesPlayed == "0" &&
          entry.gamesWon == "0"
        ) {
          zerosEntries.push(entry);
        } else {
          parsedResponse.push(entry);
        }
      }

      let sortedEntries = parsedResponse.sort(function (a, b) {
        return parseFloat(a.score) === parseFloat(b.score)
          ? b.gamesWon - a.gamesWon
          : parseFloat(b.score) - parseFloat(a.score);
      });

      let sortedResponses = sortedEntries.concat(zerosEntries);

      for (var h = 0; h < sortedResponses.length; h++) {
        let row = sortedResponses[h];

        let name = row.name;
        let score = String(row.score);
        let numGames = String(row.gamesPlayed);
        let numWins = String(row.gamesWon);

        challengeHtml +=
          "<tr class='lrow'><td>" +
          name +
          "</td><td>" +
          score +
          "</td><td>" +
          numGames +
          "</td><td>" +
          numWins +
          "</td></tr>";
      }

      document
        .getElementById("challengeTable")
        .insertAdjacentHTML("beforeend", challengeHtml);
    });
}

let currWord = dailyWord;

// Wordle logic

var standardGameOver = false;
var challengeGameOver = false;

var validSpots = [];
var validLetters = [];
var nonValid = [];
var clicks = [];

const wordleGame = [
  ["", "", "", "", ""],
  ["", "", "", "", ""],
  ["", "", "", "", ""],
  ["", "", "", "", ""],
  ["", "", "", "", ""],
  ["", "", "", "", ""],
];

var currentRow = 0;
var currentCol = 0;
var wordCheck = true;

function readCookieVal(cookie) {
  /*
      Description:  This function takes in a string
                    value of a decoded cookie value
                    and returns the values in an array

      Parameters: cookie - a decoded cookie value string

  */
  username = cookie[3];
  let sid = cookie[6].slice(3, 8);
  return [username, sid];
}

function closeGame(lost = false) {
  /*
        Description: This function runs the
                     code needed to shutdown 
                     the game proccess when 
                     needed

        Parameters: lost - indicator wheter the
                          user won the game or not

    */

  if (currMode == "standard") {
    standardGameOver = true;
  }
  if (currMode == "challenging") {
    challengeGameOver = true;
  }

  if (lost) {
    document.getElementById("board").style.visibility = "hidden";
    var date = new Date();
    date.setDate(date.getDate() + 1);

    if (currMode == "standard") {
      html_to_insert =
        '<div id="winMessage"><h2> You Lost :( Word: ' +
        currWord +
        "</h2> <p> Come back at </p> <h4> " +
        String(date).slice(0, 15) +
        "</h4> <p> to try and guess a new word!</p></div>";
    }

    if (currMode == "challenging") {
      html_to_insert =
        '<div id="winMessage"><h2> You Lost :( Word: ' +
        challengeWord +
        "</h2> <p> Come back at </p> <h4> " +
        String(date).slice(0, 15) +
        "</h4> <p> to try and guess a new word!</p></div>";
    }

    document
      .getElementById("wordle")
      .insertAdjacentHTML("beforeend", html_to_insert);

  } else {
    document.getElementById("board").style.visibility = "hidden";
    document.getElementById("keyboard").style.visibility = "hidden";
    var date = new Date();
    date.setDate(date.getDate() + 1);

    if (currMode == "standard") {
      html_to_insert =
        '<div id="winMessage"><h2> You Won!! Word: ' +
        currWord +
        "</h2> <p> Come back at </p> <h4> " +
        String(date).slice(0, 15) +
        "</h4> <p> to try and guess a new word!</p></div>";
    }

    if (currMode == "challenging") {
      html_to_insert =
        '<div id="winMessage"><h2> You Won!! Word: ' +
        challengeWord +
        "</h2> <p> Come back at </p> <h4> " +
        String(date).slice(0, 15) +
        "</h4> <p> to try and guess a new word!</p></div>";
    }

    document
      .getElementById("wordle")
      .insertAdjacentHTML("beforeend", html_to_insert);
  }
}

function resetBoard() {
  /*
        Description: This function runs the 
                      code neccesary to reset
                      the board when needed

        Parameters: n/a

    */

  document.getElementById("board").style.visibility = "visible";
  document.getElementById("keyboard").style.visibility = "visible";

  let tiles = document.querySelectorAll(".tiles");

  for (var m = 0; m < tiles.length; m++) {
    tiles[m].style.backgroundColor = "grey";
    tiles[m].innerText = "";
  }

  let keys = document.querySelectorAll(".letters");
  for (var m = 0; m < keys.length; m++) {
    keys[m].style.visibility = "visible";
  }

  winMessage = document.getElementById("winMessage");

  if (winMessage) {
    winMessage.remove();
  }

  currentRow = 0;
  currentCol = 0;
  totalGuess = 6;
  wordCheck = true;

  validSpots = [];
  validLetters = [];
  nonValid = [];
  clicks = [];
  loadGame(username, true);

}

function checkRightWord(username, clicked_id, finalRow = false, sim = false) {
  /*
        Description: This function checks if the guessed word
                      is the correct word or not.

        Parameters: username - name of the current user
                    clicked_id - the letter that the user just clicked
                    finalRow - if the user is on the final row or not
                    sim - if the clinet code ran updateTiles to get to 
                          this function

    */
  var guessedWord = "";

  if (finalRow) {
    for (var w = 0; w < wordleGame[currentCol - 1].length; w++) {
      guessedWord += wordleGame[currentCol - 1][w];
    }
  } else {
    for (var w = 0; w < wordleGame[currentCol].length; w++) {
      guessedWord += wordleGame[currentCol][w];
    }
  }

  if (guessedWord.trim() == currWord.trim() && !sim) {
    wordFalse = true;
    var url = "/setDaily/" + username + "/" + currMode;

    fetch(url)
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        createWordleGame();
        logGame(username, "true");

        if (currMode != "practice") {
          document.getElementById(currMode).onclick = "";
          document.getElementById(currMode).innerText = "Unlocks at Midnight";
        }

        totalGuess = 6;
        closeGame(false);

      });
      changeColor(clicked_id);
      return true;
    
  } else {

    if (finalRow && !sim) {
      createWordleGame();
      logGame(username, "false");

      if (currMode != "practice") {
        document.getElementById(currMode).onclick = "";
      }

      totalGuess = 6;
      closeGame(true);
    }
    changeColor(clicked_id);
    return false
  }

  

}

function changeColor(clicked_id) {
  /*
        Description: This function changes the color of
                     the tiles to reflect the users progress

        Parameters: clicked_id - the letter the user just clicked

    */

  // This chunk updates the colors of the previous rows' tiles so that the
  // user knows which letters the got in the right spot and which ones were valid
  if (currentRow === 5 && clicked_id === "Enter") {
  
    for (var t = 0; t < validLetters.length; t++) {
      wordCheck = false;
      validLetters[t].style.backgroundColor = "#dada00";
    }

    for (var r = 0; r < validSpots.length; r++) {
      validSpots[r].style.backgroundColor = "green";
    }

    currentCol++;
    currentRow = 0;
  }

  for (var y = 0; y < nonValid.length; y++) {
    wordCheck = false;

    document.getElementById(nonValid[y]).style.visibility = "hidden";
  }

  validSpots = [];
  validLetters = [];
  nonValid = [];
  clicks = [];

}

function runBackspace() {
  /*
        Description: This resets the board to
                      all of its previous states
                      when the user wants to backspace

        Parameters: n/a

    */

  let clicked = clicks[currentRow - 1];
  clicks.pop();

  wordleGame[currentCol][currentRow - 1] = "";

  if (currWord.includes(clicked)) {

    if (currWord[currentRow - 1] == clicked) {
      validSpots.pop();
    } else {
      validLetters.pop();
    }

  } else {
    nonValid.pop();
  }

  currentRow--;
  let rows = document.querySelectorAll(".row");
  let currentTile = rows[currentRow].querySelectorAll("div")[currentCol];
  currentRowElement = rows[currentRow];
  currentTile.innerText = "";

}

function updateGameHistory(username) {
  /*
        Description: This function updates 
                      the users last 6 games
                      history

        Parameters: username - current users name

    */

    let url = "/updateHistory/" + username;
    
    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then(async (response) => {

        if (response.length == 0) {
          
          let date = new Date();
          console.log(String(date) + ": NO HISTORY TO UPDATE");

        } else {

          for (var f = 0; f < response.length; f++) {

            let log = response[f].split(':')
            let logMode = log[0].charAt(0).toUpperCase() + log[0].slice(1);
            let logWord = log[1].charAt(0) + log[1].slice(1).toLowerCase();
            let logResult = log[2];
            
            document.getElementById('mode' + String(f)).innerText = logMode;
            document.getElementById('word' + String(f)).innerText = logWord;
            document.getElementById('result' + String(f)).innerText = logResult;

            let date = new Date();
            console.log(String(date) + ": GAME HISTORY UPDATED");

          }

        }
      });
}

function logGame(username, gameResult) {
  /*
        Description: This logs the game to the
                      server for multiple inspections
                      but mainly to keep track of
                      game progress

        Parameters: username - current users name
                    gameResult - the result of the users game

    */

  let url =
    "/logGame/" + username + "/" + currWord + "/" + gameResult + "/" + currMode;

  fetch(url)
    .then((response) => response.text())
    .then((text) => {
      let date = new Date();
      console.log(String(date) + ": " + text);
    })
    .catch((error) => console.error(error));

}

const getUserId = () => {
  /*
        Description: When called, grabs the
                      users object ID in 
                      mongoose database

        Parameters: n/a

    */

  return new Promise((resolve, reject) =>
    fetch("/getUserId/" + username)
      .then((res) => res.text())
      .then((data) => resolve(data))
      .catch((err) => reject(err))
  );
};

//Functions are not used but still provide functionality

// const userDailyCheck = () => {
//   //let username = readCookieVal(document.cookie.split("%22"))[0];

//   return new Promise((resolve, reject) =>
//     fetch("/userDailyCheck/" + username)
//       .then((res) => res.text())
//       .then((data) => resolve(data))
//       .catch((err) => reject(err))
//   );
// };

// const userChallengeCheck = () => {
//   //let username = readCookieVal(document.cookie.split("%22"))[0];

//   return new Promise((resolve, reject) =>
//     fetch("/userChallengeCheck/" + username)
//       .then((res) => res.text())
//       .then((data) => resolve(data))
//       .catch((err) => reject(err))
//   );
// };

async function saveProgress(wordleArr) {
  /*
        Description: This function saves the 
                      users progress by each row and
                      not by the full game so that
                      if the user reloads the site
                      their progress is loaded in
                      from a seperate function

        Parameters: wordleArr - current grid with letters
                                typed by the user

    */

  let url = "/saveProgress/" + currMode;

  let overCheck;

  if (currMode != 'practice') {

    if (currMode == "standard") {
      overCheck = standardGameOver;
    }
    if (currMode == "challenging") {
      overCheck = challengeGameOver;
    }
  
    var id = await getUserId();
  
    let data = {
      playerId: id,
      mode: currMode,
      gameFinished: String(overCheck),
      SavedArray: wordleArr,
    };

    let p = fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    p.then(() => {
      let date = new Date();
      console.log(String(date) + ": PROGRESS SAVED");
    });
    p.catch(() => {
      alert("something went wrong");
    });

  }
  
}

function updateTiles(clicked_id, sim = false) {
  /*
        Description: This function runs every time 
                      a button is pressed and reflects
                      the letter pressed in the grid and
                      logs the users current native/active
                      game progress

        Parameters: clicked_id - the id of the button just pressed
                                  which is also the letter tied to the
                                  button
                            sim - if the function was ran from the user typing
                                  or through function loadGame() on site load

    */

  username = readCookieVal(document.cookie.split("%22"))[0];
  
  var overCheck = false;

  if (currMode == "standard" && !sim) {
    overCheck = standardGameOver;
  }
  if (currMode == "challenging" && !sim) {
    overCheck = challengeGameOver;
  }

  if (!overCheck) {

    if (currentRow == 5) {

      if (clicked_id === "Enter") {
        var wordRight = checkRightWord(username, clicked_id, false, sim);

        if (!sim) {
          saveProgress(wordleGame);
          totalGuess--;
        }

        if (currentCol == 6 && !wordRight) {
          let temp = checkRightWord(username, clicked_id, true, sim);
        }

      }

      if (clicked_id === "←" && currentRow >= 1) {
        runBackspace();
      }

    } else {

      if (clicked_id === "←" && currentRow >= 1) {
        runBackspace();
      }

      if (
        currentRow <= 5 &&
        clicked_id !== "←" &&
        clicked_id !== "Enter" &&
        !overCheck
      ) {
        clicks.push(clicked_id);

        let rows = document.querySelectorAll(".row");
        let currentRowElement = rows[currentRow];

        if (currentRowElement) {

          let currentTile = rows[currentRow].querySelectorAll("div")[currentCol];
          var word;
          word = currWord;

          if (word.includes(clicked_id)) {

            if (word[currentRow] == clicked_id) {
              validSpots.push(currentTile);
            } else {
              validLetters.push(currentTile);
            }

          } else {
            nonValid.push(clicked_id);
          }

          wordleGame[currentCol][currentRow] = clicked_id;
          currentTile.textContent = clicked_id;
          currentRow++;
        }
      }
    }
  } else {
    console.log("Game Over");
  }
}

function loadGame(user, onSwitch = false) {
  /*
        Description: This function is either ran
                      on startup or through resetting 
                      the board but its main purpose
                      is to load a games progress to the
                      site if there is any or when the site 
                      loads

        Parameters: user - the current user to check by
                    onSwitch - if the function is being called
                                on gamemode switch

    */
  
  fetch("/checkPrgoress/" + user + "/" + currMode, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then(async (response) => {

      if (response.length == 6) {

        var validEntry = false;

        for (var cRow = 0; cRow < response.length; cRow++) {
          for (var letter = 0; letter < response[cRow].length; letter++) {

            if (response[cRow][letter] != "") {
              updateTiles(response[cRow][letter], true);
              validEntry = true;
            } else {
              validEntry = false;
            }

          }

          if (validEntry) {
            updateTiles("Enter", true);
          }

        }
      } else {

        let result = response.split(",");

        if (result[0] == "true") {
          document.getElementById("standard").onclick = "";
          document.getElementById("standard").innerText = "Unlocks at Midnight";

          if (!onSwitch) {
            changeMode("Practice Mode");
          }

        }

        if (result[1] == "true") {
          document.getElementById("challenging").onclick = "";
          document.getElementById("challenging").innerText ="Unlocks at Midnight";

          if (!onSwitch) {
            changeMode("Practice Mode");
          }
          
        }
      }
    });
}

function getDailyWord() {
  return fetch("/getDailyWord")
    .then((response) => response.text())
    .then((word) => {
      currWord = word;
      dailyWord = word;
      printDailyWord();
      return word;
    })
    .catch((error) => console.error(error));
}

const practiceModeElement = document.querySelector("li.lisItem:nth-child(4)"); // select the fourth li element
practiceModeElement.addEventListener("click", () => {
  fetch("/getPracticeWord")
    .then((response) => response.text())
    .then((word) => {
      practiceWord = word;
      currWord = word;
      printPracticeWord();
      return word;
    })
    .catch((error) => console.error(error));
});

// code on load of wordle.html goes here, anytihing above the event listener above will run on login page
loadGame(username);
updateGameHistory(username)

const challengeModeElement = document.querySelector("li.lisItem:nth-child(3)"); // select the third li element
challengeModeElement.addEventListener("click", () => {
  fetch("/getChallengeWord")
    .then((response) => response.text())
    .then((word) => {
      challengeWord = word;
      currWord = word;
      printChallengeWord();
      return word;
    })
    .catch((error) => console.error(error));
});

function changeMode(cmd) {
  /*
        Description: This function changes the current
                      gamemode

        Parameters: cmd - a string of the gamemode to switch to

    */

  if (cmd == "Leaderboard") {

    let visibility = document.getElementById("Leaderboard").style.visibility;

    if (visibility == "" || visibility == "hidden") {
      loadLeaderBoard();
      document.getElementById("Leaderboard").style.visibility = "visible";
    }

  } else if (cmd == "Standard Mode") {
    currMode = "standard";
    currWord = dailyWord;
    currentRow = 0;
    currentCol = 0;
    document.getElementById("modeText").innerText = "Standard Mode";
    resetBoard();

  } else if (cmd == "Challenging Mode") {
    currMode = "challenging";
    currentRow = 0;
    currentCol = 0;
    currWord = challengeWord;
    document.getElementById("modeText").innerText = "Challenging Mode";
    resetBoard();

  } else if (cmd == "Practice Mode") {
    currMode = "practice";
    currentRow = 0;
    currentCol = 0;
    currWord = practiceWord;
    document.getElementById("modeText").innerText = "Practice Mode";
    resetBoard();

  }
}

// Theme switcher
function toggleDarkMode() {
  const body = document.querySelector("body");
  body.classList.toggle("dark-mode");
  const isDarkMode = body.classList.contains("dark-mode");
  localStorage.setItem("dark-mode", isDarkMode);
}

function toggleDarkMode() {
  const body = document.querySelector("body");
  if (body.classList.contains("dark-mode")) {
    body.classList.remove("dark-mode");
    localStorage.setItem("dark-mode", false);
  } else {
    body.classList.add("dark-mode");
    localStorage.setItem("dark-mode", true);
  }
}

// Check if dark mode preference is saved in local storage and set it accordingly
const isDarkMode = localStorage.getItem("dark-mode") === "true";
if (isDarkMode) {
  document.querySelector("body").classList.add("dark-mode");
}

function createWordleGame() {

  let url = "/create/wordleGame/";

  let data = {
    playerName: username,
    word: currWord,
    gameMode: currMode,
    totalGuess: totalGuess,
    GuessArray: wordleGame,
  };

  let p = fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
  p.then(() => {
    updateGameHistory(username)
  });
  p.catch(() => {
    let date = new Date();
    console.log(String(date) + ": *** ERROR ***");
    alert("*** ERROR OCCURED ***");
  });

}

/**
 * The purpose of this method is to
 * show a popup that contains the rules.
 */
function showPopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "block";
}

/**
 * The purpose of this method is to
 * close a popup that contains the rules.
 */
function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";
}