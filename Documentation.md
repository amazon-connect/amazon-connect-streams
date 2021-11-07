# Amazon Connect Streams Documentation
(c) 2018-2020 Amazon.com, Inc. All rights reserved.

### A note on "Routability"
Note that routability in streams is only affected by agent statuses. Voice contacts will change the agent status, and thus can affect routability. Task and chat contacts do not affect routability. However, if the other channels hit their concurrent live contact limit(s), the agent will not be routed more contacts, but they will technically be in a routable agent state.

# Important Announcements
1. September 2021 - 1.7.0 comes with changes needed to use Amazon Connect Voice ID, which launched on 9/27/2021. For customers who want to use Voice ID, please upgrade Streams to version 1.7.0 or later in the next 1 month, otherwise the Voice ID APIs will stop working by the end of October 2021. For more details on the Voice ID APIs, please look at [the Voice ID APIs section](#voice-id-apis).
2. July 2021 - We released a change to the CCP that lets agent set a next status such as Lunch or Offline while still on a contact, and indicate they don’t want to be routed new contacts while they finish up their remaining work. For more details on this feature, see the [Amazon Connect agent training guide](https://docs.aws.amazon.com/connect/latest/adminguide/set-next-status.html) and [the feature's release notes](https://docs.aws.amazon.com/connect/latest/adminguide/amazon-connect-release-notes.html#july21-release-notes). If your agents interact directly with Connect’s out-of-the-box CCPV2 UX, they will be able to access this feature by default. Otherwise, if your streamsJS application calls `agent.setState()` to switch agent status, you will need to update your code to use this feature:
    *  **Agent.setState()** has been updated so you can pass an optional flag `enqueueNextState: true` to trigger the Next Status behavior. 
    * A new **agent.onEnqueuedNextState()** listener lets you subscribe to events for when agents have selected/successfully enqueued their next status.
    * A new **agent.getNextState()** API returns a state object if the agent has successfully selected a next state, and null otherwise. 
    * If you want to use the Next Status feature via `agent.setState()`, please also ensure that your code is using `contact.clear()` and not `contact.complete()` when clearing After Contact Work off a contact.
3. December 2020 —  1.6.0 brings with it the release of a new Agent App API. In addition to the CCP, customers can now embed additional applications using connect.agentApp, including Customer Profiles and Wisdom. See the [updated documentation](#initialization-for-ccp-customer-profiles-and-wisdom) for details on usage. We are also introducing a preview release for Amazon Connect Voice ID.
    * ### About Amazon Connect Customer Profiles
        + Amazon Connect Customer Profiles provides pre-built integrations so you can quickly combine customer information from multiple external applications, with contact history from Amazon Connect. This allows you to create a customer profile that has all the information agents need during customer interactions in a single place. See the [detailed documentation](https://docs.aws.amazon.com/connect/latest/adminguide/customer-profiles.html).
    * ### About Amazon Connect Wisdom
        + With Amazon Connect Wisdom, agents can search and find content across multiple repositories, such as frequently asked questions (FAQs), wikis, articles, and step-by-step instructions for handling different customer issues. They can type questions or phrases in a search box (such as, "how long after purchase can handbags be exchanged?") without having to guess which keywords will work.
    * ### About Amazon Connect Voice ID (this feature is in preview release for Amazon Connect and is subject to change)
        + Amazon Connect Voice ID provides real-time caller authentication which makes voice interactions in contact centers more secure and efficient. Voice ID uses machine learning to verify the identity of genuine customers by analyzing a caller’s unique voice characteristics. This allows contact centers to use an additional security layer that doesn’t rely on the caller answering multiple security questions, and makes it easy to enroll and verify customers without changing the natural flow of their conversation.
4. July 2020 -- We recently changed the new, omnichannel, CCP's behavior when it encounters three voice-only agent states: `FailedConnectAgent`, `FailedConnectCustomer`, and `AfterCallWork`. 
    * `FailedConnectAgent` -- Previously, we required the agent to click the "Clear Contact" button to clear this state. When the agent clicked the "Clear Contact" button, the previous behavior took the agent back to the `Available` state without fail. Now the `FailedConnectAgent` state will be "auto-cleared", much like `FailedConnectCustomer` always has been. 
    * `FailedConnectAgent` and `FailedConnectCustomer` -- We are now using the `contact.clear()` API to auto-clear these states. As a result, the agent will be returned to their previous visible agent state (e.g. `Available`). Previously, the agent had always been set to `Available` as a result of this "auto-clearing" behavior. Note that even custom CCPs will behave differently with this update for `FailedConnectAgent` and `FailedConnectCustomer`.
    * `AfterCallWork` -- As part of the new `contact.clear()` behavior, clicking "Clear Contact" while in `AfterCallWork` will return the agent to their previous visible agent state (e.g. `Available`, etc.). Note that custom CCPs that implement their own After Call Work behavior will not be affected by this change.
        * We are putting `contact.complete()` on a deprecation path. Therefore, you should start using `contact.clear()` in its place. If you want to emulate CCP's After Call Work behavior in your customer CCP, then make sure you use `contact.clear()` when clearing voice contacts. 

## Overview
The Amazon Connect Streams API (Streams) gives you the power to integrate your existing web applications with Amazon Connect.  Streams lets you embed the Contact Control Panel (CCP) and Customer Profiles app UI into your page.  It also enables you to handle agent and contact state events directly through an object oriented event driven interface.  You can use the built in interface or build your own from scratch: Streams gives you the choice.

This library must be used in conjunction with [amazon-connect-chatjs](https://github.com/amazon-connect/amazon-connect-chatjs) or [amazon-connect-taskjs](https://github.com/amazon-connect/amazon-connect-taskjs) in order to utilize Amazon Connect's Chat or Task functionality.

## Architecture
Click [here](Architecture.md) to view a quick architecture overview of how the
Amazon Connect Streams API works.

## Getting Started

### Upgrading to the Latest Version of the CCP (AKA /ccp-v2)?
If you are migrating to the new CCP, we encourage you to upgrade to the latest version of this repository. You should also upgrade to [the latest version of RTC-JS](https://github.com/aws/connect-rtc-js) as well, if you are using it. For a complete migration guide to the new CCP, and to fully understand the differences when using Streams with the new CCP, please see this post: https://docs.aws.amazon.com/connect/latest/adminguide/upgrade-to-latest-ccp.html. Also see: https://docs.aws.amazon.com/connect/latest/adminguide/upgrade-ccp-streams-api.html.

### Allowlisting
The first step to using the Streams API is to allowlist the pages you wish to embed.
For our customer's security, we require that all domains which embed the CCP for
a particular instance are explicitly allowlisted. Each domain entry identifies
the protocol scheme, host, and port. Any pages hosted behind the same protocol
scheme, host, and port will be allowed to embed the CCP components which are
required to use the Streams library.

To allowlist your pages:

1. Login to your AWS Account, then navigate to the Amazon Connect console.
2. Choose the instance alias of the instance to allowlist
   pages for to load the settings Overview page for your instance.
3. Choose "Application integration" link on the left.
4. Choose "+ Add Origin", then enter a domain URL, e.g.
   "https<nolink>://example.com", or "https<nolink>://example.com:9595" if your
   website is hosted on a non-standard port.

#### A few things to note:
* Allowlisted domains must be HTTPS.
* All of the pages that attempt to initialize the Streams library must be hosted
  on domains that are allowlisted as per the previous steps.
* All open tabs that contain an initialized Streams library or any other CCP
  tabs opened will be synchronized. This means that state changes made in one
  open window will be communicated to all open windows.
* Using multiple browsers at the same time for the same connect instance is not supported, and causes issues with the rtc communication.


## Downloading Streams with npm

`npm install amazon-connect-streams`

## Importing Streams with npm and ES6

`import "amazon-connect-streams";`

This will make the `connect` variable available in the current context.

## Usage with TypeScript

`amazon-connect-streams` is compatible with TypeScript. You'll need to use version `3.0.1` or higher:

```ts
import "amazon-connect-streams";

connect.core.initCCP({ /* ... */ });
```

## Downloading Streams from Github
The next step to embedding Amazon Connect into your application is to download the
Streams library from GitHub. You can do that by cloning our public repository
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
Amazon Connect Streams API which you will want to include in your page. You can serve
`connect-streams-${VERSION}.js` with your web application.

## Build your own with NPM
Install latest LTS version of [NodeJS](https://nodejs.org)

You will also need to have `gulp` installed. You can install `gulp` globally.

```
$ npm install -g gulp
$ git clone https://github.com/aws/amazon-connect-streams
$ cd amazon-connect-streams
$ npm install
$ npm run release
```

Find build artifacts in **release** directory - This will generate a file called `connect-streams.js` and the minified version of the same `connect-streams-min.js` - this is the full Connect Streams API which you will want to include in your page.

To run unit tests:
```
$ npm run gulp-test
```

## Using the AWS SDK and Streams
Streams has a "baked-in" version of the AWS-SDK in the `./src/aws-client.js` file. Make sure that you import Streams before the AWS SDK so that the `AWS` object bound to the `Window` is the object from your manually included SDK, and not from Streams.

## Initialization
Initializing the Streams API is the first step to verify that you have
everything set up correctly and that you are able to listen for events.

### `connect.core.initCCP()`
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <script type="text/javascript" src="connect-streams-min.js"></script>
  </head>
  <!-- Add the call to init() as an onload so it will only run once the page is loaded -->
  <body onload="init()">
    <div id="container-div" style="width: 400px; height: 800px;"></div>
    <script type="text/javascript">
      var containerDiv = document.getElementById("container-div");
      var instanceURL = "https://my-instance-domain.awsapps.com/connect/ccp-v2/";
      // initialize the streams api
      function init() {
        // initialize the ccp
        connect.core.initCCP(containerDiv, {
          ccpUrl: instanceURL,            // REQUIRED
          loginPopup: true,               // optional, defaults to `true`
          loginPopupAutoClose: true,      // optional, defaults to `false`
          loginOptions: {                 // optional, if provided opens login in new window
            autoClose: true,              // optional, defaults to `false`
            height: 600,                  // optional, defaults to 578
            width: 400,                   // optional, defaults to 433
            top: 0,                       // optional, defaults to 0
            left: 0                       // optional, defaults to 0
          },
          region: "eu-central-1",         // REQUIRED for `CHAT`, optional otherwise
          softphone: {                    // optional
            allowFramedSoftphone: true,   // optional
            disableRingtone: false,       // optional
            ringtoneUrl: "./ringtone.mp3" // optional
          },
          pageOptions: { //optional
            enableAudioDeviceSettings: false, //optional, defaults to 'false'
            enablePhoneTypeSettings: true //optional, defaults to 'true' 
          },
          ccpAckTimeout: 5000, //optional, defaults to 3000 (ms)
          ccpSynTimeout: 3000, //optional, defaults to 1000 (ms)
          ccpLoadTimeout: 10000, //optional, defaults to 5000 (ms)
          iframeTitle: "Contact Control Panel" // optional, defaults to `Amazon Connect CCP`
         });
      }
    </script>
  </body>
</html>
```
Integrates with Connect by loading the pre-built CCP located at `ccpUrl` into an
iframe and placing it into the `containerDiv` provided. API requests are
funneled through this CCP and agent and contact updates are published through it
and made available to your JS client code.
* `ccpUrl`: The URL of the CCP. This is the page you would normally navigate to
  in order to use the CCP in a standalone page, it is different for each
  instance.
* `region`: Amazon connect instance region. ex: `us-west-2`. only required for chat channel.
* `loginPopup`: Optional, defaults to `true`.  Set to `false` to disable the login popup   
   which is shown when the user's authentication expires.
* `loginOptions`: Optional, only valid when `loginPopup` is set to `true`.
   Provide an object with the following properties to open loginpopup in a new window instead of a
   new tab.
   * `autoClose`: Optional, defaults to `false`. Set to `true` to automatically
      close the login popup after the user logs in.
   * `height`: This allows you to define the height of the login pop-up window.
   * `width`: This allows you to define the width of the login pop-up window.
   * `top`: This allows you to define the top of the login pop-up window.
   * `left`: This allows you to define the left of the login pop-up window.
* `loginPopupAutoClose`: Optional, defaults to `false`. Set to `true` in conjunction with the 
   `loginPopup` parameter to automatically close the login Popup window once the authentication step
   has completed. If the login page opened in a new tab, this parameter will also auto-close that
   tab. This can also be set in `loginOptions` if those options are used.
* `loginUrl`: Optional. Allows custom URL to be used to initiate the ccp, as in
  the case of SAML authentication.
* `softphone`: This object is optional and allows you to specify some settings
  surrounding the softphone feature of Connect.
  * `allowFramedSoftphone`: Normally, the softphone microphone and speaker
    components are not allowed to be hosted in an iframe. This is because the
    softphone must be hosted in a single window or tab. The window hosting
    the softphone session must not be closed during the course of a softphone
    call or the call will be disconnected. If `allowFramedSoftphone` is `true`,
    the softphone components will be allowed to be hosted in this window or tab.
  * `disableRingtone`: This option allows you to completely disable the built-in
    ringtone audio that is played when a call is incoming.
  * `ringtoneUrl`: If the ringtone is not disabled, this allows for overriding
    the ringtone with any browser-supported audio file accessible by the user.
* `pageOptions`: This object is optional and allows you to configure which configuration sections are displayed in the settings tab.
  * `enableAudioDeviceSettings`: If `true`, the settings tab will display a section for configuring audio input and output devices for the agent's local
      machine. If `false`, or if `pageOptions` is not provided, the agent will not be able to change audio device settings from the settings tab. will not be
      displayed.
  * `enablePhoneTypeSettings`: If `true`, or if `pageOptions` is not provided, the settings tab will display a section for configuring the agent's phone type
      and deskphone number. If `false`, the agent will not be able to change the phone type or deskphone number from the settings tab.
* `ccpAckTimeout`: A timeout in ms that indicates how long streams will wait for the iframed CCP to respond to its `SYNCHRONIZE` event emissions. These happen continuously from the first time `initCCP` is called. They should only appear when there is a problem that requires a refresh or a re-login.
* `ccpSynTimeout`: A timeout in ms that indicates how long streams will wait to send a new `SYNCHRONIZE` event to the iframed CCP. These happens continuously from the first time `initCCP` is called. 
* `ccpLoadTimeout`: A timeout in ms that indicates how long streams will wait for the initial `ACKNOWLEDGE` event from the shared worker while the CCP is still standing itself up.
* `iframeTitle`: Optional.  This option allows you to customize the title attribute of the CCP iframe.
  If not provided it defaults to `"Amazon Connect CCP"`.

#### A few things to note:
* You have the option to show or hide the pre-built UI by showing or hiding the
`container-div` into which you place the iframe, or applying a CSS rule like
this:
```css
#container-div iframe {
  display: none;
}
```
* The CCP UI is rendered in an iframe under the container element provided.
  The iframe fills its container element with `width: 100%; height: 100%`.
  To customize the size of the CCP, set the width and height for the container element.
* The CCP is designed to be responsive (used in various sizes).
  The smallest size we design for is 320px x 460px.
  For a good user experience, we recommend that you do not go smaller than this size.
* CSS styles you add to your site will NOT be applied to the CCP because it is
  rendered in an iframe.
* If you are trying to use chat specific functionalities, please also include
  [ChatJS](https://github.com/amazon-connect/amazon-connect-chatjs) in your code.
  We omit ChatJS from the release file so that streams can be used without ChatJS.
  Streams only needs ChatJS when it is being used for chat. Note that when including ChatJS,
  it must be imported after StreamsJS, or there will be AWS SDK issues
  (ChatJS relies on the ConnectParticipant Service, which is not in the Streams AWS SDK).
* If you are using task functionalities you must include [TaskJS](https://github.com/amazon-connect/amazon-connect-taskjs). TaskJS should be imported after Streams.
* If you'd like access to the WebRTC session to further customize the softphone experience
  you can use [connect-rtc-js](https://github.com/aws/connect-rtc-js). Please refer to the connect-rtc-js readme for detailed instructions on integrating connect-rtc-js with Streams.

## `connect.core`

### `connect.core.terminate()`
```js
var containerDiv = document.getElementById("containerDiv");
connect.core.initCCP(containerDiv, { /* ... */ });

// some time later...
connect.core.terminate();
var iframe = containerDiv.firstElementChild; // assumes there's nothing else in the container
containerDiv.removeChild(iframe);
```
Unitializes Amazon Connect Streams. Removing any subscription methods that have been called.

The CCP iframe will not be removed though, so you'll have to manually remove it.

### `connect.core.viewContact()`
```js
var contactId = new connect.Agent().getContacts()[0].getContactId();
connect.core.viewContact(contactId);
```
Changes the currently selected contact in the CCP user interface.
Useful when an agent handles more than one concurrent chat.

### `connect.core.onViewContact()`
```js
connect.core.onViewContact(function(event) {
  var contactId = event.contactId;
  // ...
});
```
Subscribes a callback that starts whenever the currently selected contact on the CCP changes.
The callback is called when the contact changes in the UI (i.e. via `click` events) or via `connect.core.viewContact()`.

### `connect.core.onAuthFail()`
```js
connect.core.onAuthFail(function() { /* ... */ });
```
Subscribes a callback that starts whenever authentication fails (e.g. SAML authentication).

### `connect.core.onAccessDenied()`
```js
connect.core.onAccessDenied(function() { /* ... */ });
```
Subscribes a callback that starts whenever authorization fails (i.e. access denied).

### `connect.core.onSoftphoneSessionInit()`
```js
connect.core.onSoftphoneSessionInit(function({ connectionId }) {
  var softphoneManager = connect.core.getSoftphoneManager();
  if(softphoneManager){
    // access session
    var session = softphoneManager.getSession(connectionId); 
  }
});
```
Subscribes a callback that starts whenever a new webrtc session is created. Used for handling the rtc session stats.

### `connect.core.getWebSocketManager()`
```js
// `connect.ChatSession` is defined by `amazon-connect-chatjs`
connect.ChatSession.create({
  type: connect.ChatSession.SessionTypes.AGENT,
  websocketManager: connect.core.getWebSocketManager()
  // ...
});
```
Gets the `WebSocket` manager. This method is only used when integrating with `amazon-connect-chatjs`.
See the [amazon-connect-chatjs](https://github.com/amazon-connect/amazon-connect-chatjs) documentation for more information.

### `connect.core.onInitialized()`
```js
connect.core.onInitialized(function() { /* ... */ });
```
Subscribes a callback that executes when the CCP initialization is completed.

### `connect.core.getFrameMediaDevices()`
```js
  connect.core.getFrameMediaDevices(timeout)
  .then(function(devices) { /* ... */ })
  .catch(function(err) { /* ... */ })
```
Returns a promise that is resolved with the list of media devices from iframe. 
Timeout for the request can be passed as an optional argument. The default timeout is 1000ms.
The API should be called after the iframe CCP initialization is complete.

## Event Subscription
Event subscriptions link your app into the heartbeat of Amazon Connect by allowing your
code to be called when new agent information is available.

Event subscription works by providing callbacks to the Streams API which are
called when the agent is initialized, and when contacts are first detected.
Then, `on*()` event subscription methods are provided with callbacks which are
called when events occur on those specific objects. These return subscription
objects, which for contacts are automatically cleaned up when those contacts no
longer exist. Users can also manually unsubscribe from events by calling
`sub.unsubscribe()` on the subscriptions returned by these methods.

### `connect.agent()`
```js
connect.agent(function(agent) { /* ... */ });
```
Subscribe a method to be called when the agent is initialized. If the agent has
already been initialized, the call is synchronous and the callback is invoked
immediately. Otherwise, the callback is invoked once the first agent data is
received from upstream. This callback is provided with an `Agent` API object,
which can also be created at any time after initialization is complete via `new
connect.Agent()`.

### `connect.contact()`
```js
connect.contact(function(contact) { /* ... */ });
```
Subscribe a method to be called for each newly detected agent contact. Note
that this function is not only for incoming contacts, but for contacts which
already existed when Streams was initialized, such as from a previous agent
session. This callback is provided with a `Contact` API object for this
contact. `Contact` API objects can also be listed from the `Agent` API by
calling `agent.getContacts()`.

### `connect.onWebSocketInitFailure()`
```
connect.onWebSocketInitFailure(function() { ... });
```
Subscribe a method to be called when the WebSocket connection fails to initialize.
If the WebSocket has already failed at least once in initializing, the call is
synchronous and the callback is invoked immediately.  Otherwise, the callback is
invoked once the first attempt to initialize fails. Since the WebSocket connection
will be periodically refreshed as needed, the callback will also be invoked 
if the WebSocket connection fails to re-initialize successfully.

## Agent API
The Agent API provides event subscription methods and action methods which can
be called on behalf of the agent. There is only ever one agent per Streams
instantiation and all contacts and actions are assumed to be taken on behalf of
this one agent.

### `agent.onContactPending()` -- DEPRECATED
```js
agent.onContactPending(function(agent) { /* ... */ });
```
Subscribe a method to be called whenever a contact enters the pending state for this particular agent. This api is being deprecated.

### `agent.onRefresh()`
```js
agent.onRefresh(function(agent) { /* ... */ });
```
Subscribe a method to be called whenever new agent data is available.

### `agent.onStateChange()`
```js
agent.onStateChange(function(agentStateChange) { /* ... */ });
```
Subscribe a method to be called when the agent's state changes. The
`agentStateChange` object contains the following properties:

* `agent`: The `Agent` API object.
* `oldState`: The name of the agent's previous state.
* `newState`: The name of the agent's new state.

### `agent.onRoutable()`
```js
agent.onRoutable(function(agent) { /* ... */ });
```
Subscribe a method to be called when the agent becomes routable, meaning
that they can be routed incoming contacts. 

### `agent.onNotRoutable()`
```js
agent.onNotRoutable(function(agent) { /* ... */ });
```
Subscribe a method to be called when the agent becomes not-routable, meaning
that they are online but cannot be routed incoming contacts.

### `agent.onOffline()`
```js
agent.onOffline(function(agent) { /* ... */ });
```
Subscribe a method to be called when the agent goes offline.

### `agent.onError()`
```js
agent.onError(function(agent) { /* ... */ });
```
Subscribe a method to be called when the agent is put into an error state. This
can occur if Streams is unable to get new agent data, or if the agent fails to
accept an incoming contact, or in other error cases. It means that the agent is
not routable, and may require that the agent switch to a routable state before
being able to be routed contacts again.

### `agent.onSoftphoneError()`
```js
agent.onSoftphoneError(function(error) { /* ... */ });
```
Subscribe a method to be called when the agent is put into an error state specific to softphone funcionality.

The `error` argument is a `connect.SoftphoneError` instance with the following methods: `getErrorType()`, `getErrorMessage()`, `getEndPointUrl()`.

### `agent.onWebSocketConnectionLost()`
```js
agent.onWebSocketConnectionLost(function(agent) { ... });
```
Subscribe a method to be called when the agent is put into an error state specific to losing a WebSocket connection.

### `agent.onWebSocketConnectionGained()`
```js
agent.onWebSocketConnectionGained(function(agent) { ... });
```
Subscribe a method to be called when the agent gains a WebSocket connection.

### `agent.onAfterCallWork()`
```js
agent.onAfterCallWork(function(agent) { /* ... */ });
```
Subscribe a method to be called when the agent enters the "After Call Work" (ACW) state (note that this event is only triggered for voice contacts even though all contacts enter ACW contact state. See contact.onACW below). This is a non-routable state which exists to allow agents some time to wrap up after handling a contact before they are routed additional contacts.

### `agent.getState()` / `agent.getStatus()`
```js
var state = agent.getState();
```
Get the agent's current `AgentState` object indicating their availability state type.
This object contains the following fields:

* `agentStateARN`: The agent's current state ARN.
* `name`: The name of the agent's current availability state.
* `startTimestamp`: A `Date` object that indicates when the state was set.
* `type`: The agent's current availability state type, as per the `AgentStateType` enumeration.

### `agent.getStateDuration()` / `agent.getStatusDuration()`
```js
var millis = agent.getStateDuration();
```
Get the duration of the agent's state in milliseconds relative to local time. This takes into
account time skew between the JS client and the Amazon Connect service.

### `agent.getPermissions()`
```js
var permissions = agent.getPermissions(); // e.g. ["outboundCall"]
```
Mostly for internal purposes only. Contains strings which indicates actions that the agent can
take in the CCP.

### `agent.getContacts()`
```js
var contacts = agent.getContacts(contactTypeFilter);
```
Gets a list of `Contact` API objects for each of the agent's current contacts.

* `contactTypeFilter`: Optional. If provided, only contacts of the given `ContactType` enum are returned.

### `agent.getConfiguration()`
```js
var config = agent.getConfiguration();
```
Gets the full `AgentConfiguration` object for the agent. This object contains the following fields:

* `agentStates`: See `agent.getAgentStates()` for more info.
* `dialableCountries`: See `agent.getDialableCountries()` for more info.
* `extension`: See `agent.getExtension()` for more info.
* `name`: See `agent.getName()` for more info.
* `permissions`: See `agent.getPermissions()` for more info.
* `routingProfile`: See `agent.getRoutingProfile()` for more info.
* `softphoneAutoAccept`: Indicates whether auto accept soft phone calls is enabled.
* `softphoneEnabled`: See `agent.isSoftphoneEnabled()` for more info.
* `username`: The username for the agent as entered in their Amazon Connect user account.

### `agent.getAgentStates()`
```js
var agentStates = agent.getAgentStates();
```
Gets the list of selectable `AgentState` API objects. These are the agent states that can be
selected when the agent is not handling a live contact. Each `AgentState` object contains
the following fields:

* `agentStateARN` The agent state ARN.
* `type`: The agent state type represented as a `AgentStateType` enum value.
* `name`: The name of the agent state to be displayed in the UI.

### `agent.getRoutingProfile()`
```js
var routingProfile = agent.getRoutingProfile();
```
Gets the agent's routing profile. The routing profile contains the following fields:

* `channelConcurrencyMap`: See `agent.getChannelConcurrency()` for more info.
* `defaultOutboundQueue`: The default queue which should be associated with outbound contacts. See `queues` for details on properties.
* `name`: The name of the routing profile.
* `queues`: The queues contained in the routing profile. Each queue object has the following properties:
  * `name`: The name of the queue.
  * `queueARN`: The ARN of the queue.
  * `queueId`: Alias for `queueARN`.
* `routingProfileARN`: The routing profile ARN.
* `routingProfileId`: Alias for `routingProfileARN`.

### `agent.getChannelConcurrency()`
```js
var concurrencyMap = agent.getChannelConcurrency(); // e.g. { VOICE: 0, CHAT: 2 }

// OR

if (agent.getChannelConcurrency("CHAT") > 1) { /* ... */ }
```
Gets either a number or a map of `ChannelType`-to-number indicating how many concurrent contacts can an agent have on a given channel. 0 represents a disabled channel. The optional `channel` argument must be a value of the enum `ChannelType`.

### `agent.getName()`
```js
var name = agent.getName();
```
Gets the agent's user friendly display name.

### `agent.getExtension()`
```js
var extension = agent.getExtension();
```
Gets the agent's phone number. This is the phone number that is dialed by Amazon Connect to connect calls to the agent for incoming and outgoing calls
if softphone is not enabled.

### `agent.getDialableCountries`
```js
var countries = agent.getDialableCountries(); // e.g. ["us", "ca"]
```
Returns a list of eligible countries to be dialed / deskphone redirected.

### `agent.isSoftphoneEnabled()`
```js
if (agent.isSoftphoneEnabled()) { /* ... */ }
```
Indicates whether the agent's phone calls should route to the agent's browser-based softphone or the
telephone number configured as the agent's extension.

### `agent.setConfiguration()`
```js
var config = agent.getConfiguration();
config.extension = "+18005550100";
config.softphoneEnabled = false;
agent.setConfiguration(config {
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Updates the agent's configuration with the given `AgentConfiguration` object. The phone number specified must be in E.164 format or the update fails.
Only the `extension` and `softphoneEnabled` values can be updated.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `agent.setState()` / `agent.setStatus()`
```js
var state = agent.getAgentStates()[0];
agent.setState(state, {
    success: function() { /* ... */ },
    failure: function(err) { /* ... */ },
   },
   {enqueueNextState: false}
});
```
Set the agent's current availability state. Can only be performed if the agent is not handling a live contact.

Optional `enqueueNextState` flag can be passed to trigger Next Status behavior.
By default this is false.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `agent.onEnqueuedNextState()`
```js
agent.onEnqueuedNextState(function(agent) { /* ... */ });
Subscribe a method to be called when an agent has enqueued a next status.
```

### `agent.getNextState()`
```js
var state = agent.getNextState();

Get the AgentState object of the agent's enqueued next status. 
If the agent has not enqueued a next status, returns null.
```

### `agent.connect()`
```js
var endpoint = connect.Endpoint.byPhoneNumber("+18005550100");
var agent = new connect.Agent();
var queueArn = "arn:aws:connect:<REGION>:<ACCOUNT_ID>:instance/<CONNECT_INSTANCE_ID>/queue/<CONNECT_QUEUE_ID>";

agent.connect(endpoint, {
  queueARN: queueArn,
  success: function() { console.log("outbound call connected"); },
  failure: function(err) {
    console.log("outbound call connection failed");
    console.log(err);
  }
});
```
Creates an outbound contact to the given endpoint. You can optionally provide a `queueARN` to associate the contact with a queue.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `agent.getAllQueueARNs()`
```js
var ARNs = agent.getAllQueueARNs();
```
Returns a list of the ARNs associated with this agent's routing profile's queues.

### `agent.getEndpoints()` / `agent.getAddresses()`
```js
var queuesARNs = agent.getAllQueueARNs();
agent.getEndpoints(
   queuesARNs,
   {
      success: function(data) {
         var endpoints = data.endpoints; // or data.addresses
      },
      failure: function(err) {
      }
   }
);
```
Returns the endpoints associated with the queueARNs specified in `queueARNs`.
* `queueARNs`: Required. Can be a single Queue ARN or a list of Queue ARNs associated with the desired queues.
* `callbacks`: Optional. A structure containing success and failure handlers.
   * `success`: A function for handling a successful API call.
   * `failure`: A function for handling a failed API call.

### `agent.toSnapshot()`
```js
var snapshot = agent.toSnapshot();
```
The data behind the `Agent` API object is ephemeral and changes whenever new data is provided. This method
provides an opportunity to create a snapshot version of the `Agent` API object and save it for future use,
such as adding to a log file or posting elsewhere.

### `agent.mute()`
```js
agent.mute();
```
Sets the agent local media to mute mode.

### `agent.unmute()`
```js
agent.unmute();
```
Sets the agent localmedia to unmute mode.


### `agent.setSpeakerDevice()`
```js
agent.setSpeakerDevice(deviceId);
```
Sets the speaker device (output device for call audio)

### `agent.setMicrophoneDevice()`
```js
agent.setMicrophoneDevice(deviceId);
```
Sets the microphone device (input device for call audio)

### `agent.setRingerDevice()`
```js
agent.setRingerDevice(deviceId);
```
Sets the ringer device (output device for ringtone)

### `agent.onMuteToggle()`
```js
agent.onMuteToggle(function(obj) {
   if (obj.muted) { /* ... */ }
});
```
Subscribe a method to be called when the agent updates the mute status, meaning
that agents mute/unmute APIs are called and the local media stream is successfully updated with the new status.

### `agent.onSpeakerDeviceChanged()`
```js
agent.onSpeakerDeviceChanged(function(obj) { /* ... */ });
```
Subscribe a method to be called when the agent changes the speaker device (output device for call audio).

### `agent.onMicrophoneDeviceChanged()`
```js
agent.onMicrophoneDeviceChanged(function(obj) { /* ... */ });
```
Subscribe a method to be called when the agent changes the microphone device (input device for call audio).

### `agent.onRingerDeviceChanged()`
```js
agent.onRingerDeviceChanged(function(obj) { /* ... */ });
```
Subscribe a method to be called when the agent changes the ringer device (output device for ringtone).

## Contact API
The Contact API provides event subscription methods and action methods which can be called on behalf of a specific
contact. Contacts come and go and so should these API objects. It is good practice not to persist these objects
or keep them as internal state. If you need to, store the `contactId` of the contact and make sure that the
contact still exists by fetching it from the `Agent` API object before calling methods on it.

### `contact.onRefresh()`
```js
contact.onRefresh(function(contact) { /* ... */ });
```
Subscribe a method to be invoked whenever the contact is updated.

### `contact.onIncoming()`
```js
contact.onIncoming(function(contact) { /* ... */ });
```
Subscribe a method to be invoked when a queue callback contact is incoming. In this state, the contact is waiting to be
accepted if it is a softphone call or is waiting for the agent to answer if it is not a softphone call.

### `contact.onPending()`
```js
contact.onPending(function(contact) { /* ... */ });
```
Subscribe a method to be invoked when the contact is pending. This event is expected to occur before the connecting event.

### `contact.onConnecting()`
```js
contact.onConnecting(function(contact) { /* ... */ });
```
Subscribe a method to be invoked when the contact is connecting. This event happens when a contact comes in, before accepting (there is an exception for queue callbacks, in which onConnecting's handler is started after the callback is accepted). Note that once the contact has been accepted, the `onAccepted` handler will be triggered.

### `contact.onAccepted()`
```js
contact.onAccepted(function(contact) { /* ... */ });
```
Subscribe a method to be invoked whenever the contact is accepted.

### `contact.onMissed()`
```js
contact.onMissed(function(contact) { /* ... */ });
```
Subscribe a method to be invoked whenever the contact is missed. This is an event which is fired when a contact is put in state "missed" by the backend, which happens when the agent does not answer for a certain amount of time, when the agent rejects the call, or when the other participant hangs up before the agent can accept.

### `contact.onEnded()`
```js
contact.onEnded(function(contact) { /* ... */ });
```
Subscribe a method to be invoked whenever the contact is ended or destroyed. This could be due to the conversation
being ended by the agent, or due to the contact being missed. Call `contact.getState()` to determine the state
of the contact and take appropriate action.

### `contact.onDestroy()`
```js
contact.onDestroy(function(contact) { /* ... */ });
```
Subscribe a method to be invoked whenever the contact is destroyed.

### `contact.onACW()`
```js
contact.onACW(function(contact) { /* ... */ });
```
Subscribe a method to be invoked whenever the contact enters the ACW state. This is after the connection has been closed, but before the contact is destroyed.

### `contact.onConnected()`
```js
contact.onConnected(function(contact) { /* ... */ });
```
Subscribe a method to be invoked when the contact is connected.

### `contact.onError()`
```js
contact.onError(function(contact) { /* ... */ });
```
Subscribe a method to be invoked when `connect.ContactEvents.ERROR` happens. 
This event happens when the agent state type is `error`. Why do we have a contact event representing an agent state type? Because the agent status when on voice calls reflects contact-specific errors. 

### `contact.getEventName()`
```js
// e.g. contact::connected::01234567-89ab-cdef-0123-456789abcdef
var eventName = contact.getEventName(connect.ContactEvents.CONNECTED);
```
Returns a formatted string with the contact event and ID. The argument must be a value of the `ContactEvents` enum.

### `contact.getContactId()`
```js
var contactId = contact.getContactId();
```
Get the unique contactId of this contact.

### `contact.getOriginalContactId()` / `contact.getInitialContactId()`
```js
var originalContactId = contact.getOriginalContactId();
//OR
var initialContactId = contact.getInitialContactId();
```
Get the original (initial) contact id from which this contact was transferred, or none if this is not an internal Connect transfer.
This is typically a contact owned by another agent, thus this agent will not be able to
manipulate it. It is for reference and association purposes only, and can be used to share
data between transferred contacts externally if it is linked by originalContactId.

Note that `contact.getOriginalContactId()` is the original Streams API
name, but it does not match the internal data naming scheme, which is `initialContactId`, so we added an alias for the same method called
`contact.getInitialContactId()`.

### `contact.getType()`
```js
var type = contact.getType();
```
Get the type of the contact. This indicates what type of media is carried over the connections of the contact.

###  `contact.getState()` / `contact.getStatus()`
```js
var state = contact.getState();
```
Get an object representing the state of the contact. This object has the following fields:

* `type`: The contact state type, as per the `ContactStateType` enumeration.
* `timestamp`: A `Date` object that indicates when the the contact was put in that state.

### `contact.getStateDuration()` / `contact.getStatusDuration()`
```js
var millis = contact.getStateDuration();
```
Get the duration of the contact state in milliseconds relative to local time. This takes into
account time skew between the JS client and the Amazon Connect backend servers.

### `contact.getQueue()`
```js
var queue = contact.getQueue();
```
Get the queue associated with the contact. This object has the following fields:

* `name`: The name of the queue.
* `queueARN`: The ARN of the queue.
* `queueId`: Alias for `queueARN`.

### `contact.getQueueTimestamp()`
```js
var queueTimestamp = contact.getQueueTimestamp();
```
Get a `Date` object with the timestamp associated with when the contact was placed in the queue.

### `contact.getConnections()`
```js
var conns = contact.getConnections();
```
Get a list containing `Connection` API objects for each connection in the contact.

### `contact.getInitialConnection()`
```js
var initialConn = contact.getInitialConnection();
```
Get the initial connection of the contact.

### `contact.getActiveInitialConnection()`
```js
var initialConn = contact.getActiveInitialConnection();
```
Get the initial connection of the contact, or null if the initial connection is
no longer active.

### `contact.getThirdPartyConnections()`
```js
var thirdPartyConns = contact.getThirdPartyConnections();
```
Get a list of all of the third-party connections, i.e. the list of all connections
except for the initial connection, or an empty list if there are no third-party connections.

### `contact.getSingleActiveThirdPartyConnection()`
```js
var thirdPartyConn = contact.getSingleActiveThirdPartyConnection();
```
In Voice contacts, there can only be one active third-party connection. This
method returns the single active third-party connection, or null if there are no
currently active third-party connections.

### `contact.getAgentConnection()`
```js
var agentConn = contact.getAgentConnection();
```
Gets the agent connection. This is the connection that represents the agent's
participation in the contact.

### `contact.getAttributes()`
```js
var attributeMap = contact.getAttributes(); // e.g. { "foo": { "name": "foo", "value": "bar" } }
```
Gets a map of the attributes associated with the contact. Each value in the map has the following shape: `{ name: string, value: string }`.

### `contact.isSoftphoneCall()`
```js
if (contact.isSoftphoneCall()) { /* ... */ }
```
Determine whether this contact is a softphone call.

### `contact.isInbound()`
```js
if (contact.isInbound()) { /* ... */ }
```
Determine whether this is an inbound or outbound contact.

### `contact.isConnected()`
```js
if (contact.isConnected()) { /* ... */ }
```
Determine whether the contact is in a connected state.

Note that contacts no longer exist once they have been removed. To detect
these instances, subscribe to the `contact.onEnded()` event for the contact.

### `contact.accept()`
```js
contact.accept({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Accept an incoming contact.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.destroy()`
This method is now deprecated.

### `contact.reject()`
```js
contact.reject({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Reject an incoming contact.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.clear()`
```js
contact.clear({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
This is a more generic form of `contact.complete()`. Use this for voice, chat, and task contacts to clear the contact
when the contact is no longer actively being worked on (i.e. it's one of ERROR, ACW, MISSED, REJECTED). 
It works for both monitoring and non-monitoring connections.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.complete()` (TO BE DEPRECATED)
```js
contact.complete({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
This API will soon be deprecated and should be replaced with `contact.clear()`. It completes the contact entirely.
That means it should only be used for non-monitoring agent connections.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.notifyIssue()`
```js
contact.notifyIssue(issueCode, description, {
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Provide diagnostic information for the contact in the case something exceptional happens on the front end.
The Streams logs will be published along with the issue code and description provided here.

* `issueCode`: An arbitrary issue code to associate with the diagnostic report.
* `description`: A description to associate with the diagnostic report.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.addConnection()`
```js
var endpoint = Endpoint.byPhoneNumber("+18005550100");
contact.addConnection(endpoint, {
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Add a new outbound third-party connection to this contact and connect it to the specified endpoint.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.toggleActiveConnections()`
```js
contact.toggleActiveConnections({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Rotate through the connected and on hold connections of the contact. This operation is only valid
if there is at least one third-party connection and the initial connection is still connected.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.conferenceConnections()`
```js
contact.conferenceConnections({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Conference together the active connections of the conversation. This operation is only valid
if there is at least one third-party connection and the initial connection is still connected.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.toSnapshot()`
```js
var snapshot = contact.toSnapshot();
```
The data behind the `Contact` API object is ephemeral and changes whenever new data is provided. This method
provides an opportunity to create a snapshot version of the `Contact` API object and save it for future use,
such as adding to a log file or posting elsewhere.

### Task Contact APIs
The following contact methods are currently only available for task contacts.

### `contact.getName()`
```js
var taskName = contact.getName();
```
Gets the name of the contact.

### `contact.getDescription()`
```js
var taskDescription = contact.getDescription();
```
Gets the description of the contact.

### `contact.getReferences()`
```js
var taskReferences = contact.getReferences();
```
Gets references for the contact. A sample reference looks like the following:

```js
"Reference-Name": {
    type: "URL",
    value: "https://link.com"
}
```


## Connection API
The Connection API provides action methods (no event subscriptions) which can be called to manipulate the state
of a particular connection within a contact. Like contacts, connections come and go. It is good practice not
to persist these objects or keep them as internal state. If you need to, store the `contactId` and `connectionId`
of the connection and make sure that the contact and connection still exist by fetching them in order from
the `Agent` API object before calling methods on them.

### `connection.getContactId()`
```js
var contactId = connection.getContactId();
```
Gets the unique contactId of the contact to which this connection belongs.

### `connection.getConnectionId()`
```js
var connectionId = connection.getConnectionId();
```
Gets the unique connectionId for this connection.

### `connection.getEndpoint()` / `connection.getAddress()`
```js
var endpoint = connection.getEndpoint();
```
Gets the endpoint to which this connection is connected.

### `connection.getState()` / `connection.getStatus()`
```js
var state = connection.getState();
```
Gets the `ConnectionState` object for this connection. This object has the
following fields:

* `timestamp`: A `Date` object that indicates when the the connection was put in that state.
* `type`: The connection state type, as per the `ConnectionStateType` enumeration.

### `connection.getStateDuration()` / `connection.getStatusDuration()`
```js
var millis = connection.getStateDuration();
```
Get the duration of the connection state, in milliseconds, relative to local time.
This takes into account time skew between the JS client and the Amazon Connect service.

### `connection.getType()`
```js
var type = connection.getType()
```
Get the type of connection. This value is an `ConnectionType` enum.

### `connection.getMonitorInfo()`
```js
var monitorInfo = conn.getMonitorInfo();
```
Get the currently monitored contact info, or null if that does not exist.
* `monitorInfo` = `{ agentName: string, customerName: string, joinTime: string }`

### `connection.isInitialConnection()`
```js
if (conn.isInitialConnection()) { /* ... */ }
```
Determine if the connection is the contact's initial connection.

### `connection.isActive()`
```js
if (conn.isActive()) { /* ... */ }
```
Determine if the contact is active. The connection is active it is incoming, connecting, connected, or on hold.

### `connection.isConnected()`
```js
if (conn.isConnected()) { /* ... */ }
```
Determine if the connection is connected, meaning that the agent is live in a conversation through this connection.
   
Note that, in the case of Agent A transferring a contact to Agent B, the new (third party) agent connection will be marked as `connected` (`connection.isConnected` will return true) as soon as the contact is routed to Agent B's queue, not when Agent B actually is "live" and able to communicate in the conversation.

### `connection.isConnecting()`
```js
if (conn.isConnecting()) { /* ... */ }
```
Determine whether the connection is in the process of connecting.

### `connection.isOnHold()`
```js
if (conn.isOnHold()) { /* ... */ }
```
Determine whether the connection is on hold.

### `connection.destroy()`
```js
conn.destroy({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Ends the connection. This can be used to reject contacts, end live contacts, and clear chat ACW.
At this point, it should be used to reject contacts and end live contacts only. We are deprecating the behavior of clearing ACW with this API.
To clear ACW for voice and chat contacts, use the `contact.clear()` API.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `connection.sendDigits()`
```js
conn.sendDigits(digits, {
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```

Send a digit or string of digits through this connection.

This is only valid for contact types that can accept digits,
currently this is limited to softphone-enabled voice contacts.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `connection.hold()`
```js
conn.hold({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Put this connection on hold.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `connection.resume()`
```js
conn.resume({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Resume this connection if it was on hold.

Optional success and failure callbacks can be provided to determine if the operation was successful.

## VoiceConnection API
The VoiceConnection API provides action methods (no event subscriptions) which can be called to manipulate the state
of a particular voice connection within a contact. Like contacts, connections come and go. It is good practice not
to persist these objects or keep them as internal state. If you need to, store the `contactId` and `connectionId`
of the connection and make sure that the contact and connection still exist by fetching them in order from
the `Agent` API object before calling methods on them.

### `voiceConnection.getMediaInfo()`
```js
var mediaInfo = conn.getMediaInfo();
```
Returns the media info object associated with this connection.

### `voiceConnection.getMediaType()`
```js
if (conn.getMediaType() === "softphone") { ... }
```
Returns the `MediaType` enum value: `"softphone"`.

### `voiceConnection.getMediaController()`
```js
conn.getMediaController().then(function (voiceController) { /* ... */ });
```
Gets a `Promise` with the media controller associated with this connection.

This method is currently a placeholder.
The promise resolves to the return value of `voiceConnection.getMediaInfo()` but it will be replaced with the controller eventually.

### `voiceConnection.getQuickConnectName()`
```js
var agentName = conn.getQuickConnectName();
```
Returns the quick connect name of the third-party call participant with which the connection is associated.

### `voiceConnection.isMute()`
```js
if (conn.isMute()) { /* ... */ }
```
Determine whether the connection is mute server side.

### `voiceConnection.muteParticipant()`
```js
conn.muteParticipant({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Mute the connection server side.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `voiceConnection.unmuteParticipant()`
```js
conn.unmuteParticipant({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Unmute the connection server side.

Optional success and failure callbacks can be provided to determine if the operation was successful.

## ChatConnection API
The ChatConnection API provides action methods (no event subscriptions) which can be called to manipulate the state
of a particular chat connection within a contact. Like contacts, connections come and go. It is good practice not
to persist these objects or keep them as internal state. If you need to, store the `contactId` and `connectionId`
of the connection and make sure that the contact and connection still exist by fetching them in order from
the `Agent` API object before calling methods on them.

### `chatConnection.getMediaInfo()`
```js
var mediaInfo = conn.getMediaInfo();
```
Get the media info object associated with this connection.

### `chatConnection.getConnectionToken()`
```js
conn.getConnectionToken()
  .then(function(response) { /* ... */ })
  .catch(function(error) { /* ... */ });
```
Provides a promise which resolves with the API response from createTransport transportType chat_token for this connection.

### `chatConnection.getMediaType()`
```js
if (conn.getMediaType() === "chat") { /* ... */ }
```
Returns the `MediaType` enum value: `"chat"`.

### `chatConnection.getMediaController()`
```js
conn.getMediaController().then(function (chatController) { /* ... */ });
```
Gets a `Promise` with the media controller associated with this connection.
The promise resolves to a `ChatSession` object from `amazon-connect-chatjs` library.
See the [amazon-connect-chatjs documentation](https://github.com/amazon-connect/amazon-connect-chatjs) for more information.

## TaskConnection API
The TaskConnection API provides action methods (no event subscriptions) which can be called to manipulate the state
of a particular task connection within a contact. Like contacts, connections come and go. It is good practice not
to persist these objects or keep them as internal state. If you need to, store the `contactId` and `connectionId`
of the connection and make sure that the contact and connection still exist by fetching them in order from
the `Agent` API object before calling methods on them.

### `taskConnection.getMediaInfo()`
```js
var mediaInfo = conn.getMediaInfo();
```
Get the media info object associated with this connection.

### `taskConnection.getMediaType()`
```js
if (conn.getMediaType() === "task") { /* ... */ }
```
Returns the `MediaType` enum value: `"task"`.

### `taskConnection.getMediaController()`
```js
conn.getMediaController().then(function (taskController) { /* ... */ });
```
Gets a `Promise` with the media controller associated with this connection.
The promise resolves to a `TaskSession` object from the `amazon-connect-taskjs` library.
See the [amazon-connect-taskjs documentation](https://github.com/amazon-connect/amazon-connect-taskjs) for more information.

## Utility Functions
### `Endpoint.byPhoneNumber()` (static function)
```js
var endpoint = Endpoint.byPhoneNumber("+18005550100");
```
Creates an `Endpoint` object for the given phone number, useful for `agent.connect()` and
`contact.addConnection()` calls.

### `connect.hitch()`
```js
agent.onRefresh(connect.hitch(eventHandler, eventHandler._onAgentRefresh));
```
A useful utility function for creating callback closures that bind a function to an object instance.
In the above example, the "_onAgentRefresh" function of the "eventHandler" will be called when the
agent is refreshed.

## Enumerations
These enumerations are not strictly required but are very useful and helpful for
the Streams API. They are used extensively by the built-in CCP. All enumerations
are accessible via `connect.<ENUM_NAME>`.

### `AgentStateType`
This enumeration lists the different types of agent states.

* `AgentStateType.INIT`: The agent state hasn't been initialized yet.
* `AgentStateType.ROUTABLE`: The agent is in a state where they can be routed contacts.
* `AgentStateType.NOT_ROUTABLE`: The agent is in a state where they cannot be routed contacts.
* `AgentStateType.OFFLINE`: The agent is offline.

### `ChannelType`
This enumeration lists the different types of contact channels.

* `ChannelType.VOICE`: A voice contact.
* `ChannelType.CHAT`: A chat contact.
* `ChannelType.TASK`: A task contact.

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

* `ContactStateType.INIT`: Indicates the contact is being initialized.
* `ContactStateType.INCOMING`: Indicates that the contact is incoming and is waiting for acceptance. This state is skipped for `ContactType.VOICE` contacts but is essential for `ContactType.QUEUE_CALLBACK` contacts.
* `ContactStateType.PENDING`: Indicates the contact is pending.
* `ContactStateType.CONNECTING`: Indicates that the contact is currently connecting. For `ContactType.VOICE` contacts, this is when the user will accept the incoming call. For all other types, the contact will be accepted during the `ContactStateType.INCOMING` state.
* `ContactStateType.CONNECTED`: Indicates the contact is connected.
* `ContactStateType.MISSED`: Indicates the contact timed out before the agent could accept it.
* `ContactStateType.ERROR`: Indicates the contact is in an error state.
* `ContactStateType.ENDED`: Indicates the contact has ended.

### `ConnectionStateType`
An enumeration listing the different states that a connection can have.

* `ConnectionStateType.INIT`: The connection has not yet been initialized.
* `ConnectionStateType.CONNECTING`: The connection is being initialized.
* `ConnectionStateType.CONNECTED`: The connection is connected to the contact.
* `ConnectionStateType.HOLD`: The connection is connected but on hold.
* `ConnectionStateType.DISCONNECTED`: The connection is no longer connected to the contact.

### `ContactType`
This enumeration lists all of the contact types supported by Connect Streams.

* `ContactType.VOICE`: Normal incoming and outgoing voice calls.
* `ContactType.QUEUE_CALLBACK`: Special outbound voice calls which are routed to agents before being placed. For more information about how to setup and use queued callbacks, see the Amazon Connect user documentation.
* `ContactType.CHAT`: Chat contact.
* `ContactType.TASK`: Task contact.

### `EventType`
This is a list of some of the special event types which are published into the low-level
`EventBus`.

* `EventType.ACKNOWLEDGE`: Event received when the backend API shared worker acknowledges the current tab.
* `EventType.ACK_TIMEOUT`: Event which is published if the backend API shared worker fails to respond to an `EventType.SYNCHRONIZE` event in a timely manner, meaning that the tab or window has been disconnected from the shared worker.
* `EventType.AUTH_FAIL`: Event published indicating that the most recent API call returned a status header indicating that the current user authentication is no longer valid. This usually requires the user to log in again for the CCP to continue to function. See `connect.core.initCCP()` under **Initialization** for more information about automatic login popups which can be used to give the user the chance to log in again when this happens.
* `EventType.LOG`: An event published whenever the CCP or the API shared worker creates a log entry.
* `EventType.TERMINATED`: Event published when the agent logged out from ccp.

#### Note
The `EventBus` is used by the high-level subscription APIs to manage subscriptions
and is available to users by calling `connect.core.getEventBus()`. Like the other event subscription APIs, calling `eventBus.subscribe(eventName, callback)` will return a subscription object which can be unsubscribed via `sub.unsubscribe()`.

## Streams Logger
The Streams library comes with a logging utility that can be used to easily gather logs and provide
them for diagnostic purposes. You can even add your own logs to this logger if you prefer. Logs are
written to the console log per normal and also kept in memory.

### `connect.getLog()`
```js
connect.getLog().warn("The %s broke!", "widget")
   .withException(e)
   .withObject({a: 1, b: 2});
```
Use `connect.getLog()` to get the global logger instance. You can then call one of the `debug`, `info`, `warn` or `error`
methods to create a new log entry. The logger accepts printf-style parameter interpolation for strings and number
forms.

Each of these functions returns a `LogEntry` object, onto which additional information can be added. You can call
`.withException(e)` and pass an exception (`e`) to add stack trace and additional info to the logs, and you can
call `.withObject(o)` to add an arbitrary object (`o`) to the logs.

A new method `sendInternalLogToServer()` that can be chained to the other methods of the logger has been implemented and is intended for internal use only. It is NOT recommended for use by customers.

Finally, you can trigger the logs to be downloaded to the agent's machine in JSON form by calling `connect.getLog().download()`.
Please note that `connect.getLog().download()` will output Connect-internal logs, along with any custom logs logged using the `connect.getLog()` logger. However, if an agent clicks on an embedded CCP's "Download Logs" button, only the Connect-internal logs will appear. The custom logs will not appear.

### LogLevel

For debugging, you can change the log level.

Valid log levels are `TEST`, `TRACE`, `DEBUG`, `INFO`, `LOG`, `WARN`, `ERROR`, and `CRITICAL`.

```js
const rootLogger = connect.getLog();

// Set log level.
rootLogger.setLogLevel(connect.LogLevel.TRACE);
// Set console output level.
rootLogger.setEchoLevel(connect.LogLevel.TRACE);
```

## CCP Error Logging
The following errors are related to connectivity in the CCP. These errors are logged in the CCP logs when they occur.

### `unsupported_browser`
Agent is using an unsupported browser. Only the latest 3 versions of Chrome or Firefox is supported. Upgrade the agent's browser to resolve this error. See [Supported browsers](https://docs.aws.amazon.com/connect/latest/adminguide/browsers.html) for more information.

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
All errors not otherwise defined.

## Logging out
In the default CCP UI, agent can log out by clicking on the "Logout" link on the Settings page. If you want to do something after an agent gets logged out, you can subscribe to the `EventType.TERMINATED` event.
```js
const eventBus = connect.core.getEventBus();
eventBus.subscribe(connect.EventType.TERMINATED, () => {
  console.log('Logged out');
  // Do stuff...
});
```

If you are using a custom UI, you can log out the agent by visiting the logout endpoint (`/connect/logout`). In this case, `EventType.TERMINATED` event won't be triggered. If you want the code above to work, you can manually trigger the `EventType.TERMINATE` event after logging out. When the event is triggered, `connect.core.terminate()` is internally called to clean up the Streams and the `EventType.TERMINATED` event will be triggered.
```js
fetch("https://<your-instance-domain>/connect/logout", { credentials: 'include', mode: 'no-cors'})
  .then(() => {
    const eventBus = connect.core.getEventBus();
    eventBus.trigger(connect.EventType.TERMINATE);
  });
```
In addition, it is recommended to remove the auth token cookies (`lily-auth-*`) after logging out, otherwise you’ll see AuthFail errors. ([Browser API Reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/remove)).
## Initialization for CCP, Customer Profiles, and Wisdom

*Note that if you are only using CCP, please follow [these directions](#initialization)*

Initializing the Streams API is the first step to verify that you have everything set up correctly and that you are able to listen for events. 
To get latest streams file and allowlist required urls follow [these instructions](#getting-started)*

### `connect.agentApp.initApp(name, containerId, appUrl, config)`

```js
<!DOCTYPE html>
<meta charset="UTF-8">
<html>
  <head>
    <script type="text/javascript" src="connect-streams-min.js"></script>
  </head>
  <!-- Add the call to init() as an onload so it will only run once the page is loaded -->
  <body onload="init()">
    <main>
      <div id="ccp-container"></div>
      <div id="customerprofiles-container"></div>
      <div id="wisdom-container"></div>
    </main>
    <script type="text/javascript">
      function init() {
        const connectUrl = "https://my-instance-domain.awsapps.com/connect";
        connect.agentApp.initApp(
            "ccp", 
            "ccp-container", 
            connectUrl + "/ccp-v2/",
            { style: "width:400px; height:600px;" }
        );
        connect.agentApp.initApp(
            "customerprofiles", 
            "customerprofiles-container", 
            connectUrl + "/customerprofiles-v2/",
            { style: "width:400px; height:600px;" }
        );
        connect.agentApp.initApp(
            "wisdom", 
            "wisdom-container", 
            connectUrl + "/wisdom-v2/",
            { style: "width:400px; height:600px;" }
        );
      }
    </script>
  </body>
</html>
```

Integrates with Amazon Connect by loading the pre-built app located at `appUrl` into an iframe and appending it into the DOM element with id of `containerId`. Underneath the hood, `initApp` creates a `WindowIOStream` for the iframes to communicate with the main CCP iframe, which is in charge of authenticating the agent's session, managing the agent state, and contact state.
* `name`: A string which should be one of `ccp`, `customerprofiles`, or `wisdom`.
* `containerId`: The string id of the DOM element that will contain the app iframe.
* `appUrl`: The string URL of the app. This is the page you would normally navigate to in order to use the app in a standalone page, it is different for each instance.
* `config`: This object is optional and allows you to specify some settings surrounding the CCP.
    * `ccpParams`: Optional params that mirror the configuration options for `initCCP`.
    * `style`: An optional string to supply inline styling for the iframe.

## Voice ID APIs
Amazon Voice Connect ID provides real-time caller authentication and fraud risk detection which make voice interactions in contact centers more secure and efficient. For the Voice ID overview and administrator guide, please check the [AWS public doc](https://docs.aws.amazon.com/connect/latest/adminguide/voice-id.html). For more information about the agent experience in default CCP UI, please see [Use Voice ID page](https://docs.aws.amazon.com/connect/latest/adminguide/use-voiceid.html).

Streams Voice ID APIs can be tested after all these prerequisites are met:

1. A Voice ID domain is associated to your Connect instance ([link](https://docs.aws.amazon.com/connect/latest/adminguide/enable-voiceid.html#enable-voiceid-step1))
2. The contact flow is configured for Voice ID ([link](https://docs.aws.amazon.com/connect/latest/adminguide/enable-voiceid.html#enable-voiceid-step2))
3. "Voice ID" permission is given to the agent in the Security Profile page under the Contact Control Panel (CCP) section

The Voice ID APIs are exposed as Voice Connection methods and only work with two-party calls, not with conference calls at this moment. You can get the voice connection object by calling `contact.getAgentConnection()` when there's a voice connection.


### `voiceConnection.getVoiceIdSpeakerStatus()`
Describes the enrollment status of a customer. If the customer exists in the Voice ID, it resolves with a response object that contains one of the valid statuses, ENROLLED or OPTED_OUT. If the customer does not exist in the Voice ID, it still resolves but with an error object because backend API call fails. The case needs to be taken care of in a way like the code sample below.

```js
voiceConnection.getVoiceIdSpeakerStatus()
  .then((data) => {
    if (data.type === connect.VoiceIdErrorTypes.SPEAKER_ID_NOT_ENROLLED) {
      // speaker is not enrolled
    } else {
      const { Status } = data.Speaker;
      switch(Status) {
        case connect.VoiceIdSpeakerStatus.ENROLLED:
          // speaker is enrolled
          break;
        case connect.VoiceIdSpeakerStatus.OPTED_OUT:
          // speaker is opted out
          break;
      }
    }
  })
  .catch((err) => {
    console.error(err);
  });
```


### `voiceConnection.enrollSpeakerInVoiceId()`
Enrolls a customer in Voice ID. The enrollment process completes once the backend has collected enough speech data (30 seconds of net customer's audio). If after 10 minutes the process hasn't completed, the method will throw a timeout error. If you call this API for a customer who is already enrolled, it will re-enroll the customer by collecting new speech data and registering a new digital voiceprint. Enrollment can happen only once in a voice contact.

```js
voiceConnection.enrollSpeakerInVoiceId()
  .then((data) => {
    // it returns session data but no additional actions needed
  })
  .catch((err) => {
    console.error(err);
  });
```


### `voiceConnection.evaluateSpeakerWithVoiceId(boolean)`
Checks the customer's Voice ID verification status. The evaluation process completes once the backend has collected enough speech data (10 seconds of net customer's audio). If after 2 minutes the process hasn't completed, the method will throw a timeout error. If you pass in false, it uses the existing audio stream, which is typically started in the contact flow, and immediately returns the result if enough audio has already been collected. If you pass in true, it starts a new audio stream and returns the result when enough audio has been collected. The default value is false.

The response will contain two results, AuthenticationResult and FraudDetectionResult. If one of them is disabled in the Set Voice ID contact flow block, the result will be null for that particular field. The authentication decision can be found at AuthenticationResult.Decision and it can be either AUTHENTICATED, NOT_AUTHENTICATED, OPTED_OUT, or NOT_ENROLLED. The fraud detection decision can be found at FraudDetection.Decision and it can be either HIGH_RISK or LOW_RISK.

Please note that there’s a known issue that you can’t start a new audio session within 4 minutes since the last session started. If you encounter SESSION_NOT_EXISTS error when you call evaluateSpeakerWithVoiceId(true), that is probably due to the issue. We’re working on addressing the issue very soon.

```js
voiceConnection.evaluateSpeakerWithVoiceId()
  .then((data) => {
    // authentication result
    const authDecision = data.AuthenticationResult.Decision;
    switch(authDecision) {
      case connect.ContactFlowAuthenticationDecision.AUTHENTICATED:
        // authenticated
        break;
      case connect.ContactFlowAuthenticationDecision.NOT_AUTHENTICATED:
        // not authenticated
        break;
      case connect.ContactFlowAuthenticationDecision.OPTED_OUT:
        // opted out
        break;
      case connect.ContactFlowAuthenticationDecision.NOT_ENROLLED:
        // not enrolled
        break;
    }

    // fraud detection result
    const fraudDetectionDecision = data.FraudDetectionResult.Decision;
    switch(fraudDetectionDecision) {
      case connect.ContactFlowFraudDetectionDecision.HIGH_RISK:
        // authenticated
        break;
      case connect.ContactFlowFraudDetectionDecision.LOW_RISK:
        // not authenticated
        break;
    }
  })
  .catch((err) => {
    console.error(err);
  });
```


### `voiceConnection.optOutVoiceIdSpeaker()`
Opts-out a customer from Voice ID. This API can work for the customer who hasn’t enrolled in Voice ID.

```js
voiceConnection.optOutVoiceIdSpeaker()
  .then((data) => {
    // it returns speaker data but no additional actions needed
  })
  .catch((err) => {
    console.error(err);
  });
```


### `voiceConnection.getVoiceIdSpeakerId()`
Gets the speaker ID of the customer, which is set by the Set Contact Attributes block in the contact flow.

```js
voiceConnection.getVoiceIdSpeakerId()
  .then((data) => {
    console.log(data.speakerId);
  })
  .catch((err) => {
    console.error(err);
  });
```


### `voiceConnection.deleteVoiceIdSpeaker()`
Deletes the speaker ID of the customer from Voice ID. This API work only if the customer exists in Voice ID.

```js
voiceConnection.deleteVoiceIdSpeaker()
  .then(() => {
  })
  .catch((err) => {
    console.error(err);
  });
```


### `voiceConnection.updateVoiceIdSpeakerId(string)`
Updates the speaker ID of the customer with the provided string.

```js
voiceConnection.deleteVoiceIdSpeaker()
  .then(() => {
  })
  .catch((err) => {
    console.error(err);
  });
```
