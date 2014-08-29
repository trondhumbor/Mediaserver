//Load MongoDB
var MongoClient = require("mongodb").MongoClient, format = require("util").format, ObjectID = require("mongodb").ObjectID;

aggregate();

function aggregate( callback ){
    
    MongoClient.connect("mongodb://127.0.0.1:27017/musicdb", function(err, db) {
        if(err) throw err;

        var collection = db.collection("trackdata");
        collection.aggregate(
            [
                {
                    $sort: {
                        "track.no" : 1
                    }
                },
                {
                    $group: {
                        _id: { album: "$album", artist: "$artist", year: "$year", disk: "$disk", albumartist: "$albumartist" },
                        tracks: { $push: { id : "$_id", title: "$title", genre: "$genre", track: "$track", duration: "$duration" } }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }

                },
                {
                    $group: {
                        _id: "$_id.artist",
                        albums: { $push: { title: "$_id.album", year: "$_id.year", disk: "$_id.disk", albumartist: "$_id.albumartist", tracks: "$tracks" } }
                    }
                },
                {
                    $project: {
                        artist : "$_id",
                        albums : 1,
                        _id : 0
                    }
                },
                {
                    $sort: {
                        artist: 1
                    }

                }

            ], function (err, docs) {
                collection = db.collection("artistdata");
                collection.insert(docs, function(err, result) {
                    db.close();
                });
            }
        );
    });
}
