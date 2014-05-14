/**
 * @autor Niklas Mollenhauer <holzig@outlook.com>
 * @autor Tim Kluge <timklge@wh2.tu-dresden.de>
 * @license Beerware/Pizzaware
 */

///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/q/Q.d.ts"/>
///<require path="node_modules/line-readable-stream/LineReadableStream.d.ts"/>

import Q = require("q");
import net = require("net");
import LineReadableStream = require("./node_modules/line-readable-stream/LineReadableStream");
import events = require("events");
import util = require("util");

/**
 * Client that can be used to connect to a TeamSpeak server query API.
 * @todo unit tests
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

    private _queue: QueryCommand[] = null;
    private _status: number;
    private _executing: QueryCommand;

    private _socket: net.Socket;
    private _reader: LineReadableStream;

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
        this._reader = new LineReadableStream(this._socket);
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
                    this._executing.error = currentError;
                else
                    currentError = null;

                if (this._executing.defer)
                {
                    //item: this._executing || null,
                    var e = this._executing;
                    var data: CallbackData<QueryResponseItem> = {
                        cmd: e.cmd,
                        options: e.options || [],
                        text: e.text || null,
                        parameters: e.parameters || {},
                        error: e.error || null,
                        response: e.response || null,
                        rawResponse: e.rawResponse || null
                    };
                    if (data.error && data.error.id !== 0)
                        this._executing.defer.reject(<CallbackData<ErrorResponseData>>data);
                    else
                        this._executing.defer.resolve(<CallbackData<QueryResponseItem>>data);
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

    // TODO: help
    // TODO: quit
    public send(cmd: "login", params: LoginParams): Q.Promise<CallbackData<LoginResponseData>>;
    public send(cmd: "logout"): Q.Promise<CallbackData<LogoutResponseData>>;
    public send(cmd: "version"): Q.Promise<CallbackData<VersionResponseData>>;
    public send(cmd: "hostinfo"): Q.Promise<CallbackData<HostInfoResponseData>>;
    public send(cmd: "instanceinfo"): Q.Promise<CallbackData<InstanceInfoResponseData>>;
    public send(cmd: "instanceedit"): Q.Promise<CallbackData<InstanceEditResponseData>>;
    public send(cmd: "bindinglist"): Q.Promise<CallbackData<BindingListResponseData>>;
    public send(cmd: "use", params: UseParams): Q.Promise<CallbackData<UseResponseData>>;
    // TODO: serverlist
    // TODO: serveridgetbyport
    // TODO: serverdelete
    // TODO: servercreate
    public send(cmd: "serverstart", params: ServerStartStopParams): Q.Promise<CallbackData<ServerStartStopResponseData>>;
    public send(cmd: "serverstop", params: ServerStartStopParams): Q.Promise<CallbackData<ServerStartStopResponseData>>;
    // TODO: serverprocessstop
    // TODO: serverinfo
    // TODO: serverrequestconnectioninfo
    // TODO: serveredit
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
    // TODO: servernotifyregister
    // TODO: servernotifyunregister
    // TODO: sendtextmessage
    // TODO: logview
    // TODO: logadd
    // TODO: gm
    // TODO: channellist
    // TODO: channelinfo
    // TODO: channelfind
    // TODO: channelmove
    // TODO: channelcreate
    // TODO: channeldelete
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
    // TODO: clientlist
    // TODO: clientinfo
    // TODO: clientfind
    // TODO: clientedit
    // TODO: clientdblist
    // TODO: clientdbinfo
    // TODO: clientdbfind
    // TODO: clientdbedit
    // TODO: clientdbdelete
    // TODO: clientgetids
    // TODO: clientgetdbidfromuid
    // TODO: clientgetnamefromuid
    // TODO: clientgetnamefromdbid
    // TODO: clientsetserverquerylogin
    // TODO: clientupdate
    // TODO: clientmove
    // TODO: clientkick
    // TODO: clientpoke
    // TODO: clientpermlist
    // TODO: clientaddperm
    // TODO: clientdelperm
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
    // TODO: messagedel
    // TODO: messageget
    // TODO: messageupdateflag
    // TODO: complainlist
    // TODO: complainadd
    // TODO: complaindelall
    // TODO: complaindel
    // TODO: banclient
    // TODO: banlist
    // TODO: banadd
    // TODO: bandel
    // TODO: bandelall
    // TODO: ftinitupload
    // TODO: ftinitdownload
    // TODO: ftlist
    // TODO: ftgetfileinfo
    // TODO: ftstop
    // TODO: ftdeletefile
    // TODO: ftrenamefile
    // TODO: customsearch
    // TODO: custominfo
    // TODO: whoami
    public send(cmd: "clientlist", params: ClientListParams): Q.Promise<CallbackData<ClientListResponseData>>;


    public send(cmd: string): Q.Promise<CallbackData<QueryResponseItem>>;
    //public send(cmd: string, params: IAssoc<Object>): Q.Promise<CallbackData>;
    public send(cmd: string, params: IAssoc<Object>, options: string[]): Q.Promise<CallbackData<QueryResponseItem>>;
    public send(cmd: string, params: IAssoc<Object> = {}, options: string[]= []): Q.Promise<CallbackData<QueryResponseItem>>
    {
        if (!cmd)
            return Q.reject("Empty command");

        var tosend = StringExtensions.tsEscape(cmd);
        options.forEach(v => tosend += " -" + StringExtensions.tsEscape(v));
        for (var key in params)
        {
            var value = params[key];
            if (util.isArray(value))
            {
                var vArray = <Array<string>>value;
                // Multiple values for the same key - concatenate all
                var doptions = vArray.map<string>(val => StringExtensions.tsEscape(key) + "=" + StringExtensions.tsEscape(val));
                tosend += " " + doptions.join("|");
            }
            else
            {
                tosend += " " + StringExtensions.tsEscape(key.toString()) + "=" + StringExtensions.tsEscape(value.toString());
            }
        }

        var d = Q.defer<CallbackData<QueryResponseItem>>();

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
                    var key = StringExtensions.tsUnescape(v.substr(0, v.indexOf("=")));
                    var value = StringExtensions.tsUnescape(v.substr(v.indexOf("=") + 1));

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
     * @return {QueryCommand[]} Pending commands that are going to be sent to the server.
     */
    public get pending(): QueryCommand[]
    {
        return this._queue.slice(0);
    }

    /**
     * Clears the queue of pending commands so that any command that is currently queued won't be executed.
     * @return {QueryCommand[]} Array of commands that have been removed from the queue.
     */
    public clearPending(): QueryCommand[]
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
}

class StringExtensions
{
    /**
     * Escapes a string so it can be safely used for querying the api.
     * @param  {string} s The string to escape.
     * @return {string}   An escaped string.
     */
    public static tsEscape(s: string): string
    {
        var r = String(s);
        r = r.replace(/\\/g, "\\\\");   // Backslash
        r = r.replace(/\//g, "\\/");    // Slash
        r = r.replace(/\|/g, "\\p");    // Pipe
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
    public static tsUnescape(s: string): string
    {
        var r = String(s);
        r = r.replace(/\\s/g, " ");	// Whitespace
        r = r.replace(/\\p/g, "|");    // Pipe
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
export interface CallbackData<T extends QueryResponseItem>
{
    //item: QueryCommand;
    error: QueryError;
    response: T[];
    rawResponse: string;
}

export interface LoginResponseData extends QueryResponseItem
{ }
export interface LoginParams extends IAssoc<any>
{
    client_login_name: string;
    client_login_password: string;
}

export interface VersionResponseData extends QueryResponseItem
{
    version: string;
    build: number;
    platform: string;
}

export interface LogoutResponseData extends QueryResponseItem
{ }

export interface UseResponseData extends QueryResponseItem
{ }
export interface UseParams extends IAssoc<any>
{
    sid: number;
}

export interface ServerStartStopParams extends UseParams
{ }
export interface  ServerStartStopResponseData extends QueryResponseItem
{ }

export interface ClientListResponseData extends QueryResponseItem
{ }
export interface ClientListParams extends IAssoc<any>
{ }

/**
 * Specialized callback data for a failed request.
 */
export interface ErrorResponseData extends QueryResponseItem
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
export interface QueryCommand
{
    cmd: string;
    options: string[];
    parameters: IAssoc<Object>;
    text: string;
    defer: Q.Deferred<CallbackData<QueryResponseItem>>;

    response?: QueryResponseItem[];
    rawResponse?: string;
    error?: QueryError;
}

/*

    Mostly generated API interfaces following now.
    Field descriptions taken from the official documentation.
    http://media.teamspeak.com/ts3_literature/TeamSpeak%203%20Server%20Query%20Manual.pdf

*/

/**
 * @todo move to seperate file
 * @todo check for encoding mess up/invisible chars caused by copy/pasting from the documentation PDF
 * @todo more discrete typings using enums/interfaces/etc
 */

export interface HostInfoResponseData extends QueryResponseItem
{
    instance_uptime: number;
    host_timestamp_utc: number;
    virtualservers_running_total: number;
    connection_filetransfer_bandwidth_sent: number;
    // TODO
}

export interface InstanceInfoResponseData extends QueryResponseItem
{
    // TODO
}

export interface InstanceEditResponseData extends QueryResponseItem
{ }
export interface InstanceEditParams extends IAssoc<any>, InstancePropertiesChangable
{ }

export interface InstancePropertiesChangable
{
    /**
    * Default ServerQuery group ID
    */
    SERVERINSTANCE_GUEST_SERVERQUERY_GROUP: any;
    /**
     * Default template group ID for administrators on new virtual servers (used to create initial token)
     */
    SERVERINSTANCE_TEMPLATE_SERVERADMIN_GROUP: any;
    /**
     * TCP port used for file transfers
     */
    SERVERINSTANCE_FILETRANSFER_PORT: number;
    /**
     * Max bandwidth available for outgoing file transfers (Bytes/s)
     */
    SERVERINSTANCE_MAX_DOWNLOAD_TOTAL_BANDWITDH: number;
    /**
     * Max bandwidth available for incoming file transfers (Bytes/s)
     */
    SERVERINSTANCE_MAX_UPLOAD_TOTAL_BANDWITDH: number;
    /**
     * Default server group ID used in templates
     */
    SERVERINSTANCE_TEMPLATE_SERVERDEFAULT_GROUP: any;
    /**
     * Default channel group ID used in templates
     */
    SERVERINSTANCE_TEMPLATE_CHANNELDEFAULT_GROUP: any;
    /**
     * Default channel administrator group ID used in templates
     */
    SERVERINSTANCE_TEMPLATE_CHANNELADMIN_GROUP: any;
    /**
     * Max number of commands allowed in <SERVERINSTANCE_SERVERQUERY_FLOOD_TIME> seconds
     */
    SERVERINSTANCE_SERVERQUERY_FLOOD_COMMANDS: number;
    /**
     * Timeframe in seconds for <SERVERINSTANCE_SERVERQUERY_FLOOD_COMMANDS> commands
     */
    SERVERINSTANCE_SERVERQUERY_FLOOD_TIME: number;
    /**
     * Time in seconds used for automatic bans triggered by the ServerQuery flood protection
     */
    SERVERINSTANCE_SERVERQUERY_FLOOD_BAN_TIME: number;
}

interface InstancePropertiesReadOnly
{
    /**
     * Uptime in seconds
     */
    INSTANCE_UPTIME: number;
    /**
     * Current server date and time as UTC timestamp
     */
    HOST_TIMESTAMP_UTC: any;
    /**
     * Number of virtual servers running
     */
    VIRTUALSERVERS_RUNNING_TOTAL: number;
    /**
     * Current bandwidth used for outgoing file transfers (Bytes/s)
     */
    CONNECTION_FILETRANSFER_BANDWIDTH_SENT: number;
    /**
     * Current bandwidth used for incoming file transfers (Bytes/s)
     */
    CONNECTION_FILETRANSFER_BANDWIDTH_RECEIVED: number;
    /**
     * Total amount of packets sent
     */
    CONNECTION_PACKETS_SENT_TOTAL: number;
    /**
     * Total amount of packets received
     */
    CONNECTION_PACKETS_RECEIVED_TOTAL: number;
    /**
     * Total amount of bytes sent
     */
    CONNECTION_BYTES_SENT_TOTAL: number;
    /**
     * Total amount of bytes received
     */
    CONNECTION_BYTES_RECEIVED_TOTAL: number;
    /**
     * Average bandwidth used for outgoing data in the last second (Bytes/s)
     */
    CONNECTION_BANDWIDTH_SENT_LAST_SECOND_TOTAL: number;
    /**
     * Average bandwidth used for incoming data in the last second (Bytes/s)
     */
    CONNECTION_BANDWIDTH_RECEIVED_LAST_SECOND_TOTAL: number;
    /**
     * Average bandwidth used for outgoing data in the last minute (Bytes/s)
     */
    CONNECTION_BANDWIDTH_SENT_LAST_MINUTE_TOTAL: number;
    /**
     * Average bandwidth used for incoming data in the last minute (Bytes/s)
     */
    CONNECTION_BANDWIDTH_RECEIVED_LAST_MINUTE_TOTAL: number;
    /**
     * Database revision number
     */
    SERVERINSTANCE_DATABASE_VERSION: any;
    /**
     * Max number of clients for all virtual servers
     */
    VIRTUALSERVERS_TOTAL_MAXCLIENTS: number;
    /**
     * Number of clients online on all virtual servers
     */
    VIRTUALSERVERS_TOTAL_CLIENTS_ONLINE: number;
    /**
     * Number of channels on all virtual servers
     */
    VIRTUALSERVERS_TOTAL_CHANNELS_ONLINE: number;
}

interface InstanceProperties extends InstancePropertiesReadOnly, InstancePropertiesChangable
{ }

export interface BindingListResponseData extends QueryResponseItem
{
    //TODO
}

export interface VirtualServerPropertiesChangable
{
    /**
     * Name of the virtual server
     */
    VIRTUALSERVER_NAME: string;
    /**
     * Welcome message of the virtual server
     */
    VIRTUALSERVER_WELCOMEMESSAGE: string;
    /**
     * Number of slots available on the virtual server
     */
    VIRTUALSERVER_MAXCLIENTS: number;
    /**
     * Password of the virtual server
     */
    VIRTUALSERVER_PASSWORD: string;
    /**
     * Host message of the virtual server
     */
    VIRTUALSERVER_HOSTMESSAGE: string;
    /**
     * Host message mode of the virtual server (see Definitions)
     */
    VIRTUALSERVER_HOSTMESSAGE_MODE: any;
    /**
     * Default server group ID
     */
    VIRTUALSERVER_DEFAULT_SERVER_GROUP: any;
    /**
     * Default channel group ID
     */
    VIRTUALSERVER_DEFAULT_CHANNEL_GROUP: any;
    /**
     * Default channel administrator group ID
     */
    VIRTUALSERVER_DEFAULT_CHANNEL_ADMIN_GROUP: any;
    /**
     * Max bandwidth for outgoing file transfers on the virtual server (Bytes/s)
     */
    VIRTUALSERVER_MAX_DOWNLOAD_TOTAL_BANDWIDTH: number;
    /**
     * Max bandwidth for incoming file transfers on the virtual server (Bytes/s)
     */
    VIRTUALSERVER_MAX_UPLOAD_TOTAL_BANDWIDTH: number;
    /**
     * Host banner URL opened on click
     */
    VIRTUALSERVER_HOSTBANNER_URL: string;
    /**
     * Host banner URL used as image source
     */
    VIRTUALSERVER_HOSTBANNER_GFX_URL: string;
    /**
     * Interval for reloading the banner on client-side
     */
    VIRTUALSERVER_HOSTBANNER_GFX_INTERVAL: any;
    /**
     * Number of complaints needed to ban a client automatically
     */
    VIRTUALSERVER_COMPLAIN_AUTOBAN_COUNT: number;
    /**
     * Time in seconds used for automatic bans triggered by complaints
     */
    VIRTUALSERVER_COMPLAIN_AUTOBAN_TIME: number;
    /**
     * Time in seconds before a complaint is deleted automatically
     */
    VIRTUALSERVER_COMPLAIN_REMOVE_TIME: number;
    /**
     * Number of clients in the same channel needed to force silence
     */
    VIRTUALSERVER_MIN_CLIENTS_IN_CHANNEL_BEFORE_FORCED_SILENCE: number;
    /**
     * Client volume lowered automatically while a priority speaker is talking
     */
    VIRTUALSERVER_PRIORITY_SPEAKER_DIMM_MODIFICATOR: any;
    /**
     * Anti-flood points removed from a client for being good
     */
    VIRTUALSERVER_ANTIFLOOD_POINTS_TICK_REDUCE: any;
    /**
     * Anti-flood points needed to block commands being executed by the client
     */
    VIRTUALSERVER_ANTIFLOOD_POINTS_NEEDED_COMMAND_BLOCK: any;
    /**
     * Anti-flood points needed to block incoming connections from the client
     */
    VIRTUALSERVER_ANTIFLOOD_POINTS_NEEDED_IP_BLOCK: any;
    /**
     * The display mode for the virtual servers hostbanner (see Definitions)
     */
    VIRTUALSERVER_HOSTBANNER_MODE: any;
    /**
     * Text used for the tooltip of the host button on client-side
     */
    VIRTUALSERVER_HOSTBUTTON_TOOLTIP: string;
    /**
     * Text used for the tooltip of the host button on client-side
     */
    VIRTUALSERVER_HOSTBUTTON_GFX_URL: string;
    /**
     * URL opened on click on the host button
     */
    VIRTUALSERVER_HOSTBUTTON_URL: string;
    /**
     * Download quota for the virtual server (MByte)
     */
    VIRTUALSERVER_DOWNLOAD_QUOTA: number;
    /**
     * Download quota for the virtual server (MByte)
     */
    VIRTUALSERVER_UPLOAD_QUOTA: number;
    /**
     * Machine ID identifying the server instance associated with the virtual server in the database
     */
    VIRTUALSERVER_MACHINE_ID: any;
    /**
     * UDP port the virtual server is listening on
     */
    VIRTUALSERVER_PORT: number;
    /**
     * Indicates whether the server starts automatically with the server instance or not
     */
    VIRTUALSERVER_AUTOSTART: any;
    /**
     * Status of the virtual server (online | virtual online | offline | booting up | shutting down | …)
     */
    VIRTUALSERVER_STATUS: any;
    /**
     * Indicates whether the server logs events related to clients or not
     */
    VIRTUALSERVER_LOG_CLIENT: any;
    /**
     * Indicates whether the server logs events related to ServerQuery clients or not
     */
    VIRTUALSERVER_LOG_QUERY: any;
    /**
     * Indicates whether the server logs events related to channels or not
     */
    VIRTUALSERVER_LOG_CHANNEL: any;
    /**
     * Indicates whether the server logs events related to permissions or not
     */
    VIRTUALSERVER_LOG_PERMISSIONS: any;
    /**
     * Indicates whether the server logs events related to server changes or not
     */
    VIRTUALSERVER_LOG_SERVER: any;
    /**
     * Indicates whether the server logs events related to file transfers or not
     */
    VIRTUALSERVER_LOG_FILETRANSFER: any;
    /**
     * Min client version required to connect
     */
    VIRTUALSERVER_MIN_CLIENT_VERSION: any;
    /**
     * Minimum client identity security level required to connect to the virtual server
     */
    VIRTUALSERVER_NEEDED_IDENTITY_SECURITY_LEVEL: any;
    /**
     * Phonetic name of the virtual server
     */
    VIRTUALSERVER_NAME_PHONETIC: any;
    /**
     * CRC32 checksum of the virtual server icon
     */
    VIRTUALSERVER_ICON_ID: any;
    /**
     * Number of reserved slots available on the virtual server
     */
    VIRTUALSERVER_RESERVED_SLOTS: number;
    /**
     * Indicates whether the server appears in the global web server list or not
     */
    VIRTUALSERVER_WEBLIST_ENABLED: any;
    /**
     * The global codec encryption mode of the virtual server
     */
    VIRTUALSERVER_CODEC_ENCRYPTION_MODE: any;
}

export interface VirtualServerPropertiesReadOnly
{
    /**
     * Indicates whether the server has a password set or not
     */
    VIRTUALSERVER_FLAG_PASSWORD: any;
    /**
     * Number of clients connected to the virtual server
     */
    VIRTUALSERVER_CLIENTSONLINE: number;
    /**
     * Number of ServerQuery clients connected to the virtual server
     */
    VIRTUALSERVER_QUERYCLIENTSONLINE: number;
    /**
     * Number of channels created on the virtual server
     */
    VIRTUALSERVER_CHANNELSONLINE: number;
    /**
     * Creation date and time of the virtual server as UTC timestamp
     */
    VIRTUALSERVER_CREATED: any;
    /**
     * Uptime in seconds
     */
    VIRTUALSERVER_UPTIME: number;
    /**
     * Operating system the server is running on
     */
    VIRTUALSERVER_PLATFORM: string;
    /**
     * Server version information including build number
     */
    VIRTUALSERVER_VERSION: any;
    /**
     * Indicates whether the initial privilege key for the virtual server has been used or not
     */
    VIRTUALSERVER_ASK_FOR_PRIVILEGEKEY: any;
    /**
     * Total number of clients connected to the virtual server since it was last started
     */
    VIRTUALSERVER_CLIENT_CONNECTIONS: number;
    /**
     * Total number of ServerQuery clients connected to the virtual server since it was last started
     */
    VIRTUALSERVER_QUERY_CLIENT_CONNECTIONS: number;
    /**
     * Number of bytes downloaded from the virtual server on the current month
     */
    VIRTUALSERVER_MONTH_BYTES_DOWNLOADED: number;
    /**
     * Number of bytes uploaded to the virtual server on the current month
     */
    VIRTUALSERVER_MONTH_BYTES_UPLOADED: number;
    /**
     * Number of bytes downloaded from the virtual server since it was last started
     */
    VIRTUALSERVER_TOTAL_BYTES_DOWNLOADED: number;
    /**
     * Number of bytes uploaded to the virtual server since it was last started
     */
    VIRTUALSERVER_TOTAL_BYTES_UPLOADED: number;
    /**
     * Unique ID of the virtual server
     */
    VIRTUALSERVER_UNIQUE_IDENTIFER: any;
    /**
     * Database ID of the virtual server
     */
    VIRTUALSERVER_ID: any;
    /**
     * Current bandwidth used for outgoing file transfers (Bytes/s)
     */
    CONNECTION_FILETRANSFER_BANDWIDTH_SENT: number;
    /**
     * Current bandwidth used for incoming file transfers (Bytes/s)
     */
    CONNECTION_FILETRANSFER_BANDWIDTH_RECEIVED: number;
    /**
     * Total amount of packets sent
     */
    CONNECTION_PACKETS_SENT_TOTAL: number;
    /**
     * Total amount of packets received
     */
    CONNECTION_PACKETS_RECEIVED_TOTAL: number;
    /**
     * Total amount of bytes sent
     */
    CONNECTION_BYTES_SENT_TOTAL: number;
    /**
     * Total amount of bytes received
     */
    CONNECTION_BYTES_RECEIVED_TOTAL: number;
    /**
     * Average bandwidth used for outgoing data in the last second (Bytes/s)
     */
    CONNECTION_BANDWIDTH_SENT_LAST_SECOND_TOTAL: number;
    /**
     * Average bandwidth used for incoming data in the last second (Bytes/s)
     */
    CONNECTION_BANDWIDTH_RECEIVED_LAST_SECOND_TOTAL: number;
    /**
     * Average bandwidth used for outgoing data in the last minute (Bytes/s)
     */
    CONNECTION_BANDWIDTH_SENT_LAST_MINUTE_TOTAL: number;
    /**
     * Average bandwidth used for incoming data in the last minute (Bytes/s)
     */
    CONNECTION_BANDWIDTH_RECEIVED_LAST_MINUTE_TOTAL: number;
    /**
     * The average packet loss for speech data on the virtual server
     */
    VIRTUALSERVER_TOTAL_PACKETLOSS_SPEECH: number;
    /**
     * The average packet loss for keepalive data on the virtual server
     */
    VIRTUALSERVER_TOTAL_PACKETLOSS_KEEPALIVE: number;
    /**
     * The average packet loss for control data on the virtual server
     */
    VIRTUALSERVER_TOTAL_PACKETLOSS_CONTROL: number;
    /**
     * The average packet loss for all data on the virtual server
     */
    VIRTUALSERVER_TOTAL_PACKETLOSS_TOTAL: number;
    /**
     * The average ping of all clients connected to the virtual server
     */
    VIRTUALSERVER_TOTAL_PING: number;
    /**
     * The IPv4 address the virtual server is listening on
     */
    VIRTUALSERVER_IP: any;
    /**
     * The directory where the virtual servers filebase is located
     */
    VIRTUALSERVER_FILEBASE: string;
}

export interface VirtualServerProperties extends VirtualServerPropertiesReadOnly, VirtualServerPropertiesChangable
{ }
