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
            var entry    = data[i];
            var modality = entry["?modality"]["Value"];
            var uuid     = entry["?uuid"]["Value"];
            var room     = entry["?name"]["Value"];
            var url      = entry["?url"]["Namespace"]+":"+entry["?url"]["Value"];
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
        var modalities = Object.keys(modality2obj);
        for (var j=0 ; j<modalities.length ; j++) {
            var obj = modality2obj[modalities[j]];
            if (floors[i]===fvalue && modalities[j]===mvalue) {
                obj.width = "100%";
            } else {
                obj.width = "0%";
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
    for (var i=0 ; i<floors.length ; i++) {
        var f = floors[i];
        var svg = floor2svg[f];
        for (var j=0 ; j<modalities.length ; j++) {
            var modality = modalities[j];
            var identifier = f+modality;
            var obj = document.createElement("object");
            obj.setAttribute("class", "svgClass");
            obj.setAttribute("id", identifier);
            obj.setAttribute("type" , "image/svg+xml");
            obj.setAttribute("data" , svg);
            obj.setAttribute("width", "0%");
            document.getElementById("floormap").appendChild(obj);
            if (!svg2obj.hasOwnProperty(svg)) svg2obj[svg] = {};
            document.getElementById("building")
            svg2obj[svg][modality] = document.getElementById(identifier);
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
    var hmark = h/60;
    var x = c*(1 - Math.abs((hmark % 2)-1));
    var r1, g1, b1;
    switch (Math.floor(hmark)) {
        case 0: r1 = c, g1 = x, b1 = 0; break;
        case 1: r1 = x, g1 = c, b1 = 0; break;
        case 2: r1 = 0, g1 = c, b1 = x; break;
        case 3: r1 = 0, g1 = x, b1 = c; break;
        case 4: r1 = x, g1 = 0, b1 = c; break;
        case 5: r1 = c, g1 = 0, b1 = x; break;
    }
    var m = v-c;
    var r = r1+m;
    var g = g1+m;
    var b = b1+m;
    
    return rgb2hexcode(r, g, b);
}

colorize = function (f, modality, path, value) {
    svg = floor2svg[f];
    obj = svg2obj[svg][modality];
    
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
    color = hsv2color(hue, 1, 0.85);
    
    // locate path
    var svgdoc = document.getElementById(f+modality).contentDocument;
    if (svgdoc === null) return;
    var p = svgdoc.getElementById(path);
    
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
    var archivers = Object.keys(archiver2uuids);
    for (var i=0 ; i<archivers.length ; i++) {
        var archiver = archivers[i];
        var uuids = archiver2uuids[archiver];
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', archiver, true); // true for asynchronous
        xhr.seenBytes = 0;
        
        xhr.onreadystatechange = function() {
            if(xhr.readyState > 2) {
                var json_strings = xhr.responseText.substr(xhr.seenBytes).split("\n");
                for (var i=0 ; i<json_strings.length; i++) {
                    json_string = json_strings[i];
                    try {
                        o = JSON.parse(json_string);
                        if (o !== null) process(o, null);
                    } catch (err) {
                        console.log("Error: "+err);
                    }
                }
                xhr.seenBytes = xhr.responseText.length; 
            }
        };
        
        where_clause = uuids.map(function (uuid) { return "uuid=\""+uuid+"\""}).join(" or ");
        xhr.send(where_clause);
    }
    
    if (callback) callback();
}

window.onload = function () {
    // detect entering of new uri
    const node = document.getElementById("hod-uri");
    node.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            node.readOnly = true;
            console.log("got enter and '"+node.value+"'")
            hod_uri = node.value;
            new_config(hod_uri, function () {
                console.log("config loaded");
                construct_ui(function () {
                    console.log("ui constructed");
                    subscribe(function () {
                        console.log("Ready");
                        
                        new_view();
                    });
                });
            });
        }
    });
}

