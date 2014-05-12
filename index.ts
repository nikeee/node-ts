/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <timklge@wh2.tu-dresden.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return - Tim Kluge
 * ----------------------------------------------------------------------------
 */

/*
 * Niklas Mollenhauer <nikeee@outlook.com> ported this class to TypeScript.
 */

///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/q/Q.d.ts"/>
///<reference path="LineInputStream.ts"/>

import Q = require("q");
import net = require("net");
import LineInputStream = require("LineInputStream");
import events = require("events");
import util = require("util");

export class TeamSpeakClient extends events.EventEmitter
{
    public get host(): string
    {
        return this._host;
    }

    private _host: string;
    private _port: number;

    private _queue: QueueItem[] = null;
    private _status: number;
    private _executing: QueueItem;

    private _socket: net.Socket;
    private _reader: LineInputStream;

    private static DefaultHost = "localhost";
    private static DefaultPort = 10011;

    constructor();
    constructor(host: string);
    constructor(host: string = TeamSpeakClient.DefaultHost, port: number = TeamSpeakClient.DefaultPort)
    {
        super();

        this._host = host;
        this._port = port;
        this._queue = [];
        this._status = -2;

        this.initializeConnection();
    }

    private initializeConnection()
    {
        this._socket = net.connect(this._port, this._host);
        this._socket.on("error", err => this.emit("error", err));
        this._socket.on("close", () => this.emit("close", this._queue));
        this._socket.on("connect", () => this.onConnect());
    }

    private onConnect(): void
    {
        this._reader = new LineInputStream(this._socket);
        this._reader.on("line", line =>
        {
            var s = line.trim();
            // Ignore two first lines sent by server ("TS3" and information message) 
            if (this._status < 0)
            {
                this._status++;
                if (this._status === 0)
                    this.checkQueue();
                return;
            }
            // Server answers with:
            // [- One line containing the answer ]
            // - "error id=XX msg=YY". ID is zero if command was executed successfully.
            if (s.indexOf("error") === 0)
            {
                var response = this.parseResponse(s.substr("error ".length).trim());
                this._executing.error = <QueryError>response.shift();

                if (this._executing.error.id === "0")
                    delete this._executing.error;

                if (this._executing.defer)
                {
                    var data: CallbackData = {
                        item: this._executing,
                        error: this._executing.error,
                        response: this._executing.response,
                        rawResponse: this._executing.rawResponse
                    };
                    if (data.error && data.error.id !== "0")
                        this._executing.defer.reject(<ErrorCallbackData>data);
                    else
                        this._executing.defer.resolve(<CallbackData>data);
                }

                this._executing = null;
                this.checkQueue();
            }
            else if (s.indexOf("notify") === 0)
            {
                s = s.substr("notify".length);
                var response = this.parseResponse(s);
                this.emit(s.substr(0, s.indexOf(" ")), response);
            }
            else if (this._executing)
            {
                var response = this.parseResponse(s);
                this._executing.rawResponse = s;
                this._executing.response = response;
            }
        });
        this.emit("connect");
    }

    /*
    * Send a command to the server
    */
    public send(cmd: string): Q.Promise<CallbackData>;
    public send(cmd: string, params: IAssoc<Object>): Q.Promise<CallbackData>;
    public send(cmd: string, params: IAssoc<Object>, options: string[]): Q.Promise<CallbackData>;
    public send(cmd: string, params: IAssoc<Object> = {}, options: string[]= []): Q.Promise<CallbackData>
    {
        var tosend = TeamSpeakClient.tsescape(cmd);
        options.forEach(v => tosend += " -" + TeamSpeakClient.tsescape(v));
        for (var k in params)
        {
            var v = params[k];
            if (util.isArray(v))
            {
                // Multiple values for the same key - concatenate all
                var doptions = (<Array<string>>v).map<string>(val =>
                {
                    return TeamSpeakClient.tsescape(k) + "=" + TeamSpeakClient.tsescape(val);
                });
                tosend += " " + doptions.join("|");
            }
            else
            {
                tosend += " " + TeamSpeakClient.tsescape(k.toString()) + "=" + TeamSpeakClient.tsescape(v.toString());
            }
        }

        var d = Q.defer<CallbackData>();

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
    }

    private parseResponse(s: string): QueryResponseItem[]
    {
        var records = s.split("|");

        // Test this

        var response = records.map<QueryResponseItem>(currentItem =>
        {
            var args = currentItem.split(" ");
            var thisrec: QueryResponseItem = {};
            args.forEach(v =>
            {
                if (v.indexOf("=") > -1)
                {
                    var key = TeamSpeakClient.tsunescape(v.substr(0, v.indexOf("=")));
                    var value = TeamSpeakClient.tsunescape(v.substr(v.indexOf("=") + 1));

                    if (parseInt(value, 10).toString() == value)
                        thisrec[key] = parseInt(value, 10);
                    else
                        thisrec[key] = value;
                }
                else
                    thisrec[v] = "";
            });
            return thisrec;
        });

        if (response.length === 0)
            return null;

        //if (response.length === 1)
        //    response = response.shift();
        return response;
    }

    /* Return pending commands that are going to be sent to the server.
    * Note that they have been parsed - Access getPending()[0].text to get
    * the full text representation of the command.
    */
    public getPending(): QueueItem[]
    {
        return this._queue.slice(0);
    }

    /* Clear the queue of pending commands so that any command that is currently queued won't be executed.
    * The old queue is returned.
    */
    public clearPending(): QueueItem[]
    {
        var q = this._queue;
        this._queue = [];
        return q;
    }

    private checkQueue(): void
    {
        if (!this._executing && this._queue.length >= 1)
        {
            this._executing = this._queue.shift();
            this._socket.write(this._executing.text + "\n");
        }
    }

    private static tsescape(s: string): string
    {
        var r = String(s);
        r = r.replace(/\\/g, "\\\\");   // Backslash
        r = r.replace(/\//g, "\\/");    // Slash
        r = r.replace(/\|/g, "\\p");    // Pipe
        r = r.replace(/\;/g, "\\;");    // Semicolon
        r = r.replace(/\n/g, "\\n");    // Newline
        //r = r.replace(/\b/g, "\\b");    // Info: Backspace fails
        //r = r.replace(/\a/g, "\\a");    // Info: Bell fails
        r = r.replace(/\r/g, "\\r");    // Carriage Return
        r = r.replace(/\t/g, "\\t");    // Tab
        r = r.replace(/\v/g, "\\v");    // Vertical Tab
        r = r.replace(/\f/g, "\\f");    // Formfeed
        r = r.replace(/ /g, "\\s");    // Whitespace
        return r;
    }

    private static tsunescape(s: string): string
    {
        var r = String(s);
        r = r.replace(/\\s/g, " ");	// Whitespace
        r = r.replace(/\\p/g, "|");    // Pipe
        r = r.replace(/\\;/g, ";");    // Semicolon
        r = r.replace(/\\n/g, "\n");   // Newline
        //r = r.replace(/\\b/g,  "\b");   // Info: Backspace fails
        //r = r.replace(/\\a/g,  "\a");   // Info: Bell fails
        r = r.replace(/\\f/g, "\f");   // Formfeed
        r = r.replace(/\\r/g, "\r");   // Carriage Return
        r = r.replace(/\\t/g, "\t");   // Tab
        r = r.replace(/\\v/g, "\v");   // Vertical Tab
        r = r.replace(/\\\//g, "\/");   // Slash
        r = r.replace(/\\\\/g, "\\");   // Backslash
        return r;
    }

}

export interface IAssoc<T>
{
    [key: string]: T;
}

export interface CallbackData
{
    item: QueueItem;
    error: QueryError;
    response: QueryResponseItem[];
    rawResponse: string;
}

export interface ErrorCallbackData extends CallbackData
{ }

export interface QueryResponseItem extends IAssoc<any>
{ }

export interface QueryError extends QueryResponseItem
{
    id: string;
    msg: string;
}

export interface QueueItem
{
    cmd: string;
    options: string[];
    parameters: IAssoc<Object>;
    text: string;
    defer: Q.Deferred<CallbackData>;

    response?: QueryResponseItem[];
    rawResponse?: string;
    error?: QueryError;
}

//module.exports = TeamSpeakClient;
