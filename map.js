function Map(canvas) {
    this.tileSize = 10;
    
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
}

Map.prototype.draw = function(tiles, tilePosition) {
    // paint the tiles
    for (var y = 0; y < tiles.length; y++) {
        for (var x = 0; x < tiles[0].length; x++) {
            
            if (tiles[x][y]) {
                this.context.fillStyle = 'blue';
            } else {
                this.context.fillStyle = 'white';
            }
            
            this.context.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        }
    }
    
    this.context.fillStyle = 'yellow';
    this.context.fillRect(tilePosition.x * this.tileSize, tilePosition.y * this.tileSize, this.tileSize, this.tileSize);
}

Map.prototype.drawPoint = function(position, color) {
    this.context.fillStyle = color ? color : 'red';
    this.context.fillRect(position.x, position.y, 1, 1);
}