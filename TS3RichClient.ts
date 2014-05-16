///<reference path="index.ts"/>

import ts3 = require("./index");

class TS3RichClient
{
	/**
	 * Authenticates with the TeamSpeak 3 Server instance using given ServerQuery login credentials.
	 */
	public login(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deselects the active virtual server and logs out from the server instance.
	 */
	public logout(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Closes the ServerQuery connection to the TeamSpeak 3 Server instance.
	 */
	public quit(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Selects the virtual server specified with sid or port to allow further interaction. The ServerQuery client will appear on the virtual server and acts like a real TeamSpeak 3 Client, except it's unable to send or receive voice data.
	 * If your database contains multiple virtual servers using the same UDP port, use will select a random virtual server using the specified port.
	 */
	public use(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Adds a new ban rule on the selected virtual server. All parameters are optional but at least one of the following must be set: ip, name, or uid.
	 */
	public banadd(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Bans the client specified with ID clid from the server. Please note that this will create two separate ban rules for the targeted clients IP address and his unique identifier.
	 */
	public banclient(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes all active ban rules from the server.
	 */
	public bandelall(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes the ban rule with ID banid from the server.
	 */
	public bandel(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of active bans on the selected virtual server.
	 */
	public banlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of IP addresses used by the server instance on multi-homed machines.
	 */
	public bindinglist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Adds a set of specified permissions to a channel. Multiple permissions can be added by providing the two parameters of each permission. A permission can be specified by permid or permsid.
	 */
	public channeladdperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Adds a set of specified permissions to a client in a specific channel. Multiple permissions can be added by providing the two parameters of each permission. A permission can be specified by permid or permsid.
	 */
	public channelclientaddperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Removes a set of specified permissions from a client in a specific channel. Multiple permissions can be removed at once. A permission can be specified by permid or permsid.
	 */
	public channelclientdelperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of permissions defined for a client in a specific channel.
	 */
	public channelclientpermlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Creates a new channel using the given properties and displays its ID.
	 */
	public channelcreate(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes an existing channel by ID. If force is set to 1, the channel will be deleted even if there are clients within.
	 */
	public channeldelete(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Removes a set of specified permissions from a channel. Multiple permissions can be removed at once. A permission can be specified by permid or permsid.
	 */
	public channeldelperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Changes a channels configuration using given properties.
	 */
	public channeledit(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of channels matching a given name pattern.
	 */
	public channelfind(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Creates a new channel group using a given name and displays its ID. The optional type parameter can be used to create ServerQuery groups and template groups.
	 */
	public channelgroupadd(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Adds a set of specified permissions to a channel group. Multiple permissions can be added by providing the two parameters of each permission. A permission can be specified by permid or permsid.
	 */
	public channelgroupaddperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays all the client and/or channel IDs currently assigned to channel groups. All three parameters are optional so you're free to choose the most suitable combination for your requirements.
	 */
	public channelgroupclientlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Creates a copy of the channel group specified with ssgid. If tsgid is set to 0,
	the server will create a new group. To overwrite an existing group, simply set tsgid to the ID of a designated target group. If a target group is set, the name parameter will be ignored.
	The type parameter can be used to create ServerQuery and template groups.
	 */
	public channelgroupcopy(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes a channel group by ID. If force is set to 1, the channel group will be deleted even if there are clients within.
	 */
	public channelgroupdel(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Removes a set of specified permissions from the channel group. Multiple permissions can be removed at once. A permission can be specified by permid or permsid.
	 */
	public channelgroupdelperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of channel groups available on the selected virtual server.
	 */
	public channelgrouplist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of permissions assigned to the channel group specified with cgid.
	 */
	public channelgrouppermlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Changes the name of a specified channel group.
	 */
	public channelgrouprename(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays detailed configuration information about a channel including ID, topic, description, etc.
	 */
	public channelinfo(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of channels created on a virtual server including their ID, order, name, etc. The output can be modified using several command options.
	 */
	public channellist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Moves a channel to a new parent channel with the ID cpid. If order is specified, the channel will be sorted right under the channel with the specified ID. If order is set to 0, the channel will be sorted right below the new parent.
	 */
	public channelmove(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of permissions defined for a channel.
	 */
	public channelpermlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Adds a set of specified permissions to a client. Multiple permissions can be added by providing the three parameters of each permission. A permission can be specified by permid or permsid.
	 */
	public clientaddperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes a clients properties from the database.
	 */
	public clientdbdelete(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Changes a clients settings using given properties.
	 */
	public clientdbedit(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of client database IDs matching a given pattern. You can either search for a clients last known nickname or his unique identity by using the -uid option.
	 */
	public clientdbfind(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays detailed database information about a client including unique ID, creation date, etc.
	 */
	public clientdbinfo(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of client identities known by the server including their database ID, last nickname, etc.
	 */
	public clientdblist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Removes a set of specified permissions from a client. Multiple permissions can be removed at once. A permission can be specified by permid or permsid.
	 */
	public clientdelperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Changes a clients settings using given properties.
	 */
	public clientedit(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of clients matching a given name pattern.
	 */
	public clientfind(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays the database ID matching the unique identifier specified by cluid.
	 */
	public clientgetdbidfromuid(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays all client IDs matching the unique identifier specified by cluid.
	 */
	public clientgetids(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays the unique identifier and nickname matching the database ID specified by cldbid.
	 */
	public clientgetnamefromdbid(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays the database ID and nickname matching the unique identifier specified by cluid.
	 */
	public clientgetnamefromuid(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays the unique identifier matching the clientID specified by clid.
	 */
	public clientgetuidfromclid(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays detailed configuration information about a client including unique ID, nickname, client version, etc.
	 */
	public clientinfo(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Kicks one or more clients specified with clid from their currently joined channel or from the server, depending on reasonid. The reasonmsg parameter specifies a text message sent to the kicked clients. This parameter is optional and may only have a maximum of 40 characters.
	 * Available reasonid values are:
	 *  4: Kick the client from his current channel into the default channel
	 *  5: Kick the client from the server
	 */
	public clientkick(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of clients online on a virtual server including their ID, nickname, status flags, etc. The output can be modified using several command options. Please note that the output will only contain clients which are currently in channels you're able to subscribe to.
	 */
	public clientlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Moves one or more clients specified with clid to the channel with ID cid. If the target channel has a password, it needs to be specified with cpw. If the channel has no password, the parameter can be omitted.
	 */
	public clientmove(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of permissions defined for a client.
	 */
	public clientpermlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Sends a poke message to the client specified with clid.
	 */
	public clientpoke(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Updates your own ServerQuery login credentials using a specified username. The password will be auto-generated.
	 */
	public clientsetserverquerylogin(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Change your ServerQuery clients settings using given properties.
	 */
	public clientupdate(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Submits a complaint about the client with database ID tcldbid to the server.
	 */
	public complainadd(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes all complaints about the client with database ID tcldbid from the server.
	 */
	public complaindelall(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes the complaint about the client with database ID tcldbid submitted by the client with database ID fcldbid from the server.
	 */
	public complaindel(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of complaints on the selected virtual server. If tcldbid is specified, only complaints about the targeted client will be shown.
	 */
	public complainlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of custom properties for the client specified with cldbid.
	 */
	public custominfo(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Searches for custom client properties specified by ident and value. The value parameter can include regular characters and SQL wildcard characters (e.g. %).
	 */
	public customsearch(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Creates new directory in a channels file repository.
	 */
	public ftcreatedir(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes one or more files stored in a channels file repository.
	 */
	public ftdeletefile(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays detailed information about one or more specified files stored in a channels file repository.
	 */
	public ftgetfileinfo(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of files and directories stored in the specified channels file repository.
	 */
	public ftgetfilelist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Initializes a file transfer download. clientftfid is an arbitrary ID to identify the file transfer on client-side. On success, the server generates a new ftkey which is required to start downloading the file through TeamSpeak 3's file transfer interface.
	 */
	public ftinitdownload(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Initializes a file transfer upload. clientftfid is an arbitrary ID to identify the file transfer on client-side. On success, the server generates a new ftkey which is required to start uploading the file through TeamSpeak 3's file transfer interface.
	 */
	public ftinitupload(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of running file transfers on the selected virtual server. The output contains the path to which a file is uploaded to, the current transfer rate in bytes per second, etc.
	 */
	public ftlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Renames a file in a channels file repository. If the two parameters tcid and tcpw are specified, the file will be moved into another channels file repository.
	 */
	public ftrenamefile(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Stops the running file transfer with server-side ID serverftfid.
	 */
	public ftstop(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Sends a text message to all clients on all virtual servers in the TeamSpeak 3 Server instance.
	 */
	public gm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays detailed configuration information about the server instance including uptime, number of virtual servers online, traffic information, etc.
	 */
	public hostinfo(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Changes the server instance configuration using given properties.
	 */
	public instanceedit(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays the server instance configuration including database revision number, the file transfer port, default group IDs, etc.
	 */
	public instanceinfo(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Writes a custom entry into the servers log. Depending on your permissions, you'll be able to add entries into the server instance log and/or your virtual servers log. The loglevel parameter specifies the type of the entry.
	 */
	public logadd(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a specified number of entries from the servers logfile. If instance is set to 1, the server will return lines from the master logfile (ts3server_0) instead of the selected virtual server logfile.
	 */
	public logview(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Sends an offline message to the client specified by cluid.
	 */
	public messageadd(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes an existing offline message with ID msgid from your inbox.
	 */
	public messagedel(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays an existing offline message with ID msgid from your inbox. Please note that this does not automatically set the flag_read property of the message.
	 */
	public messageget(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of offline messages you've received. The output contains the senders unique identifier, the messages subject, etc.
	 */
	public messagelist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Updates the flag_read property of the offline message specified with msgid. If flag is set to 1, the message will be marked as read.
	 */
	public messageupdateflag(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays detailed information about all assignments of the permission specified with permid. The output is similar to permoverview which includes the type and the ID of  the client, channel or group associated with the permission.
	 */
	public permfind(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays the current value of the permission specified with permid or permsid for your own connection. This can be useful when you need to check your own privileges.
	 */
	public permget(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays the database ID of one or more permissions specified by permsid.
	 */
	public permidgetbyname(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of permissions available on the server instance including ID, name and description.
	 */
	public permissionlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays all permissions assigned to a client for the channel specified with cid. If permid is set to 0, all permissions will be displayed. The output follows the following format:
	 * t={permType} id1={id1} id2={id2} p={permID} v={permValue} n={permNegated}  s={permSkip}|t={permType} id1={id1} id2={id2} p={permID} v={permValue}  n={permNegated} s={permSkip}|...
	 * The possible values for t, id1 and id2 are:
	  * 0: Server Group;    => id1={serverGroupID}, id2=0
	  * 1: Global Client;   => id1={clientDBID},    id2=0
	  * 2: Channel;         => id1={channelID},     id2=0
	  * 3: Channel Group;   => id1={channelID},     id2={channelGroupID}
	  * 4: Channel Client;  => id1={channelID},     id2={clientDBID}
	 */
	public permoverview(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Restores the default permission settings on the selected virtual server and creates a new initial administrator token. Please note that in case of an error during the permreset call - e.g. when the database has been modified or corrupted - the virtual server will be deleted from the database.
	 */
	public permreset(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Create a new token. If tokentype is set to 0, the ID specified with tokenid1 will be a server group ID. Otherwise, tokenid1 is used as a channel group ID and you need to provide a valid channel ID using tokenid2.
	The tokencustomset parameter allows you to specify a set of custom client properties. This feature can be used when generating tokens to combine a website account database with a TeamSpeak user. The syntax of the value needs to be escaped using the ServerQuery escape patterns and has to follow the general syntax of:
	ident=ident1 value=value1|ident=ident2 value=value2|ident=ident3 value=value3
	 */
	public privilegekeyadd(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes an existing token matching the token key specified with token.
	 */
	public privilegekeydelete(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of tokens available including their type and group IDs. Tokens can be used to gain access to specified server or channel groups.
	 * A token is similar to a client with administrator privileges that adds you to a certain permission group, but without the necessity of a such a client with administrator privileges to actually exist. It is a long (random looking) string that can be used as a ticket into a specific server group.
	 */
	public privilegekeylist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Use a token key gain access to a server or channel group. Please note that the server will automatically delete the token after it has been used.
	 */
	public privilegekeyuse(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Sends a text message a specified target. The type of the target is determined by targetmode while target specifies the ID of the recipient, whether it be a virtual server, a channel or a client.
	 */
	public sendtextmessage(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Creates a new virtual server using the given properties and displays its ID and initial administrator token. If virtualserver_port is not specified, the server will test for the first unused UDP port.
	 */
	public servercreate(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes the virtual server specified with sid. Please note that only virtual servers in stopped state can be deleted.
	 */
	public serverdelete(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Changes the selected virtual servers configuration using given properties.
	 */
	public serveredit(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Adds a client to the server group specified with sgid. Please note that a client cannot be added to default groups or template groups.
	 */
	public servergroupaddclient(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Creates a new server group using the name specified with name and displays its ID. The optional type parameter can be used to create ServerQuery groups and template groups.
	 */
	public servergroupadd(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Adds a set of specified permissions to the server group specified with sgid. Multiple permissions can be added by providing the four parameters of each permission. A permission can be specified by permid or permsid.
	 */
	public servergroupaddperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Adds a set of specified permissions to ALL regular server groups on all virtual servers. The target groups will be identified by the value of their i_group_auto_update_type permission specified with sgtype. Multiple permissions can be added at once. A permission can be specified by permid or permsid.
	 * The known values for sgtype are:
	 *  10: Channel Guest
	 *  15: Server Guest
	 *  20: Query Guest
	 *  25: Channel Voice
	 *  30: Server Normal
	 *  35: Channel Operator
	 *  40: Channel Admin
	 *  45: Server Admin
	 *  50: Query Admin
	 */
	public servergroupautoaddperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays the IDs of all clients currently residing in the server group specified with sgid. If you're using the -names option, the output will also contain the last known nickname and the unique identifier of the clients.
	 */
	public servergroupclientlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Creates a copy of the server group specified with ssgid. If tsgid is set to 0, the server will create a new group. To overwrite an existing group, simply set tsgid to the ID of a designated target group. If a target group is set, the name parameter will be ignored.
	 * The type parameter can be used to create ServerQuery and template groups.
	 */
	public servergroupcopy(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Removes a client from the server group specified with sgid.
	 */
	public servergroupdelclient(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes the server group specified with sgid. If force is set to 1, the server group will be deleted even if there are clients within.
	 */
	public servergroupdel(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Removes a set of specified permissions from the server group specified with sgid. Multiple permissions can be removed at once. A permission can be specified by permid or permsid.
	 */
	public servergroupdelperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Removes a set of specified permissions from ALL regular server groups on all virtual servers. The target groups will be identified by the value of their i_group_auto_update_type permission specified with sgtype. Multiple permissions can be removed at once. A permission can be specified by permid or permsid.
	 * The known values for sgtype are:
	 *  10: Channel Guest
	 *  15: Server Guest
	 *  20: Query Guest
	 *  25: Channel Voice
	 *  30: Server Normal
	 *  35: Channel Operator
	 *  40: Channel Admin
	 *  45: Server Admin
	 *  50: Query Admin
	 */
	public servergroupautodelperm(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of server groups available. Depending on your permissions, the output may also contain global ServerQuery groups and template groups.
	 */
	public servergrouplist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of permissions assigned to the server group specified with sgid.	The optional -permsid parameter can be used to get the permission names instead	of their internal ID.
	 */
	public servergrouppermlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Changes the name of the server group specified with sgid.
	 */
	public servergrouprename(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays all server groups the client specified with cldbid is currently residing in.
	 */
	public servergroupsbyclientid(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays the database ID of the virtual server running on the UDP port specified by virtualserver_port.
	 */
	public serveridgetbyport(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays detailed configuration information about the selected virtual server including unique ID, number of clients online, configuration, etc.
	 */
	public serverinfo(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of virtual servers including their ID, status, number of clients online, etc. If you're using the -all option, the server will list all virtual servers stored in the database. This can be useful when multiple server instances with different machine IDs are using the same database. The machine ID is used to identify the server instance a virtual server is associated with.
	 * The status of a virtual server can be either online, offline, booting up, shutting down and virtual online. While most of them are self-explanatory, virtual online is a bit more complicated. Whenever you select a virtual server which is currently stopped, it will be started in virtual mode which means you are able to change its configuration, create channels or change permissions, 	 * but no regular TeamSpeak 3 Client can connect. As soon as the last ServerQuery client deselects the virtual server, its status will be changed back to offline.
	 */
	public serverlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Registers for a specified category of events on a virtual server to receive notification messages. Depending on the notifications you've registered for, the server will send you a message on every event in the view of your ServerQuery client (e.g. clients joining your channel, incoming text messages, server configuration changes, etc). The event source is declared by the event parameter while id can be used to limit the notifications to a specific channel.
	 */
	public servernotifyregister(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Unregisters all events previously registered with servernotifyregister so you will no longer receive notification messages.
	 */
	public servernotifyunregister(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Stops the entire TeamSpeak 3 Server instance by shutting down the process.
	 */
	public serverprocessstop(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays detailed connection information about the selected virtual server including uptime, traffic information, etc.
	 */
	public serverrequestconnectioninfo(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a snapshot of the selected virtual server containing all settings, groups and known client identities. The data from a server snapshot can be used to restore a virtual servers configuration.
	 */
	public serversnapshotcreate(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Restores the selected virtual servers configuration using the data from a previously created server snapshot. Please note that the TeamSpeak 3 Server does NOT check for necessary permissions while deploying a snapshot so the command could be abused to gain additional privileges.
	 */
	public serversnapshotdeploy(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Starts the virtual server specified with sid. Depending on your permissions, you're able to start either your own virtual server only or any virtual server in the server instance.
	 */
	public serverstart(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Sets a new temporary server password specified with pw. The temporary password will be valid for the number of seconds specified with duration. The client connecting with this password will automatically join the channel specified with tcid. If tcid is set to 0, the client will join the default channel.
	 */
	public servertemppasswordadd(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes the temporary server password specified with pw.
	 */
	public servertemppassworddel(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Returns a list of active temporary server passwords. The output contains the clear-text password, the nickname and unique identifier of the creating client.
	 */
	public servertemppasswordlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Stops the virtual server specified with sid. Depending on your permissions, you're able to stop either your own virtual server only or all virtual servers in the server instance.
	 */
	public serverstop(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Sets the channel group of a client to the ID specified with cgid.
	 */
	public setclientchannelgroup(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Create a new token. If tokentype is set to 0, the ID specified with tokenid1 will be a server group ID. Otherwise, tokenid1 is used as a channel group ID and you need to provide a valid channel ID using tokenid2.
	 * The tokencustomset parameter allows you to specify a set of custom client properties. This feature can be used when generating tokens to combine a website account database with a TeamSpeak user. The syntax of the value needs to be escaped using the ServerQuery escape patterns and has to follow the general syntax of:
	 * ident=ident1 value=value1|ident=ident2 value=value2|ident=ident3 value=value3
	 */
	public tokenadd(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Deletes an existing token matching the token key specified with token.
	 */
	public tokendelete(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays a list of tokens available including their type and group IDs. Tokens can be used to gain access to specified server or channel groups.
	A token is similar to a client with administrator privileges that adds you to a certain permission group, but without the necessity of a such a client with administrator privileges to actually exist. It is a long (random looking) string that can be used as a ticket into a specific server group.
	 */
	public tokenlist(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Use a token key gain access to a server or channel group. Please note that the server will automatically delete the token after it has been used.
	 */
	public tokenuse(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays the servers version information including platform and build number.
	 */
	public version(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}

	/**
	 * Displays information about your current ServerQuery connection including the ID of the selected virtual server, your loginname, etc.
	 */
	public whoami(): Q.Promise<ts3.CallbackData<ts3.QueryResponseItem>>
	{
		throw new Error("Not implemented");
	}
}
