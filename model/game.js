"use strict";

var Enemy = require('./enemy');
var Vector2D = require('./Vector2d');
var Game_v1_2 = function () {
}

Game_v1_2.prototype = {
    diff: 0,
    round: 0,
    baddies: 5,
    enemies: {},
    players: {},
    height: 3000,
    width: 4000
};
/**
 * Worker method called from app
 */
Game_v1_2.prototype.worker = function () {
    // Baddies
    if (Object.keys(this.enemies).length === 0) {
        this.baddies++;
        this.round++;
        this.diff++;
        this.bad_guys(this.baddies);
    }

    // update players
    for (var p in this.players) {
        if (this.players.hasOwnProperty(p)) {
            this.updatePlayer(this.players[p]);
        }
    }

    // update baddies bullets
    for (var e in this.enemies) {
        // Updates baddies
        if (this.enemies.hasOwnProperty(e)) {
            this.updateEnemy(e, this.enemies[e]);
        }
    }
}

/**
 * Wrapper to all player update methods
 */
Game_v1_2.prototype.updatePlayer = function (player) {
    player.round = this.round;

    if (player.lives >= 0) {

        if (player.score !== 0 && player.score % 500 === 0) {
            player.lives++;
        }

        player.updateXY();
        player.updateMissileXY(this);
        player.updateParticles();

        if (this.shipContact(player)) {
            player.genParticles();
        }

    } else {
        player.message = true;
    }
}

/**
 * Update bad guys
 */
Game_v1_2.prototype.updateEnemy = function (id, baddy) {

    for (var j in this.enemies) {
        if(baddy.id !== id) {
            if (baddy.checkCollision(this.enemies[j])) {
                baddy.resolveCollision(baddy, this.enemies[j]);
            }
        }
    }

    baddy.updateXY();
    baddy.updateEnemyMissileXY(this);
    baddy.updateParticles();
    
    if (baddy.shots.length <= this.diff) {
        var shot = baddy.enemyMissile(baddy);
        baddy.shots.push(shot);
    }

    if (baddy.explode) {
        if (baddy.timeout > 0) {
            baddy.timeout--;
        } else {
            delete this.enemies[id];
            baddy = null;
        }
    }
}

/**
 * Ship to ship missile contact
 */
Game_v1_2.prototype.shipMissileContact = function (id, missile) {
    var particle = {};

    for (var p in this.players) {

        var player   = this.players[p],
            dist     = player.position.distance(missile),
            min_dist = 20;

        if (dist < min_dist && player.id != id) {
            if (player.particles.length === 0) {
                if (!player.sheild) {
                    player.genParticles();
                    missile.lifeCtr = missile.life;
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Player missile to bad guy contact
 */
Game_v1_2.prototype.missileContact = function (id, missile) {

    for (var j in this.enemies) {

        var baddy    = this.enemies[j], particle,
            dist     = baddy.position.distance(missile),
            min_dist = 20;

        if (dist < min_dist) {
            baddy.explode = true;
            baddy.timeout = 5;

            for (var i = 0; i < 5; i++) {
                particle = {
                    x: baddy.position.x,
                    y: baddy.position.y,
                    dx: Math.random() * 3,
                    dy: Math.random() * 3,
                    life: 5,
                    lifeCtr: 0
                };

                if (Math.random() < 0.5) {
                    particle.dx *= -1;
                    particle.dy *= -1;
                }

                baddy.particles.push(particle);
            }

            missile.lifeCtr = missile.life;

            return true;
        }
    }

    return false;
}

/**
 * Enemy to player missile contact
 */
Game_v1_2.prototype.enemyMissileContact = function (missile) {
    var player;
    for (var p in this.players) {
        player = this.players[p];

        var dist     = player.position.distance(missile),
            min_dist = 20;

        if (!player.sheild && dist < min_dist) {
            if (player.particles.length === 0) {
                player.genParticles();
                return true;
            }
        }
    }

    return false;
}

/**
 * Bad guys collisions detection
 * circle to circle
 */
Game_v1_2.prototype.checkCollision = function (baddyA, i) {
    for (var j in this.enemies) {
        if (j != i) {
            var baddyB   = this.enemies[j],
                dist     = baddyB.position.distance(baddyA),
                min_dist = 35;

            if (dist < min_dist) {                                       // center hit not outside edge (refine)
                var angle = baddyB.position.getAngle(baddyA),            // radians (where the baddys hit each other)
                    tx = baddyA.positon.x + Math.cos(angle) * min_dist,  // trajectory x
                    ty = baddyA.position.y + Math.sin(angle) * min_dist, // trajectory y
                    ax = (tx - baddyB.position.x) * 1.5 * 0.5,           // angle x
                    ay = (ty - baddyB.position.y) * 1.5 * 0.5;           // angle y
                    
                baddyA.velocity.x -= ax;                                 // baddyA direction + speed
                baddyA.velocity.y -= ay;
                baddyB.velocity.x += ax;                                 // baddyB direction + speed
                baddyB.velocity.y += ay;
            }
        }
    }
}

/**
 * Ship to enemy contact
 */
Game_v1_2.prototype.shipContact = function (player) {

    for (var j in this.enemies) {
        var baddy    = this.enemies[j],
            dist     = player.position.distance(baddy),
            min_dist = 40;

        if (dist < min_dist) {
            if (player.sheild) {
                var angle = player.position.getAngle(baddy),             // radians (where the baddys hit each other)
                    tx = player.position.x + Math.cos(angle) * min_dist, // trajectory x
                    ty = player.position.y + Math.sin(angle) * min_dist, // trajectory y
                    ax = (tx - baddy.position.x) * 1.5 * 0.5,            // angle x
                    ay = (ty - baddy.position.y) * 1.5 * 0.5;            // angle y

                player.velocity.x -= ax;
                player.velocity.y -= ay;
                baddy.velocity.x += ax;                                  // baddyB direction + speed
                baddy.velocity.y += ay;
                
            } else {
                if (!player.particles.length > 0) {
                    player.score -= 10;
                    player.lives--;
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Unused: Pending interpolation/ extrapolation
 */
Game_v1_2.prototype.unixTime = function () {
    var foo = new Date; // Generic JS date object
    var unixtime_ms = foo.getTime(); // Returns milliseconds since the epoch
    return parseInt(unixtime_ms / 1000);
}

/**
 * Make new set of bad guys
 */
Game_v1_2.prototype.bad_guys = function (num) {
    var baddy;
    for (var i = 0; i < num; i++) {
        baddy = new Enemy();
        baddy.id = Math.round(Math.random() * 2);
        this.enemies[i] = baddy;
    }
}

/**
 * Boss round: not implemented
 */
Game_v1_2.prototype.boss = function () {
    return {
        id: 'boss',
        x: this.width / 2,
        y: this.height / 2,
        dx: Math.floor(Math.random() * 2) * 2 - 1,
        dy: Math.floor(Math.random() * 2) * 2 - 1,
        life: 500
    }
}

Game_v1_2.prototype.getPlayer = function (p) {
    return this.players[p];
}

Game_v1_2.prototype.getPlayers = function () {
    return this.players;
}

Game_v1_2.prototype.setPlayers = function (players) {
    this.players = players;
}

Game_v1_2.prototype.getEnemies = function () {
    return this.enemies;
}

Game_v1_2.prototype.setEnemies = function (enemies) {
    this.enemies = enemies;
}

module.exports = Game_v1_2;