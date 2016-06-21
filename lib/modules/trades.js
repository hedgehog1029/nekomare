var active = {},
	activeRef = {};

module.exports = {
	name: "trades",
	init: function(cfg, cmd, data) {
		cmd
		.command("trade")
			.demand(["user", "text", "text"])
			.help("Trade some letters from your username!")
			.usage("<user> <requested letters> <bidding letters>")
			.on(function(msg, args) {
				var target = args.get(0).o.memberOf(msg.guild),
					req = args.get(1).o,
					res = args.get(2).o,
					user = msg.member;

				if (active[target.id] || activeRef[target.id]) {
					msg.reply("That user is already in a trade!");
					return;
				}

				if (active[user.id] || activeRef[user.id]) {
					msg.reply("You're already in a trade! Use `neko tradecancel` to cancel it.");
				}

				var un = user.nick.replace(/\s/g, ""),
					tn = target.nick.replace(/\s/g, "");

				if (un.indexOf(res) == -1) {
					msg.reply("You don't have those letters in your nickname!");
					return;
				}

				if (tn.indexOf(req) == -1) {
					msg.reply("That user doesn't have those letters in their nickname!");
					return;
				}

				activeRef[user.id] = target.id;
				active[target.id] = {
					user: user,
					target: target,
					req: req,
					res: res,
					un: un,
					tn: tn
				};

				msg.reply("Trade initiated. Other person should use `neko tradeaccept` to accept it.");
			}).bind()
		.command("tradeaccept")
			.help("Accept a pending nickname trade.")
			.on(function(msg, args) {
				if (active[msg.member.id]) {
					var trade = active[msg.member.id];

					trade.user.setNickname(trade.un.replace(trade.res, "") + trade.req);
					trade.target.setNickname(trade.tn.replace(trade.req, "") + trade.res);

					delete activeRef[trade.user.id];
					delete active[trade.target.id];
				} else {
					msg.reply("You don't have an active trade!");
				}
			}).bind()
		.command("tradecancel")
			.help("Cancel a pending nickname trade.")
			.on(function(msg, args) {
				if (active[msg.author.id]) {
					delete activeRef[active[msg.author.id].user.id];
					delete active[msg.author.id];

					msg.reply("Cancelled the trade.");
				} else if (activeRef[msg.author.id]) {
					delete active[activeRef[msg.author.id]];
					delete activeRef[msg.author.id];

					msg.reply("Cancelled the trade.");
				} else {
					msg.reply("You don't have an active trade!");
				}
			}).bind()
	}
}