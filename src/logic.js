var useragent = "floorviz";

var floor2svg = {}; // floor name ↦ svg url
var room2path = {}; // room name ↦ svg path
var room2type = {}; // room name ↦ room type
var room2area = {}; // room name ↦ room area
var room2floor = {}; // room name ↦ floor name
var uuid2room = {}; // uuid ↦ room name
var uuid2modality = {}; // uuid ↦ modality
var archiver2uuids = {}; // archiver subscription url ↦ uuid list
var svg2obj = {} // svg url ↦ modality ↦ html object

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
    fvalue = document.getElementById("floor_control").value;
    mvalue = document.getElementById("modality_control").value;
    console.log("Switching to "+fvalue+" ⨉ "+mvalue);
    var floors = Object.keys(floor2svg);
    for (var i=0 ; i<floors.length ; i++) {
        svg = floor2svg[floors[i]];
        modality2obj = svg2obj[svg];
        modalities = Object.keys(modality2obj);
        for (var j=0 ; j<modalities.length ; j++) {
            obj = modality2obj[modalities[j]];
            if (floors[i]===fvalue && modalities[j]===mvalue) {
                obj.style.display = "block";
            } else {
                obj.style.display = "none";
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
        modality = uuid2modality[uuids[i]]
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
        var svg = floor2svg[floors[i]];
        var f = floors[i];
        for (var j=0 ; j<modalities.length ; j++) {
            obj = document.createElement("object");
//            obj.setAttribute("id"   , f);
            obj.setAttribute("class", "svgClass");
            obj.setAttribute("type" , "image/svg+xml");
            obj.setAttribute("data" , svg);
            obj.setAttribute("width", "100%");
            obj.style.display = "none";
            document.getElementById("floormap").appendChild(obj);
            console.log(svg+"/"+modalities[j]+" <- "+obj);
            if (!svg2obj.hasOwnProperty(svg)) svg2obj[svg] = {};
            svg2obj[svg][modalities[j]] = obj
        }
    }
    
    // disable text box
    
    if (callback) callback();
}

colorize = function (f, modality, path, value) {
    console.log(f+"/"+modality+"["+path+"] <- "+value);
    
    svg = floor2svg[f];
    obj = svg2obj[svg][modality];
    
    
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
            console.log("recv: '"+xhr.readyState+"'");
            if(xhr.readyState > 2) {
                var json_strings = xhr.responseText.substr(xhr.seenBytes).split("\n");
                console.log("elements = "+json_strings.length);
                console.log(json_strings);
                for (var i=0 ; i<json_strings.length; i++) {
                    json_string = json_strings[i];
                    console.log(json_string);
                    try {
                        o = JSON.parse(json_string);
                        process(o, null);
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
                    });
                });
            });
        }
    });
}

