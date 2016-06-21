module.exports = {
	name: "admin",
	init: function(cfg, cmd, data) {
		cmd
		.command("ban")
			.alias("b")
			.help("Ban a user.")
			.permission(cmd.Permissions.General.BAN_MEMBERS)
			.usage("<user> [reason]")
			.demand(["user"])
			.on(function(msg, args) {
				var user = args.get(0).o,
					reason = (args.length()) > 1 ? args.slice(1).getFull() : null;

				user.memberOf(msg.guild).ban().then(function() {
					msg.reply("Banned " + user.mention + ".");
				}).catch(function(err) {
					msg.reply("There was an error! Do I have permission to do that?");
				});

				user.openDM().then(function(dm) {
					dm.sendMessage("**Ban Notice**\nYou were banned from " + msg.guild.name + "!" +
					((reason) ? "\nReason: `" + reason + "`" : ""));
				});
			}).bind()
		.command("unban")
			.alias("ub")
			.help("Unban a user.")
			.permission(cmd.Permissions.General.BAN_MEMBERS)
			.usage("<user>")
			.demand(["user"])
			.on(function(msg, args) {
				var user = args.get(0).o;

				user.memberOf(msg.guild).unban().then(function() {
					msg.reply("Unbanned " + user.mention + ".");
				}).catch(function(err) {
					msg.reply("There was an error! Do I have permission to do that?");
				});
			}).bind()
		.command("kick")
			.alias("k")
			.help("Kick a user.")
			.permission(cmd.Permissions.General.KICK_MEMBERS)
			.usage("<user>")
			.demand(["user"])
			.on(function(msg, args) {
				var user = args.get(0).o;

				user.memberOf(msg.guild).kick().then(function() {
					msg.reply("Kicked " + user.mention + ".");
				}).catch(function(err) {
					msg.reply("There was an error! Do I have permission to do that?");
				});
			}).bind()
		.command("mute")
			.alias("m")
			.help("Mute a user.")
			.permission(cmd.Permissions.Voice.MUTE_MEMBERS)
			.usage("<user>")
			.demand(["user"])
			.on(function(msg, args) {
				var user = args.get(0).o;

				user.memberOf(msg.guild).serverMute().then(function() {
					msg.reply("Muted " + user.mention + ".");
				}).catch(function(err) {
					msg.reply("There was an error! Do I have permission to do that?");
				});
			}).bind()
		.command("unmute")
			.alias("um")
			.help("Unmute a user.")
			.permission(cmd.Permissions.Voice.MUTE_MEMBERS)
			.usage("<user>")
			.demand(["user"])
			.on(function(msg, args) {
				var user = args.get(0).o;

				user.memberOf(msg.guild).serverUnmute().then(function() {
					msg.reply("Unmuted " + user.mention + ".");
				}).catch(function(err) {
					msg.reply("There was an error! Do I have permission to do that?");
				});
			}).bind()
		.command("deafen")
			.alias("d")
			.help("Deafen a user.")
			.permission(cmd.Permissions.Voice.DEAFEN_MEMBERS)
			.usage("<user>")
			.demand(["user"])
			.on(function(msg, args) {
				var user = args.get(0).o;

				user.memberOf(msg.guild).serverDeafen().then(function() {
					msg.reply("Deafened " + user.mention + ".");
				}).catch(function(err) {
					msg.reply("There was an error! Do I have permission to do that?");
				});
			}).bind()
		.command("undeafen")
			.alias("ud")
			.help("Undeafen a user.")
			.permission(cmd.Permissions.Voice.DEAFEN_MEMBERS)
			.usage("<user>")
			.demand(["user"])
			.on(function(msg, args) {
				var user = args.get(0).o;

				user.memberOf(msg.guild).serverUndeafen().then(function() {
					msg.reply("Undeafened " + user.mention + ".");
				}).catch(function(err) {
					msg.reply("There was an error! Do I have permission to do that?");
				});
			}).bind()
		.command("settopic")
			.alias("st")
			.alias("topic")
			.help("Set the topic of the current channel.")
			.permission(cmd.Permissions.General.MANAGE_CHANNELS)
			.usage("<topic>")
			.demand(["text"])
			.on(function(msg, args) {
				var topic = args.getFull();

				msg.channel.update(null, topic).then(function() {
					msg.reply("Updated topic.");
				}).catch(function(err) {
					if (err)
						msg.reply("There was an error! Do I have permission to do that?");
				});
			}).bind()
		.command("chname")
			.alias("sn")
			.help("Set the name of the current channel.")
			.permission(cmd.Permissions.General.MANAGE_CHANNELS)
			.usage("<name>")
			.demand(["text"])
			.on(function(msg, args) {
				msg.channel.update(args.getFull()).then(function() {
					msg.reply("Updated name.");
				}).catch(function(err) {
					if (err)
						msg.reply("There was an error! Do I have permission to do that?");
				});
			}).bind()
		.command("delch")
			.alias("rch")
			.help("Remove a text or voice channel.")
			.permission(cmd.Permissions.General.MANAGE_CHANNELS)
			.usage("<channel>")
			.demand(1)
			.on(function(msg, args) {
				var ch = (args.get(0).type == "txt-ch" || args.get(0).type == "voice-ch") ? args.get(0).o : msg.guild.channels.find(function(c) {
					return c.name == args.get(0).o;
				});

				var name = ch.name;

				if (ch) {
					ch.delete().then(function() {
						msg.reply("Deleted channel **" + name + "**.");
					}).catch(function() {
						msg.reply("There was an error! Do I have permission to do that?");
					});
				} else msg.reply("I couldn't find that channel!");
			}).bind()
		.command("cch")
			.alias("cc")
			.help("Create a text channel.")
			.permission(cmd.Permissions.General.MANAGE_CHANNELS)
			.usage("<name>")
			.demand(["text"])
			.on(function(msg, args) {
				msg.guild.createChannel("text", args.getFull()).then(function(ch) {
					msg.reply("Created a new channel with the name " + ch.mention + ".");
				}).catch(function(err) {
					if (err)
						msg.reply("There was an error! Do I have permission to do that?");
				});
			}).bind()
		.command("cvc")
			.help("Create a voice channel.")
			.permission(cmd.Permissions.General.MANAGE_CHANNELS)
			.usage("<name>")
			.demand(["text"])
			.on(function(msg, args) {
				msg.guild.createChannel("voice", args.getFull()).then(function(ch) {
					msg.reply("Created a new voice channel with the name **" + ch.name + "**.");
				}).catch(function(err) {
					if (err)
						msg.reply("There was an error! Do I have permission to do that?");
				});
			}).bind()
		.command("purge")
			.alias("p")
			.help("Purge the last x messages from a channel, optionally from a user.")
			.permission(cmd.Permissions.Text.MANAGE_MESSAGES)
			.usage("<number> [user filter]")
			.demand(["text"])
			.on(function(msg, args) {
				var number = parseInt(args.get(0).o, 10);
				var user = (args.length() > 1) ? args.get(1).o : null;

				if (number > 100) {
					msg.reply("Purge only works for up to 100 messages!");
					return;
				}

				if (args.length() > 1) {
					if (args.get(1).type == "text") {
						user = msg.guild.members.find(function(m) {
							return m.name == args.get(1).o;
						});
					}
				}

				if (user) {
					var messagesFromUser = msg.channel.messages.filter(function(m) {
						return m.author.id == user.id && !m.deleted;
					}).map(function(m) {
						return m.id;
					}).slice(-(number));

					cmd._.bot().Messages.deleteMessages(messagesFromUser, msg.channel).then(function() {
						msg.reply("Purged " + number + " messages by " + user.username.trim() + " in " + msg.channel.mention + ".");
					}).catch(function(err) {
						if (err)
							msg.reply("There was an error purging! Do I have permission?");
					});
				} else {
					var dm = msg.channel.messages.filter(function(m) {
						return !m.deleted;
					}).map(function(m) {
						return m.id;
					}).slice(-(number));

					cmd._.bot().Messages.deleteMessages(dm, msg.channel).then(function() {
						msg.reply("Purged " + number + " messages from " + msg.channel.mention + ".");
					}).catch(function(err) {
						if (err)
							msg.reply("There was an error purging! Do I have permission?");
					});
				}
			}).bind()
	}
}