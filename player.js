var Player = {
    init: function(id, data) {
        this.x = (Math.random() * 3000)+1; 
        this.y = 1000; 
        this.vr = 0; 
        this.vx = 0; 
        this.vy = 0;
        this._thrust = 0;
        this.rotation = 0;
        this.thruster = false;
        this.shots = [];
        this.particles = [];
        this.id = id;
        this.sheild = false;
        this.score = 0;
        this.round = 1;
        this.name = data.name;
        this.lives = 3;
        this.start_move = 0;
        this.ship=data.ship;
        return this;
    }
};

module.exports = Player;