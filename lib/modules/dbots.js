var request = require("request"),
	l = require("../logger.js").get("dbots");

function update(config, bot) {
	request.post("https://bots.discord.pw/api/bots/187533418463100928/stats", {
		json: true,
		body: {
			server_count: bot.Guilds.length
		},
		headers: {
			"Authorization": config.token
		}
	}, function(err, res, body) {
		if (err) {
			l.error("There was an error posting data to DiscordBots");
			return;
		}

		l.info("DiscordBots entry updated.");
	})
}

module.exports = {
	name: "dbots",
	init: function(conf, cmd, data) {

	},
	exposed: {
		"update": update
	}
}
