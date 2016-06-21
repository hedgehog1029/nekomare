var moment = require("moment");

module.exports = {
	name: "utils",
	init: function(cfg, cmd, data) {
		cmd
		.command("whois")
			.alias("userinfo")
			.help("Get info about a user, straight ~~from the NSA~~.")
			.usage("<user>")
			.demand(["user"])
			.on(function(msg, args) {
				var user = args.get(0).o.memberOf(msg.guild);

				msg.reply(
					"Information on " + user.mention + ":\n```\n" +
					"Name: " + user.username + "\n" +
					"Nickname: " + (user.nick ? user.nick : "None") + "\n" +
					"Discriminator: " + user.discriminator + "\n" +
					"Account created: " + moment(user.registeredAt).format("dddd, MMMM Do YYYY @ h:mm:ssa") + "\n" +
					"Joined at: " + moment(user.joined_at).format("dddd, MMMM Do YYYY @ h:mm:ssa") + "\n" +
					"Current status: " + user.status + "\n" +
					"Bot: " + (user.bot ? "yes" : "no") + "\n" +
					"Muted: " + (user.mute ? "yes" : "no") + "\n" +
					"Deaf: " + (user.deaf ? "yes" : "no") + "\n\n" +
					"Now playing: " + (user.gameName ? user.gameName : "Nothing") + "\n" +
					"Previously playing: " + (user.previousGameName ? user.previousGameName : "Nothing") + "\n" +
					"Roles: " + user.roles.map(function(r){ return r.name; }).join(", ") + "\n" +
					"Avatar: " + user.avatarURL + "\n" +
					"```"
				);
			}).bind()
	}
}