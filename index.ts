/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <timklge@wh2.tu-dresden.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return - Tim Kluge
 * ----------------------------------------------------------------------------
 */

///<reference path="typings/node/node.d.ts"/>

import net = require("net");
import LineInputStream = require("line-input-stream");
import events = require("events");
import util = require("util");

class TeamSpeakClient extends events.EventEmitter
{
    public get host(): string
    {
        return this._host;
    }

    private _host: string;
    private _port: number;

    private _queue: any[] = null;
    private _status: number;
    private _executing: any;

    private _socket: net.Socket;

    private static DefaultHost = "localhost";
    private static DefaultPort = 10011;

    constructor(host: string, port: number)
    {
        super(); //events.EventEmitter.call(this);
        
        this._host = host || TeamSpeakClient.DefaultHost;
        this._port = port || TeamSpeakClient.DefaultPort;
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
        this._reader = LineInputStream(this._socket);
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
            var response = undefined;
            if (s.indexOf("error") === 0)
            {
                response = this.parseResponse(s.substr("error ".length).trim());
                this._executing.error = response;
                if (this._executing.error.id === "0") delete this._executing.error;
                if (this._executing.cb) this._executing.cb.call(this._executing, this._executing.error, this._executing.response,
                    this._executing.rawResponse);
                this._executing = null;
                this.checkQueue();
            } else if (s.indexOf("notify") === 0)
            {
                s = s.substr("notify".length);
                response = this.parseResponse(s);
                this.emit(s.substr(0, s.indexOf(" ")), response);
            } else if (this._executing)
            {
                response = this.parseResponse(s);
                this._executing.rawResponse = s;
                this._executing.response = response;
            }
        });
        this.emit("connect");
    }

    /*
    * Send a command to the server
    */
    public send(): void
    {
        var args = Array.prototype.slice.call(arguments);
        var options = [];
        var params = {};
        var callback = undefined;
        var cmd = args.shift();
        args.forEach(v =>
        {
            if (util.isArray(v))
                options = v;
            else if (typeof v === "function")
                callback = v;
            else
                params = v;

        });
        var tosend = TeamSpeakClient.tsescape(cmd);
        options.forEach(v => tosend += " -" + TeamSpeakClient.tsescape(v));
        for (var k in params)
        {
            var v = params[k];
            if (util.isArray(v))
            {
                // Multiple values for the same key - concatenate all
                var doptions = v.map(val =>
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
        this._queue.push({
            cmd: cmd,
            options: options,
            parameters: params,
            text: tosend,
            cb: callback
        });
        if (this._status === 0)
            this.checkQueue();
    }

    private parseResponse(s: string): any[]
    {
        var response = [];
        var records = s.split("|");

        response = records.map(k =>
        {
            var args = k.split(" ");
            var thisrec = {};
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
            response = null;
        else if (response.length === 1)
            response = response.shift();
        return response;
    }

    /* Return pending commands that are going to be sent to the server.
    * Note that they have been parsed - Access getPending()[0].text to get
    * the full text representation of the command.
    */
    public getPending(): any
    {
        return this._queue.slice(0);
    }

    /* Clear the queue of pending commands so that any command that is currently queued won't be executed.
    * The old queue is returned.
    */
    public clearPending(): any[]
    {
        var q = this._queue;
        this._queue = [];
        return q;
    }

    private checkQueue()
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

module.exports = TeamSpeakClient;
