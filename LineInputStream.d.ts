/// <reference path="typings/node/node.d.ts" />
/**
* @autor Niklas Mollenhauer <holzig@outlook.com>
* @autor Philip Tellis <philip@bluesmoon.info>
* @todo May publish this as a new package on npmjs.
* @example
* // creates a new instance
* var lis = new LineInputStream(underlyingStream);
*/
import events = require("events");
import Stream = require("stream");
declare class LineInputStream extends Stream.Readable {
    public delimiter: string;
    public underlyingStream : Stream.Readable;
    public readable : boolean;
    private _underlyingStream;
    private _data;
    /**
    * @constructor
    */
    constructor(underlyingStream: Stream.Readable);
    /**
    * @constructor
    */
    constructor(underlyingStream: Stream.Readable, delimiter: string);
    private initializeEvents();
    /**
    * Start overriding EventEmitter methods so we can pass through to underlyingStream If we get a request for an event we don't know about, pass it to the underlyingStream
    */
    public on(type: string, listener: Function): events.EventEmitter;
    public addListener(type: string, listener: Function): events.EventEmitter;
    public removeListener(type: string, listener: Function): events.EventEmitter;
    public removeAllListeners(type: string): events.EventEmitter;
    public resume(): void;
    public pause(): void;
    public setEncoding(encoding: string): void;
}
export = LineInputStream;
