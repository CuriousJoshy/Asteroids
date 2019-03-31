var Game = window.Game || {};

Game.input = (function(){
    // Key event handlers

    var keys = {};

    function handleKey(e)
    {
        let key = e.key == " " ? "space" : e.key.toLowerCase();

        let handler = Game.state.current && Game.state.current[e.type], type;

        if(e.type == "keydown")
            keys[key] = true;      
        else
            delete keys[key];

        type = typeof handler;

        if(type == "function")
            handler(e, key);
        else if(type == "object")
        {        
            if(typeof handler[key] == "string")
                Game.state.enter(handler[key])
            else
                handler[key] && handler[key](e, key);
        }
        else if(type == "string")
            Game.state.enter(handler);
    }

    addEventListener("keydown", handleKey);
    addEventListener("keyup", handleKey);

    // Mouse event handlers

    var mouse = {
        x: 0,
        y: 0,

        left: false,
        middle: false,
        right: false
    };

    // From https://stackoverflow.com/questions/10527983/best-way-to-detect-mac-os-x-or-windows-computers-with-javascript-or-jquery
    const IS_MAC = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    const BUTTON_NAMES = ["left","middle","right"];

    function handleMouse(e)
    {    
        let changed = null;

        let macLeft = IS_MAC && (e.button == 0 && e.ctrlKey)

        switch(e.type)
        {
            case "mousedown":
                if(e.button == 2 || macLeft)
                    mouse.right = true;
                if(e.button == 0)
                    mouse.left = true;
                if(e.button == 1)
                    mouse.middle = true;

                changed = BUTTON_NAMES[macLeft ? 2 : e.button];
                break;

            case "mouseup":
                if(e.button == 2 || macLeft)
                    mouse.right = false;
                else if(e.button == 0)
                    mouse.left = false;
                else if(e.button == 1)
                    mouse.middle = false;

                changed = BUTTON_NAMES[macLeft ? 2 : e.button];

                break;

            case "mousemove":
                mouse.x = e.offsetX;
                mouse.y = e.offsetY;
                break;
        }

        let handler = Game.state.current && Game.state.current[e.type];
        let type = typeof handler;

        if(type == "function")
            handler(e, changed);
        else if(type == "object" && changed)
        {
            if(typeof handler[changed] == "string")
                Game.state.enter(handler[changed]);
            else
                handler[changed] && handler[changed](e, changed);
        }
        else if(type == "string")
            Game.state.enter(handler);
    }

    function setMouseEventTarget(stage)
    {    
        stage.addEventListener("mousedown", handleMouse);
        stage.addEventListener("mouseup", handleMouse);
        stage.addEventListener("click", handleMouse);
        stage.addEventListener("contextmenu", handleMouse);
        stage.addEventListener("mousemove", handleMouse);
    }
    
    return {
        init: setMouseEventTarget,
        
        keys: keys,
        mouse: mouse
    };
})();