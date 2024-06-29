/*
File: script.js
GUI Assignment: Creating an Interactive Dynamic Table
Andy Tran, UMass Lowell Computer Science, andy_tran1@student.uml.edu
Copyright (c) 2024 by Andy. All rights reserved. May be freely copied or
excerpted for educational purposes with credit to the author.
updated by AT on June 29, 2024 at 1:31 AM
*/

// File Description: 
// This file contains the jQuery and JavaScript needed for the game to function,
// track tiles, add points, enforce rules, etc.

$(document).ready(function() {

    // Initializing all the variables with function-level scope.
    var newTiles = false;
    var pieces;
    var totalScore = 0;
    var tilesOnBoard = [];

    // Load the pieces data from resources folder.
    $.getJSON("resources/pieces.json", function(data) {
        pieces = data.pieces;
        initializeGame();
    });

    // Initialize the game using all creator functions.
    // Also, keep count of the remaining tiles.
    function initializeGame() {
        remainingTiles = JSON.parse(JSON.stringify(pieces));
        createBoard();
        dealTiles();
        setupDragAndDrop();
        updateScore();
    }

    // Make a board of 15 that specifies where the bonus tiles are
    // using an indexed approach for the placement tiles.
    function createBoard() {
        $("#board").empty();
        for (var i = 0; i < 15; i++) {
            var bonusClass = "";
            if (i === 2 || i === 12) bonusClass = "double-word";
            if (i === 6 || i === 8) bonusClass = "double-letter";
            $("#board").append(`<div class="board-space ${bonusClass}" data-index="${i}"></div>`);
        }
    }

    // Deal random tiles (of seven) from the JSON file.
    // This appends tiles of a specified letter to the rack using the randomPiece() function.
    function dealTiles() {
        var currentTiles = $("#rack .tile").length;
        for (var i = currentTiles; i < 7; i++) {
            var randomPiece = getRandomPiece(newTiles);
            if (randomPiece === null) {
                break; // No more tiles available!
            }
            var tile = $(`<img src="/../resources/Scrabble_Tiles/Scrabble_Tile_${randomPiece.letter}.jpg" 
                class="tile" data-letter="${randomPiece.letter}" data-value="${randomPiece.value}">`);
            $("#rack").append(tile);
        }
        setupDragAndDrop();
    }

    // Get random pieces using the Math functions
    function getRandomPiece() {
        var availablePieces = remainingTiles.filter(piece => piece.amount > 0);
        if (availablePieces.length === 0) {
            return null; // No more tiles available!
        }

        var totalPieces = pieces.reduce((sum, piece) => sum + piece.amount, 0);
        var randomIndex = Math.floor(Math.random() * totalPieces);
        
        // For each piece, if the random piece index chosen is less
        // than the amount of that piece, then decrement the piece
        // amount and return that piece. If not, decrement randomIndex
        // by the piece amount.
        for (var piece of pieces) {
            if (randomIndex < piece.amount) {
                if (newTiles == false) {
                    piece.amount--;
                }
                return piece;
            }
            // This line ensures probabilities for piece selection
            // are not biased towards pieces with lower indices. Random
            // index is a number between 0 and the sum of all pieces, so
            // we need this line to "cut off" the last piece's amount
            // of pieces before moving on to the next piece.
            randomIndex -= piece.amount;
        }
    }

    // Drag and drop interface using jQuery.
    // This sets up the dropping behavior itself, before
    // the rest of the code blocks.
    function setupDragAndDrop() {
        $(".tile").draggable({
            revert: "invalid",
            snap: ".board-space",
            snapMode: "inner",
            start: function(event, ui) {
                $(this).css("z-index", 100);
            },
            stop: function(event, ui) {
                $(this).css("z-index", "");
            }
        });

        // Specifies the dropping behavior of the board space.
        $(".board-space").droppable({
            accept: ".tile",
            drop: function(event, ui) {
                var droppedTile = ui.draggable;
                var spaceIndex = $(this).data("index");

                if ($(this).children().length > 0) {
                    ui.draggable.draggable("option", "revert", true);
                    return;
                }

                // Using the CSS feature in jQuery, manipulate the CSS of
                // the page to update the viisual board state.
                if (isValidPlacement(spaceIndex)) {
                    $(this).append(droppedTile);
                    droppedTile.css({top: 0, left: 0}).draggable("disable");
                    tilesOnBoard.push({index: spaceIndex, tile: droppedTile});
                } else {
                    ui.draggable.draggable("option", "revert", true);
                }
            }
        });

        // Specifies dropping behavior of the rack.
        $("#rack").droppable({
            accept: ".tile",
            drop: function(event, ui) {
                var droppedTile = ui.draggable;
                $(this).append(droppedTile);
                droppedTile.css({top: 0, left: 0});
            }
        });
    }

    // Function returning a Boolean value for whether or not the placement
    // of a tile is valid.
    function isValidPlacement(index) {
        if (tilesOnBoard.length === 0) return true;
        return tilesOnBoard.some(tile => Math.abs(tile.index - index) === 1);
    }

    // Function for calculating the score, based on bonus squares
    // and the tiles used by the player. As you can see, letter
    // doubling takes precedent over word doubling.
    $("#play-word").click(function() {
        if (tilesOnBoard.length === 0) return;

        var wordScore = 0;
        var wordMultiplier = 1;

        // For each tile on the board, consider what square it is
        // placed on and calculate the total score with regard to
        // letter values and word values, giving precedence
        // to letter score doubling.
        tilesOnBoard.forEach(({index, tile}) => {
            var letterValue = parseInt(tile.data("value"));
            var space = $(`.board-space[data-index="${index}"]`);
            
            if (space.hasClass("double-letter")) {
                wordScore += letterValue * 2;
            } else if (space.hasClass("double-word")) {
                wordScore += letterValue;
                wordMultiplier *= 2;
            } else {
                wordScore += letterValue;
            }
        });

        // Score words and add them to total score
        // (some redundancy here )
        wordScore *= wordMultiplier;
        totalScore += wordScore;

        // Remove the played tiles from the rack
        tilesOnBoard.forEach(({tile}) => {
            tile.remove();
        });

        updateScore();
        clearBoard();
        dealTiles();
    });

    // New game button.
    $("#new-game").click(function() {
        totalScore = 0;
        tilesOnBoard = [];
        updateScore();
        clearBoard();
        $("#rack").empty();
        newTiles = false;
        totalScore = 0;
        tilesOnBoard = [];
        // New game, reset board states fresh from JSON
        $.getJSON("resources/pieces.json", function(data) {
            pieces = data.pieces;
            initializeGame();
        });
    });

    // Basic function that clears the board.
    function clearBoard() {
        $(".board-space").empty();
        tilesOnBoard = [];
    }

    // New tiles button functionality.
    $("#new-tiles").click(function() {
        $("#rack").empty();

        // Since it's from new-tiles, set newTiles = true
        // so that no tiles are removed from the database.
        // Just set it back to false afterwards.
        dealTiles(newTiles = true);
        newTiles = false;
    });

    // Update the score for the current game.
    function updateScore() {
        $("#score").text(`Total Score: ${totalScore}`);
    }

});
