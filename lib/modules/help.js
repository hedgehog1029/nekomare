var fs = require("fs");

module.exports = {
	name: "help",
	init: function(cfg, cmd, data) {
		cmd
		.command("help")
			.help("Get helped.")
			.alias("h")
			.usage("[command]")
			.on(function(msg, args) {
				if (args.length() > 0) {
					var c = args.get(0).o;

					if (cmd._.commands[c]) {
						var command = cmd._.commands[c];

						var subs = (command._.helptopics.length < 1) ? [] : command._.helptopics.map(function(sc) {
							return "**`" + sc.alias() + "`**" + ((sc.usage() == "") ? "" : " `" + sc.usage() + "`") + ": " + sc.help();
						});

						msg.author.openDM().then(function(dm) {
							if (!msg.isPrivate)
								msg.reply("Check your PMs.");

							dm.sendMessage(
								"Help for command: **" + command.alias() + "**\n" +
								"Aliases: **`" + command._.aliases.join(", ") + "`**\n" +
								command.help() + "\n" +
								"Usage: **`" + command.alias() + "`**" + ((command.usage() == "") ? "" : " `" + command.usage() + "`") +
								((command._.helptopics.length > 0) ? ("\n\n**Sub-Commands**:\n" + subs.join("\n")) : "")
							);
						}).catch(function(err) {
							if (err)
								msg.reply("Error generating help for that command!");
						});
					} else msg.reply("That command wasn't found!");
				} else {
					var list = cmd._.helptopics.map(function(c) {
						return "**`" + c.alias() + "`**" + ((c.usage() == "") ? "" : " `" + c.usage() + "`") + ": " + c.help();
					});

					msg.author.openDM().then(function(dm) {
						if (!msg.isPrivate)
							msg.reply("Check your PMs.");

						var half = Math.floor(list.length / 2);

						dm.sendMessage(
							"**NekomareBot v0.2**\n" +
							"All commands should be prefixed with **`neko`**.\n" +
							"Quotes (\"\") may be used in arguments where you require spaces.\n\n" +
							list.slice(0, half).join("\n")
						);

						dm.sendMessage(list.slice(half).join("\n"));
					}).catch(function(err) {
						if (err)
							msg.reply("There was an error generating the help!");
					});
				}
			}).bind()
		.command("genhelp")
			.help("Generate the markdown help files.")
			.alias("gh")
			.on(function(msg, args) {
				if (msg.author.id != "97707213690249216") {
					msg.reply("I'm sorry, Dave. I can't let you do that.");
					return;
				}

				var list = cmd._.helptopics.map(function(c) {
					return "**" + c.alias() + "** | " + c._.aliases.join(", ") + " |" + ((c.usage() == "") ? "" : " `" + c.usage() + "`") + " | " + c.help();
				});

				var str = "## NekomareBot docs v1.0\nAll commands should be prefixed with **`neko`**.\n" +
							"Quotes (\"\") may be used in arguments where you require spaces.\n\n" + 
							"Command | Aliases | Usage | Notes\n--- | --- | --- | ---\n" + list.join("\n");

				fs.writeFile("./commands.md", str, "utf8", function() {
					msg.reply("Help file commands.md generated!");
				});
			}).bind()
	},
	exposed: {
		genWebHelp: function(cmd) {
			
		}
	}
}