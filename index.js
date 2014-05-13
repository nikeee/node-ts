var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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

            if (_this._status < 0) {
                _this._status++;
                if (_this._status === 0)
                    _this.checkQueue();
                return;
            }

            var response;

            if (s.indexOf("error") === 0) {
                response = _this.parseResponse(s.substr("error ".length).trim());
                var res = response.shift();

                var currentError = {
                    id: res["id"] || 0,
                    msg: res["msg"] || ""
                };

                if (currentError.id !== 0) {
                    _this._executing.error = currentError;
                    _this._executing.error = null;
                } else {
                    currentError = null;
                }

                if (_this._executing.defer) {
                    var data = {
                        item: _this._executing,
                        error: _this._executing.error,
                        response: _this._executing.response,
                        rawResponse: _this._executing.rawResponse
                    };
                    if (data.error && data.error.id !== 0)
                        _this._executing.defer.reject(data);
                    else
                        _this._executing.defer.resolve(data);
                }

                _this._executing = null;
                _this.checkQueue();
            } else if (s.indexOf("notify") === 0) {
                s = s.substr("notify".length);
                response = _this.parseResponse(s);
                _this.emit(s.substr(0, s.indexOf(" ")), response);
            } else if (_this._executing) {
                response = _this.parseResponse(s);
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

        return response;
    };

    TeamSpeakClient.prototype.getPending = function () {
        return this._queue.slice(0);
    };

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
        r = r.replace(/\\/g, "\\\\");
        r = r.replace(/\//g, "\\/");
        r = r.replace(/\|/g, "\\p");
        r = r.replace(/\;/g, "\\;");
        r = r.replace(/\n/g, "\\n");

        r = r.replace(/\r/g, "\\r");
        r = r.replace(/\t/g, "\\t");
        r = r.replace(/\v/g, "\\v");
        r = r.replace(/\f/g, "\\f");
        r = r.replace(/ /g, "\\s");
        return r;
    };

    TeamSpeakClient.tsunescape = function (s) {
        var r = String(s);
        r = r.replace(/\\s/g, " ");
        r = r.replace(/\\p/g, "|");
        r = r.replace(/\\;/g, ";");
        r = r.replace(/\\n/g, "\n");

        r = r.replace(/\\f/g, "\f");
        r = r.replace(/\\r/g, "\r");
        r = r.replace(/\\t/g, "\t");
        r = r.replace(/\\v/g, "\v");
        r = r.replace(/\\\//g, "\/");
        r = r.replace(/\\\\/g, "\\");
        return r;
    };
    TeamSpeakClient.DefaultHost = "localhost";
    TeamSpeakClient.DefaultPort = 10011;
    return TeamSpeakClient;
})(events.EventEmitter);
exports.TeamSpeakClient = TeamSpeakClient;
