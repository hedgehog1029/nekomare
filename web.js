var express = require("express"),
	fs = require("fs"),
	marked = require("marked");

var app = express();

app.use(express.static(__dirname + "/web"));

app.get("/neko/docs", function(req, res) {
	res.sendFile("commands.md", {root: __dirname});
});

app.get("/discord/join", function(req, res) {
	res.redirect("https://discordapp.com/oauth2/authorize?&client_id=187533393620238336&scope=bot&permissions=285220886");
});

module.exports = {
	"reload": function() {
		return; // Temporary no-op
	},
	"listen": function() {
		app.listen(1354);
	},
	"app": app
}
