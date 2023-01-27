# CHANGELOG.md

## 2.4.5
- Revert the AgentDataProvider change that was introduced in 2.4.1 and caused a performance degradation.

## 2.4.2
- Fix an issue in Streams’ Voice ID APIs that may have led to incorrect values being set against the generatedSpeakerID field in the VoiceIdResult segment of Connect Contact Trace Records (CTRs).

## 2.4.1
- This version brings in updates that will provide enhanced monitoring experience to agents and supervisors, allowing to silently monitor multiparty calls, and if needed to barge in the call and take over control, mute agents, or drop them from the call. New APIs introduced with this feature are `isSilentMonitor`, `isBarge`, `isSilentMonitorEnabled`, `isBargeEnabled`, `isUnderSupervision`, `updateMonitorParticipantState`, `getMonitorCapabilities`, `getMonitorStatus`, `isForcedMute`.

## 2.4.0
- Introduce Amazon Connect Step-by-step guides embedding support via `connect.agentApp.initApp`.

## 2.3.0
- Make StreamsJS compatible with strict mode
- Fix an issue that connect.ValueError and connect.StateError don't print error message properly

## 2.2.0
Added functions:
* `contact.getChannelContext` method to get the channel context for the contact. See Documentation.md for more details
* `connect.core.onAuthorizationSuccess`. See Documentation.md for more details
* `connect.core.onAuthorizeRetriesExhausted` and `connect.core.onCTIAuthorizeRetriesExhausted` methods, along with some backoff logic to the retries / page reloads for the CTI and authorize apis. Please see these methods' entries in Documentation.md for more information.

Added support for Task templates APIs.

## 2.1.0
Added functions:
* `contact.isMultiPartyConferenceEnabled` method to determine whether this contact is a softphone call and multiparty conference feature is turned on. See Documentation.md for more details

## 2.0.0
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

New Features:
  - 1. `connect.core.onIframeRetriesExhausted`: Streams now performs backoff while attempting to reload the iframed CCP. Previously, it would endlessly retry on each ACK TIMEOUT event (`connect.EventType.ACK_TIMEOUT`). Now, there are six retries, performed with exponential backoff. Once these six retries to load the embedded CCP are exhausted, no more retries will be attempted. You can subscribe a callback via the api: `connect.core.onIframeRetriesExhausted` to understand when the retries are exhausted, and take some action.


## 1.6.0 (2020-12-01)
Features Introduced:
  - A new media channel--tasks--has been added to Connect's offerings, alongside chat and voice. With this release, Streams, in conjunction with [TaskJS](https://github.com/amazon-connect/amazon-connect-taskjs) now supports this feature with relevant apis, etc.
  - VoiceId: You can find relevant apis for using the feature in the src/api.js file.
  - Agent App features: Connect is expanding its agent-app offering with an agent application container called Agent App. Within agent app you can embed CCP UI, Customer Profiles UI, and Wisdom UI.
  - onConnectionOpened and onConnectionClosed websocket manager apis were introduced.
