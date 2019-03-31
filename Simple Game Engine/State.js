var Game = window.Game || {};

// State Machine

Game.state = (function(){
    const NO_STATE_FOUND = "NO_STATE_FOUND", 
          WRONG_STATE = "WRONG_STATE", 
          ENTER_CONDITION_FAILED = "ENTER_CONDITION_FAILED", 
          EXIT_CONDITION_FAILED = "EXIT_CONDITION_FAILED", 
          EXIT_FAILED = "EXIT_FAILED", 
          SUCCESS = "SUCCESS";

    var states = {}, currentState;

    function addState(name, options)
    {        
        states[name] = {name: name, ...options};
    }

    function removeState(name)
    {
        let state = states[name];

        delete states[name];
    }

    function enterState(name, ...data)
    {
        let state = states[name];

        if(!state)
            return NO_STATE_FOUND;

        if(state.enterCondition && !state.enterCondition(...data))
            return ENTER_CONDITION_FAILED;

        let exitCode = exitState(null, ...data);

        if(exitCode == EXIT_CONDITION_FAILED)
            return EXIT_FAILED;

        if(state.enter)
            state.enter(...data);

        currentState = state;
        
        if(Game.loop)
            Game.loop.useState(state.name);

        return SUCCESS;
    }

    function exitState(...data)
    {
        let state = currentState;

        if(!state)
            return NO_STATE_FOUND;

        if(state.exitCondition && !state.exitCondition(...data))
            return EXIT_CONDITION_FAILED;

        if(state.exit)
            state.exit(...data);
        
        if(Game.loop)
            Game.loop.clearState(state.name);

        return SUCCESS;
    }

    function getState(name)
    {
        return states[name];
    }

    function stateIs(name)
    {
        return name && states[name] && states[name] == currentState;
    }
    
    return {
        add: addState,
        remove: removeState,
        enter: enterState,
        exit: exitState,
        
        get: getState,
        is: stateIs,
        
        get current()
        {
            return currentState;
        }
    };
})();