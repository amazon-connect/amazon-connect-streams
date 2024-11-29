# Amazon Connect Streams Documentation
(c) 2018-2020 Amazon.com, Inc. All rights reserved.

## Global Resiliency
For details on using Amazon Connect Streams with the Connect Global Resiliency feature, please first refer to the specific documentation [here](Documentation-DR.md).

### A note on "Routability"
Note that routability in streams is only affected by agent statuses. Voice contacts will change the agent status, and thus can affect routability. Task and chat contacts do not affect routability. However, if the other channels hit their concurrent live contact limit(s), the agent will not be routed more contacts, but they will technically be in a routable agent state.

# Usage
amazon-connect-streams is available from [npmjs.com](https://www.npmjs.com/package/amazon-connect-streams). If you'd like to download it here, you can use either of the files like `release/connect-streams*`. 

Run `npm run release` to generate new release files. Full instructions for building locally with npm can be found [below](#build-your-own-with-npm). 

In version 1.x, we also support `make` for legacy builds. This option was removed in version 2.x. 

## Overview
The Amazon Connect Streams API (Streams) gives you the power to integrate your existing web applications with Amazon Connect.  Streams lets you embed the Contact Control Panel (CCP) and Customer Profiles app UI into your page.  It also enables you to handle agent and contact state events directly through an object oriented event driven interface.  You can use the built in interface or build your own from scratch: Streams gives you the choice.

This library must be used in conjunction with
[amazon-connect-chatjs](https://github.com/amazon-connect/amazon-connect-chatjs),
[amazon-chime-sdk-js](https://github.com/aws/amazon-chime-sdk-js/blob/main/README.md),
or [amazon-connect-taskjs](https://github.com/amazon-connect/amazon-connect-taskjs)
in order to utilize Amazon Connect's Chat, Video or Task functionality.

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
3. In the navigation pane, choose "Approved origins".
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

### Instructions for Streams version 2.x:
```
$ git clone https://github.com/aws/amazon-connect-streams
$ cd amazon-connect-streams
$ npm install
$ npm run release
```

Find build artifacts in **release** directory - This will generate a file called `connect-streams.js` and the minified version of the same `connect-streams-min.js` - this is the full Connect Streams API which you will want to include in your page.

To run unit tests:
```
$ npm run test-mocha
```
Note: these tests run on the release files generated above

### Instructions for Streams version 1.x: 
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
Note: these tests run on the release files generated above

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
          region: 'eu-central-1', // REQUIRED for `CHAT`, optional otherwise
          softphone: {
            // optional, defaults below apply if not provided
            allowFramedSoftphone: true, // optional, defaults to false
            disableRingtone: false, // optional, defaults to false
            ringtoneUrl: '[your-ringtone-filepath].mp3', // optional, defaults to CCP’s default ringtone if a falsy value is set
            disableEchoCancellation: false, // optional, defaults to false
            allowFramedVideoCall: true, // optional, default to false
            allowFramedScreenSharing: true, // optional, default to false
            allowFramedScreenSharingPopUp: true, // optional, default to false
            VDIPlatform: null, // optional, provide with 'CITRIX' if using Citrix VDI, or use enum VDIPlatformType
            allowEarlyGum: true, //optional, default to true
          },
          task: {
            disableRingtone: false, // optional, defaults to false
            ringtoneUrl: "[your-ringtone-filepath].mp3" // optional, defaults to CCP's default ringtone if a falsy value is set
          },
          pageOptions: { //optional
            enableAudioDeviceSettings: false, //optional, defaults to 'false'
            enableVideoDeviceSettings: false, //optional, defaults to 'false'
            enablePhoneTypeSettings: true //optional, defaults to 'true' 
          },
          shouldAddNamespaceToLogs: false, //optional, defaults to 'false'
          ccpAckTimeout: 5000, //optional, defaults to 3000 (ms)
          ccpSynTimeout: 3000, //optional, defaults to 1000 (ms)
          ccpLoadTimeout: 10000 //optional, defaults to 5000 (ms)
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
  the case of SAML authentication. [See more information](#saml-authentication)
* `softphone`: This object is optional and allows you to specify some settings
  surrounding the softphone feature of Connect.
  * `allowFramedSoftphone`: Normally, the softphone microphone and speaker
    components are not allowed to be hosted in an iframe. This is because the
    softphone must be hosted in a single window or tab. The window hosting
    the softphone session must not be closed during the course of a softphone
    call or the call will be disconnected. If `allowFramedSoftphone` is `true`,
    the softphone components will be allowed to be hosted in this window or tab.
    If `allowFramedSoftphone` is `false`, please make sure you are importing the
    [lily-rtc.js](https://github.com/aws/connect-rtc-js) package and adding `connect.core.initSoftphoneManager()`
    to your code after `connect.core.initCCP()`.
  * `disableRingtone`: This option allows you to completely disable the built-in
    ringtone audio that is played when a call is incoming.
  * `ringtoneUrl`: If the ringtone is not disabled, this allows for overriding
    the ringtone with any browser-supported audio file accessible by the user.
  * `disableEchoCancellation`: This option is only applicable in Chrome and allows you to initialize a custom or
    embedded CCP with echo cancellation disabled. Setting this to `true` will disable **ALL** audio processing done by Chrome including Auto Gain Control.
    - Please see this link https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/improve-call-quality-on-agent-workstations-in-amazon-connect-contact-centers.html for possible alternative options in approving auto quality.
  - `allowFramedVideoCall`: Currently video call can only be in one single window or tab. If `true`, CCP will handle  video calling experience in this window or tab and agents would be able to see and turn  on their video if they have video permission set in the security profile. If `false` or not provided, CCP will only provide voice calling.
   - `allowFramedScreenSharing`: Currently it is recommended to enable screen share button on only one CCP in one single window or tab. If `true`, the Contact Control Panel will display the screen share button on that window or tab.
  - `allowFramedScreenSharingPopUp`: If `true`, clicking the screen sharing button in the embedded CCP will launch the screen sharing app in a new window. If `false` or not provided, clicking the button will not launch the screen sharing app.
  - `VDIPlatform`: This option is only applicable for virtual desktop interface integrations. If set, it will configure CCP to optimize softphone audio configuration for the VDI. Options can be provided by using enum `VDIPlatformType`. If `allowFramedSoftphone` is `false` and `VDIPlatform` is going to be set, please make sure you are passing this parameter into `connect.core.initSoftphoneManager()`. For example, `connect.core.initSoftphoneManager({ VDIPlatform: "CITRIX" })`
  - `allowEarlyGum`: If `true` or not provided, CCP will capture the agent’s browser microphone media stream before the contact arrives to reduce the call setup latency. If `false`, CCP will only capture agent media stream after the contact arrives.
- `pageOptions`: This object is optional and allows you to configure which configuration sections are displayed in the settings tab.
  - `enableAudioDeviceSettings`: If `true`, the settings tab will display a section for configuring audio input and output devices for the agent's local
    machine. If `false`, or if `pageOptions` is not provided, the agent will not be able to change audio device settings from the settings tab. will not be
    displayed.
    - Important Note: If you are using Firefox as your browser, the output audio device list will be empty and CCP will use the computer's default output audio settings.
    - To enable output devices for Audio Device Settings, please enable `media.setsinkid.enabled` in Firefox by navigating to `about:config` in Firefox. Then, search for `media.setsinkid.enabled` and toggle it to true.
  - `enableVideoDeviceSettings`: If `true`, the settings tab will display a section for configuring video input devices for the agent's local
    machine. If `false`, or if `pageOptions` is not provided, the agent will not be able to change video device settings from the settings tab. will not be
    displayed.
  - `enablePhoneTypeSettings`: If `true`, or if `pageOptions` is not provided, the settings tab will display a section for configuring the agent's phone type
    and deskphone number. If `false`, the agent will not be able to change the phone type or deskphone number from the settings tab.
- `shouldAddNamespaceToLogs`: prepends `[CCP]` to all logs logged by the CCP. Important note: there are a few logs made by the CCP before the namespace is prepended.
- `ccpAckTimeout`: A timeout in ms that tells CCP how long it should wait for an `ACKNOWLEDGE` message from the shared worker after CCP has sent a `SYNCHRONIZE` message to the shared worker. This is important because an `ACKNOWLEDGE` message is only sent back to CCP if the shared worker is initialized and a shared worker is only initialized if the agent is logged in. Moreover, this check happens continuously.
- `ccpSynTimeout`: A timeout in ms that tells CCP how long to wait before sending another `SYNCHRONIZE` message to the shared worker, which should trigger the shared worker to send back an `ACKNOWLEDGE` if initialized. This event essentially checks if the shared worker was initialized aka agent is logged in. This check happens continuously as well.
- `ccpLoadTimeout`: A timeout in ms that tells CCP how long to wait before sending the very first `SYNCHRONIZE` message. The user experience here is that on the first CCP initialization, the login flow is delayed by this timeout.
  - As an example, if this timeout was set to 10 seconds, then the login pop-up will not open up until 10 seconds has pass.

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
* If you are building your own video functionalities, please also include
  [Amazon Chime SDK JS](https://github.com/aws/amazon-chime-sdk-js) in your code. You can also include
  [Amazon Chime SDK Component Library React](https://github.com/aws/amazon-chime-sdk-component-library-react) to
  leverage ready-to-use UI and state managements components in React.
* If you are using task functionalities you must include [TaskJS](https://github.com/amazon-connect/amazon-connect-taskjs). TaskJS should be imported after Streams.
* If you'd like access to the WebRTC session to further customize the softphone experience
  you can use [connect-rtc-js](https://github.com/aws/connect-rtc-js). Please refer to the connect-rtc-js readme for detailed instructions on integrating connect-rtc-js with Streams.
* `initCCP` **should not be used to embed multiple CCPs in the same browser context** as this causes unpredictable behavior. In version 2.0 a check has been added to automatically prevent subsequent invocations of `initCCP` from embedding additional CCPs.
  * It is possible to embed multiple CCPs in the same page if they are associated with different Connect instances and are being embedded in different browser contexts, such that their Window objects are different (e.g. in different iframes). You won't be able to embed multiple CCPs under the same Window object or invoke `initCCP` multiple times in the same browser context.
  * Instead of loading Streams once for the whole page, you'll need to load Streams separately in each iframe, and invoke `initCCP` separately in each.
  * Once the iframes finish loading, you can then use the `contentWindow.connect` property on each iframe to access its Streams object and make API calls to the specific CCP embedded inside. As an example of embedding CCPs twice on the same page for two Connect instances, A and B:

```js
var frameA = document.createElement('iframe');
var frameB = document.createElement('iframe');
var contentDocumentA = [
       "<!DOCTYPE html>",
       "<meta charset='UTF-8'>",
       "<html>",
         "<head>",
           "<script type='text/javascript' src='https://cdn.jsdelivr.net/npm/amazon-connect-streams/release/connect-streams-min.js'>",
           "</script>",
         "</head>",
         "<body onload='init()' style='width:400px;height:800px'>",
           "<div id=containerDiv style='width:100%;height:100%'></div>",
           "<script type='text/javascript'>",
             "function init() {",
               "connect.core.initCCP(containerDiv, <initCCP parameters for instance A>);",
            "}",
           "</script>",
         "</body>",
       "</html>"
     ].join('');
var contentDocumentB = ...; // same as above, but with initCCP parameters for instance B
frameA.srcdoc = contentDocumentA;
frameB.srcdoc = contentDocumentB;
[frameA, frameB].forEach((frame) => {
  frame.allow = "microphone; autoplay; clipboard-write";
  frame.style = "width:400px;height:800px;margin:0;border:0;padding:0px;";
  frame.scrolling = "no";
  document.documentElement.append(frame); // You can append the frames wherever you need each CCP to appear.
});

// Wait for iframes to load, then contentWindow.connect will be set to each frame's Streams object.
// Until the iframes have finished loading Streams, contentWindow.connect will be undefined
var connectA = frameA.contentWindow.connect;
var connectB = frameB.contentWindow.connect;

connectA.contact(function(contact) { /* ... */ });
```

### How can I determine that the agent is logged out or that their session has expired?
* You can use `connect.core.onAuthFail()` to subscribe a callback function that will be called if the agent was unable to authenticate to Connect using the credentials set in their browser (if any), so you can present a button or popup for the agent to log back in or start a new session.
```js
connect.core.onAuthFail(function(){
  // agent logged out or session expired.  needs login
  // show button for login or popup a login screen. 
});
```

## `connect.core`

### `connect.core.onIframeRetriesExhausted()`
```js
connect.core.onIframeRetriesExhausted(() => {
  console.log("We have run out of retries to reload the CCP Iframe");
})
```
Subscribes a callback function to be called when the iframe failed to load, after attempting all retries. An Iframe Retry (refresh of the iframe page) is scheduled whenever there is a `connect.EventType.ACK_TIMEOUT`. If a `connect.EventType.ACKNOWLEDGE` event happens before the scheduled retry, the retry is cancelled. We allow for 6 scheduled retries. Once these are exhausted, `connect.EventType.ACK_TIMEOUT` events do not trigger scheduled retries.

### `connect.core.onAuthorizeSuccess()`
```js
connect.core.onAuthorizeSuccess(() => {
  console.log("authorization succeeded! Hooray");
});
```
Subscribes a callback function to be called when the agent authorization api succeeds.

### `connect.core.onCTIAuthorizeRetriesExhausted()`
```js
connect.core.onCTIAuthorizeRetriesExhausted(() => {
  console.log("We have failed CTI API authorization multiple times and we are out of retries");
});
```
Subscribes a callback function to be called when multiple authorization-type CTI API failures have happened. After this event occurs, streams will not try to re-authenticate the user when more CTI API authorization-type (401) failures happen. Note that CTI APIs are the agent, contact, and connection apis (specifically, those listed under the `connect.ClientMethods` enum). Therefore, it may be prudent to indicate to the agent that there is a problem related to authorization.

### `connect.core.onAuthorizeRetriesExhausted()`
```js
connect.core.onAuthorizeRetriesExhausted(() => {
  console.log("We have failed the agent authorization api multiple times and we are out of retries");
});
```
Subscribes a callback function to be called when multiple agent authorization api failures have happened. After this event occurs, streams will not try to redirect the user to login when more agent authorization api failures happen. Therefore, it may be prudent to indicate to the agent that there is a problem related to authorization.

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

More precisely, `onViewContact` is called in the below scenarios:

1. There is a new incoming contact, and there are no other contacts currently open in CCP. This includes both outbound contacts and contacts that are accepted using auto-accept
2. A contact is closed and there is at least one other open contact
    1. CCP will call `onViewContact` with the next contact in the list of contacts
3. A contact has been selected as the active contact in CCP. This can happen in multiple ways
    1. An agent clicks on that contact’s tab in native or embedded CCP
    2. CCP will trigger `onViewContact` when the close contact button is clicked in native or embedded CCP. CCP will call `onViewContact` with the next contact in the list of contacts. Note that this is redundant with scenario 2 and will result in `onViewContact` being called twice. 
4. A new contact has been accepted using the accept contact button in native or embedded CCP
5. `connect.core.viewContact` is called in your custom implementation
6. There are some cases when `onViewContact` is called with an empty string. This denotes that the active contact has been unset. That happens in the following scenarios:
    1. The close contact button is clicked and there are no other active contacts
    2. An agent clicks on a new channel in CCP
        1. Note: in this case `onViewContact` will be called with a contact from the newly selected channel shortly after

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

## SAML Authentication
Streams support Security Assertion Markup Language (SAML) 2.0 to enable single sign-on (SSO) which will allow users to sign in through a SAML 2.0 compatible identity provider (IdP) and gain access to the instance without having to provide separate credentials.
### Using SAML with Streams
Going through the basic use case: Customers should be logging in through their IdP by opening a popout window/tab to start the SSO flow. Inside the [`initCCP`](#initialization) function, there are certain optional parameters to take note of which will be useful in setting up SAML. The first will be `loginUrl`, which allows users to link their IdP with Streams. Other optional parameters include `loginPopup`(by default is `true`) and `loginOptions`(only used when `loginPopup` is `true`) which handles the configuration of the popup window for login. When configured correctly, Streams should open up a new window/tab with the login URL provided when authentication is needed, and in the background, a hidden CCP iFrame (built in with streams) will refresh every five seconds until the customer's authentication credentials have been verified. For CCP to load successfully, the SAML federation must be completed successfully along with CCP's initialization execution flow.
### SSO with a hidden iFrame
As mentioned above, Streams is currently built with full support for those who perform the SSO flow in a pop out window/tab. For users who would like to perform SSO in an hidden iframe within the same window, please be aware that the IdP may contain a same-origin-policy which can prevent the interactions between the user's domain and IdP. Users will then have to perform the SSO flow by going through the method mentioned above, or delegating the iframe to SSO.

**Note**: For users who want to remove the SSO hidden iframe, please wait until CCP's initialization and SAML flow execution are executed successfully. From the function `connect.core.onInitialized(callback)`, mentioned above, you can add a callback function after CCP initialization execution is complete, Other functions that may be helpful to help monitor the authentication flow are `connect.core.onAuthFail(callback)`(allows users to subscribe a callback function when authentication fails), and `connect.core.onAuthorizeRetriesExhausted(callback)`(subscribes a callback function when multiple agent authorization api failures have happened)

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
agent.onSoftphoneError(function(error) { 
   console.log("Error type: ", error.errorType); 
   console.log("Error message: ", error.errorMessage); 
   console.log("Error endpoint url: ", error.endPointUrl);
});
```
Subscribe a method to be called when the agent is put into an error state specific to softphone funcionality.

The `error` argument is a `connect.SoftphoneError` instance with the following fields: `errorType`, `errorMessage`, `endPointUrl`.

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

This object may contain a state that was predefined by the system. Please see [`agent.getAvailabilityState()`](#agentgetavailabilitystate) to retrieve the agent's user-defined state.
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

- `agentStates`: See `agent.getAgentStates()` for more info.
- `dialableCountries`: See `agent.getDialableCountries()` for more info.
- `extension`: See `agent.getExtension()` for more info.
- `name`: See `agent.getName()` for more info.
- `permissions`: See `agent.getPermissions()` for more info.
- `routingProfile`: See `agent.getRoutingProfile()` for more info.
- `softphoneAutoAccept`: Indicates whether auto accept soft phone calls is enabled.
- `softphoneEnabled`: See `agent.isSoftphoneEnabled()` for more info.
- `username`: The username for the agent as entered in their Amazon Connect user account.
- `agentARN`: See `agent.getAgentARN()` for more info.

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

### `agent.getAvailabilityState()`
```js
var agentState = agent.getAvailabilityState();
```
Unlike [`agent.getState()`](#agentgetstate--agentgetstatus) which could return a system defined state,
this function will only return the agent's current [user-changeable / definable state](https://docs.aws.amazon.com/connect/latest/adminguide/agent-custom.html).
The object will contain the following fields:

* `state` The name of the agent state.
* `timestamp`: A `Date` object that indicates when the agent was set to that state.

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

### `agent.getAgentARN()`

```js
const agentARN = agent.getAgentARN();
```

Gets the agent's ARN.

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
);
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
Creates an outbound contact to the given endpoint. Only phone number endpoints are supported. You can optionally provide a `queueARN` to associate the contact with a queue.

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
Sets the agent local media to mute mode. If `Enhanced monitoring & Mutiparty` is enabled, use 
`voiceConnection.muteParticipant()` when there are more than 2 agent connections (see example 
[here](cheat-sheet.md#mute-agent)), since `voiceConnection.muteParticipant()` 
will mute the connection on the server side, and the server side mute value is the only one 
accounted for when there are more than 2 connections.

### `agent.unmute()`
```js
agent.unmute();
```
Sets the agent localmedia to unmute mode. If `Enhanced monitoring & Mutiparty` is enabled, use 
`voiceConnection.unmuteParticipant()` when there are more than 2 agent connections (see example 
[here](cheat-sheet.md#mute-agent)), since `voiceConnection.unmuteParticipant()` will unmute the 
connection on the server side, and the server side mute value is the only one accounted for when 
there are more than 2 connections.


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
The microphone device can be changed while agent is having a softphone call with a microphone media stream attached to it.
To properly set a microphone device for every softphone call, you can call this API in the callback function passed to onLocalMediaStreamCreated API.

```js
agent.onLocalMediaStreamCreated(() => {
  agent.setMicrophoneDevice(deviceId);
});
```

### `agent.setCameraDevice()`

```js
agent.setCameraDevice(deviceId);
```

The `agent.setCameraDevice()` API is used to broadcast a change in the camera device (input device for camera) state. However, it does not actually switch the camera device. Instead, it triggers the [`agent.onCameraDeviceChanged()`](#agentoncameradevicechanged) callback to notify listeners of the updated camera device state.

To handle the camera functionality, you would need to use either the [Amazon Chime SDK JS](https://github.com/aws/amazon-chime-sdk-js) or the [Amazon Chime SDK Component Library React](https://github.com/aws/amazon-chime-sdk-component-library-react). Specifically, you can use the following APIs:

* [Amazon Chime SDK JS - audioVideo.startVideoInput](https://aws.github.io/amazon-chime-sdk-js/classes/defaultaudiovideofacade.html#startvideoinput)
* [Amazon Chime SDK Component Library React - useVideoInputs](https://aws.github.io/amazon-chime-sdk-component-library-react/?path=/docs/sdk-hooks-usevideoinputs--page)

After you have selected a new device using the Chime SDK, you can use `agent.setCameraDevice(deviceId)` to notify the state update, and then use the [`agent.onCameraDeviceChanged()`](#agentoncameradevicechanged) callback to handle the state update.

### `agent.setBackgroundBlur()`

```js
agent.setBackgroundBlur(isBackgroundBlurEnabled);
```

The `agent.setBackgroundBlur()` API is used to broadcast a change in the Background Blur state. However, it does not actually enable or disable the blur effect. Instead, it triggers the [`agent.onBackgroundBlurChanged()`](#agentonbackgroundblurchanged) callback to notify listeners of the updated blur state.

To handle the Background Blur functionality, you would need to use either the [Amazon Chime SDK JS](https://github.com/aws/amazon-chime-sdk-js) or the [Amazon Chime SDK Component Library React](https://github.com/aws/amazon-chime-sdk-component-library-react). Specifically, you can refer to the following resources:

* [Amazon Chime SDK JS - Adding background filters to your application](https://aws.github.io/amazon-chime-sdk-js/modules/backgroundfilter_videofx_processor.html#adding-background-filters-to-your-application)
* [Amazon Chime SDK Component Library React - BackgroundBlurProvider](https://aws.github.io/amazon-chime-sdk-component-library-react/?path=/docs/sdk-providers-backgroundblurprovider--page)

After you have changed the actual Background Blur state using the Chime SDK, you can use `agent.setBackgroundBlur(isBackgroundBlurEnabled)` to notify the state update, and then use the [`agent.onBackgroundBlurChanged()`](#agentonbackgroundblurchanged) callback to handle the state update.

### `agent.setRingerDevice()`
```js
agent.setRingerDevice(deviceId);
```
Sets the ringer device (output device for ringtone)

### `agent.onLocalMediaStreamCreated()`

```js
agent.onLocalMediaStreamCreated((data) => {
  console.log('local media stream created for connection: ', data.connectionId);
});
```

Subscribe a method to be called when the agent's microphone media stream is attached to the WebRTC connection for a softphone call, which happens between connect.ContactEvents.CONNECTING and connect.ContactEvents.CONNECTED events.
This API is useful to do operations that require the local media stream such as setMicrophoneDevice and mute/unmute before CONNECTED event.

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

### `agent.onCameraDeviceChanged()`
```js
agent.onCameraDeviceChanged(function(obj) { /* ... */ });
```
Subscribe a method to be called when the agent changes the camera device (input device for call video).

### `agent.onBackgroundBlurChanged()`
```js
agent.onBackgroundBlurChanged(function(obj) { /* ... */ });
```

Subscribe a method to be called when the agent enables or disables Background Blur for the camera device (input device for call video).

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

Subscribe a method to be invoked whenever the contact is accepted. Please note that this event doesn't get triggered for agents using a deskphone.

### `contact.onMissed()`
```js
contact.onMissed(function(contact) { /* ... */ });
```
Subscribe a method to be invoked whenever the contact is missed. This is an event which is fired when a contact is put in state "missed" by the backend, which happens when the agent does not answer for a certain amount of time, when the agent rejects the call, or when the other participant hangs up before the agent can accept.

### `contact.onEnded()`
```js
contact.onEnded(function(contact) { /* ... */ });
```
Subscribe a method to be invoked whenever the contact is ended. This could be due to the conversation
being ended by the agent, or due to the contact being missed. Call `contact.getState()` to determine the state
of the contact and take appropriate action.

[Update on v2.7.0]
The callback function registered via `contact.onEnded ` is no longer invoked when the contact is destroyed. This fix prevents the callback from being invoked twice on ENDED and DESTROYED events.

### `contact.onDestroy()`
```js
contact.onDestroy(function(contact) { /* ... */ });
```
Subscribe a method to be invoked whenever the contact is destroyed.

### `contact.onACW()`
```js
contact.onACW(function(contact) { /* ... */ });
```
Subscribe a method to be invoked whenever the contact enters the ACW state, named `ContactStateType.ENDED`. This is after the connection has been closed, but before the contact is destroyed.

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
This event happens when the *contact* state type is `error`. This is a new change as of version 1.7.6, this api used to not function at all due to the manner in which we were launching contact events. 

**NOTE**
This description used to read "This event happens when the *agent* state type is `error`. 
The agent state type description was never accurate, as the event was never triggered, even though the source code's intention was to trigger the event on an error agent state type.

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

### `contact.getActiveConnections()`

```js
var activeConns = contact.getActiveConnections();
```

Get a list of all active connections, i.e. connections that have not been disconnected.

### `contact.hasTwoActiveParticipants()`

```js
if (contact.hasTwoActiveParticipants()) {
  /* ... */
}
```

Determines if there are exactly two active participants on a contact.

When using enhanced monitoring & barge, if there are only two active participants on a contact,
and one of them is the manager who has barged in, the manager cannot switch back to monitoring mode.

### `contact.getAttributes()`
```js
var attributeMap = contact.getAttributes(); // e.g. { "foo": { "name": "foo", "value": "bar" } }
```
Gets a map of the attributes associated with the contact. Each value in the map has the following shape: `{ name: string, value: string }`.

Please note that this api method will return null when the current user is monitoring the contact, rather than being an active participant in the contact.

### `contact.startScreenSharing(skipSessionInitiation)`

```js
try {
  await contact.startScreenSharing();
} catch (err) {
  /* ... */
}
```

Initiates the screen sharing session for the contact.

The method first verifies that the contact is a web calling contact (contact subtype must be `connect:WebRTC`) and that the contact is in a connected state (`this.isConnected()` is `true`). If either condition is not met, an error is thrown.

Once these conditions are satisfied, the `StartScreenSharing` API in Amazon Connect Service is called to initiate the screen sharing session.

If screen sharing session initiation succeeds, `contact.onScreenSharingStarted` event is fired.
If screen sharing session initiation fails, the `contact.onScreenSharingError` event is fired.

* `skipSessionInitiation`: A boolean that, if set to `true`, skips the screen sharing session initiation process, and directly trigger the `onScreenSharingStarted` event. Defaults to `false`.

### `contact.stopScreenSharing`

```js
try {
  await contact.stopScreenSharing();
} catch (err) {
  /* ... */
}
```

Stops the ongoing screen sharing session for the contact.

The method first verifies that the contact is a web calling contact (contact subtype must be `connect:WebRTC`) and that the contact is in a connected state (`this.isConnected()` is `true`). If either condition is not met, an error is thrown.

Once these conditions are satisfied, it fires `contact.onScreenSharingStopped` event.

### `contact.onScreenSharingStarted`

```js
contact.onScreenSharingStarted(function () {
  /* ... */
});
```

Subscribe a method to be invoked when screen sharing session is started for the contact.
This event is triggered when the screen sharing session is successfully initiated for WebRTC contacts.

### `contact.onScreenSharingStopped`

```js
contact.onScreenSharingStopped(function () {
  /* ... */
});
```

Subscribe a method to be invoked when screen sharing session is stopped for the contact.
This event is triggered when the screen sharing session is terminated for WebRTC contacts.

### `contact.onScreenSharingError`

```js
contact.onScreenSharingError(function (error) {
  /* ... */
});
```

Subscribe a method to be invoked when screen sharing session initiation fails for the contact.
This event is triggered when `contact.startScreenSharing` call fails.

### `contact.getSegmentAttributes()`

```js
var segmentAttributes = contact.getSegmentAttributes(); // e.g. { "connect:Direction": { "ValueString": "INBOUND" }, "connect:Subtype": { "ValueString": "connect:WebRTC" } }
```

Gets a map of segment attributes associated with the contact. The current possible segment attributes are `connect:Subtype` and `connect:Direction`. Calling `getContactSubtype()` on a given contact will return the same value as calling `segmentAttributes['connectSubtype']`

### `contact.getContactSubtype()`

```js
var contactSubtype = contact.getContactSubtype();
```

Get the subtype of the contact. This information is also present in segmentAttributes under the key `connect:Subtype`.

This further differntiates the contact within a contact Type. Currently it's used to distinguish chat and voice contacts. For example:

- Voice calls started using StartWebRTCContact has a subType value of `connect:WebRTC`
- SMS chat contacts contain the subType value of `connect:SMS`

### `contact.isSoftphoneCall()`
```js
if (contact.isSoftphoneCall()) { /* ... */ }
```
Determine whether this contact is a softphone call.

### `contact.hasVideoRTCCapabilities()`

```js
if (contact.hasVideoRTCCapabilities()) {
  /* ... */
}
```

Determine whether this contact has video capabilities.

### `contact.hasScreenShareCapability()`

```js
if (contact.hasScreenShareCapability()) {
  /* ... */
}
```

Determine whether this contact has screen share capability.

### `contact.canAgentSendVideo()`

```js
if (contact.canAgentSendVideo()) {
  /* ... */
}
```

Determine whether the agent in this contact can send video.

### `contact.canAgentReceiveVideo()`

```js
if (contact.canAgentReceiveVideo()) {
  /* ... */
}
```

Determine whether the agent in this contact can receive video.

### `contact.canAgentSendScreenShare()`

```js
if (contact.canAgentSendScreenShare()) {
  /* ... */
}
```

Determine whether the agent in this contact can send screen share.

### `contact.canCustomerSendScreenShare()`

```js
if (contact.canCustomerSendScreenShare()) {
  /* ... */
}
```

Determine whether the customer in this contact can send screen share.

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
when the contact is no longer actively being worked on (i.e. it's one of ERROR, ENDED, MISSED, REJECTED). 
It works for both monitoring and non-monitoring connections.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.complete()` (DEPRECATED)
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

### `contact.isMultiPartyConferenceEnabled()`
```js
if (contact.isMultiPartyConferenceEnabled()) { /* ... */ }
```
Determine whether this contact is a softphone call and multiparty conference feature is turned on.

### `contact.isUnderSupervision()`

```js
if (contact.isUnderSupervision()) {
  /* ... */
}
```

Determines if the contact is under manager's supervision, meaning there is another agent on the contact
that is in barge mode.

### `contact.updateMonitorParticipantState()`

```js
contact.updateMonitorParticipantState(targetState, {
  success: function () {
    /* ... */
  },
  failure: function (err) {
    /* ... */
  },
});
```

Updates the monitor participant state to switch between different monitoring modes.

- `targetState`: The target monitoring state type, as per the `MonitoringMode` enumeration.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.silentMonitor()`

```js
contact.silentMonitor({
  success: function () {
    /* ... */
  },
  failure: function (err) {
    /* ... */
  },
});
```

Updates the monitor participant state to silent monitoring mode.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.bargeIn()`

```js
contact.bargeIn({
  success: function () {
    /* ... */
  },
  failure: function (err) {
    /* ... */
  },
});
```

Updates the monitor participant state to barge mode.

Optional success and failure callbacks can be provided to determine if the operation was successful.

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

### `contact.getChannelContext()`
```js
var channelContext = contact.getChannelContext();
```
Gets the channel context for the contact. For task contacts the channel context contains `scheduledTime`,  `taskTemplateId`, `taskTemplateVersion` properties. It might look like the following:

```js
{
  scheduledTime: 1646609220
  taskTemplateId: "ba6db758-d31e-4c6c-bd51-14d8b4686ece"
  taskTemplateVersion: 1
}
```

### `contact.pause()`

```js
contact.pause({
  success: function () {
    /* ... */
  },
  failure: function (err) {
    /* ... */
  },
});
```

Pause a connected contact.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `contact.resume()`

```js
contact.resume({
  success: function () {
    /* ... */
  },
  failure: function (err) {
    /* ... */
  },
});
```

Resume a paused contact.

Optional success and failure callbacks can be provided to determine if the operation was successful.


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
Determine if the connection is connected, meaning that the agent is live in a conversation through this connection. Please note that `ConnectionStateType.SILENT_MONITOR` and `ConnectionStateType.BARGE` are considered connected as well.
   
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
Put this connection on hold. In two-party calls, it only should be called on the 'initialConnection' (aka customer connection), not on the agent connection. For calls with three or more parties, hold can be used on agent connection. Using hold on a customer connection will ensure that customer doesn't hear the rest of the participants, while using hold on an agent connection will keep customer's ability to speak with other participants, while the agent cannot be heard.

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
#### Multiparty call
Any agent participant can mute another agent participant. 

#### Supervisor barges into the call
Agents can mute themselves, but cannot mute other agents or supervisor.  

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `voiceConnection.unmuteParticipant()`
```js
conn.unmuteParticipant({
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```

Unmute the connection server side.

### `voiceConnection.canSendVideo()`

```js
if (conn.canSendVideo()) {
  /* ... */
}
```

Determine whether agent/customer in this connection can send video.

### `voiceConnection.getCapabilities()`

```js
var capabilities = conn.getCapabilities(); // e.g. { "Video": "SEND" }
```

Returns the capabilities associated with this connection, or `null` if that does not exist.

### `voiceConnection.getVideoConnectionInfo()`

```js
conn
  .getVideoConnectionInfo()
  .then(function (response) {
    /* ... */
  })
  .catch(function (error) {
    /* ... */
  });
```

Example response:

```js
{
  "attendee": {
      "attendeeId": "attendeeId",
      "joinToken": "joinToken"
  },
  "meeting": {
      "mediaPlacement": {
          "audioFallbackUrl": "audioFallbackUrl",
          "audioHostUrl": "audioHostUrl",
          "eventIngestionUrl": "eventIngestionUrl",
          "signalingUrl": "signalingUrl",
          "turnControlUrl": "turnControlUrl"
      },
      "mediaRegion": "us-east-1",
      "meetingFeatures": null,
      "meetingId": "meetingId"
  }
}
```

Provides a promise which resolves with the API response from createTransport transportType web_rtc for this connection.
You can use the meeting and attendee info to join a video session. Please refer to
[Amazon Chime SDK JS](https://github.com/aws/amazon-chime-sdk-js/blob/main/README.md) for more info.

#### Multiparty call

Any agent can only unmute themselves.

#### Supervisor barges into the call
Agents can only unmute themselves up until the point they have been muted by the supervisor (isForcedMute API can help checking that). Once they have been muted by the supervisor, agent cannot unmute themselves until supervisor unmutes agent (at which point agent will regain ability to mute and unmute themselves). If supervisor has muted but not unmuted agent then drops from call, agent will be able to unmute themselves once supervisor has dropped.

Optional success and failure callbacks can be provided to determine if the operation was successful.

### `voiceConnection.isSilentMonitor()`

```js
if (conn.isSilentMonitor()) {
  /* ... */
}
```

Determine whether the connection is in silent monitoring state. Only the supervisor will see this connection in the snapshot,
other agents will not see the supervisor's connection in the snapshot while it is in silent monitor state.

### `voiceConnection.isBarge()`

```js
if (conn.isBarge()) {
  /* ... */
}
```

Determine whether the connection is in barge state. All agents will see the supervisor's connection in the snapshot while
it is in barge state.

### `voiceConnection.isSilentMonitorEnabled()`

```js
if (conn.isSilentMonitorEnabled()) {
  /* ... */
}
```

Determines if the agent has the ability to enter silent monitoring state,
meaning the agent's monitoringCapabilities contain `MonitoringMode.SILENT_MONITOR` type.

### `voiceConnection.isBargeEnabled()`

```js
if (conn.isBargeEnabled()) {
  /* ... */
}
```

Determines if the agent has the ability to enter barge state,
meaning the agent's monitoringCapabilities contain `MonitoringMode.BARGE` type.

### `voiceConnection.getMonitorCapabilities()`

```js
var monitorCapabilities = conn.getMonitorCapabilities();
```

Returns the array of enabled monitor states of this connection. The array will consist of MonitoringMode enum values.

### `voiceConnection.getMonitorStatus()`

```js
var monitorStatus = conn.getMonitorStatus();
```

Returns the current monitoring state of this connection. This value can be one of MonitoringMode enum values
if the agent is supervisor, otherwise the monitorStatus will be undefined for the agent.

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

### `chatConnection.isSilentMonitor()`

```js
if (conn.isSilentMonitor()) {
  /* ... */
}
```

Determine whether the connection is in silent monitoring state. Only the supervisor will see this connection in the snapshot,
other agents will not see the supervisor's connection in the snapshot while it is in silent monitor state.

### `chatConnection.isBarge()`

```js
if (conn.isBarge()) {
  /* ... */
}
```

Determine whether the connection is in barge state. All agents will see the supervisor's connection in the snapshot while
it is in barge state.

### `chatConnection.isSilentMonitorEnabled()`

```js
if (conn.isSilentMonitorEnabled()) {
  /* ... */
}
```

Determines if the agent has the ability to enter silent monitoring state,
meaning the agent's monitoringCapabilities contain `MonitoringMode.SILENT_MONITOR` type.

### `chatConnection.isBargeEnabled()`

```js
if (conn.isBargeEnabled()) {
  /* ... */
}
```

Determines if the agent has the ability to enter barge state,
meaning the agent's monitoringCapabilities contain `MonitoringMode.BARGE` type.

### `chatConnection.getMonitorCapabilities()`

```js
var monitorCapabilities = conn.getMonitorCapabilities();
```

Returns the array of enabled monitor states of this connection. The array will consist of MonitoringMode enum values.

### `chatConnection.getMonitorStatus()`

```js
var monitorStatus = conn.getMonitorStatus();
```

Returns the current monitoring state of this connection. This value can be one of MonitoringMode enum values
if the agent is supervisor, otherwise the monitorStatus will be undefined for the agent.

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

###  `MonitoringMode`
Lists the different monitoring modes representing a manager listen-in session.

* `MonitoringMode.SILENT_MONITOR`: An enhanced listen-in manager session
* `MonitoringMode.BARGE`: A special manager session mode with full control over contact actions

### `MonitoringErrorTypes`
Lists the different monitoring error states.
* `MonitoringErrorTypes.INVALID_TARGET_STATE`: Indicates that invalid target state has been passed

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
* `ConnectionStateType.SILENT_MONITOR`: An enhanced listen-in manager session, this state is used instead of `ContactStateType.CONNECTED` for manager
* `ContactStateType.BARGE`: A special manager session mode with full control over contact actions, this state is used instead of `ContactStateType.CONNECTED` for manager

### `ContactType`
This enumeration lists all of the contact types supported by Connect Streams.

* `ContactType.VOICE`: Normal incoming and outgoing voice calls.
* `ContactType.QUEUE_CALLBACK`: Special outbound voice calls which are routed to agents before being placed. For more information about how to setup and use queued callbacks, see the Amazon Connect user documentation.
* `ContactType.CHAT`: Chat contact.
* `ContactType.TASK`: Task contact.

### `EventType`
This is a list of some of the special event types which are published into the low-level
`EventBus`.

* `EventType.ACKNOWLEDGE`: Event received when the backend API shared worker acknowledges the current tab. More specifically, it is sent to Streams in the following scenarios:
  - a consumer port connects to the shared worker
  - when Streams sends the `EventType.SYNCHRONIZE` to the shared worker, the shared worker sends the `ACKNOWLEDGE` event back. This happens every few seconds so that Streams and the shared worker are synchronized.
* `EventType.ACK_TIMEOUT`: Event which is published if the backend API shared worker fails to respond to an `EventType.SYNCHRONIZE` event in a timely manner, meaning that the tab or window has been disconnected from the shared worker.
* `EventType.IFRAME_RETRIES_EXHAUSTED`: Event which is published once the hard limit of 6 CCP retries are all exhausted. These retries are tiggered by the `ACK_TIMEOUT` event above.
* `EventType.AUTH_FAIL`: Event published indicating that the most recent API call returned a status header indicating that the current user authentication is no longer valid. This usually requires the user to log in again for the CCP to continue to function. See `connect.core.initCCP()` under **Initialization** for more information about automatic login popups which can be used to give the user the chance to log in again when this happens.
* `EventType.LOG`: An event published whenever the CCP or the API shared worker creates a log entry.
* `EventType.TERMINATED`: When the `EventType.TERMINATE` (not `TERMINATED`) event is sent to Streams, it is forwarded to the shared worker, which on successful termination then sends `EventType.TERMINATED` event back to Streams.  The `EventType.TERMINATE` event is sent to Streams in the following scenarios:
  - The CCP is initialized as an agent app (via `connect.agentApp.initApp`), and `connect.agentApp.stopApp` is invoked
  - The user manually logs out of the CCP

### `AgentEvents`
Event types that affect the agent's state.

* `AgentEvents.UPDATE`: this event is sent to Streams in the following scenarios:
  - a consumer port connects to the shared worker
  - when the shared worker or ccp is first initialized, then again repeated every few seconds
  - when the `EventType.RELOAD_AGENT_CONFIGURATION` event is sent to the shared worker. This happens in the `Agent.prototype.setConfiguration` method (which is invoked when the ccp settings are saved in the UI)

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

## Initialization for CCP, Customer Profiles, Amazon Q Connect, and CustomViews

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
    <main style="display: flex;">
      <div id="ccp-container"></div>
      <div id="customerprofiles-container"></div>
      <div id="wisdom-container"></div>
      <div id="customviews-container"></div>
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
        //used to initialize Amazon Q Connect
        connect.agentApp.initApp(
            "wisdom", 
            "wisdom-container", 
            connectUrl + "/wisdom-v2/",
            { style: "width:400px; height:600px;" }
        );

        /**
         * CustomViews applications are traditionally attached to a contact for auto handling the lifecycle of a customviews on the attached contacts destroy event. 
         * Customviews has a few additional options that can be passed into the initApp config under the customViewsParams property to enable this behavior.
         * NOTE: Destroyed customviews applications will be removed from the AppRegistry to clear their namespace when using customViewsParams.
         * WARNING: Failing to handle the lifecycle of a customview by setting disableAutoDestroy to true and not calling terminateCustomView() on the application will cause the
         * customviews to count against your chat concurrency until it is terminated by the chat reaching its configured duration (defaults to 24 hours) or the Show View block timeout.
         * 
         * *OPTIONAL*
         * contact(contact | string): Attaches the contact to the customviews application, can be a contact object or contactId. 
         * If you use a contactId then disableAutoDestroy is true by default and you must use 
         * connect.core.terminateCustomView() to end the lifecycle of the customviews before closing the iframe. 
         * 
         * iframeSuffix (string): Attaches a suffix to the customviews application iframe id. This id will be formed as customviews{iframeSuffix}. 
         * Useful for instantiating multiple customviews applications in a single page and associating customviews applications with contactIds.
         * 
         * contactFlowId (string): The contactFlowId for the customviews that the application will display.
         * 
         * disableAutoDestroy (boolean): Disables the default handling of the views lifecycle behavior to not
         * terminate when the connected contact is closed. 
         * WARNING: NOT PROPERLY TERMINATING THE CUSTOMVIEW WITH CONNECT.CORE.TERMINATECUSTOMVIEW() BEFORE DESTROYING YOUR IFRAME CONTEXT WILL CAUSE THE CUSTOMVIEW TO COUNT AGAINST YOUR CHAT CONCURRENCY UNTIL IT IS TERMINATED BY THE DEFAULT CHAT OR CUSTOMVIEW FLOW TIMEOUT.
         * 
         * terminateCustomViewOptions (TerminateCustomViewOptions): Options around controlling the iframe's resolution behavior when disableAutoDestroy is true. 
         *  - resolveIframe (boolean): Whether to deconstruct the application iframe and clear its id in the AppRegistry, freeing the namespace of the applications id. Default true.
         * -  timeout (number): Timeout in ms. The amount of time to wait for the DOM to resolve and clear the iframe if resolveIframe is true. Default 5000.
         *  - hideIframe (boolean): Hides the iframe while it wait to be cleared from the DOM. Default true.
         * 
         **/
        connect.contact((contact)=>{
            contact.onConnected((contact)=>{
                connect.agentApp.initApp(
                  "customviews",
                  "customviews-container",
                  connectUrl + "/stargate/app",
                  { 
                    style: "width:400px; height:600px;",
                    customViewsParams: {
                      contact: contact,
                      contactFlowId: "55e028e0-62e5-44e7-aa81-eac163ed3fe1",
                      iframeSuffix: `${contact.getContactId()}-55e028e0-62e5-44e7-aa81-eac163ed3fe1`;
                      disableAutoDestroy: false,
                      {
                        hideIframe: true,
                        timeout: 5000,
                        resolveIframe: true,
                      }
                    },
                  }
              );
            });

            contact.onACW((contact)=>{
                connect.agentApp.initApp(
                  "customviews",
                  "customviews-container",
                  connectUrl + "/stargate/app",
                  { 
                    style: "width:400px; height:600px;",
                    customViewsParams: {
                      contact: contact,
                      contactFlowId: "70f643e7-7565-431b-9eb7-f5d666fc7a34",
                      iframeSuffix:`${contact.getContactId()}-70f643e7-7565-431b-9eb7-f5d666fc7a34`;
                      disableAutoDestroy: true
                    },
                  }
              );
            });

            // Because the onACW initApp for customviews has disableAutoDestroy set to true, we must manually terminate the customview 
            contact.onDestroy((contact) => {
              connect.core.terminateCustomView(
                connectUrl, 
                `${contact.getContactId()}-70f643e7-7565-431b-9eb7-f5d666fc7a34`,
                 {
                  resolveIframe: true,
                  timeout: 5000, 
                  hideIframe: true
                 }
              );
            })
        })
      }
    </script>
  </body>
</html>
```

Integrates with Amazon Connect by loading the pre-built app located at `appUrl` into an iframe and appending it into the DOM element with id of `containerId`. Underneath the hood, `initApp` creates a `WindowIOStream` for the iframes to communicate with the main CCP iframe, which is in charge of authenticating the agent's session, managing the agent state, and contact state.

- `name`: A string which should be one of `ccp`, `customerprofiles`, `wisdom`, or `customviews`.
- `containerId`: The string id of the DOM element that will contain the app iframe.
- `appUrl`: The string URL of the app. This is the page you would normally navigate to in order to use the app in a standalone page, it is different for each instance.
- `config`: This object is optional and allows you to specify some settings surrounding the CCP.
  - `ccpParams`: Optional params that mirror the configuration options for `initCCP`. Only valid when `name` is set to `ccp`. `allowFramedSoftphone` defaults to `true`.
  - `customViewsParams`: Optional params that are applicable when the `name` is set to `customviews`. Only valid when `name` is set to `customviews`.
  - `style`: An optional string to supply inline styling for the iframe.

## Voice ID APIs
Amazon Voice Connect ID provides real-time caller authentication and fraud risk detection which make voice interactions in contact centers more secure and efficient. For the Voice ID overview and administrator guide, please check the [AWS public doc](https://docs.aws.amazon.com/connect/latest/adminguide/voice-id.html). For more information about the agent experience in default CCP UI, please see [Use Voice ID page](https://docs.aws.amazon.com/connect/latest/adminguide/use-voiceid.html).

Streams Voice ID APIs can be tested after all these prerequisites are met:

1. A Voice ID domain is associated to your Connect instance ([link](https://docs.aws.amazon.com/connect/latest/adminguide/enable-voiceid.html#enable-voiceid-step1))
2. The contact flow is configured for Voice ID ([link](https://docs.aws.amazon.com/connect/latest/adminguide/enable-voiceid.html#enable-voiceid-step2))
3. "Voice ID" permission is given to the agent in the Security Profile page under the Contact Control Panel (CCP) section

The Voice ID APIs are exposed as Voice Connection methods and only work with two-party calls, not with conference calls at this moment. You can get the voice connection object by calling `contact.getAgentConnection()` when there's a voice connection.

Notes:
- For outbound calls and queued callbacks, these Streams Voice ID APIs can be called after contact is connected. For inbound calls, they can be called when contact is connecting.


### `voiceConnection.getVoiceIdSpeakerStatus()`
Describes the enrollment status of a customer. If the customer exists in the Voice ID, it resolves with a response object that contains one of the valid statuses, ENROLLED, PENDING or OPTED_OUT. PENDING means the customer hasn't enrolled but his/her speakerId has been created in the backend after updateVoiceIdSpeakerId() API is called for the customer. If the customer does not exist in the Voice ID, it still resolves but with an error object because backend API call fails. The case needs to be taken care of in a way like the code sample below.

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
        case connect.VoiceIdSpeakerStatus.PENDING:
          // speaker is pending
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


### `voiceConnection.enrollSpeakerInVoiceId(callbackOnAudioCollectionComplete: function)`
Enrolls a customer in Voice ID. The enrollment process completes once the backend has collected enough speech data (30 seconds of net customer's audio). If after 10 minutes the process hasn't completed, the method will throw a timeout error. If you call this API for a customer who is already enrolled, it will re-enroll the customer by collecting new speech data and registering a new digital voiceprint. Enrollment can happen only once in a voice contact.   
You can pass in a callback (optional) that will be invoked when our backend has collected sufficient audio for our backend service to create the new voiceprint.

```js
const callbackOnAudioCollectionComplete = (data) => {
  console.log(
    `Now sufficient audio has been collected and
    the customer no longer needs to keep talking.
    The backend service is creating the voiceprint with the audio collected`
  ); 
};

voiceConnection.enrollSpeakerInVoiceId(callbackOnAudioCollectionComplete)
  .then((data) => {
    console.log(
      `The enrollment process is complete and the customer has been enrolled into Voice ID`
    );
  })
  .catch((err) => {
    console.error(err);
  });
```

### `voiceConnection.evaluateSpeakerWithVoiceId(startNew: boolean)`
Checks the customer's Voice ID verification status. The evaluation process completes once the backend has collected enough speech data (10 seconds of net customer's audio). If after 2 minutes the process hasn't completed, the method will throw a timeout error. If you pass in false, it uses the existing audio stream, which is typically started in the contact flow, and immediately returns the result if enough audio has already been collected. If you pass in true, it starts a new audio stream and returns the result when enough audio has been collected. The default value is false.

The response will contain two results, AuthenticationResult and FraudDetectionResult. If one of them is disabled in the Set Voice ID contact flow block, the result will be null for that particular field. The authentication decision can be found at AuthenticationResult.Decision and it can be either AUTHENTICATED, NOT_AUTHENTICATED, OPTED_OUT, or NOT_ENROLLED. The fraud detection decision can be found at FraudDetection.Decision and it can be either HIGH_RISK or LOW_RISK.

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


### `voiceConnection.updateVoiceIdSpeakerId(speakerId: string)`
Updates the speaker ID of the customer with the provided string.

```js
voiceConnection.updateVoiceIdSpeakerId('my_new_speaker_id')
  .then(() => {
  })
  .catch((err) => {
    console.error(err);
  });
```

## Enhanced Monitoring APIs
Enhanced monitoring providing real-time silent monitoring and barge capability to help managers and supervisors to listen in the agents' conversations and barge into the call if needed to take over the control and provide better customer experience. Supervisors in barge mode will be able to force mute agents and prevent them from unmuting themselves, will be able to hold, drop any connection, or directly speak with the customer. If the supervisor has muted an agent and then drops from the call, the agent will be able to unmute themselves once supervisor has dropped. Monitoring APIs are expected to be used against agent's(or supervisor's) connection. To start enhanced monitoring supervisor/manager will need to click an eye icon on the Real Time Metrics page. Before enabling Enhanced monitoring capabilities, ensure that you are using the latest version of the Contact Control Panel (CCP) or Agent workspace.

Streams Enhanced Monitoring APIs can be tested after all these prerequisites are met:
1. Enable Multi-Party Calls and Enhanced Monitoring in Telephony section of the Amazon Connect Console.
1. Enable Real-time contact monitoring and Real-time contact barge-in in Security Profiles

### `voiceConnection.isSilentMonitor()`
```js
if (conn.isSilentMonitor()) { /* ... */ }
```
Returns true if monitorStatus is `MonitoringMode.SILENT_MONITOR`. This means the supervisor connection is in silent monitoring state. Regular agent will not see supervisor's connection in the snapshot while it is in silent monitor state.

### `voiceConnection.isBarge()`
```js
if (conn.isBarge()) { /* ... */ }
```
Returns true if monitorStatus is `MonitoringMode.BARGE`. This means the connection is in barge-in state. Regular agent will see the supervisor's connection in the list of connections in the snapshot.

### `voiceConnection.isSilentMonitorEnabled()`
```js
if (conn.isSilentMonitorEnabled()) { /* ... */ }
```
Returns true if agent's monitoringCapabilities contain `MonitoringMode.SILENT_MONITOR` type. 

### `voiceConnection.isBargeEnabled()`
```js
if (conn.isBargeEnabled()) { /* ... */ }
```
Returns true if agent's monitoringCapabilities contain `MonitoringMode.BARGE` state type.

### `voiceConnection.getMonitorCapabilities()`
```js
var allowedMonitorStates = conn.getMonitorCapabilities();
```
Returns the array of enabled monitor states of this connection. The array will consist of `MonitoringMode` enum values.

### `voiceConnection.getMonitorStatus()`
```js
var monitorState = conn.getMonitorStatus();
```
Returns the current monitoring state of this connection. The value can be on of `MonitoringMode` enum values if the agent is supervisor, or the monitorStatus will not be present for the agent.

### `voiceConnection.isForcedMute()`
```js
if (conn.isForcedMute()) { /* ... */ }
```
Determine whether the connection was forced muted by the manager.

### `contact.updateMonitorParticipantState()`
```js
contact.updateMonitorParticipantState(targetState, {
   success: function() { /* ... */ },
   failure: function(err) { /* ... */ }
});
```
Updates the monitor participant state to switch between different monitoring modes. The targetState value is a `MonitoringMode` enum member.

### `contact.isUnderSupervision()`
```js
if (contact.isUnderSupervision()) { /* ... */ }
```
Determines if the contact is under manager's supervision

#### Usage examples

Check that barge is enabled before switching to the barge mode - first we need to make sure that barge is enabled for the supervisor connection, and after that initiate monitor status change on the contact.
```js
if(voiceConnection.isBargeEnabled()) {
  contact.updateMonitorParticipantState(connect.MonitoringMode.BARGE, {
   success: function() { 
    console.log("Successfully changed the monitoring status to barge, now you can control the conversation")
   },
   failure: function(err) { 
    console.log("Somenting went wrong, here is the error ", err) 
   }
  }); 
}
```

Check that silent monitor is enabled before switching to the silent monitor mode - first we need to make sure that silent monitor is enabled for the supervisor connection, and after that initiate monitor status change on the contact.
```js
if(voiceConnection.isSilentMonitorEnabled()) {
  contact.updateMonitorParticipantState(connect.MonitoringMode.SILENT_MONITOR, {
   success: function() { 
    console.log("Successfully changed the monitoring status to silent monitor")
   },
   failure: function(err) { 
    console.log("Somenting went wrong, here is the error ", err) 
   }
  }); 
}
```

After supervisor mutes the agent - force mute field is automatically updated on the agent side. You may want to display a banner or somehow indicate to the agent that he cannot unmute himself back anymore.

```js
if(voiceConnection.isForcedMute()) {
  /* Some logic here to indicate forced mute to the agent */
}
```

After supervisor barges the call - agent doesn't have control anymore. Agent can only mute or unmute himself until he was forced muted, or leave the call. It will be good to indicate that to ahent as well by hiding or disabling buttons.

```js
if(voiceConnection.isUnderSupervision()) {
  /* Some logic here to indicate disabled call controls to the agent */
}
```
## Quick Responses APIs - These APIs are only available **after accepting a chat contact.**

### `QuickResponses.isEnabled()`

Determines if quick responses feature is enabled for a given agent. Returns `true` if there is a knowledge base for quick responses configured for the instance. If the first call returns true, the knowledgeBase ID will be cached in local storage for subsequent `QuickResponse` API calls.

```js
QuickResponses.isEnabled().then(response => {
  ...
})
```

### `QuickResponses.searchQuickResponses(params: QuickResponsesQuery)`

Returns a list of Quick Responses based on the params given:

```js
  QuickResponsesQuery {
    query: string; // query string
    contactId?: string; // ID of a Contact object. Used to retrieve contact's attributes
    nextToken?: string; // The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results.
    debounceMS?: number; // default value is 250ms. set it to 0 to disable debounced input change
    maxResults?: number; //number of results to be returned
  }
```

Example usage:

```js
const params = {
  query: "Hel",
  contactId: "...",
  debounceMS: 300,
  maxResults: 5
};

QuickResponsesService.searchQuickResponses(params: QuickResponsesQuery).then(response => {
  ...
});
```

Example response:

```js
{
  "nextToken": "token_string",
  "results": [
    {
      "attributesNotInterpolated": [],
      "channels": [ "Chat" ],
      "contentType": "application/x.quickresponse;format=markdown",
      "contents": {
          "markdown": {
              "content": "Hello"
          },
          "plainText": {
              "content": "Hello"
          }
      },
      "createdTime": 1697812550,
      "description": "Test",
      "groupingConfiguration": {
          "criteria": "RoutingProfileArn",
          "values": [ "..." ]
      },
      "isActive": true,
      "knowledgeBaseArn": "...",
      "knowledgeBaseId": "...",
      "language": "en_US",
      "lastModifiedBy": "...",
      "lastModifiedTime": 1697812550,
      "name": "Test",
      "quickResponseArn": "...",
      "quickResponseId": "...",
      "shortcutKey": "Test",
      "status": "CREATED"
    },
    //... more results
  ]
}
```

To retrieve next set of results:

```js
QuickResponsesQuery {
  //... params
  nextToken: "token_string"
}
```

Sample response:

```js
{
  "nextToken": null, //would not have next token once last set of responses is returned
  "results": [
    //... next set of results
  ]
}
```
