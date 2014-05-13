///<reference path="typings/node/node.d.ts"/>

// This is a TypeScript port of bluesmoon's line-input-stream
// Project site: https://github.com/bluesmoon/node-line-input-stream

/**
 * @autor Niklas Mollenhauer <holzig@outlook.com>
 * @autor Tim Kluge <timklge@wh2.tu-dresden.de>
 * @todo May publish this as a new package on npmjs.
 * @example
 * // creates a new instance
 * var lis = new LineInputStream(underlyingStream);
 */

import events = require("events");
import Stream = require("stream");
import util = require("util");

var _events = {
    "line": function (line)
    {
        this.emit("line", line);
    },
    "end": function ()
    {
        this.emit("end");
    }
};

class LineInputStream extends Stream.Readable
{
    public get underlyingStream(): Stream.Readable  
    {
        return this._underlyingStream;
    }

    public get readable(): boolean
    {
        return this._underlyingStream.readable;
    }

    /*
    // Does not seem to be available on Stream.Readable
    public get paused(): boolean
    {
        return this._underlyingStream.paused;
    }
    */

    private _underlyingStream: Stream.Readable;
    private _data: string;

    /**
     * @constructor
     */
    constructor(underlyingStream: Stream.Readable);
    /**
     * @constructor
     */
    constructor(underlyingStream: Stream.Readable, delimiter: string);
    /**
     * @constructor
     */
    constructor(underlyingStream: Stream.Readable, public delimiter: string = "\n")
    {
        super();
        if (!underlyingStream)
            throw new Error("LineInputStream requires an underlying stream");

        this._underlyingStream = underlyingStream;
        this._data = "";

        this.initializeEvents();
    }

    private initializeEvents(): void
    {
        this._underlyingStream.on("data", chunk =>
        {
            this._data += chunk;
            var lines = this._data.split(this.delimiter);
            this._data = lines.pop();
            lines.forEach(_events.line, this);
        });
        this.underlyingStream.on("end", () =>
        {
            if (this._data.length > 0)
            {
                var lines = this._data.split(this.delimiter);
                lines.forEach(_events.line, this);
            }
            _events.end.call(this);
        });
    }

    /**
     * Start overriding EventEmitter methods so we can pass through to underlyingStream If we get a request for an event we don't know about, pass it to the underlyingStream
     */
    public on(type: string, listener: Function): events.EventEmitter
    {
        if (!(type in _events))
            this._underlyingStream.on(type, listener);
        return super.on(type, listener);
    }
    public addListener(type: string, listener: Function): events.EventEmitter
    {
        return this.on(type, listener);
    }

    public removeListener(type: string, listener: Function): events.EventEmitter
    {
        if (!(type in _events))
            this._underlyingStream.removeListener(type, listener);
        return super.removeListener(type, listener);
    }
    public removeAllListeners(type: string): events.EventEmitter
    {
        if (!(type in _events))
            this._underlyingStream.removeAllListeners(type);
        return super.removeAllListeners(type);
    }

    public resume(): void
    {
        if (this._underlyingStream.resume)
            this._underlyingStream.resume();
    }

    public pause(): void
    {
        if (this._underlyingStream.pause)
            this._underlyingStream.pause();
    }

    /*
    // Does not seem to be available on Stream.Readable
    public destroy(): void
    {
        if (this._underlyingStream.destroy)
            this._underlyingStream.destroy();
    }
    */

    public setEncoding(encoding: string): void
    {
        if (this._underlyingStream.setEncoding)
            this._underlyingStream.setEncoding(encoding);
    }
}

export = LineInputStream;
