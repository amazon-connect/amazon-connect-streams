# About
The Amazon Connect Streams API (Streams) gives you the power to integrate your
existing web applications with Amazon Connect.  Streams lets you
embed the Contact Control Panel (CCP) UI components into your page, and/or
handle agent and contact state events directly giving you the power to control
agent and contact state through an object oriented event driven interface.  You
can use the built in interface or build your own from scratch: Streams gives you
the choice.

# Learn More
To learn more about Amazon Connect and its capabilities, please check out
the [Amazon Connect User Guide](https://docs.aws.amazon.com/connect/latest/userguide/).

# Usage
Run the Makefile to generate `amazon-connect-${version}.js`, then copy this file
into your application or host it in an Amazon S3 bucket behind Amazon Cloudfront.

```
$ make
```

## Getting Started
### Whitelisting
The first step to using Streams is to whitelist the pages you wish to embed.
For our customer's security, we require that all domains which embed the CCP for
a particular instance are explicitly whitelisted.  Each domain entry identifies
the protocol scheme, host, and port.  Any pages hosted behind the same protocol
scheme, host, and port will be allowed to embed the CCP components which are
required to use the Streams library.

To whitelist your pages:

1. Login to your AWS Account, then navigate to the Amazon Connect console.
2. Click the instance name of the instance for which you would like to whitelist
   pages to load the settings page for your instance.
3. Click the "Application integration" link on the left.
4. Click "+ Add Origin", then enter a domain URL, e.g.
   "https<nolink>://example.com", or "https<nolink>://example.com:9595" if your
   website is hosted on a non-standard port.

#### A few things to note:
* All of the pages that attempt to initialize the Streams library must be hosted
  on domains that are whitelisted as per the above steps.
* All open tabs that contain an initialized Streams library or any other CCP
  tabs opened will be synchronized.  This means that state changes made in one
  open window will be communicated to all open windows.

### Downloading Streams
The next step to embedding Connect into your application is to download the
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
Connect Streams API which you will want to include in your page.  You can serve
`connect-streams-${VERSION}.js` with your web application.

### Build your own with NPM
Install latest LTS version of [NodeJS](https://nodejs.org)

```
$ git clone https://github.com/aws/amazon-connect-streams
$ cd amazon-connect-streams
$ npm install
$ gulp 
```

Find build artifacts in **release** directory -  This will generate a file called `connect-streams.js` and the minified version of the same `connect-streams-min.js`  - this is the full Connect Streams API which you will want to include in your page.

To run unit tests specifically:
```
$ gulp test
```
## Initialization
Initializing the Streams API is the first step to verify that you have
everything setup correctly and that you will be able to listen for events.

### `connect.core.initCCP()`
```
connect.core.initCCP(containerDiv, {
   ccpUrl:        ccpUrl,        /*REQUIRED*/
   loginPopup:    true,          /*optional, default TRUE*/
   softphone:     {              /*optional*/
      disableRingtone:  true,    /*optional*/ 
      ringtoneUrl: ringtoneUrl   /*optional*/
   }
});
```
Integrates with Connect by loading the pre-built CCP located at `ccpUrl` into an
iframe and placing it into the `containerDiv` provided.  API requests are
funneled through this CCP and agent and contact updates are published through it
and made available to your JS client code.
* `ccpUrl`: The URL of the CCP.  This is the page you would normally navigate to
  in order to use the CCP in a standalone page, it is different for each
  instance.
* `loginPopup`: Optional, defaults to `true`.  Set to `false` to disable the login
  popup which is shown when the user's authentication expires.
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

## Where to go from here
Check out the full documentation [here](Documentation.md) to read more about
subscribing to events and enacting state changes programmatically.


