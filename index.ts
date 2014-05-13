/**
 * @autor Niklas Mollenhauer <holzig@outlook.com>
 * @autor Tim Kluge <timklge@wh2.tu-dresden.de>
 * @license Beerware/Pizzaware
 */

///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/q/Q.d.ts"/>
///<reference path="LineInputStream.ts"/>

import Q = require("q");
import net = require("net");
import LineInputStream = require("./LineInputStream");
import events = require("events");
import util = require("util");

/**
 * Client that can be used to connect to a TeamSpeak server query API.
 */
export class TeamSpeakClient extends events.EventEmitter
{
    /**
     * Gets the remote host passed to the constructor. Can be an IP address or a host name.
     * @return {string} Remote host of the TeamSpeak server. Can be an IP address or a host name.
     */
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

    /**
     * Creates a new instance of TeamSpeakClient using the default values.
     * @constructor
     */
    constructor();
    /**
     * Creates a new instance of TeamSpeakClient for a specific remote host.
     * @param {string} host Remote host of the TeamSpeak server. Can be an IP address or a host name.
     * @constructor
     */
    constructor(host: string);
    /**
     * Creates a new instance of TeamSpeakClient for a specific remote host:port.
     * @param {string = TeamSpeakClient.DefaultHost} host Remote host of the TeamSpeak server. Can be an IP address or a host name.
     * @param {number = TeamSpeakClient.DefaultPort} port TCP port of the server query instance of the remote host.
     * @constructor
     */
    constructor(host: string, port: number);
    /**
     * Creates a new instance of TeamSpeakClient for a specific remote host:port.
     * @param {string = TeamSpeakClient.DefaultHost} host Remote host of the TeamSpeak server. Can be an IP address or a host name.
     * @param {number = TeamSpeakClient.DefaultPort} port TCP port of the server query instance of the remote host.
     * @constructor
     */
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

    /**
     * Gets called on an opened connection
     */
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
            var response: QueryResponseItem[];

            if (s.indexOf("error") === 0)
            {
                response = this.parseResponse(s.substr("error ".length).trim());
                var res = response.shift();

                var currentError: QueryError = {
                    id: res["id"] || 0,
                    msg: res["msg"] || ""
                };

                if (currentError.id !== 0)
                {
                    this._executing.error = currentError;
                    this._executing.error = null;
                }
                else
                {
                    currentError = null;
                }

                if (this._executing.defer)
                {
                    var data: CallbackData = {
                        item: this._executing,
                        error: this._executing.error,
                        response: this._executing.response,
                        rawResponse: this._executing.rawResponse
                    };
                    if (data.error && data.error.id !== 0)
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
                response = this.parseResponse(s);
                this.emit(s.substr(0, s.indexOf(" ")), response);
            }
            else if (this._executing)
            {
                response = this.parseResponse(s);
                this._executing.rawResponse = s;
                this._executing.response = response;
            }
        });
        this.emit("connect");
    }

    /**
     * Sends a command to the server
     */
    // TODO: Only include constant overloads to force corrent parameterization
    public send(cmd: "login", params: LoginParams): Q.Promise<LoginCallbackData>;
    public send(cmd: "use", params: UseParams): Q.Promise<UseCallbackData>;
    public send(cmd: "clientlist", params: ClientListParams): Q.Promise<ClientListCallbackData>;
    public send(cmd: string): Q.Promise<CallbackData>;
    //public send(cmd: string, params: IAssoc<Object>): Q.Promise<CallbackData>;
    public send(cmd: string, params: IAssoc<Object>, options: string[]): Q.Promise<CallbackData>;
    public send(cmd: string, params: IAssoc<Object> = {}, options: string[] = []): Q.Promise<CallbackData>
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

    /**
     * Parses a query API response.
     */
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

   /**
    * Gets pending commands that are going to be sent to the server. Note that they have been parsed - Access pending[0].text to get the full text representation of the command.
    * @return {QueueItem[]} Pending commands that are going to be sent to the server.
    */
    public get pending(): QueueItem[]
    {
        return this._queue.slice(0);
    }

   /**
    * Clears the queue of pending commands so that any command that is currently queued won't be executed.
    * @return {QueueItem[]} Array of commands that have been removed from the queue.
    */
    public clearPending(): QueueItem[]
    {
        var q = this._queue;
        this._queue = [];
        return q;
    }

    /**
     * Checks the current command queue and sends them if needed.
     */
    private checkQueue(): void
    {
        if (!this._executing && this._queue.length >= 1)
        {
            this._executing = this._queue.shift();
            this._socket.write(this._executing.text + "\n");
        }
    }

    /**
     * Escapes a string so it can be safely used for querying the api.
     * @param  {string} s The string to escape.
     * @return {string}   An escaped string.
     */
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

    /**
     * Unescapes a string so it can be used for processing the response of the api.
     * @param  {string} s The string to unescape.
     * @return {string}   An unescaped string.
     */
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

/**
 * Represents a Key-Value object.
 */
export interface IAssoc<T>
{
    [key: string]: T;
}

/**
 * Represents common data returned by the api.
 */
export interface CallbackData
{
    item: QueueItem;
    error: QueryError;
    response: QueryResponseItem[];
    rawResponse: string;
}


export interface LoginCallbackData extends CallbackData
{ }
export interface LoginParams extends IAssoc<any>
{
    client_login_name: string;
    client_login_password: string;
}

export interface UseCallbackData extends CallbackData
{ }
export interface UseParams extends IAssoc<any>
{
    sid: number;
}

export interface ClientListCallbackData extends CallbackData
{ }
export interface ClientListParams extends IAssoc<any>
{ }


/**
 * Specialized callback data for a failed request.
 */
export interface ErrorCallbackData extends CallbackData
{ }

/**
 * Represents common data returned by the api during a successful response.
 */
export interface QueryResponseItem extends IAssoc<any>
{ }

/**
 * Item that represents a query error.
 */
export interface QueryError
{
    /**
     * The error id.
     */
    id: number;
    /**
     * Error message.
     */
    msg: string;
}

/**
 * Represents an item in the processing queue for the api.
 */
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
