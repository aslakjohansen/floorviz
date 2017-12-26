window.onload=function(){
    //var svgdoc = document.querySelector(".svgClass").getSVGDocument()
    //var id = svgdoc.getElementById("path817")

    var o = document.getElementById("building");
    console.log(o);
    var svgdoc = o.contentDocument;
    console.log(svgdoc);
    var item = svgdoc.getElementById("path817");
    console.log(item);
    //var id = svgdoc.getElementById("encoded:floor=0,room=17,name=fox,type=shape")
//    item.setAttribute("fill", "red");
    
    // read
    var attrs = item.getAttribute("style").split(";");
    var d = {};
    for (var i=0 ; i<attrs.length; i++) {
        var elements = attrs[i].split(":");
        d[elements[0]] = elements[1];
    }
    
    // modify
    d["fill"] = "#ff0000";
    
    // write
    attrs = "";
    for (var key in d) {
        if (attrs!="") attrs += ";";
        attrs += key+":"+d[key];
    }
    item.setAttribute("style", attrs);
    
    console.log(item);
}

