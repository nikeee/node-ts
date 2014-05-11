///<reference path="typings/node/node.d.ts"/>

import Stream = require("stream");

declare class LineInputStreamClass 
{
    // public get readable(): boolean;
    // public get paused(): boolean;

    public readable: boolean;
    public paused: boolean;

    constructor(underlyingStream: Stream, delimiter?: string);

    public on(type: any, listener: any): void;
    public addListener(type: any, listener: any): void;

    public removeListener(type: any, listener: any): void;
    public removeAllListeners(type: any): void;
    public resume(): void;
    public pause(): void;
    public destroy(): void;
    public setEncoding(encoding: string): void;
    public setDelimiter(delimiter: string): void;
}

declare function LineInputStream(underlyingStream: Stream, delimiter?: string): LineInputStreamClass;

export = LineInputStream;