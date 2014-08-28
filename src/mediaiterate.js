var MongoClient = require("mongodb").MongoClient
    , format = require("util").format;

var fs = require("fs");
var path = require("path");
var mm = require("musicmetadata");

function iterateMedia ( dir ) {

    fs.readdir(dir, function ( err, list ) {

        list.forEach( function ( file ) {
            
            file = path.join(dir, file);
            
            fs.stat(file, function ( err, stat ) {

                if (stat && stat.isDirectory()) {
                    iterateMedia(file);
                } else {
                    // create a new parser from a node ReadStream
                    var parser = mm(fs.createReadStream(file), { duration: true });

                    // listen for the metadata event
                    parser.on("metadata", function ( meta ) {
                        
                        // Vi har ikke lyst å lagre binærdata i databasen vår.
                        // Vi kan på et fremtidig tidspunkt lagre artwork i et FS,
                        // og heller lagre pathen til artworket i DB
                        
                        delete meta["picture"];
                        
                        // Vi vil huske hvor vi fant musikk-filen
                        meta.filelocation = file;

                        MongoClient.connect("mongodb://127.0.0.1:27017/mydb", function(err, db) {
                            if(err) throw err;
                            
                            var collection = db.collection("testData");
                            collection.insert(meta, function(err, docs) {
                                db.close();
                            });
                        });
                    });
                }
            });
        });
    });
};

iterateMedia("F:\\mediaserver");