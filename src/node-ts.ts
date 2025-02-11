/**
 * @autor Niklas Mollenhauer <holzig@outlook.com>
 * @autor Tim Kluge <timklge@wh2.tu-dresden.de>
 */

import * as net from "node:net";
import { EventEmitter } from "node:events";
import { chunksToLinesAsync, chomp } from "@rauschma/stringio";

import { escape, unescape } from "./queryStrings.js"

/** Represents a Key-Value object. */
type MapLike<T> = Record<string, T>;

/**
 * Client that can be used to connect to a TeamSpeak server query API.
 */
export class TeamSpeakClient extends EventEmitter {
    private queue: QueryCommand[] = [];
    private _executing: QueryCommand | undefined;

    private socket!: net.Socket;

    private isConnected = false;

    private static readonly DefaultHost = "localhost";
    private static readonly DefaultPort = 10011;

    /**
     * Creates a new instance of TeamSpeakClient for a specific remote host:port.
     * @param {string = TeamSpeakClient.DefaultHost} host Remote host of the TeamSpeak server. Can be an IP address or a host name.
     * @param {number = TeamSpeakClient.DefaultPort} port TCP port of the server query instance of the remote host.
     * @constructor
     */
    constructor(
        private readonly host: string = TeamSpeakClient.DefaultHost,
        private readonly port: number = TeamSpeakClient.DefaultPort,
    ) {
        super();
    }

    public connect(): Promise<void> {
        this.isConnected = false;
        return new Promise((resolve, reject) => {
            this.socket = net.connect(this.port, this.host);
            this.socket.on("error", err => this.emit("error", err));
            // We'll try to reject the promise if the connection closes, to make sure
            // the promise gets rejected if we get an error while connecting.
            // (This will just do nothing if the promise is already fulfilled)
            this.socket.once("close", err => reject(err));
            this.socket.on("close", () => this.emit("close", this.queue));
            this.socket.on("connect", () => this.onConnect(resolve, reject));
        });
    }

    /**
     * Gets called on an opened connection
     */
    private async onConnect(connectionEstablished: () => void, error: (e: Error) => void): Promise<void> {
        const lineGenerator = chunksToLinesAsync(this.socket);

        let lineCounter = 0;

        for await (const lineWithNewLine of lineGenerator) {
            const line = chomp(lineWithNewLine).trim();
            if (line === "")
                continue;
            ++lineCounter;

            switch (lineCounter) {
                case 1: {
                    if (line !== "TS3") {
                        this.isConnected = false;
                        error(new Error("Remove server is not a TS3 Query Server endpoint."));
                        return;
                    }
                    continue;
                }

                case 2:
                    // We have read a second non-empty line, so we are ready to take commands
                    this.isConnected = true;
                    connectionEstablished();
                    continue; // Welcome message, followed by empty line (which is skipped)

                default: {
                    this.handleSingleLine(line);
                    this.checkQueue();
                }
            }
        }
    }

    private handleSingleLine(line: string): void {
        // Server answers with:
        // [- One line containing the answer ]
        // - "error id=XX msg=YY". ID is zero if command was executed successfully.
        if (line.startsWith("error")) {

            const errorResponse = line.substr("error ".length);

            const response = this.parseResponse(errorResponse);
            const executing = this._executing;

            if (response !== undefined && executing !== undefined) {
                const res = response.shift();

                if (res !== undefined) {
                    const currentError: QueryError = {
                        id: res["id"] || 0,
                        msg: res["msg"] || ""
                    };

                    if (currentError.id !== 0)
                        executing.error = currentError;

                    if (executing.rejectFunction && executing.resolveFunction) {
                        //item: executing || null,
                        const e = executing;
                        const data = {
                            cmd: e.cmd,
                            options: e.options || [],
                            text: e.text || null,
                            parameters: e.parameters || {},
                            error: e.error || null,
                            response: e.response || null,
                            rawResponse: e.rawResponse || null
                        };
                        if (data.error && data.error.id !== 0)
                            executing.rejectFunction(data as CallbackData<ErrorResponseData>);
                        else
                            executing.resolveFunction(data as CallbackData<QueryResponseItem>);
                    }
                }
            }

            this._executing = undefined;
            this.checkQueue();

        } else if (line.startsWith("notify")) {
            const notificationResponse = line.substr("notify".length);
            const response = this.parseResponse(notificationResponse);

            const notificationName = notificationResponse.substr(0, notificationResponse.indexOf(" "));
            this.emit(notificationName, response);
        } else if (this._executing) {
            this._executing.rawResponse = line;
            this._executing.response = this.parseResponse(line);
        }
    }

    /**
     * Sends a command to the server
     */
    // TODO: Only include constant overloads to force corrent parameterization

    // TODO: help
    // TODO: quit
    public send(cmd: "login", params: LoginParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "logout"): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "version"): Promise<CallbackData<VersionResponseData>>;
    public send(cmd: "hostinfo"): Promise<CallbackData<HostInfoResponseData>>;
    public send(cmd: "instanceinfo"): Promise<CallbackData<InstanceInfoResponseData>>;
    public send(cmd: "instanceedit", params: InstanceEditParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "bindinglist"): Promise<CallbackData<BindingListResponseData>>;
    public send(cmd: "use", params: UseParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "serverlist", params: MapLike<any>, options: string[]): Promise<CallbackData<ServerListResponseData>>;
    // TODO: serveridgetbyport
    public send(cmd: "serverdelete", params: ServerDeleteParams): Promise<CallbackData<GenericResponseData>>;
    // TODO: servercreate
    public send(cmd: "serverstart", params: ServerStartStopParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "serverstop", params: ServerStartStopParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "serverprocessstop"): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "serverinfo"): Promise<CallbackData<ServerInfoResponseData>>;
    public send(cmd: "serverrequestconnectioninfo"): Promise<CallbackData<ServerRequstConnectionInfoResponseData>>;
    public send(cmd: "serveredit", params: ServerEditParams): Promise<CallbackData<GenericResponseData>>;
    // TODO: servergrouplist
    // TODO: servergroupadd
    // TODO: servergroupdel
    // TODO: servergroupcopy
    // TODO: servergrouprename
    // TODO: servergrouppermlist
    // TODO: servergroupaddperm
    // TODO: servergroupdelperm
    // TODO: servergroupaddclient
    // TODO: servergroupdelclient
    // TODO: servergroupclientlist
    // TODO: servergroupsbyclientid
    // TODO: servergroupautoaddperm
    // TODO: servergroupautodelperm
    // TODO: serversnapshotcreate
    // TODO: serversnapshotdeploy
    public send(cmd: "servernotifyregister", params: RegisterNotificationsParams): Promise<CallbackData<GenericResponseData>>;
    // TODO: servernotifyunregister
    public send(cmd: "sendtextmessage", params: SendTextMessageParams): Promise<CallbackData<GenericResponseData>>;
    // TODO: logview
    public send(cmd: "logadd", params: LogAddParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "gm", params: GmParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "channellist", params: MapLike<any>, options: string[]): Promise<CallbackData<ChannelListResponseData>>; //@todo find anything to make signature better typed
    public send(cmd: "channelinfo", params: ChannelInfoParams): Promise<CallbackData<ChannelInfoResponseData>>
    // TODO: channelfind
    // TODO: channelmove
    // TODO: channelcreate
    public send(cmd: "channeldelete", params: ChannelDeleteParams): Promise<CallbackData<GenericResponseData>>;
    // TODO: channeledit
    // TODO: channelgrouplist
    // TODO: channelgroupadd
    // TODO: channelgroupdel
    // TODO: channelgroupcopy
    // TODO: channelgrouprename
    // TODO: channelgroupaddperm
    // TODO: channelgrouppermlist
    // TODO: channelgroupdelperm
    // TODO: channelgroupclientlist
    // TODO: setclientchannelgroup
    // TODO: channelpermlist
    // TODO: channeladdperm
    // TODO: channeldelperm
    public send(cmd: "clientlist", params: ClientListParams): Promise<CallbackData<ClientListResponseData>>;
    public send(cmd: "clientinfo", params: ClientInfoParams): Promise<CallbackData<ClientInfoResponseData>>;
    // TODO: clientfind
    // TODO: clientedit
    // TODO: clientdblist
    // TODO: clientdbinfo
    // TODO: clientdbfind
    // TODO: clientdbedit
    public send(cmd: "clientdbdelete", params: ClientDBDeleteParams): Promise<CallbackData<GenericResponseData>>;
    // TODO: clientgetids
    // TODO: clientgetdbidfromuid
    // TODO: clientgetnamefromuid
    // TODO: clientgetnamefromdbid
    // TODO: clientsetserverquerylogin
    // TODO: clientupdate
    public send(cmd: "clientmove", params: ClientMoveParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "clientkick", params: ClientKickParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "clientpoke", params: ClientPokeParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "clientpermlist", params: ClientPermListParams, options: string[]): Promise<CallbackData<ClientPermListResponseData>>;
    public send(cmd: "clientaddperm", params: ClientAddPermParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "clientdelperm", param: ClientDeleteParams): Promise<CallbackData<GenericResponseData>>;
    // TODO: channelclientpermlist
    // TODO: channelclientaddperm
    // TODO: channelclientdelperm
    // TODO: permissionlist
    // TODO: permidgetbyname
    // TODO: permoverview
    // TODO: permget
    // TODO: permfind
    // TODO: permrest
    // TODO: privilegekeylist
    // TODO: privilegekeyadd
    // TODO: privilegekeydelete
    // TODO: privilegekeyuse
    // TODO: messageadd
    public send(cmd: "messagedel", params: MessageDeleteParams): Promise<CallbackData<GenericResponseData>>;
    // TODO: messageget
    // TODO: messageupdateflag
    // TODO: complainlist
    // TODO: complainadd
    public send(cmd: "complaindelall", params: ComplainDeleteAllParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "complaindel", params: ComplainDeleteParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "banclient", params: BanClientParams): Promise<CallbackData<GenericResponseData>>; //@todo test
    public send(cmd: "banlist"): Promise<CallbackData<BanListResponseData>>;
    public send(cmd: "banadd", params: BanAddParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "bandel", params: BanDeleteParams): Promise<CallbackData<GenericResponseData>>;
    public send(cmd: "bandelall"): Promise<CallbackData<GenericResponseData>>;
    // TODO: ftinitupload
    // TODO: ftinitdownload
    // TODO: ftlist
    // TODO: ftgetfileinfo
    public send(cmd: "ftstop", params: FtStopParams): Promise<CallbackData<GenericResponseData>>;
    // TODO: ftdeletefile
    // TODO: ftrenamefile
    // TODO: customsearch
    // TODO: custominfo
    // TODO: whoami

    //public send(cmd: string): Promise<CallbackData<QueryResponseItem>>;
    //public send(cmd: string, params: IAssoc<Object>): Promise<CallbackData>;
    public send(cmd: string, params: MapLike<any>, options: string[]): Promise<CallbackData<QueryResponseItem>>;
    public send(cmd: string, params: MapLike<any> = {}, options: string[] = []): Promise<CallbackData<QueryResponseItem>> {
        if (!cmd)
            return Promise.reject<CallbackData<QueryResponseItem>>(new Error("Empty command"));

        if (!this.isConnected)
            return Promise.reject(new Error("Not connected to any server. Call \"connect()\" before sending anything."));

        let tosend = escape(cmd);
        for (const v of options)
            tosend += ` -${escape(v)}`;

        for (const key in params) {
            if (!params.hasOwnProperty(key))
                continue;
            const value = params[key];
            if (!Array.isArray(value)) {
                tosend += ` ${escape(key.toString())}=${escape(value.toString())}`;
            }
        }

        // Handle multiple arrays correctly
        // Get all array in the params
        const arrayParamKeys: string[] = [];
        for (const key in params) {
            if (params.hasOwnProperty(key) && Array.isArray(params[key]))
                arrayParamKeys.push(key);
        }

        if (arrayParamKeys.length > 0) {
            let escapedSegments = "";
            const firstArray = params[arrayParamKeys[0]] as string[];
            for (let i = 0; i < firstArray.length; ++i) {
                let segment = "";
                for (const key of arrayParamKeys) {
                    segment += `${escape(key)}=${escape(params[key][i])} `;
                }
                escapedSegments += `${segment.slice(0, -1)}|`;
            }
            if (escapedSegments.length > 0)
                tosend += ` ${escapedSegments.slice(0, -1)}`;
        }

        return new Promise<CallbackData<QueryResponseItem>>((resolve, reject) => {
            this.queue.push({
                cmd: cmd,
                options: options,
                parameters: params,
                text: tosend,
                resolveFunction: resolve,
                rejectFunction: reject,
            });

            if (this.isConnected)
                this.checkQueue();
        });
    }

    public subscribeChannelEvents(channelId: number): Promise<CallbackData<QueryResponseItem>> {
        return this.send("servernotifyregister", { event: "channel", id: channelId });
    }
    public subscribeServerEvents(): Promise<CallbackData<QueryResponseItem>> {
        return this.send("servernotifyregister", { event: "server" });
    }
    public subscribeServerTextEvents(): Promise<CallbackData<QueryResponseItem>> {
        return this.send("servernotifyregister", { event: "textserver" });
    }
    public subscribeChannelTextEvents(): Promise<CallbackData<QueryResponseItem>> {
        return this.send("servernotifyregister", { event: "textchannel" });
    }
    public subscribePrivateTextEvents(): Promise<CallbackData<QueryResponseItem>> {
        return this.send("servernotifyregister", { event: "textprivate" });
    }

    public on(event: "cliententerview", listener: (data: any) => void): this;
    public on(event: "clientleftview", listener: (data: any) => void): this;
    // server notifications
    public on(event: "serveredited", listener: (data: any) => void): this;
    // channel notifications
    public on(event: "channeldescriptionchanged", listener: (data: any) => void): this;
    public on(event: "channelpasswordchanged", listener: (data: any) => void): this;
    public on(event: "channelmoved", listener: (data: any) => void): this;
    public on(event: "channeledited", listener: (data: any) => void): this;
    public on(event: "channelcreated", listener: (data: any) => void): this;
    public on(event: "channeldeleted", listener: (data: any) => void): this;
    public on(event: "clientmoved", listener: (data: any) => void): this;
    public on(event: "textmessage", listener: (data: TextMessageNotificationData) => void): this;
    public on(event: "tokenused", listener: (data: any) => void): this;
    public on(event: "error", listener: (err: Error) => void): this;
    public on(event: "close", listener: (queue: QueryCommand[]) => void): this;
    public on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public once(event: "cliententerview", listener: (data: any) => void): this;
    public once(event: "clientleftview", listener: (data: any) => void): this;
    // server notifications
    public once(event: "serveredited", listener: (data: any) => void): this;
    // channel notifications
    public once(event: "channeldescriptionchanged", listener: (data: any) => void): this;
    public once(event: "channelpasswordchanged", listener: (data: any) => void): this;
    public once(event: "channelmoved", listener: (data: any) => void): this;
    public once(event: "channeledited", listener: (data: any) => void): this;
    public once(event: "channelcreated", listener: (data: any) => void): this;
    public once(event: "channeldeleted", listener: (data: any) => void): this;
    public once(event: "clientmoved", listener: (data: any) => void): this;
    public once(event: "textmessage", listener: (data: TextMessageNotificationData) => void): this;
    public once(event: "tokenused", listener: (data: any) => void): this;
    public once(event: "error", listener: (err: Error) => void): this;
    public once(event: "close", listener: (queue: QueryCommand[]) => void): this;
    public once(event: string, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }

    /**
     * Parses a query API response.
     */
    private parseResponse(s: string): QueryResponseItem[] | undefined {
        const records = s.split("|");
        // Test this
        const response = records.map<QueryResponseItem>(currentItem => {
            const args = currentItem.split(" ");
            const thisrec: QueryResponseItem = {};

            for (let v of args) {
                if (v.indexOf("=") <= -1) {
                    thisrec[v] = "";
                    continue;
                }
                const key = unescape(v.substr(0, v.indexOf("=")));
                const value = unescape(v.substr(v.indexOf("=") + 1));
                thisrec[key] = (Number.parseInt(value, 10).toString() == value) ? Number.parseInt(value, 10) : value;
            }
            return thisrec;
        });

        if (response.length === 0)
            return undefined;

        return response;
    }

    /**
     * Gets pending commands that are going to be sent to the server. Note that they have been parsed - Access pending[0].text to get the full text representation of the command.
     * @return {QueryCommand[]} Pending commands that are going to be sent to the server.
     */
    public get pending(): QueryCommand[] {
        return this.queue.slice(0);
    }

    /**
     * Clears the queue of pending commands so that any command that is currently queued won't be executed.
     * @return {QueryCommand[]} Array of commands that have been removed from the queue.
     */
    public clearPending(): QueryCommand[] {
        const q = this.queue;
        this.queue = [];
        return q;
    }

    /**
     * Checks the current command queue and sends them if needed.
     */
    private checkQueue(): void {
        if (this._executing !== undefined) return;

        const executing = this.queue.shift();
        if (executing) {
            this._executing = executing;
            this.socket.write(this._executing.text + "\n");
        }
    }

    /**
     * Sets the socket to timeout after timeout milliseconds of inactivity on the socket. By default net.Socket do not have a timeout.
     */
    public setTimeout(timeout: number): void {
        this.socket.setTimeout(timeout, () => {
            this.socket.destroy();
            this.emit("timeout");
        });
    }
    public unsetTimeout(): void {
        /*
         * If timeout is 0, then the existing idle timeout is disabled.
         * See: https://nodejs.org/api/net.html#net_socket_settimeout_timeout_callback
         */
        return this.setTimeout(0);
    }
}

/**
 * Represents common data returned by the api.
 */
export interface CallbackData<T extends QueryResponseItem> {
    cmd?: string;
    options?: string[];
    text?: string;
    parameters: MapLike<Object>;
    //item: QueryCommand;
    error: QueryError;
    response: T[];
    rawResponse: string;

    // cmd?: string,
    // options?: string[];
    // text?: string;
    // parameters: Object;
}

export interface LoginParams extends MapLike<any> {
    client_login_name: string;
    client_login_password: string;
}

export interface VersionResponseData extends QueryResponseItem {
    version: string;
    build: number;
    platform: string;
}

export interface UseParams extends MapLike<any> {
    sid: number;
}
export interface ServerListResponseData extends QueryResponseItem {
    //@todo
    virtualserver_id: number;
    virtualserver_port: number;
    virtualserver_status: string;
    virtualserver_clientsonline: number;
}
export interface ServerDeleteParams extends UseParams { }

export interface ServerStartStopParams extends UseParams { }

export interface ClientListResponseData extends QueryResponseItem {
    //TODO
}
export interface ClientListParams extends MapLike<any> { }

/**
 * Specialized callback data for a failed request.
 */
export interface ErrorResponseData extends QueryResponseItem { }

/**
 * Represents common data returned by the api during a successful response.
 */
export interface QueryResponseItem extends MapLike<any> { }

/**
 * Item that represents a query error.
 */
export interface QueryError {
    /**
     * The error id.
     * @type {number}
     */
    id: number;
    /**
     * Error message.
     * @type {string}
     */
    msg: string;

    /**
     * Permission that the client does not have.
     * @type {number}
     */
    failed_permid?: number;
}

/**
 * Represents an item in the processing queue for the api.
 */
export interface QueryCommand {
    cmd: string;
    options: string[];
    parameters: MapLike<Object>;
    text: string;
    resolveFunction: (data: CallbackData<any>) => void;
    rejectFunction: (reason: any) => void;

    response?: QueryResponseItem[];
    rawResponse?: string;
    error?: QueryError;
}

/*

    Mostly generated API interfaces following now.
    Field descriptions taken from the official documentation.
    http://media.teamspeak.com/ts3_literature/TeamSpeak%203%20Server%20Query%20Manual.pdf

*/


export interface TextMessageNotificationData {
    targetmode: TextMessageTargetMode;
    msg: string;
    /**
     * only present in messages of type "textprivate
     */
    target?: number;
}

/**
 * @todo move to seperate file
 * @todo check for encoding mess up/invisible chars caused by copy/pasting from the documentation PDF
 * @todo more discrete typings using enums/interfaces/etc
 * @todo lower case imported interfaces
 */

export interface HostInfoResponseData extends QueryResponseItem {
    instance_uptime: number;
    host_timestamp_utc: number;
    virtualservers_running_total: number;
    connection_filetransfer_bandwidth_sent: number;
    // TODO
}

export interface InstanceInfoResponseData extends QueryResponseItem {
    // TODO
}

export interface GenericResponseData extends QueryResponseItem { }

export interface ServerRequstConnectionInfoResponseData extends QueryResponseItem, ServerConnectionProperties { }

export interface ServerEditParams extends MapLike<any>, VirtualServerPropertiesChangable { }

export interface ServerInfoResponseData extends QueryResponseItem, VirtualServerProperties { }

export interface RegisterNotificationsParamsGeneric extends QueryResponseItem {
    event: "server" | "textserver" | "textchannel" | "textprivate";
}
export interface RegisterNotificationsChannelParams extends QueryResponseItem {
    event: "channel";
    id: number;
}

export type RegisterNotificationsParams = RegisterNotificationsParamsGeneric | RegisterNotificationsChannelParams;

export interface SendTextMessageParams extends QueryResponseItem {
    targetmode: TextMessageTargetMode;
    target: number;
    msg: string;
}

export interface InstanceEditParams extends MapLike<any>, InstancePropertiesChangable { }

export interface GmParams extends MapLike<any> {
    msg: string;
}
export interface ChannelListResponseData extends QueryResponseItem {
    cid: number;
    pid: number;
    channel_order: number;
    channel_name: string;
    channel_topic: string;
    total_clients: number;
}
export interface ChannelInfoParams extends MapLike<any> {
    cid: number;
}
export interface ChannelInfoResponseData extends QueryResponseItem, ChannelProperties { }

export interface ChannelDeleteParams extends MapLike<any>, ChannelInfoParams {
    force: YesNo;
}

export interface ClientInfoResponseData extends QueryResponseItem, ClientProperties { }
export interface ClientInfoParams extends MapLike<any> {
    clid: number;
}

export interface ClientDBDeleteParams extends MapLike<any> {
    cldbid: number;
}

export interface ClientMoveParams extends MapLike<any> {
    clid: number[];
    cid: number;
    cpw?: string;
}
export interface ClientKickParams extends MapLike<any> {
    clid: number[];
    reasonid: ReasonIdentifier;
    reasonmsg: string;
}
export interface ClientPokeParams extends MapLike<any> {
    clid: number;
    msg: string;
}
export interface ClientPermListParams extends MapLike<any> {
    cldbid: number;
}
export interface ClientPermListResponseData extends QueryResponseItem {
    cldbid?: number;
    permid: number;
    permvalue: number;
    permnegated: YesNo;
    permskip: number;
}
export interface ClientAddPermParams extends MapLike<any> {
    cldbid: number;
    permid?: number[];
    permsid?: string[];
    permvalue: number[];
    permskip: YesNo[];
}
export interface ClientDeleteParams extends MapLike<any> {
    cldbid: number;
    permid: number[];
    permsid: string[];
}

export interface MessageDeleteParams extends MapLike<any> {
    msgid: number;
}

export interface ComplainDeleteAllParams extends MapLike<any> {
    tcldbid: number;
}
export interface ComplainDeleteParams extends MapLike<any> {
    tcldbid: number;
    fcldbid: number;
}
export interface BanClientParams extends MapLike<any> {
    clid: number;
    time?: number;
    banreason?: string;
}

export interface BanListResponseData extends QueryResponseItem {
    banid: number;
    ip: string;
    created: number;
    invokername: string;
    invokercldbid: number;
    invokeruid: string;
    reason: string;
    enforcements: number;
}

export interface BanAddParams extends MapLike<any> {
    ip?: string;
    name?: string;
    uid?: string;
    time?: number;
    banreason?: string;
}
export interface BanDeleteParams extends MapLike<any> {
    banid: number;
}

export interface FtStopParams extends MapLike<any> {
    serverftfid: number;
    delete: YesNo;
}

export interface LogAddParams extends MapLike<any> {
    loglevel: LogLevel;
    logmsg: string;
}

export interface InstancePropertiesChangable {
    /**
    * Default ServerQuery group ID
    */
    serverinstance_guest_serverquery_group: any;
    /**
     * Default template group ID for administrators on new virtual servers (used to create initial token)
     */
    serverinstance_template_serveradmin_group: any;
    /**
     * TCP port used for file transfers
     */
    serverinstance_filetransfer_port: number;
    /**
     * Max bandwidth available for outgoing file transfers (Bytes/s)
     */
    serverinstance_max_download_total_bandwitdh: number;
    /**
     * Max bandwidth available for incoming file transfers (Bytes/s)
     */
    serverinstance_max_upload_total_bandwitdh: number;
    /**
     * Default server group ID used in templates
     */
    serverinstance_template_serverdefault_group: any;
    /**
     * Default channel group ID used in templates
     */
    serverinstance_template_channeldefault_group: any;
    /**
     * Default channel administrator group ID used in templates
     */
    serverinstance_template_channeladmin_group: any;
    /**
     * Max number of commands allowed in <serverinstance_serverquery_flood_time> seconds
     */
    serverinstance_serverquery_flood_commands: number;
    /**
     * Timeframe in seconds for <serverinstance_serverquery_flood_commands> commands
     */
    serverinstance_serverquery_flood_time: number;
    /**
     * Time in seconds used for automatic bans triggered by the ServerQuery flood protection
     */
    serverinstance_serverquery_flood_ban_time: number;
}

interface InstancePropertiesReadOnly extends ServerConnectionProperties {
    /**
     * Uptime in seconds
     */
    instance_uptime: number;
    /**
     * Current server date and time as UTC timestamp
     */
    host_timestamp_utc: any;
    /**
     * Number of virtual servers running
     */
    virtualservers_running_total: number;
    /**
     * Database revision number
     */
    serverinstance_database_version: any;
    /**
     * Max number of clients for all virtual servers
     */
    virtualservers_total_maxclients: number;
    /**
     * Number of clients online on all virtual servers
     */
    virtualservers_total_clients_online: number;
    /**
     * Number of channels on all virtual servers
     */
    virtualservers_total_channels_online: number;
}

interface InstanceProperties extends InstancePropertiesReadOnly, InstancePropertiesChangable { }

export interface BindingListResponseData extends QueryResponseItem {
    //TODO
}

export interface VirtualServerPropertiesChangable {
    /**
     * Name of the virtual server
     */
    virtualserver_name: string;
    /**
     * Welcome message of the virtual server
     */
    virtualserver_welcomemessage: string;
    /**
     * Number of slots available on the virtual server
     */
    virtualserver_maxclients: number;
    /**
     * Password of the virtual server
     */
    virtualserver_password: string;
    /**
     * Host message of the virtual server
     */
    virtualserver_hostmessage: string;
    /**
     * Host message mode of the virtual server (see Definitions)
     */
    virtualserver_hostmessage_mode: any;
    /**
     * Default server group ID
     */
    virtualserver_default_server_group: any;
    /**
     * Default channel group ID
     */
    virtualserver_default_channel_group: any;
    /**
     * Default channel administrator group ID
     */
    virtualserver_default_channel_admin_group: any;
    /**
     * Max bandwidth for outgoing file transfers on the virtual server (Bytes/s)
     */
    virtualserver_max_download_total_bandwidth: number;
    /**
     * Max bandwidth for incoming file transfers on the virtual server (Bytes/s)
     */
    virtualserver_max_upload_total_bandwidth: number;
    /**
     * Host banner URL opened on click
     */
    virtualserver_hostbanner_url: string;
    /**
     * Host banner URL used as image source
     */
    virtualserver_hostbanner_gfx_url: string;
    /**
     * Interval for reloading the banner on client-side
     */
    virtualserver_hostbanner_gfx_interval: any;
    /**
     * Number of complaints needed to ban a client automatically
     */
    virtualserver_complain_autoban_count: number;
    /**
     * Time in seconds used for automatic bans triggered by complaints
     */
    virtualserver_complain_autoban_time: number;
    /**
     * Time in seconds before a complaint is deleted automatically
     */
    virtualserver_complain_remove_time: number;
    /**
     * Number of clients in the same channel needed to force silence
     */
    virtualserver_min_clients_in_channel_before_forced_silence: number;
    /**
     * Client volume lowered automatically while a priority speaker is talking
     */
    virtualserver_priority_speaker_dimm_modificator: any;
    /**
     * Anti-flood points removed from a client for being good
     */
    virtualserver_antiflood_points_tick_reduce: any;
    /**
     * Anti-flood points needed to block commands being executed by the client
     */
    virtualserver_antiflood_points_needed_command_block: any;
    /**
     * Anti-flood points needed to block incoming connections from the client
     */
    virtualserver_antiflood_points_needed_ip_block: any;
    /**
     * The display mode for the virtual servers hostbanner (see Definitions)
     */
    virtualserver_hostbanner_mode: any;
    /**
     * Text used for the tooltip of the host button on client-side
     */
    virtualserver_hostbutton_tooltip: string;
    /**
     * Text used for the tooltip of the host button on client-side
     */
    virtualserver_hostbutton_gfx_url: string;
    /**
     * URL opened on click on the host button
     */
    virtualserver_hostbutton_url: string;
    /**
     * Download quota for the virtual server (MByte)
     */
    virtualserver_download_quota: number;
    /**
     * Download quota for the virtual server (MByte)
     */
    virtualserver_upload_quota: number;
    /**
     * Machine ID identifying the server instance associated with the virtual server in the database
     */
    virtualserver_machine_id: any;
    /**
     * UDP port the virtual server is listening on
     */
    virtualserver_port: number;
    /**
     * Indicates whether the server starts automatically with the server instance or not
     */
    virtualserver_autostart: any;
    /**
     * Status of the virtual server (online | virtual online | offline | booting up | shutting down | …)
     */
    virtualserver_status: string;
    /**
     * Indicates whether the server logs events related to clients or not
     */
    virtualserver_log_client: any;
    /**
     * Indicates whether the server logs events related to ServerQuery clients or not
     */
    virtualserver_log_query: any;
    /**
     * Indicates whether the server logs events related to channels or not
     */
    virtualserver_log_channel: any;
    /**
     * Indicates whether the server logs events related to permissions or not
     */
    virtualserver_log_permissions: any;
    /**
     * Indicates whether the server logs events related to server changes or not
     */
    virtualserver_log_server: any;
    /**
     * Indicates whether the server logs events related to file transfers or not
     */
    virtualserver_log_filetransfer: any;
    /**
     * Min client version required to connect
     */
    virtualserver_min_client_version: any;
    /**
     * Minimum client identity security level required to connect to the virtual server
     */
    virtualserver_needed_identity_security_level: any;
    /**
     * Phonetic name of the virtual server
     */
    virtualserver_name_phonetic: any;
    /**
     * CRC32 checksum of the virtual server icon
     */
    virtualserver_icon_id: any;
    /**
     * Number of reserved slots available on the virtual server
     */
    virtualserver_reserved_slots: number;
    /**
     * Indicates whether the server appears in the global web server list or not
     */
    virtualserver_weblist_enabled: any;
    /**
     * The global codec encryption mode of the virtual server
     */
    virtualserver_codec_encryption_mode: any;
}

export interface ServerConnectionProperties {
    /**
     * Current bandwidth used for outgoing file transfers (Bytes/s)
     */
    connection_filetransfer_bandwidth_sent: number;
    /**
     * Current bandwidth used for incoming file transfers (Bytes/s)
     */
    connection_filetransfer_bandwidth_received: number;
    /**
     * Total amount of packets sent
     */
    connection_packets_sent_total: number;
    /**
     * Total amount of packets received
     */
    connection_packets_received_total: number;
    /**
     * Total amount of bytes sent
     */
    connection_bytes_sent_total: number;
    /**
     * Total amount of bytes received
     */
    connection_bytes_received_total: number;
    /**
     * Average bandwidth used for outgoing data in the last second (Bytes/s)
     */
    connection_bandwidth_sent_last_second_total: number;
    /**
     * Average bandwidth used for incoming data in the last second (Bytes/s)
     */
    connection_bandwidth_received_last_second_total: number;
    /**
     * Average bandwidth used for outgoing data in the last minute (Bytes/s)
     */
    connection_bandwidth_sent_last_minute_total: number;
    /**
     * Average bandwidth used for incoming data in the last minute (Bytes/s)
     */
    connection_bandwidth_received_last_minute_total: number;
}

export interface VirtualServerPropertiesReadOnly extends ServerConnectionProperties {
    /**
     * Indicates whether the server has a password set or not
     */
    virtualserver_flag_password: any;
    /**
     * Number of clients connected to the virtual server
     */
    virtualserver_clientsonline: number;
    /**
     * Number of ServerQuery clients connected to the virtual server
     */
    virtualserver_queryclientsonline: number;
    /**
     * Number of channels created on the virtual server
     */
    virtualserver_channelsonline: number;
    /**
     * Creation date and time of the virtual server as UTC timestamp
     */
    virtualserver_created: any;
    /**
     * Uptime in seconds
     */
    virtualserver_uptime: number;
    /**
     * Operating system the server is running on
     */
    virtualserver_platform: string;
    /**
     * Server version information including build number
     */
    virtualserver_version: any;
    /**
     * Indicates whether the initial privilege key for the virtual server has been used or not
     */
    virtualserver_ask_for_privilegekey: any;
    /**
     * Total number of clients connected to the virtual server since it was last started
     */
    virtualserver_client_connections: number;
    /**
     * Total number of ServerQuery clients connected to the virtual server since it was last started
     */
    virtualserver_query_client_connections: number;
    /**
     * Number of bytes downloaded from the virtual server on the current month
     */
    virtualserver_month_bytes_downloaded: number;
    /**
     * Number of bytes uploaded to the virtual server on the current month
     */
    virtualserver_month_bytes_uploaded: number;
    /**
     * Number of bytes downloaded from the virtual server since it was last started
     */
    virtualserver_total_bytes_downloaded: number;
    /**
     * Number of bytes uploaded to the virtual server since it was last started
     */
    virtualserver_total_bytes_uploaded: number;
    /**
     * Unique ID of the virtual server
     */
    virtualserver_unique_identifer: any;
    /**
     * Database ID of the virtual server
     */
    virtualserver_id: any;
    /**
     * The average packet loss for speech data on the virtual server
     */
    virtualserver_total_packetloss_speech: number;
    /**
     * The average packet loss for keepalive data on the virtual server
     */
    virtualserver_total_packetloss_keepalive: number;
    /**
     * The average packet loss for control data on the virtual server
     */
    virtualserver_total_packetloss_control: number;
    /**
     * The average packet loss for all data on the virtual server
     */
    virtualserver_total_packetloss_total: number;
    /**
     * The average ping of all clients connected to the virtual server
     */
    virtualserver_total_ping: number;
    /**
     * The IPv4 address the virtual server is listening on
     */
    virtualserver_ip: any;
    /**
     * The directory where the virtual servers filebase is located
     */
    virtualserver_filebase: string;
}

export interface VirtualServerProperties extends VirtualServerPropertiesReadOnly, VirtualServerPropertiesChangable { }

export interface ChannelPropertiesChangable {
    /**
    * Name of the channel
    */
    channel_name: string;
    /**
     * Topic of the channel
     */
    channel_topic: string;
    /**
     * Description of the channel
     */
    channel_description: string;
    /**
     * Password of the channel
     */
    channel_password: string;
    /**
     * Codec used by the channel (see Definitions)
     */
    channel_codec: Codec;
    /**
     * Codec quality used by the channel
     */
    channel_codec_quality: any;
    /**
     * Individual max number of clients for the channel
     */
    channel_maxclients: number;
    /**
     * Individual max number of clients for the channel family
     */
    channel_maxfamilyclients: number;
    /**
     * ID of the channel below which the channel is positioned
     */
    channel_order: number;
    /**
     * Indicates whether the channel is permanent or not
     */
    channel_flag_permanent: any;
    /**
     * Indicates whether the channel is semi-permanent or not
     */
    channel_flag_semi_permanent: any;
    /**
     * Indicates whether the channel is temporary or not
     */
    channel_flag_temporary: any;
    /**
     * Indicates whether the channel is the virtual servers default channel or not
     */
    channel_flag_default: any;
    /**
     * Indicates whether the channel has a max clients limit or not
     */
    channel_flag_maxclients_unlimited: any;
    /**
     * Indicates whether the channel has a max family clients limit or not
     */
    channel_flag_maxfamilyclients_unlimited: any;
    /**
     * Indicates whether the channel inherits the max family clients from his parent channel or not
     */
    channel_flag_maxfamilyclients_inherited: any;
    /**
     * Needed talk power for this channel
     */
    channel_needed_talk_power: any;
    /**
     * Phonetic name of the channel
     */
    channel_name_phonetic: string;
    /**
     * CRC32 checksum of the channel icon
     */
    channel_icon_id: any;
    /**
     * Indicates whether speech data transmitted in this channel is encrypted or not
     */
    channel_codec_is_unencrypted: any;
    /**
     * The channels parent ID
     */
    CPID: number;
}

export interface ChannelPropertiesReadOnly {
    /**
    * Indicates whether the channel has a password set or not
    */
    channel_flag_password: any;
    /**
     * Path of the channels file repository
     */
    channel_filepath: string;
    /**
     * Indicates whether the channel is silenced or not
     */
    channel_forced_silence: any;
    /**
     * The channels ID
     */
    cid: number;
}

export interface ChannelProperties extends ChannelPropertiesReadOnly, ChannelPropertiesChangable { }

export interface ClientPropertiesChangable {
    /**
     * Nickname of the client
     */
    client_nickname: string;
    /**
     * Indicates whether the client is able to talk or not
     */
    client_is_talker: any;
    /**
     * Brief description of the client
     */
    client_description: string;
    /**
     * Indicates whether the client is a channel commander or not
     */
    client_is_channel_commander: any;
    /**
     * CRC32 checksum of the client icon
     */
    client_icon_id: any;
}
export interface ClientPropertiesReadOnly {
    /**
    * Unique ID of the client
    */
    client_unique_identifier: any;
    /**
     * Client version information including build number
     */
    client_version: any;
    /**
     * Operating system the client is running on
     */
    client_platform: any;
    /**
     * Indicates whether the client has their microphone muted or not
     */
    client_input_muted: any;
    /**
     * Indicates whether the client has their speakers muted or not
     */
    client_output_muted: any;
    /**
     * Indicates whether the client has enabled their capture device or not
     */
    client_input_hardware: any;
    /**
     * Indicates whether the client has enabled their playback device or not
     */
    client_output_hardware: any;
    /**
     * Default channel of the client
     */
    client_default_channel: any;
    /**
     * Username of a ServerQuery client
     */
    client_login_name: any;
    /**
     * Database ID of the client
     */
    client_database_id: any;
    /**
     * Current channel group ID of the client
     */
    client_channel_group_id: any;
    /**
     * Current server group IDs of the client separated by a comma
     */
    client_server_groups: any;
    /**
     * Creation date and time of the clients first connection to the server as UTC timestamp
     */
    client_created: any;
    /**
     * Creation date and time of the clients last connection to the server as UTC timestamp
     */
    client_lastconnected: any;
    /**
     * Total number of connections from this client since the server was started
     */
    client_totalconnections: any;
    /**
     * Indicates whether the client is away or not
     */
    client_away: any;
    /**
     * Away message of the client
     */
    client_away_message: any;
    /**
     * Indicates whether the client is a ServerQuery client or not
     */
    client_type: any;
    /**
     * Indicates whether the client has set an avatar or not
     */
    client_flag_avatar: any;
    /**
     * The clients current talk power
     */
    client_talk_power: any;
    /**
     * Indicates whether the client is requesting talk power or not
     */
    client_talk_request: any;
    /**
     * The clients current talk power request message
     */
    client_talk_request_msg: any;
    /**
     * Number of bytes downloaded by the client on the current month
     */
    client_month_bytes_downloaded: any;
    /**
     * Number of bytes uploaded by the client on the current month
     */
    client_month_bytes_uploaded: any;
    /**
     * Number of bytes downloaded by the client since the server was started
     */
    client_total_bytes_downloaded: any;
    /**
     * Number of bytes uploaded by the client since the server was started
     */
    client_total_bytes_uploaded: any;
    /**
     * Indicates whether the client is a priority speaker or not
     */
    client_is_priority_speaker: any;
    /**
     * Number of unread offline messages in this clients inbox
     */
    client_unread_messages: any;
    /**
     * Phonetic name of the client
     */
    client_nickname_phonetic: any;
    /**
     * The clients current ServerQuery view power
     */
    client_needed_serverquery_view_power: any;
    /**
     * Current bandwidth used for outgoing file transfers (Bytes/s)
     */
    connection_filetransfer_bandwidth_sent: any;
    /**
     * Current bandwidth used for incoming file transfers (Bytes/s)
     */
    connection_filetransfer_bandwidth_received: any;
    /**
     * Total amount of packets sent
     */
    connection_packets_sent_total: any;
    /**
     * Total amount of packets received
     */
    connection_packets_received_total: any;
    /**
     * Total amount of bytes sent
     */
    connection_bytes_sent_total: any;
    /**
     * Total amount of bytes received
     */
    connection_bytes_received_total: any;
    /**
     * Average bandwidth used for outgoing data in the last second (Bytes/s)
     */
    connection_bandwidth_sent_last_second_total: any;
    /**
     * Average bandwidth used for incoming data in the last second (Bytes/s)
     */
    connection_bandwidth_received_last_second_total: any;
    /**
     * Average bandwidth used for outgoing data in the last minute (Bytes/s)
     */
    connection_bandwidth_sent_last_minute_total: any;
    /**
     * Average bandwidth used for incoming data in the last minute (Bytes/s)
     */
    connection_bandwidth_received_last_minute_total: any;
    /**
     * The IPv4 address of the client
     */
    connection_client_ip: any;
    /**
     * The country identifier of the client (i.e. DE)
     */
    client_country: any;
}

export interface ClientProperties extends ClientPropertiesReadOnly, ClientPropertiesChangable { }

/*

    Enums imported from documentation.

*/

export enum YesNo {
    No = 0,
    Yes = 1
}

export enum HostMessageMode {
    /**
     * 1: display message in chatlog
     */
    LOG = 1,
    /**
     * 2: display message in modal dialog
     */
    MODAL,
    /**
     * 3: display message in modal dialog and close connection
     */
    MODALQUIT,
}

export enum HostBannerMode {
    /**
     * 0: do not adjust
     */
    NOADJUST = 0,
    /**
     * 1: adjust but ignore aspect ratio (like TeamSpeak 2)
     */
    IGNOREASPECT,
    /**
     * 2: adjust and keep aspect ratio
     */
    KEEPASPECT,
}

export enum Codec {
    /**
     * 0: speex narrowband (mono, 16bit, 8kHz)
     */
    SPEEX_NARROWBAND = 0,
    /**
     * 1: speex wideband (mono, 16bit, 16kHz)
     */
    SPEEX_WIDEBAND,
    /**
     * 2: speex ultra-wideband (mono, 16bit, 32kHz)
     */
    SPEEX_ULTRAWIDEBAND,
    /**
     * 3: celt mono (mono, 16bit, 48kHz)
     */
    CELT_MONO,
}

export enum CodecEncryptionMode {
    /**
     * 0: configure per channel
     */
    INDIVIDUAL = 0,
    /**
     * 1: globally disabled
     */
    DISABLED,
    /**
     * 2: globally enabled
     */
    ENABLED,
}

export enum TextMessageTargetMode {
    /**
     * 1: target is a client
     */
    CLIENT = 1,
    /**
     * 2: target is a channel
     */
    CHANNEL,
    /**
     * 3: target is a virtual server
     */
    SERVER,
}

export enum LogLevel {
    /**
     * 1: everything that is really bad
     */
    ERROR = 1,
    /**
     * 2: everything that might be bad
     */
    WARNING,
    /**
     * 3: output that might help find a problem
     */
    DEBUG,
    /**
     * 4: informational output
     */
    INFO,
}

export enum ReasonIdentifier {
    /**
     * 4: kick client from channel
     */
    CHANNEL = 4,
    /**
     * 5: kick client from server
     */
    SERVER,
}

export enum PermissionGroupDatabaseTypes {
    /**
     * 0: template group (used for new virtual servers)
     */
    TEMPLATE = 0,
    /**
     * 1: regular group (used for regular clients)
     */
    REGULAR,
    /**
     * 2: global query group (used for ServerQuery clients)
     */
    QUERY,
}

export enum PermissionGroupTypes {
    /**
     * 0: server group permission
     */
    SERVER_GROUP = 0,
    /**
     * 1: client specific permission
     */
    GLOBAL_CLIENT,
    /**
     * 2: channel specific permission
     */
    CHANNEL,
    /**
     * 3: channel group permission
     */
    CHANNEL_GROUP,
    /**
     * 4: channel-client specific permission
     */
    CHANNEL_CLIENT,
}

export enum TokenType {
    /**
     * 0: server group token (id1={groupID} id2=0)
     */
    SERVER_GROUP = 0,
    /**
     * 1: channel group token (id1={groupID} id2={channelID})
     */
    CHANNEL_GROUP,
}
