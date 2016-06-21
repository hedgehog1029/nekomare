module.exports = {
	name: "filter",
	init: function(cfg, cmd, data) {
		cmd.filter(function(cmd, msg, args) {
			if (msg.isPrivate) {
				if (cmd.alias() == "help") return true;
				else {
					msg.reply("You can only use the help command in private messages.");
					return false;
				}
			}

			var ds = data.guild(msg.guild).section("sleep").or({});
				disabled = ds.get("disabled-channels"),
				restricted = ds.get("restricted-channels");

			if (disabled[msg.channel.id]) {
				var chs = disabled[msg.channel.id];

				return chs.commands.indexOf(cmd.alias()) == -1;
			}

			if (restricted[cmd.alias()]) {
				return msg.member.hasRole(restricted[cmd.alias()]);
			}

			return true;
		});

		cmd
		.command("filter")
			.help("Manage channel + guild filters.")
			.permission(cmd.Permissions.General.MANAGE_GUILD)
			.sub("disable")
				.help("Disable a command in the current channel.")
				.usage("<command>")
				.demand(1)
				.on(function(msg, args) {
					var disabled = data.guild(msg.guild).section("sleep").or({}).get("disabled-channels");
					if (!disabled[msg.channel.id]) disabled[msg.channel.id] = { commands: [] };

					var c = cmd._.commands[args.get(0).o];

					if (!c) {
						msg.reply("That command doesn't exist!");
						return;
					}

					disabled[msg.channel.id].commands.push(c.alias());

					msg.reply("Disabled **" + c.alias() + "** in " + msg.channel.mention + ".");
					data.guild(msg.guild).section("sleep").write("disabled-channels", disabled).commit();
				}).bind()
			.sub("enable")
				.help("Re-enable a command in the current channel.")
				.usage("<command>")
				.demand(1)
				.on(function(msg, args) {
					var disabled = data.guild(msg.guild).section("sleep").or({}).get("disabled-channels");
					if (!disabled[msg.channel.id]) disabled[msg.channel.id] = { commands: [] };

					var c = cmd._.commands[args.get(0).o];

					if (!c) {
						msg.reply("That command doesn't exist!");
						return;
					}

					if (disabled[msg.channel.id].commands.indexOf(c.alias()) != -1) {
						disabled[msg.channel.id].commands.splice(disabled[msg.channel.id].commands.indexOf(c.alias()), 1);

						msg.reply("Enabled **" + c.alias() + "** in " + msg.channel.mention + ".");

						if (disabled[msg.channel.id].commands.length == 0)
							delete disabled[msg.channel.id];

						data.guild(msg.guild).section("sleep").write("disabled-channels", disabled).commit();
					} else {
						msg.reply("That command isn't disabled here!");
					}
				}).bind()
			.sub("restrict")
				.help("Restrict a command to a role.")
				.usage("<command> <role>")
				.demand(2)
				.on(function(msg, args) {
					var restricted = data.guild(msg.guild).section("sleep").or({}).get("restricted-commands");

					var c = cmd._.commands[args.get(0).o];
					var role = (args.get(1).type == "role") ? args.get(1).o : msg.guild.roles.find(function(r) {
						return r.name == args.slice(1).getFull();
					});

					if (!role) {
						msg.reply("Couldn't find that role!");
						return;
					}

					if (c) {
						restricted[c.alias()] = role.id;

						data.guild(msg.guild).section("sleep").write("restricted-commands", restricted).commit();

						msg.reply("Command **" + c.alias() + "** is now restricted to role **" + role.name + "**.");
					} else msg.reply("That command doesn't exist!");
				}).bind()
			.sub("unrestrict")
				.help("Unrestrict a command.")
				.usage("<command>")
				.demand(1)
				.on(function(msg, args) {
					var restricted = data.guild(msg.guild).section("sleep").or({}).get("restricted-commands");

					var c = cmd._.commands[args.get(0).o];

					if (c) {
						delete restricted[c.alias()];

						data.guild(msg.guild).section("sleep").write("restricted-commands", restricted).commit();

						msg.reply("Command **" + c.alias() + "** is no longer restricted to any role.");
					} else msg.reply("That command doesn't exist!");
				}).bind()
			.bind();
	}
}