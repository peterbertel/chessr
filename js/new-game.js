// Vue Elements
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
var pgnHeaders = new Vue({
    el: '#pgn-headers',
    data: {
        whitePlayerName: "",
        blackPlayerName: "",
        eventName: "",
        result: ""
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
            updatePGN()
            updateStatus()
            clearSaveGameModal()
        }
    }
})
var saveGameButton = new Vue({
    el: '#save-game-button',
    methods: {
        saveGame: function () {
            $('#save-game-modal').modal({ show: true })
        }
    }
})
var loadGameButton = new Vue({
    el: '#load-game-button',
    data: {
        areSavedGames: ""
    },
    methods: {
        loadGame: function () {
            $('#load-game-modal').modal({ show: true })
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
var loadGameModal = new Vue({
    el: '#load-game-modal',
    data: {
        games: null,
        deleteGamesView: false
    },
    methods: {
        loadGame: function (pgn) {
            game.load_pgn(pgn)
            board.position(game.fen())
            updatePGN()
            updateStatus()
            $('#load-game-modal').modal('hide')
        },
        deleteGame: function(index) {
            this.games.splice(index, 1)
            saveGamesLocally(this.games)
        },
        toggleDeleteGames: function() {
            this.deleteGamesView = true
        },
        done: function () {
            this.deleteGamesView = false
        },
        clickedGame: function (pgn, index) {
            if (this.deleteGamesView) {
                this.deleteGame(index)
            }
            else {
                this.loadGame(pgn)
            }
        }
    }
})
var saveGameModal = new Vue({
    el: '#save-game-modal',
    data: {
        whitePlayerName: "",
        whitePlayerRating: "",
        blackPlayerName: "",
        blackPlayerRating: "",
        eventName: "",
        result: ""
    },
    methods: {
        saveGame: function () {
            game.header("White", this.whitePlayerName)
            game.header("Black", this.blackPlayerName)
            game.header("Event", this.eventName)
            game.header("Result", this.result)
            updateStatus()
            gameId = Math.round(new Date().getTime()/1000)
            currentPGN = game.pgn()
            currentGame = {gameId: gameId, pgn: currentPGN, whitePlayerName: this.whitePlayerName, blackPlayerName: this.blackPlayerName, result: this.result}
            localGames = localStorage.getItem("savedGames")
            if (!localGames) {
                games = [ currentGame ]
                loadGameModal.games = games
            }
            else {
                loadGameModal.games.push(currentGame)
                games = loadGameModal.games
            }
            saveGamesLocally(games)
            updatePGN()
            clearSaveGameModal()
        }
    }
})
var promotionModal = new Vue({
    el: '#promotion-modal',
    data: {
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
            updatePGN()
            updateStatus()
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
    var promotion = false
    if ( (source.includes(2) && (target.includes(1))  || (source.includes(7) && target.includes(8))) ) {
        if (isValidPawnMove(game, source, target)) {
            promotion = true
            promotionModal.sourceSquare = source
            promotionModal.targetSquare = target
            $('#promotion-modal').modal({ show: true })
        }
    }
    if (!promotion) {
        var move = game.move({
            from: source,
            to: target
        })

        // illegal move
        if (move === null) return 'snapback'
        updatePGN()
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
        var result = (moveColor == 'White') ? "0-1" : "1-0"
        game.header('Result', result)
        pgnHeaders.result = result
    }

    else if (game.in_draw()) {
        status = 'Game over, drawn position.'
        game.header('Result', "1/2-1/2")
    }

    else {
        status = moveColor + ' to move.'
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
    }
    statusMessage.message = status
}

function saveGamesLocally (games) {
    if (!games.length) {
        loadGameButton.areSavedGames = false
        localStorage.savedGames = ""
    }
    else {
        stringified = JSON.stringify(games)
        localStorage.savedGames = stringified
        if (!loadGameButton.areSavedGames) {
            loadGameButton.areSavedGames = true
        }
    }
}

function loadSavedGames () {
    loadedGames = localStorage.getItem("savedGames")
    if (loadedGames) {
        loadGameButton.areSavedGames = true
        parsedGames = JSON.parse(loadedGames)
        loadGameModal.games = parsedGames
    }
}

function saveCurrentPGNLocally () {
    stringified = JSON.stringify(game.pgn())
    localStorage.currentGamePGN = stringified
}

function loadCurrentGamePGN () {
    currentGame = localStorage.getItem("currentGamePGN")
    if (currentGame != null) {
        loadGame(JSON.parse(currentGame))
        updatePGN()
    }
}

updatePGN = () => {
    updateLocalPGN = true
    if (!game.pgn()) {
        pgnHeaders.whitePlayerName = ""
        pgnHeaders.blackPlayerName = ""
        pgnHeaders.result = ""
        pgnHeaders.eventName = ""
        pgn.output = ""
    }
    else {
        splitPGN = game.pgn().split("\n")
        if (hasPlayerNames(splitPGN)) {
            whitePlayerName = splitPGN[0].split('"')[1]
            blackPlayerName = splitPGN[1].split('"')[1]
            pgnHeaders.whitePlayerName = whitePlayerName
            pgnHeaders.blackPlayerName = blackPlayerName
        }
        moves = splitPGN[splitPGN.length - 1]
        result = hasResult(splitPGN)
        pgnHeaders.result = (result) ? result : ""
        eventName = hasEventName(splitPGN)
        pgnHeaders.eventName = (eventName) ? eventName : ""
        currentGamePGN = localStorage.getItem("currentGamePGN")
        if (currentGamePGN != null) {
            if (currentGamePGN.includes(moves)) {
                a = currentGamePGN.split("\\n")
                m = a[a.length-1]
                currentMoves = m.substring(0, m.length-1)
                if (currentMoves == moves) {
                    pgn.output = moves
                }
                else {
                    updateLocalPGN = false
                }
            }
        }
        else {
            pgn.output = moves
        }
    }
    if (updateLocalPGN) {
        saveCurrentPGNLocally()
    }
}

hasResult = (splitPGN) => {
    return hasPGNHeader(splitPGN, "Result ")
}

hasEventName = (splitPGN) => {
    return hasPGNHeader(splitPGN, "Event ")
}

hasPlayerNames = (splitPGN) => {
    return hasPGNHeader(splitPGN, "White " && hasPGNHeader(splitPGN, "Black "))
}

hasPGNHeader = (splitPGN, header) => {
    for (i = 0; i < splitPGN.length; i++) {
        if (splitPGN[i].includes(header)) {
            return splitPGN[i].split('"')[1]
        }
    }
    return false
}

loadGame = (pgn) => {
    game.load_pgn(pgn)
    board.position(game.fen())
    updateStatus()
}

clearSaveGameModal = () => {
    saveGameModal.whitePlayerName = ""
    saveGameModal.whitePlayerRating = ""
    saveGameModal.blackPlayerName = ""
    saveGameModal.blackPlayerRating = ""
    saveGameModal.eventName = ""
    saveGameModal.result = ""
}

var gameConfig = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
}

board = Chessboard('board', gameConfig)

loadCurrentGamePGN()
updateStatus()
loadSavedGames()