var express = require("express"),
	orm = require("orm");

var authKey = process.env['key'],
	secret = process.env['secret'];

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

	app.get("/setup/" + secret, function(req, res){
		// todo: setup db
		res.end("ok");
	});

	function ping(data, offset){
		user.find({
			"tag" : data['tags'].split(",")
		}, {
			"__merge" : {
				"from" : {
					"table" : "user_tag",
					"field" : "tag"
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
			else{

				// send push

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
		res.end("not implemented");
	});

	appPort = process.env['VCAP_APP_PORT'] || 3000;
	app.listen(appPort);
	console.log("App is up " + appPort);
});