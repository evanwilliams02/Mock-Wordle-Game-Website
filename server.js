/**
 * @AUTHOR: Param - Jiaxi - Evan
 * @FILE: server.js
 * @Instructor: Ben Dicken
 * @ASSIGNMENT: Final Project - Wordle
 * @COURSE: CSc 337; Spring 2023
 * @Purpose: This file communicates the client side data 
 *           the digital ocean server. This file transfer 
 *           and sets data for multiple scheme types: 
 *           WordleGame, Player, and SavedProgress. It also
 *           holds and transfers data for the login system.
 */

const http = require("http");
const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const crypto = require("crypto");
const cron = require("node-cron");
const cm = require("./customsessions");
const { monitorEventLoopDelay } = require("perf_hooks");

//Global Mongoose connection
//const connection_string = "mongodb+srv://wordle-project:PdgWW3Dk63S6QgTB@cluster0.7e18m6v.mongodb.net/test";

//Local Mongoose connection
const connection_string = "mongodb://127.0.0.1/wordle";

const app = express();
const httpServer = http.createServer(app);
const io = require("socket.io")(httpServer);

// connect to the server
mongoose.connect(connection_string, { useNewUrlParser: true });

mongoose.connection.on("error", () => {
  console.log("There was a problem connecting to mongoDB");
});

// https://gist.github.com/dracos/dd0668f281e685bad51479e5acaadb93
// valid wordle words dictionary found on github
const wordleWords = fs
  .readFileSync("./valid-wordle-words.txt")
  .toString()
  .split("\n");

let dailyWord;
let practiceWord;
let challengeWord;
let challengeAmount = 1;

io.on("connection", (socket) => {
  let date = new Date();
  console.log(String(date) + ": USER CONNECTION");
});

var WordleSchema = new mongoose.Schema({
  playerName: String,
  word: String,
  gameMode: String,
  totalGuess: Number,
  GuessArray: [[String]],
});

var WordleGame = mongoose.model("WordleGame", WordleSchema);

var PlayerSchema = new mongoose.Schema({
  username: String,
  salt: String,
  hash: String,
  dailyDone: String,
  challengeDone: String,
  gamesPlayed: [{ type: mongoose.Schema.Types.ObjectId, ref: "WordleGame" }],
  gamesWon: [{ type: mongoose.Schema.Types.ObjectId, ref: "WordleGame" }],
});

var Player = mongoose.model("Player", PlayerSchema);

var ProgressSchema = new mongoose.Schema({
  playerId: String,
  mode: String,
  gameFinished: String,
  SavedArray: [[String]],
});

var SavedProgress = mongoose.model("SavedProgress", ProgressSchema);

function selectDailyWord(serverStart = false) {
  /*
        Description: This function sets a daily word
                      every midnight

        Parameters: serverStart - boolean indicator for if
                                  the function is called when
                                  the server starts rather than
                                  the consecutive calls

    */

  // Get a random index from the array
  const randomIndex = Math.floor(Math.random() * wordleWords.length);

  // Get the word at the random index
  dailyWord = wordleWords[randomIndex].toUpperCase();

  console.log("The daily word is: " + dailyWord);

  
    
    // remove all in progress documents because of new word
    SavedProgress.deleteMany({ mode: "standard" })
      .then(function () {
        let date = new Date();
        console.log(String(date) + ": STANDARD PROGRESS RESET");
      })
      .catch(function (error) {
        console.log(error);
      });

    //set every user's daily done to false
    let p1 = Player.find({}).exec();
    p1.then((results) => {
      for (var d = 0; d < results.length; d++) {
        results[d].dailyDone = "false";
        results[d].save();
        console.log(results[d].username)
        console.log(results[d].dailyDone)
      }
    });
    p1.catch((error) => {
      res.end("daily boolean clear failure");
    });

  

  // Emit a socket.io event to the client-side with the new word
  io.emit("newWord", dailyWord);
}

function selectPracticeWord() {
  /*
        Description: This function selects a pratice word
                      every time the user presses the 
                      practice mode button.

        Parameters: n/a

    */

  // Get a random index from the array
  const randomIndex = Math.floor(Math.random() * wordleWords.length);

  // Get the word at the random index
  practiceWord = wordleWords[randomIndex].toUpperCase();

  console.log("The practice word is: " + practiceWord);
}

function selectChallengeWord(serverStart = false) {
  /*
        Description: This function sets a daily challenge word
                      every midnight

        Parameters: serverStart - boolean indicator for if
                                  the function is called when
                                  the server starts rather than
                                  the consecutive calls

    */

  // Get a random index from the array
  const randomIndex = Math.floor(Math.random() * wordleWords.length);

  // Get the word at the random index
  challengeWord = wordleWords[randomIndex].toUpperCase();

  
    
  // remove all in progress documents because of new word
  SavedProgress.deleteMany({ mode: "challenging" })
    .then(function () {
      let date = new Date();
      console.log(String(date) + ": CHALLENGE PROGRESS RESET");
    })
    .catch(function (error) {
      console.log(error);
    });

  //set every user's daily done to false
  let p1 = Player.find({}).exec();
  p1.then((results) => {
    for (var d = 0; d < results.length; d++) {
      results[d].challengeDone = "false";
      results[d].save();
      console.log(results[d].username)
      console.log(results[d].dailyDone)
    }
  });
  p1.catch((error) => {
    res.end("daily boolean clear failure");
  });

  

  console.log("The challenge word is: " + challengeWord);
}

selectDailyWord();
selectPracticeWord();
selectChallengeWord();

function resetChallengeAmount() {
  challengeAmount = 1;
  console.log('Challenge amounf changed to 1')
}

// generates a new word once midnight hits
// cron.schedule('0 0 * * *', selectDailyWord);

cron.schedule("*/30 * * * * *", resetChallengeAmount, {
  timeZone: "America/New_York",
});

// generates a new word every 30 seconds
cron.schedule("*/30 * * * * *", selectDailyWord, {
  timeZone: "America/New_York",
});

cron.schedule("*/30 * * * * *", selectChallengeWord, {
  timeZone: "America/New_York",
});

function authenticate(req, res, next) {
  let c = req.cookies;
  if (c && c.login) {
    let result = cm.sessions.doesUserHaveSession(c.login.username, c.login.sid);
    if (result) {
      next();
      return;
    }
  }
  res.redirect("/index.html");
}

// Back end stuff

/**
 * Initialize the express app and configure with various features
 * such as JSON parsing, static file serving, etc.
 */
app.use(cookieParser());
app.use("/app/*", authenticate);
app.use(express.static("public_html"));
app.use(express.json());

app.use("*", (req, res, next) => {
  let c = req.cookies;
  if (c && c.login) {
    if (cm.sessions.doesUserHaveSession(c.login.username, c.login.sid)) {
      cm.sessions.addOrUpdateSession(c.login.username);
    }
  }
  next();
});

/**
 * This route is for creating a new user account.
 */
app.get("/account/create/:username/:password", (req, res) => {
  let p1 = Player.find({ username: req.params.username }).exec();

  p1.then((results) => {

    if (results.length > 0) {
      res.end("That username is already taken.");
    } else {

      if (req.params.username.length > 15) {
        res.end('That username is too long. Max is 15 chars')
      } else {
        let newSalt = Math.floor(Math.random() * 1000000);
        let toHash = req.params.password + newSalt;
        var hash = crypto.createHash("sha3-256");
        let data = hash.update(toHash, "utf-8");
        let newHash = data.digest("hex");

        var newPlayer = new Player({
          username: req.params.username,
          salt: newSalt,
          hash: newHash,
          dailyDone: "false",
          challengeDone: "false",
          gamesPlayed: [],
          gamesWon: [],
        });

        newPlayer
          .save()
          .then((doc) => {
            res.end("Created new account!");
          })
          .catch((err) => {
            console.log(err);
            res.end("Failed to create new account.");
          });
      }
    }
  });
  p1.catch((error) => {
    res.end("Failed to create new account.");
  });

});

app.get("/account/login/:username/:password", (req, res) => {
  let u = req.params.username;
  let p = req.params.password;

  let p1 = Player.find({ username: u }).exec();

  p1.then((results) => {
    
    if (results.length == 1) {
      let existingSalt = results[0].salt;
      let toHash = req.params.password + existingSalt;
      var hash = crypto.createHash("sha3-256");
      let data = hash.update(toHash, "utf-8");
      let newHash = data.digest("hex");
      
      if (newHash == results[0].hash) {
        let id = cm.sessions.addOrUpdateSession(u);
        res.cookie(
          "login",
          { username: u, sid: id, themeColor: "light" },
          { maxAge: 60000 * 60 * 24 * 2 }
        );
        res.end("SUCCESS");
      } else {
        res.end("password was incorrect");
      }
    } else {
      res.end("login failed");
    }
  });
  p1.catch((error) => {
    res.end("login failed");
  });

});

//getting word from server
app.get("/getDailyWord", (req, res) => {
  res.end(dailyWord);
});

//getting word from server
app.get("/getPracticeWord", (req, res) => {
  selectPracticeWord();
  res.end(practiceWord);
});

//getting word from server
app.get("/getChallengeWord", (req, res) => {
  if (challengeAmount === 1) {
    selectChallengeWord();
    challengeAmount--;
    console.log('Challenge amounf changed to 0')
  }
  res.end(challengeWord);
});

//getting user id
app.get("/getUserId/:username", (req, res) => {
  let u = req.params.username;

  let p1 = Player.find({ username: u }).exec();
  p1.then((results) => {
    if (results.length == 1) {
      res.end(results[0]._id.toString());
    } else {
      res.end("couldn't find user");
    }
  });
  p1.catch((error) => {
    res.end("couldn't find player");
  });

});

app.get("/setDaily/:username/:mode", (req, res) => {
  let u = req.params.username;
  let currMode = req.params.mode;

  let p1 = Player.find({ username: u }).exec();
  p1.then((results) => {

    if (results.length == 1) {

      if (currMode == "standard") {

        results[0].dailyDone = "true";
        cm.sessions.sessions[u].dailyDone = true;
        results[0].save();
        res.end("done");

      } else if (currMode == "challenging") {

        results[0].challengeDone = "true";
        cm.sessions.sessions[u].challengeDone = true;
        results[0].save();
        res.end("done");

      }

    }
  });
  p1.catch((error) => {
    res.end("login failed");
  });

});

app.get("/logGame/:username/:gameWord/:gameEnd/:mode", (req, res) => {
  let u = req.params.username;
  let gameWord = req.params.gameWord + "\r";

  let p1 = Player.find({ username: u }).exec();
  p1.then((playerResult) => {

    if (playerResult.length == 1) {
      let g1 = WordleGame.find({ playerName: u, word: gameWord }).exec();

      g1.then((gameResult) => {
        
        if (gameResult.length == 1) {

          if (req.params.gameEnd == "true") {
            playerResult[0].gamesWon.push(gameResult[0]);
          }

          playerResult[0].gamesPlayed.push(gameResult[0]);
          playerResult[0].save();
          res.end("GAME LOGGED SUCESS");
        }

      });
      g1.catch((error) => {
        res.end("couldnt find game");
      });
    }
  });
  p1.catch((error) => {
    res.end("couldnt find player");
  });

});

app.get("/updateHistory/:username", (req, res) => {
  let u = req.params.username;
  var games = [];

  let g1 = WordleGame.find({ playerName:u }).exec();
  
  g1.then((gamesResults) => {

    for (var g = 0; g < gamesResults.length; g++) {
      let logWord = String(gamesResults[g].word)
      let logMode = String(gamesResults[g].gameMode)

      if (gamesResults[g].totalGuess <= 0) {
        var logResult = 'L'
      } else {
        var logResult = 'W'
      }
      

      games.push(logMode + ':' + logWord + ':' + logResult)

    }

    res.end(JSON.stringify(games.reverse()))

  });
  g1.catch((error) => {
    res.end("couldnt find any games");
  });

});

app.get("/loadLeaderboard/:mode", (req, res) => {
  let currMode = req.params.mode;
  var jsonResp = [];

  let p1 = Player.find({}).exec();
  p1.then((players) => {

    for (var pl = 0; pl < players.length; pl++) {
      let player = players[pl];
      let score = 0;
      let stdGamesPlayed = 0;
      let stdGamesWon = 0;

      let g1 = WordleGame.find({ playerName: player.username }).exec();

      g1.then((gameResults) => {

        for (var gm = 0; gm < gameResults.length; gm++) {
          let game = gameResults[gm];

          if (game.gameMode == currMode) {
            score += game.totalGuess;
            stdGamesPlayed += 1;
            stdGamesWon += 1;
          }

        }

        let entry =
          '{"name":"' +
          player.username +
          '", "score":"' +
          score +
          '", "gamesPlayed":"' +
          stdGamesPlayed +
          '", "gamesWon":"' +
          stdGamesWon +
          '"}';

        jsonResp.push(entry);

      });
      g1.catch((error) => {
        res.end("couldnt find game");
      });
    }

    setTimeout(() => {
      res.end(JSON.stringify(jsonResp));
    }, 1000);
  });
  p1.catch((error) => {
    res.end("couldnt find players");
  });

});

app.get("/checkPrgoress/:username/:mode", (req, res) => {
  let u = req.params.username;
  let currMode = req.params.mode;

  let p1 = Player.find({ username: u }).exec();
  p1.then((playerResult) => {

    if (playerResult.length == 1) {
      let id = playerResult[0]._id.toString();
      let g1 = SavedProgress.find({ playerId: id, mode: currMode }).exec();

      g1.then((progResult) => {

        if (currMode == "standard") {

          if (progResult.length == 1 && playerResult[0].dailyDone == "false") {
            res.end(JSON.stringify(progResult[0].SavedArray));
          } else {
            var ret = "";
            var daily;
            var chl;

            if (playerResult[0].dailyDone == "true") {
              ret += "true";
              daily = true;
            } else {
              ret += "false";
              daily = false;
            }

            if (playerResult[0].challengeDone == "true") {
              ret += ",true";
              chl = true;
            } else {
              ret += ",false";
              chl = false;
            }

            res.end(JSON.stringify(ret));
          }
        }

        if (currMode == "challenging") {
          if (
            progResult.length == 1 &&
            playerResult[0].challengeDone == "false"
          ) {
            res.end(JSON.stringify(progResult[0].SavedArray));
          } else {
            var ret = "";
            var daily;
            var chl;

            if (playerResult[0].dailyDone == "true") {
              ret += "true";
              daily = true;
            } else {
              ret += "false";
              daily = false;
            }

            if (playerResult[0].challengeDone == "true") {
              ret += ",true";
              chl = true;
            } else {
              ret += ",false";
              chl = false;
            }

            res.end(JSON.stringify(ret));
          }
        }
      });
      g1.catch((error) => {
        res.end("couldnt find game");
      });
    }
  });
  p1.catch((error) => {
    res.end("couldnt find player");
  });
});

app.get("/userDailyCheck/:username", (req, res) => {
  let u = req.params.username;

  let p1 = Player.find({ username: u }).exec();
  p1.then((playerResult) => {

    if (playerResult.length == 1) {
      var userDaily = playerResult[0].dailyDone;

      if (userDaily == "true") {
        res.end("true");
      } else {
        res.end("false");
      }

    }
  });
  p1.catch((error) => {
    res.end("couldnt find player");
  });

});

app.get("/userChallengeCheck/:username", (req, res) => {
  let u = req.params.username;

  let p1 = Player.find({ username: u }).exec();
  p1.then((playerResult) => {

    if (playerResult.length == 1) {
      var userDaily = playerResult[0].challengeDone;

      if (userDaily == "true") {
        res.end("true");
      } else {
        res.end("false");
      }

    }
  });
  p1.catch((error) => {
    res.end("couldnt find player");
  });

});

app.post("/create/wordleGame/", (req, res) => {
  let GameToSave = req.body;
  var newGame = new WordleGame(GameToSave);
  let p1 = newGame.save();

  p1.then((doc) => {
    res.end("SAVED SUCCESFULLY");
  });
  p1.catch((err) => {
    console.log(err);
    res.end("FAILED TO CREATE A CATEGORY");
  });

});

app.post("/saveProgress/:mode", (req, res) => {
  let progress = req.body;
  let currMode = req.params.mode;

  let g1 = SavedProgress.find({
    playerId: req.body.playerId,
    mode: currMode,
  }).exec();
  g1.then((progResult) => {

    if (progResult.length == 0) {
      var newProg = new SavedProgress(progress);
      let p1 = newProg.save();
      p1.then((doc) => {
        res.end("PROGRESS SAVED SUCCESFULLY");
      });
      p1.catch((err) => {
        console.log(err);
        res.end("FAILED TO SAVE PROGRESS");
      });

    } else if (progResult.length >= 1) {

      SavedProgress.deleteMany({ playerId: req.body.playerId, mode: currMode })
        .then(function () {
          var newProg = new SavedProgress(progress);
          let p1 = newProg.save();
          p1.then((doc) => {
            res.end("PROGRESS SAVED SUCCESFULLY");
          });
          p1.catch((err) => {
            console.log(err);
            res.end("FAILED TO SAVE PROGRESS");
          });
        })
        .catch(function (error) {
          console.log(error);
        });

    }
  });
  g1.catch((error) => {
    res.end("couldnt find game");
  });

});

const port = 3000;
const hostname = "localhost";
app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});