/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/q/Q.d.ts" />
/// <reference path="LineInputStream.d.ts" />
import events = require("events");
/**
* Client that can be used to connect to a TeamSpeak server query API.
*/
export declare class TeamSpeakClient extends events.EventEmitter {
    /**
    * Gets the remote host passed to the constructor. Can be an IP address or a host name.
    * @return {string} Remote host of the TeamSpeak server. Can be an IP address or a host name.
    */
    public host : string;
    private _host;
    private _port;
    private _queue;
    private _status;
    private _executing;
    private _socket;
    private _reader;
    private static DefaultHost;
    private static DefaultPort;
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
    private initializeConnection();
    /**
    * Gets called on an opened connection
    */
    private onConnect();
    public send(cmd: "login", params: LoginParams): Q.Promise<LoginCallbackData>;
    public send(cmd: "logout"): Q.Promise<LogoutCallbackData>;
    public send(cmd: "use", params: UseParams): Q.Promise<UseCallbackData>;
    public send(cmd: "clientlist", params: ClientListParams): Q.Promise<ClientListCallbackData>;
    public send(cmd: string): Q.Promise<CallbackData>;
    public send(cmd: string, params: IAssoc<Object>, options: string[]): Q.Promise<CallbackData>;
    /**
    * Parses a query API response.
    */
    private parseResponse(s);
    /**
    * Gets pending commands that are going to be sent to the server. Note that they have been parsed - Access pending[0].text to get the full text representation of the command.
    * @return {QueueItem[]} Pending commands that are going to be sent to the server.
    */
    public pending : QueueItem[];
    /**
    * Clears the queue of pending commands so that any command that is currently queued won't be executed.
    * @return {QueueItem[]} Array of commands that have been removed from the queue.
    */
    public clearPending(): QueueItem[];
    /**
    * Checks the current command queue and sends them if needed.
    */
    private checkQueue();
    /**
    * Escapes a string so it can be safely used for querying the api.
    * @param  {string} s The string to escape.
    * @return {string}   An escaped string.
    */
    private static tsescape(s);
    /**
    * Unescapes a string so it can be used for processing the response of the api.
    * @param  {string} s The string to unescape.
    * @return {string}   An unescaped string.
    */
    private static tsunescape(s);
}
/**
* Represents a Key-Value object.
*/
export interface IAssoc<T> {
    [key: string]: T;
}
/**
* Represents common data returned by the api.
*/
export interface CallbackData {
    item: QueueItem;
    error: QueryError;
    response: QueryResponseItem[];
    rawResponse: string;
}
export interface LoginCallbackData extends CallbackData {
}
export interface LoginParams extends IAssoc<any> {
    client_login_name: string;
    client_login_password: string;
}
export interface LogoutCallbackData extends CallbackData {
}
export interface UseCallbackData extends CallbackData {
}
export interface UseParams extends IAssoc<any> {
    sid: number;
}
export interface ClientListCallbackData extends CallbackData {
}
export interface ClientListParams extends IAssoc<any> {
}
/**
* Specialized callback data for a failed request.
*/
export interface ErrorCallbackData extends CallbackData {
}
/**
* Represents common data returned by the api during a successful response.
*/
export interface QueryResponseItem extends IAssoc<any> {
}
/**
* Item that represents a query error.
*/
export interface QueryError {
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
export interface QueueItem {
    cmd: string;
    options: string[];
    parameters: IAssoc<Object>;
    text: string;
    defer: Q.Deferred<CallbackData>;
    response?: QueryResponseItem[];
    rawResponse?: string;
    error?: QueryError;
}
