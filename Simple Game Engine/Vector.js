var Game = window.Game || {};

var Vector = function(x, y)
{
    if(x instanceof Vector)
    {
        y = x.y;
        x = x.x;
    }
    
    this.x = x;
    this.y = y;
};

Vector.prototype.set = function(v, y)
{
    let x = v.x;
    
    if(y != undefined)
    {
        x = v;
        y = y;
    }
    else
        y = v.y;
    
    this.x = x;
    this.y = y;
    
    return this;
};

Vector.prototype.add = function(v, y){
    let x = v.x;
    
    if(y != undefined)
    {
        x = v;
        y = y;
    }
    else
        y = v.y;
        
    this.x += x;
    this.y += y;
    
    return this;
};

Vector.prototype.subtract = function(v, y){
    let x = v.x;
    
    if(y != undefined)
    {
        x = v;
        y = y;
    }
    else
        y = v.y;
    
    this.x -= x;
    this.y -= y;
    
    return this;
};

Vector.prototype.multiply = function(v, y){
    let x = v.x;
    
    if(y != undefined)
    {
        x = v;
        y = y;
    }
    else
        y = v.y;
    
    this.x *= x;
    this.y *= y;
    
    return this;
};

Vector.prototype.divide = function(v, y){
    let x = v.x;
    
    if(y != undefined)
    {
        x = v;
        y = y;
    }
    else
        y = v.y;
    
    if(x != 0)
        this.x /= x;
    
    if(y != 0)
        this.y /= y;
    
    return this;
};

Vector.prototype.distanceTo = function(v, noSqrt)
{
    let c = Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2);
    
    return noSqrt == true ? c : Math.sqrt(c);
};

Vector.prototype.magnitude = function(noSqrt)
{
    let c = Math.pow(this.x, 2) + Math.pow(this.y, 2);
    
    return noSqrt == true ? c : Math.sqrt(c);
};

Vector.prototype.normalize = function()
{
    let mag = this.magnitude();
    
    return this.divide(mag, mag);
};

Vector.prototype.angle = function()
{
    return Math.atan(this.y / this.x);
};

Vector.prototype.angleTo = function(v, y)
{
    let x = v.x;
    
    if(y != undefined)
    {
        x = v;
        y = y;
    }
    else
        y = v.y;
    
    let dx = x - this.x, dy = y - this.y;
    
    return Math.atan2(dy, dx);
};

Vector.prototype.limit = function(min, max)
{
    this.x = Math.max(Math.min(this.x, max), min);
    this.y = Math.max(Math.min(this.y, max), min);
    
    return this;
};

Vector.prototype.equals = function(v, y)
{
    let x = v.x;
    
    if(y != undefined)
    {
        x = v;
        y = y;
    }
    else
        y = v.y;
    
    return this.x == x && this.y == y;
};

Vector.prototype.clone = function()
{
    return new Vector(this);
};

Game.vector = (x, y) => new Vector(x, y);