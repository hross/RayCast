// -- global vars for drawing
var fps = 30;

var world;
var map;
var viewPort;

// kick off our draw loop
$(document).ready(function () {
    
    // our view into the world
    viewPort = document.getElementById("viewPort").getContext("2d");
    
    // init world
    world = new World(64, 96, 160);
    
    // init map drawing
    map = new Map(document.getElementById("map"));

    // fire it up
    draw();
    
    // bind our key handlers
    $(document).keydown(function(event) {
        
        if (event.which == 65) { // a
            world.moveLeft();
        }
        
        if (event.which == 87) { // w
            world.moveForward();
        }
        
        if (event.which == 83) { // s
            world.moveBackward();
        }
        
        if (event.which == 68) { // d
            world.moveRight();
        }
        
        if (event.which == 81) { // q
        }
        
        if (event.which == 69) { // e
        }
        
    });

});

// our main drawing loop
function draw() {
    setTimeout(function() {
        //TODO: uncomment to animate
        //requestAnimationFrame(draw);
        
        // Drawing code goes here
        world.render(viewPort);
        
        map.draw(world.tiles, world.playerTile());
        
        for (var i = 0; i < world.intersections.length; i++) {
            map.drawPoint(world.intersections[i]);
        }

        for (var i = 0; i < world.horizontalStarting.length; i++) {
            map.drawPoint(world.horizontalStarting[i], 'pink');
        }
        
    }, 1000 / fps);
}