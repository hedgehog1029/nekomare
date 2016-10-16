var SubPages = {};

SubPages.docs = {
	"controller": function() {
		return {
			docs: m.request({ method: "GET", url: "/neko/docs", deserialize: function(value) { return value; } })
		}
	},
	"view": function(ctrl) {
		return m("div.docs", m.trust(ctrl.docs()));
	}
}

var NekoComponent = {
	"controller": function() {
		return {
			docs: m.request({ method: "GET", url: "/neko/docs", deserialize: function(value) { return value; } })
		}
	},
	"view": function(ctrl) {
		return m("div.container", [
			m("div.row", [
				m("div.twelve.columns", [
					m("div.header.u-full-width", [
						m("img.profile", { src: "img/profile.jpg" }),
						m("h1", "Nekomare"),
						m("p", "A general-purpose Discord bot."),
						m("a.button.button-primary", { href: "/discord/join" }, "Get Nekomare"),
						m("a.button.button-primary", { href: "https:\/\/discord.gg/eRe4Uqg", style: "margin-left:10px;" }, "Foam Robot Discord")
					]),
					m("div.docs", [
						m.trust(ctrl.docs())
					])
				])
			])
		])
	}
}

window.addEventListener("load", function() {
	m.route.mode = "hash";
	m.route(document.body, "/home", {
		"/:page": NekoComponent
	})
})
