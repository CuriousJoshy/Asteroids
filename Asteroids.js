var stage = document.getElementById("stage");

Game.input.init(stage);
Game.world.init(stage);

Game.grid.debug.init({
    width: stage.width,
    height: stage.height,
    
    gridColor: "white"
});

// SVG path generated by *SVG Path Builder* --> https://codepen.io/anthonydugois/pen/mewdyZ
Game.polygon.fromSVG("M 0 20 L 5 0 L 10 20 L 5 15 L 0 20", "Spaceship");
Game.polygon.fromSVG("M 0 20 L 5 0 L 10 20 L 5 15 L 0 20 L 3 18 L 5 25 L 8 18", "Spaceship Thrust");
Game.polygon.fromSVG("M 0 16 L 32 16 L 48 0 L 64 16 L 80 48 L 64 80 L 48 48 L 32 64 L 32 80 L 0 64 L 16 48 L 0 16", "Asteroid LARGE");
Game.polygon.fromSVG("M 0 10 L 20 10 L 30 0 L 40 10 L 50 30 L 40 50 L 30 30 L 20 40 L 20 50 L 0 40 L 10 30 L 0 10", "Asteroid MEDIUM");
Game.polygon.fromSVG("M 0 6 L 12 6 L 18 0 L 24 6 L 30 18 L 24 30 L 18 18 L 12 24 L 12 30 L 0 24 L 6 18 L 0 6", "Asteroid SMALL");
Game.polygon.fromSVG("M 4 3 L 13 3 L 17 0 L 33 0 L 38 3 L 46 3 L 50 5 L 0 5 L 4 3 L 46 3 L 50 5 L 46 8 L 38 8 L 33 10 L 17 10 L 13 8 L 4 8 L 0 5 L 4 8 L 46 8", "Alien");
Game.polygon.fromSVG("M 0 0 L 5 0", "Alien Bullet");

var keys = Game.input.keys;

Game.entity.define("Spaceship", {
    speed: 12,
    maxSpeed: 300,
    
    turnSpeed: 360,
    rotation: 0,
    
    fireRate: 6,
    fireDelta: 0,
    
    killed: false,
    lives: 2,
    respawnTime: 2000,
    respawnTicks: 0,
    
    pool: false,
                
    constructor: function()
    {
        this.position = Game.vector(0, 0);
        this.velocity = Game.vector(0, 0);
        
        this.defaultPolygon = Game.polygon.create("Spaceship");
        this.thrustPolygon = Game.polygon.create("Spaceship Thrust");
                
        let polygon = this.polygon = this.defaultPolygon;
        
        this.w = polygon.w;
        this.h = polygon.h;
        
        this.reset();
                
        this.visible = true;
    },
    
    reset: function()
    {
        let position = this.position, polygon = this.polygon;
        
        this.rotation = 0;
        
        this.velocity.set(0, 0);
        
        this.position.set(Game.vector(stage.width / 2 - polygon.w / 2, stage.height / 2 - polygon.h / 2));
        this.polygon.moveTo(this.position);
        this.polygon.rotateTo(0, position.x + this.w / 2, position.y + this.h * 2 / 3);
        
        this.fireDelta = 1000 / this.fireRate;
    },
    
    move: function(dt)
    {
        let position = this.position, velocity = this.velocity;
        
        let speed = this.speed * dt, maxSpeed = this.maxSpeed * dt, friction = this.world.friction * dt, turnSpeed = this.turnSpeed * dt;
                
        let force = Game.vector(0, 0);
        
        if(keys.a || keys.arrowleft)
            this.rotation -= turnSpeed;
        
        if(keys.d || keys.arrowright)
            this.rotation += turnSpeed;
        
        let rad = (this.rotation - 90) % 360 * Math.PI / 180;
        
        let horizVel = speed * Math.cos(rad);
        let vertVel = speed * Math.sin(rad);
        
        let thrusting = this.thrusting = !!(keys.w || keys.arrowup);
        
        let poly = this.polygon = thrusting ? this.thrustPolygon : this.defaultPolygon;
        
        if(thrusting)
            force.add(horizVel, vertVel);
        
        velocity.add(force).limit(-maxSpeed, maxSpeed);
        position.add(velocity);
        
        if(position.x >= stage.width && velocity.x > 0)
            position.x = -poly.w;
        
        if(position.x <= -poly.w && velocity.x < 0)
            position.x = stage.width;
        
        if(position.y >= stage.height && velocity.y > 0)
            position.y = -poly.h;
        
        if(position.y <= -poly.h && velocity.y < 0)
            position.y = stage.height;
        
        poly.moveTo(position);
        poly.rotateTo(this.rotation, position.x + this.w / 2, position.y + this.h * 2 / 3);
    },
    
    shoot: function()
    {
            let position = this.position;    
        
            let origin = Game.vector(position.x + this.w / 2, position.y + this.h * 2 / 3);
            let bulletPos = Game.vector(position.x + this.w / 2, position.y);

            let angle = this.rotation * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);

            let ax = bulletPos.x - origin.x, ay = bulletPos.y - origin.y;

            let newX = ax * cos - ay * sin + origin.x;
            let newY = ax * sin + ay * cos + origin.y;

            bulletPos.set(newX, newY);

            let bullet = Game.entity.create("Bullet", bulletPos, this.velocity.clone(), this.rotation);

            this.world.add(bullet);

            this.fireDelta = 0;
    },
    
    kill: function()
    {
        this.killed = true;
        this.visible = false;
        this.noCollisionCheck = true;
        
        let polygon = this.polygon;
        
        this.reset();
        
        if(this.lives === 0)
            Game.state.enter("Game Over Screen");
        else
            this.lives--;
    },
    
    collisionCheck: function(e)
    {        
		let collided = false;
	
        if(e.is("Asteroid") && this.polygon.overlaps(e.polygon))
        {            
            this.kill();
            
            e.breakApart();
        }
		else if(e.is("Alien") && this.polygon.overlapsRect(e.rect))
		{
			this.kill();
			
			e.destroy();
		}
		else if(e.is("Alien Bullet") && this.polygon.containsPoint(e.position))
		{
			this.kill();
			
			e.destroy();
		}
    },
    
    update: function(dt)
    {
        if(this.killed)
        {
            if(this.respawnTicks > this.respawnTime)
            {                
                if(Game.grid.search(this).length === 0)
                {
                    this.killed = false;
                    this.visible = true;
                    this.noCollisionCheck = false;
                    
                    this.respawnTicks = 0;
                }
            }
            else
                this.respawnTicks += (1000 * dt);
        }
        else
        {
            this.move(dt);
                        
            if(this.fireDelta >= (1000 / this.fireRate))
            {                
                if(keys.space)
                    this.shoot();
            }
            else
                this.fireDelta += dt * 1000;
        }
    },
    
    draw: function(ctx)
    {        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        
        let position = this.position, w = this.w, h = this.h;
                
        ctx.beginPath();       
            this.polygon.draw(ctx, {stroke: true});
                
        ctx.closePath();
    }
});

Game.entity.define("Bullet", {
    r: 2,
    speed: 360,
    
    constructor: function(position, initialVelocity, angle)
    {
        this.position = position;
        this.initialVelocity = initialVelocity;
        this.rotation = angle;
                
        this.lifeSpan = 1000;
    },
    
    update: function(dt)
    {
        let position = this.position, initialVelocity = this.initialVelocity;
        
        let speed = this.speed * dt, rad = (this.rotation - 90) * Math.PI / 180;
        
        let horizVel = speed * Math.cos(rad);
        let vertVel = speed * Math.sin(rad);
                
        let velocity = Game.vector(initialVelocity).add(horizVel, vertVel);
        
        position.add(velocity);
        
        let r = this.r;
        
        if(position.x - r < 0 && velocity.x < 0)
            position.x = stage.width + r;
        else if(position.x + r > stage.width && velocity.x > 0)
            position.x = -r;
        
        if(position.y - r < 0 && velocity.y < 0)
            position.y = stage.height + r;
        else if(position.y + r > stage.height && velocity.y > 0)
            position.y = -r;
        
        this.lifeSpan -= 1000 * dt;
        
        if(this.lifeSpan <= 0)
            this.destroy();
    },
    
    draw: function(ctx)
    {
        ctx.fillStyle = "white";
        
        let position = this.position;
        
        ctx.beginPath();
            ctx.arc(position.x, position.y, this.r, 0, 2 * Math.PI);
        ctx.closePath();
                        
        ctx.fill();
    }
});

const SIZE_VALUE = {
    SMALL: 2,
    MEDIUM: 1,
    LARGE: 0
};

Game.entity.define("Asteroid", {    
    baseSpeed: 100,
    speedScale: 20,
    
    rotation: 0,
    baseRotationSpeed: 40,
    rotationSpeedScale: 15,
    
    unfilteredSearch: true,
    
    constructor: function(size, position, direction)
    { 
        this.position = position;
        
        let rand = Game.random(2 * Math.PI);
        this.direction = direction || Game.vector(Math.cos(rand), Math.sin(rand));
        
        this.size = size in SIZE_VALUE ? size : "LARGE";
                
        let value = SIZE_VALUE[this.size];
        
        this.speed = this.baseSpeed + this.speedScale * value;
        this.rotationSpeed = this.baseRotationSpeed + this.rotationSpeedScale * value;
                
        this.polygon = Game.polygon.create("Asteroid " + this.size);
		
		this.positioned = false;
		this.timesRepositioned = 0;
    },
    
    worldAdd: function()
    {
        let position = this.position;
        
        if(position)
        {
            this.position = position;
            this.polygon.moveTo(position);
			this.positioned = true;
        }
        else
            this.randomPosition();  
    },
    
    randomPosition: function()
    {
        let polygon = this.polygon, player;
        
        player = this.world.get("Spaceship")[0];
                        
        this.position = Game.vector(Game.random(stage.width), Game.random(stage.height));
        
        if(player && this.position.distanceTo(player.position) < 175 && ++this.timesRepositioned < 1000)
            this.randomPosition();
		else if(!this.positioned)
			this.timesRepositioned = 0;
        else
		{
            polygon.moveTo(this.position);
			this.positioned = true;
		}
    },
    
    move: function(dt)
    {
        let position = this.position, speed = this.speed * dt, direction = this.direction, polygon = this.polygon;
        
        let vx = direction.x * speed, vy = direction.y * speed;
        
        position.add(direction.x * speed, direction.y * speed);
        
        this.rotation = (this.rotation + this.rotationSpeed * dt) % 360;
        polygon.rotateTo(this.rotation);
                
        if(position.x < -polygon.w && direction.x < 0)
            position.x = stage.width;
        else if(position.x > stage.width && direction.x > 0)
            position.x = -polygon.w;
        
        if(position.y < -polygon.h && direction.y < 0)
            position.y = stage.height;
        else if(position.y > stage.height && direction.y > 0)
            position.y = -polygon.h;
        
        this.polygon.moveTo(position);
    },
    
    collisionCheck: function(e)
    {        
        if(e.is("Bullet") && this.polygon.containsPoint(e.position))
        {
            e.destroy();
            this.breakApart();
            
            Scoreboard.increment(100);
        }
		else if(e.is("Alien") && this.polygon.overlapsRect(e.rect))
		{
			e.destroy();
			this.breakApart();
		}
		else if(e.is("Alien Bullet") && this.polygon.containsPoint(e.position))
		{
			e.destroy();
			this.breakApart();
		}
    },
    
    breakApart: function()
    {
        if(this.size != "SMALL")
        {
            let position = this.position, direction = this.direction, dirOffset = Game.vector(direction).multiply(30, 30);
            
            let angle = Math.PI / 6, cos = Math.cos(angle), sin = Math.sin(angle), dirChange = Game.vector(cos, sin); 
            
            let a1Pos = Game.vector(position).add(dirOffset);
            let a2Pos = Game.vector(position).subtract(dirOffset);
            
            let size = this.size == "LARGE" ? "MEDIUM" : "SMALL";
            
            this.world.add(Game.entity.create("Asteroid", size, a1Pos, direction.clone().subtract(dirChange).normalize()));
            this.world.add(Game.entity.create("Asteroid", size, a2Pos, direction.clone().add(dirChange).normalize()));
        }
        
        this.destroy();
    },
    
    update: function(dt)
    {
        this.move(dt);
    },
    
    draw: function(ctx)
    {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        
        this.polygon.draw(ctx, {stroke: true});
    }
});

Game.entity.define("Alien", {
    speed: 100,
	
	horizontalDirection: 0,
	verticalDirection: 0,
	
	verticalChangeRate: 2,
	verticalChangeDelta: 0,
	
	fireRate: 1.25,
	fireDelta: 0,
	
	searchRadius: 200,
	
    constructor: function()
    {
        this.polygon = Game.polygon.create("Alien");
        
        this.w = this.polygon.w;
        this.h = this.polygon.h;
		
		this.position = Game.vector(0, 0);
		this.velocity = Game.vector(0, 0);
		
		this.positioned = false;
		this.timesRepositioned = 0;
    },
    
    worldAdd: function()
    {
        this.randomPosition();
    },
    
    randomPosition: function()
    {
        let position = this.position;
        
        position.set(Game.vector(Game.random.item([-this.w, stage.width]), Game.random(stage.height - this.h)));
        // position.set(Game.vector(stage.width / 2 - this.w / 2, stage.height / 2 - this.h / 2));
        
        if(position.x == -this.w)
            this.horizontalDirection = 1;
        else
            this.horizontalDirection = -1;
        
		this.verticalDirection = Game.random.item([-1, 1]);
		
        if(Game.grid.searchUnfiltered(this).length != 0 && ++this.timesRepositioned < 100)
            this.randomPosition();
        else if(!this.posititioned)
			this.timesRepositioned = 0;
		else
		{
            this.polygon.moveTo(position);
			this.positioned = true;
		}
    },
	
	shoot: function()
	{	
		let position = this.position, cx = position.x + this.w / 2, cy = position.y + this.h / 2, r = this.searchRadius;
		
		let bulletPos = Game.vector(cx, cy);
		
		let nearby = Game.grid.searchUnfiltered({
			x: cx - r,
			y: cy - r,
			w: r * 2,
			h: r * 2
		});
		
		let angle = null;
		
		if(nearby.length > 1)
		{
			let e, distance, closestDistance = Infinity, closest;
			
			for(var i = 0, l = nearby.length; i < l; i++)
			{
				e = nearby[i];
				
				if(e == this || e.is("Bullet"))
					continue;
				
				distance = bulletPos.distanceTo(e.position, true);
				
				if(distance < closestDistance)
				{
					closestDistance = distance;
					closest = e;
				}
			}
						
			if(closest)
				angle = bulletPos.angleTo(Game.vector(closest.position).add(closest.rect.w / 2, closest.rect.h / 2)) * 180 / Math.PI + 90;			
		}
		
		if(angle == null)
			angle = Game.random(360);
		
		this.world.add(Game.entity.create("Alien Bullet", bulletPos, Game.vector(0, 0), angle));
	},
	
	collisionCheck: function(e)
	{
		if(e.is("Bullet") && this.polygon.pointInBounds(e.position))
		{
			e.destroy();
			this.destroy();
			
			Scoreboard.increment(500);
		}
	},
    
    update: function(dt)
    {        
        let polygon = this.polygon, position = this.position, velocity = this.velocity, speed = this.speed * dt;
        
		let ms = dt * 1000;
		
        velocity.set(speed * this.horizontalDirection, speed * this.verticalDirection);
        
        this.position.add(velocity);
        
        if(position.x < -polygon.w && velocity.x < 0)
            position.x = stage.width;
        else if(position.x > stage.width && velocity.x > 0)
            position.x = -polygon.w;
        
        if(position.y < -polygon.h && velocity.y < 0)
            position.y = stage.height;
        else if(position.y > stage.height && velocity.y > 0)
            position.y = -polygon.h;
        
        polygon.moveTo(this.position);
		
		if(this.fireDelta >= 1000 / this.fireRate)
		{
			this.shoot();
			
			this.fireDelta = 0;
		}
		else
			this.fireDelta += ms;
		
		if(this.verticalChangeDelta >= 1000 / this.verticalChangeRate)
		{
			this.verticalDirection = Game.random.item([-1, 1]);
						
			this.verticalChangeDelta = 0;
		}
		else
			this.verticalChangeDelta += ms;
    },
    
    draw: function(ctx)
    {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        
        this.polygon.draw(ctx, {stroke: true});
    }
});

Game.entity.extend("Bullet", "Alien Bullet", {	
	constructor: function(position, initialVelocity, angle)
	{
		this.position = position;
        this.initialVelocity = initialVelocity;
        this.rotation = angle;
                
        this.lifeSpan = 1000;
	}
});

function measure(ctx, text)
{
    return ctx.measureText(text).width;
}

function middleText(ctx, text, y)
{
    let w = measure(ctx, text), h = measure(ctx, "M");
    
    ctx.strokeText(text, stage.width / 2 - w / 2, y);
}

var Scoreboard = {
    score: 0,
    highscore: 0,
    
    newHighscore: false,
    
    flashRate: 3,
    flashDelta: 0,
    textShown: true,
    
    scoreFlashDuration: 0,
    scoreFlashing: false,
    
    highscoreFlashing: false,
    
    increment: function(amount)
    {
        this.score += amount;
        
        if(this.score > this.highscore)
        {    
            this.highscore = this.score;
            this.newHighscore = true;
        }
    },
    
    flashScore: function(duration)
    {
        this.scoreFlashDuration = duration;
        this.scoreFlashing = true;
    },
    
    flashHighscore: function()
    {
        this.highscoreFlashing = true;
    },
    
    reset: function()
    {
        this.score = 0;
        this.scoreFlashing = false;
        this.highscoreFlashing = false;
        this.newHighscore = false;
    },
    
    update: function(dt)
    {
        let ms = dt * 1000;
        
        this.flashDelta += ms;
        
        if(this.flashDelta >= 1000 / this.flashRate)
        {
            this.textShown = !this.textShown;
            this.flashDelta = 0;
        }
        
        if(this.scoreFlashing)
        {
            this.scoreFlashDuration -= ms;
            
            if(this.scoreFlashDuration <= 0)
            {
                this.scoreFlashDuration = 0;
                this.scoreFlashing = false;
            }
        }
    },
    
    draw: function(ctx)
    {
        ctx.fillStyle = "white";
        ctx.font = "15px Courier";
        
        if(this.scoreFlashing ? this.textShown : true)
        {    
            ctx.fillText("Score: " + this.score, 10, 15);
        }
        
        if(this.highscoreFlashing && this.newHighscore ? this.textShown : true)
        {
            let highscoreText = "Highscore: " + this.highscore;        
            ctx.fillText(highscoreText, stage.width - measure(ctx, highscoreText) - 10, 15);
        }
    }
};

Game.state.add("Start Screen", {
    blinkRate: 2,
    blinkDelta: 0,
    textShown: true,
    
    keydown: {
        enter: "Game Screen"
    },
    
    enter: function()
    {
        Game.world.enter("Asteroid Backdrop");
    },
    
    update: function(dt)
    {
        Game.world.current.update(dt);
        
        if(this.blinkDelta >= 1000 / this.blinkRate)
        {
            this.textShown = !this.textShown;
            
            this.blinkDelta = 0;
        }
        else
            this.blinkDelta += 1000 * dt;
    },
    
    draw: function(ctx)
    {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, stage.width, stage.height);
        
        Game.world.current.draw(ctx);
        
        ctx.strokeStyle = "white";
        ctx.font = "80px Courier";
        middleText(ctx, "ASTEROIDS", stage.height / 4);
        
        ctx.font = "30px Courier";
        if(this.textShown)
        {
            middleText(ctx, "Press ENTER to start", stage.height * 3 / 4);
        }
    }
});

Game.state.add("Game Screen", {
    keydown: {
        p: "Pause Screen",
        r: () => {
            Game.world.exit();
            Game.world.enter("Asteroids");
        }
    },
    
    enter: function()
    {
        Game.world.enter("Asteroids");
    },
    
    update: function(dt)
    {
        Game.world.current.update(dt);
    },
    
    draw: function(ctx)
    {
        Game.world.current.draw(ctx);
    }
});

Game.state.add("Pause Screen", {
    keydown: {
        "p": "Game Screen"
    },
    
    draw: function(ctx)
    {
        Game.world.current.draw(ctx);
        
        ctx.font = "50px Courier";
        middleText(ctx, "PAUSED", stage.height / 2);
    }
});

Game.state.add("Game Over Screen", {
    keydown: {
        enter: "Start Screen"
    },
    
    enter: function()
    {
        let player = Game.world.current.get("Spaceship")[0];
        
        if(player)
            player.destroy();
        
        Scoreboard.flashHighscore();
		
		Game.world.current.noCollision = true;
    },
    
    update: function(dt)
    {
        Game.world.current.update(dt);
    },
    
    draw: function(ctx)
    {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, stage.width, stage.height);
        
        Game.world.current.draw(ctx);
        
        ctx.strokeStyle = "white";
        
        ctx.font = "50px Courier";
        middleText(ctx, "GAME OVER", stage.height / 3);
        
        ctx.font = "30px Courier";
        middleText(ctx, "Press ENTER to return to start", stage.height * 3 / 4);
    },
    
    exit: function()
    {
        Scoreboard.reset();
		
		Game.world.current.noCollision = false;
    }
});

Game.world.add("Asteroid Backdrop", {
    largeAsteroids: 4,
    mediumAsteroids: 6,
    smallAsteroids: 8,
    
    enter: function()
    {
        let i = 0, l;
        
        for(l = this.largeAsteroids; i < l; i++)
        {
            this.add(Game.entity.create("Asteroid"));
        }
        
        for(i = 0, l = this.mediumAsteroids; i < l; i++)
        {
            this.add(Game.entity.create("Asteroid", "MEDIUM"));
        }
        
        for(i = 0, l = this.smallAsteroids; i < l; i++)
        {
            this.add(Game.entity.create("Asteroid", "SMALL"));
        }        
    }
});

Game.world.add("Asteroids", {    
    round: 0,
    baseAsteroids: 6,
    asteroidsScale: 1,
    
    delayTime: 1000,
    delayDelta: 0,
	
	alienSpawnRate: 0.05,
	spawnRateScale: 0.01,
	spawnDelta: 0,
	
	maxAliens: 1,
	maxAliensScale: 0.5,
        
    enter: function(lastState)
    {        
        this.add(Game.entity.create("Spaceship"));
        
        this.nextRound();
    },
    
    nextRound: function()
    {
        let l = this.baseAsteroids + this.round * this.asteroidsScale;
                        
        for(var i = 0; i < l; i++)
        {
            this.add(Game.entity.create("Asteroid"));
        }
        
        if(this.round > 0)
        {
            Scoreboard.increment(1000);
            Scoreboard.flashScore(3000);
        }

        this.round++;
    },
    
    update: function(dt)
    {
        if(this.delayDelta >= this.delayTime)
        {
            this.updateEntities = true;
			
			if(this.count("Alien") < this.maxAliens + Math.floor(this.round * this.maxAliensScale))
			{
				if(this.spawnDelta >= 1000 / this.alienSpawnRate)
				{
					this.add(Game.entity.create("Alien"));
					
					this.spawnDelta = 0;
				}
				else
					this.spawnDelta += dt * 1000;
			}
			
            if(Game.world.current.count("Asteroid") === 0)
                this.nextRound();
        }
        else
        {
            this.updateEntities = false;
            this.delayDelta += dt * 1000;
        }
        
        Scoreboard.update(dt);
    },
    
    draw: function(ctx)
    {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, stage.width, stage.height);
        
        Scoreboard.draw(ctx);
        
        if(keys.g)
            Game.grid.debug.draw(ctx);
    },
    
    exit: function()
    {
        this.round = 0;
        this.delayDelta = 0;
    }
});

Game.state.enter("Start Screen");

Game.loop.useCtx(stage.getContext("2d"));
Game.loop.start(60, true);