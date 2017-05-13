var express = require('express');
var app = express();
var assert = require("assert");
var mongoose = require('mongoose');

var uri = process.env.MONGOLAB_URI || 'mongodb://localhost/urls';
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
	var termLogEntry = TermLogEntry({
		term:req.params.term
	});
	termLogEntry.save();
	res.send({
		"text": "url"
	});
});


app.get('/api/latest/imagesearch', function(req, res) {

});

app.set('port', (process.env.PORT || 4001));

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});