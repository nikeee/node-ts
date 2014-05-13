/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/q/Q.d.ts" />
/// <reference path="LineInputStream.d.ts" />
import events = require("events");
export declare class TeamSpeakClient extends events.EventEmitter {
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
    constructor();
    constructor(host: string);
    private initializeConnection();
    private onConnect();
    public send(cmd: "login", params: LoginParams): Q.Promise<LoginCallbackData>;
    public send(cmd: "use", params: UseParams): Q.Promise<UseCallbackData>;
    public send(cmd: "clientlist", params: ClientListParams): Q.Promise<ClientListCallbackData>;
    public send(cmd: string): Q.Promise<CallbackData>;
    public send(cmd: string, params: IAssoc<Object>, options: string[]): Q.Promise<CallbackData>;
    private parseResponse(s);
    public getPending(): QueueItem[];
    public clearPending(): QueueItem[];
    private checkQueue();
    private static tsescape(s);
    private static tsunescape(s);
}
export interface IAssoc<T> {
    [key: string]: T;
}
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
export interface UseCallbackData extends CallbackData {
}
export interface UseParams extends IAssoc<any> {
    sid: number;
}
export interface ClientListCallbackData extends CallbackData {
}
export interface ClientListParams extends IAssoc<any> {
}
export interface ErrorCallbackData extends CallbackData {
}
export interface QueryResponseItem extends IAssoc<any> {
}
export interface QueryError {
    id: number;
    msg: string;
}
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
