/// <reference path="typings/node/node.d.ts" />
import events = require("events");
import Stream = require("stream");
declare class LineInputStream extends Stream.Readable {
    public delimiter: string;
    public underlyingStream : Stream.Readable;
    public readable : boolean;
    private _underlyingStream;
    private _data;
    constructor(underlyingStream: Stream.Readable);
    constructor(underlyingStream: Stream.Readable, delimiter: string);
    private initializeEvents();
    public on(type: string, listener: Function): events.EventEmitter;
    public addListener(type: string, listener: Function): events.EventEmitter;
    public removeListener(type: string, listener: Function): events.EventEmitter;
    public removeAllListeners(type: string): events.EventEmitter;
    public resume(): void;
    public pause(): void;
    public setEncoding(encoding: string): void;
}
export = LineInputStream;
