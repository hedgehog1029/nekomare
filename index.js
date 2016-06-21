var discordie = require("discordie"),
	Hjson = require("hjson"),
	fs = require("fs");

var logger = require("./lib/logger.js"),
	dispatcher = require("./lib/dispatcher.js"),
	data = require("./lib/data.js"),
	modules = require("./lib/loader.js"),
	web = require("./web.js");

var l = logger.get("core");

l.info("Starting Nekomare v0.2");

var config = Hjson.parse(fs.readFileSync(__dirname + "/config/config.hjson", "utf8")),
	sdata = JSON.parse(fs.readFileSync(__dirname + "/data/data.json", "utf8")),
	bot = new discordie({ autoReconnect: true });

web.listen();
l.info("Webserver started on ::1354.");

dispatcher.manager._.bot = function() {
	return bot;
}

bot.Dispatcher.on(discordie.Events.GATEWAY_READY, function(e) {
	dispatcher.manager._.setPermissions(discordie.Permissions);
	data._load(sdata);

	modules.loader.load(config.modules, dispatcher.manager, data);

	l.info("NekomareBot started. Username: " + bot.User.username);
});

bot.Dispatcher.on(discordie.Events.MESSAGE_CREATE, function(e) {
	dispatcher.dispatch(config.dispatcher, bot, e.message);
});

bot.connect({ token: (config.bot.devmode ? config.bot.devtoken : config.bot.token) });