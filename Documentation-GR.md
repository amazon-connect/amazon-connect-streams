 # Global Resiliency Streams

**In order to obtain access to the Global Resiliency feature, you will need to reach out to your Amazon Connect Solutions Architect or Technical Account Manager first.**

**Global Resiliency is only compatible with CCPv2 and Streams releases 2.15.0 or later, and requires the use of SAML authentication. Global Resiliency can’t be used with CCPv1 or with Connect instances configured to use Connect-managed authentication (username and password).**

Streams will suppress contacts from the Connect instance in the region where the agent is not currently active. In embedded use cases where the native CCP UI will be visible, Streams will show only the CCP for the region where the agent is active. In the event of a change to the agent’s active region, Streams will automatically switch over the embedded UI to display CCP for the newly active region, and hide the CCP UI for the region where the agent was previously active.

# Prerequisites

You will need to complete all prerequisites in the [Global Resiliency documentation](https://docs.aws.amazon.com/connect/latest/adminguide/get-started-connect-global-resiliency.html) before you can make use of the version of Streams that is compatible with the feature.

# Usage

To access the Global Resiliency APIs, you will need to download Streams off of this Github page or through npm.

amazon-connect-streams is available from [npmjs.com](https://www.npmjs.com/package/amazon-connect-streams). If you'd like to download it here, you can use either of the files like `release/connect-streams*`.

Run `npm run build` to generate new release files. See our official documentation for more details.

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

## Initialization

Initializing the Streams API is the first step to verify that you have everything set up correctly and that you will be able to listen for events.

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
      var instanceURL1 = "https://my-us-east-1-domain.my.connect.aws/ccp-v2/";
      var instanceURL2 = "https://my-us-west-2-domain.my.connect.aws/ccp-v2/";
      // initialize the streams api
      function init() {
        // initialize the ccp
        connect.core.initCCP(containerDiv, {
          ccpUrl: instanceURL1,  // REQUIRED
          secondaryCCPUrl: instanceURL2 //REQUIRED to activate Global Resiliency
          enableGlobalResiliency: true, // REQUIRED to activate Global Resiliency
          loginUrl: "<URL for your SSO provider's authentication flow>", // REQUIRED - Make sure global sign in is set up for global resiliency
          ...// All other default initCCP parameters can also be added here. See official documentation
        }
      }
    </script>
</body>
</html>

```

Integrates with Connect by loading the pre-built CCPs located at `ccpUrl` and `secondaryCCPUrl` into iframes and placing them into the `containerDiv` provided. API requests are funneled through these CCPs, and agent and contact updates are published through them and made available to your JS client code.

* `ccpUrl`: Required. The URL of the CCP for one of the two regions in your traffic distribution group. This is the page you would normally navigate to in order to use the CCP in a standalone page, it is different for each instance.
* `secondaryCCPUrl`: Required. The URL for the secondary region of the CCP in your traffic distribution group. 
* `enableGlobalResiliency`: Required. Must be set to true in order to activate Global Resiliency feature in Streams.
* `loginUrl`: Required. Please follow the guide in the Amazon Connect Administrator Guide to set up **global authentication** and integrate your IdP with the new Connect SAML endpoint.

Refer to the full Streams documentation [here](https://github.com/amazon-connect/amazon-connect-streams/blob/master/Documentation.md) for the rest of the initCCP parameters


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

# API reference

### Connect APIs

All connect APIs should be available when using global resiliency. Refer to the full Streams documentation [here](https://github.com/amazon-connect/amazon-connect-streams/blob/master/Documentation.md) to understand what functions are available on this object.

Please note if you are using Streams with global resiliency enabled, some connect APIs will behave a little different to improve the user experience. You can see the list of differences below.

### connect.core.onInitialized()

Subscribes a callback that executes when the CCP initialization is completed. In the case where global resiliency is enabled, CCP's initialization is considered to be complete when Streams is able to determine the current active region and confirm that the active region's CCP is initialized.

### connect.agent()

Subscribe a method to be called when the agent is initialized. If the agent has already been initialized, the call is synchronous and the callback is invoked immediately. Otherwise, the callback is invoked once the first agent data is received from upstream. This callback is provided with an Agent API object, which can also be created at any time after initialization is complete via new connect.Agent().

In the case where global resiliency is enabled, the callback will only be triggered when the agent's data is retrieved for the current active region as we only consider that the agent is initialized only when the active region CCP's agent is initialized. 

### connect.core.downloadLogs()

A log file will be produced for each Connect instance in the failover group (total of 2). The options are the same as for `connect.getLog().download()` (documented in the standard Streams documentation), except each log name will be prefixed with the AWS region associated with that log's Connect instance.

Parameter `options`: Optional parameter of type Object, providing Download options:
`{ logName: 'agent-log', // (the default name)`
`filterByLogLevel: false // download all logs (the default)`
`}`
For example, in a multi-region setup with one CCP instance in us-west-2 and another in us-east-1, this will download two log files: us-west-2-agent-log.txt and us-east-1-agent-log.txt.

**In Global Resiliency CCP, the "Download logs" button in the CCP user interface will only download logs for CCP in the region where the agent is currently active.** 

## connect.globalResiliency functions
There are a few helper functions available on the `connect.globalResiliency` namespace to help you work with multiple CCPs.

### connect.globalResiliency.getActiveRegion

```js
const region = connect.globalResiliency.getActiveRegion()
console.log(region) // prints  "us-east-1"
```

A string with the AWS region corresponding to the Connect instance where the agent is currently active.

### connect.globalResiliency.onConfigureError(f)

```js
connect.globalResiliency.onConfigureError((error) => {console.log(error)});
```

Registers a callback function to be triggered when the configuration is not set up correct for global resiliency. Typical reasons as to why this could trigger could be: 
- The instances are not configured for global resiliency
- Params that were passed in were incorrect (missing/invalid secondary ccpUrl)
- The `lily-agent-config` cookie is missing which could indicate that global sign-in was not used or failed

### connect.globalResiliency.onFailoverCompleted(f)

```js
connect.globalResiliency.onFailoverCompleted((data) => {console.log(data)}); // { activeRegion: "us-east-1", activeCcpUrl: "<url>" }
```

Register a function to be triggered when the UI changes to display a different region, and agents are able to begin taking contacts in the new CCP region. This function will NOT be triggered in the event where CCP initializes and the region whose CCP was provided in the `ccpUrl` parameter (i.e. not the `secondaryCCPUrl`) is not the currently active region for the agent. If you wish, you can set up hooks using this function before calling `connect.core.initCCP()`.

Parameter `f`: A function that will be triggered when the UI changes to show CCP for a different region.
The function will be called with an Object parameter with three properties:

1. `activeRegion`: the string name of the AWS region for the newly-active CCP instance
2. `activeCcpUrl`: the value of the ccpUrl parameter for the newly-active instance, as originally provided in the initCCP() parameters

Returns a function that can be called if you wish to deregister the trigger.

### connect.globalResiliency.onFailoverPending(f)

```js
connect.globalResiliency.onFailoverPending((response) => { console.log(response)}); // console logs { nextActiveRegion: "us-east-1", contactIds: ["xxxx",...] }
```

Register a function to be triggered when an active region change has been detected and the agent has at least 1 active voice or chat contact. The UI will wait to change over to the new region until ALL active voice/chat contact(s) are ended and cleared from ACW. If you wish, you can set up hooks using this function before calling `connect.core.initCCP()`.

Parameter `f`: A function that will be triggered when a failover has been scheduled.
The function will be called with an Object parameter with one property:

1. `nextActiveRegion`: the region of the Connect instance that will become active in the UI once the active contacts is ended and cleared from ACW.
2. `contactIds`: array of contact IDs that the failover is pending on

Returns a function that can be called if you wish to deregister the trigger.

## Caveat regarding region-down scenarios

When there is a change made to the AWS region in which an agent is active, the agent's embedded Streams setup will only be automatically switched to the new region once their current voice and chat contacts (if any) are destroyed and cleared. It may take up to **five minutes** before CCP can detect a failover from when the admin updates the traffic distribution group and under normal circumstances, we would advise agents to **not** refresh their page whenever a failover takes place.

After failover, we would recommend clearing any regional specific data (such as agent state arns) from any local caches as different regions will have different data.

In the event that there is an issue with authentication for the backup CCP during initialization, that CCP may not be initialized when users fail over to it. Please refresh the page to attempt the initialization process again in this case.

In the event where the CCP iframe is refresh while in the middle of the failover process, the state of the CCPs may be de-synced. In this case, the CCP may skip over the failover pending state and immediately re-initialize to the new region (Since the iframe is refreshed, it'll initialize to the new active region as opposed to failing over). Refreshing the page here can also help to re-sync the entire setup.

## Where to go from here

Check out the full documentation [here](https://github.com/amazon-connect/amazon-connect-streams/blob/master/Documentation.md) to read more about how to use the `connect` object to subscribe to events and enact state changes programmatically within the currently-active CCP region.