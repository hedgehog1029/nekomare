function listDemands(arr) {
	return arr.map(function(arg) {
		if (arg.type) return arg.type;
		else return arg;
	}).join(", ");
}

var ErrorSystem = {
	"throw": function(e, msg) {
		e.reply("Error: " + msg);
	}
}

var TypedArgument = function(type, obj) {
	return { type: type, o: obj };
}

var ArgumentList = function(raw, list) {
	this.argsList = list;
	this.rawList = raw;

	this.get = function(i) {
		return this.argsList[i];
	}

	this.getFull = function() {
		return this.rawList.join(" ");
	}

	this.length = function() {
		return this.argsList.length;
	}

	this.slice = function(n) {
		var sliced = this.argsList.slice(n);

		return new ArgumentList(this.rawList.slice(n), sliced);
	}
}

var ArgumentParser = function(raw) {
	this.rawList = raw;
	this.argsList = [];

	this.parse = function(e, cb) {
		for (var i = 0; i < this.rawList.length; i++) {
		 	var arg = this.rawList[i];

			if (arg.startsWith("<")) {
				if (arg.charAt(1) == "#") {
					var id = arg.replace(/<#(\d+)>/, "$1");

					var chs = e.guild.textChannels.filter(function(ch) {
						return ch.id == id;
					});

					if (chs != null && chs[0] != null) {
						this.argsList.push(TypedArgument("txt-ch", chs[0]));
					}
				} else if (arg.charAt(1) == "@") {
					var id = arg.replace(/<@[&!]*(\d+)>/, "$1");

					if (arg.charAt(2) == "&") {
						var role = e.guild.roles.find(function(r) {
							return r.id == id;
						});

						if (role)
							this.argsList.push(TypedArgument("role", role));
					} else {
						var usrs = e.guild.members.filter(function(u) {
							return u.id == id;
						});

						if (usrs != null && usrs[0] != null) {
							this.argsList.push(TypedArgument("user", usrs[0]));
						}
					}
				}
			} else if (/\$guild/.test(arg)) {
				this.argsList.push(TypedArgument("guild", e.guild));
			} else if (/\$me/.test(arg)) {
				this.argsList.push(TypedArgument("user", e.author));
			} else if (/\$ch/.test(arg)) {
				this.argsList.push(TypedArgument("txt-ch", e.channel));
			} else if (/\$vc/.test(arg)) {
				if (e.member && e.member.getVoiceChannel())
					this.argsList.push(TypedArgument("voice-ch", e.member.getVoiceChannel()));
			} else if (arg == "true") {
				this.argsList.push(TypedArgument("boolean", true));
			} else if (arg == "false") {
				this.argsList.push(TypedArgument("boolean", false));
			} else {
				this.argsList.push(TypedArgument("text", arg));
			}
		}

		cb(new ArgumentList(this.rawList, this.argsList));
	}
}

ArgumentParser.primaryParse = function(raw) {
	var rawList = [];

	var quoted = false;
	var sbuffer = "";
	for (var i = 0, len = raw.length; i < len; i++) {
		var char = raw.charAt(i);

		if (char == '"')
			quoted = !quoted;
		else if (char == ' ' && !quoted) {
			rawList.push(sbuffer);

			sbuffer = "";
		} else {
			sbuffer += char;
		}
	}

	rawList.push(sbuffer); // push final word

	return rawList;
}

var Command = function(manager, alias, module) {
	this.manager = manager;
	this._ = {};
	this._.module = module;
	this._.aliases = [alias];
	this._.permission = null;
	this._.usage = "";
	this._.help = "No help provided.";
	this._.helptopics = [];
	this._.commands = {};
	this._.reqArgs = -1;
	this._.demandArgs = [];
	this._.callback = function(e, a) {
		if (this.commands[a.get(0).o] != null && a.get(0).type == "text") {
			var c = this.commands[a.get(0).o];

			if (!c.permission())
				c._.run(e, a.slice(1));
			else if (!e.isPrivate) {
				if (e.author.can(c.permission(), e.guild)) {
					c._.run(e, a.slice(1));
				} else {
					e.reply("You don't have permission!");
				}
			} else {
				e.reply("That command isn't available in private chat!");
			}
		}
	};

	this.alias = function(alias) {
		if (alias == null) return this._.aliases[0];
		this._.aliases.push(alias);
		return this;
	}

	this.permission = function(permission) {
		if (permission == null) return this._.permission;
		this._.permission = permission;
		return this;
	}

	this.usage = function(usage) {
		if (usage == null) return this._.usage;
		this._.usage = usage;
		return this;
	}

	this.help = function(help) {
		if (help == null) return this._.help;
		this._.help = help;
		return this;
	}

	this.module = function() {
		return this._.module;
	}

	this.on = function(cb) {
		this._.callback = cb;
		return this;
	}

	this.sub = function(alias) {
		return new Command(this, alias, this._.module);
	}

	this.demand = function(i) {
		if (!Array.isArray(i)) {
			this._.reqArgs = i;
		} else {
			this._.reqArgs = i.length;
			this._.demandArgs = i;
		}

		return this;
	}

	this.bind = function() {
		for (var i = 0; i < this._.aliases.length; i++) {
			this.manager._.commands[this._.aliases[i]] = this;
		}

		if (this._.usage == "" && Object.keys(this._.commands).length > 0) {
			var cmds = this._.helptopics.map(function(c) {
				return c.alias();
			});

			this.usage("<" + cmds.join("/") + ">");
		}

		this.manager._.helptopics.push(this);

		return this.manager;
	}

	this._.run = function(e, a) {
		if (this.reqArgs == -1) {
			this.callback(e, a);
		} else {
			if (a.length() >= this.reqArgs) {
				for (var i = 0; i < this.demandArgs.length; i++) {
					if (this.demandArgs[i] != a.get(i).type) {
						ErrorSystem.throw(e, "Argument error: Expected `" + listDemands(this.demandArgs) + "`, got `" + listDemands(a.argsList) + "`.");
						return;
					}
				}

				this.callback(e, a);
			} else {
				ErrorSystem.throw(e, "Argument error: Expected at least " + this.reqArgs + " arguments.");
			}
		}
	}
}

var CommandManager = function() {
	this._ = {};
	this._.filters = [];
	this._.bot = null;
	this._.module = null;
	this._.commands = {};
	this._.helptopics = [];
	this._.processed = 0;
	this._.lastProcessed = 0;
	this._.lastProcessedName = "";

	this.Permissions = {};

	var self = this;
	this._.setPermissions = function(perms) {
		self.Permissions = perms;
	}

	this._setModule = function(name) {
		this._.module = name;
	}

	this.command = function(alias) {
		return new Command(this, alias, this._.module);
	}

	this.filter = function(cb) {
		this._.filters.push(cb);

		return this;
	}

	this.dispatch = function(cmd, msg, args) {
		if (this._.commands[cmd] != null) {
			var c = this._.commands[cmd];

			if (this._.filters.length > 0) {
				var result = this._.filters.every(function(f) {
					return f(c, msg, args);
				});

				if (!result) return;
			}

			this._.processed++;
			this._.lastProcessed = Date.now();
			this._.lastProcessedName = c.alias();

			if (!c.permission())
				c._.run(msg, args);
			else if (msg.author.can(c.permission(), msg.guild)) {
				c._.run(msg, args);
			} else {
				msg.reply("You don't have permission!");
			}
		}
	}

	this.on = function(event, callback) {
		this._.bot().Dispatcher.on(event, callback);
	}

	this.clear = function() {
		this._.commands = {};
		this._.helptopics = [];
	}
}

var manager = {
	"manager": new CommandManager(),
	"dispatch": function(config, bot, msg) {
		if (msg.author.id == bot.User.id) return false;
		if (msg.author.bot) return false;

		var content = msg.content.trim(),
			extract = content.toLowerCase().split(" ");

		if (extract[0] == config.prefix) {
			(new ArgumentParser(ArgumentParser.primaryParse(content).slice(2))).parse(msg, function(p) {
				try {
					manager.manager.dispatch(extract[1], msg, p);
				} catch(e) {
					msg.reply("There was an error executing that command!");

					if (msg.author.id == config.ownerid)
						msg.reply(e);
				}
			});

			return true;
		}
	}
}

module.exports = manager;
