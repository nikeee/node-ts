var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Stream = require("stream");

var _events = {
    "line": function (line) {
        this.emit("line", line);
    },
    "end": function () {
        this.emit("end");
    }
};

var LineInputStream = (function (_super) {
    __extends(LineInputStream, _super);
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
            lines.forEach(_events.line, _this);
        });
        this.underlyingStream.on("end", function () {
            if (_this._data.length > 0) {
                var lines = _this._data.split(_this.delimiter);
                lines.forEach(_events.line, _this);
            }
            _events.end.call(_this);
        });
    };

    LineInputStream.prototype.on = function (type, listener) {
        if (!(type in _events))
            this._underlyingStream.on(type, listener);
        return _super.prototype.on.call(this, type, listener);
    };
    LineInputStream.prototype.addListener = function (type, listener) {
        return this.on(type, listener);
    };

    LineInputStream.prototype.removeListener = function (type, listener) {
        if (!(type in _events))
            this._underlyingStream.removeListener(type, listener);
        return _super.prototype.removeListener.call(this, type, listener);
    };
    LineInputStream.prototype.removeAllListeners = function (type) {
        if (!(type in _events))
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

    LineInputStream.prototype.setEncoding = function (encoding) {
        if (this._underlyingStream.setEncoding)
            this._underlyingStream.setEncoding(encoding);
    };
    return LineInputStream;
})(Stream.Readable);

module.exports = LineInputStream;
