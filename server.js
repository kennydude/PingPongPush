var	express = require("express"),
	mongodb = require("mongodb");

if(process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var mongo = env['mongodb-1.8'][0]['credentials'];
} else{
    var mongo = {
        "hostname":"localhost",
        "port":27017,
        "username":"",
        "password":"",
        "name":"",
        "db":"pingpong"
    }
} // TODO: Add other 1 click cloud stuff here

var generate_mongo_url = function(obj){
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if(obj.username && obj.password){
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
    else{
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}
var mongourl = generate_mongo_url(mongo);

var	authKey = process.env['key'],
	request = require("superagent");

mongodb.connect( mongourl, function(err, db){
	if(err){
		throw new Error("Failure connecting to db: " + err);
	}
	db.collection("user", function(err, coll){
		if(coll == null){
			console.log("Collection does not exist");
			db.createCollection("user");
		}
	});

	app = express();

	app.configure(function(){
		app.use(express.bodyParser());

	});

	app.get("/", function(req, res){
		res.end("this is ping pong");
	});

	function ping(data, offset){
		db.collection("user").find({
			"tags" : { "$in" : data['tags'].split(",") },
			"push_type" : "google"
		}, { "limit" : 100, "skip" : offset }).toArray(function(err, results){
			console.log(results.length);
			
			if(err){ console.log(err); }
			else if(results.length > 0){
				ids = [];
				results.forEach(function(device){
					//console.log(device['push_token']);
					ids.push(device['push_token']);
				});
				console.log("Sending push to " + ids.length + " google devices");

				request	.post("https://android.googleapis.com/gcm/send")
					.set('Content-Type', 'application/json')
					.set('Authorization', 'key=' + authKey)
					.send({ "registration_ids" : ids, "data" : data })
					.end(function(err, res){
						if(err){ console.log("Error: " + err); }
						try{
							if(res.body['results']){
								for(var i = 0; i < res.body['results'].length; i++){
									var result = res.body['results'][i];
									if(result['message_id']){
										if(ids[ i ] != result['registration_id'] ){
											results[i].gcm = result['registration_id'];
											results[i].save();
											console.log("Reg ID has changed");
										}
									} else if(result['error']){
										console.log("Messaged failed");
										if(result['error'] == "NotRegistered"){
											results[i].remove(); console.log("Device gone and removed from our DB");
										}
									}
								}
							}
						} catch(e){ console.log(e); }
						if(results.length > 100){
							ping(data, offset + 100);
						}
				});
			}
		});
	}

	app.post("/ping", function(req, res){
		// This is from the site
		res.end("ok");

		ping(req.body, 0);
	});
	
	app.post("/pong/register", function(req, res){
		// Register a pong
		try{
			db.collection("user").findOne({
				"push_type" : req.body['type'] || "google",
				"push_token" : req.body['gcm']
			}, function(err, item){
				if(item == null){
					item = {};
					func = "insert";
				} else{
					func = "update";
				}
				
				item["push_type"] = req.body['type'] || "google";
				item["push_token"] = req.body['gcm'];
				item["tags"] = req.body['tags'].split(",");
				
				db.collection("user")[func](item, function(err, result){
					if(!err){
						res.end("ok");
					} else{
						res.status(503).end("ERROR");
					}
				});
			});
		} catch(e){
			console.log(e);
			res.status(503).end("error");
		}
	});

	appPort = process.env['VCAP_APP_PORT'] || 3000;
	app.listen(appPort);
	console.log("App is up " + appPort);
});
