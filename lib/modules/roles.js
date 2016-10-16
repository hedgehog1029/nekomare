module.exports = {
	name: "roles",
	init: function(cfg, cmd, data) {
		cmd
		.command("saroles")
			.alias("sar")
			.help("Self-assignable role tools.")
			.sub("add")
				.help("Add a self-assignable role.")
				.usage("<role name>")
				.demand(1)
				.permission(cmd.Permissions.General.MANAGE_ROLES)
				.on(function(msg, args) {
					var roles = args.argsList.map(function(arg) {
						if (arg.type == "text") {
							return msg.guild.roles.find(function(r) {
								return r.name == arg.o;
							});
						} else if (arg.type == "role") {
							return arg.o;
						}
					});
					
					if (roles) {
						var saroles = data.guild(msg.guild).section("saroles").or([]).get("roles");
						
						roles.forEach(function(role) {
							saroles.push(role.id);
						});
	
						data.guild(msg.guild).section("saroles").write("roles", saroles).commit();
						
						msg.reply("Added all specified roles to the list!");
					} else {
						msg.reply("There was a bit of a problem!");
					}
				}).bind()
			.sub("delete")
				.alias("del")
				.help("Remove a role from the self-assignable list.")
				.usage("<role name>")
				.demand(1)
				.permission(cmd.Permissions.General.MANAGE_ROLES)
				.on(function(msg, args) {
					var role;

					if (args.get(0).type == "text") {
						role = msg.guild.roles.find(function(r) {
							return r.name == args.get(0).o;
						});
					} else if (args.get(0).type == "role") {
						role = args.get(0).o;
					}

					if (role) {
						var saroles = data.guild(msg.guild).section("saroles").or([]).get("roles");
						
						if (saroles.indexOf(role.id) != -1) {
							saroles.splice(saroles.indexOf(role.id), 1);

							data.guild(msg.guild).section("saroles").write("roles", saroles).commit();

							msg.reply("Removed role **" + role.name + "** from the list!");
						} else {
							msg.reply("That role wasn't self-assignable!");
						}
					} else {
						msg.reply("That role doesn't exist!");
					}
				}).bind()
			.sub("list")
				.help("List self-assignable roles.")
				.on(function(msg, args) {
					var saroles = data.guild(msg.guild).section("saroles").or([]).get("roles");

					var content = msg.guild.roles.filter(function(r) {
						return saroles.indexOf(r.id) != -1;
					}).map(function(r) {
						return r.name;
					}).join(", ");

					msg.reply("Self-assignable roles: \n```\n" + content + "\n```");
				}).bind()
			.bind()
		.command("iam")
			.help("Assign yourself a self-assignable role!")
			.usage("<role name>")
			.demand(1)
			.on(function(msg, args) {
				var role;

				if (args.get(0).type == "text") {
					role = msg.guild.roles.find(function(r) {
						return r.name == args.get(0).o;
					});
				} else if (args.get(0).type == "role") {
					role = args.get(0).o;
				}

				if (!role) {
					msg.reply("That role does not exist!");

					return;
				}

				if (data.guild(msg.guild).section("saroles").get("roles").indexOf(role.id) != -1) {
					msg.member.assignRole(role);

					msg.reply("You are now **" + role.name + "**!");
				} else {
					msg.reply("That role is not self-assignable.");
				}
			}).bind()
		.command("iamnot")
			.help("Remove a self-assignable role.")
			.usage("<role name>")
			.demand(1)
			.on(function(msg, args) {
				var role;

				if (args.get(0).type == "text") {
					role = msg.guild.roles.find(function(r) {
						return r.name == args.get(0).o;
					});
				} else if (args.get(0).type == "role") {
					role = args.get(0).o;
				}

				if (!role) {
					msg.reply("That role does not exist!");

					return;
				}

				if (data.guild(msg.guild).section("saroles").get("roles").indexOf(role.id) != -1) {
					msg.member.unassignRole(role);

					msg.reply("You are no longer **" + role.name + "**.");
				} else {
					msg.reply("That role is not self-assignable.");
				}
			}).bind()
		.command("role")
			.help("Generic admin role tools.")
			.permission(cmd.Permissions.General.MANAGE_ROLES)
			.sub("color")
				.alias("colour")
				.help("Sets the colour of a role.")
				.usage("<role> <color>")
				.demand(2)
				.on(function(msg, args) {
					var role;

					if (args.get(0).type == "text") {
						role = msg.guild.roles.find(function(r) {
							return r.name == args.get(0).o;
						});
					} else if (args.get(0).type == "role") {
						role = args.get(0).o;
					}

					if (role) {
						var hex = args.get(1).o.replace(/^#/, ""),
							color = parseInt(hex, 16);

						role.commit(null, color).then(function() {
							msg.reply("Updated the color of role **" + role.name + "** to **#" + hex + "**.");
						}).catch(function(e) {
							msg.reply("I couldn't change the colour of that role. Maybe I don't have access?");
						})
					} else {
						msg.reply("That role doesn't exist!");
					}
				}).bind()
			.sub("create")
				.alias("cr")
				.help("Create a new role.")
				.usage("<name>")
				.demand(["text"])
				.on(function(msg, args) {
					msg.guild.createRole().then(function(role) {
						role.commit(args.getFull());

						msg.reply("Created role **" + args.getFull() + "**");
					}).catch(function() {
						msg.reply("There was an error creating the role! Maybe I don't have permission?");
					});
				}).bind()
			.sub("delete")
				.alias("del")
				.help("Delete a role.")
				.usage("<name>")
				.demand(1)
				.on(function(msg, args) {
					var role = (args.get(0).type == "role") ? args.get(0).o : msg.guild.roles.find(function(r) {
						return r.name == args.getFull();
					});

					if (role) {
						msg.reply("Deleted role **" + role.name + "**.");

						role.delete();
					} else msg.reply("No role exists with that name!");
				}).bind()
			.sub("set")
				.alias("assign")
				.help("Assign a role to a user.")
				.usage("<user> <role>")
				.demand(2)
				.on(function(msg, args) {
					var user = (args.get(0).type == "user") ? args.get(0).o.memberOf(msg.guild) : msg.guild.members.find(function(m) {
						return m.name == args.get(0).o;
					});

					var role = (args.get(1).type == "role") ? args.get(1).o : msg.guild.roles.find(function(r) {
						return r.name == args.slice(1).getFull();
					});

					if (user && role) {
						user.assignRole(role).then(function() {
							msg.reply("Assigned " + user.mention + " role **" + role.name + "**.");
						}).catch(function(e) {
							if (e)
								msg.reply("I couldn't assign the user that role. Maybe I don't have permission?");
						});
					} else if (user) {
						msg.reply("I couldn't find that role!");
					} else if (role) {
						msg.reply("I couldn't find that user!");
					} else {
						msg.reply("I couldn't find that user or that role!");
					}
				}).bind()
			.sub("unset")
				.alias("unassign")
				.usage("<user> <role>")
				.demand(2)
				.on(function(msg, args) {
					var user = (args.get(0).type == "user") ? args.get(0).o.memberOf(msg.guild) : msg.guild.members.find(function(m) {
						return m.name == args.get(0).o;
					});

					var role = (args.get(1).type == "role") ? args.get(1).o : msg.guild.roles.find(function(r) {
						return r.name == args.slice(1).getFull();
					});

					if (user && role) {
						user.unassignRole(role).then(function() {
							msg.reply("Unassigned role **" + role.name + "** from " + user.mention + ".");
						}).catch(function(e) {
							if (e)
								msg.reply("I couldn't unassign that role from that user. Maybe I don't have permission?");
						});
					} else if (user) {
						msg.reply("I couldn't find that role!");
					} else if (role) {
						msg.reply("I couldn't find that user!");
					} else {
						msg.reply("I couldn't find that user or that role!");
					}
				}).bind()
			.sub("rename")
				.usage("<role> <new name>")
				.help("Rename a role!")
				.demand(2)
				.on(function(msg, args) {
					var role = (args.get(0).type == "role") ? args.get(0).o : msg.guild.roles.find(function(r) {
						return r.name == args.get(0).o;
					}),
						original = role.name,
						newName = args.get(1).o;

					role.commit(newName).then(function(r) {
						msg.reply("Renamed **" + original + "** to **" + r.name + "**.");
					}).catch(function(err) {
						if (err)
							msg.reply("There was an error renaming the role! Do I have permission?");
					});
				}).bind()
			.sub("purge")
				.help("Remove all roles from a user.")
				.usage("<user>")
				.demand(["user"])
				.on(function(msg, args) {
					var user = args.get(0).o;

					user.memberOf(msg.guild).setRoles([]).then(function() {
						msg.reply("Purged all the roles of " + user.mention + ".");
					}).catch(function(err) {
						if (err)
							msg.reply("There was an error renaming the role! Do I have permission?");
					});
				}).bind()
			.sub("list")
				.help("List all the roles of a user, or all roles on the server if no user is specified.")
				.usage("[user]")
				.on(function(msg, args) {
					if (args.length() > 0) {
						var user = (args.get(0).type == "user") ? args.get(0).o : msg.guild.members.find(function(m) {
							return m.username == args.get(0).o;
						});

						var roleList = user.memberOf(msg.guild).roles.map(function(r) {
							return r.name;
						});

						msg.reply("List of " + user.mention + "'s roles:\n```\n" + roleList.join(", ") + "\n```");
					} else {
						var roleList = msg.guild.roles.map(function(r) {
							return r.name;
						});

						msg.reply("List of all roles:\n```\n" + roleList.join(", ") + "\n```");
					}
				}).bind()
			.sub("hoist")
				.alias("h")
				.help("Set a role's hoisted status.")
				.usage("<role> <true/false>")
				.demand(2)
				.on(function(msg, args) {
					var role = (args.get(0).type == "role") ? args.get(0).o : msg.guild.roles.find(function(r) {
						return r.name == args.get(0).o;
					});

					if (role && args.get(1).type == "boolean") {
						role.commit(null, null, args.get(1).o);

						msg.reply((args.get(1).o ? "Hoisted" : "Unhoisted") + " **" + role.name + "**.");
					} else if (role) {
						msg.reply("That doesn't look like a boolean!");
					} else if (args.get(1).type != "boolean") {
						msg.reply("Usage: `neko role hoist <role> <true/false>`");
					}
				}).bind()
			.bind();
	}
}
