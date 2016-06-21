var private = {
	voice: {}
}

module.exports = {
	name: "private",
	init: function(cfg, cmd, data) {
		cmd
		.command("private")
			.alias("pr")
			.help("Manage private channels!")
			.sub("create")
				.alias("cr")
				.help("Create a new private voice channel.")
				.usage("<name>")
				.demand(1)
				.on(function(msg, args) {
					if (private.voice[msg.author.id]) {
						msg.reply("You already own a private voice channel!");
						return;
					}

					var everyone = msg.guild.roles.find(function(r) {
						return r.name == "@everyone";
					});

					msg.guild.createChannel("voice", args.getFull()).then(function(vc) {
						vc.createPermissionOverwrite(everyone, 0, 1048576);
						vc.createPermissionOverwrite(cmd._.bot().User, 1048576);
						vc.createPermissionOverwrite(msg.member, 1048576);

						private.voice[msg.author.id] = { vc: vc, members: [], owner: msg.author.id };

						msg.member.setChannel(vc);

						msg.reply("Created a private voice channel, just for you!\nInvite friends with `neko pr invite @friend`");
					}).catch(function(err) {
						if (err)
							msg.reply("There was a problem creating the voice channel. Maybe I don't have permission?");
					});
				}).bind()
			.sub("delete")
				.alias("del")
				.help("Delete your private voice channel.")
				.on(function(msg, args) {
					if (!private.voice[msg.author.id]) {
						msg.reply("You don't own a private voice channel!");
						return;
					}

					msg.reply("Deleted your private voice channel.");

					private.voice[msg.author.id].vc.delete();
					delete private.voice[msg.author.id];
				}).bind()
			.sub("invite")
				.alias("inv")
				.help("Invite a friend to your private voice channel!")
				.usage("<user>")
				.demand(1)
				.on(function(msg, args) {
					if (!private.voice[msg.author.id]) {
						msg.reply("You don't own a private voice channel! Use `neko pr create <name>` first!");
						return;
					}

					var pr = prop(private.voice[msg.author.id]);

					if (args.get(0).type == "user") {
						if (pr().members.indexOf(args.get(0).o.id) != -1) {
							msg.reply("That user is already in your private voice channel!");
							return;
						}

						if (args.get(0).o.id == msg.author.id) {
							msg.reply("You can't invite yourself!");
							return;
						}

						pr().members.push(args.get(0).o.id);
						pr().vc.createPermissionOverwrite(args.get(0).o.memberOf(msg.guild), 1048576);

						msg.reply("Invited " + args.get(0).o.mention + " to your private voice channel.");
					} else if (args.get(0).type == "text") {
						var user = msg.guild.members.find(function(m) {
							return m.name == args.get(0).o;
						});

						if (user) {
							if (pr().members.indexOf(user.id) != -1) {
								msg.reply("That user is already in your private voice channel!");
								return;
							}

							if (user.id == msg.author.id) {
								msg.reply("You can't invite yourself!");
								return;
							}

							pr().members.push(user.id);
							pr().vc.createPermissionOverwrite(user, 1048576);

							msg.reply("Invited " + user.mention + " to your private voice channel.");
						} else msg.reply("Couldn't find that user!");
					}

					private.voice[msg.author.id] = pr();
				}).bind()
			.sub("kick")
				.alias("k")
				.help("Kick a user from your private voice channel.")
				.usage("<user>")
				.demand(1)
				.on(function(msg, args) {
					if (!private.voice[msg.author.id]) {
						msg.reply("You don't own a private voice channel! Use `neko pr create <name>` first!");
						return;
					}

					var pr = prop(private.voice[msg.author.id]);

					if (args.get(0).type == "user") {
						if (pr().members.indexOf(args.get(0).o.id) == -1) {
							msg.reply("That user isn't in your private voice channel!");
							return;
						}

						pr().members.splice(pr().members.indexOf(args.get(0).o.id), 1);
						pr().vc.createPermissionOverwrite(args.get(0).o.memberOf(msg.guild), 0, 1048576);

						msg.reply("Kicked " + args.get(0).o.mention + " from your private voice channel.");
					} else if (args.get(0).type == "text") {
						var user = msg.guild.members.find(function(m) {
							return m.name == args.get(0).o;
						});

						if (user) {
							if (pr().members.indexOf(user.id) == -1) {
								msg.reply("That user isn't in your private voice channel!");
								return;
							}

							pr().members.splice(pr().members.indexOf(user.id), 1);
							pr().vc.createPermissionOverwrite(user, 0, 1048576);

							msg.reply("Kicked " + user.mention + " from your private voice channel.");
						} else msg.reply("Couldn't find that user!");
					}

					private.voice[msg.author.id] = pr();
				}).bind()
			.bind();
	}
}

function prop(val) {
	return function() {
		return val;
	}
}