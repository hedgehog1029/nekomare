var fs = require("fs");

var logger = require("./logger.js"),
	l = logger.get("data");

function DataSection(parent, name) {
	this.parent = parent;
	this.name = name;
	this.alt = null;

	this.write = function(key, value) {
		if (!Idata.saveData[this.parent.id]) Idata.saveData[this.parent.id] = {};
		if (!Idata.saveData[this.parent.id][this.name]) Idata.saveData[this.parent.id][this.name] = {};

		Idata.saveData[this.parent.id][this.name][key] = value;

		return this;
	}

	this.commit = function() {
		Idata._save();
	}

	this.or = function(alt) {
		this.alt = alt;

		return this;
	}

	this.get = function(key) {
		if (!Idata.saveData[this.parent.id]) Idata.saveData[this.parent.id] = {};
		if (!Idata.saveData[this.parent.id][this.name]) Idata.saveData[this.parent.id][this.name] = {};

		return Idata.saveData[this.parent.id][this.name][key] ? Idata.saveData[this.parent.id][this.name][key] : this.alt;	
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