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
        gameTitle: ""
    },
    methods: {
        saveGame: function () {
            currentPGN = game.pgn()
            currentGame = {pgn: currentPGN, gameTitle: this.gameTitle}
            savedGames.games.push(currentGame)
        }
    }
})
var savedGames = new Vue({
    el: '#savedGames',
    data: {
        games: [
            { pgn: '', gameTitle: '' }
        ]
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
var game1PGN = "1. d4 f5 2. f4 e6 3. Bd2 d5 4. g4 Qh4#"
var game2PGN = "1. d4 d5 2. Nf3 e5 3. Nxe5 Qh4 4. Qd3 Na6 5. Qf3 c5 6. dxc5 Qd8 7. Qxf7#"
var games = [
    { pgn: game1PGN, gameTitle: "Game 1" },
    { pgn: game2PGN, gameTitle: "Game 2" },
]

savedGames.games = games

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

var gameConfig = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
}

board = Chessboard('board', gameConfig)

updateStatus()