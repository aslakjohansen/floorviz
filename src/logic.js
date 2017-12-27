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
    
    ids = svgdoc.querySelectorAll('[id^=encoded]');
    console.log(ids);
}

