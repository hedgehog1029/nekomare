# nekomare
A general-purpose Discord bot.

Docs can be found [on the website](http://neko.offbeatwit.ch)!

## Running your own Nekomare

Currently I don't include baseline config and data file that the bot needs to run. However, you can create them easily.

Create a folder called `config` and place a `config.hjson` file inside it.
In this file, place the following, and fill in the required data:
```hjson
# Bot data
bot: {
	token: "[YOUR TOKEN]",
	devtoken: "[ALTERNATIVE DEV TOKEN]",
	devmode: false
}

modules: {
	greeter: {
		default: "Hi, %user%! Welcome to %guild%!"
	}
}

# prefix: the prefix the bot should respond to
# ownerid: the id of the bot owner
dispatcher: {
	prefix: "neko",
	ownerid: "[your Discord userid]"
}
```
(You can use the same token for devtoken, or even an empty string as long as devmode is false)

Next, create a `data` folder, with the `data.json` file inside it. In this file, just place "`{}`" to ensure the JSON is valid.

Once that's done, you can:

```
npm install
node index.js
```

That will install all dependencies and start the bot.
