var Game = window.Game || {};

Game.world = (function(){
    var stage, ctx, rect = {x: 0, y: 0, w: 0, h: 0};
    
    var worlds = {}, currentWorld;
    
    var World = function(name, options)
    {
        this.name = name;
        this.entities = [];
        
        this.updateEntities = true;
        this.drawEntities = true;
        
        for(var i in options)
        {
            let prop;
            
            if(i in this == false)
            {
                prop = this[i];
                
                if(typeof prop == "function")
                    this[i] = options[i].bind(this);
                else
                    this[i] = options[i];
            }
        }
        
        if(options.update)
            this.updateFunc = options.update;
        
        if(options.draw)
            this.drawFunc = options.draw;
        
        if(options.entities && options.entities.length > 0)
        {            
            options.entities.forEach((e) => this.add(e));
        }
        
        if(Game.state)
        {
            Game.state.add("world-" + name, this);
        }
    };
    
    World.prototype = {
        add: function(...entity)
        {
            let entities = this.entities, e;
                        
            for(var i = 0, l = entity.length; i < l; i++)
            {
                e = entity[i];
                
                if(entities.indexOf(e) != -1)
                    continue;
                
                e.world = this;
                
                if(Game.grid && !e.noSpatialHash)
                    Game.grid.add(e, true);
                
                if(e.worldAdd)
                    e.worldAdd();
                
                entities.push(e);
            }
        },
        
        remove: function(...entity)
        {
            let entities = this.entities, e, index;
            
            for(var i = 0, l = entity.length; i < l; i++)
            {
                e = entity[i];
                index = entities.indexOf(e);
                
                if(index != -1)
                {
                    if(e.worldRemove)
                        e.worldRemove();
                    
                    e.world = null;
                    
                    if(Game.grid && !e.noSpatialHash)
                        Game.grid.remove(e);
                    
                    entities.splice(index, 1);
                }
            }
        },
        
        get: function(...names)
        {
            let entities = this.entities, result = [], e;
            
            if(names.length === 0)
                return entities.slice(0);
            
            for(var i = 0, l = entities.length; i < l; i++)
            {
                e = entities[i];
                
                if(names.indexOf(e.name) > -1)
                    result.push(e);
            }
            
            return result;
        },
        
        count: function(...names)
        {
            let entities = this.entities, result = 0, e;
            
            if(names.length === 0)
                return entities.length;
            
            for(var i = 0, l = entities.length; i < l; i++)
            {
                e = entities[i];
                
                if(names.indexOf(e.name) > -1)
                    result++;
            }
            
            return result;
        },
        
        update: function(dt)
        {
            let entities = this.entities, e;
            
            if(this.updateFunc)
                this.updateFunc(dt);
            
            if(this.updateEntities == false)
                return;
            
            for(var i = 0, l = entities.length; i < l; i++)
            {
                e = entities[i];
                
                if(!e)
                    continue;
                
                if(e.update)
                {
                    if(e.lastPosition)
                        e.lastPosition.set(e.position);
                    
                    e.update(dt);
                }
                
                if(this.noCollision != true && Game.grid && entities.indexOf(e) != -1)
                {
                    if(!e.noSpatialHash)
                        Game.grid.refresh(e);
                    
                    if(!e.noCollisionCheck && e.collisionCheck)
                    {
                        if(e.unfilteredSearch)
                            Game.grid.searchUnfiltered(e, e.collisionCheck, e);
                        else
                            Game.grid.search(e, e.collisionCheck, e);
                        
                    }
                }
            }
        },
        
        draw: function(altCtx)
        {            
            let ct = altCtx || ctx;
            
            if(this.drawFunc)
                this.drawFunc(ct);
            
            if(this.drawEntities == false)
                return;
            
            if(Game.grid)
            {
                Game.grid.search(rect, (e) => {
                    if(e.draw && e.visible)
                        e.draw(ct);
                });
            }
            else {
                let entities = this.entities, e;
                
                for(var i = 0, l = entities.length; i < l; i++)
                {
                    e = entities[i];

                    if(e && e.draw && e.visible)
                        e.draw(ct);
                }
            }
        }
    };
    
    World.init = function(stageElem)
    {
        stage = stageElem;
        ctx = stageElem.getContext("2d");
        
        rect.w = stage.width;
        rect.h = stage.height;
    };
    
    World.add = function(name, options)
    {
        let world = new World(name, options || {});
        worlds[name] = world;
        
        return world;
    };
    
    World.remove = function(name)
    {
        delete worlds[name];
        
        if(Game.state)
            Game.state.remove(name);
    };
    
    World.get = function(name)
    {
        return worlds[name];
    };
    
    World.enter = function(name, ...data)
    {
        let world = worlds[name];
        
        if(!world || currentWorld == world)
            return;
        
        if(Game.grid)
            Game.grid.clear();
        
        World.exit();
        
        if(world.enter)
        {
            world.enter(...data);
        }
        
        currentWorld = world;
    };
    
    World.exit = function(name, ...data)
    {     
        let world = name == undefined || name == "current" ? currentWorld : worlds[name];
        
        if(!world || currentWorld != world)
            return;
        
        if(Game.grid)
            Game.grid.clear();
        
        world.entities = [];
        
        if(world.exit)
            world.exit(...data);
        
        currentWorld = null;
    };
    
    World.is = function(name)
    {
        return currentWorld && currentWorld.name == name;
    };
    
    Object.defineProperty(World, "current", {
        enumerable: true,
        
        get()
        {
            return currentWorld;
        }
    });
    
    return World;
})();