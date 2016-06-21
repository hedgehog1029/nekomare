var fs = require("fs"),
	rethinkdb = require("rethinkdbdash");

var r = rethinkdb({ db: "nekomare" });

var logger = require("./logger.js"),
	l = logger.get("data");

function DataSection(parent, name) {
	this.parent = parent;
	this.name = name;
	this.alt = null;

	this.write = function(key, value) {
		r.table("guild_data").get(this.parent.id).update({ [this.name]: { [key]: value } }).run();

		return this;
	}

	this.commit = function() {
		Idata._save();
	}

	this.or = function(alt) {
		this.alt = alt;

		return this;
	}

	this._get = function*(key) {
		yield r.table("guild_data").get(this.parent.id)(this.name)(key);
	}

	this.get = function(key) {
		var val = this._get(key).next();

		return val.value ? val.value : this.alt;
	}

	this.asObject = function() {
		return Idata.saveData[this.parent.id][this.name];
	}
}

function GuildData(gid) {
	this.id = gid;

	this.section = function(name) {
		return new DataSection(this, name);
	}
}

var Idata = {
	"saveData": {},
	"_save": function() {
		fs.writeFile(__dirname + "/../data/data.json", JSON.stringify(Idata.saveData), function(err) {
			if (err) {
				l.error("Error writing data to file!");
				l.error(err);

				return;
			}
		});
	}
}

var data = {
	"guild": function(guild) {
		return new GuildData(guild.id ? guild.id : guild);	
	},
	"_load": function(data) {
		Idata.saveData = data;

		l.info("Saved data successfully loaded.");
	},
}

module.exports = data;