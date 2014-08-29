var http = require("http");
var url = require("url");
var fs = require("fs");

//Load MongoDB
var MongoClient = require("mongodb").MongoClient, format = require("util").format, ObjectID = require("mongodb").ObjectID;

http.createServer(
    function ( request, response ){

        //Dispatcher - kommando for hva som skal bli utført 
        var urlParts = url.parse(request.url).pathname.split("/");
        var resourceRequested = urlParts[1];

        console.log(resourceRequested);

        switch(resourceRequested){
            case "tracks":
                //Få tak i potensiellt argument som kommer etter action
                var requestedTrackId = urlParts[2];

                if( requestedTrackId && ObjectID.isValid(requestedTrackId) ){
                    getTrackById(request, response, requestedTrackId);
                } else {
                    getAvailableTracks(request, response);
                }
                break;
            case "index.html":
            case "":
                response.writeHead(200, { "Content-Type": "text/html" });

                fs.readFile("mediaclient.html",
                    function (err, data) {
                        if (err) console.log(err);
                        response.end(data);
                    }
                );
                break;
        }

    }
).listen(8080);

function getAvailableTracks( request, response ){
    
    MongoClient.connect("mongodb://127.0.0.1:27017/musicdb", function(err, db) {
        if(err) throw err;

        var collection = db.collection("artistdata");

        // Finn alle entry-ene i databasen. find() returnerer en cursor,
        // vi vil ha et array. Vi gjør derfor toArray()
        collection.find().toArray( function (err, docs) {

                if (err) console.log(err);

                response.writeHead(200, { "Content-Type": "application/json" });            
                response.end( JSON.stringify(docs) );
                
                db.close();
        });
    });
}


function getTrackById( request, response, requestedTrackId ) {
    
    MongoClient.connect("mongodb://127.0.0.1:27017/musicdb", function(err, db) {
        if(err) throw err;

        var collection = db.collection("trackdata");

        //Finn dokument med _id lik ObjectID(requestedTrackId)
        //Projection: Fjern alt unntatt filelocation, fjern også _id fra resultat
        //collection.find returnerer en coursor, vi vil bare ha et array => toArray()
        collection.find({ _id: ObjectID(requestedTrackId) }, { filelocation: 1, _id: 0 }).toArray( function(err, docs) {
            
            // Det er lurt å returnere content-length.
            // Vi stat'er derfor filen som skal returneres, og putter
            // størrelsen inn i headeren på returnert data.
            fs.stat(docs[0].filelocation, function(err, stats){

                response.writeHead(200, { "Content-Type": "audio/mp4", "Content-Length" : stats["size"] });
                console.log(docs);

                //Les ut fila vi skal returnere, og skriv den til response.end().
                //end() ender connection mellom client-server når fila er ferdigsendt

                fs.readFile(docs[0].filelocation,
                    function (err, data) {
                        if (err) console.log(err);
                        response.end(data);
                    }
                );
            });

            // Lukk db-forbindelsen
            db.close();
        });
    });
}


