var express = require("express"),
	fs = require("fs"),
	marked = require("marked");

var app = express();

var commands = marked(fs.readFileSync("commands.md", "utf8"));

app.use(express.static(__dirname + "/web"));

app.get("/neko/docs", function(req, res) {
	res.send(commands);
});

app.get("/discord/join", function(req, res) {
	res.redirect("https://discordapp.com/oauth2/authorize?&client_id=187533393620238336&scope=bot&permissions=285220886");
});

module.exports = {
	"reload": function() {
		fs.readFile("commands.md", "utf8", function(err, contents) {
			if (err) return;

			commands = marked(contents);
		});
	},
	"listen": function() {
		app.listen(1354);
	},
	"app": app
}
