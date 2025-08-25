# About

[![Build Status](https://travis-ci.org/amazon-connect/amazon-connect-streams.svg?branch=master)](https://travis-ci.org/amazon-connect/amazon-connect-streams)

The Amazon Connect Streams API (Streams) gives you the power to integrate your existing web applications with Amazon Connect.  Streams lets you embed the Contact Control Panel (CCP) and Customer Profiles app UI into your page.  It also enables you to handle agent and contact state events directly through an object oriented event driven interface.  You can use the built in interface or build your own from scratch: Streams gives you the choice.

This library must be used in conjunction with [amazon-connect-chatjs](https://github.com/amazon-connect/amazon-connect-chatjs) or [amazon-connect-taskjs](https://github.com/amazon-connect/amazon-connect-taskjs) in order to utilize Amazon Connect's Chat or Task functionality.

# Learn More
To learn more about Amazon Connect and its capabilities, please check out
the [Amazon Connect User Guide](https://docs.aws.amazon.com/connect/latest/userguide/).

# Usage
amazon-connect-streams is available from [npmjs.com](https://www.npmjs.com/package/amazon-connect-streams). If you'd like to download it here, you can use either of the files like `release/connect-streams*`. 

Run `npm run release` to generate new release files. Full instructions for building locally with npm can be found [below](#build-your-own-with-npm). 

In version 1.x, we also support `make` for legacy builds. This option was removed in version 2.x. 

# Important Announcements

1. August 2025 - 2.18.6
   * Adds important stability update addressing periodic login popups that some customers experienced even when agents had valid authentication sessions. This update replaces the heartbeat mechanism used to detect changes in agent authentication status as Chrome now no longer recommends using timers for periodic state checks.
   * Deprecates ccpSynTimeout and ccpAckTimeout init CCP Params
2. January 2025 - 2.18.1
   * Provides bug fixes for chat and voice. Customers using 2.17 and 2.18 should upgrade to 2.18.1
3. December 2024 - Major changes:
   * Introducing Multiparty Chat, allowing up to 4 additional agents to join an ongoing chat conversation, making it easier to collaborate and resolve customer issues quickly.
4. November 2024 - Major changes:
   * Introducing Email
   * Storage access settings from `initCCP` are now deprecated after Google is no longer deprecating 3rd party cookies by default.
   * Global resiliency involving `connect-streams-dr.js` is now deprecated. Please reference [Documentation-GR.md](Documentation-GR.md) for the new set of APIs.
5. July 2024 - The issue with muting while a Voice contact is on hold has been resolved. Agents can use the mute button while a contact is placed on hold. The following APIs will be available when the contact is on hold:
    * `voiceConnection.muteParticipant()`
    * `voiceConnection.unmuteParticipant()`
    * `agent.mute()`
    * `agent.unmute()`
6. February 2024 - In response to a Google Chrome feature launched on 7/13/2023 called [Storage Partitioning](https://developers.google.com/privacy-sandbox/3pcd/storage-partitioning), we made a short term fix on 2/10/2024 to adjust our mute functionality and synchronize the mute state across all CCPs. However, due to current limitations, this change required us to disable muting while being on hold. As a workaround, agents should mute themselves on the call before going on hold. We are planning to address this issue by August 2024 and revert back to original mute behavior.
    * At the moment, the following APIs will fail when the contact is on hold:
      * `voiceConnection.muteParticipant()`
      * `voiceConnection.unmuteParticipant()`
      * `agent.mute()`
      * `agent.unmute()`
    * As a workaround, you can mute the call prior to placing the call on hold.


## Getting Started

### Upgrading to the OmniChannel CCP (AKA CCPv2)?
If you are migrating to the new CCP, we encourage you to upgrade to the latest version of this repository. You should also upgrade to [the latest version of RTC-JS](https://github.com/aws/connect-rtc-js) as well, if you are using it. For a complete migration guide to the new CCP, and to fully understand the differences when using Streams with the new CCP, please see this post: https://docs.aws.amazon.com/connect/latest/adminguide/upgrade-to-latest-ccp.html

### Allowlisting
The first step to using Streams is to allowlist the pages you wish to embed.
For our customer's security, we require that all domains which embed the CCP for
a particular instance are explicitly allowlisted. Each domain entry identifies
the protocol scheme, host, and port. Any pages hosted behind the same protocol
scheme, host, and port will be allowed to embed the CCP components which are
required to use the Streams library.

To allowlist your pages:

1. Login to your AWS Account, then navigate to the Amazon Connect console.
2. Click the instance name of the instance for which you would like to allowlist
   pages to load the settings page for your instance.
3. Click the "Application integration" link on the left.
4. Click "+ Add Origin", then enter a domain URL, e.g.
   "https<nolink>://example.com", or "https<nolink>://example.com:9595" if your
   website is hosted on a non-standard port.

#### A few things to note:
* Allowlisted domains must be HTTPS.
* All of the pages that attempt to initialize the Streams library must be hosted
  on domains that are allowlisted as per the above steps.
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
The next step to embedding Connect into your application is to download the
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
Connect Streams API which you will want to include in your page. You can serve
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
everything setup correctly and that you will be able to listen for events.

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
      var instanceURL = "https://my-instance-domain.my.connect.aws/ccp-v2/";
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
          softphone: {                    // optional, defaults below apply if not provided
            allowFramedSoftphone: true,   // optional, defaults to false
            disableRingtone: false,       // optional, defaults to false
            ringtoneUrl: "[your-ringtone-filepath].mp3", // optional, defaults to CCP’s default ringtone if a falsy value is set
            allowFramedVideoCall: true,    // optional, default to false
            allowEarlyGum: true    //optional, default to true
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
    the ringtone with any browser-supported audio file accessible by the user. To use the default ringtone comment out this line.
* `pageOptions`: This object is optional and allows you to configure which configuration sections are displayed in the settings tab.
  * `enableAudioDeviceSettings`: If `true`, the settings tab will display a section for configuring audio input and output devices for the agent's local
      machine. If `false`, or if `pageOptions` is not provided, the agent will not be able to change audio device settings from the settings tab. will not be
      displayed.
  * `enableVideoDeviceSettings`: If `true`, the settings tab will display a section for configuring video input devices for the agent's local
      machine. If `false`, or if `pageOptions` is not provided, the agent will not be able to change video device settings from the settings tab. will not be
      displayed.
  * `enablePhoneTypeSettings`: If `true`, or if `pageOptions` is not provided, the settings tab will display a section for configuring the agent's phone type
      and deskphone number. If `false`, the agent will not be able to change the phone type or deskphone number from the settings tab.
* `shouldAddNamespaceToLogs`: prepends `[CCP]` to all logs logged by the CCP. Important note: there are a few logs made by the CCP before the namespace is prepended.
* `ccpAckTimeout`: A timeout in ms that indicates how long streams will wait for the iframed CCP to respond to its `SYNCHRONIZE` event emissions. These happen continuously from the first time `initCCP` is called. They should only appear when there is a problem that requires a refresh or a re-login.
* `ccpSynTimeout`: A timeout in ms that indicates how long streams will wait to send a new `SYNCHRONIZE` event to the iframed CCP. These happens continuously from the first time `initCCP` is called. 
* `ccpLoadTimeout`: A timeout in ms that indicates how long streams will wait for the initial `ACKNOWLEDGE` event from the shared worker while the CCP is still standing itself up.
#### A few things to note:
* You have the option to show or hide the pre-built UI by showing or hiding the
`containerDiv` into which you place the iframe, or applying a CSS rule like
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
  We omit ChatJS from the Makefile so that streams can be used without ChatJS.
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

## Where to go from here
Check out the full documentation [here](Documentation.md) to read more about
subscribing to events and enacting state changes programmatically.

