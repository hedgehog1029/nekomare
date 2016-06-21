var fs = require("fs"),
	logger = require("./logger.js");

var l = logger.get("modloader");

var load = function(config, manager, data) {
	fs.readdir(__dirname + "/modules", function(err, files) {
		if (err) {
			l.error("There was an error reading the module directory!");
			l.error(err);
			return;
		}

		files.forEach(function(file) {
			var mod;

			try {
				mod = require("./modules/" + file);
			} catch(e) {
				l.error("Module file " + file + " threw an error during the require() call!");
				l.error(e);

				return;
			}

			if (!mod.name) {
				l.error("Module file " + file + " has no name!");
				return;
			}

			if (!mod.init) {
				l.error("Module " + mod.name + " has no init(cfg, cmd) function!");
				return;
			}

			try {
				manager._setModule(mod.name);

				mod.init(config[mod.name], manager, data);
				l.info("Loaded module " + mod.name + ".");
			} catch(e) {
				l.error("Module " + mod.name + " threw an error while initializing!");
				l.error(e);

				return;
			}

			if (mod.exposed)
				module.exports[mod.name] = mod.exposed;
		});
	})
}

module.exports = {
	"loader": {
		"load": load
	}
}