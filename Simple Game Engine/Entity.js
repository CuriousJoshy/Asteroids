var Game = window.Game || {};

Game.entity = (function(){
    var uid = -1, classes = {}, pool = {};
    
    var _event = {on: () => null, off: () => null, trigger: () => null, triggerFor: () => null};
    
    function gameEvent()
    {
        return (Game.event || _event);
    }
    
	function defineRectProperty(prototype)
	{
		Object.defineProperty(prototype, "rect", {
            get: function()
            {
                let x, y, w, h;
                
                if(this.polygon)
                {
                    x = this.polygon.x;
                    y = this.polygon.y;
                    w = this.polygon.w;
                    h = this.polygon.h;
                }
                else
                {
                    x = this.position.x;
                    y = this.position.y;
                    
                    if(this.r != undefined)
                    {
                        w = h = this.r * 2;

                        x -= this.r;
                        y -= this.r;
                    }
                    else
                    {
                        w = this.w;
                        h = this.h;
                    }
                }

                return {
                    x: x,
                    y: y,
                    w: w || 0,
                    h: h || 0
                };
            }
        });
	}
	
    var Entity = function(){
        this.position = Game.vector(0, 0);
        this.velocity = Game.vector(0, 0);
        
        this.w = 0;
        this.h = 0;
    };

    Entity.prototype = {
        visible: true,
        
        is: function(name)
        {
            return this.name == name;
        },
        
        on: function(event, callback)
        {
            gameEvent().on(event, callback, this, this.id);
            
            return this;
        },
        
        off: function(event, callback)
        {
            gameEvent().off(event, callback, this, this.id);
            
            return this;
        },
        
        trigger: function(event, ...data)
        {
            gameEvent().triggerFor(this.id, event, ...data);
            
            return this;
        },
        
        destroy: function()
        {
            if(this.world)
                this.world.remove(this);
            
            Entity.destroy(this);
        }
    };

    Entity.define = function(name, prototype)
    {                
        let constructor = prototype.constructor || Entity.constructor;
                
        let _class = constructor;
        
        _class.prototype = Object.assign({}, Entity.prototype, prototype, {name: name, id: ++uid});
        
        defineRectProperty(_class.prototype);
        
        classes[name] = _class;        
        return _class;
    };

    Entity.extend = function(parent, name, prototype)
    {
        let parentClass = classes[parent];
        
        if(!parentClass)
            return Entity.define(name, prototype);
        
        prototype.constructor = prototype.constructor || function(){};
        
        let _class = prototype.constructor;
        
        _class.prototype = Object.assign({}, parentClass.prototype, prototype, {name: name, id: ++uid});
        
		defineRectProperty(_class.prototype);
		
        classes[name] = _class;
                
        return _class;
    };

    Entity.create = function(name, ...args)
    {
        let pooled = pool[name];
        
        let entity;
        
        if(pooled && pooled.length > 0)
        {
            let recycled = pooled.pop();
            
            recycled.constructor(...args);
                        
            entity = recycled;
        }
        else
        {    
            let _class = classes[name];

            if(!_class)
                return;

            entity = new _class(...args);
        }
        
        return entity;
    };
    
    Entity.destroy = function(entity)
    {
        if(!entity || entity.pool == false)
            return;
        
        let subPool = pool[entity.name];
        
        if(!subPool)
            subPool = pool[entity.name] = [];
        
        subPool.push(entity);        
    };
    
    return Entity;
})();