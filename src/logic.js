var index = {};

colorize = function (tag, color) {
    // read
    var attrs = tag.getAttribute("style").split(";");
    var d = {};
    for (var i=0 ; i<attrs.length; i++) {
        var elements = attrs[i].split(":");
        d[elements[0]] = elements[1];
    }
    
    // modify
    d["fill"] = color;
    
    // write
    attrs = "";
    for (var key in d) {
        if (attrs!="") attrs += ";";
        attrs += key+":"+d[key];
    }
    tag.setAttribute("style", attrs);
}

window.onload = function () {
    var o = document.getElementById("building");
    var svgdoc = o.contentDocument;
    var item = svgdoc.getElementById("path817");
    colorize(item, "#ff0000");
    
    ids = svgdoc.getElementsByTagName('*');
    console.log(ids);
    
    // generate index
    tags = svgdoc.querySelectorAll('[id^=encoded]');
    console.log(tags);
    for (var i=0 ; i<tags.length; i++) {
        tag = tags[i];
        elements = tag.getAttribute("id").split(":");
        if (elements.length != 2 || elements[0]!="encoded") {
            console.log("error in id match (len="+(elements.length)+", element0='"+elements[0]+"'):");
            console.log(tag);
        }
        
        d = {}
        pairs = elements[1].split(",");
        for (var j=0 ; j<pairs.length; j++) {
            parts = pairs[j].split("=");
            d[parts[0]] = parts[1];
        }
        if ("room" in d) {
            console.log("inside");
            index[d["room"]] = {
                "tag": tag,
                "data": d,
            }
        }
    }
    
    console.log(index);
}

