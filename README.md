# node-ts [![Build Status](https://travis-ci.com/nikeee/node-ts.svg?branch=master)](https://travis-ci.com/nikeee/node-ts) [![npm version](https://badge.fury.io/js/node-ts.svg)](http://badge.fury.io/js/node-ts) ![Dependency Status](https://david-dm.org/nikeee/node-ts.svg) ![License](https://img.shields.io/npm/l/node-ts.svg) ![Downloads Per Month](https://img.shields.io/npm/dm/node-ts.svg)

This is a CommonJS module which allows you to connect to any TeamSpeak® 3 server which has the Server Query API enabled. Using the Server Query API, you can do everything a normal TeamSpeak user can do (except sending and receiving voice data) automatically via JavaScript/TypeScript (e. g. listing clients logged in on the server).

The Server Query specification is available [here](http://media.teamspeak.com/ts3_literature/TeamSpeak%203%20Server%20Query%20Manual.pdf). I also created a script to import the complete query API from a TeamSpeak 3 server using the help command. This (json) dump will later be used to auto genrate some stuff. It is available as Gist [here](https://gist.github.com/nikeee/71e71439dd91999a3692).

This is a fork of [gwTumm's node-teamspeak](https://github.com/gwTumm/node-teamspeak) which has been ported from JS to TS.

## Install
```bash
npm install -S node-ts # install package
```

## Example Usage
After registering a Server Query account using your TeamSpeak Client, you can login using node-ts (Alternatively, you can login as the root account "`ServerAdmin`" which is created during the installation of the server). The following code prints out a JSON-array containing all clients that are currently connected to the first virtual server:

```TypeScript
import { TeamSpeakClient } from "node-ts";
// Node.js without ES Modules:
// const { TeamSpeakClient } = require("node-ts");

async function main() {
	const client = new TeamSpeakClient("server.example.com");

	try {
		await client.connect();

		await client.send("use", { sid: 1 });

		const me = await client.send("whoami");
		console.log(me);

		// Log in to use more features
		await client.send("login", {
			client_login_name: "##USERNAME##",
			client_login_password: "##PASSWORD##"
		});

		const clientList = await client.send("clientlist");
		console.log(clientList);

		await client.subscribePrivateTextEvents(); // Tell the server we want to receive private text events

		// Register a callback for these events
		client.on("textmessage", data => {
			console.log(`Message received: ${data.msg}`);
		});

	} catch (err) {
		console.error("An error occurred:")
		console.error(err);
	}
}
main();
```

## Usage information

* TeamSpeakClient.send is the main method that executes a command. An array with options and an object with parameters can be passed to the send-function. The function returns a `Promise`. See the TypeScript file for more information.
* Every TeamSpeakClient instance is an `EventEmitter`. You can install listeners to the `"close"` and `"error"` event. The error-event will only be fired if there was socket-error, not if a sent command failed.
* If you want to register to notifications sent by the TeamSpeak-Server, you can send a normal command `servernotifyregister` (consider specification). Any event sent by the server that starts with `"notify"` is then fired as an event (e. g. as soon as a `notifyclientmove` notification is sent by the server, the TeamSpeakClient-instance fires the `"clientmove"` event with only one parameter which is an object containing the given parameters).
