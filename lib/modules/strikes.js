function findOrCreateMuted(msg, cb) {
	var muted = msg.guild.roles.find(function(r) {
		return r.name == "Muted";
	});

	if (muted) {
		cb(muted);
		return;
	} else {
		msg.guild.createRole().then(function(role) {
			role.permissions.Text.SEND_MESSAGES = false;
			role.permissions.Text.SEND_TTS_MESSAGES = false;
			role.permissions.Text.EMBED_LINKS = false;
			role.permissions.Text.ATTATCH_FILES = false;

			role.commit("Muted");

			msg.reply("I created a Muted role, but it might not be ordered right. You may need to re-order it for it to have effect.");

			cb(role);
		}).catch(function(err) {
			if (err)
				msg.reply("There was an error creating the Muted role! Do I have permission?");
		});
	}
}

function strikeUpdate(msg, user, strikes) {
	if (strikes == 3) {
		user.memberOf(msg.guild).kick();
	} else if (strikes == 4) {
		findOrCreateMuted(msg, function(role) {
			user.memberOf(msg.guild).assignRole(role);
		});
	} else if (strikes == 5) {
		user.memberOf(msg.guild).ban();
	}
}

module.exports = {
	name: "strikes",
	init: function(cfg, cmd, data) {
		cmd
		.command("strike")
			.help("Add a strike to a user. 3 strikes = kick, 4 strikes = chat mute, 5 strikes = ban.")
			.usage("<user> [number]")
			.demand(["user"])
			.permission(cmd.Permissions.General.KICK_MEMBERS)
			.on(function(msg, args) {
				var userStrikes = data.guild(msg.guild).section("strikes").or(0).get(args.get(0).o.id),
					amount = (args.length() > 1) ? parseInt(args.get(1).o) : 1;

				if (args.length() > 1) {
					if (!/\d+/.test(args.get(1).o)) {
						msg.reply("You need to specify a number!");
						return;
					}
				}

				if (userStrikes + amount > 5) {
					msg.reply("Too many strikes!");
					return;
				}

				userStrikes += amount;
				msg.reply("Struck " + args.get(0).o.mention + ", they now have " + userStrikes + " strikes.");

				strikeUpdate(msg, args.get(0).o, userStrikes);
				data.guild(msg.guild).section("strikes").write(args.get(0).o.id, userStrikes).commit();
			}).bind()
		.command("rstrike")
			.help("Reduce a user's strikes. This will not undo any sanctions.")
			.usage("<user> [number]")
			.demand(["user"])
			.permission(cmd.Permissions.General.KICK_MEMBERS)
			.on(function(msg, args) {
				var userStrikes = data.guild(msg.guild).section("strikes").or(0).get(args.get(0).o.id),
					amount = (args.length() > 1) ? parseInt(args.get(1).o) : 1;

				if (args.length() > 1) {
					if (!/\d+/.test(args.get(1).o)) {
						msg.reply("You need to specify a number!");
						return;
					}
				}

				if (userStrikes - amount < 0) {
					msg.reply("That user has less than " + amount + " strikes!");
					return;
				}

				if (userStrikes == 0) {
					msg.reply("That user already has no strikes!");
					return;
				}

				userStrikes -= amount;
				msg.reply("Removed " + amount + " strike" + (amount > 1 ? "s" : "") + " from " + args.get(0).o.mention + ", they now have " + userStrikes + " strikes.");

				data.guild(msg.guild).section("strikes").write(args.get(0).o.id, userStrikes).commit();
			}).bind()
		.command("strikes")
			.help("Retrieve a user's strikes.")
			.usage("<user>")
			.demand(["user"])
			.permission(cmd.Permissions.General.KICK_MEMBERS)
			.on(function(msg, args) {
				var userStrikes = data.guild(msg.guild).section("strikes").or(0).get(args.get(0).o.id);

				msg.reply(args.get(0).o.mention + " has " + userStrikes + " strike" + (userStrikes != 1 ? "s" : "") + ".");
			}).bind()
	}
}