
var Game = window.Game || {};

Game.polygon = (function(){
    var polygons = {};
    
    var Polygon = function(points, name)
    {        
        if(points instanceof Polygon)
            this.points = points.points.map((point) => [point[0], point[1]]);
        else if(arguments.length > 1 && Array.isArray(name))
            this.points = [...arguments];
        else
        {
            this.points = [...points];
        }
        
        this.rotation = 0;
		this.scale = [1, 1];
        this.rotationAnchor = [0.5, 0.5];
        
        this.recalcMinMax();
        
        if(name)
            polygons[name] = this;
    };
    
    Polygon.fromSVG = function(svgPath, name)
    {
        return new Polygon(svgPath.split(/(?<=\d) (?=[MLQAC])/).map((point) => {point = point.split(" "); return [parseInt(point[1]), parseInt(point[2])]}), name);
    };
    
    Polygon.create = function(name, preserveState)
    {
        if(polygons[name])
            return polygons[name].clone(preserveState);
    };
	
	Polygon.fromPoints = function(points, name)
	{
		return new Polygon(points, name);
	};
	
	Polygon.fromRect = function(rect, name)
	{
		let x = rect.x, y = rect.y, w = rect.w, h = rect.h;
		
		return new Polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], name);
	};

    Polygon.prototype.recalcMinMax = function()
    {
        let points = this.points, point;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        for(var i = 0, l = points.length; i < l; i++)
        {    
            point = points[i];

            minX = Math.min(minX, point[0]);
            maxX = Math.max(maxX, point[0]);
            minY = Math.min(minY, point[1]);
            maxY = Math.max(maxY, point[1]);
        }
        
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;

        this.recalcBounds();
    };

    Polygon.prototype.recalcBounds = function()
    {
        let lastX = this.x || 0, lastY = this.y || 0; 
        
        this.x = this.minX;
        this.y = this.minY;
        this.w = this.maxX - this.minX;
        this.h = this.maxY - this.minY;
        
        if(this.anchorX == undefined)
            this.anchorX = this.x;
        
        if(this.anchorY == undefined)
            this.anchorY = this.y;
    };
    
    Polygon.prototype.setRotationAnchor = function(x, y)
    {
        let ox = x, oy = y;
        
        if(y == undefined)
        {
            ox = x.x != undefined ? x.x : x[0];
            oy = x.y != undefined ? x.y : x[1];
        }
        
        this.rotationAnchor = [ox, oy];
            
        return this;
    };
	
	Polygon.prototype.scaleTo = function(x, y)
	{
		let scale = this.scale;
		
		if(scale[0] == x && scale[1] == y)
			return;
		
		if(y == undefined)
			y = x;
		
		this.points = this.map((point) => [point[0] * x, point[1] * y]);
		
		this.anchorX *= x;
		this.anchorY *= y;
		
		this.recalcMinMax();
		
		this.scale = [x, y];
		
		return this;
	};

    Polygon.prototype.move = function(v)
    {    
        let x = v.x != undefined ? v.x : v[0], y = v.y != undefined ? v.y : v[1];
        
        if(x === 0 && y === 0)
            return this;
        
        this.points = this.map((point) => [point[0] + x, point[1] + y]);
        
        this.anchorX += x;
        this.anchorY += y;

        this.recalcMinMax();

        return this;
    };
    
    Polygon.prototype.moveTo = function(p)
    {        
		let x = p.x != undefined ? p.x : p[0], y = p.y != undefined ? p.y : p[1];
		
        return this.move([x - this.anchorX, y - this.anchorY]);
    };

    Polygon.prototype.rotate = function(deg)
    {    
        if(deg === 0)
            return this;
        
        return this.rotateTo(this.rotation + deg);
    };

    Polygon.prototype.rotateTo = function(deg, ox, oy)
    {
        deg = deg % 360;

        if(deg == this.rotation)
            return this;

        let diff = deg - this.rotation, ra = this.rotationAnchor;

        this.rotation = deg;

        ox = ox || this.x + (this.w * ra[0]);
        oy = oy || this.y + (this.h * ra[1]);

        let rad = diff * Math.PI / 180;

        let cos = Math.cos(rad), sin = Math.sin(rad);

        this.each((point) => {
            let ax = point[0] - ox, ay = point[1] - oy;

            point[0] = ax * cos - ay * sin + ox;
            point[1] = ax * sin + ay * cos + oy;
        });

        this.recalcMinMax();

        return this;
    };
    
    Polygon.prototype.containsPoint = function(p)
    {
        let x = p.x != undefined ? p.x : p[0], y = p.y != undefined ? p.y : p[1];
                
        if(x < this.x || x > this.x + this.w || y < this.y || y > this.y + this.h)
            return false;
        
        let points = this.points, xi, xj, yi, yj;
        
        let inside = false, intersect;
        
        for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
            xi = points[i][0];
            yi = points[i][1];
            xj = points[j][0];
            yj = points[j][1];

            intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
            if (intersect)
                inside = !inside;
        }
            
        return inside;
    };
	
	Polygon.prototype.pointInBounds = function(p)
	{
		let x = p.x != undefined ? p.x : p[0], y = p.y != undefined ? p.y : p[1];
		
		return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h;
	};
    
    Polygon.prototype.overlaps = function(poly)
    {
        let a = this, b = poly;
        
        if(b.x < a.x)
            [a, b] = [b, a];
        
        let overlap = false, domain = [b.x, a.x + a.w], x, y;
        
        let hasPoint = (point) => {
            x = point[0];
            
            return b.containsPoint(point);
        };
        
        return a.any((point) => {
            x = point[0];
            
            return x >= domain[0] && x <= domain[1] && b.containsPoint(point);
        }) || b.any((point) => {
            x = point[0]; 
            return x >= domain[0] && x <= domain[1] && a.containsPoint(point);
        });
    };
	
	Polygon.prototype.overlapsRect = function(rect)
	{		
		return this.overlaps(Polygon.fromRect(rect));
	};

    Polygon.prototype.each = function(callback)
    {
        let points = this.points;

        for(var i = 0, l = points.length; i < l; i++)
        {
            callback(points[i], i);
        }
        
        return this;
    };
    
    Polygon.prototype.any = function(callback)
    {
        let points = this.points;

        for(var i = 0, l = points.length; i < l; i++)
        {
            if(callback(points[i], i))
                return true;
        }

        return false;
    };
    
    Polygon.prototype.every = function(callback)
    {
        let points = this.points;

        for(var i = 0, l = points.length; i < l; i++)
        {
            if(!callback(points[i], i))
                return false;
        }
        
        return true;
    };
	
	Polygon.prototype.map = function(callback)
	{
		let points = this.points, result = [];

        for(var i = 0, l = points.length; i < l; i++)
        {
            result.push(callback(points[i], i));
        }
		
		return result;
	};
    
    Polygon.prototype.draw = function(ctx, options)
    {
        ctx.beginPath();
        
        if(options.closePath)
            ctx.closePath();
        
        this.each((point, i) => {  
            if(i == 0)
                ctx.moveTo(...point);
            else
                ctx.lineTo(...point);
        });
        
        if(options.fill)
            ctx.fill();
        
        if(options.stroke)
            ctx.stroke();
    }

    Polygon.prototype.clone = function(preserveState)
    {
        let polygon = new Polygon(this);

        if(preserveState)
            polygon.rotateTo(this.rotation);

        return polygon;
    };
    
    return Polygon;
})();
