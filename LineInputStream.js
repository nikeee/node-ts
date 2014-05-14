///<reference path="typings/node/node.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Stream = require("stream");

var LineInputStream = (function (_super) {
    __extends(LineInputStream, _super);
    /**
    * @constructor
    */
    function LineInputStream(underlyingStream, delimiter) {
        if (typeof delimiter === "undefined") { delimiter = "\n"; }
        _super.call(this);
        this.delimiter = delimiter;
        if (!underlyingStream)
            throw new Error("LineInputStream requires an underlying stream");

        this._underlyingStream = underlyingStream;
        this._data = "";

        this.initializeEvents();
    }
    Object.defineProperty(LineInputStream.prototype, "underlyingStream", {
        get: function () {
            return this._underlyingStream;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(LineInputStream.prototype, "readable", {
        get: function () {
            return this._underlyingStream.readable;
        },
        enumerable: true,
        configurable: true
    });

    LineInputStream.prototype.initializeEvents = function () {
        var _this = this;
        this._underlyingStream.on("data", function (chunk) {
            _this._data += chunk;
            var lines = _this._data.split(_this.delimiter);
            _this._data = lines.pop();
            lines.forEach(function (line) {
                return _this.emit("line", line);
            });
        });
        this.underlyingStream.on("end", function () {
            if (_this._data.length > 0) {
                var lines = _this._data.split(_this.delimiter);
                lines.forEach(function (line) {
                    return _this.emit("line", line);
                });
            }
            _this.emit("end");
        });
    };

    /**
    * Start overriding EventEmitter methods so we can pass through to underlyingStream If we get a request for an event we don't know about, pass it to the underlyingStream
    */
    LineInputStream.prototype.on = function (type, listener) {
        if (type != "end" && type != "line")
            this._underlyingStream.on(type, listener);
        return _super.prototype.on.call(this, type, listener);
    };
    LineInputStream.prototype.addListener = function (type, listener) {
        return this.on(type, listener);
    };

    LineInputStream.prototype.removeListener = function (type, listener) {
        if (type != "end" && type != "line")
            this._underlyingStream.removeListener(type, listener);
        return _super.prototype.removeListener.call(this, type, listener);
    };
    LineInputStream.prototype.removeAllListeners = function (type) {
        if (type != "end" && type != "line")
            this._underlyingStream.removeAllListeners(type);
        return _super.prototype.removeAllListeners.call(this, type);
    };

    LineInputStream.prototype.resume = function () {
        if (this._underlyingStream.resume)
            this._underlyingStream.resume();
    };

    LineInputStream.prototype.pause = function () {
        if (this._underlyingStream.pause)
            this._underlyingStream.pause();
    };

    /*
    // Does not seem to be available on Stream.Readable
    public destroy(): void
    {
    if (this._underlyingStream.destroy)
    this._underlyingStream.destroy();
    }
    */
    LineInputStream.prototype.setEncoding = function (encoding) {
        if (this._underlyingStream.setEncoding)
            this._underlyingStream.setEncoding(encoding);
    };
    return LineInputStream;
})(Stream.Readable);

module.exports = LineInputStream;
