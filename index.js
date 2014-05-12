/*
* ----------------------------------------------------------------------------
* "THE BEER-WARE LICENSE" (Revision 42):
* <timklge@wh2.tu-dresden.de> wrote this file. As long as you retain this notice you
* can do whatever you want with this stuff. If we meet some day, and you think
* this stuff is worth it, you can buy me a beer in return - Tim Kluge
* ----------------------------------------------------------------------------
*/
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*
* Niklas Mollenhauer <nikeee@outlook.com> ported this class to TypeScript.
*/
///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/q/Q.d.ts"/>
///<reference path="LineInputStream.ts"/>
var Q = require("q");
var net = require("net");
var LineInputStream = require("./LineInputStream");
var events = require("events");
var util = require("util");

var TeamSpeakClient = (function (_super) {
    __extends(TeamSpeakClient, _super);
    function TeamSpeakClient(host, port) {
        if (typeof host === "undefined") { host = TeamSpeakClient.DefaultHost; }
        if (typeof port === "undefined") { port = TeamSpeakClient.DefaultPort; }
        _super.call(this);
        this._queue = null;

        this._host = host;
        this._port = port;
        this._queue = [];
        this._status = -2;

        this.initializeConnection();
    }
    Object.defineProperty(TeamSpeakClient.prototype, "host", {
        get: function () {
            return this._host;
        },
        enumerable: true,
        configurable: true
    });

    TeamSpeakClient.prototype.initializeConnection = function () {
        var _this = this;
        this._socket = net.connect(this._port, this._host);
        this._socket.on("error", function (err) {
            return _this.emit("error", err);
        });
        this._socket.on("close", function () {
            return _this.emit("close", _this._queue);
        });
        this._socket.on("connect", function () {
            return _this.onConnect();
        });
    };

    TeamSpeakClient.prototype.onConnect = function () {
        var _this = this;
        this._reader = new LineInputStream(this._socket);
        this._reader.on("line", function (line) {
            var s = line.trim();

            // Ignore two first lines sent by server ("TS3" and information message)
            if (_this._status < 0) {
                _this._status++;
                if (_this._status === 0)
                    _this.checkQueue();
                return;
            }

            // Server answers with:
            // [- One line containing the answer ]
            // - "error id=XX msg=YY". ID is zero if command was executed successfully.
            if (s.indexOf("error") === 0) {
                var response = _this.parseResponse(s.substr("error ".length).trim());
                _this._executing.error = response.shift();

                if (_this._executing.error.id === "0")
                    delete _this._executing.error;

                if (_this._executing.defer) {
                    var data = {
                        item: _this._executing,
                        error: _this._executing.error,
                        response: _this._executing.response,
                        rawResponse: _this._executing.rawResponse
                    };
                    if (data.error && data.error.id !== "0")
                        _this._executing.defer.reject(data);
                    else
                        _this._executing.defer.resolve(data);
                }

                _this._executing = null;
                _this.checkQueue();
            } else if (s.indexOf("notify") === 0) {
                s = s.substr("notify".length);
                var response = _this.parseResponse(s);
                _this.emit(s.substr(0, s.indexOf(" ")), response);
            } else if (_this._executing) {
                var response = _this.parseResponse(s);
                _this._executing.rawResponse = s;
                _this._executing.response = response;
            }
        });
        this.emit("connect");
    };

    TeamSpeakClient.prototype.send = function (cmd, params, options) {
        if (typeof params === "undefined") { params = {}; }
        if (typeof options === "undefined") { options = []; }
        var tosend = TeamSpeakClient.tsescape(cmd);
        options.forEach(function (v) {
            return tosend += " -" + TeamSpeakClient.tsescape(v);
        });
        for (var k in params) {
            var v = params[k];
            if (util.isArray(v)) {
                // Multiple values for the same key - concatenate all
                var doptions = v.map(function (val) {
                    return TeamSpeakClient.tsescape(k) + "=" + TeamSpeakClient.tsescape(val);
                });
                tosend += " " + doptions.join("|");
            } else {
                tosend += " " + TeamSpeakClient.tsescape(k.toString()) + "=" + TeamSpeakClient.tsescape(v.toString());
            }
        }

        var d = Q.defer();

        this._queue.push({
            cmd: cmd,
            options: options,
            parameters: params,
            text: tosend,
            defer: d
        });

        if (this._status === 0)
            this.checkQueue();

        return d.promise;
    };

    TeamSpeakClient.prototype.parseResponse = function (s) {
        var records = s.split("|");

        // Test this
        var response = records.map(function (currentItem) {
            var args = currentItem.split(" ");
            var thisrec = {};
            args.forEach(function (v) {
                if (v.indexOf("=") > -1) {
                    var key = TeamSpeakClient.tsunescape(v.substr(0, v.indexOf("=")));
                    var value = TeamSpeakClient.tsunescape(v.substr(v.indexOf("=") + 1));

                    if (parseInt(value, 10).toString() == value)
                        thisrec[key] = parseInt(value, 10);
                    else
                        thisrec[key] = value;
                } else
                    thisrec[v] = "";
            });
            return thisrec;
        });

        if (response.length === 0)
            return null;

        //if (response.length === 1)
        //    response = response.shift();
        return response;
    };

    /* Return pending commands that are going to be sent to the server.
    * Note that they have been parsed - Access getPending()[0].text to get
    * the full text representation of the command.
    */
    TeamSpeakClient.prototype.getPending = function () {
        return this._queue.slice(0);
    };

    /* Clear the queue of pending commands so that any command that is currently queued won't be executed.
    * The old queue is returned.
    */
    TeamSpeakClient.prototype.clearPending = function () {
        var q = this._queue;
        this._queue = [];
        return q;
    };

    TeamSpeakClient.prototype.checkQueue = function () {
        if (!this._executing && this._queue.length >= 1) {
            this._executing = this._queue.shift();
            this._socket.write(this._executing.text + "\n");
        }
    };

    TeamSpeakClient.tsescape = function (s) {
        var r = String(s);
        r = r.replace(/\\/g, "\\\\"); // Backslash
        r = r.replace(/\//g, "\\/"); // Slash
        r = r.replace(/\|/g, "\\p"); // Pipe
        r = r.replace(/\;/g, "\\;"); // Semicolon
        r = r.replace(/\n/g, "\\n"); // Newline

        //r = r.replace(/\b/g, "\\b");    // Info: Backspace fails
        //r = r.replace(/\a/g, "\\a");    // Info: Bell fails
        r = r.replace(/\r/g, "\\r"); // Carriage Return
        r = r.replace(/\t/g, "\\t"); // Tab
        r = r.replace(/\v/g, "\\v"); // Vertical Tab
        r = r.replace(/\f/g, "\\f"); // Formfeed
        r = r.replace(/ /g, "\\s"); // Whitespace
        return r;
    };

    TeamSpeakClient.tsunescape = function (s) {
        var r = String(s);
        r = r.replace(/\\s/g, " "); // Whitespace
        r = r.replace(/\\p/g, "|"); // Pipe
        r = r.replace(/\\;/g, ";"); // Semicolon
        r = r.replace(/\\n/g, "\n"); // Newline

        //r = r.replace(/\\b/g,  "\b");   // Info: Backspace fails
        //r = r.replace(/\\a/g,  "\a");   // Info: Bell fails
        r = r.replace(/\\f/g, "\f"); // Formfeed
        r = r.replace(/\\r/g, "\r"); // Carriage Return
        r = r.replace(/\\t/g, "\t"); // Tab
        r = r.replace(/\\v/g, "\v"); // Vertical Tab
        r = r.replace(/\\\//g, "\/"); // Slash
        r = r.replace(/\\\\/g, "\\"); // Backslash
        return r;
    };
    TeamSpeakClient.DefaultHost = "localhost";
    TeamSpeakClient.DefaultPort = 10011;
    return TeamSpeakClient;
})(events.EventEmitter);
exports.TeamSpeakClient = TeamSpeakClient;
//module.exports = TeamSpeakClient;
