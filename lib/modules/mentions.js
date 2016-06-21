var cooldowns = {};

module.exports = {
	name: "mentions",
	init: function(cfg, cmd, data) {
		cmd.on("MESSAGE_CREATE", function(e) {
			var msg = e.message;

			if (msg.author.bot) return;
			if (msg.isPrivate) return;

			var keywords = data.guild(msg.guild).section("mentions").or({}).get("keywords"),
				sleeping = data.guild(msg.guild).section("mentions").or([]).get("sleeping-channels");

			if (sleeping.indexOf(msg.channel.id) != -1) return;

			var content = " " + msg.content.trim() + " "; // pad with whitespace

			Object.keys(keywords).forEach(function(keyword) {
				if (content.indexOf(" " + keyword + " ") != -1) {
					if (!cooldowns[keyword])
						msg.channel.sendMessage(keywords[keyword]);
					else
						clearTimeout(cooldowns[keyword].timeout);
					
					var cooldown = {};
					
					cooldown.timeout = setTimeout(function(word) {
						delete cooldowns[word];
					}, 5000, keyword);

					cooldowns[keyword] = cooldown;
				}
			})
		});

		cmd
		.command("keyword")
			.alias("keywords")
			.permission(cmd.Permissions.General.MANAGE_GUILD)
			.help("Manage keywords and responses.")
			.sub("add")
				.help("Add a keyword and response.")
				.usage("<keyword> <response>")
				.demand(2)
				.on(function(msg, args) {
					var keywords = data.guild(msg.guild).section("mentions").or({}).get("keywords");

					if (keywords[args.get(0).o]) {
						msg.reply("That keyword already exists! Use `neko keyword update` to update it.");
						return;
					}

					keywords[args.get(0).o] = args.slice(1).getFull();

					msg.reply("Added **" + args.get(0).o + "** as a keyword.");

					data.guild(msg.guild).section("mentions").write("keywords", keywords).commit();
				}).bind()
			.sub("del")
				.alias("remove")
				.alias("delete")
				.help("Delete a keyword.")
				.usage("<keyword>")
				.demand(1)
				.on(function(msg, args) {
					var keywords = data.guild(msg.guild).section("mentions").or({}).get("keywords");

					if (keywords[args.get(0).o]) {
						delete keywords[args.get(0).o];

						msg.reply("Removed keyword **" + args.get(0).o + "**.");

						data.guild(msg.guild).section("mentions").write("keywords", keywords).commit();
					} else {
						msg.reply("That keyword doesn't exist!");
					}
				}).bind()
			.sub("update")
				.help("Update a keyword's response.")
				.usage("<keyword> <new response>")
				.demand(2)
				.on(function(msg, args) {
					var keywords = data.guild(msg.guild).section("mentions").or({}).get("keywords");

					if (keywords[args.get(0).o]) {
						keywords[args.get(0).o] = args.slice(1).getFull();

						msg.reply("Updated the response to keyword **" + args.get(0).o + "**.");

						data.guild(msg.guild).section("mentions").write("keywords", keywords).commit();
					} else {
						msg.reply("That keyword doesn't exist!");
					}
				}).bind()
			.sub("list")
				.help("List keywords and responses.")
				.on(function(msg, args) {
					var keywords = data.guild(msg.guild).section("mentions").or({}).get("keywords");

					var list = Object.keys(keywords).map(function(kw) {
						return "**" + kw + "**: " + keywords[kw];
					});

					msg.reply("List of keywords and responses:\n" + list.join("\n"));
				}).bind()
			.sub("disable")
				.help("Disables the keyword system in the current channel.")
				.on(function(msg, args) {
					var sleeping = data.guild(msg.guild).section("mentions").or([]).get("sleeping-channels");

					if (args.length() > 0) {
						if (args.get(0).o == "all") {
							msg.guild.textChannels.forEach(function(ch) {
								sleeping.push(ch.id);
							});

							msg.reply("Disabled the keyword system in all channels.");
						} else msg.reply("I didn't recognise that argument :(");
					} else { 
						sleeping.push(msg.channel.id);

						msg.reply("Disabled the keyword system in " + msg.channel.mention + ".");
					}

					data.guild(msg.guild).section("mentions").write("sleeping-channels", sleeping).commit();
				}).bind()
			.sub("enable")
				.help("Enable the keyword system in the current channel.")
				.on(function(msg, args) {
					var sleeping = data.guild(msg.guild).section("mentions").or([]).get("sleeping-channels");

					if (args.length() > 0) {
						if (args.get(0).o == "all") {
							msg.guild.textChannels.forEach(function(ch) {
								if (sleeping.indexOf(ch.id) != -1)
									sleeping.splice(sleeping.indexOf(ch.id), 1);
							});

							msg.reply("Enabled the keyword system in all channels.");
							data.guild(msg.guild).section("mentions").write("sleeping-channels", sleeping).commit();
						} else msg.reply("I didn't recognise that argument :(");
					} else {
						if (sleeping.indexOf(msg.channel.id) != -1) {
							sleeping.splice(sleeping.indexOf(msg.channel.id), 1);

							msg.reply("Enabled the keyword system in " + msg.channel.mention + ".");
							data.guild(msg.guild).section("mentions").write("sleeping-channels", sleeping).commit();
						} else {
							msg.reply("This channel is already enabled!");
						}
					}
				}).bind()
			.bind();
	}
}