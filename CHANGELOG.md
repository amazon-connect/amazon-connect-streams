# CHANGELOG.md

## 2.0.0
New build system: 
* `Make` and `gulp` have been removed and `Webpack` has been added as the new build system.
* Running `npm run release` will continue to produce both `release/connect-streams.js` and `release/connect-streams-min.js` and run tests. 
* `npm run build-streams` will now produce the same files without running any tests.
* `npm run test-mocha` will just run tests and relies on the release files.
* Every command that runs a `gulp` script has been removed.
* See the README for more details

Bugs Fixed:
  - `connect.onError` now triggers. Previously, this api did not work at all. Please be aware that, if you have application logic within this function, its behavior has changed. See its entry in documentation.md for more details.

New Features:
  - 1. `connect.core.onIframeRetriesExhausted`: Streams now performs backoff while attempting to reload the iframed CCP. Previously, it would endlessly retry on each ACK TIMEOUT event (`connect.EventType.ACK_TIMEOUT`). Now, there are six retries, performed with exponential backoff. Once these six retries to load the embedded CCP are exhausted, no more retries will be attempted. You can subscribe a callback via the api: `connect.core.onIframeRetriesExhausted` to understand when the retries are exhausted, and take some action.


## 1.6.0 (2020-12-01)
Features Introduced:
  - A new media channel--tasks--has been added to Connect's offerings, alongside chat and voice. With this release, Streams, in conjunction with [TaskJS](https://github.com/amazon-connect/amazon-connect-taskjs) now supports this feature with relevant apis, etc.
  - VoiceId: You can find relevant apis for using the feature in the src/api.js file.
  - Agent App features: Connect is expanding its agent-app offering with an agent application container called Agent App. Within agent app you can embed CCP UI, Customer Profiles UI, and Wisdom UI.
  - onConnectionOpened and onConnectionClosed websocket manager apis were introduced.
