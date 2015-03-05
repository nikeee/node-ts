node-ts
==============

This is a CommonJS-module implemented using [TypeScript](http://typescriptlang.org) which allows you to connect to any TeamSpeak® 3 server which has the Server Query API enabled. Using the Server Query API, you can do everything a normal TeamSpeak-user can do (except sending and receiving voice data) automatically via JavaScript/TypeScript (e. g. listing clients logged in on the server).

The Server Query specification is available [here](http://media.teamspeak.com/ts3_literature/TeamSpeak%203%20Server%20Query%20Manual.pdf). I also created a script to import the complete query API from a TeamSpeak 3 server using the help command. This (json) dump will later be used to auto-genrate some stuff. It is available as Gist [here](https://gist.github.com/nikeee/71e71439dd91999a3692).

This is a fork of [gwTumm's node-teamspeak](https://github.com/gwTumm/node-teamspeak) which has been ported from JS to TS.

How to install
---------------
```bash
# install package
npm install node-ts
```
If you are using TypeScript, you also have to install the definitions for `node` and `Q`.
```bash
tsd query node --action install
tsd query q --action install
```
(you need [tsd](http://definitelytyped.org/tsd))
	
Example Usage
----------------

After registering a Server Query account using your TeamSpeak-Client, you
can login using node-ts (Alternatively, you can login as the root
account "ServerAdmin" which is created during the installation of the 
server). The following code prints out a JSON-array containing all
 clients that are currently connected to the first virtual server:

```JavaScript
var ts3 = require("node-ts");
var util = require("util"); // Include node utils

var cl = new ts3.TeamSpeakClient("##SERVER##"); // create a new client

cl.send("login", {
		client_login_name: "##USERNAME##",
		client_login_password: "##PASSWORD##"
	})
	.then(function(_) {
		return cl.send("use", {sid: 1})
	})
	.then(function(_) {
		return cl.send("clientlist", {}, [])
	})
	.then(function(response) {
		console.log(util.inspect(response));
	})
	.fail(function(err) {
		console.log("An error occurred." + util.inspect(err))
	});
```

TypeScript sample:

```TypeScript
///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/q/Q.d.ts"/>
///<reference path="./node_modules/node-ts/dist/node-ts.d.ts"/>
// you can also copy the node-ts.d.ts to a subdirectory of your typings folder

import ts3 = require("node-ts");
import util = require("util"); // Include node utils

var cl = new ts3.TeamSpeakClient("##SERVER##"); // create a new client

cl.send("login", {
		client_login_name: "##USERNAME##",
		client_login_password: "##PASSWORD##"
	})
	.then(_ => cl.send("use", { sid: 1 }))
	.then(_ => cl.send("clientlist", {}, []))
	.then(response => console.log(util.inspect(response)))
	.fail(err => console.log("An error occurred: " + util.inspect(err)));
```

Usage information
-----------------

* TeamSpeakClient.send is the main method that executes a command. An array
with options and an object with parameters can be passed to the send-function.
The functioon returns a Q promise. See the TypeScript file for more information.
* Every TeamSpeakClient-instance is an EventEmitter. You can install
listeners to the "connect", "close" and the "error"-event. The error-event
will only be fired if there was socket-error, not if a sent command failed.
* If you want to register to notifications sent by the TeamSpeak-Server,
you can send a normal command "servernotifyregister" (consider specification).
Any event sent by the server that starts with "notify" is then fired as
an event (e. g. as soon as a "notifyclientmove"-notification is sent by the server,
the TeamSpeakClient-instance fires the "clientmove"-event with only
one parameter which is an object containing the given parameters). 
