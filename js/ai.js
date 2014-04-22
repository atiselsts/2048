// exactly one of these should be true
USE_WORST = true; //false;//true;
USE_AVG = false;//true;//false;
USE_BEST = false;

// the value of a game that is won/lost 
INFINITY = 1000000;

// ----------------------------

function State(oldState) {
  // initialize grid as empty array
  this.grid = [];
  for (var x = 0; x < 4; x += 1) {
    this.grid[x] = [];
  }
  // set from the old, if any
  if (oldState) this.restore(oldState);
}

State.prototype.setup = function (game) {
  this.score = game.score;
  this.won = game.won;
  // make a copy of game's grid
  for (var x = 0; x < 4; x += 1) {
    for (var y = 0; y < 4; y += 1) {
      var tile = game.grid.cells[x][y];
      this.grid[x][y] = tile ? tile.value : null;
    }
  }
}

State.prototype.restore = function (oldState) {
  this.score = oldState.score;
  this.won = oldState.won;
  for (var x = 0; x < 4; x += 1) {
    for (var y = 0; y < 4; y += 1) {
      this.grid[x][y] = oldState.grid[x][y];
    }
  }
}

State.prototype.at = function (x, y) {
  return this.grid[x][y];
}

State.prototype.set = function (x, y, value) {
  this.grid[x][y] = value;
}

State.prototype.withinBounds = function (x, y) {
  return x >= 0 && x < 4 && y >= 0 && y < 4;
}

State.prototype.cellFree = function (x, y) {
  return !this.grid[x][y];
}

State.prototype.countFreeCells = function () {
  var numFreeCells = 0;
  for (var x = 0; x < 4; x += 1) {
    for (var y = 0; y < 4; y += 1) {
      if (!this.grid[x][y]) numFreeCells += 1;
    }
  }
  return numFreeCells;
}

State.prototype.cleanupMergedTiles = function () {
  for (var x = 0; x < 4; x += 1) {
    for (var y = 0; y < 4; y += 1) {
      if (this.grid[x][y] < 0) {
        this.grid[x][y] = -this.grid[x][y];
      }
    }
  }
}

State.prototype.movesAvailable = function (game) {
  var dir = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  var newX, newY;
  for (var x = 0; x < 4; x += 1) {
    for (var y = 0; y < 4; y += 1) {
      if (!this.grid[x][y]) return true;
      for (var d = 0; d < 4; d += 1) {
        newX = x + dir[d][0];
        newY = y + dir[d][1];
        if (this.withinBounds(newX, newY)
            && this.grid[x][y] === this.grid[newX][newY]) {
          return true;
        }
      }
    }
  }
  return false;
}

State.prototype.anyDirection = function () {
  var dir = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  var newX, newY;
  for (var x = 0; x < 4; x += 1) {
    for (var y = 0; y < 4; y += 1) {
      if (!this.grid[x][y]) continue;
      for (var d = 0; d < 4; d += 1) {
        newX = x + dir[d][0];
        newY = y + dir[d][1];
        if (this.withinBounds(newX, newY)
            && this.grid[x][y] === this.grid[newX][newY]) {
          return d;
        }
      }
    }
  }
  return 0;
}

State.prototype.bestTile = function () {
  var highestValue = 2;
  for (var x = 0; x < 4; x += 1) {
    for (var y = 0; y < 4; y += 1) {
      if (this.grid[x][y] > highestValue) {
        highestValue = this.grid[x][y];
      }
    }
  }
  return highestValue;
}

// -------------------------------------------

function PuzzleAI(grid) {
  this.losingScore = -INFINITY;
  this.notMovedScore = this.losingScore - 2;
}

PuzzleAI.prototype.estimatePosition = function (game) {
  var state = new State(null);
  state.setup(game);
  return this.estimatePositionPrivate(state);
}

PuzzleAI.prototype.estimatePositionPrivate = function (state) {
  // this is the estimated value of the position
  var estimatedValue = 0;

  var maxTile = 0, secondMaxTile = 0;
  var maxTilePosX, maxTilePosY;
  var secondMaxTilePosX, secondMaxTilePosY;

  // use the score of game as a base for the estimate
  estimatedValue += state.score * 10;

  // add some small amount for each tile that is free
  for (var x = 0; x < 4; x += 1) {
    for (var y = 0; y < 4; y += 1) {
      tileValue = state.at(x, y);
      if (!tileValue) {
        estimatedValue += 5;
      }
      
      if (tileValue > maxTile) {
        maxTilePosX = x;
        maxTilePosY = y;
        secondMaxTile = maxTile;
        maxTile = tileValue;
      } else if (tileValue > secondMaxTile) {
        secondMaxTilePosX = x;
        secondMaxTilePosY = y;
        secondMaxTile = tileValue;
      }
    }
  }

  // add a big number if we've won
  if (state.won) estimatedValue += INFINITY;

  // penalize positions where the two best tiles are not side-by-side
  if ((maxTile == secondMaxTile || maxTile == secondMaxTile * 2)) {
    var diffX = Math.abs(secondMaxTilePosX - maxTilePosX);
    var diffY = Math.abs(secondMaxTilePosX - maxTilePosX);
    if (diffX + diffY > 1) {
      estimatedValue -= 100;
    }
  }

  return estimatedValue;
};


PuzzleAI.prototype.findFarthestPosition = function (state, x, y, dirX, dirY) {
  var startX = x;
  var startY = y;

  // Progress towards the vector direction until an obstacle is found
  do {
    x += dirX;
    y += dirY;
  } while (state.withinBounds(x, y) && state.cellFree(x, y));

  // retract the last step if stepped out of the grid (but not if in a tile)
  if (!state.withinBounds(x, y)) {
    x -= dirX;
    y -= dirY;
  }
  if (x === startX && y === startY) {
    // signal the called that move in that direction is not possible
    return null;
  }
  // return the possible new coordinates
  return { x: x, y: y };
};

PuzzleAI.prototype.singleMove = function (direction, state, searchDepth, endTime) {
  var self = this;

  var cell, tile;

  var directions = Grid.prototype.getVectorAndTraversals(direction);
  var dirX = directions.x;
  var dirY = directions.y;

  var movedSomeTile = 0;

  // Traverse the grid in the right direction and move tiles
  for (var x = directions.startX; x != directions.endX; x += directions.stepX) {
    for (var y = directions.startY; y != directions.endY; y += directions.stepY) {

      tileValue = state.at(x, y);

      if (!tileValue) continue;

      var nextPosition = self.findFarthestPosition(state, x, y, dirX, dirY);
      var movedThisTile = false;
      if (nextPosition) {
        var cellToMergeValue = state.at(nextPosition.x, nextPosition.y);

        // Only one merger per row traversal.
        if (cellToMergeValue && cellToMergeValue === tileValue && cellToMergeValue > 0) {

          // calculate the merger value
          var mergedValue = tileValue * 2;

          // set "-" sign for a while to avoid double mergers
          tileValue = -mergedValue;

          // Update the score
          state.score += mergedValue;

          // The mighty 2048 tile
          if (mergedValue === 2048) state.won = true;

          movedThisTile = true;
        }
        else if (cellToMergeValue) {
          // not merged; step back
          nextPosition.x -= dirX;
          nextPosition.y -= dirY;
          movedThisTile = (nextPosition.x !== x || nextPosition.y !== y);
        } else {
          movedThisTile = true;
        }
      }

      if (movedThisTile) {
        movedSomeTile = true;
        state.set(x, y, null);
        state.set(nextPosition.x, nextPosition.y, tileValue);
      }
    }
  }

  if (!movedSomeTile) {
    return { best: this.notMovedScore, avg: this.notMovedScore, worst: this.notMovedScore };
  }

  state.cleanupMergedTiles();

  // count the number of free cells after the move (there must be some!)
  var numFreeCells = state.countFreeCells();
  // search limit exceeded?
  var endNow = searchDepth === 0 || Date.now() >= endTime;
  // close to the search limit?
  var endSoon = searchDepth <= 1 || Date.now() + 500 >= endTime;

  if (endNow || (endSoon && numFreeCells >= 4)) {
    // estimate the value of the current position and return
    var score = this.estimatePositionPrivate(state);
    return { best: score, avg: score, worst: score };
  }

  var cumulativeScore = 0;
  var worstScore = INFINITY + 1;
  var bestScore = this.losingScore - 3;

  // to be faster, we only consider 4's in the tree when there are few free tiles;
  // in this case, both the slowdown will be slower,
  // and the results will be of more of interest
  var doTheFours = numFreeCells <= 2;

  var numVariants = 0;

  // generate the next set of tiles and step down in the search tree
  for (var x = 0; x < 4; x += 1) {
    for (var y = 0; y < 4; y += 1) {
      for (var value = 2; (doTheFours && value <= 4) || value <= 2; value += 2) {
        if (state.at(x, y)) continue;

        numVariants += 1;

        // test what happens if this cell is set to this value
        state.set(x, y, value);

        if (state.movesAvailable()) {
          var subscore = self.getMoveDirectionRecursive(state, searchDepth, endTime).score;
          cumulativeScore += subscore.avg;
          if (worstScore > subscore.worst) {
            worstScore = subscore.worst;
          }
          if (bestScore < subscore.best) {
            bestScore = subscore.best;
          }
        } else {
          // Game over!
          cumulativeScore += this.losingScore;
          worstScore = this.losingScore;
          if (bestScore < this.losingScore) {
            bestScore = this.losingScore;
          }
        }

        // restore
        state.set(x, y, null);
      }
    }
  }

  // return the average of the scores
  return { best: bestScore, avg: cumulativeScore / numVariants, worst: worstScore };
}

PuzzleAI.prototype.getMoveDirectionRecursive = function (state, searchDepth, endTime) {
  var bestDirection = -1;
  var noScore = this.losingScore - 1;
  var bestScore = { best: noScore, avg: noScore, worst: noScore };

  // make a temp variable for the new state
  var newState = new State(state);

  for (var i = 0; i < 4; i += 1) {
    var score = this.singleMove(i, newState, searchDepth - 1, endTime);
    // check is this direction is better than the best and use it
    if (USE_WORST) {
      if (score.worst > bestScore.worst) {
        bestScore = score;
        bestDirection = i;
      }
    }
    else if (USE_AVG) {
      if (score.avg > bestScore.avg) {
        bestScore = score;
        bestDirection = i;
      }
    }
    else if (USE_BEST) {
      if (score.best > bestScore.best) {
        bestScore = score;
        bestDirection = i;
      }
    }
    // restore the old state
    newState.restore(state);
  }
  return {direction: bestDirection, score: bestScore};
}


PuzzleAI.prototype.getMoveDirection = function (game, searchDepth, searchTime) {
  var state = new State(null);
  state.setup(game);
  var endTime = Date.now() + searchTime;
  var bestTile = state.bestTile();
  var numFreeCells = state.countFreeCells();
  if (numFreeCells > 2 && bestTile < 1024 && searchDepth > 0) {
    // reduce search depth for the early game
    if (numFreeCells > 3 && bestTile < 256 && searchDepth > 1) {
      searchDepth -= 2;
    } else {
      searchDepth -= 1;
    }
  }
  if (numFreeCells > 2) {
    USE_AVG = true;
    USE_WORST = false;
  } else {
    USE_AVG = false;
    USE_WORST = true;
  }
  //    alert('set minSearchDepth = ' + minSearchDepth);
  var result = this.getMoveDirectionRecursive(state, searchDepth, endTime);
  if (result.direction == -1) {
    result.direction = state.anyDirection();
  }
  return result;
}
