const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
let {PythonShell} = require('python-shell');
const app = express();
const port = 3000;

app.listen(port, () => { console.log(`Listening on PORT: ${port}`) });
app.use(cors());
app.use(bodyParser.json());

const rows = 3;
const cols = 3;
let grid = new Array(rows).fill().map(() => new Array(cols).fill("_"));
let userPiece = "X";
let computerPiece = "O";
let gameOngoing = false;

function gameHasEnded(grid) {
    // Check rows, columns, and diagonals for a win
    for (let i = 0; i < 3; i++) {
        if (grid[i][0] !== '_' && grid[i][0] === grid[i][1] && grid[i][0] === grid[i][2]) {
            return true; // Row win
        }
        if (grid[0][i] !== '_' && grid[0][i] === grid[1][i] && grid[0][i] === grid[2][i]) {
            return true; // Column win
        }
    }

    // Check diagonals for a win
    if (grid[0][0] !== '_' && grid[0][0] === grid[1][1] && grid[0][0] === grid[2][2]) {
        return true; // Diagonal win
    }
    if (grid[0][2] !== '_' && grid[0][2] === grid[1][1] && grid[0][2] === grid[2][0]) {
        return true; // Diagonal win
    }

    // Check for a draw (all cells filled)
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[i][j] === '_') {
                return false; // Game still ongoing
            }
        }
    }

    return 2; // Draw
}

function getNextMove(grid) {
    temp = Math.floor(Math.random() * 9)
    let row = Math.floor(temp/3);
    let col = temp % 3;
    while (grid[row][col] != '_') {
        temp = Math.floor(Math.random() * 9)
        row = Math.floor(temp/3);
        col = temp % 3;
    }
    return temp
}

function getNextMoveHard(grid) {
    let ans = 0;
    let options = {
        mode: 'text',
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: __dirname,
        args: [grid]
      };
      
      PythonShell.run('nextMove.py', options).then(messages=>{
        // results is an array consisting of messages collected during execution
        ans = messages[0];
      });
    return ans;
}
app.get("/", (req, res) => {
    res.status(200).send({ "grid": grid, gameOngoing: false, msg: "You may start the game" });
})

app.get("/play", (req, res) => {
    gameOngoing = true;
    res.status(200).send({ "grid": grid, gameOngoing: true, msg: "Game started" });
})

app.post("/play/start", (req, res) => {
    if(gameOngoing){
    let counterID = getNextMove(grid);
    console.log(counterID);
    let counterRow = Math.floor(counterID / 3);
    let counterCol = counterID % 3;
    grid[counterRow][counterCol] = computerPiece;
    res.status(201).send({ "grid": grid, gameOngoing: true, msg: "Please play the next move", counterInfo: { counterID, counterRow, counterCol } });
    }
    else{res.status(400).send({ "grid": grid, gameOngoing: false, msg: "Please start the game first" });}
})

app.put("/play", (req, res) => {
    let temp = userPiece;
    userPiece = computerPiece;
    computerPiece = temp;
    res.status(201).send({msg: "Successfully swapped!"})
})

app.post("/play/quit", (req, res) => {
    gameOngoing = false;
    res.status(201).send({ "grid": grid, gameOngoing: false, msg: "You have quit" });
    grid = new Array(rows).fill().map(() => new Array(cols).fill("_"));
})

app.post("/play/:id", (req, res) => {
    if (gameOngoing) {
        let id = req.params.id;
        let row = Math.floor(id / 3);
        let col = id % 3;
        if (grid[row][col] == '_'){
        grid[row][col] = userPiece;
        if (gameHasEnded(grid) == true) {
            gameOngoing = false;
            res.status(201).send({ "grid": grid, gameOngoing: false, msg: "You have won" });
            grid = new Array(rows).fill().map(() => new Array(cols).fill("_"));
        }
        else {
            if (gameHasEnded(grid) == 2) {
                gameOngoing = false;
                res.status(201).send({ "grid": grid, gameOngoing: false, msg: "Its a draw" });
                grid = new Array(rows).fill().map(() => new Array(cols).fill("_"));
            }
            else {
                setTimeout(() => {
                    let counterID = getNextMove(grid);
                    let counterRow = Math.floor(counterID / 3);
                    let counterCol = counterID % 3;
                    grid[counterRow][counterCol] = computerPiece;
                    if (gameHasEnded(grid) == true) {
                        gameOngoing = false;
                        res.status(201).send({ "grid": grid, gameOngoing: false, msg: "You have lost" });
                        grid = new Array(rows).fill().map(() => new Array(cols).fill("_"));
                    }
                    else {
                        if (gameHasEnded(grid) == 2) {
                            gameOngoing = false;
                            res.status(201).send({ "grid": grid, gameOngoing: false, msg: "It is a draw" });
                            grid = new Array(rows).fill().map(() => new Array(cols).fill("_"));
                        }
                        else { res.status(201).send({ "grid": grid, gameOngoing: true, msg: "Please play the next move", counterInfo: { counterID, counterRow, counterCol } }); }
                    }
                }, 500)
            }
        };

    }
    else{res.status(400).send({ "grid": grid, gameOngoing: true, msg: "Please make a valid move!" })}
}
    else {
        res.status(500).send({ "grid": grid, gameOngoing: false, msg: "Please start the game first" });
    }
})

app.use((req, res, next) => {
    res.status(404);
})

module.exports = app;