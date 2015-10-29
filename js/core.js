function rand(min, max){
  var rand = min - 0.5 + Math.random()*(max-min+1)
  rand = Math.round(rand);
  return rand;
}
_detectWay = function(a,b){
  if (a.ID != b.ID){
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }
}







// задаем параметры игры
var scene = $("<div class='scene' id='scene'></div>");
    scene.appendTo('body');

var FPS = 30;
var SPRITES = {
  tanks: {
    green: "data/sprites/tanks/green/main.png",
    grey: "data/sprites/tanks/grey/main.png"
  }
};


ACTIVE_ENEMIES = 0;
UNACTIVE_ENEMIES = 0;

var UI = {
  health: 100,
  level: 1,
  shotTime: 3000,

  healthElementCounter: $('#PlayerOne').find('.user-health>span'),
  levelElementCounter: $('#PlayerOne').find('.user-level>span'),
  shotTimeElementCounter: $('#PlayerOne').find('.user-shot-time>span'),
  shotTimeElement: $('#PlayerOne').find('.user-shot-time>i')
};

function UpdateUI(b){
  UI.healthElementCounter.html(UI.health);
  UI.levelElementCounter.html(UI.level);
  UI.shotTimeElementCounter.html(b);
}

// функция загрузки спрайтов
loadSprite = function(path){
  var img = new Image();
  img.src = path;
  return img;
};

// загружаем спрайты
// for (ss = 1; ss < 5; ss++){
//   SPRITES.tanks.USA[ss] = loadSprite("data/sprites/tanks/_"+ss+".png");
// }

// ширина и высота сцены
canvasWidth = scene.width();
canvasHeight = scene.height();


var ENEMIES = [];
var BULLETS = [];


function EXPLOSE(type, e){
  var elem = $('<div class="explose '+type+'">'+
    '<span class="f"/><span class="s"/><span class="t"/>'+
    '<span class="sf"/><span class="ss"/><span class="st"/>'+
    '</div>')
  .css({top: e.y, left: e.x})
  .appendTo($('.scene'));
  setTimeout(function(){
    elem.addClass('active');
  }, 100);
  e.element.remove();
  var t = setTimeout(function(){
    elem.css('transition', '0s').animate({opacity: 0}, 300, function(){
      elem.remove();
      window.clearTimeout(t);
    });
  }, 3000);
}

// ============================================================
// КЛАСС-КОНСТРУКТОР ПУЛЬ
// type [строка]    тип юнита (people, panzer, etc.)
// sprite [строка]  спрайт (USA, Germany, France)
// v [число]        (1...6)
// x [число]        (0...n)
// y [число]        (0...n)
// ============================================================
var BULLET = function(unit, date){
  // позиция по горизонтали
  this.x =  unit.way == 1 ? unit.x+unit.w/2 :
            unit.way == 3 ? unit.x+unit.w/2 :
            unit.way == 2 ? unit.x+unit.w+17 :
            unit.way == 4 ? unit.x-17 : 0;
  // по вертикали
  this.y =  unit.way == 3 ? unit.y+unit.h :
            unit.way == 1 ? unit.y-34 :
            unit.way == 2 ? unit.y+unit.h/2-17 :
            unit.way == 4 ? unit.y+unit.h/2-17 : 0;
  // класс для поворота
  this.v =  unit.way == 4 ? 'r-v' :
            unit.way == 2 ? 'l-v' :
            unit.way == 3 ? 't-v' :
            unit.way == 1 ? 'b-v' : void(0);
  // направление
  this.way = unit.way;
  // активна ли пуля
  this.active = true;

  this.w = 20;
  this.h = 34;
  // скорость движения
  this.s = 15;
  // ДОМ - элемент
  this.element = $('<b class="tank_bullet '+unit.sprite+' '+this.v+'"/>')
    .css({top: this.y, left: this.x})
    .appendTo($('.scene'));
  // передвижение
  this.move = function (x, y){
    if (this.active == true){
      this.x = x || 0;
      this.y = y || 0;
      this.element.css({top: this.y, left: this.x});
      if (this.x < 0 || this.x > canvasWidth){
        this.explose();
        this.active = false;
      }
      if (this.y < 0 || this.y > canvasHeight){
        this.explose();
        this.active = false;
      }
    }
  }
  // взрыв
  this.explose = function(){
    EXPLOSE('tank_bullet', this);
  }

  BULLETS.push(this);
  // возвращаем текущий объект
  return this;
};





// ============================================================
// КЛАСС-КОНСТРУКТОР ЮНИТОВ
// type [строка]    тип юнита (people, panzer, etc.)
// sprite [строка]  спрайт (USA, Germany, France)
// v [число]        (1...6)
// x [число]        (0...n)
// y [число]        (0...n)
// ============================================================
var UNIT = function(sprite, v, x, y, w, h, sht, b){
  /*
    конструируем юнита исходя из его типа и вида
  */
  this._path =
    sprite === 'green' ? SPRITES.tanks.green :
    sprite === 'grey' ? SPRITES.tanks.grey :
    void(0);
  /*
    задаем параметры юнита
  */
  this.x        = x; // позиция по горизонтали
  this.y        = y; // позиция по вертикали

  this.w        = w; // ширина
  this.h        = h; // высота
  this.v        = v; // текущий вид

  this.x2       = x + this.w; // позиция по горизонтали
  this.y2       = y + this.h; // позиция по вертикали

  this.sprite   = sprite; // спрайт
  this.ctx      = null; // содержимое канваса
  this.element  = null; // сам канвас
  this.way      = 1; // направление

  this.step     = 6;

  this.lastShot = 0;
  this.shotReload = sht || 2000;

  this.bullets = b || 10;

  this.active = true;

  this.ID = new Date()
            .getTime();
  /*
    ПРИВАТНЫЕ МЕТОДЫ
  */
  /*
    [приватный] УДАЛЯЕМ КЛАССЫ ПОВОРОТА
  */
  this._removeViewClasses = function(){
    this.element.removeClass('t-v r-v b-v l-v');
  }
  /*
    СОЗДАЕМ КАНВАС ДЛЯ ЮНИТА
    w - ширина, которую нужно нарисовать
    h - высота, которую нужно нарисовать
    x - позиция по горизонтали
    y - позиция по вертикали
  */
  this.createUnitElement = function(x, y){
    var elem = $('<div/>', {
      width: this.w,
      height: this.h
    })
      .css({top: y+'px', left: x+'px'})
      .addClass('abs '+sprite+'-tank')
      .appendTo($('.scene'));
    this.element = elem;
  };
  /*
    СТАВИМ НУЖНЫЙ СПРАЙТ
    v - вид, число от 1 до 6
    x - позиция по горизонтали
    y - позиция по вертикали
  */
  this.setSprite = function (v, x, y){
    x = x || 0;
    y = y || 0;
    this.v = v;
  }
  /*
    ПЕРЕДВИЖЕНИЕ ЮНИТА
    x - позиция по горизонтали
    y - позиция по вертикали
  */
  this.move = function (x, y){
    var t = this;
    ENEMIES.forEach(function(e){
      // console.log(_detectWay(this,ENEMIES[0]));
      if (_detectWay(t,e) == false){
        if (x < canvasWidth-t.w && x > 0){
          t.element.css('left', x+"px");
          t.x  = x || t.x;
          t.x2 = x + t.w;
        }
        if (y < canvasHeight-t.h && y > 0){
          t.y  = y || t.y;
          t.y2 = y + t.h;
          t.element.css('top', y+"px");
        }
      }
    });
  }
  /*
    ПОВОРАЧИВАЕМ ЮНИТА ВЛЕВО
  */
  this.pullLeft = function (){
    this._removeViewClasses();
    this.way = 4;
    this.element.addClass('r-v');
  }
  /*
    ПОВОРОТ ЮНИТА ВПРАВО
  */
  this.pullRight = function (){
    this._removeViewClasses();
    this.way = 2;
    this.element.addClass('l-v');
  }
  /*
    ПОВОРОТ ЮНИТА ВВЕРХ
  */
  this.pullUp = function (){
    this._removeViewClasses();
    this.way = 1;
    this.element.addClass('b-v');
  }
  /*
    ПОВОРОТ ЮНИТА ВНИЗ
  */
  this.pullDown = function (){
    this._removeViewClasses();
    this.way = 3;
    this.element.addClass('t-v');
  }
  /*
    ГОРИЗОНТАЛЬНОЕ ПАТРУЛИРОВАНИЕ
  */
  this.patroulHorizontal = function(){
    if (this.v == 2) {
      this.move(this.x+1);
      this._removeViewClasses();
      this.element.addClass('l-v');
      this.x2+1 >= canvasWidth ? this.v = 4 : void(0);
    }else {
      this.move(this.x-1);
      this._removeViewClasses();
      this.element.addClass('r-v');
      this.x-1 <= 0 ? this.v = 2 : void(0);
    }
  }
  /*
    ВЫСТРЕЛ
  */
  this.shot = function (isPlayer){
    var d = new Date();
    if (this.lastShot+this.shotReload < d.getTime() && this.bullets > 0){
      this.lastShot = d.getTime();
      shot = new BULLET(this, d);
      this.bullets--;
      if (isPlayer == true){
        UpdateUI(this.bullets);
        var i = 0;
        var to = setInterval(function(){
          UI.shotTimeElement.css({width: i+'%'});
          i++;
          if (i >= 101){
            window.clearInterval(to);
          }
        }, this.shotReload/100);
      }
    }
  }
  /*
    ВЗРЫВ ТАНКА
  */
  this.explose = function(){
    EXPLOSE('tank_bullet', this);
  }
  /*
    СОЗДАЕМ КАНВАС И ДОБАВЛЯЕМ СПРАЙТ
  */
  this.createUnitElement(this.x, this.y);
  this.setSprite(this.v, this.x, this.y);

  // возвращаем текущий объект
  return this;
};













setInterval(function(){
  ENEMIES.push(new UNIT('grey', 2, rand(0,1000), rand(0,500), 100, 100, 2000, 3));
  ACTIVE_ENEMIES++;
},3000);



// враги
// for (ii = 0; ii < 2; ii++){
//   ENEMIES.push(new UNIT('grey', 2, 50*ii, 110*ii, 100, 100, 2000, 3));
// }



// Главный герой
var actor = new UNIT('green', 2, 0, 0, 100, 100, 500, 200);
actor.move(actor.x, 260);
actor.pullUp();




// рабочий цикл
frame = 0;
function update(){
  // обрабатываем контроль танчиком юзверя
  if (keydown.right){
    actor.move(actor.x+actor.step);
    actor.pullRight();
  }
  if (keydown.left){
    actor.move(actor.x-actor.step);
    actor.pullLeft();
  }
  if (keydown.down && (!keydown.right && !keydown.left)){
    actor.move(actor.x, actor.y+3);
    actor.pullDown();
  }
  if (keydown.up && (!keydown.right && !keydown.left)){
    actor.move(actor.x, actor.y-3);
    actor.pullUp();
  }
  if (keydown.space){
      actor.shot(true);
  }

  BULLETS.forEach(function(b){
    ENEMIES.forEach(function(e){
      if (e.active == true && b.active == true){
        if (_detectWay(b,e)){
          b.active = false;
          b.explose();
          e.active = false;
          e.explose();
          UNACTIVE_ENEMIES++;
        }
      }
    });
  });


  // enemies.forEach(function(enemy) {
  //   if(collides(bullet, enemy)) {
  //     enemy.explode();
  //     bullet.active = false;
  //   }
  // });


  // обрабатываем логику врагов
  for (var en = 0; en < ENEMIES.length; en++){
    if (ENEMIES[en].active == true){
      ENEMIES[en].patroulHorizontal();
    }
  }

  // обрабатываем снаряды
  for (var bu = 0; bu < BULLETS.length; bu++){
    var B = BULLETS[bu];
    B.move(
      (B.way == 4 ? B.x-B.s : B.way == 2 ? B.x+B.s : B.x),
      (B.way == 3 ? B.y+B.s : B.way == 1 ? B.y-B.s : B.y)
    );
  }
  if (frame == 0){
    UpdateUI(actor.bullets);
  }
  if (frame >= FPS) frame = 0;
  frame++;



  var dev = FPS+' fps<br>';
  dev += 'leftKey: '+(keydown.left === true ? 'true' : 'false')+'<br>';
  dev += 'rightKey: '+(keydown.right === true ? 'true' : 'false')+'<br>';
  dev += 'upKey: '+(keydown.up === true ? 'true' : 'false')+'<br>';
  dev += 'downKey: '+(keydown.down === true ? 'true' : 'false')+'<br><hr>';

  dev += 'top: '+actor.y+'<br>';
  dev += 'left: '+actor.x+'<br>';
  dev += 'view: '+actor.way+'<br><hr>';

  dev += 'enemies: '+UNACTIVE_ENEMIES+'<br><hr>';

  dev += 'bullets: '+BULLETS.length+'<br>';
  $('.dev').html(dev);
};


$(document).ready(function(){
  setInterval(function() {
    update();
  }, 1000/FPS);
});