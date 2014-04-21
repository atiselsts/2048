function Grid(size, previousState) {
  this.size = size;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
}

// Build a grid of the specified size
Grid.prototype.empty = function () {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }

  return cells;
};

Grid.prototype.fromState = function (state) {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      var tile = state[x][y];
      row.push(tile ? new Tile(tile.position, tile.value) : null);
    }
  }

  return cells;
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  var cells = [];

  this.eachCell(function (x, y, tile) {
    if (!tile) {
      cells.push({ x: x, y: y });
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < this.size &&
         position.y >= 0 && position.y < this.size;
};

Grid.prototype.serialize = function () {
  var cellState = [];

  for (var x = 0; x < this.size; x++) {
    var row = cellState[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }
  }

  return {
    size: this.size,
    cells: cellState
  };
};

// Get the vector representing the chosen direction
Grid.prototype.getVector = function (direction) {
  if (direction === 0) return { x: 0,  y: -1 }; // Up
  if (direction === 1) return { x: 1,  y: 0 };  // Right
  if (direction === 2) return { x: 0,  y: 1 };  // Down
  if (direction === 3) return { x: -1,  y: 0 }; // Left
};

// Build a list of positions to traverse in the right order
Grid.prototype.buildTraversals = function (vector) {
  var traversals = { };
  if (vector.x === 1) traversals.x = [3, 2, 1, 0];
  else traversals.x = [0, 1, 2, 3];
  if (vector.y === 1) traversals.y = [3, 2, 1, 0];
  else traversals.y = [0, 1, 2, 3];
  return traversals;    
};

Grid.prototype.getVectorAndTraversals = function (direction) {
  if (direction === 0) {
    return { x: 0,  y: -1, startX: 0, endX : 4, stepX : 1, startY : 0, endY : 4, stepY : 1}; // Up
  }
  if (direction === 1) {
    return { x: 1,  y: 0, startX: 3, endX : -1, stepX : -1, startY : 0, endY : 4, stepY : 1}; // Right
  }
  if (direction === 2) {
    return { x: 0,  y: 1, startX : 0, endX : 4, stepX : 1, startY : 3, endY : -1, stepY : -1}; // Down
  }
  if (direction === 3) {
    return { x: -1,  y: 0, startX : 0, endX : 4, stepX : 1, startY : 0, endY : 4, stepY : 1}; // Left
  }
};
