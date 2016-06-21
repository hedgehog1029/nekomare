var locks = {
	"voicelocks": {},
	"userlocks": {}
}

module.exports = {
	name: "locks",
	init: function(cfg, cmd, data) {
		cmd.on("VOICE_CHANNEL_JOIN", module.exports.exposed.voiceJoinHook);
		cmd.on("VOICE_CHANNEL_LEAVE", module.exports.exposed.voiceLeaveHook);
		cmd.on("CHANNEL_DELETE", module.exports.exposed.voiceDeleteHook);

		cmd
		.command("voicelock")
			.alias("vl")
			.help("Create a text channel and restrict access to users in a voice channel.")
			.usage("<voice channel> <text channel name>")
			.demand(2)
			.permission(cmd.Permissions.General.MANAGE_CHANNELS)
			.on(function(msg, args) {
				var vc = (args.get(0).type == "voice-ch") ? args.get(0).o : msg.guild.voiceChannels.find(function(v) {
					return v.name == args.get(0).o;
				});

				if (!vc) {
					msg.reply("Couldn't find that voice channel!");
					return;
				}

				msg.guild.createChannel("text", args.get(1).o).then(function(channel) {
					var everyone = msg.guild.roles.find(function(r) {
						return r.name == "@everyone";
					});

					if (everyone) {
						channel.createPermissionOverwrite(cmd._.bot().User, 3072); // Allow the bot to read + write
						channel.createPermissionOverwrite(everyone, 0, 3072); // Deny read + write access to the channel

						locks.voicelocks[vc.id] = channel;

						msg.reply("Created a new voicelocked text channel by the name of **" + channel.name + "**.");
					} else msg.reply("I couldn't find the @everyone role. What did you do?!?!?");
				}).catch(function(err) {
					if (err) {
						msg.reply("There was an issue creating the text channel. Maybe I don't have permission?");
						msg.reply(err);
					}
				});
			}).bind()
		.command("userlock")
			.alias("ul")
			.help("Create a voice channel that only exists as long as there are people in it.")
			.usage("<name>")
			.demand(["text"])
			.permission(cmd.Permissions.General.MANAGE_CHANNELS)
			.on(function(msg, args) {
				msg.guild.createChannel("voice", args.get(0).o).then(function(vc) {
					locks.userlocks[vc.id] = vc;

					msg.reply("Created a temporary voice channel with the name of **" + vc.name + "**.");
				}).catch(function(err) {
					if (err) {
						msg.reply("There was an issue creating the voice channel. Maybe I don't have permission?");
						msg.reply(err);
					}
				});
			}).bind()
		.command("unlock")
			.help("Release a voice-locked channel.")
			.usage("<channel name>")
			.demand(1)
			.permission(cmd.Permissions.General.MANAGE_CHANNELS)
			.on(function(msg, args) {
				if (args.get(0).type == "voice-ch") {
					if (locks.voicelocks[args.get(0).o.id]) {
						var channel = locks.voicelocks[args.get(0).o.id];
						msg.reply("Released channel " + channel.mention + " from lock of **" + args.get(0).o.name + "**.");

						channel.delete();
						delete locks.voicelocks[args.get(0).o.id];
					} else msg.reply("That channel wasn't locked!");
				} else if (args.get(0).type == "txt-ch") {
					var vc = Object.keys(locks.voicelocks).find(function(vcid) {
						return locks.voicelocks[vcid].id == args.get(0).o.id;
					});

					if (vc) {
						var channel = locks.voicelocks[vc];
						msg.reply("Released channel " + channel.mention + " from lock.");

						channel.delete();
						delete locks.voicelocks[vc];
					} else msg.reply("That channel wasn't locked!");
				} else if (args.get(0).type == "text") {
					var channel = msg.guild.channels.find(function(c) {
						return c.name == args.get(0).o;
					});

					if (channel) {
						if (channel.type == "text") {
							var vc = Object.keys(locks.voicelocks).find(function(vcid) {
								return locks.voicelocks[vcid].id == channel.id;
							});

							if (vc) {
								var channel = locks.voicelocks[vc];
								msg.reply("Released channel " + channel.mention + " from lock.");

								channel.delete();
								delete locks.voicelocks[vc];
							} else msg.reply("That channel wasn't locked!");
						} else if (channel.type == "voice") {
							if (locks.voicelocks[channel.id]) {
								var lch = locks.voicelocks[channel.id];
								msg.reply("Released channel " + lch.mention + " from lock of **" + channel.name + "**.");

								lch.delete();
								delete locks.voicelocks[vc];
							}
						}
					}
				}
			}).bind()
	},
	exposed: {
		voiceJoinHook: function(e) {
			if (locks.voicelocks[e.channel.id]) {
				var channel = locks.voicelocks[e.channel.id];

				channel.createPermissionOverwrite(e.user.memberOf(e.channel.guild), 3072);
			}
		},
		voiceLeaveHook: function(e) {
			if (locks.voicelocks[e.channel.id]) {
				var channel = locks.voicelocks[e.channel.id];

				channel.createPermissionOverwrite(e.user.memberOf(e.channel.guild), 0, 3072);
			} else if (locks.userlocks[e.channel.id]) {
				var channel = locks.userlocks[e.channel.id];

				if (channel.members.length == 0) {
					channel.delete();

					delete locks.userlocks[e.channel.id];
				}
			}
		},
		voiceDeleteHook: function(e) {
			if (locks.voicelocks[e.data.id] && e.data.type == "voice") {
				locks.voicelocks[e.data.id].delete();

				delete locks.voicelocks[e.data.id];
			} else if (locks.userlocks[e.data.id] && e.data.type == "voice") {
				delete locks.userlocks[e.data.id];
			} else {
				if (e.data.type == "text") {
					var vcid = Object.keys(locks.voicelocks).find(function(vcid) {
						return locks.voicelocks[vcid] == null; // find the deleted channel's voice link
					});

					if (vcid) {
						delete locks.voicelocks[vcid];
					}
				}
			}
		}
	}
}