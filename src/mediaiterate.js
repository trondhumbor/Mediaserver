var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;
var fs = require("fs");
var path = require("path");
var mm = require("musicmetadata");

var walk = function(dir, done) {
	var results = [];

	fs.readdir(dir, function(err, list) {
		if (err) return done(err);
		
		var pending = list.length;

		if (pending == 0) return done(null, results);

		list.forEach(function(file) {
      		file = path.join(dir, file);
      		fs.stat(file, function(err, stat) {

      			if (stat && stat.isDirectory()) {
	          		walk(file, function(err, res) {
	            		results = results.concat(res);
	            		if (--pending == 0) done(null, results);
	          		});
		        } else {

		        	// create a new parser from a node ReadStream
					var parser = mm(fs.createReadStream(file), { duration: true });

					// listen for the metadata event
					parser.on("comment", function (meta){ console.log("HELLO");});
					parser.on("metadata", function (meta) {
						//console.log(meta);
						//We dont want that in our db
						delete meta["picture"];
						meta.filelocation = file;

						MongoClient.connect('mongodb://127.0.0.1:27017/mydb', function(err, db) {
    						if(err) throw err;
							
							var collection = db.collection("testData");
							collection.insert(meta, function(err, docs) {
								db.close();
							});
						});


					});

		        	results.push(file);
		          	if (--pending == 0) done(null, results);
		        }
      		});
    	});
  	});
};

walk("F:\\mediaserver", function(err, results) {
  if (err) throw err;
  //console.log(results);
});