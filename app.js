var express = require('express');
var app = express();
var assert = require("assert");
var mongoose = require('mongoose');
var http = require("https");

var uri = process.env.MONGOLAB_URI || 'mongodb://localhost/urls';
var apiKey = process.env.API_KEY ;
var cx = process.env.CX ;
// Use bluebird
var options = {
	promiseLibrary: require('bluebird')
};
var db = mongoose.createConnection(uri, options);
TermLogEntry = db.model('termLog', {
	term: {
		type: String,
		required: true
	},
	when: {
		type: Date,
		required: true,
		default: Date.now
	}
});

db.on('open', function() {
	assert.equal(TermLogEntry.collection.findOne().constructor, require('bluebird'));
});

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});


app.get('/api/imagesearch/:term', function(req, res) {

	var term = req.params.term;
	var offset = req.query.offset || 0;
	console.log("Term=", term);

	var termLogEntry = TermLogEntry({
		term: term
	});
	termLogEntry.save();

	var a = json => {
		var resp = [];
		for (var a of json.items) {

			resp.push({
				url: a.link,
				snippet: a.title + "|" + a.displayLink,
				thumbnail: a.image.thumbnailLink,
				context: a.image.contextLink

			});
		}

		res.send(resp);
	};


	searchImages(term, offset, a);
});

function searchImages(term, offset, callback) {
	var path = "/customsearch/v1?key="+apiKey+"&cx="+cx+"&" +
		"searchType=image&fileType=jpg&imgSize=xlarge&safe=high&&alt=json&q=" + encodeURIComponent(term) + "&start=" + offset;
	console.log("Path=", path);
	var options = {
		"method": "GET",
		"hostname": "www.googleapis.com",
		"port": null,
		"path": path,

	};

	var clreq = http.request(options, function(clres) {
		var chunks = [];

		clres.on("data", function(chunk) {
			chunks.push(chunk);
		});

		clres.on("end", function() {
			var body = Buffer.concat(chunks);
			var json = JSON.parse(body.toString())
			callback(json);
		});
	});

	clreq.end();
}



app.get('/api/latest/imagesearch', function(req, res) {
	TermLogEntry.find({},{_id:0,__v:0}).sort({when:-1}).limit(10).then(function(f){
		res.send(f);	
	})
});

app.set('port', (process.env.PORT || 4003));

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});