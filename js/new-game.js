// Vue Elements
var app = new Vue({
    el: '#app',
    data: {
        message: 'Hello there! This app is currently in-progress. :)'
    }
})
var statusMessage = new Vue({
    el: '#status',
    data: {
        message: null
    }
})
var fen = new Vue({
    el: '#fen',
    data: {
        output: null
    }
})
var pgn = new Vue({
    el: '#pgn',
    data: {
        output: null
    }
})
var undoMoveButton = new Vue({
    el: '#undo-move-button',
    created() {
        window.addEventListener('keydown', (e) => {
            if (e.key == 'ArrowLeft') {
                this.undoMove()
            }
        });
    },
    methods: {
        undoMove: function (event) {
            game.undo()
            board.position(game.fen())
            updateStatus()
        }
    }
})
var newGameButton = new Vue({
    el: '#new-game-button',
    methods: {
        newGame: function () {
            game = new Chess()
            board.position(game.fen())
            updateStatus()
        }
    }
})
var saveNewGameInput = new Vue({
    el: '#save-new-game',
    data: {
        gameTitle: "",
        whitePlayerName: "",
        blackPlayerName: ""
    },
    methods: {
        saveGame: function () {
            if (this.whitePlayerName) {
                game.header("White", this.whitePlayerName)
            }
            if (this.blackPlayerName) {
                game.header("Black", this.blackPlayerName)
            }
            updateStatus()
            currentPGN = game.pgn()
            currentGame = {pgn: currentPGN, gameTitle: this.gameTitle}
            localGames = localStorage.getItem("savedGames")
            if (!localGames) {
                games = [ currentGame ]
                savedGames.games = games
            }
            else {
                savedGames.games.push(currentGame)
                games = savedGames.games
            }
            saveGamesLocally(games)
        }
    }
})
var flipBoardButton = new Vue({
    el: '#flip-board-button',
    methods: {
        flipBoard: function () {
            if (gameConfig.orientation == 'white') {
                gameConfig.orientation = 'black'
            }
            else {
                gameConfig.orientation = 'white'
            }
            board = Chessboard('board', gameConfig)
            board.position(game.fen())
        }
    }
})
var savedGames = new Vue({
    el: '#saved-games',
    data: {
        games: null
    },
    methods: {
        loadGame: function (pgn) {
            game.load_pgn(pgn)
            board.position(game.fen())
            updateStatus()
        }
    }
})

// Initialize chess board and start a new game
var board = null
var game = new Chess()

function onDragStart (source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false

    // only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
    (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onDrop (source, target) {
    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    })

    // illegal move
    if (move === null) return 'snapback'

    updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
    board.position(game.fen())
}

function updateStatus () {
    var status = ''

    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }

    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }

    else if (game.in_draw()) {
        status = 'Game over, drawn position.'
    }

    else {
        status = moveColor + ' to move.'
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
    }

    statusMessage.message = status
    fen.output = game.fen()
    pgn.output = game.pgn()
}

function saveGamesLocally (games) {
    stringified = JSON.stringify(games)
    localStorage.savedGames = stringified
}

function loadSavedGames () {
    loadedGames = localStorage.getItem("savedGames")
    if (!loadedGames) {
        console.log("There are no saved games")
    }
    else {
        parsedGames = JSON.parse(loadedGames)
        savedGames.games = parsedGames
    }
}

var gameConfig = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
}

board = Chessboard('board', gameConfig)

updateStatus()
loadSavedGames()