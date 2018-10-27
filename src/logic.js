var useragent = "floorviz";

var floor2svg = {};
var room2path = {};
var room2type = {};
var room2area = {};
var uuid2room = {};
var uuid2modality = {};
var archiver2uuids = {};
//var index = {}; // roomname ↦ {"tag" ↦ TAG, "data" ↦ KEY ↦ VALUE}
//var uuid2roomname = {}; // uuid ↦ roomname

fetch_data = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'text'; 
    xhr.onload = function() {
        if (this.status == 200) {
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
            if (this.status == 200) {
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
        if (--count==0 && callback) callback();
    });
    
    // room2path, room2type and room2area
    hoddb_query(hoddb_url, 'queries/room.rq', function (data) {
        var i;
        for (i=0 ; i<data.length ; i++) {
            entry = data[i];
            room2path[entry["?name"]["Value"]] = entry["?path"]["Value"];
            room2type[entry["?name"]["Value"]] = entry["?type"]["Value"];
            room2area[entry["?name"]["Value"]] = entry["?area"]["Value"];
        };
        if (--count==0 && callback) callback();
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
        if (--count==0 && callback) callback();
    });
    
}

window.onload = function () {
    // detect entering of new uri
    const node = document.getElementById("hod-uri");
    node.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            console.log("got enter and '"+node.value+"'")
            hod_uri = node.value;
            new_config(hod_uri, function () {
                console.log(archiver2uuids);
                console.log("Ready");
            });
        }
    });
}

