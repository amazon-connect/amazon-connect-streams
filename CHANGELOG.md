# CHANGELOG.md

## [2.14.5] - 2024-08-02
Added:
- Made change to prevent more than one login popup from appearing when an embedded CCP is opened in two or more tabs.

## [2.14.4] - 2024-08-01
Added:
- Adding `AWS_WORKSPACE` as an option in `VDIPlatform`

## [2.14.3] - 2024-06-11
Updated:
- Fixed `hasAnySearchParameter` in agent-app.js
- Disabled request-storage-access by default - this was preventing search params from being passed into initApp

## [2.14.2] - 2024-06-07
Added:
- `?visual-refresh=true` is used to access CCPUI's updated UI (aka CloudScape)
- Adding typing for `getChannelContext()`

Updated:
- Updating `initApp` to allow customers to call the method with search parameters which originally wasn't a feature. This enables customers with custom workspaces to attach params such as `?visual-refresh=true` or any values they wish to pass to this url.

## [2.14.1] - 2024-03-29
Added:
- `initCCP` param to set custom ringtone for chat.
- `initCCP` param to disable task ringtone.

Updated:
- Removed local storage check for login popups that was preventing popups from opening if the browser blocked the initial popup for permissions or if the customer closed the popup.

## [2.14.0] - 2024-03-25
Added:
- Contact termination cleanup logic for embedded CustomViews widgets.

## [2.13.3] - 2024-03-20
Updated:
- Fixed `connect.core.getFrameMediaDevices` API for iframed customer apps

## [2.13.2] - 2024-03-13
Updated:
- Minor internal changes

## [2.13.1] - 2024-01-23
Added:
- Permissions for Clipboard APIs when using embedded apps
- `getAgentARN` API

## [2.13.0] - 2024-01-18
Features Introduced:
- Chat Enhanced Monitoring & Barge-In

Added functions:
- `contact.getActiveConnections`
- `contact.hasTwoActiveParticipants`
- `contact.silentMonitor`
- `contact.bargeIn`
- `chatConnection.isSilentMonitor`
- `chatConnection.isBarge`
- `chatConnection.isSilentMonitorEnabled`
- `chatConnection.isBargeEnabled`
- `chatConnection.getMonitorCapabilities`
- `chatConnection.getMonitorStatus`

## [2.12.0] - 2024-01-05
Added:
- Citrix support
- New request-storage-access customization parameters

## [2.11.0] - 2023-12-15
Added:
- API support for pausing and resuming tasks.

Updated:
- Linting changes

## [2.10.0] - 2023-12-06
Bugs Fixed:
- Since version 2.6.2., terminating Streams and re-initializing would not instantiate the event handler, causing events to not be received via event subscriptions. This has been fixed in Version 2.10.0.

Added:
- Typescript support for getMonitorCapabilities and getMonitorStatus.

Updated:
- Refreshing iFrame every ccpLoadTimeout number of seconds while waiting for the user to be authenticated.
- Documentation Updates

## [2.9.0] - 2023-11-28
Features Introduced:
- Video Calling
- SMS Chat

Updated:
- Renamed Wisdom to Amazon Q Connect
- Added optional param in initCCP for enabling earlyGum

## [2.8.0] - 2023-11-17
Features Introduced:
- Quick Responses

## [2.7.4] - 2023-10-27
Added:
- A new parameter to `storageAccess.custom` called `hideCCP`. This param is only applicable when using `mode: "custom"` for the request storage access banner and allows users to specify if CCP should be hidden after granting access whilst being able to customize the banner.

## [2.7.3] - 2023-10-17
Added:
- Typing for the `onGrant` callback in RequestStorageAccess API

## [2.7.2] - 2023-10-02
Added:
- Variable declaration for `ECHO_CANCELLATION_CHECK`.

## [2.7.1] - 2023-09-26
Added:
- Support for the RequestStorageAccess page, which allows customer to consent to Connect's use of an authentication cookie after Chrome deprecates third-party cookies. [Read More](https://docs.aws.amazon.com/connect/latest/adminguide/admin-3pcookies.html#implement-streams-upgrade)

Updated:
- request-storage-access url validation to include govcloud domains.

## [2.7.0] - 2023-09-25
Updated:
- The callback function registered via `contact.onEnded` is no longer invoked when the contact is destroyed. This fix prevents the callback from being invoked twice on `ENDED` and `DESTROYED` events.

## [2.6.9] - 2024-01-16
Updated:
- Reset RSA access state on `connect.core.terminate`, fixing event subscription.

## [2.6.8] - 2023-10-27
Added:
- A new parameter to `storageAccess.custom` called `hideCCP`. This param is only applicable when using `mode: "custom"` for the request storage access banner and allows users to specify if CCP should be hidden after granting access whilst being able to customize the banner.

## [2.6.7] - 2023-10-17
Added:
- Typing for the `onGrant` callback in RequestStorageAccess API

## [2.6.6] - 2023-09-29
Added:
- Variable declaration for `ECHO_CANCELLATION_CHECK`.

## [2.6.5] - 2023-09-26
Added:
- Support for the RequestStorageAccess page, which allows customer to consent to Connect's use of an authentication cookie after Chrome deprecates third-party cookies. [Read More](https://docs.aws.amazon.com/connect/latest/adminguide/admin-3pcookies.html#implement-streams-upgrade)

Updated:
- request-storage-access url validation to include govcloud domains.

## [2.6.1] - 2023-08-11
Updated:
- Reverted update to documentation and api regarding `barge` and `silent_monitor` connection state types

## [2.6.0] - 2023-08-10
Features Introduced:
- Introduced global resiliency APIs.

## [2.5.1] - 2023-07-17
Updated:
- `chatConnection.getConnectionToken` to use current contactId
- `ccpAckTimeout`, `ccpSynTimeout`, `ccpLoadTimeout`, and `disableEchoCancellation` definitions
- Build files

## [2.5.0] - 2023-06-06
Added:
- Adding the ability to disable echoCancellation
- Retries on polling calls for 401 or 403 errors

Updated:
- Improvements to CCP logging
- Ringtone improvements on iFrame refresh

## [2.4.13] - 2024-01-16
Updated:
- Reset RSA access state on `connect.core.terminate`, fixing event subscription.

## [2.4.12] - 2023-10-27
Added:
- A new parameter to `storageAccess.custom` called `hideCCP`. This param is only applicable when using `mode: "custom"` for the request storage access banner and allows users to specify if CCP should be hidden after granting access whilst being able to customize the banner.

## [2.4.11] - 2023-10-17
- Added typing for the `onGrant` callback in RequestStorageAccess API

## [2.4.9] - 2023-09-22
**Important**: This patched version is built off of v2.4.0.
Added:
- Support for the RequestStorageAccess page, which allows customer to consent to Connect's use of an authentication cookie after Chrome deprecates third-party cookies. [Read More](https://docs.aws.amazon.com/connect/latest/adminguide/admin-3pcookies.html#implement-streams-upgrade)

## [2.4.7] - 2023-03-31
Added:
- Typescript support for monitor and barge functions.

## [2.4.6] - 2023-03-27
Updated:
- Documentation for CustomViews.

## [2.4.5] - 2023-01-30
Updated:
- Revert the AgentDataProvider change that was introduced in 2.4.1 and caused a performance degradation.

## [2.4.4] - 2022-12-16
Updated:
- Minor README update for linked contact support with Step-by-Step guides.

## [2.4.2] - 2022-12-13
Bugs Fixed:
- Fix an issue in Streams’ Voice ID APIs that may have led to incorrect values being set against the generatedSpeakerID field in the VoiceIdResult segment of Connect Contact Trace Records (CTRs).

## [2.4.1] - 2022-12-05
Features Introduced:
- This version brings in updates that will provide enhanced monitoring experience to agents and supervisors, allowing to silently monitor multiparty calls, and if needed to barge in the call and take over control, mute agents, or drop them from the call. New APIs introduced with this feature are `isSilentMonitor`, `isBarge`, `isSilentMonitorEnabled`, `isBargeEnabled`, `isUnderSupervision`, `updateMonitorParticipantState`, `getMonitorCapabilities`, `getMonitorStatus`, `isForcedMute`.

## [2.4.0] - 2022-11-29
Features Introduced:
- Introduce Amazon Connect Step-by-step guides embedding support via `connect.agentApp.initApp`.

## [2.3.0] - 2022-08-12
Updated:
- Make StreamsJS compatible with strict mode
- Fix an issue that connect.ValueError and connect.StateError don't print error message properly

## [2.2.0] - 2022-06-08
Added functions:
* `contact.getChannelContext` method to get the channel context for the contact. See Documentation.md for more details
* `connect.core.onAuthorizationSuccess`. See Documentation.md for more details
* `connect.core.onAuthorizeRetriesExhausted` and `connect.core.onCTIAuthorizeRetriesExhausted` methods, along with some backoff logic to the retries / page reloads for the CTI and authorize apis. Please see these methods' entries in Documentation.md for more information.

Added support for Task templates APIs.

## [2.1.0] - 2022-04-19
Added functions:
* `contact.isMultiPartyConferenceEnabled` method to determine whether this contact is a softphone call and multiparty conference feature is turned on. See Documentation.md for more details
* `connect.core.onAuthorizationSuccess`. See Documentation.md for more details
* `connect.core.onAuthorizeRetriesExhausted` and `connect.core.onCTIAuthorizeRetriesExhausted` methods, along with some backoff logic to the retries / page reloads for the CTI and authorize apis. Please see these methods' entries in Documentation.md for more information.

## [2.0.0] - 2022-01-04
Removed Functions:
* `agent.onContactPending` has been removed. Please use `contact.onPending` instead.

New build system: 
* `Make` and `gulp` have been removed and `Webpack` has been added as the new build system.
* Running `npm run release` will continue to produce both `release/connect-streams.js` and `release/connect-streams-min.js` and run tests. 
* `npm run build-streams` will now produce the same files without running any tests.
* `npm run test-mocha` will just run tests and relies on the release files.
* Every command that runs a `gulp` script has been removed.
* See the README for more details

Bugs Fixed:
  - `connect.onError` now triggers. Previously, this api did not work at all. Please be aware that, if you have application logic within this function, its behavior has changed. See its entry in documentation.md for more details.
  - `initCCP` will no longer append additional embedded CCPs to the window when called multiple times. Please note that the use-case of initializing multiple CCPs with `initCCP` has never been supported by Streams, and this change has been added to prevent unpredictable behavior arising from such cases.

Features Introduced:
  - `connect.core.onIframeRetriesExhausted`: Streams now performs backoff while attempting to reload the iframed CCP. Previously, it would endlessly retry on each ACK TIMEOUT event (`connect.EventType.ACK_TIMEOUT`). Now, there are six retries, performed with exponential backoff. Once these six retries to load the embedded CCP are exhausted, no more retries will be attempted. You can subscribe a callback via the api: `connect.core.onIframeRetriesExhausted` to understand when the retries are exhausted, and take some action.

## [1.8.3] - 2024-01-16
Updated:
- Reset RSA access state on `connect.core.terminate`, fixing event subscription.

## [1.8.2] - 2023-10-27
Added:
- A new parameter to `storageAccess.custom` called `hideCCP`. This param is only applicable when using `mode: "custom"` for the request storage access banner and allows users to specify if CCP should be hidden after granting access whilst being able to customize the banner.

## [1.8.1] - 2023-09-26
Added:
- Support for the RequestStorageAccess page, which allows customer to consent to Connect's use of an authentication cookie after Chrome deprecates third-party cookies. [Read More](https://docs.aws.amazon.com/connect/latest/adminguide/admin-3pcookies.html#implement-streams-upgrade)

Updated:
- request-storage-access url validation to include govcloud domains.

## [1.8.0] - 2023-09-25
Updated:
- The callback function registered via `contact.onEnded` is no longer invoked when the contact is destroyed. This fix prevents the callback from being invoked twice on `ENDED` and `DESTROYED` events.

## [1.7.9] - 2024-01-16
Updated:
- Reset RSA access state on `connect.core.terminate`, fixing event subscription.

## [1.7.8] - 2023-10-27
Added:
- A new parameter to `storageAccess.custom` called `hideCCP`. This param is only applicable when using `mode: "custom"` for the request storage access banner and allows users to specify if CCP should be hidden after granting access whilst being able to customize the banner.

## [1.7.7] - 2023-09-26
Updated:
- request-storage-access url validation to include govcloud domain.

## [1.6.0] - 2020-12-01
Features Introduced:
  - A new media channel--tasks--has been added to Connect's offerings, alongside chat and voice. With this release, Streams, in conjunction with [TaskJS](https://github.com/amazon-connect/amazon-connect-taskjs) now supports this feature with relevant apis, etc.
  - VoiceId: You can find relevant apis for using the feature in the src/api.js file.
  - Agent App features: Connect is expanding its agent-app offering with an agent application container called Agent App. Within agent app you can embed CCP UI, Customer Profiles UI, and Amazon Q Connect UI.
  - onConnectionOpened and onConnectionClosed websocket manager apis were introduced.
