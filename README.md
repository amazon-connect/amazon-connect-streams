# About

[![Build Status](https://travis-ci.org/amazon-connect/amazon-connect-streams.svg?branch=master)](https://travis-ci.org/amazon-connect/amazon-connect-streams)

The Amazon Connect Streams API (Streams) gives you the power to integrate your
existing web applications with Amazon Connect. Streams lets you
embed the Contact Control Panel (CCP) UI components into your page, and/or
handle agent and contact state events directly giving you the power to control
agent and contact state through an object oriented event driven interface. You
can use the built in interface or build your own from scratch: Streams gives you
the choice. This library must be used in conjunction with [amazon-connect-chatjs](https://github.com/amazon-connect/amazon-connect-chatjs)
in order to utilize Amazon Connect's Chat functionality.

# Learn More
To learn more about Amazon Connect and its capabilities, please check out
the [Amazon Connect User Guide](https://docs.aws.amazon.com/connect/latest/userguide/).

# Usage
Run the Makefile to generate `amazon-connect-${version}.js`, then copy this file
into your application or host it in an Amazon S3 bucket behind Amazon Cloudfront.

```
$ make
```

# Important Announcements
1. July 2020 -- We recently changed the new, omnichannel, CCP's behavior when it encounters three voice-only agent states: `FailedConnectAgent`, `FailedConnectCustomer`, and `AfterCallWork`. 
    * `FailedConnectAgent` -- Previously, we required the agent to click the "Clear Contact" button to clear this state. When the agent clicked the "Clear Contact" button, the previous behavior took the agent back to the `Available` state without fail. Now the `FailedConnectAgent` state will be "auto-cleared", much like `FailedConnectCustomer` always has been. 
    * `FailedConnectAgent` and `FailedConnectCustomer` -- We are now using the `contact.clear()` API to auto-clear these states. As a result, the agent will be returned to their previous visible agent state (e.g. `Available`). Previously, the agent had always been set to `Available` as a result of this "auto-clearing" behavior. Note that even custom CCPs will behave differently with this update for `FailedConnectAgent` and `FailedConnectCustomer`.
    * `AfterCallWork` -- As part of the new `contact.clear()` behavior, clicking "Clear Contact" while in `AfterCallWork` will return the agent to their previous visible agent state (e.g. `Available`, etc.). Note that custom CCPs that implement their own After Call Work behavior will not be affected by this change.
        * We are putting `contact.complete()` on a deprecation path. Therefore, you should start using `contact.clear()` in its place. If you want to emulate CCP's After Call Work behavior in your customer CCP, then make sure you use `contact.clear()` when clearing voice contacts. 
        
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

connect.initCCP({ /* ... */ });
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

```
$ npm install -g gulp
$ git clone https://github.com/aws/amazon-connect-streams
$ cd amazon-connect-streams
$ npm install
$ npm run release
```

Find build artifacts in **release** directory - This will generate a file called `connect-streams.js` and the minified version of the same `connect-streams-min.js` - this is the full Connect Streams API which you will want to include in your page.

To run unit tests specifically:
```
$ npm run gulp-test
```

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
    <script type="text/javascript" src="amazon-connect-1.4.js"></script>
  </head>
  <!-- Add the call to init() as an onload so it will only run once the page is loaded -->
  <body onload="init()">
    <div id="container-div" style="width: 400px;height: 800px;"></div>
    <script type="text/javascript">
      var containerDiv = document.getElementById("container-div");
      var instanceURL = "https://my-instance-domain.awsapps.com/connect/ccp-v2/";
      // initialize the streams api
      function init() {
        // initialize the ccp
        connect.core.initCCP(containerDiv, {
          ccpUrl: instanceURL,            // REQUIRED
          loginPopup: true,               // optional, defaults to `true`
          loginPopupAutoClose: true,      // optional, defaults to `true`
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
           }
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
* If you'd like access to the WebRTC session to further customize the softphone experience
  you can use [connect-rtc-js](https://github.com/aws/connect-rtc-js). Please refer to the connect-rtc-js readme for detailed instructions on integrating connect-rtc-js with Streams.

## Where to go from here
Check out the full documentation [here](Documentation.md) to read more about
subscribing to events and enacting state changes programmatically.


