# Global Resiliency/Disaster Recovery Streams

**In order to obtain access to the Global Resiliency feature, you will need to reach out to your Amazon Connect Solutions Architect or Technical Account Manager first.**

**Global Resiliency is only compatible with CCPv2 and Streams releases 2.6.0 or later, and requires the use of SAML authentication. Global Resiliency can’t be used with CCPv1 or with Connect instances configured to use Connect-managed authentication (username and password).**

To enable embedded or custom CCP to redirect new inbound contacts to the current active region for an agent, you will need to integrate with the new StreamsJS library specifically designed for use with traffic distribution groups. The new Streams library release can only be used with a traffic distribution group and does not replace the existing Streams library (connect-streams.js or connect-streams-min.js) used in a single region/Connect instance. The new Streams API is the same as the one in a single region/instance Streams library, but instead of embedding only one CCP, you will configure information for CCPs corresponding to both source and replica instances in your traffic distribution group.

Additionally, the new Streams library suppresses contacts from the Connect instance in the region where the agent is not currently active. In embedded use cases where the native CCP UI will be visible, Streams will show only the CCP for the region where the agent is active. In the event of a change to the agent’s active region, Streams will automatically switch over the embedded UI to display CCP for the newly active region, and hide the CCP UI for the region where the agent was previously active.

# Prerequisites

You will need to complete all prerequisites in the [Global Resiliency documentation](https://docs.aws.amazon.com/connect/latest/adminguide/get-started-connect-global-resiliency.html) before you can make use of the version of Streams that is compatible with the feature.

# Usage

amazon-connect-streams is available from [npmjs.com](https://www.npmjs.com/package/amazon-connect-streams). If you'd like to download it here, you can use either of the files like `release/connect-streams-dr*`.

## Caveat regarding region-down scenarios

When there is a change made to the AWS region in which an agent is active, the agent's embedded Streams setup will only be automatically switched to the new region once their current voice contact (if any) is destroyed and cleared. If there is an impairment to the agent's currently-active region such that they cannot successfully end and clear their ongoing voice contact, it may be necessary for agents to refresh the page where CCP is embedded, in order to switch to the new region after traffic has shifted away from the impaired region.

Additionally, if the active region is already impaired at the time the agent loads the page where CCP is embedded, Streams may be unable to automatically detect a change in active region for the agent. In this case, the agent can refresh (or close and reopen) their open tab where CCP is embedded, and the new active region will be picked up when the page finishes loading.

## Getting Started

### Allowlisting

The first step to using Streams is to allowlist the pages you wish to embed. For our customers’ security, we require that all domains which embed the CCP for a particular instance are explicitly allowlisted. Each domain entry identifies the protocol scheme, host, and port. Any pages hosted behind the same protocol scheme, host, and port will be allowed to embed the CCP components which are required to use the Streams library.

**For Global Resiliency, you'll need to complete the below allowlisting process separately for each instance in your traffic distribution group.**

To allowlist your pages:

1. Login to your AWS Account, then navigate to the Amazon Connect console in each region where you have an instance in your traffic distribution group.
2. Click the instance name of the instance for which you would like to allowlist pages to load the settings page for your instance.
3. Click the "Application integration" link on the left.
4. Click "+ Add Origin", then enter a domain URL, e.g. "https://example.com", or "https://example.com:9595" if your website is hosted on a non-standard port.

#### A few things to note:

* Allowlisted domains must be HTTPS.
* All of the pages that attempt to initialize the Streams library must be hosted on domains that are allowlisted as per the above steps.
* All open tabs that contain an initialized Streams library or any other CCP tabs opened will be synchronized. This means that state changes made in one open window will be communicated to all open windows.
* Using multiple browsers at the same time for the same Connect instance is not supported, and causes issues with the rtc communication.

## Downloading Streams with npm

`npm install amazon-connect-streams`

## Importing Streams with npm and ES6

`import "amazon-connect-streams/connect-streams-dr.js";` This will make the `globalConnect` variable available in the current context.

## Downloading Streams from Github

You can also download prebuilt release artifacts directly from GitHub. You will find the release artifacts `connect-streams-dr.js` and the minified version `connect-streams-dr-min.js` in the `release` directory of this repository.

## Build your own with NPM

## Install latest LTS version of [NodeJS](https://nodejs.org/)

```
$ git clone https://github.com/aws/amazon-connect-streams
$ cd amazon-connect-streams
$ npm install
$ npm run release

```

Find build artifacts in **release** directory - This will generate a file called `connect-streams-dr.js` and the minified version `connect-streams-dr-min.js` - this is the Global Resiliency-aware Connect Streams artifact which you will include in your page.
To run unit tests:

```
$ npm run test-mocha
$ npm run test-mocha-dr

```

Note: these tests run on the release files generated above.

## Using the standard Streams artifact alongside the Global Resiliency Streams artifact

The Global Resiliency Streams artifact uses the `window.connect` binding to provide an easy way to make Connect API calls to the CCP for the agent's currently active region. It is possible but not recommended to load both artifacts in the same browsing context, since the global Streams artifact will overwrite the `window.connect` binding when first loaded on the page, when `globalConnect.core.initCCP()` is called, and each time an active region change occurs.

## Initialization

Initializing the Streams API is the first step to verify that you have everything set up correctly and that you will be able to listen for events.

### `globalConnect.core.initCCP()`

```
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script type="text/javascript" src="connect-streams-dr-min.js"></script>
</head>
<!-- Add the call to init() as an onload so it will only run once the page is loaded -->
<body onload="init()">
<div id="container-div" style="width: 400px; height: 800px;"></div>
<script type="text/javascript">
      var containerDiv = document.getElementById("container-div");
      var instanceURL1 = "https://my-us-east-1-domain.my.connect.aws/ccp-v2/";
      var instanceURL2 = "https://my-us-west-2-domain.my.connect.aws/ccp-v2/";
      // initialize the streams api
      function init() {
        // initialize the ccp
        globalConnect.core.initCCP(containerDiv, {
          ccpUrl: instanceURL1,  // REQUIRED
          pollForFailover: true, // REQUIRED to activate Global Resiliency
          instanceArn: "arn:aws:connect:us-east-1:0123456789:instance/17ac6c89-91e1-4b3f-86b0-40e5ed67971f", // REQUIRED
          loginUrl: "<URL for your SSO provider's authentication flow>", // REQUIRED
          region: "us-east-1",            // REQUIRED
          standByRegion: { // REQUIRED
              ccpUrl: instanceURL2, // REQUIRED
              instanceArn: "arn:aws:connect:us-west-2:0123456789:instance/17ac6c89-91e1-4b3f-86b0-40e5ed67971f", // REQUIRED
              region: "us-west-2",          // REQUIRED
          },
          getPrimaryRegion: function(callback) { // REQUIRED
            callback()
            .then(connect => {console.log("promise completed")})
            .catch(err => {console.log("error encountered")})
          },
          additionalScripts: [        //optional
            "https://example.com/amazon-connect-task.js"
          ],
          loginPopup: true,               // optional, defaults to `true`
          loginPopupAutoClose: true,      // optional, defaults to `false`
          loginOptions: {                 // optional, if provided opens login in new window
              autoClose: true,              // optional, defaults to `false`
              height: 600,                  // optional, defaults to 578
              width: 400,                   // optional, defaults to 433
              top: 0,                       // optional, defaults to 0
              left: 0                       // optional, defaults to 0
          },
          softphone: {                    // optional, defaults below apply if not provided
              allowFramedSoftphone: true,   // optional, defaults to false
              disableRingtone: false,       // optional, defaults to false
              ringtoneUrl: "./ringtone.mp3" // optional, defaults to CCP’s default ringtone if a falsy value is set
          },
          pageOptions: { //optional
              enableAudioDeviceSettings: false, //optional, defaults to 'false'
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

Integrates with Connect by loading the pre-built CCPs located at `ccpUrl` and `standByRegion.ccpUrl` into iframes and placing them into the `containerDiv` provided. API requests are funneled through these CCPs, and agent and contact updates are published through them and made available to your JS client code.

* `ccpUrl`: The URL of the CCP for one of the two regions in your traffic distribution group. This is the page you would normally navigate to in order to use the CCP in a standalone page, it is different for each instance.
* `pollForFailover`: Required, must be set to true in order to activate Global Resiliency feature in Streams.
* `instanceArn`: Required, must be the ARN for the instance whose URL you provided in `ccpUrl`
* `loginUrl`: Required. Allows custom URL to be used to initiate the CCP, as in the case of SAML authentication. Please follow the guide in the Amazon Connect Administrator Guide to set up global authentication and integrate your IdP with the new Connect SAML endpoint.
* `region`: Required. Amazon Connect instance region for the instance provided in `ccpUrl`. ex: `us-east-1`.
* `standByRegion`: Required; provides information for the other instance in the traffic distribution group.
    * `ccpUrl`: The URL of the CCP for the other instance in the traffic distribution group.
    * `instanceArn`: Required, must be the ARN for the instance whose URL you provided in `standByRegion.ccpUrl`
    * `region`: Required. Amazon Connect instance region for the instance provided in `standByRegion.ccpUrl`. ex: `us-west-2`.
* `getPrimaryRegion`: Required. Specify a function that will receive a callback as an argument; when you invoke the callback function, it will return a promise that will resolve when the Global Resiliency setup on the page is set up and ready for use.
* `additionalScripts`: Optional. Provides a way to pass additional JavaScript scripts to be loaded for each regional CCP in the Global Resiliency setup that rely on the Connect object (such as ChatJS or TaskJS). If provided, should be an array of relative or absolute URIs that locate scripts to be loaded and executed for each CCP before it is initialized.
* `loginPopup`: Optional, defaults to `true`. Set to `false` to disable the login popup which is shown when the user's authentication expires.
* `loginOptions`: Optional, only valid when `loginPopup` is set to `true`. Provide an object with the following properties to open loginpopup in a new window instead of a new tab.
    * `autoClose`: Optional, defaults to `false`. Set to `true` to automatically close the login popup after the user logs in.
    * `height`: This allows you to define the height of the login pop-up window.
    * `width`: This allows you to define the width of the login pop-up window.
    * `top`: This allows you to define the top of the login pop-up window.
    * `left`: This allows you to define the left of the login pop-up window.
* `loginPopupAutoClose`: Optional, defaults to `false`. Set to `true` in conjunction with the `loginPopup` parameter to automatically close the login Popup window once the authentication step has completed. If the login page opened in a new tab, this parameter will also auto-close that tab. This can also be set in `loginOptions` if those options are used.
* `softphone`: This object is optional and allows you to specify some settings surrounding the softphone feature of Connect.
    * `allowFramedSoftphone`: Normally, the softphone microphone and speaker components are not allowed to be hosted in an iframe. This is because the softphone must be hosted in a single window or tab. The window hosting the softphone session must not be closed during the course of a softphone call or the call will be disconnected. If `allowFramedSoftphone` is `true`, the softphone components will be allowed to be hosted in this window or tab.
    * `disableRingtone`: This option allows you to completely disable the built-in ringtone audio that is played when a call is incoming.
    * `ringtoneUrl`: If the ringtone is not disabled, this allows for overriding the ringtone with any browser-supported audio file accessible by the user.
* `pageOptions`: This object is optional and allows you to configure which configuration sections are displayed in the settings tab.
    * `enableAudioDeviceSettings`: If `true`, the settings tab will display a section for configuring audio input and output devices for the agent's local machine. If `false`, or if `pageOptions` is not provided, the agent will not be able to change audio device settings from the settings tab.
    * `enablePhoneTypeSettings`: If `true`, or if `pageOptions` is not provided, the settings tab will display a section for configuring the agent's phone type and deskphone number. If `false`, the agent will not be able to change the phone type or deskphone number from the settings tab.
* `shouldAddNamespaceToLogs`: prepends `[CCP]` to all logs logged by the CCP. Important note: there are a few logs made by the CCP before the namespace is prepended.
* `ccpAckTimeout`: A timeout in ms that indicates how long streams will wait for the iframed CCP to respond to its `SYNCHRONIZE` event emissions. These happen continuously from the first time `initCCP` is called. They should only appear when there is a problem that requires a refresh or a re-login.
* `ccpSynTimeout`: A timeout in ms that indicates how long streams will wait to send a new `SYNCHRONIZE` event to the iframed CCP. These happens continuously from the first time `initCCP` is called.
* `ccpLoadTimeout`: A timeout in ms that indicates how long streams will wait for the initial `ACKNOWLEDGE` event from the shared worker while the CCP is still standing itself up.

#### A few things to note:

* You have the option to show or hide the pre-built UI by showing or hiding the `containerDiv` into which you place the iframe, or applying a CSS rule like this:

```
#container-div iframe {
  display: none;
}
```

* The CCP UI is rendered in an iframe under the container element provided. The iframe fills its container element with `width: 100%; height: 100%`. To customize the size of the CCP, set the width and height for the container element.
* The CCP is designed to be responsive (used in various sizes). The smallest size we design for is 320px x 460px. For a good user experience, we recommend that you do not go smaller than this size.
* CSS styles you add to your site will NOT be applied to the CCP because it is rendered in an iframe.

## How to make Streams API calls to the CCP for the currently-active region

The `window.connect` reference on the page will be updated to point to the Connect API object for the currently-active region, both at initialization time and each time there is a change in active region on the page. You can refer to the [standard documentation](https://code.amazon.com/packages/AmazonConnectStreams/blobs/d226dd7efac909181ad31f0759e10593bad9fc4d/--/Documentation.md) for reference on what APIs are available to use on this object. You will need to wait for the `getPrimaryRegion` promise to resolve before you will have a Connect object available for use on the page.

If you have a standard set of Connect API calls (e.g. common `onConnecting()` hooks, usage of `connect.agent()` or `connect.contact()`) you would typically make to set up the embedded CCP on the page, in order to ensure they’re applied to both instances on the page, you should make these API calls in a `globalConnect.core.onInit()` hook. Your onInit logic will be invoked for each Connect instance in the Global Resiliency setup.


```
globalConnect.core.onInit((connect, region) => {
    connect.contact((contact) => {
        contact.onConnecting((contact) => {
            console.log(`contact with ID ${contact.getContactId()} connecting in region ${region}`);
        });
    });
});
globalConnect.core.initCCP(containerDiv, {
    ...
}
```

## Loading other JavaScript that modifies the Streams API (e.g. ChatJS, TaskJS)

Since the full `window.connect` binding will not be available until the Global Resiliency setup is initialized on the page, code that relies on modifying the Connect Streams object, such as ChatJS, TaskJS, and other custom code you may have written to work with the standard (non-Global Resiliency) Streams distribution should be loaded in your code that handles the promise returned by your function passed as the getPrimaryRegion parameter of `globalConnect.core.initCCP()`, instead of being loaded immediately at page load time along with Streams itself, as with the non-Global Resiliency version of Streams. 

Any scripts loaded this way should also be loaded as part of a `globalConnect.core.onFailoverCompleted()` hook, to ensure that the code will apply to the newly-active CCP in the event of an active region change; otherwise the code would be applied only to the CCP for the region that was originally active.


```
globalConnect.core.onFailoverCompleted(() => {
    const script = document.createElement('script');
    script.src = "https://example.com/amazon-connect-chat.js";
    document.body.appendChild(script);
});
globalConnect.core.initCCP(containerDiv, {ccpUrl: "<URL for instance 1>",
    pollForFailover: true,
    instanceArn: "arn:aws:connect:us-east-1:0123456789:instance/17ac6c89-91e1-4b3f-86b0-40e5ed67971f", // REQUIRED
    loginUrl: "<URL for your SSO provider's authentication flow>",
    region: "<region for instance 1>",
    standByRegion: {
        ccpUrl: "<URL for instance 2>",
        instanceArn: "arn:aws:connect:us-west-2:0123456789:instance/17ac6c89-91e1-4b3f-86b0-40e5ed67971f", // REQUIRED
        region: "<region for instance 2>",
    },
    getPrimaryRegion: function(callback) {
        callback()
        .then(connect => {
            const script = document.createElement('script');
            script.src = "https://example.com/amazon-connect-chat.js";
            document.body.appendChild(script);
        })
        .catch(err => {console.log("error encountered")})
    },
   ...
}
```

Alternatively, you can also make use of the `additionalScripts` parameter in `globalConnect.core.initCCP()` to list the URIs of scripts that depend on the Streams API object, which will be loaded automatically within each CCP before it is initialized. Scripts will be loaded within each CCP in the order specified, and will be loaded after the Streams library.


```
globalConnect.core.initCCP(containerDiv, {
    ccpUrl: "<URL for instance 1>",
    pollForFailover: true,
    instanceArn: "arn:aws:connect:us-east-1:0123456789:instance/17ac6c89-91e1-4b3f-86b0-40e5ed67971f", // REQUIRED
    loginUrl: "<URL for your SSO provider's authentication flow>",
    region: "<region for instance 1>",
    standByRegion: {
        ccpUrl: "<URL for instance 2>",
        instanceArn: "arn:aws:connect:us-west-2:0123456789:instance/17ac6c89-91e1-4b3f-86b0-40e5ed67971f", // REQUIRED
        region: "<region for instance 2>",
    },
    getPrimaryRegion: function(callback) {
        callback()
        .then(connect => {console.log("promise completed")})
        .catch(err => {console.log("error encountered")})
    },
    additionalScripts: [
        "https://example.com/amazon-connect-chat.js",
        "https://example.com/amazon-connect-task.js"
    ], 
   ...
}
```

# API reference

## Globally available bindings

Once the Global Resiliency Streams setup is initialized on the page (using `globalConnect.core.initCCP()`) the following bindings will be available (under Window):

### connect

The Streams API object for the currently-active Connect instance. Refer to the full Streams documentation [here](https://code.amazon.com/packages/AmazonConnectStreams/blobs/d226dd7efac909181ad31f0759e10593bad9fc4d/--/Documentation.md) to understand what functions are available on this object.

### globalConnect.core.primaryRegion

A string with the AWS region corresponding to the Connect instance where the agent is currently active.

### globalConnect.core.secondaryRegion

A string with the AWS region corresponding to the Connect instance in the Global Resiliency Streams setup where the agent is *not* currently active.

## Global Connect functions

There are a few helper functions available on the `globalConnect` object to help you work with multiple CCPs.

### globalConnect.core.onInit(f)

Register a function to be triggered after `globalConnect.core.initCCP()` is invoked, and once the Global Resiliency setup has been successfully initialized on the page and agents are able to begin taking contacts. If you wish, you can set up hooks using this function before calling `globalConnect.core.initCCP()`.

Parameter `f`: A function that will be triggered when the Global Resiliency setup has been successfully initialized on the page and agents are able to begin taking contacts.
The function will be called twice (once for each of the Connect instances in the Global Resiliency setup), with two parameters:

1. The Streams API object (the `connect` object) for one of the Connect instances in the Global Resiliency setup
2. A string parameter with the AWS region associated with the Connect instance whose Streams API object was provided in the first parameter.


This function provides a convenient place to set up init-time logic using the Streams API object in both CCPs at the same time, without having to implement the same logic once for each CCP on the page.

Returns a function that can be called if you wish to deregister the trigger.

### globalConnect.core.onFailoverCompleted(f)

Register a function to be triggered when the UI changes to display a different region, and agents are able to begin taking contacts in the new CCP region. This function will also be triggered when CCP is initialized and ready for use, if the region whose CCP was provided in the `ccpUrl` parameter (i.e. not the `standByRegion`) is not the currently active region for the agent. If you wish, you can set up hooks using this function before calling `globalConnect.core.initCCP()`.

Parameter `f`: A function that will be triggered when the UI changes to show CCP for a different region.
The function will be called with an Object parameter with three properties:

1. `activeRegion`: the string name of the AWS region for the newly-active CCP instance
2. `activeCcpUrl`: the value of the ccpUrl parameter for the newly-active instance, as originally provided in the initCCP() parameters
3. `connect`: the Streams API object for the newly-active region’s CCP.

Returns a function that can be called if you wish to deregister the trigger.

### globalConnect.core.onFailoverPending(f)

Register a function to be triggered when an active region change has been detected and the agent has an active voice contact. The UI will wait to change over to the new region until the active voice contact is ended and cleared from ACW. If you wish, you can set up hooks using this function before calling `globalConnect.core.initCCP()`.

Parameter `f`: A function that will be triggered when a failover has been scheduled to occur once the active voice contact is destroyed.
The function will be called with an Object parameter with one property:

1. `nextActiveArn`: the ARN of the Connect instance that will become active in the UI once the active voice contact is ended and cleared from ACW.

Returns a function that can be called if you wish to deregister the trigger.

### globalConnect.core.downloadLogs()

**In Global Resiliency CCP, the "Download logs" button in the CCP user interface will only download logs for CCP in the region where the agent is currently active.** To download logs from all CCPs running in the multi-region setup, a global log download function has been added. A separate log file will be produced for each Connect instance in the failover group. The options are the same as for `connect.getLog().download()` (documented in the standard Streams documentation), except each log name will be prefixed with the AWS region associated with that log's Connect instance.

Parameter `options`: Optional parameter of type Object, providing Download options:
`{ logName: 'agent-log', // (the default name)`
`filterByLogLevel: false // download all logs (the default)`
`}`
For example, in a multi-region setup with one CCP instance in us-west-2 and another in us-east-1, this will download two log files: us-west-2-agent-log.txt and us-east-1-agent-log.txt.

## Where to go from here

Check out the full documentation [here](Documentation.md) to read more about how to use the `connect` object to subscribe to events and enact state changes programmatically within the currently-active CCP region.
