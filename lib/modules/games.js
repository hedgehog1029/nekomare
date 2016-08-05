var request = require("request"),
	//emojiParser = require("emoji-parser"),
	values = require("object.values"),
	S = require("string");

var games = {
	"rps": {
		"ongoing": {},
		"challenge": {}
	},
	"trivia": {
		"ongoing": {}
	}
}

var spaghetti = {
	award: function(data, ch, p1, p2) {
		var p1p = data.guild(ch.guild_id).section("spaghetti").or(0).get(p1.id),
			p2p = data.guild(ch.guild_id).section("spaghetti").or(0).get(p2.id);

		if (p2p < 1) {
			p1p += 2;

			ch.sendMessage(p2.username + " didn't have enough spaghetti, but " + p1.mention + " now has " + p1p + " spaghetti. :spaghetti:");
		} else {
			p2p -= 5;
			p1p += 5;

			ch.sendMessage(p2.username + " loses 5 spaghetti.\n" + p1.username + " gains 5 spaghetti. :spaghetti:");
		}

		data.guild(ch.guild_id).section("spaghetti").write(p1.id, p1p).write(p2.id, p2p).commit();
	},
	give: function(data, ch, user, amount) {
		var up = data.guild(ch.guild_id).section("spaghetti").or(0).get(user.id);

		up += amount;

		data.guild(ch.guild_id).section("spaghetti").write(user.id, up).commit();
	},
	take: function(data, ch, user, amount) {
		var up = data.guild(ch.guild_id).section("spaghetti").or(0).get(user.id);

		if (up - amount < 0) up = 0;
		else up -= amount;

		data.guild(ch.guild_id).section("spaghetti").write(user.id, up).commit();
	},
	has: function(data, ch, user, amount) {
		var up = data.guild(ch.guild_id).section("spaghetti").or(0).get(user.id);

		if (amount > up) return false;
		else return true;
	}
}

function unassign(obj) {
	return Object.keys(obj).map(function(k) {
		return { key: k, val: obj[k] };
	});
}

function rps_update(game, data) {
	if (game.choices[game.challenger.id] && game.choices[game.victim.id]) {
		var cc = game.choices[game.challenger.id],
			vc = game.choices[game.victim.id];

		if (cc == vc) {
			game.channel.sendMessage("Both players picked `" + cc + "`! No winners!");

			delete games.rps.challenge[game.victim.id];
			delete games.rps.ongoing[game.challenger.id];
		} else if ((cc == "rock" && vc == "scissors") || (cc == "paper" && vc == "rock") || (cc == "scissors" && vc == "paper")) {
			game.channel.sendMessage(game.challenger.mention + " beat " + game.victim.mention + " with " + cc + " vs. " + vc + "!");

			spaghetti.award(data, game.channel, game.challenger, game.victim);

			delete games.rps.challenge[game.victim.id];
			delete games.rps.ongoing[game.challenger.id];
		} else {
			game.channel.sendMessage(game.victim.mention + " beat " + game.challenger.mention + " with " + vc + " vs. " + cc + "!");

			spaghetti.award(data, game.channel, game.victim, game.challenger);

			delete games.rps.challenge[game.victim.id];
			delete games.rps.ongoing[game.challenger.id];
		}
	}
}

var trivia = {
	getQuestion: function(cb) {
		request("http://jservice.io/api/random", function(err, res, body) {
			if (!err && res.statusCode == 200) {
				cb(JSON.parse(body)[0]);
			}
		});
	}
}

function hintify(str) {
	if (str.length == 1) return "_";

	return str.split("").map(function(c) {
		if (c == " ") return c;

		return (Math.random() < .5) ? c : "_";
	}).join("");
}

function trivia_update(c, data) {
	var game = games.trivia.ongoing[c.id];

	clearTimeout(game.current_timeout);
	game.round++;

	if (game.round >= (game.max_rounds + 1)) {
		c.sendMessage("And we're done! Calculating results...");

		var players = unassign(game.points).sort(function(a, b) {
			return b.val - a.val;
		}).slice(-3).map(function(p, i) {
			var user = c.guild.members.find(function(u) {
				return u.id == p.key;
			});

			if (!user) return null; // hopefully never happens

			var current = data.guild(c.guild_id).section("spaghetti").or(0).get(user.id);
			current += p.val;
			data.guild(c.guild_id).section("spaghetti").write(user.id, current).commit();

			return (i + 1) + ". " + user.username + " with " + p.val + " points!";
		});

		c.sendMessage("**The results are in!**\n" + players.join("\n") + "\nPlayers on the leaderboard have had their points converted to spaghetti.");

		delete games.trivia.ongoing[c.id];

		return;
	}

	trivia.getQuestion(function(q) {
		if (q.invalid_count) { // if the question is marked as invalid, try again
			game.round--;
			trivia_update(c, data);

			return;
		}

		q.answer = S(q.answer).stripTags().latinise().s;

		c.sendMessage(":question: Question: " + q.question);
		c.sendMessage(":exclamation: Hint: `" + hintify(q.answer) + "`");

		//console.log("Q answer: " + q.answer);

		game.current = q;
		game.current_timeout = setTimeout(function(c, data, current) {
			c.sendMessage("Time's up! The answer was `" + current.answer + "`.");

			trivia_update(c, data);
		}, 15000, c, data, game.current);
	});
}

function randomFrom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

function slot_check(data, msg, bet, count) {
	var vals = values(count);

	if (vals.indexOf(5) != -1) {
		if (count["spaghetti"] == 5) {
			msg.reply(":spaghetti: :spaghetti: SPAGHETTI JACKPOT! :spaghetti: :spaghetti: x25!");

			spaghetti.give(data, msg.channel, msg.author, (bet * 25));
		} else {
			msg.reply(":moneybag: JACKPOT! :moneybag: x10!");

			spaghetti.give(data, msg.channel, msg.author, (bet * 10));
		}
	} else if (vals.indexOf(3) != -1 && vals.indexOf(2) != -1) {
		msg.reply("Full House! x5!");

		spaghetti.give(data, msg.channel, msg.author, (bet * 5));
	} else if (vals.indexOf(4) != -1) {
		msg.reply("Four of a kind! x4!");

		spaghetti.give(data, msg.channel, msg.author, (bet * 4));
	} else if (vals.indexOf(3) != -1) {
		msg.reply("Three of a kind! Tripled your money!");

		spaghetti.give(data, msg.channel, msg.author, (bet * 3));
	} else if (vals.indexOf(2) != -1) {
		msg.reply("Two of a kind! x1.5!");

		spaghetti.give(data, msg.channel, msg.author, Math.round(bet * 1.5));
	} else {
		msg.reply("Too bad...");
	}
}

module.exports = {
	name: "games",
	init: function(cfg, cmd, data) {
		//emojiParser.init();

		cmd.on("MESSAGE_CREATE", function(e) {
			if (e.message.isPrivate) {
				var game = games.rps.ongoing[e.message.author.id];

				if (games.rps.challenge[e.message.author.id]) {
					var ouid = games.rps.challenge[e.message.author.id];

					game = games.rps.ongoing[ouid];
				}

				if (!game) return;

				if (e.message.content == "rock" || e.message.content == "paper" || e.message.content == "scissors") {
					game.choices[e.message.author.id] = e.message.content;

					e.message.reply("You chose " + e.message.content + "!");

					rps_update(game, data);
				} else e.message.reply("Choose either rock, paper or scissors.");
			} else {
				if (games.trivia.ongoing[e.message.channel.id]) {
					var game = games.trivia.ongoing[e.message.channel.id];

					if (!game.current) return;

					if (e.message.content.toUpperCase() == game.current.answer.toUpperCase()) {
						e.message.reply("You got it right!");

						if (!game.points[e.message.author.id]) game.points[e.message.author.id] = 0;

						game.points[e.message.author.id] += (game.current.value / 100);

						game.current = null; // prevent others answering the same

						trivia_update(e.message.channel, data);
					}
				}
			}
		});

		cmd
		.command("spaghetti")
			.help("Show how much spaghetti you have.")
			.alias("sp")
			.alias("points")
			.on(function(msg, args) {
				var points = data.guild(msg.guild).section("spaghetti").or(0).get(msg.author.id);

				msg.reply("You have " + points + " spaghetti. :spaghetti:");
			}).bind()
		.command("leaderboard")
			.help("Show the server leaderboard.")
			.alias("lb")
			.on(function(msg, args) {
				var board = data.guild(msg.guild).section("spaghetti").asObject();

				var pointsArr = [];

				for (uid in board) {
					var points = (board[uid]) ? board[uid] : 0;
					var user = msg.guild.members.find(function(u) {
						return u.id == uid;
					});

					if (user)
						pointsArr.push({ user: user, points: points });
				}

				pointsArr.sort(function(a, b) {
					return b.points - a.points;
				});

				var top = pointsArr.slice(-5).map(function(o, i) {
					return (i + 1) + ". " + o.user.username + " with " + o.points + " :spaghetti:";
				});

				msg.reply("Server leaderboard:\n" + top.join("\n"));
			}).bind()
		.command("rps")
			.help("Rock-Paper-Scissors gambling.")
			.sub("start")
				.alias("s")
				.help("Challenge someone to a game of rock-paper-scissors.")
				.usage("<user>")
				.demand(["user"])
				.on(function(msg, args) {
					if (games.rps.challenge[msg.author.id]) {
						msg.reply("You've already been challenged to a game! Accept or deny that one first.");
						return;
					}

					if (games.rps.ongoing[msg.author.id]) {
						msg.reply("You've already started a game!");
						return;
					}

					if (games.rps.challenge[args.get(0).o.id]) {
						msg.reply("That user has already been challenged! Wait for that game to finish.");
						return;
					}

					if (games.rps.ongoing[args.get(0).o.id]) {
						msg.reply("That user is already in a game! Wait for that game to finish.");
						return;
					}

					games.rps.challenge[args.get(0).o.id] = msg.author.id;
					games.rps.ongoing[msg.author.id] = { state: "challenge", choices: {}, challenger: msg.author, victim: args.get(0).o, channel: msg.channel };

					msg.reply("Challenged " + args.get(0).o.mention + " to a game of Rock-Paper-Scissors!\nUse `neko rps a` to accept.");
				}).bind()
			.sub("cancel")
				.alias("c")
				.help("Cancel a pending RPS challenge.")
				.on(function(msg, args) {
					if (games.rps.ongoing[msg.author.id]) {
						var game = games.rps.ongoing[msg.author.id];

						msg.reply("Cancelled the pending RPS challenge.");

						delete games.rps.challenge[game.victim.id];
						delete games.rps.ongoing[msg.author.id];
					} else msg.reply("You don't own a game!");
				}).bind()
			.sub("accept")
				.alias("a")
				.help("Join the game of rock-paper-scissors.")
				.on(function(msg, args) {
					var challenger = games.rps.challenge[msg.author.id];

					if (challenger) {
						if (!games.rps.ongoing[challenger]) {
							msg.reply("That challenge no longer exists. Perhaps it was cancelled.");

							delete games.rps.challenge[msg.author.id];
							return;
						}

						if (games.rps.ongoing[challenger].state != "challenge") {
							msg.reply("You already accepted that challenge!");
							return;
						}

						games.rps.ongoing[challenger].state = "game";

						msg.reply("You accepted the challenge! PM me your choice!");
					} else msg.reply("You haven't been challenged to a game! Use `neko rps start <user>` to start one!");
				}).bind()
			.sub("deny")
				.alias("d")
				.help("Deny a challenge to RPS.")
				.on(function(msg, args) {
					var challenger = games.rps.challenge[msg.author.id];

					if (challenger) {
						if (games.rps.ongoing[challenger].state != "challenge") {
							msg.reply("You're already in a game!");
							return;
						}

						msg.reply("Denied the challenge.");

						delete games.rps.ongoing[challenger];
						delete games.rps.challenge[msg.author.id];
					} else msg.reply("You haven't been challenged to a game! Use `neko rps start <user>` to start one!");
				}).bind()
			.bind()
		.command("trivia")
			.help("Jepoardy!")
			.sub("start")
				.alias("s")
				.help("Start a round of trivia in the current channel. Default 5 rounds.")
				.usage("[rounds]")
				.on(function(msg, args) {
					var rounds = (args.length() > 0) ? parseInt(args.get(0).o) : 5;

					if (games.trivia.ongoing[msg.channel.id]) {
						msg.reply("There's already a game of trivia in this channel!")
						return;
					}

					games.trivia.ongoing[msg.channel.id] = { owner: msg.author, max_rounds: rounds, round: 0, current: null, points: {} };

					trivia_update(msg.channel, data);

					msg.reply("Started a game of trivia in this channel!");
				}).bind()
			.sub("end")
				.alias("e")
				.help("End the current round of trivia after the next round. Can only be run by the owner of the game.")
				.on(function(msg, args) {
					var game = games.trivia.ongoing[msg.channel.id];

					if (!game) {
						msg.reply("There's no trivia game in this channel!");
						return;
					}

					if (game.owner.id == msg.author.id) {
						game.round = game.max_rounds;

						msg.reply("The game will end after this round.");
					} else msg.reply("You're not the owner of this game!");
				}).bind()
			.sub("skip")
				.help("Skip the current question.")
				.on(function(msg, args) {
					var game = games.trivia.ongoing[msg.channel.id];

					if (game) {
						msg.reply(":confounded: Skipped that question.");

						trivia_update(msg.channel, data);
					} else msg.reply("No game in this channel!");
				}).bind()
			.bind()
		.command("slots")
			.alias("gamble")
			.help("Play the slots! Specify how much spaghetti to spend.")
			.usage("<bet amount>")
			.demand(1)
			.on(function(msg, args) {
				//var list = emojiParser.list();
				var list = [
					"green_apple", "apple", "pear", "tangerine", "lemon", "banana", "watermelon", "grapes", "strawberry",
					"pineapple", "tomato", "eggplant", "cheese", "spaghetti"
				];

				var amount = args.get(0).o;

				if (!spaghetti.has(data, msg.channel, msg.author, amount)) {
					msg.reply("You don't have " + amount + " spaghetti to gamble with!");
					return;
				}

				spaghetti.take(data, msg.channel, msg.author, amount);

				var result = [];
				for (var i = 0; i < 5; i++) {
					result.push(randomFrom(list));
				}
				var emojiResult = result.map(function(res) {
					return ":" + res + ":";
				});

				msg.channel.sendMessage(":game_die: Are you feeling lucky? " + amount + " spent.\nResults: " + emojiResult.join(" "));

				var count = {};
				result.forEach(function(r1) {
					count[r1] = 0;

					result.forEach(function(rN) {
						if (r1 == rN) count[r1]++;
					});
				});

				slot_check(data, msg, amount, count);
				//msg.channel.sendMessage("```\nDEBUG:\n" + JSON.stringify(count) + "\n```");
			}).bind()
	}
}
