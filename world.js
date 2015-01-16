function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function World (size, playerX, playerY) {
    if (!size) { size = 64; }
    
    this.tileSize = size;
    this.moveSpeed = this.tileSize / 2;
    
    this.position = { x: playerX, y: playerY };
    this.facingAngle = 0;
    
    this.playerHeight = size / 2;
    
    // viewport
    this.fov = 60;
    this.projectionPlaneWidth = 640;
    this.projectionPlaneHeigt = 480;
    
    this.distanceToProjectionPlane = (this.projectionPlaneWidth / 2) / Math.tan(toRadians(this.fov / 2));
    
    this.angleBetweenRays = this.fov / this.projectionPlaneWidth;
    
    // define player rotation based on plane width
    this.angle60 = 60; //this.projectionPlaneWidth;
    this.angle30 = (this.angle60 / 2);
    this.angle15 = (this.angle30 / 2);
    this.angle90 = (this.angle30 * 3);
    this.angle180 = (this.angle90 * 2);
    this.angle270 = (this.angle90 * 3);
    this.angle360 = (this.angle60 * 6);
    this.angle0 = 0;
    this.angle5 = (this.angle30 / 6);
    this.angle10 = (this.angle5 * 2);
    
    // this is our actual world
    // 1 - indicates wall
    // 0 - indicates nothing
    // (12 x 12 right now)
    this.tiles = [
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    
    // debug storage
    this.intersections = [];
    this.horizontalStarting = [];
}

// player position is specified in "unit coordinates"
// (not tile coordinates)
World.prototype.setPosition = function(playerX, playerY) {
    this.position = { x: playerX, y: playerY };
};

World.prototype.horizontalIntersection = function(angle) {
  var facingDown = angle > this.angle0 && angle < this.angle180;
  
  // calculate starting x and y based on tiles and location
  var Ay = Math.floor(this.position.y / this.tileSize) * this.tileSize + (facingDown ? this.tileSize : -1);
  var Ax = this.position.x + (this.position.y - Ay) / Math.tan(toRadians(angle));
  
  this.horizontalStarting.push({x: Ax, y: Ay });
  
  // calculate casting increment
  var Ya = (facingDown ? this.tileSize : -this.tileSize);
  var Xa = this.tileSize / Math.tan(toRadians(angle));
  
  // these keep track of where our ray is in the grid
  var Cx = Ax + Xa, Cy = Ay + Ya;
  
  // misc tile data
  var tile;
  
  // cast the ray until we hit a wall or go outside of the map
  while (Cx < this.tiles[0].length && Cy < this.tiles.length) {
    var tileX = Math.round(Cx / this.tileSize);
    var tileY = Math.round(Cy / this.tileSize);
    
    if (this.tiles[tileX][tileY]) {
      // we found a wall here, so we're done
      tile = tiles[tileX][tileY];
      break;
    } else {
      // cast the ray a bit further and continue in the grid
      Cx += Xa;
      Cy += Ya;
    }
    
  }
  
  return { x: Cx, y: Cy, tile: tile };
};

World.prototype.verticalIntersection = function(angle) {
  var facingRight = angle < this.angle90 || angle > this.angle270;
  
  // calculate starting x and y based on tiles and location
  var Ax = Math.floor(this.position.x / this.tileSize) * this.tileSize + (facingRight ? this.tileSize : -1);
  var Ay = this.position.y + (this.position.x - Ax) * Math.tan(angle);
  
  // calculate casting increment
  var Xa = (facingRight ? this.tileSize : -this.tileSize);
  var Ya = this.tileSize * Math.tan(toRadians(angle));
  
  // these keep track of where our ray is in the grid
  var Cx = Ax + Xa, Cy = Ay + Ya;
  
  // misc tile data
  var tile;
  
  // cast the ray until we hit a wall or go outside of the map
  while (Cx < this.tiles[0].length && Cy < this.tiles.length) {
    var tileX = Math.round(Cx / this.tileSize);
    var tileY = Math.round(Cy / this.tileSize);
    
    if (this.tiles[tileX][tileY]) {
      // we found a wall here, so we're done
      tile = this.tiles[tileX][tileY];
      break;
    } else {
      // cast the ray a bit further and continue in the grid
      Cx += Xa;
      Cy += Ya;
    }
    
  }
  
  return { x: Cx, y: Cy, tile: tile };
};

// cast a ray from the player position at the given angle
// return closest intersection
World.prototype.rayIntersection = function(angle) {
  var horizontal = this.horizontalIntersection(angle);
  var vertical = this.verticalIntersection(angle);
  
  var vertDist = this.distance(this.position, vertical);
  var horizDist = this.distance(this.position, horizontal);
  
  if (vertDist > horizDist) {
    return horizontal;
  } else {
    return vertical;
  }
};

// remove fishbowl distortion by correcting for angle from pov
World.prototype.correctedDistance = function(originalDistance, angle) {
  return originalDistance * Math.cos(toRadians(angle));
};

// cast rays from player position and return a grid of walls to draw
World.prototype.castRays = function() {
  var walls = [ ];
  
  // start at very left of viewing angle
  var angle = this.facingAngle - this.fov / 2;

  do {
    // compute the necessary values
    var beta = Math.abs(this.facingAngle - angle);
    var intersection = this.rayIntersection(this.normalizeAngle(angle));
    
    this.intersections.push(intersection); // store so we can draw later
    
    var distance = this.distance(this.position, intersection);
    
    distance = this.correctedDistance(distance, beta);
    var sliceHeight = (this.tileSize / distance) * this.distanceToProjectionPlane;
    
    walls.push({
      tile: intersection.tile,
      distance : distance,
      height : sliceHeight
    });
    
    // cast the next ray
    angle += this.angleBetweenRays;
    
    // keep going until we get to the end of our fov
  } while (angle <= this.facingAngle + (this.fov / 2));
  
  return walls;
};

World.prototype.normalizeAngle = function(angle) {
  while (angle < 0) {
    angle = 360 + angle;
  }
  
  while (angle > 360) {
    angle = angle - 360;
  }
  
  return angle;
}


World.prototype.playerTile = function() {
  return {x: Math.round(this.position.x / this.tileSize), y: Math.round(this.position.y / this.tileSize)};
};

World.prototype.moveForward = function() {
  // move in the direction we are facing
  this.position.x += this.moveSpeed * Math.cos(toRadians(this.facingAngle));
  this.position.y += this.moveSpeed * Math.sin(toRadians(this.facingAngle));
}

World.prototype.moveBackward = function() {
  // move in the direction we are facing
  this.position.x -= this.moveSpeed * Math.cos(toRadians(this.facingAngle));
  this.position.y -= this.moveSpeed * Math.sin(toRadians(this.facingAngle));
}

World.prototype.moveRight = function() {
  // move in the direction we are facing
  this.position.x += this.moveSpeed * Math.cos(toRadians(this.facingAngle + 90));
  this.position.y += this.moveSpeed * Math.sin(toRadians(this.facingAngle + 90));
}

World.prototype.moveLeft = function() {
  // move in the direction we are facing
  this.position.x += this.moveSpeed * Math.cos(toRadians(this.facingAngle - 90));
  this.position.y += this.moveSpeed * Math.sin(toRadians(this.facingAngle - 90));
}

World.prototype.distance = function(point1, point2)
{
  var xs = 0;
  var ys = 0;

  xs = point2.x - point1.x;
  xs = xs * xs;

  ys = point2.y - point1.y;
  ys = ys * ys;

  return Math.sqrt(xs + ys);
};

World.prototype.render = function(context) {
  var walls = this.castRays();
  
  context.fillStyle = 'gray';
  context.fillRect(0, 0, 640, 480);
  
  //TODO: draw floors and ceilings, texture map etc
  // draw on our context
  for (var i = 0; i < walls.length; i++) {
    var start = (this.projectionPlaneHeigt - walls[i].height) / 2;
    
    context.fillStyle = 'blue';
    context.fillRect(i, start, 1, walls[i].height);
  }
};

World.prototype.reset = function() {
  this.intersections = [];
  this.horizontalStarting = [];
}