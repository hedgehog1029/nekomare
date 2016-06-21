module.exports = {
	name: "greeter",
	init: function(cfg, cmd, data) {
		cmd.on("GUILD_MEMBER_ADD", function(e) {
			var sec = data.guild(e.guild).section("greetings"),
				channels = sec.or([]).get("channels"),
				message = sec.or(cfg.default).get("message");

			var m = message.replace("%user%", e.member.username).replace("%guild%", e.guild.name);

			channels.forEach(function(cid) {
				var ch = e.guild.textChannels.find(function(c) {
					return c.id == cid;
				});

				if (ch)
					ch.sendMessage(m);
			});
		});

		cmd
		.command("greetings")
			.help("Manage greet messages.")
			.permission(cmd.Permissions.General.MANAGE_GUILD)
			.sub("enable")
				.alias("e")
				.help("Enable greetings in this channel.")
				.on(function(msg, args) {
					var enabled = data.guild(msg.guild).section("greetings").or([]).get("channels");

					if (enabled.indexOf(msg.channel.id) != -1) {
						msg.reply("This channel is already enabled!");
						return;
					}

					enabled.push(msg.channel.id);
					msg.reply("Greetings enabled in " + msg.channel.mention + ".");

					data.guild(msg.guild).section("greetings").write("channels", enabled).commit();
				}).bind()
			.sub("disable")
				.alias("d")
				.help("Disable greetings in this channel.")
				.on(function(msg, args) {
					var enabled = data.guild(msg.guild).section("greetings").or([]).get("channels");

					if (enabled.indexOf(msg.channel.id) == -1) {
						msg.reply("This channel is already disabled!");
						return;
					}

					enabled.splice(enabled.indexOf(msg.channel.id), 1);
					msg.reply("Greetings disabled in " + msg.channel.mention + ".");

					data.guild(msg.guild).section("greetings").write("channels", enabled).commit();
				}).bind()
			.sub("message")
				.alias("m")
				.help("Change the greeting message in this guild.")
				.usage("<message>")
				.demand(["text"])
				.on(function(msg, args) {
					data.guild(msg.guild).section("greetings").write("message", args.getFull()).commit();

					msg.reply("Updated greeting message:\n```\n" + args.getFull().replace("%user%", msg.author.username).replace("%guild%", msg.guild.name) + "\n```");
				}).bind()
			.bind()
	}
}