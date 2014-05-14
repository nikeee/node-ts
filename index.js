/**
* @autor Niklas Mollenhauer <holzig@outlook.com>
* @autor Tim Kluge <timklge@wh2.tu-dresden.de>
* @license Beerware/Pizzaware
*/
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="typings/q/Q.d.ts"/>
///<reference path="node_modules/line-readable-stream/LineReadableStream.d.ts"/>
var Q = require("q");
var net = require("net");
var LineReadableStream = require("./node_modules/line-readable-stream/LineReadableStream");
var events = require("events");
var util = require("util");

/**
* Client that can be used to connect to a TeamSpeak server query API.
* @todo unit tests
*/
var TeamSpeakClient = (function (_super) {
    __extends(TeamSpeakClient, _super);
    /**
    * Creates a new instance of TeamSpeakClient for a specific remote host:port.
    * @param {string = TeamSpeakClient.DefaultHost} host Remote host of the TeamSpeak server. Can be an IP address or a host name.
    * @param {number = TeamSpeakClient.DefaultPort} port TCP port of the server query instance of the remote host.
    * @constructor
    */
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
        /**
        * Gets the remote host passed to the constructor. Can be an IP address or a host name.
        * @return {string} Remote host of the TeamSpeak server. Can be an IP address or a host name.
        */
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

    /**
    * Gets called on an opened connection
    */
    TeamSpeakClient.prototype.onConnect = function () {
        var _this = this;
        this._reader = new LineReadableStream(this._socket);
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
            var response;

            if (s.indexOf("error") === 0) {
                response = _this.parseResponse(s.substr("error ".length).trim());
                var res = response.shift();

                var currentError = {
                    id: res["id"] || 0,
                    msg: res["msg"] || ""
                };

                if (currentError.id !== 0)
                    _this._executing.error = currentError;
                else
                    currentError = null;

                if (_this._executing.defer) {
                    //item: this._executing || null,
                    var e = _this._executing;
                    var data = {
                        cmd: e.cmd,
                        options: e.options || [],
                        text: e.text || null,
                        parameters: e.parameters || {},
                        error: e.error || null,
                        response: e.response || null,
                        rawResponse: e.rawResponse || null
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
        if (!cmd)
            return Q.reject("Empty command");

        var tosend = StringExtensions.tsEscape(cmd);
        options.forEach(function (v) {
            return tosend += " -" + StringExtensions.tsEscape(v);
        });
        for (var key in params) {
            var value = params[key];
            if (util.isArray(value)) {
                var vArray = value;

                // Multiple values for the same key - concatenate all
                var doptions = vArray.map(function (val) {
                    return StringExtensions.tsEscape(key) + "=" + StringExtensions.tsEscape(val);
                });
                tosend += " " + doptions.join("|");
            } else {
                tosend += " " + StringExtensions.tsEscape(key.toString()) + "=" + StringExtensions.tsEscape(value.toString());
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

    /**
    * Parses a query API response.
    */
    TeamSpeakClient.prototype.parseResponse = function (s) {
        var records = s.split("|");

        // Test this
        var response = records.map(function (currentItem) {
            var args = currentItem.split(" ");
            var thisrec = {};
            args.forEach(function (v) {
                if (v.indexOf("=") > -1) {
                    var key = StringExtensions.tsUnescape(v.substr(0, v.indexOf("=")));
                    var value = StringExtensions.tsUnescape(v.substr(v.indexOf("=") + 1));

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

    Object.defineProperty(TeamSpeakClient.prototype, "pending", {
        /**
        * Gets pending commands that are going to be sent to the server. Note that they have been parsed - Access pending[0].text to get the full text representation of the command.
        * @return {QueryCommand[]} Pending commands that are going to be sent to the server.
        */
        get: function () {
            return this._queue.slice(0);
        },
        enumerable: true,
        configurable: true
    });

    /**
    * Clears the queue of pending commands so that any command that is currently queued won't be executed.
    * @return {QueryCommand[]} Array of commands that have been removed from the queue.
    */
    TeamSpeakClient.prototype.clearPending = function () {
        var q = this._queue;
        this._queue = [];
        return q;
    };

    /**
    * Checks the current command queue and sends them if needed.
    */
    TeamSpeakClient.prototype.checkQueue = function () {
        if (!this._executing && this._queue.length >= 1) {
            this._executing = this._queue.shift();
            this._socket.write(this._executing.text + "\n");
        }
    };
    TeamSpeakClient.DefaultHost = "localhost";
    TeamSpeakClient.DefaultPort = 10011;
    return TeamSpeakClient;
})(events.EventEmitter);
exports.TeamSpeakClient = TeamSpeakClient;

var StringExtensions = (function () {
    function StringExtensions() {
    }
    /**
    * Escapes a string so it can be safely used for querying the api.
    * @param  {string} s The string to escape.
    * @return {string}   An escaped string.
    */
    StringExtensions.tsEscape = function (s) {
        var r = s;
        r = r.replace(/\\/g, "\\\\"); // Backslash
        r = r.replace(/\//g, "\\/"); // Slash
        r = r.replace(/\|/g, "\\p"); // Pipe
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

    /**
    * Unescapes a string so it can be used for processing the response of the api.
    * @param  {string} s The string to unescape.
    * @return {string}   An unescaped string.
    */
    StringExtensions.tsUnescape = function (s) {
        var r = s;
        r = r.replace(/\\s/g, " "); // Whitespace
        r = r.replace(/\\p/g, "|"); // Pipe
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
    return StringExtensions;
})();








/*
Enums imported from documentation.
*/
(function (YesNo) {
    YesNo[YesNo["No"] = 0] = "No";
    YesNo[YesNo["Yes"] = 1] = "Yes";
})(exports.YesNo || (exports.YesNo = {}));
var YesNo = exports.YesNo;

(function (HostMessageMode) {
    /**
    * 1: display message in chatlog
    */
    HostMessageMode[HostMessageMode["HostMessageMode_LOG"] = 1] = "HostMessageMode_LOG";

    /**
    * 2: display message in modal dialog
    */
    HostMessageMode[HostMessageMode["HostMessageMode_MODAL"] = 2] = "HostMessageMode_MODAL";

    /**
    * 3: display message in modal dialog and close connection
    */
    HostMessageMode[HostMessageMode["HostMessageMode_MODALQUIT"] = 3] = "HostMessageMode_MODALQUIT";
})(exports.HostMessageMode || (exports.HostMessageMode = {}));
var HostMessageMode = exports.HostMessageMode;

(function (HostBannerMode) {
    /**
    * 0: do not adjust
    */
    HostBannerMode[HostBannerMode["HostMessageMode_NOADJUST"] = 0] = "HostMessageMode_NOADJUST";

    /**
    * 1: adjust but ignore aspect ratio (like TeamSpeak 2)
    */
    HostBannerMode[HostBannerMode["HostMessageMode_IGNOREASPECT"] = 1] = "HostMessageMode_IGNOREASPECT";

    /**
    * 2: adjust and keep aspect ratio
    */
    HostBannerMode[HostBannerMode["HostMessageMode_KEEPASPECT"] = 2] = "HostMessageMode_KEEPASPECT";
})(exports.HostBannerMode || (exports.HostBannerMode = {}));
var HostBannerMode = exports.HostBannerMode;

(function (Codec) {
    /**
    * 0: speex narrowband (mono, 16bit, 8kHz)
    */
    Codec[Codec["CODEC_SPEEX_NARROWBAND"] = 0] = "CODEC_SPEEX_NARROWBAND";

    /**
    * 1: speex wideband (mono, 16bit, 16kHz)
    */
    Codec[Codec["CODEC_SPEEX_WIDEBAND"] = 1] = "CODEC_SPEEX_WIDEBAND";

    /**
    * 2: speex ultra-wideband (mono, 16bit, 32kHz)
    */
    Codec[Codec["CODEC_SPEEX_ULTRAWIDEBAND"] = 2] = "CODEC_SPEEX_ULTRAWIDEBAND";

    /**
    * 3: celt mono (mono, 16bit, 48kHz)
    */
    Codec[Codec["CODEC_CELT_MONO"] = 3] = "CODEC_CELT_MONO";
})(exports.Codec || (exports.Codec = {}));
var Codec = exports.Codec;

(function (CodecEncryptionMode) {
    /**
    * 0: configure per channel
    */
    CodecEncryptionMode[CodecEncryptionMode["CODEC_CRYPT_INDIVIDUAL"] = 0] = "CODEC_CRYPT_INDIVIDUAL";

    /**
    * 1: globally disabled
    */
    CodecEncryptionMode[CodecEncryptionMode["CODEC_CRYPT_DISABLED"] = 1] = "CODEC_CRYPT_DISABLED";

    /**
    * 2: globally enabled
    */
    CodecEncryptionMode[CodecEncryptionMode["CODEC_CRYPT_ENABLED"] = 2] = "CODEC_CRYPT_ENABLED";
})(exports.CodecEncryptionMode || (exports.CodecEncryptionMode = {}));
var CodecEncryptionMode = exports.CodecEncryptionMode;

(function (TextMessageTargetMode) {
    /**
    * 1: target is a client
    */
    TextMessageTargetMode[TextMessageTargetMode["TextMessageTarget_CLIENT"] = 1] = "TextMessageTarget_CLIENT";

    /**
    * 2: target is a channel
    */
    TextMessageTargetMode[TextMessageTargetMode["TextMessageTarget_CHANNEL"] = 2] = "TextMessageTarget_CHANNEL";

    /**
    * 3: target is a virtual server
    */
    TextMessageTargetMode[TextMessageTargetMode["TextMessageTarget_SERVER"] = 3] = "TextMessageTarget_SERVER";
})(exports.TextMessageTargetMode || (exports.TextMessageTargetMode = {}));
var TextMessageTargetMode = exports.TextMessageTargetMode;

(function (LogLevel) {
    /**
    * 1: everything that is really bad
    */
    LogLevel[LogLevel["LogLevel_ERROR"] = 1] = "LogLevel_ERROR";

    /**
    * 2: everything that might be bad
    */
    LogLevel[LogLevel["LogLevel_WARNING"] = 2] = "LogLevel_WARNING";

    /**
    * 3: output that might help find a problem
    */
    LogLevel[LogLevel["LogLevel_DEBUG"] = 3] = "LogLevel_DEBUG";

    /**
    * 4: informational output
    */
    LogLevel[LogLevel["LogLevel_INFO"] = 4] = "LogLevel_INFO";
})(exports.LogLevel || (exports.LogLevel = {}));
var LogLevel = exports.LogLevel;

(function (ReasonIdentifier) {
    /**
    * 4: kick client from channel
    */
    ReasonIdentifier[ReasonIdentifier["REASON_KICK_CHANNEL"] = 4] = "REASON_KICK_CHANNEL";

    /**
    * 5: kick client from server
    */
    ReasonIdentifier[ReasonIdentifier["REASON_KICK_SERVER"] = 5] = "REASON_KICK_SERVER";
})(exports.ReasonIdentifier || (exports.ReasonIdentifier = {}));
var ReasonIdentifier = exports.ReasonIdentifier;

(function (PermissionGroupDatabaseTypes) {
    /**
    * 0: template group (used for new virtual servers)
    */
    PermissionGroupDatabaseTypes[PermissionGroupDatabaseTypes["PermGroupDBTypeTemplate"] = 0] = "PermGroupDBTypeTemplate";

    /**
    * 1: regular group (used for regular clients)
    */
    PermissionGroupDatabaseTypes[PermissionGroupDatabaseTypes["PermGroupDBTypeRegular"] = 1] = "PermGroupDBTypeRegular";

    /**
    * 2: global query group (used for ServerQuery clients)
    */
    PermissionGroupDatabaseTypes[PermissionGroupDatabaseTypes["PermGroupDBTypeQuery"] = 2] = "PermGroupDBTypeQuery";
})(exports.PermissionGroupDatabaseTypes || (exports.PermissionGroupDatabaseTypes = {}));
var PermissionGroupDatabaseTypes = exports.PermissionGroupDatabaseTypes;

(function (PermissionGroupTypes) {
    /**
    * 0: server group permission
    */
    PermissionGroupTypes[PermissionGroupTypes["PermGroupTypeServerGroup"] = 0] = "PermGroupTypeServerGroup";

    /**
    * 1: client specific permission
    */
    PermissionGroupTypes[PermissionGroupTypes["PermGroupTypeGlobalClient"] = 1] = "PermGroupTypeGlobalClient";

    /**
    * 2: channel specific permission
    */
    PermissionGroupTypes[PermissionGroupTypes["PermGroupTypeChannel"] = 2] = "PermGroupTypeChannel";

    /**
    * 3: channel group permission
    */
    PermissionGroupTypes[PermissionGroupTypes["PermGroupTypeChannelGroup"] = 3] = "PermGroupTypeChannelGroup";

    /**
    * 4: channel-client specific permission
    */
    PermissionGroupTypes[PermissionGroupTypes["PermGroupTypeChannelClient"] = 4] = "PermGroupTypeChannelClient";
})(exports.PermissionGroupTypes || (exports.PermissionGroupTypes = {}));
var PermissionGroupTypes = exports.PermissionGroupTypes;

(function (TokenType) {
    /**
    * 0: server group token (id1={groupID} id2=0)
    */
    TokenType[TokenType["TokenServerGroup"] = 0] = "TokenServerGroup";

    /**
    * 1: channel group token (id1={groupID} id2={channelID})
    */
    TokenType[TokenType["TokenChannelGroup"] = 1] = "TokenChannelGroup";
})(exports.TokenType || (exports.TokenType = {}));
var TokenType = exports.TokenType;
