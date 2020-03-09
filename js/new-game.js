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
        blackPlayerName: "",
        eventName: ""
    },
    methods: {
        saveGame: function () {
            if (this.whitePlayerName) {
                game.header("White", this.whitePlayerName)
            }
            if (this.blackPlayerName) {
                game.header("Black", this.blackPlayerName)
            }
            if (this.eventName) {
                game.header("Event", this.eventName)
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
var promotionModal = new Vue({
    el: '#promotion-modal',
    data: {
        showModal: false,
        chosenPiece: "",
        sourceSquare: "",
        targetSquare: ""
    },
    methods: {
        promoteTo: function (piece) {
            this.chosenPiece = piece
            var move = game.move({
                from: this.sourceSquare,
                to: this.targetSquare,
                promotion: piece
            })
            board.position(game.fen())
            updateStatus()
            this.showModal = false
        }
    }
})

// Initialize chess board and start a new game
var board = null
var game = new Chess()

function isValidPawnMove (game, source, target) {
    tmpGame = new Chess()
    tmpGame.load_pgn(game.pgn())
    move = tmpGame.move({
        from: source,
        to: target,
        promotion: 'q'
    })
    if (move === null) {
        return false
    }
    else {
        return (move.piece == 'p')
    }
}

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
    // If a piece is moving to a back rank from the second to last rank
    if ( (source.includes(2) && (target.includes(1))  || (source.includes(7) && target.includes(8))) ) {
        if (isValidPawnMove(game, source, target)) {
            promotionModal.sourceSquare = source
            promotionModal.targetSquare = target
            promotionModal.showModal = true
        }
    }
    else {
        var move = game.move({
            from: source,
            to: target
        })

        // illegal move
        if (move === null) return 'snapback'
        updateStatus()
    }
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