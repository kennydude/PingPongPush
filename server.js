var express = require("express"),
	gcm = require('node-gcm'),
	orm = require("orm");

var authKey = process.env['key'],
	sender = new gcm.Sender(authKey);

if(process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var cred = env['mysql-5.1'][0]['credentials'];

    process.env['db'] = "mysql://" + cred['username'] + ":" + cred['password'] + "@" + cred['host'] + "/" + cred['name']; 
}

orm.connect( process.env['db'], function(err, db){
	if(err){
		throw new Error("Failure connecting to db: " + err);
	}

	var user = db.define("user", {
		"gcm" : String
	});

	var tag = db.define("user_tag", {
		"tag" : String
	});
	tag.hasOne("user", user);

	app = express();

	app.configure(function(){
		app.use(express.bodyParser());

	});

	app.get("/", function(req, res){
		res.end("this is ping pong");
	});

	function ping(data, offset){
		user.find({
			"tag" : data['tags'].split(",")
		}, {
			"__merge" : {
				"from" : {
					"table" : "user_tag",
					"field" : "user_id"
				},
				"to" : {
					"table" : "user",
					"field" : "id"
				}
			},
			"limit" : 1000,
			"offset" : offset
		}, function(err, results){
			if(err){ console.log(err); }
			else if(results.length > 0){

				// send push
				message = new gcm.Message();
				for(k in data){
					message.addData(k, data[k]);
				}

				ids = [];
				results.forEach(function(device){
					ids.push(device.gcm);
				});

				sender.send(message, ids, 3, function(result){
					// TODO: Handle failure
					console.log(result);

					if(results.length > 900){
						ping(data, offset + 1000);
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

	// Once we get the user class, we can save the tags
	function pong_2(me, req, res){
		// now remove old tags
		db.driver.remove("user_tag", {"user_id" : me.id}, function(){

			// register new ones
			var t = req.body['tags'].split(",");
			console.log(t);
			t.forEach(function(ta){
				console.log(ta);
				x = new tag({
					"user_id" : me.id,
					tag : ta
				});
				x.save(function(err){
					console.log(err);
				});
			});

			res.end("ok");

		});
	}

	app.post("/pong/register", function(req, res){
		// Register a pong
		try{
			user.find({"gcm" : req.body['gcm']}, function(err, results){
				if(results.length > 0){
					me = results[0];
					pong_2(me, req, res);
				} else{
					me = new user({
						gcm : req.body['gcm']
					});
					me.save(function(err, me){
						if(!err){
							pong_2(me, req, res);
						} else{
							res.end("error");
						}
					});
				}
			});
		} catch(e){
			console.log(e);
			res.end("error");
		}
	});

	appPort = process.env['VCAP_APP_PORT'] || 3000;
	app.listen(appPort);
	console.log("App is up " + appPort);
});