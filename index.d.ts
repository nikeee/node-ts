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
    public send(cmd: "login", params: LoginParams): Q.Promise<CallbackData<LoginResponseData>>;
    public send(cmd: "logout"): Q.Promise<CallbackData<LogoutResponseData>>;
    public send(cmd: "version"): Q.Promise<CallbackData<VersionResponseData>>;
    public send(cmd: "use", params: UseParams): Q.Promise<CallbackData<UseResponseData>>;
    public send(cmd: "clientlist", params: ClientListParams): Q.Promise<CallbackData<ClientListResponseData>>;
    public send(cmd: string): Q.Promise<CallbackData<QueryResponseItem>>;
    public send(cmd: string, params: IAssoc<Object>, options: string[]): Q.Promise<CallbackData<QueryResponseItem>>;
    /**
    * Parses a query API response.
    */
    private parseResponse(s);
    /**
    * Gets pending commands that are going to be sent to the server. Note that they have been parsed - Access pending[0].text to get the full text representation of the command.
    * @return {QueryCommand[]} Pending commands that are going to be sent to the server.
    */
    public pending : QueryCommand[];
    /**
    * Clears the queue of pending commands so that any command that is currently queued won't be executed.
    * @return {QueryCommand[]} Array of commands that have been removed from the queue.
    */
    public clearPending(): QueryCommand[];
    /**
    * Checks the current command queue and sends them if needed.
    */
    private checkQueue();
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
export interface CallbackData<T extends QueryResponseItem> {
    error: QueryError;
    response: T[];
    rawResponse: string;
}
export interface LoginResponseData extends QueryResponseItem {
}
export interface LoginParams extends IAssoc<any> {
    client_login_name: string;
    client_login_password: string;
}
export interface VersionResponseData extends QueryResponseItem {
    version: string;
    build: number;
    platform: string;
}
export interface LogoutResponseData extends QueryResponseItem {
}
export interface UseResponseData extends QueryResponseItem {
}
export interface UseParams extends IAssoc<any> {
    sid: number;
}
export interface ClientListResponseData extends QueryResponseItem {
}
export interface ClientListParams extends IAssoc<any> {
}
/**
* Specialized callback data for a failed request.
*/
export interface ErrorResponseData extends QueryResponseItem {
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
export interface QueryCommand {
    cmd: string;
    options: string[];
    parameters: IAssoc<Object>;
    text: string;
    defer: Q.Deferred<CallbackData<QueryResponseItem>>;
    response?: QueryResponseItem[];
    rawResponse?: string;
    error?: QueryError;
}
