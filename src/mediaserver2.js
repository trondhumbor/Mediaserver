var http = require("http");
var url = require("url");
var fs = require("fs");

//Load MongoDB
var MongoClient = require("mongodb").MongoClient, format = require("util").format, ObjectID = require('mongodb').ObjectID;


http.createServer(
    function(request, response){

        console.log(url.parse(request.url).pathname.split("/"));
        if(url.parse(request.url).pathname.split("/")[1] == "getAvailableTracks"){
            getAvailableTracks(request, response);
        } else if(url.parse(request.url).pathname.split("/")[1] == "getTrackById"){
            getTrackById(request, response);
        } else if(url.parse(request.url).pathname.split("/")[1] == "getArtists"){
            getArtists(request, response);
        } else if(url.parse(request.url).pathname.split("/")[1] == "index.html"){
            response.writeHead(200, {"Content-Type": "text/html"});

            fs.readFile("mediaclient.html",
                function (err, data) {
                    if (err) console.log(err);
                    response.end(data);
                }
            );

        }

    }
).listen(8080);

function getAvailableTracks(request, response){
    MongoClient.connect("mongodb://127.0.0.1:27017/mydb", function(err, db) {
        if(err) throw err;

        // Locate all the entries using find
        var collection = db.collection("testData");
        
        collection.find({}, { filelocation: 0 }).sort( { artist: 1 } ).toArray(function(err, docs){
            
            response.writeHead(200, {"Content-Type": "application/json"});
            response.end(JSON.stringify(docs));

            // Let's close the db
            db.close();
        });

    });
}

function getTrackById(request, response){
    var requestedTrackId = url.parse(request.url).pathname.split("/")[2];
    
    MongoClient.connect("mongodb://127.0.0.1:27017/mydb", function(err, db) {
        if(err) throw err;

        var collection = db.collection("testData");

        collection.find({_id: ObjectID(requestedTrackId)}).toArray(function(err, docs){
            
            response.writeHead(200, {"Content-Type": "audio/mp4"});
            console.log(docs);

            fs.readFile(docs[0].filelocation,
                function (err, data) {
                    if (err) console.log(err);
                    response.end(data);
                }
            );

            // Let's close the db
            db.close();
        });
    });
}

function getArtists(request, response){
    MongoClient.connect("mongodb://127.0.0.1:27017/mydb", function(err, db) {
        if(err) throw err;

        var collection = db.collection("testData");

        collection.aggregate([
            {
                $group: { 
                    _id: "$artist"
                }
            }

            ], function(err, docs){
            
            response.writeHead(200, {"Content-Type": "application/json"});
            response.end(JSON.stringify(docs));

            // Let's close the db
            db.close();
        });
    });
}
