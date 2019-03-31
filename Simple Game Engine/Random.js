
var Game = window.Game || {};

Game.random = (function(){
    var Random = function(min, max)
    {
        if(min == undefined)
            return Math.random();
        else if(min < 0)
        {
            max = max || 0;
            
            return Random(max + (-min)) + min;
        }
        else if(max == undefined)
        {
            return Math.random() * min;
        }

        return Math.random() * (max - min) + min;
    };

    Random.number = (min, max) => Random(min, max);

    Random.int = (min, max) => Math.floor(Random(min, max));
    
    Random.boolean = function()
    {
        return !!Math.round(Random());
    };

    var CSS_COLOR_NAMES = ["aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque","black","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgrey","darkgreen","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","grey","green","greenyellow","honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgrey","lightgreen","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightslategrey","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue","slategray","slategrey","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","wheat","white","whitesmoke","yellow","yellowgreen"];
        
        Random.color = (type, alphaChannel) => {
            if(type == "name")
                return Random.item(CSS_COLOR_NAMES);
            else {                
                let r = Random.int(256), g = Random.int(256), b = Random.int(256), a = Random.int(256);

                if(type == "hex")
                    return "#" + r.toString(16) + g.toString(16) + b.toString(16) + (alphaChannel ? a.toString(16) : "");
                else if(type == "rgb")
                    return alphaChannel ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
                else if(type == "hsl")
                {
                    // RGB to HSL conversion From https://stackoverflow.com/questions/46432335/hex-to-hsl-convert-javascript

                    r /= 255, g /= 255, b /= 255;
                    let max = Math.max(r, g, b), min = Math.min(r, g, b);
                    let h, s, l = (max + min) / 2;

                    if(max == min)
                        h = s = 0; // achromatic
                    else 
                    {
                        var d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        switch(max) {
                            case r: h = (g - b) / d + (g < b ? 6 : 0); 
                                break;

                            case g: h = (b - r) / d + 2; 
                                break;

                            case b: h = (r - g) / d + 4; 
                                break;
                        }

                        h /= 6;
                    }

                    s = Math.round(s * 100);
                    l = Math.round(l * 100);
                    h = Math.round(360 * h);
                    a /= 255;

                    return alphaChannel ? `hsla(${h}, ${s}, ${l}, ${a})` : `hsl(${h}, ${s}, ${l})`;
                }
            }
        };

        Random.item = (array) => array[Random.int(array.length)];
    
    return Random;
})();
