var Game = window.Game || {};

Game.camera = (function()
{
	let stage, ctx;
	
	// track modes - fixed|instant|lag|lead
	// zoom modes - fixed|instant|smooth
	
	function bound(min, max, val)
	{
		return Math.max(Math.min(val, max), min);
	}
	
	var Camera = {
		world: null,
		
		entities: [],
		
		x: 0,
		y: 0,
		w: 0,
		h: 0,
		
		destination: {
			x: 0,
			y: 0,
			
			zoom: 1
		},
		
		bounds: {
			x1: -Infinity,
			y1: -Infinity,
			
			x2: Infinity,
			y2: Infinity
		},
		
		zoom: 1,
		zoomMode: "instant",
		zoomEase: 5,
		
		isTracking: false,
		trackMode: "static",
		trackTarget: null,
		
		init: function(stageElem)
		{
			stage = stageElem;
			ctx = stageElem.getContext("2d");
			
			this.w = stage.width;
			this.h = stage.height;
		},
		
		view: function(world)
		{
			this.world = world;
			this.entities = world.entities || [];
		},
		
		calcEntityRect: function(e)
		{
			let rect = e.polygon || e.rect || e, zoom = this.zoom;
			
			if(zoom == 1)
				return rect;
			
			return {
				x: rect.x * zoom,
				y: rect.y * zoom,
				w: rect.w * zoom,
				h: rect.h * zoom
			};
		},
		
		canView: function(e)
		{			
			if(!e.visible)
				return false;
			
			let rect = this.calcEntityRect(e);
			
			return rect.x <= this.x + this.w && rect.x + rect.w >= this.x && rect.y <= this.y + this.h && rect.y + rect.h >= this.y;
		},
		
		move: function(x, y)
		{
			let dest = this.destination, bounds = this.bounds;
			
			dest.x = bound(bounds.x1, bounds.x2, dest.x + x);
			dest.y = bound(bounds.y1, bounds.y2, dest.y + y);
			
			return this;
		},
		
		moveTo: function(x, y)
		{
			let dest = this.destination, bounds = this.bounds;
			
			dest.x = bound(bounds.x1, bounds.x2, x);
			dest.y = bound(bounds.y1, bounds.y2, y);
			
			return this;
		},
		
		centerOn: function(x, y)
		{
			this.moveTo(x - this.w / 2, y - this.h / 2);
		},
		
		zoomBy: function(zoom)
		{
			let dest = this.destination;
			
			dest.zoom = Math.max(dest.zoom + zoom, 0);
			
			return this;
		},
		setZoom: function(zoom)
		{
			let dest = this.destination;
			
			dest.zoom = Math.max(zoom, 0);
			
			return this;
		},
		
		track: function(e)
		{
			this.trackTarget = e;
			
			this.isTracking = true;
		},
		pauseTrack: function()
		{
			this.isTracking = false;
		},
		resumeTrack: function()
		{
			this.isTracking = true;
		},
		stopTrack: function()
		{
			this.trackTarget = null;
			this.isTracking = false;
		},
		
		instantTracking: function()
		{
			let dest = this.destination;
			
			this.x = dest.x;
			this.y = dest.y;
		},
		lagTracking: function(dt)
		{},
		leadTracking: function(dt)
		{},
		
		update: function(dt)
		{	
			let trackMode = this.trackMode, dest = this.destination;
		
			if(trackMode != "fixed" && this.isTracking && this.trackTarget)
			{
				let target = this.trackTarget, rect = target.polygon || target.rect || target;
				
				this.centerOn(rect.x + rect.w / 2, rect.y + rect.h / 2);
				
				switch(trackMode)
				{					
					case "instant":
						this.instantTracking();
					break;
					
					case "lag":
						this.lagTracking(dt);
					break;
					
					case "lead":
						this.leadTracking(dt);
					break;
				}
			}
			else
			{
				this.x = dest.x;
				this.y = dest.y;
			}
			
			if(this.zoomMode == "instant")
				this.zoom = dest.zoom;
			else if(this.zoomMode == "smooth")
			{
				let diff = dest.zoom - this.zoom;
				
				this.zoom += dest.zoom / this.zoomEase;
				
				if(diff > 0 && this.zoom > dest.zoom || diff < 0 && this.zoom < dest.zoom)
					this.zoom = dest.zoom;
			}
		},
		
		draw: function()
		{			
			ctx.save();
				if(this.zoom != 1)
					ctx.scale(this.zoom, this.zoom);
				
				if(this.x != 0 || this.y != 0)
					ctx.translate(-this.x, -this.y);
				
				if(this.world)
					this.world.draw(ctx);
				else if(Game.grid)
					Game.grid.search(this, (e) => e.draw && e.draw(ctx));
				else
				{
					let entities = this.entities, e;
					
					for(var i = 0, l = entities.length; i < l; i++)
					{
						e = entities[i];
						
						if(e.draw && this.canView(e))
							e.draw(ctx);
					}
				}
			ctx.restore();
		}
	};
	
	return Camera;
})();