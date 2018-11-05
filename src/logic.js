var useragent = "floorviz";

// support data structures
var floor2svg = {}; // floor name ↦ svg url
var room2path = {}; // room name ↦ svg path
var room2type = {}; // room name ↦ room type
var room2area = {}; // room name ↦ room area
var room2floor = {}; // room name ↦ floor name
var uuid2room = {}; // uuid ↦ room name
var uuid2modality = {}; // uuid ↦ modality
var archiver2uuids = {}; // archiver subscription url ↦ uuid list
var svg2obj = {} // svg url ↦ modality ↦ html object
var modality_min = {} // modality ↦ minimum value
var modality_max = {} // modality ↦ maximum value

// colormap range
minhue = 0
maxhue = 85.0
//maxhue = 85.0/360

fetch_data = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'text'; 
    xhr.onload = function() {
        if (this.status === 200) {
            data = this.response;
            callback(this.response);
        }
    };
    xhr.send();
}

hoddb_query = function (hoddb_url, query_url, callback) {
    query = fetch_data(query_url, function(query) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', hoddb_url, true);
        xhr.responseType = 'json';
        xhr.onload = function () {
            if (this.status === 200) {
                data = this.response;
                callback(data["Rows"]);
            }
        }
        xhr.send(query);
    });
}

new_config = function (hoddb_url, callback) {
    var count = 3;
    
    // floor2svg
    hoddb_query(hoddb_url, 'queries/floor2svg.rq', function (data) {
        var i;
        for (i=0 ; i<data.length ; i++) {
            entry = data[i];
            floor2svg[entry["?floorname"]["Value"]] = entry["?floorplan"]["Namespace"]+":"+entry["?floorplan"]["Value"];
        };
        if (--count===0 && callback) callback();
    });
    
    // room2path, room2type, room2area, room2floor
    hoddb_query(hoddb_url, 'queries/room.rq', function (data) {
        var i;
        for (i=0 ; i<data.length ; i++) {
            entry = data[i];
            room2path[entry["?name"]["Value"]] = entry["?path"]["Value"];
            room2type[entry["?name"]["Value"]] = entry["?type"]["Value"];
            room2area[entry["?name"]["Value"]] = entry["?area"]["Value"];
            room2floor[entry["?name"]["Value"]] = entry["?floorname"]["Value"];
        };
        if (--count===0 && callback) callback();
    });
    
    // uuid2room, archiver2uuids, uuid2modality
    hoddb_query(hoddb_url, 'queries/modalities.rq', function (data) {
        var i;
        for (i=0 ; i<data.length ; i++) {
            entry = data[i];
            modality = entry["?modality"]["Value"];
            uuid     = entry["?uuid"]["Value"];
            room     = entry["?name"]["Value"];
            url      = entry["?url"]["Namespace"]+":"+entry["?url"]["Value"];
            uuid2room[uuid] = room;
            if (!archiver2uuids.hasOwnProperty(url)) {
                archiver2uuids[url] = [];
            }
            archiver2uuids[url].push(uuid);
            uuid2modality[uuid] = modality;
        };
        if (--count===0 && callback) callback();
    });
    
}

new_view = function () {
    var fvalue = document.getElementById("floor_control").value;
    var mvalue = document.getElementById("modality_control").value;
    console.log("Switching to "+fvalue+" ⨉ "+mvalue);
    var floors = Object.keys(floor2svg);
    for (var i=0 ; i<floors.length ; i++) {
        var svg = floor2svg[floors[i]];
        var modality2obj = svg2obj[svg];
        console.log(svg2obj);
        console.log(modality2obj);
        var modalities = Object.keys(modality2obj);
        console.log("new_view - modalities:"+modalities);
        for (var j=0 ; j<modalities.length ; j++) {
            var obj = modality2obj[modalities[j]];
            console.log("floors["+i+"]="+floors[i]+" fvalue="+fvalue+" modalities["+j+"]="+modalities[j]+" mvalue="+mvalue);
            if (floors[i]===fvalue && modalities[j]===mvalue) {
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!! inside");
                obj.width = "100%";
//                obj.style.display = "block";
            } else {
                obj.width = "0%";
//                obj.style.display = "none";
            }
        }
    }
}

construct_ui = function (callback) {
    var controls = document.getElementById("controls");
    
    // extract modalities
    var modalities = []
    uuids = Object.keys(uuid2modality);
    for (var i=0 ; i<uuids.length ; i++) {
        var modality = uuid2modality[uuids[i]]
        if (! modalities.includes(modality)) modalities.push(modality);
    }
    
    // populate floor choices
    var floors = Object.keys(floor2svg);
    var code = "<select id=\"floor_control\" onchange=\"new_view()\">\n";
    for (var i=0 ; i<floors.length ; i++)
        code    += "  <option value=\""+floors[i]+"\">"+floors[i]+"\n";
    code    += "</select>\n";
    controls.innerHTML += code;
    
    // populate modality choices
    var code = "<select id=\"modality_control\" onchange=\"new_view()\">\n";
    for (var i=0 ; i<modalities.length ; i++)
        code    += "  <option value=\""+modalities[i]+"\">"+modalities[i]+"\n";
    code    += "</select>\n";
    controls.innerHTML += code;
    
    // populate floormap
    var floors = Object.keys(floor2svg);
    console.log(">>>>>floors="+floors);
    console.log(">>>>>modalities="+modalities);
    for (var i=0 ; i<floors.length ; i++) {
        var f = floors[i];
        console.log("floor:"+f);
        var svg = floor2svg[f];
        for (var j=0 ; j<modalities.length ; j++) {
            var modality = modalities[j];
            console.log("modality:"+modality);
            var identifier = f+modality;
            console.log("identifier"+identifier);
            var obj = document.createElement("object");
//            obj.setAttribute("id"   , f);
            obj.setAttribute("class", "svgClass");
            obj.setAttribute("id", identifier);
            obj.setAttribute("type" , "image/svg+xml");
            obj.setAttribute("data" , svg);
//            obj.setAttribute("width", "100%");
            obj.setAttribute("width", "0%");
//            obj.style.display = "block"; //"none";
            console.log("obj1 properties: '"+Object.getOwnPropertyNames(obj)+"'");
            document.getElementById("floormap").appendChild(obj);
            console.log("obj2 properties: '"+Object.getOwnPropertyNames(obj)+"'");
            console.log(svg+"/"+modality+" <- "+obj);
            if (!svg2obj.hasOwnProperty(svg)) svg2obj[svg] = {};
            document.getElementById("building")
            svg2obj[svg][modality] = document.getElementById(identifier);
//            svg2obj[svg][modality] = obj;
            console.log("obj3 properties: '"+Object.getOwnPropertyNames(obj)+"'");
            if (identifier === "Floor 2CO2 Sensor") {
                obj.onload = function () {
                    console.log("object loaded");
                    console.log("|oneliner-2: "+document.getElementById("Floor 2CO2 Sensor"));
                    console.log("|oneliner-1: "+document.getElementById("Floor 2CO2 Sensor").contentDocument);
                    console.log("|oneliner: "+document.getElementById("Floor 2CO2 Sensor").contentDocument.getElementById("path305"));
                    
                };
            }
        }
    }
    
    // disable text box
    
    if (callback) callback();
}

float2hex = function (float) {
    var hex = Number(Math.floor(float*255)).toString(16);
    if (hex.length < 2) hex = "0"+hex;
    return hex;
};

rgb2hexcode = function(r,g,b) {
  return "#"+float2hex(r)+float2hex(g)+float2hex(b);
};

// https://en.wikipedia.org/wiki/HSL_and_HSV
hsv2color = function (h, s, v) {
    var c = s*v;
    console.log("chroma = "+c);
    var hmark = h/60;
    console.log("hmark = "+hmark);
    var x = c*(1 - Math.abs((hmark % 2)-1));
    console.log("x = "+x);
    var r1, g1, b1;
    switch (Math.floor(hmark)) {
        case 0: r1 = c, g1 = x, b1 = 0; break;
        case 1: r1 = x, g1 = c, b1 = 0; break;
        case 2: r1 = 0, g1 = c, b1 = x; break;
        case 3: r1 = 0, g1 = x, b1 = c; break;
        case 4: r1 = x, g1 = 0, b1 = c; break;
        case 5: r1 = c, g1 = 0, b1 = x; break;
    }
    console.log("r1g1b1 ("+r1+","+g1+","+b1+")");
    var m = v-c;
    console.log("m = "+m);
    var r = r1+m;
    var g = g1+m;
    var b = b1+m;
    console.log("rgb ("+r+","+g+","+b+")");
    
    return rgb2hexcode(r, g, b);
//    return "#cc3300";
}

colorize = function (f, modality, path, value) {
    console.log(f+"/"+modality+"["+path+"] <- "+value);
    
    svg = floor2svg[f];
    obj = svg2obj[svg][modality];
    console.log("object is "+obj);
    
    // update map of lowest and highest observed values
    if (!modality_min.hasOwnProperty(modality)) modality_min[modality] = value;
    if (!modality_max.hasOwnProperty(modality)) modality_max[modality] = value;
    if (value < modality_min[modality]) modality_min[modality] = value;
    if (value > modality_max[modality]) modality_max[modality] = value;
    
    // calculate color
    vmin = modality_min[modality];
    vmax = modality_max[modality];
    pos = (value-vmin)/(vmax-vmin);
    if (isNaN(pos)) pos = 0.5; // hack to make first value not result in a divide-by-zero
    hue = minhue+(1.0-pos)*(maxhue-minhue);
    console.log("vmin="+vmin+" vmax="+vmax+" pos="+pos+" hue="+hue);
    color = hsv2color(hue, 1, 0.85);
    console.log("color = "+color);
    
    console.log("oneliner-2: "+document.getElementById("Floor 2CO2 Sensor"));
    console.log("oneliner-1: "+document.getElementById("Floor 2CO2 Sensor").contentDocument);
    console.log("oneliner: "+document.getElementById("Floor 2CO2 Sensor").contentDocument.getElementById("path305"));
    
    // locate path
//    var svgdoc = obj.contentDocument;
//    var svgdoc = obj;
    var svgdoc = document.getElementById(f+modality).contentDocument;
//    var svgdoc = document.getElementById("path305");
    console.log(obj);
    console.log("svgdoc = "+svgdoc);
    console.log("properties: '"+Object.getOwnPropertyNames(svgdoc)+"'");
    if (svgdoc === null) return;
    console.log("path="+path);
    var p = svgdoc.getElementById(path);
    console.log("p = "+p);
    
    // read
    var attrs = p.getAttribute("style").split(";");
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
    p.setAttribute("style", attrs);
}

process = function (data, callback) {
    paths = Object.keys(data);
    
    for (var i=0 ; i<paths.length ; i++) {
        path = paths[i];
        uuid = data[path]["uuid"];
        modality = uuid2modality[uuid];
        readings = data[path]["Readings"];
        value = readings[readings.length-1][1];
        room = uuid2room[uuid];
        path = room2path[room];
        f = room2floor[room];
        
        // guard: unknown point
        if (uuid     === undefined
         || modality === undefined
         || readings === undefined
         || value    === undefined
         || room     === undefined
         || path     === undefined
         || f        === undefined) continue;
        
        colorize(f, modality, path, value);
    }
    
    if (callback) callback();
}

subscribe = function (callback) {
    archivers = Object.keys(archiver2uuids);
    for (var i=0 ; i<archivers.length ; i++) {
        archiver = archivers[i];
        archiver = "http://localhost/volta/republish";
        uuids = archiver2uuids[archiver];
        console.log("About to subscribe to "+archiver);
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', archiver, true); // true for asynchronous
//        xhr.setRequestHeader("User-Agent", useragent);
        xhr.seenBytes = 0;
        
        xhr.onreadystatechange = function() {
//            console.log("recv: '"+xhr.readyState+"'");
            if(xhr.readyState > 2) {
                var json_strings = xhr.responseText.substr(xhr.seenBytes).split("\n");
//                console.log("elements = "+json_strings.length);
//                console.log(json_strings);
                for (var i=0 ; i<json_strings.length; i++) {
                    json_string = json_strings[i];
//                    console.log(json_string);
                    try {
                        o = JSON.parse(json_string);
                        if (o !== null) process(o, null);
//                        console.log(o);
                    } catch (err) {
                        console.log("Error: "+err);
                    }
                }
                xhr.seenBytes = xhr.responseText.length; 
            }
        };
        xhr.send("Metadata/Location/Building=\"OU44\"");
//        xhr.send("Metadata/Location/Building=\"OU44\" and Metadata/Media=\"air\"");
    }
    
    if (callback) callback();
}

window.onload = function () {
    // detect entering of new uri
    const node = document.getElementById("hod-uri");
    node.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            console.log("got enter and '"+node.value+"'")
            hod_uri = node.value;
            new_config(hod_uri, function () {
                console.log("config loaded");
                construct_ui(function () {
                    console.log("ui constructed");
                    subscribe(function () {
                        console.log("Ready");
                        
                        window.setTimeout(function(){
                            // Handler when the DOM is fully loaded
                            console.log("Timeouting ...");
                            colorize("Floor 2", "Temperature Sensor", "path305", 23.1);
                        }, 30000);
                    });
                });
            });
        }
    });
}

