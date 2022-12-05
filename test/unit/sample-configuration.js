const dummyInstanceARN = 'arn:aws:connect:us-west-2:123456789000:instance/12345678-1234-abcd-abcd-instance1234';

exports.baseConfig = {
  "name": "AGENT_NAME",
  "username": "USERNAME",
  "softphoneEnabled": true,
  "softphoneAutoAccept": false,
  "extension": "",
  "routingProfile": {
      "name": "Basic Routing Profile",
      "routingProfileARN": `${dummyInstanceARN}/routing-profile/12345678-1234-abcd-abcd-routing12345`,
      "defaultOutboundQueue": {
          "queueARN": `${dummyInstanceARN}/queue/12345678-1234-abcd-abcd-queue1234567`,
          "name": "BasicQueue",
          "queueId": `${dummyInstanceARN}/queue/12345678-1234-abcd-abcd-queue1234567`
      },
      "channelConcurrencyMap": {
          "CHAT": 10,
          "TASK": 10,
          "VOICE": 1
      },
      "queues": [
          {
              "queueARN": `${dummyInstanceARN}/queue/12345678-1234-abcd-abcd-queue1234567`,
              "name": "BasicQueue",
              "queueId": `${dummyInstanceARN}/queue/12345678-1234-abcd-abcd-queue1234567`
          },
          {
              "queueARN": `${dummyInstanceARN}/queue/12345678-1234-abcd-abcd-queue7654321`,
              "name": "CallbackQueue",
              "queueId": `${dummyInstanceARN}/queue/12345678-1234-abcd-abcd-queue7654321`
          }
      ],
      "routingProfileId": `${dummyInstanceARN}/routing-profile/12345678-1234-abcd-abcd-routing12345`
  },
  "agentPreferences": {
      "LANGUAGE": "en_US"
  },
  "permissions": [
      "outboundCall",
      "voiceId",
      "ccpRealtimeContactLens"
  ],
  "agentStates": [
      {
          "agentStateARN": `${dummyInstanceARN}/agent-state/12345678-1234-abcd-abcd-agentstate11`,
          "type": "routable",
          "name": "Available",
          "startTimestamp": null
      },
      {
        "agentStateARN": `${dummyInstanceARN}/agent-state/12345678-1234-abcd-abcd-agentstate22`,
          "type": "not_routable",
          "name": "Lunch",
          "startTimestamp": null
      },
      {
          "agentStateARN": `${dummyInstanceARN}/agent-state/12345678-1234-abcd-abcd-agentstate33`,
          "type": "offline",
          "name": "Offline",
          "startTimestamp": null
      }
  ],
  "dialableCountries": [
      "at", "de", "kg", "gl", "td", "cz", "tg", "ga", "pe", "eg", "la", "hk", "ht", "nl", "bb",
      "mg", "fo", "gy", "ad", "il", "gp", "na", "sz", "is", "ge", "ve", "az", "cg", "do", "ec",
      "pa", "mh", "ye", "gm", "ne", "bz", "tz", "am", "ac", "bj", "km", "es", "vi", "lr", "uz",
      "dk", "tm", "tr", "tv", "py", "bt", "ru", "as", "om", "cf", "sv", "im", "dg", "hn", "br",
      "fk", "ni", "pg", "lt", "my", "hu", "ca", "ar", "tk", "cv", "bn", "pf", "gu", "sl", "pt",
      "lb", "mn", "al", "lk", "gh", "kn", "iq", "kz", "ma", "pr", "za", "pm", "ly", "th", "je",
      "dz", "cd", "mr", "gd", "kh", "wf", "sc", "cn", "pk", "gw", "mq", "si", "se", "us", "bs",
      "it", "lc", "me", "id", "ua", "gg", "qa", "in", "et", "tj", "ro", "cr", "tn", "ci", "ie",
      "jp", "tl", "mt", "sm", "pw", "gr", "ck", "fm", "zm", "sk", "gq", "mx", "vg", "vn", "mz",
      "md", "cm", "sg", "ky", "gn", "ai", "mu", "ps", "ml", "nu", "nz", "va", "an", "nc", "st",
      "au", "bf", "bd", "bh", "gi", "dj", "tw", "be", "bm", "lv", "lu", "ae", "mm", "bw", "kw",
      "sr", "sh", "ch", "ag", "ke", "bi", "bo", "cw", "mc", "hr", "sb", "io", "gb", "tc", "nr",
      "mv", "mw", "co", "gt", "zw", "yt", "jo", "ba", "aw"
  ]
};