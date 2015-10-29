var CANVAS_WIDTH = 700;
var CANVAS_HEIGHT = 320;
var FPS = 30;
var ENEMYES_SPAWN = 0.04

var player = {
  color: "#00A",
  race: 'USA',
  x: 50,
  y: 270,
  width: 20,
  height: 30,
  currentStep: 0,
  way: 1,
  draw: function() {
    canvas.fillStyle = this.color;
    canvas.fillRect(this.x, this.y, this.width, this.height);
  }
};

var playerBullets = [];

function Bullet(I) {
  I.active = true;

  I.yVelocity = 0;
  I.xVelocity = player.way === 0 ? -I.speed : +I.speed;
  I.width = 2;
  I.height = 2;
  I.color = "#000";

  I.inBounds = function() {
    return I.x >= 0 && I.x <= CANVAS_WIDTH &&
      I.y >= 0 && I.y <= CANVAS_HEIGHT;
  };

  I.draw = function() {
    canvas.fillStyle = this.color;
    canvas.fillRect(this.x, this.y, this.width, this.height);
  };
  
  I.update = function() {
    I.x += I.xVelocity;
    I.y += I.yVelocity;

    I.active = I.active && I.inBounds();
  };
  return I;
}

enemies = [];

function Enemy(I) {
  I = I || {};

  I.active = true;
  I.age = Math.floor(Math.random() * 128);

  // I.r = Math.random();
  I.r = 0.6;
  I.v = 1;

  I.color = "#A2B";

  I.x = I.r < 0.5 ? 0 : CANVAS_WIDTH;
  I.y = CANVAS_HEIGHT-50;
  I.xVelocity = 0
  I.yVelocity = 0;

  I.width = 30;
  I.height = 30;

  I.inBounds = function() {
    return I.x >= 0 && I.x <= CANVAS_WIDTH &&
      I.y >= 0 && I.y <= CANVAS_HEIGHT;
  };

  I.sprite = Sprite("peoples/germany/1_");

  I.draw = function() {
    this.sprite.draw(canvas, this.x, this.y);
  };

  I.update = function() {
    // I.sprite = Sprite("peoples/germany/3_");
    I.draw();
    I.x += I.xVelocity;
    // I.y += I.yVelocity; 
    // I.draw();
    I.xVelocity = I.r < 0.5 ? +1 : -1;
    I.age++;
    if (I.v >= 6) I.v = 1;
    I.v++;
    I.active = I.active && I.inBounds();
    // I.sprite = Sprite("peoples/germany/3_");
    // I.draw();
  };

  I.explode = function() {
    Sound.play("bullet_pain");

    this.active = false;
    // Extra Credit: Add an explosion graphic
  };

  return I;
};

var canvasElement = $("<canvas width='" + CANVAS_WIDTH + 
  "' height='" + CANVAS_HEIGHT + "'></canvas");
var canvas = canvasElement.get(0).getContext("2d");
canvasElement.appendTo('body');

setInterval(function() {
  update();
  draw();
}, 1000    /FPS);
sprites = [
  Sprite("peoples/"+player.race+"/"+1),Sprite("peoples/"+player.race+"/"+2),
  Sprite("peoples/"+player.race+"/"+3),Sprite("peoples/"+player.race+"/"+4),
  Sprite("peoples/"+player.race+"/"+5),Sprite("peoples/"+player.race+"/"+6)
]
sprites_rev = [
  Sprite("peoples/"+player.race+"/"+1+"_"),Sprite("peoples/"+player.race+"/"+2+"_"),
  Sprite("peoples/"+player.race+"/"+3+"_"),Sprite("peoples/"+player.race+"/"+4+"_"),
  Sprite("peoples/"+player.race+"/"+5+"_"),Sprite("peoples/"+player.race+"/"+6+"_")
]
function update() {
  if(keydown.space) {
    player.shoot();
  }

  if(keydown.left) {
    player.x -= 3;
    player.way = 0;
    player.sprite = sprites_rev[player.currentStep];
    if (player.currentStep >= 5) player.currentStep = 0;
    player.currentStep++;
  }

  if(keydown.right) {
    player.x += 3;
    player.way = 1;
    player.sprite = sprites[player.currentStep];
    if (player.currentStep >= 5) player.currentStep = 0;
    player.currentStep++;
  }

  player.x = player.x.clamp(0, CANVAS_WIDTH - player.width);
  
  playerBullets.forEach(function(bullet) {
    bullet.update();
  });

  playerBullets = playerBullets.filter(function(bullet) {
    return bullet.active;
  });

  handleCollisions();

  enemies.forEach(function(enemy) {
    enemy.update();
  });
  
  enemies = enemies.filter(function(enemy) {
    return enemy.active;
  });
  
  handleCollisions();
  
  if(Math.random() < ENEMYES_SPAWN) {
    enemies.push(Enemy());
  }
}

player.shoot = function() {
  Sound.play("ak74_shot");

  var bulletPosition = this.midpoint();

  playerBullets.push(Bullet({
    speed: 10,
    x: bulletPosition.x,
    y: bulletPosition.y
  }));
};

player.midpoint = function() {
  return {
    x: this.x + this.width/2,
    y: this.y + this.height/2
  };
};

function draw() {
  canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  player.draw();
  
  playerBullets.forEach(function(bullet) {
    bullet.draw();
  });

  enemies.forEach(function(enemy) {
    enemy.draw();
  });
}

function collides(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

function handleCollisions() {
  playerBullets.forEach(function(bullet) {
    enemies.forEach(function(enemy) {
      if(collides(bullet, enemy)) {
        enemy.explode();
        bullet.active = false;
      }
    });
  });

  enemies.forEach(function(enemy) {
    if(collides(enemy, player)) {
      enemy.explode();
      player.explode();
    }
  });
}

player.sprite = Sprite("peoples/"+player.race+"/1");

player.draw = function() {
  this.sprite.draw(canvas, this.x, this.y);
};