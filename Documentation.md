# Amazon Connect Streams Documentation
(c) 2018 Amazon.com, Inc.  All rights reserved.

## Overview
The Amazon Connect Streams API (Streams) gives you the power to integrate your
existing web applications with Amazon Connect.  Streams gives you the power to
embed the Contact Control Panel (CCP) UI components into your page, and/or
handle agent and contact state events directly giving you the power to control
agent and contact state through an object oriented event driven interface.  You
can use the built in interface or build your own from scratch: Streams gives you
the power to choose.

## Architecture
Click [here](Architecture.md) to view a quick architecture overview of how the 
Amazon Connect Streams API works.

## Getting Started
### Whitelisting
The first step to using the Streams API is to whitelist the pages you wish to embed.
For our customer's security, we require that all domains which embed the CCP for
a particular instance are explicitly whitelisted.  Each domain entry identifies
the protocol scheme, host, and port.  Any pages hosted behind the same protocol
scheme, host, and port will be allowed to embed the CCP components which are
required to use the Streams library.

To whitelist your pages:

1. Login to your AWS Account, then navigate to the Amazon Connect console.
2. Choose the instance alias of the instance to whitelist
   pages for to load the settings Overview page for your instance.
3. Choose "Application integration" link on the left.
4. Choose "+ Add Origin", then enter a domain URL, e.g.
   "https<nolink>://example.com", or "https<nolink>://example.com:9595" if your
   website is hosted on a non-standard port.

#### A few things to note:
* Whitelisted domains must be HTTPS.
* All of the pages that attempt to initialize the Streams library must be hosted
  on domains that are whitelisted as per the previous steps.
* All open tabs that contain an initialized Streams library or any other CCP
  tabs opened will be synchronized.  This means that state changes made in one
  open window will be communicated to all open windows.

### Downloading Streams
The next step to embedding Amazon Connect into your application is to download the
Streams library from GitHub.  You can do that by cloning our public repository
here:

```
$ git clone https://github.com/aws/amazon-connect-streams
```

Once you download streams, change into the directory and build it:

```
$ cd amazon-connect-streams
$ make
```

This will generate a file called `connect-streams-${VERSION}.js`, this is the full
Amazon Connect Streams API which you will want to include in your page.  You can serve
`connect-streams-${VERSION}.js` with your web application.

### Build your own with NPM
Install latest LTS version of [NodeJS](https://nodejs.org)

You will also need to have `gulp` installed. You can install `gulp` globally.

```
$ npm install -g gulp
$ git clone https://github.com/aws/amazon-connect-streams
$ cd amazon-connect-streams
$ npm install
$ gulp 
```

Find build artifacts in **release** directory -  This will generate a file called `connect-streams.js` and the minified version of the same `connect-streams-min.js`  - this is the full Connect Streams API which you will want to include in your page.

To run unit tests:
```
$ gulp test
```

## Initialization
Initializing the Streams API is the first step to verify that you have
everything set up correctly and that you are able to listen for events.

### `connect.core.initCCP()`
```
connect.core.initCCP(containerDiv, {
   ccpUrl:        ccpUrl,        /*REQUIRED*/
   loginPopup:    true,          /*optional, default TRUE*/
   loginUrl:      loginUrl,      /*optional*/
   softphone:     {              /*optional*/
      disableRingtone:  true,    /*optional*/
      ringtoneUrl: ringtoneUrl   /*optional*/
   }
});
```
Integrates with Amazon Connect by loading the pre-built CCP located at `ccpUrl` into an
iframe and placing it into the `containerDiv` provided.  API requests are
funneled through this CCP and agent and contact updates are published through it
and made available to your JS client code.
* `ccpUrl`: The URL of the CCP.  This is the page you would normally navigate to
  in order to use the CCP in a standalone page, it is different for each
  instance.
* `loginPopup`: Optional, defaults to `true`.  Set to `false` to disable the login
  popup which is shown when the user's authentication expires.
* `loginUrl`: Optional.  Allows custom URL to be used to initiate the ccp, as in
  the case of SAML authentication.
* `softphone`: This object is optional and allows you to specify some settings
  surrounding the softphone feature of Connect.
  * `allowFramedSoftphone`: Normally, the softphone microphone and speaker
    components are not allowed to be hosted in an iframe.  This is because the
    softphone must be hosted in a single window or tab.  The window hosting
    the softphone session must not be closed during the course of a softphone
    call or the call will be disconnected.  If `allowFramedSoftphone` is `true`,
    the softphone components will be allowed to be hosted in this window or tab.
  * `disableRingtone`: This option allows you to completely disable the built-in
    ringtone audio that is played when a call is incoming.
  * `ringtoneUrl`: If the ringtone is not disabled, this allows for overriding
    the ringtone with any browser-supported audio file accessible by the user.

#### A few things to note:
* You have the option to show or hide the pre-built UI by showing or hiding the
`containerDiv` into which you place the iframe, or applying a CSS rule like
this:
```
.containerDiv iframe {
   display: none;
}
```
* The pre-built CCP UI is portrait oriented and capable of contracting
  horizontally to fit smaller widths.  It can expand from a width of 200px to
  a maximum of 320px based on the size of its container div.  If the CCP is
  placed into a container where it would be sized under 221px in width, the CCP
  switches to a different layout style with smaller buttons and fonts.
* In its normal larger style, the CCP is 465px tall.  In its smaller form, the
  CCP is reduced to 400px tall.
* CSS styles you add to your site will NOT be applied to the CCP because it is
  rendered in an iframe.

### Event Subscription
Event subscriptions link your app into the heartbeat of Amazon Connect by allowing your
code to be called when new agent information is available.

Event subscription works by providing callbacks to the Streams API which are
called when the agent is initialized, and when contacts are first detected.
Then, `on*()` event subscription methods are provided with callbacks which are
called when events occur on those specific objects.  These return subscription
objects, which for contacts are automatically cleaned up when those contacts no
longer exist.  Users can also manually unsubscribe from events by calling
`sub.unsubscribe()` on the subscriptions returned by these methods.

### `connect.agent()`
```
connect.agent(function(agent) { ... });
```
Subscribe a method to be called when the agent is initialized.  If the agent has
already been initalized, the call is synchronous and the callback is invoked
immediately.  Otherwise, the callback is invoked once the first agent data is
received from upstream.  This callback is provided with an `Agent` API object,
which can also be created at any time after initialization is complete via `new
connect.Agent()`.

### `connect.contact()`
```
connect.contact(function(contact) { ... });
```
Subscribe a method to be called for each newly detected agent contact.  Note
that this function is not only for incoming contacts, but for contacts which
already existed when Streams was initialized, such as from a previous agent
session.  This callback is provided with a `Contact` API object for this
contact.  `Contact` API objects can also be listed from the `Agent` API by
calling `agent.getContacts()`.

## Agent API
The Agent API provides event subscription methods and action methods which can
be called on behalf of the agent.  There is only ever one agent per Streams
instantiation and all contacts and actions are assumed to be taken on behalf of
this one agent.

### `agent.onRefresh()`
```
agent.onRefresh(function(agent) { ... });
```
Subscribe a method to be called whenever new agent data is available.

### `agent.onStateChange()`
```
agent.onStateChange(function(agentStateChange) { ... });
```
Subscribe a method to be called when the agent's state changes. The
`agentStateChange` object contains the following properties:

* `agent`: The Agent object.
* `newState`: The name of the agent's new state.
* `oldState`: The name of the agent's previous state.

### `agent.onRoutable()`
```
agent.onRoutable(function(agent) { ... });
```
Subscribe a method to be called when the agent becomes routable, meaning
that they can be routed incoming contacts.

### `agent.onNotRoutable()`
```
agent.onNotRoutable(function(agent) { ... });
```
Subscribe a method to be called when the agent becomes not-routable, meaning
that they are online but cannot be routed incoming contacts.

### `agent.onOffline()`
```
agent.onOffline(function(agent) { ... });
```
Subscribe a method to be called when the agent goes offline.

### `agent.onError()`
```
agent.onError(function(agent) { ... });
```
Subscribe a method to be called when the agent is put into an error state.  This
can occur if Streams is unable to get new agent data, or if the agent fails to
accept an incoming contact, or in other error cases.  It means that the agent is
not routable, and may require that the agent switch to a routable state before
being able to be routed contacts again.

### `agent.onAfterCallWork()`
```
agent.onAfterCallWork(function(agent) { ... });
```
Subscribe a method to be called when the agent enters the "After Call Work" (ACW) state.  This is a non-routable state which exists to allow agents some time to wrap up after handling a contact before they are routed additional contacts.

### `agent.getState()`
```
var state = agent.getState()
```
Get the agent's current `AgentState` object indicating their availability state type.
This object contains the following fields:

* `name`: The name of the agent's current availability state.
* `type`: The agent's current availability state type, as per the `AgentStateType` enumeration.
* `duration`: A relative local state duration.  To get the actual duration of the state relative
  to the current time, use `agent.getStateDuration()`.

### `agent.getStateDuration()`
```
var millis = agent.getStateDuration();
```
Get the duration of the agent's state in milliseconds relative to local time.  This takes into
account time skew between the JS client and the Amazon Connect service.

### `agent.getPermissions()`
```
var permissions = agent.getPermissions();
```
Mostly for internal purposes only.  Contains strings which indicates actions that the agent can
take in the CCP.

### `agent.getContacts()`
```
var contacts = agent.getContacts(contactTypeFilter);
```
Gets a list of `Contact` API objects for each of the agent's current contacts.

* `contactTypeFilter`: Optional.  If provided, only contacts of the given type are returned.

### `agent.getConfiguration()`
```
var config = agent.getConfiguration();
```
Gets the full `AgentConfiguration` object for the agent.  This object contains the following fields:

* `name`: The agent's user friendly display name.
* `softphoneEnabled`: Indicates whether the agent's phone calls should route to the agent's
  browser-based softphone or the telephone number configured as the agent's extension.
* `extension`: Indicates the phone number that should be dialed to connect the agent to their
  inbound or outbound calls when softphone is not enabled.
* `routingProfile`: Describes the agent's current routing profile and list of
  queues therein. See `agent.getRoutingProfile()` for more info.
* `username`: The username for the agent as entered in their Amazon Connect user account.

### `agent.getAgentStates()`
```
var agentStates = agent.getAgentStates();
```
Gets the list of selectable `AgentState` API objects.  These are the agent states that can be
selected when the agent is not handling a live contact.  Each `AgentState` object contains
the following fields:

* `type`: The `AgentStateType` associated with this agent state.
* `name`: The name of the agent state to be displayed in the UI.

### `agent.getRoutingProfile()`
```
var routingProfile = agent.getRoutingProfile();
```
Gets the agent's routing profile.  The routing profile contains the following fields:

* `name`: The name of the routing profile.
* `queues`: The queues contained in the routing profile.
* `defaultOutboundQueue`: The default queue which should be associated with outbound contacts.

### `agent.getName()`
```
var name = agent.getName();
```
Gets the agent's user friendly display name from the `AgentConfiguration` object for the agent.

### `agent.getExtension()`
```
var extension = agent.getExtension();
```
Gets the agent's phone number from the `AgentConfiguration` object for the agent.  This is the phone
number that is dialed by Amazon Connect to connect calls to the agent for incoming and outgoing calls if
softphone is not enabled.

### `agent.isSoftphoneEnabled()`
```
if (agent.isSoftphoneEnabled()) { ... }
```
Determine if softphone is enabled for the agent.

### `agent.setConfiguration()`
```
var config = agent.getConfiguration();
config.extension = "+12061231234";
config.softphoneEnabled = false;
agent.setConfiguration(config {
   success: function() { ... },
   failure: function() { ... }
});
```
Updates the agents configuration with the given `AgentConfiguration` object.  The phone number specified must be in E.164 format or the update fails.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `agent.setState()`
```
var routableState = agent.getAgentStates().filter(function(state) {
   return state.type === AgentStateType.ROUTABLE;
})[0];
agent.setState(routableState, {
   success: function() { ... },
   failure: function() { ... }
});
```
Set the agent's current availability state.  Can only be performed if the agent is not handling a live contact.

You can optionally provide success and failure callbacks to determine whether the
operation succeeded.

### `agent.connect()`
```
agent.connect(endpoint, {
   queueARN: QUEUE_ARN,
   success: function() { ... },
   failure: function() { ... }
});
```
Creates an outbound contact to the given endpoint.  You can optionally provide a queueARN to associate the contact with a queue.

You can optionally provide success and failure callbacks to determine whether the
operation succeeded.

### `agent.toSnapshot()`
```
var snapshot = agent.toSnapshot();
```
The data behind the `Agent` API object is ephemeral and changes whenever new data is provided. This method
provides an opportunity to create a snapshot version of the `Agent` API object and save it for future use,
such as adding to a log file or posting elsewhere.


### `agent.mute()`
```
agent.mute();
```
Sets the agent local media to mute mode.


### `agent.unmute()`
```
agent.unmute();
```
Sets the agent localmedia to unmute mode.

### `agent.onMuteToggle()`
```
agent.onMuteToggle(function(obj) { //obj.muted provides the current status of the agent });
```
Subscribe a method to be called when the agent updates the mute status, meaning
that agents mute/unmute APIs are called and the local media stream is succesfully updated with the new status. 

## Contact API
The Contact API provides event subscription methods and action methods which can be called on behalf of a specific
contact.  Contacts come and go and so should these API objects.  It is good practice not to persist these objects
or keep them as internal state.  If you need to, store the `contactId` of the contact and make sure that the
contact still exists by fetching it from the `Agent` API object before calling methods on it.

### `contact.onRefresh()`
```
contact.onRefresh(function(contact) { ... });
```
Subscribe a method to be invoked whenever the contact is updated.

### `contact.onIncoming()`
```
contact.onIncoming(function(contact) { ... });
```
Subscribe a method to be invoked when the contact is incoming.  In this state, the contact is waiting to be
accepted if it is a softphone call or is waiting for the agent to answer if it is not a softphone call.

### `contact.onAccepted()`
```
contact.onAccepted(function(contact) { ... });
```
Subscribe a method to be invoked whenever the contact is accepted.  This is an event which is fired in response
to an API call when it succeeds, and this is usually triggered by a UI interaction such as clicking an
accept button.  The proper response to this API is to stop playing ringtones and remove any Accept UI buttons
or actions, and potentially show an "Accepting..." UI to the customer.

### `contact.onEnded()`
```
contact.onEnded(function() { ... });
```
Subscribe a method to be invoked whenever the contact is ended or destroyed.  This could be due to the conversation
being ended by the agent, or due to the contact being missed.  Call `contact.getState()` to determine the state
of the contact and take appropriate action.

### `contact.onConnected()`
```
contact.onConnected(function() { ... });
```
Subscribe a method to be invoked when the contact is connected.

### `contact.getContactId()`
```
var contactId = contact.getContactId();
```
Get the unique contactId of this contact.

### `contact.getOriginalContactId()`
```
var originalContactId = contact.getOriginalContactId();
```
Get the original contact id from which this contact was transferred, or none if this is not an internal Connect transfer.
This is typically a contact owned by another agent, thus this agent will not be able to
manipulate it.  It is for reference and association purposes only, and can be used to share
data between transferred contacts externally if it is linked by originalContactId.

### `contact.getType()`
```
var type = contact.getType();
```
Get the type of the contact.  This indicates what type of media is carried over the connections of the contact.

### `contact.getState()`
```
var state = contact.getState();
```
Get a `ContactState` object representing the state of the contact.  This object has the following fields:

* `type`: The contact state type, as per the `ContactStateType` enumeration.
* `duration`: A relative local state duration.  To get the actual duration of the state relative
  to the current time, use `contact.getStateDuration()`.

### `contact.getStateDuration()`
```
var millis = contact.getStateDuration();
```
Get the duration of the contact state in milliseconds relative to local time.  This takes into
account time skew between the JS client and the Amazon Connect backend servers.

### `contact.getQueue()`
```
var queue = contact.getQueue();
```
Get the queue associated with the contact.  This object has the following fields:

* `queueARN`: The ARN of the queue to associate with the contact.
* `name`: The name of the queue.

### `contact.getConnections()`
```
var conns = contact.getConnections();
```
Get a list containing `Connection` API objects for each connection in the contact.

### `contact.getInitialConnection()`
```
var initialConn = contact.getInitialConnection();
```
Get the initial connection of the contact.

### `contact.getActiveInitialConnection()`
```
var initialConn = contact.getActiveInitialConnection();
```
Get the inital connection of the contact, or null if the initial connection is
no longer active.

### `contact.getThirdPartyConnections()`
```
var thirdPartyConns = contact.getThirdPartyConnections();
```
Get a list of all of the third-party connections, i.e. the list of all connections
except for the initial connection, or an empty list if there are no third-party connections.

### `contact.getSingleActiveThirdPartyConnection()`
```
var thirdPartyConn = contact.getSingleActiveThirdPartyConnection();
```
In Voice contacts, there can only be one active third-party connection.  This
method returns the single active third-party connection, or null if there are no
currently active third-party connections.

### `contact.getAgentConnection()`
```
var agentConn = contact.getAgentConnection();
```
Gets the agent connection.  This is the connection that represents the agent's
participation in the contact.

### `contact.getAttributes()`
```
var attributeMap = contact.getAttributes();
```
Get a map from attribute name to value for each attribute associated with the contact.

### `contact.isSoftphoneCall()`
```
if (contact.isSoftphoneCall()) { ... }
```
Determine whether this contact is a softphone call.

### `contact.isInbound()`
```
if (contact.isInbound()) { ... }
```
Determine whether this is an inbound or outbound contact.

### `contact.isConnected()`
```
if (contact.isConnected()) { ... }
```
Determine whether the contact is in a connected state.

Note that contacts no longer exist once they have been removed.  To detect
these instances, subscribe to the `contact.onEnded()` event for the contact.

### `contact.accept()`
```
contact.accept({
   success: function() { ... },
   failure: function() { ... }
});
```
Accept an incoming contact.

Optional success and failure callbacks can be provided to determine whether the operation was successful.

### `contact.destroy()`
```
contact.destroy({
   success: function() { ... },
   failure: function() { ... }
});
```
Close the contact and all of its associated connections.  If the contact is a voice contact, and
there is a third-party, the customer remains bridged with the third party and will not
be disconnected from the call. Otherwise, the agent and customer are disconnected.

Optional success and failure callbacks can be provided to determine whether the operation was successful.

### `contact.notifyIssue()`
```
contact.notifyIssue(issueCode, description, {
   success: function() { ... },
   failure: function() { ... }
});
```
Provide diagnostic information for the contact in the case something exceptional happens on the front end.
The Streams logs will be published along with the issue code and description provided here.

* `issueCode`: An arbitrary issue code to associate with the diagnostic report.
* `description`: A description to associate with the diagnostic report.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.addConnection()`
```
contact.addConnection(endpoint, {
   success: function() { ... },
   failure: function() { ... }
});
```
Add a new outbound third-party connection to this contact and connect it to the specified endpoint.

Optional success and failure callbacks can be provided to determine whether the operation was successful.

### `contact.toggleActiveConnections()`
```
contact.toggleActiveConnections({
   success: function() { ... },
   failure: function() { ... }
});
```
Rotate through the connected and on hold connections of the contact. This operation is only valid
if there is at least one third-party connection and the initial connection is still connected.

Optional success and failure callbacks can be provided to determine whether the operation was successful.

### `contact.conferenceConnections()`
```
contact.conferenceConnections({
   success: function() { ... },
   failure: function() { ... }
});
```
Conference together the active connections of the conversation. This operation is only valid
if there is at least one third-party connection and the initial connection is still connected.

Optional success and failure callbacks can be provided to determine whether the operation was successful.

## Connection API
The Connection API provides action methods (no event subscriptions) which can be called to manipulate the state
of a particular connection within a contact.  Like contacts, connections come and go. It is good practice not
to persist these object or keep them as internal state. If you need to, store the `contactId` and `connectionId`
of the connection and make sure that the contact and connection still exist by fetching them in order from
the `Agent` API object before calling methods on them.

### `connection.getContactId()`
```
var contactId = connection.getContactId();
```
Gets the unique contactId of the contact to which this connection belongs.

### `connection.getConnectionId()`
```
var connectionId = connection.getConnectionId();
```
Gets the unique connectionId for this connection.

### `connection.getEndpoint()`
```
var endpoint = connection.getEndpoint();
```
Gets the endpoint to which this connection is connected.

### `connection.getState()`
```
var state = connection.getState();
```
Gets the `ConnectionState` object for this connection.  This object has the
following fields:

* `type`: The connection state type, as per the `ConnectionStateType` enumeration.
* `duration`: A relative local state duration. To get the actual duration of
  the state relative to the current time, use `connection.getStateDuration()`.

### `connection.getStateDuration()`
```
var millis = connection.getStateDuration();
```
Get the duration of the connection state, in milliseconds, relative to local time.
This takes into account time skew between the JS client and the Amazon Connect service.

### `connection.getType()`
```
var type = connection.getType()
```
Get the type of connection. This value is either "inbound", "outbound", or "monitoring".

### `connection.isInitialConnection()`
```
if (conn.isInitialConnection()) { ... }
```
Determine if the connection is the contact's initial connection.

### `connection.isActive()`
```
if (conn.isActive()) { ... }
```
Determine if the contact is active.  The connection is active it is incoming, connecting, connected, or on hold.

### `connection.isConnected()`
```
if (conn.isConnected()) { ... }
```
Determine if the connection is connected, meaning that the agent is live in a conversation through this connection.

### `connection.isConnecting()`
```
if (conn.isConnecting()) { ... }
```
Determine whether the connection is in the process of connecting.

### `connection.isOnHold()`
```
if (conn.isOnHold()) { ... }
```
Determine whether the connection is on hold.

### `connection.destroy()`
```
conn.destroy({
   success: function() { ... },
   failure: function() { ... }
});
```
Ends the connection.

Optional success and failure callbacks can be provided to determine whether the operation was successful.

### `connection.sendDigits()`
```
conn.sendDigits(digits, {
   success: function() { ... },
   failure: function() { ... }
});
```

Send a digit or string of digits through this connection.

This is only valid for contact types that can accept digits,
currently this is limited to softphone-enabled voice contacts.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `connection.hold()`
```
conn.hold({
   success: function() { ... },
   failure: function() { ... }
});
```
Put this connection on hold.

Optional success and failure callbacks can be provided to determine whether the operation was successful.

### `connection.resume()`
```
conn.resume({
   success: function() { ... },
   failure: function() { ... }
});
```
Resume this connection if it was on hold.

Optional success and failure callbacks can be provided to determine whether the operation was successful.

## Utility Functions
### `Endpoint.byPhoneNumber()` (static function)
```
var endpoint = Endpoint.byPhoneNumber("2061231234");
```
Creates an `Endpoint` object for the given phone number, useful for `agent.connect()` and
`contact.addConnection()` calls.

### `connect.hitch()`
```
agent.onRefresh(connect.hitch(eventHandler, eventHandler._onAgentRefresh));
```
A useful utility function for creating callback closures that bind a function to an object instance.
In the above example, the "_onAgentRefresh" function of the "eventHandler" will be called when the
agent is refreshed.

## Enumerations
These enumerations are not strictly required but are very useful and helpful for
the Streams API.  They are used extensively by the built-in CCP.

### `AgentStateType`
This enumeration lists the different types of agent states.

* `AgentStateType.INIT`: The agent state hasn't been initialized yet.
* `AgentStateType.ROUTABLE`: The agent is in a state where they can be routed contacts.
* `AgentStateType.NOT_ROUTABLE`: The agent is in a state where they cannot be routed contacts.
* `AgentStateType.OFFLINE`: The agent is offline.

### `EndpointType`
This enumeration lists the different types of endpoints.

* `EndpointType.PHONE_NUMBER`: An endpoint pointing to a phone number.
* `EndpointType.AGENT`: An endpoint pointing to an agent in the same instance.
* `EndpointType.QUEUE`: An endpoint pointing to a queue call flow in the same instance.

### `ConnectionType`
Lists the different types of connections.

* `ConnectionType.AGENT`: The agent connection.
* `ConnectionType.INBOUND`: An inbound connection, usually representing an inbound call.
* `ConnectionType.OUTBOUND`: An outbound connection, representing either an outbound call or additional connection added to the contact.
* `ConnectionType.MONITORING`: A special connection type representing a manager listen-in session.

### `ContactStateType`
An enumeration listing the different high-level states that a contact can have.

* `ContactStateType.INCOMING`: Indicates that the contact is incoming and is waiting for acceptance.  This state is skipped for `ContactType.VOICE` contacts but is essential for `ContactType.QUEUE_CALLBACK` contacts.
* `ContactStateType.CONNECTING`: Indicates that the contact is currently connecting.  For `ContactType.VOICE` contacts, this is when the user will accept the incoming call.  For all other types, the contact will be accepted during the `ContactStateType.INCOMING` state.
*
### `ConnectionStateType`
An enumeration listing the different states that a connection can have.

* `ConnectionStateType.CONNECTING`: The connection has not yet been initialized.
* `ConnectionStateType.CONNECTED`: The connection is connected to the contact.
* `ConnectionStateType.HOLD`: The connection is connected but on hold.
* `ConnectionStateType.DISCONNECTED`: The connection is no longer connected to the contact.

### `ContactType`
This enumeration lists all of the contact types supported by Connect Streams.

* `ContactType.VOICE`: Normal incoming and outgoing voice calls.
* `ContactType.QUEUE_CALLBACK`: Special outbound voice calls which are routed to agents before being placed.  For more information about how to setup and use queued callbacks, see the Amazon Connect user documentation.

### `EventType`
This is a list of some of the special event types which are published into the low-level
`EventBus`.

* `EventType.ACKNOWLEDGE`: Event received when the backend API shared worker acknowledges the current tab.
* `EventType.ACK_TIMEOUT`: Event which is published if the backend API shared worker fails to respond to an `EventType.SYNCHRONIZE` event in a timely manner, meaning that the tab or window has been disconnected from the shared worker.
* `EventType.AUTH_FAIL`: Event published indicating that the most recent API call returned a status header indicating that the current user authentication is no longer valid.  This usually requires the user to log in again for the CCP to continue to function.  See `connect.initCCP()` under **Initialization** for more information about automatic login popups which can be used to give the user the chance to log in again when this happens.
* `EventType.LOG`: An event published whenever the CCP or the API shared worker creates a log entry.

#### Note
The `EventBus` is used by the high-level subscription APIs to manage subscriptions
and is available to users by calling `connect.core.getEventBus()`.  Like the other event subscription APIs, calling `eventBus.subscribe(eventName, callback)` will return a subscription object which can be unsubscribed via `sub.unsubscribe()`.

## Streams Logger
The Streams library comes with a logging utility that can be used to easily gather logs and provide
them for diagnostic purposes.  You can even add your own logs to this logger if you prefer.  Logs are
written to the console log per normal and also kept in memory.

### `connect.getLog()`
```
connect.getLog().warn("The %s broke!", "widget")
   .withException(e)
   .withObject({a: 1, b: 2});
```
Use `connect.getLog()` to get the global logger instance.  You can then call one of the `debug`, `info`, `warn` or `error`
methods to create a new log entry.  The logger accepts printf-style parameter interpolation for strings and number
forms.

Each of these functions returns a `LogEntry` object, onto which additional information can be added.  You can call
`.withException(e)` and pass an exception (`e`) to add stack trace and additional info to the logs, and you can
call `.withObject(o)` to add an arbitrary object (`o`) to the logs.

Finally, you can trigger the logs to be downloaded to the agent's machine in JSON form by calling `connect.getLog().download()`.

## CCP Error Logging
The following errors are related to connectivity in the CCP. These errors are logged in the CCP logs when they occur.

### `unsupported_browser` 
Agent is using an unsupported browser. Only the latest 3 versions of Chrome or Firefox is supported. Upgrade the agent's browser to resolve this error. See [Supported browsers](https://docs.aws.amazon.com/connect/latest/adminguide/what-is-amazon-connect.html#browsers)  for more information.

### `microphone_not_shared`
The microphone does not have permission for the site on which the CCP is running. For Google Chrome steps, see [Use your camera and microphone in Chrome](https://support.google.com/chrome/answer/2693767?hl=en). For Mozilla Firefox steps, see [Firefox Page Info window](https://support.mozilla.org/en-US/kb/firefox-page-info-window).

### `signalling_handshake_failure`
Error connecting the CCP to the telephony system. To resolve, try the action again, or wait a minute and then retry. If the issue persists, contact support.

### `signalling_connection_failure`
Internal connection error occurred. To resolve, try the action again, or wait a minute and then retry. If the issue persists, contact support.

### `ice_collection_timeout`
Error connecting to the media service. To resolve, try the action again, or wait a minute and then retry. If the issue persists, contact support.

### `user_busy_error`
Agent has the CCP running in 2 distinct browsers at the same time, such as Chrome and Firefox. Use only one browser at a time to log in to the CCP.

### `webrtc_error`
An issue occurred due to either using an unsupported browser, or a required port/protocol is not open, such as not allowing UDP on port 443. To resolve, confirm that the agent is using a supported browser, and that all traffic is allowed for all required ports and protocols. See [CCP Networking](https://docs.aws.amazon.com/connect/latest/adminguide/troubleshooting.html#ccp-networking) and [Phone Settings](https://docs.aws.amazon.com/connect/latest/userguide/agentconsole-guide.html#phone-settings) for more information. 

### `realtime_communication_error`
An internal communication error occurred. 

## Agent States Logging
The following agent states are logged in the CCP logs when they occur.

### `AgentHungUp`
Agent hung up during the active call. 

### `BadAddressAgent`
Error routiung the call to an agent. Attempt the action again. If the problem persists, contact support.

### `BadAddressCustomer`
The phone number could not be dialed due to an invalid number or an issue with the telephony provider. Confirm that the phone number is a valid phone number. Attempt to dial the number from another device to confirm whether the call is successful.

### `FailedConnectAgent`
Failed to connect the call to the agent. Attempt the action again. If the issue persists, contact support.

### `FailedConnectCustomer`
Failed to connect the call to the customer. Attempt the action again. If the issue persists, contact support.

### `LineEngagedAgent`
Agent line was not available when the call was attempted.

### `LineEngagedCustomer`
Customer line was not available when the call was attempted.

### `MissedCallAgent`
Agent did not pick up the call, either due to a technical issue or becasue the agent did accept the call.

### `MissedCallCustomer`
The customer did not answer a callback. Queued callbacks are retried the number of times specified in the Transfer to queue block. Increase the number of retries.

### `MultipleCcpWindows`
The agent has the CCP open in multiple distinct browsers, such as Firefox and Chrome, at the same time. To resolve, use only one browser to log in to the CCP.

### `RealtimeCommunicationError`
An internal communication error occurred.

### `ERROR Default`
All errors not otherwsie defined.
