/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports={
  "version": "2.0",
  "metadata": {
    "apiVersion": "2014-06-30",
    "endpointPrefix": "cognito-identity",
    "jsonVersion": "1.1",
    "protocol": "json",
    "serviceFullName": "Amazon Cognito Identity",
    "signatureVersion": "v4",
    "targetPrefix": "AWSCognitoIdentityService"
  },
  "operations": {
    "CreateIdentityPool": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityPoolName",
          "AllowUnauthenticatedIdentities"
        ],
        "members": {
          "IdentityPoolName": {},
          "AllowUnauthenticatedIdentities": {
            "type": "boolean"
          },
          "SupportedLoginProviders": {
            "shape": "S4"
          },
          "DeveloperProviderName": {},
          "OpenIdConnectProviderARNs": {
            "shape": "S8"
          },
          "CognitoIdentityProviders": {
            "shape": "Sa"
          },
          "SamlProviderARNs": {
            "shape": "Se"
          }
        }
      },
      "output": {
        "shape": "Sf"
      }
    },
    "DeleteIdentities": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityIdsToDelete"
        ],
        "members": {
          "IdentityIdsToDelete": {
            "type": "list",
            "member": {}
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "UnprocessedIdentityIds": {
            "type": "list",
            "member": {
              "type": "structure",
              "members": {
                "IdentityId": {},
                "ErrorCode": {}
              }
            }
          }
        }
      }
    },
    "DeleteIdentityPool": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityPoolId"
        ],
        "members": {
          "IdentityPoolId": {}
        }
      }
    },
    "DescribeIdentity": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityId"
        ],
        "members": {
          "IdentityId": {}
        }
      },
      "output": {
        "shape": "Sq"
      }
    },
    "DescribeIdentityPool": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityPoolId"
        ],
        "members": {
          "IdentityPoolId": {}
        }
      },
      "output": {
        "shape": "Sf"
      }
    },
    "GetCredentialsForIdentity": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityId"
        ],
        "members": {
          "IdentityId": {},
          "Logins": {
            "shape": "Sv"
          },
          "CustomRoleArn": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "IdentityId": {},
          "Credentials": {
            "type": "structure",
            "members": {
              "AccessKeyId": {},
              "SecretKey": {},
              "SessionToken": {},
              "Expiration": {
                "type": "timestamp"
              }
            }
          }
        }
      }
    },
    "GetId": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityPoolId"
        ],
        "members": {
          "AccountId": {},
          "IdentityPoolId": {},
          "Logins": {
            "shape": "Sv"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "IdentityId": {}
        }
      }
    },
    "GetIdentityPoolRoles": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityPoolId"
        ],
        "members": {
          "IdentityPoolId": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "IdentityPoolId": {},
          "Roles": {
            "shape": "S17"
          }
        }
      }
    },
    "GetOpenIdToken": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityId"
        ],
        "members": {
          "IdentityId": {},
          "Logins": {
            "shape": "Sv"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "IdentityId": {},
          "Token": {}
        }
      }
    },
    "GetOpenIdTokenForDeveloperIdentity": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityPoolId",
          "Logins"
        ],
        "members": {
          "IdentityPoolId": {},
          "IdentityId": {},
          "Logins": {
            "shape": "Sv"
          },
          "TokenDuration": {
            "type": "long"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "IdentityId": {},
          "Token": {}
        }
      }
    },
    "ListIdentities": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityPoolId",
          "MaxResults"
        ],
        "members": {
          "IdentityPoolId": {},
          "MaxResults": {
            "type": "integer"
          },
          "NextToken": {},
          "HideDisabled": {
            "type": "boolean"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "IdentityPoolId": {},
          "Identities": {
            "type": "list",
            "member": {
              "shape": "Sq"
            }
          },
          "NextToken": {}
        }
      }
    },
    "ListIdentityPools": {
      "input": {
        "type": "structure",
        "required": [
          "MaxResults"
        ],
        "members": {
          "MaxResults": {
            "type": "integer"
          },
          "NextToken": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "IdentityPools": {
            "type": "list",
            "member": {
              "type": "structure",
              "members": {
                "IdentityPoolId": {},
                "IdentityPoolName": {}
              }
            }
          },
          "NextToken": {}
        }
      }
    },
    "LookupDeveloperIdentity": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityPoolId"
        ],
        "members": {
          "IdentityPoolId": {},
          "IdentityId": {},
          "DeveloperUserIdentifier": {},
          "MaxResults": {
            "type": "integer"
          },
          "NextToken": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "IdentityId": {},
          "DeveloperUserIdentifierList": {
            "type": "list",
            "member": {}
          },
          "NextToken": {}
        }
      }
    },
    "MergeDeveloperIdentities": {
      "input": {
        "type": "structure",
        "required": [
          "SourceUserIdentifier",
          "DestinationUserIdentifier",
          "DeveloperProviderName",
          "IdentityPoolId"
        ],
        "members": {
          "SourceUserIdentifier": {},
          "DestinationUserIdentifier": {},
          "DeveloperProviderName": {},
          "IdentityPoolId": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "IdentityId": {}
        }
      }
    },
    "SetIdentityPoolRoles": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityPoolId",
          "Roles"
        ],
        "members": {
          "IdentityPoolId": {},
          "Roles": {
            "shape": "S17"
          }
        }
      }
    },
    "UnlinkDeveloperIdentity": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityId",
          "IdentityPoolId",
          "DeveloperProviderName",
          "DeveloperUserIdentifier"
        ],
        "members": {
          "IdentityId": {},
          "IdentityPoolId": {},
          "DeveloperProviderName": {},
          "DeveloperUserIdentifier": {}
        }
      }
    },
    "UnlinkIdentity": {
      "input": {
        "type": "structure",
        "required": [
          "IdentityId",
          "Logins",
          "LoginsToRemove"
        ],
        "members": {
          "IdentityId": {},
          "Logins": {
            "shape": "Sv"
          },
          "LoginsToRemove": {
            "shape": "Sr"
          }
        }
      }
    },
    "UpdateIdentityPool": {
      "input": {
        "shape": "Sf"
      },
      "output": {
        "shape": "Sf"
      }
    }
  },
  "shapes": {
    "S4": {
      "type": "map",
      "key": {},
      "value": {}
    },
    "S8": {
      "type": "list",
      "member": {}
    },
    "Sa": {
      "type": "list",
      "member": {
        "type": "structure",
        "members": {
          "ProviderName": {},
          "ClientId": {}
        }
      }
    },
    "Se": {
      "type": "list",
      "member": {}
    },
    "Sf": {
      "type": "structure",
      "required": [
        "IdentityPoolId",
        "IdentityPoolName",
        "AllowUnauthenticatedIdentities"
      ],
      "members": {
        "IdentityPoolId": {},
        "IdentityPoolName": {},
        "AllowUnauthenticatedIdentities": {
          "type": "boolean"
        },
        "SupportedLoginProviders": {
          "shape": "S4"
        },
        "DeveloperProviderName": {},
        "OpenIdConnectProviderARNs": {
          "shape": "S8"
        },
        "CognitoIdentityProviders": {
          "shape": "Sa"
        },
        "SamlProviderARNs": {
          "shape": "Se"
        }
      }
    },
    "Sq": {
      "type": "structure",
      "members": {
        "IdentityId": {},
        "Logins": {
          "shape": "Sr"
        },
        "CreationDate": {
          "type": "timestamp"
        },
        "LastModifiedDate": {
          "type": "timestamp"
        }
      }
    },
    "Sr": {
      "type": "list",
      "member": {}
    },
    "Sv": {
      "type": "map",
      "key": {},
      "value": {}
    },
    "S17": {
      "type": "map",
      "key": {},
      "value": {}
    }
  }
}
},{}],2:[function(require,module,exports){
module.exports={
  "version": "2.0",
  "metadata": {
    "apiVersion": "2017-02-15",
    "endpointPrefix": "connect",
    "jsonVersion": "1.0",
    "protocol": "json",
    "serviceAbbreviation": "Connect",
    "serviceFullName": "AmazonConnectCTIService",
    "signatureVersion": "v4",
    "targetPrefix": "AmazonConnectCTIService",
    "uid": "connect-2017-02-15"
  },
  "operations": {
    "AcceptContact": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "ConferenceConnections": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "CreateAdditionalConnection": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId",
          "endpoint"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {},
          "endpoint": {
            "shape": "Sa"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "CreateOutboundContact": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "endpoint"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "endpoint": {
            "shape": "Sa"
          },
          "queueARN": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "CreateTransport": {
      "input": {
        "type": "structure",
        "required": [
          "transportType",
          "authentication"
        ],
        "members": {
          "transportType": {},
          "participantId": {},
          "contactId": {},
          "authentication": {
            "shape": "S2"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "webSocketTransport": {
            "type": "structure",
            "required": [
              "url",
              "transportLifeTimeInSeconds"
            ],
            "members": {
              "url": {},
              "transportLifeTimeInSeconds": {
                "type": "long"
              }
            }
          },
          "chatTokenTransport": {
            "type": "structure",
            "required": [
              "participantToken",
              "expiry"
            ],
            "members": {
              "participantToken": {},
              "expiry": {}
            }
          }
        }
      }
    },
    "DestroyConnection": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId",
          "connectionId"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {},
          "connectionId": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "GetAgentConfiguration": {
      "input": {
        "type": "structure",
        "required": [
          "authentication"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          }
        }
      },
      "output": {
        "type": "structure",
        "required": [
          "configuration"
        ],
        "members": {
          "configuration": {
            "shape": "Sr"
          }
        }
      }
    },
    "GetAgentPermissions": {
      "input": {
        "type": "structure",
        "required": [
          "authentication"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "nextToken": {},
          "maxResults": {
            "type": "integer"
          }
        }
      },
      "output": {
        "type": "structure",
        "required": [
          "permissions"
        ],
        "members": {
          "permissions": {
            "type": "list",
            "member": {}
          },
          "nextToken": {}
        }
      }
    },
    "GetAgentSnapshot": {
      "input": {
        "type": "structure",
        "required": [
          "authentication"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "nextToken": {},
          "timeout": {
            "type": "long"
          }
        }
      },
      "output": {
        "type": "structure",
        "required": [
          "snapshot",
          "nextToken"
        ],
        "members": {
          "snapshot": {
            "type": "structure",
            "required": [
              "state",
              "contacts",
              "snapshotTimestamp"
            ],
            "members": {
              "state": {
                "shape": "S17"
              },
              "contacts": {
                "type": "list",
                "member": {
                  "type": "structure",
                  "required": [
                    "contactId",
                    "type",
                    "state",
                    "queueTimestamp",
                    "connections",
                    "attributes"
                  ],
                  "members": {
                    "contactId": {},
                    "initialContactId": {},
                    "type": {},
                    "state": {
                      "type": "structure",
                      "required": [
                        "type",
                        "timestamp"
                      ],
                      "members": {
                        "type": {},
                        "timestamp": {
                          "type": "timestamp"
                        }
                      }
                    },
                    "queue": {
                      "shape": "Sg"
                    },
                    "queueTimestamp": {
                      "type": "timestamp"
                    },
                    "connections": {
                      "type": "list",
                      "member": {
                        "type": "structure",
                        "required": [
                          "connectionId",
                          "state",
                          "type",
                          "initial"
                        ],
                        "members": {
                          "connectionId": {},
                          "endpoint": {
                            "shape": "Sa"
                          },
                          "state": {
                            "type": "structure",
                            "required": [
                              "type",
                              "timestamp"
                            ],
                            "members": {
                              "type": {},
                              "timestamp": {
                                "type": "timestamp"
                              }
                            }
                          },
                          "type": {},
                          "initial": {
                            "type": "boolean"
                          },
                          "softphoneMediaInfo": {
                            "type": "structure",
                            "members": {
                              "callType": {},
                              "autoAccept": {
                                "type": "boolean"
                              },
                              "mediaLegContextToken": {},
                              "callContextToken": {},
                              "callConfigJson": {}
                            }
                          },
                          
                          "monitoringInfo": {
                            "type": "structure",
                            "members": {
                                "agent": {},
                                "customer": {},
                                "joinTimeStamp": {
                                  "type": "timestamp"
                                }
                            }
                          },

                          "chatMediaInfo": {
                            "type": "structure",
                            "members": {
                                "chatAutoAccept": {
                                    "type": "boolean"
                                },
                                "customerName": {
                                  "type": "string"
                                },
                              "connectionData": {}
                            }
                          }
                        }
                      }
                    },
                    "attributes": {
                      "shape": "S1o"
                    }
                  }
                }
              },
              "snapshotTimestamp": {
                "type": "timestamp"
              }
            }
          },
          "nextToken": {}
        }
      }
    },
    "GetAgentStates": {
      "input": {
        "type": "structure",
        "required": [
          "authentication"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "nextToken": {},
          "maxResults": {
            "type": "integer"
          }
        }
      },
      "output": {
        "type": "structure",
        "required": [
          "states"
        ],
        "members": {
          "states": {
            "type": "list",
            "member": {
              "shape": "S17"
            }
          },
          "nextToken": {}
        }
      }
    },
    "GetDialableCountryCodes": {
      "input": {
        "type": "structure",
        "required": [
          "authentication"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "nextToken": {},
          "maxResults": {
            "type": "integer"
          }
        }
      },
      "output": {
        "type": "structure",
        "required": [
          "countryCodes"
        ],
        "members": {
          "countryCodes": {
            "type": "list",
            "member": {}
          },
          "nextToken": {}
        }
      }
    },
    "GetEndpoints": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "queueARNs"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "queueARNs": {
            "type": "list",
            "member": {}
          },
          "nextToken": {},
          "maxResults": {
            "type": "integer"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "endpoints": {
            "type": "list",
            "member": {
              "shape": "Sa"
            }
          },
          "nextToken": {}
        }
      }
    },
    "GetNewAuthToken": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "refreshToken"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "refreshToken": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {
          "newAuthToken": {},
          "expirationDateTime": {
            "type": "timestamp"
          }
        }
      }
    },
    "GetRoutingProfileQueues": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "routingProfileARN"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "routingProfileARN": {},
          "nextToken": {},
          "maxResults": {
            "type": "integer"
          }
        }
      },
      "output": {
        "type": "structure",
        "required": [
          "queues"
        ],
        "members": {
          "queues": {
            "type": "list",
            "member": {
              "shape": "Sg"
            }
          },
          "nextToken": {}
        }
      }
    },
    "HoldConnection": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId",
          "connectionId"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {},
          "connectionId": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "NotifyContactIssue": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {},
          "issueCode": {},
          "description": {},
          "clientLogs": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "PutAgentState": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "state"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "state": {
            "shape": "S17"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "ResumeConnection": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId",
          "connectionId"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {},
          "connectionId": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "SendClientLogs": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "logEvents"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "logEvents": {
            "type": "list",
            "member": {
              "type": "structure",
              "members": {
                "timestamp": {
                  "type": "timestamp"
                },
                "component": {},
                "message": {}
              }
            }
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "SendDigits": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId",
          "connectionId",
          "digits"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {},
          "connectionId": {},
          "digits": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "SendSoftphoneCallMetrics": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId",
          "softphoneStreamStatistics"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {},
          "softphoneStreamStatistics": {
            "shape": "S2n"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "SendSoftphoneCallReport": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId",
          "report"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {},
          "report": {
            "type": "structure",
            "members": {
              "callStartTime": {
                "type": "timestamp"
              },
              "callEndTime": {
                "type": "timestamp"
              },
              "softphoneStreamStatistics": {
                "shape": "S2n"
              },
              "gumTimeMillis": {
                "type": "long"
              },
              "initializationTimeMillis": {
                "type": "long"
              },
              "iceCollectionTimeMillis": {
                "type": "long"
              },
              "signallingConnectTimeMillis": {
                "type": "long"
              },
              "handshakeTimeMillis": {
                "type": "long"
              },
              "preTalkTimeMillis": {
                "type": "long"
              },
              "talkTimeMillis": {
                "type": "long"
              },
              "cleanupTimeMillis": {
                "type": "long"
              },
              "iceCollectionFailure": {
                "type": "boolean"
              },
              "signallingConnectionFailure": {
                "type": "boolean"
              },
              "handshakeFailure": {
                "type": "boolean"
              },
              "gumOtherFailure": {
                "type": "boolean"
              },
              "gumTimeoutFailure": {
                "type": "boolean"
              },
              "createOfferFailure": {
                "type": "boolean"
              },
              "setLocalDescriptionFailure": {
                "type": "boolean"
              },
              "userBusyFailure": {
                "type": "boolean"
              },
              "invalidRemoteSDPFailure": {
                "type": "boolean"
              },
              "noRemoteIceCandidateFailure": {
                "type": "boolean"
              },
              "setRemoteDescriptionFailure": {
                "type": "boolean"
              }
            }
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "ToggleActiveConnections": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId",
          "connectionId"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {},
          "connectionId": {}
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "UpdateAgentConfiguration": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "configuration"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "configuration": {
            "shape": "Sr"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    },
    "UpdateContactAttributes": {
      "input": {
        "type": "structure",
        "required": [
          "authentication",
          "contactId",
          "attributes"
        ],
        "members": {
          "authentication": {
            "shape": "S2"
          },
          "contactId": {},
          "attributes": {
            "shape": "S1o"
          }
        }
      },
      "output": {
        "type": "structure",
        "members": {}
      }
    }
  },
  "shapes": {
    "S2": {
      "type": "structure",
      "members": {
        "agentARN": {},
        "authToken": {}
      }
    },
    "Sa": {
      "type": "structure",
      "required": [
        "type"
      ],
      "members": {
        "endpointARN": {},
        "type": {},
        "name": {},
        "phoneNumber": {},
        "agentLogin": {},
        "queue": {
          "shape": "Sg"
        }
      }
    },
    "Sg": {
      "type": "structure",
      "members": {
        "queueARN": {},
        "name": {}
      }
    },
    "Sr": {
      "type": "structure",
      "required": [
        "name",
        "softphoneEnabled",
        "softphoneAutoAccept",
        "extension",
        "routingProfile"
      ],
      "members": {
        "name": {},
        "username": {},
        "softphoneEnabled": {
          "type": "boolean"
        },
        "softphoneAutoAccept": {
          "type": "boolean"
        },
        "extension": {},
        "routingProfile": {
          "type": "structure",
          "members": {
            "name": {},
            "routingProfileARN": {},
            "defaultOutboundQueue": {
              "shape": "Sg"
            }
          }
        },
        "agentPreferences": {
          "type": "map",
          "key": {},
          "value": {}
        }
      }
    },
    "S17": {
      "type": "structure",
      "required": [
        "type",
        "name"
      ],
      "members": {
        "agentStateARN": {},
        "type": {},
        "name": {},
        "startTimestamp": {
          "type": "timestamp"
        }
      }
    },
    "S1o": {
      "type": "map",
      "key": {},
      "value": {
        "type": "structure",
        "required": [
          "name"
        ],
        "members": {
          "name": {},
          "value": {}
        }
      }
    },
    "S2n": {
      "type": "list",
      "member": {
        "type": "structure",
        "members": {
          "timestamp": {
            "type": "timestamp"
          },
          "softphoneStreamType": {},
          "packetCount": {
            "type": "long"
          },
          "packetsLost": {
            "type": "long"
          },
          "audioLevel": {
            "type": "double"
          },
          "jitterBufferMillis": {
            "type": "long"
          },
          "roundTripTimeMillis": {
            "type": "long"
          }
        }
      }
    }
  }
}
},{}],3:[function(require,module,exports){
module.exports={
  "acm": {
    "name": "ACM",
    "cors": true
  },
  "apigateway": {
    "name": "APIGateway",
    "cors": true
  },
  "applicationautoscaling": {
    "prefix": "application-autoscaling",
    "name": "ApplicationAutoScaling",
    "cors": true
  },
  "autoscaling": {
    "name": "AutoScaling",
    "cors": true
  },
  "budgets": {
    "name": "Budgets"
  },
  "cloudformation": {
    "name": "CloudFormation",
    "cors": true
  },
  "cloudfront": {
    "name": "CloudFront",
    "versions": [
      "2013-05-12*",
      "2013-11-11*",
      "2014-05-31*",
      "2014-10-21*",
      "2014-11-06*",
      "2015-04-17*",
      "2015-07-27*",
      "2015-09-17*",
      "2016-01-13*",
      "2016-01-28*",
      "2016-08-01*",
      "2016-08-20*",
      "2016-09-07*"
    ],
    "cors": true
  },
  "cloudhsm": {
    "name": "CloudHSM",
    "cors": true
  },
  "cloudsearch": {
    "name": "CloudSearch"
  },
  "cloudsearchdomain": {
    "name": "CloudSearchDomain"
  },
  "cloudtrail": {
    "name": "CloudTrail",
    "cors": true
  },
  "cloudwatch": {
    "prefix": "monitoring",
    "name": "CloudWatch",
    "cors": true
  },
  "cloudwatchevents": {
    "prefix": "events",
    "name": "CloudWatchEvents",
    "versions": [
      "2014-02-03*"
    ],
    "cors": true
  },
  "cloudwatchlogs": {
    "prefix": "logs",
    "name": "CloudWatchLogs",
    "cors": true
  },
  "codecommit": {
    "name": "CodeCommit",
    "cors": true
  },
  "codedeploy": {
    "name": "CodeDeploy",
    "cors": true
  },
  "codepipeline": {
    "name": "CodePipeline",
    "cors": true
  },
  "cognitoidentity": {
    "prefix": "cognito-identity",
    "name": "CognitoIdentity",
    "cors": true
  },
  "cognitoidentityserviceprovider": {
    "prefix": "cognito-idp",
    "name": "CognitoIdentityServiceProvider",
    "cors": true
  },
  "cognitosync": {
    "prefix": "cognito-sync",
    "name": "CognitoSync",
    "cors": true
  },
  "configservice": {
    "prefix": "config",
    "name": "ConfigService",
    "cors": true
  },
  "connect": {
    "name":  "Connect",
    "cors":  true
  },
  "datapipeline": {
    "name": "DataPipeline"
  },
  "devicefarm": {
    "name": "DeviceFarm",
    "cors": true
  },
  "directconnect": {
    "name": "DirectConnect",
    "cors": true
  },
  "directoryservice": {
    "prefix": "ds",
    "name": "DirectoryService"
  },
  "discovery": {
    "name": "Discovery"
  },
  "dms": {
    "name": "DMS"
  },
  "dynamodb": {
    "name": "DynamoDB",
    "cors": true
  },
  "dynamodbstreams": {
    "prefix": "streams.dynamodb",
    "name": "DynamoDBStreams",
    "cors": true
  },
  "ec2": {
    "name": "EC2",
    "versions": [
      "2013-06-15*",
      "2013-10-15*",
      "2014-02-01*",
      "2014-05-01*",
      "2014-06-15*",
      "2014-09-01*",
      "2014-10-01*",
      "2015-03-01*",
      "2015-04-15*",
      "2015-10-01*",
      "2016-04-01*"
    ],
    "cors": true
  },
  "ecr": {
    "name": "ECR",
    "cors": true
  },
  "ecs": {
    "name": "ECS",
    "cors": true
  },
  "efs": {
    "prefix": "elasticfilesystem",
    "name": "EFS"
  },
  "elasticache": {
    "name": "ElastiCache",
    "versions": [
      "2012-11-15*",
      "2014-03-24*",
      "2014-07-15*",
      "2014-09-30*"
    ],
    "cors": true
  },
  "elasticbeanstalk": {
    "name": "ElasticBeanstalk",
    "cors": true
  },
  "elb": {
    "prefix": "elasticloadbalancing",
    "name": "ELB",
    "cors": true
  },
  "elbv2": {
    "prefix": "elasticloadbalancingv2",
    "name": "ELBv2",
    "cors": true
  },
  "emr": {
    "prefix": "elasticmapreduce",
    "name": "EMR",
    "cors": true
  },
  "es": {
    "name": "ES"
  },
  "elastictranscoder": {
    "name": "ElasticTranscoder",
    "cors": true
  },
  "firehose": {
    "name": "Firehose",
    "cors": true
  },
  "gamelift": {
    "name": "GameLift",
    "cors": true
  },
  "glacier": {
    "name": "Glacier"
  },
  "iam": {
    "name": "IAM"
  },
  "importexport": {
    "name": "ImportExport"
  },
  "inspector": {
    "name": "Inspector",
    "versions": [
      "2015-08-18*"
    ],
    "cors": true
  },
  "iot": {
    "name": "Iot",
    "cors": true
  },
  "iotdata": {
    "prefix": "iot-data",
    "name": "IotData",
    "cors": true
  },
  "kinesis": {
    "name": "Kinesis",
    "cors": true
  },
  "kinesisanalytics": {
    "name": "KinesisAnalytics"
  },
  "kms": {
    "name": "KMS",
    "cors": true
  },
  "lambda": {
    "name": "Lambda",
    "cors": true
  },
  "machinelearning": {
    "name": "MachineLearning",
    "cors": true
  },
  "marketplacecommerceanalytics": {
    "name": "MarketplaceCommerceAnalytics",
    "cors": true
  },
  "marketplacemetering": {
    "prefix": "meteringmarketplace",
    "name": "MarketplaceMetering"
  },
  "mobileanalytics": {
    "name": "MobileAnalytics",
    "cors": true
  },
  "opsworks": {
    "name": "OpsWorks",
    "cors": true
  },
  "rds": {
    "name": "RDS",
    "versions": [
      "2014-09-01*"
    ],
    "cors": true
  },
  "redshift": {
    "name": "Redshift",
    "cors": true
  },
  "route53": {
    "name": "Route53",
    "cors": true
  },
  "route53domains": {
    "name": "Route53Domains",
    "cors": true
  },
  "s3": {
    "name": "S3",
    "dualstackAvailable": true,
    "cors": true
  },
  "servicecatalog": {
    "name": "ServiceCatalog",
    "cors": true
  },
  "ses": {
    "prefix": "email",
    "name": "SES",
    "cors": true
  },
  "simpledb": {
    "prefix": "sdb",
    "name": "SimpleDB"
  },
  "sms": {
    "name": "SMS"
  },
  "snowball": {
    "name": "Snowball"
  },
  "sns": {
    "name": "SNS",
    "cors": true
  },
  "sqs": {
    "name": "SQS",
    "cors": true
  },
  "ssm": {
    "name": "SSM",
    "cors": true
  },
  "storagegateway": {
    "name": "StorageGateway",
    "cors": true
  },
  "sts": {
    "name": "STS",
    "cors": true
  },
  "support": {
    "name": "Support"
  },
  "swf": {
    "name": "SWF"
  },
  "waf": {
    "name": "WAF",
    "cors": true
  },
  "workspaces": {
    "name": "WorkSpaces"
  }
}

},{}],4:[function(require,module,exports){
module.exports={
  "version": "2.0",
  "metadata": {
    "apiVersion": "2011-06-15",
    "endpointPrefix": "sts",
    "globalEndpoint": "sts.amazonaws.com",
    "protocol": "query",
    "serviceAbbreviation": "AWS STS",
    "serviceFullName": "AWS Security Token Service",
    "signatureVersion": "v4",
    "xmlNamespace": "https://sts.amazonaws.com/doc/2011-06-15/"
  },
  "operations": {
    "AssumeRole": {
      "input": {
        "type": "structure",
        "required": [
          "RoleArn",
          "RoleSessionName"
        ],
        "members": {
          "RoleArn": {},
          "RoleSessionName": {},
          "Policy": {},
          "DurationSeconds": {
            "type": "integer"
          },
          "ExternalId": {},
          "SerialNumber": {},
          "TokenCode": {}
        }
      },
      "output": {
        "resultWrapper": "AssumeRoleResult",
        "type": "structure",
        "members": {
          "Credentials": {
            "shape": "Sa"
          },
          "AssumedRoleUser": {
            "shape": "Sf"
          },
          "PackedPolicySize": {
            "type": "integer"
          }
        }
      }
    },
    "AssumeRoleWithSAML": {
      "input": {
        "type": "structure",
        "required": [
          "RoleArn",
          "PrincipalArn",
          "SAMLAssertion"
        ],
        "members": {
          "RoleArn": {},
          "PrincipalArn": {},
          "SAMLAssertion": {},
          "Policy": {},
          "DurationSeconds": {
            "type": "integer"
          }
        }
      },
      "output": {
        "resultWrapper": "AssumeRoleWithSAMLResult",
        "type": "structure",
        "members": {
          "Credentials": {
            "shape": "Sa"
          },
          "AssumedRoleUser": {
            "shape": "Sf"
          },
          "PackedPolicySize": {
            "type": "integer"
          },
          "Subject": {},
          "SubjectType": {},
          "Issuer": {},
          "Audience": {},
          "NameQualifier": {}
        }
      }
    },
    "AssumeRoleWithWebIdentity": {
      "input": {
        "type": "structure",
        "required": [
          "RoleArn",
          "RoleSessionName",
          "WebIdentityToken"
        ],
        "members": {
          "RoleArn": {},
          "RoleSessionName": {},
          "WebIdentityToken": {},
          "ProviderId": {},
          "Policy": {},
          "DurationSeconds": {
            "type": "integer"
          }
        }
      },
      "output": {
        "resultWrapper": "AssumeRoleWithWebIdentityResult",
        "type": "structure",
        "members": {
          "Credentials": {
            "shape": "Sa"
          },
          "SubjectFromWebIdentityToken": {},
          "AssumedRoleUser": {
            "shape": "Sf"
          },
          "PackedPolicySize": {
            "type": "integer"
          },
          "Provider": {},
          "Audience": {}
        }
      }
    },
    "DecodeAuthorizationMessage": {
      "input": {
        "type": "structure",
        "required": [
          "EncodedMessage"
        ],
        "members": {
          "EncodedMessage": {}
        }
      },
      "output": {
        "resultWrapper": "DecodeAuthorizationMessageResult",
        "type": "structure",
        "members": {
          "DecodedMessage": {}
        }
      }
    },
    "GetCallerIdentity": {
      "input": {
        "type": "structure",
        "members": {}
      },
      "output": {
        "resultWrapper": "GetCallerIdentityResult",
        "type": "structure",
        "members": {
          "UserId": {},
          "Account": {},
          "Arn": {}
        }
      }
    },
    "GetFederationToken": {
      "input": {
        "type": "structure",
        "required": [
          "Name"
        ],
        "members": {
          "Name": {},
          "Policy": {},
          "DurationSeconds": {
            "type": "integer"
          }
        }
      },
      "output": {
        "resultWrapper": "GetFederationTokenResult",
        "type": "structure",
        "members": {
          "Credentials": {
            "shape": "Sa"
          },
          "FederatedUser": {
            "type": "structure",
            "required": [
              "FederatedUserId",
              "Arn"
            ],
            "members": {
              "FederatedUserId": {},
              "Arn": {}
            }
          },
          "PackedPolicySize": {
            "type": "integer"
          }
        }
      }
    },
    "GetSessionToken": {
      "input": {
        "type": "structure",
        "members": {
          "DurationSeconds": {
            "type": "integer"
          },
          "SerialNumber": {},
          "TokenCode": {}
        }
      },
      "output": {
        "resultWrapper": "GetSessionTokenResult",
        "type": "structure",
        "members": {
          "Credentials": {
            "shape": "Sa"
          }
        }
      }
    }
  },
  "shapes": {
    "Sa": {
      "type": "structure",
      "required": [
        "AccessKeyId",
        "SecretAccessKey",
        "SessionToken",
        "Expiration"
      ],
      "members": {
        "AccessKeyId": {},
        "SecretAccessKey": {},
        "SessionToken": {},
        "Expiration": {
          "type": "timestamp"
        }
      }
    },
    "Sf": {
      "type": "structure",
      "required": [
        "AssumedRoleId",
        "Arn"
      ],
      "members": {
        "AssumedRoleId": {},
        "Arn": {}
      }
    }
  }
}
},{}],5:[function(require,module,exports){
require('../lib/node_loader');
var AWS = require('../lib/core');
var Service = require('../lib/service');
var apiLoader = require('../lib/api_loader');

apiLoader.services['cognitoidentity'] = {};
AWS.CognitoIdentity = Service.defineService('cognitoidentity', ['2014-06-30']);
require('../lib/services/cognitoidentity');
Object.defineProperty(apiLoader.services['cognitoidentity'], '2014-06-30', {
  get: function get() {
    var model = require('../apis/cognito-identity-2014-06-30.min.json');
    return model;
  },
  enumerable: true,
  configurable: true
});

module.exports = AWS.CognitoIdentity;

},{"../apis/cognito-identity-2014-06-30.min.json":1,"../lib/api_loader":7,"../lib/core":10,"../lib/node_loader":8,"../lib/service":41,"../lib/services/cognitoidentity":42}],6:[function(require,module,exports){
require('../lib/node_loader');
var AWS = require('../lib/core');
var Service = require('../lib/service');
var apiLoader = require('../lib/api_loader');

apiLoader.services['sts'] = {};
AWS.STS = Service.defineService('sts', ['2011-06-15']);
require('../lib/services/sts');
Object.defineProperty(apiLoader.services['sts'], '2011-06-15', {
  get: function get() {
    var model = require('../apis/sts-2011-06-15.min.json');
    return model;
  },
  enumerable: true,
  configurable: true
});

module.exports = AWS.STS;

},{"../apis/sts-2011-06-15.min.json":4,"../lib/api_loader":7,"../lib/core":10,"../lib/node_loader":8,"../lib/service":41,"../lib/services/sts":43}],7:[function(require,module,exports){
var AWS = require('./core');

AWS.apiLoader = function(svc, version) {
  if (!AWS.apiLoader.services.hasOwnProperty(svc)) {
    throw new Error('InvalidService: Failed to load api for ' + svc);
  }
  return AWS.apiLoader.services[svc][version];
};

AWS.apiLoader.services = {};

module.exports = AWS.apiLoader;
},{"./core":10}],8:[function(require,module,exports){
(function (process){
var util = require('./util');

util.crypto.lib = require('crypto-browserify');
util.Buffer = require('buffer/').Buffer;
util.url = require('url/');
util.querystring = require('querystring/');

var AWS = require('./core');

require('./api_loader');

AWS.XML.Parser = require('./xml/browser_parser');

require('./http/xhr');

if (typeof process === 'undefined') {
  process = {
    browser: true
  };
}
}).call(this,require('_process'))
},{"./api_loader":7,"./core":10,"./http/xhr":19,"./util":52,"./xml/browser_parser":53,"_process":117,"buffer/":58,"crypto-browserify":60,"querystring/":124,"url/":125}],9:[function(require,module,exports){
var AWS = require('./core');
require('./credentials');
require('./credentials/credential_provider_chain');
var PromisesDependency;


AWS.Config = AWS.util.inherit({



  constructor: function Config(options) {
    if (options === undefined) options = {};
    options = this.extractCredentials(options);

    AWS.util.each.call(this, this.keys, function (key, value) {
      this.set(key, options[key], value);
    });
  },




  getCredentials: function getCredentials(callback) {
    var self = this;

    function finish(err) {
      callback(err, err ? null : self.credentials);
    }

    function credError(msg, err) {
      return new AWS.util.error(err || new Error(), {
        code: 'CredentialsError', message: msg
      });
    }

    function getAsyncCredentials() {
      self.credentials.get(function(err) {
        if (err) {
          var msg = 'Could not load credentials from ' +
            self.credentials.constructor.name;
          err = credError(msg, err);
        }
        finish(err);
      });
    }

    function getStaticCredentials() {
      var err = null;
      if (!self.credentials.accessKeyId || !self.credentials.secretAccessKey) {
        err = credError('Missing credentials');
      }
      finish(err);
    }

    if (self.credentials) {
      if (typeof self.credentials.get === 'function') {
        getAsyncCredentials();
      } else { // static credentials
        getStaticCredentials();
      }
    } else if (self.credentialProvider) {
      self.credentialProvider.resolve(function(err, creds) {
        if (err) {
          err = credError('Could not load credentials from any providers', err);
        }
        self.credentials = creds;
        finish(err);
      });
    } else {
      finish(credError('No credentials to load'));
    }
  },




  update: function update(options, allowUnknownKeys) {
    allowUnknownKeys = allowUnknownKeys || false;
    options = this.extractCredentials(options);
    AWS.util.each.call(this, options, function (key, value) {
      if (allowUnknownKeys || Object.prototype.hasOwnProperty.call(this.keys, key) ||
          AWS.Service.hasService(key)) {
        this.set(key, value);
      }
    });
  },


  loadFromPath: function loadFromPath(path) {
    this.clear();

    var options = JSON.parse(AWS.util.readFileSync(path));
    var fileSystemCreds = new AWS.FileSystemCredentials(path);
    var chain = new AWS.CredentialProviderChain();
    chain.providers.unshift(fileSystemCreds);
    chain.resolve(function (err, creds) {
      if (err) throw err;
      else options.credentials = creds;
    });

    this.constructor(options);

    return this;
  },


  clear: function clear() {

    AWS.util.each.call(this, this.keys, function (key) {
      delete this[key];
    });

    this.set('credentials', undefined);
    this.set('credentialProvider', undefined);
  },


  set: function set(property, value, defaultValue) {
    if (value === undefined) {
      if (defaultValue === undefined) {
        defaultValue = this.keys[property];
      }
      if (typeof defaultValue === 'function') {
        this[property] = defaultValue.call(this);
      } else {
        this[property] = defaultValue;
      }
    } else if (property === 'httpOptions' && this[property]) {
      this[property] = AWS.util.merge(this[property], value);
    } else {
      this[property] = value;
    }
  },


  keys: {
    credentials: null,
    credentialProvider: null,
    region: null,
    logger: null,
    apiVersions: {},
    apiVersion: null,
    endpoint: undefined,
    httpOptions: {
      timeout: 120000
    },
    maxRetries: undefined,
    maxRedirects: 10,
    paramValidation: true,
    sslEnabled: true,
    s3ForcePathStyle: false,
    s3BucketEndpoint: false,
    s3DisableBodySigning: true,
    computeChecksums: true,
    convertResponseTypes: true,
    correctClockSkew: false,
    customUserAgent: null,
    dynamoDbCrc32: true,
    systemClockOffset: 0,
    signatureVersion: null,
    signatureCache: true,
    retryDelayOptions: {
      base: 100
    },
    useAccelerateEndpoint: false
  },


  extractCredentials: function extractCredentials(options) {
    if (options.accessKeyId && options.secretAccessKey) {
      options = AWS.util.copy(options);
      options.credentials = new AWS.Credentials(options);
    }
    return options;
  },


  setPromisesDependency: function setPromisesDependency(dep) {
    PromisesDependency = dep;
    var constructors = [AWS.Request, AWS.Credentials, AWS.CredentialProviderChain];
    if (AWS.S3 && AWS.S3.ManagedUpload) constructors.push(AWS.S3.ManagedUpload);
    AWS.util.addPromises(constructors, dep);
  },


  getPromisesDependency: function getPromisesDependency() {
    return PromisesDependency;
  }
});


AWS.config = new AWS.Config();

},{"./core":10,"./credentials":11,"./credentials/credential_provider_chain":13}],10:[function(require,module,exports){

var AWS = { util: require('./util') };


var _hidden = {}; _hidden.toString(); // hack to parse macro

module.exports = AWS;

AWS.util.update(AWS, {


  VERSION: '2.7.0',


  Signers: {},


  Protocol: {
    Json: require('./protocol/json'),
    Query: require('./protocol/query'),
    Rest: require('./protocol/rest'),
    RestJson: require('./protocol/rest_json'),
    RestXml: require('./protocol/rest_xml')
  },


  XML: {
    Builder: require('./xml/builder'),
    Parser: null // conditionally set based on environment
  },


  JSON: {
    Builder: require('./json/builder'),
    Parser: require('./json/parser')
  },


  Model: {
    Api: require('./model/api'),
    Operation: require('./model/operation'),
    Shape: require('./model/shape'),
    Paginator: require('./model/paginator'),
    ResourceWaiter: require('./model/resource_waiter')
  },

  util: require('./util'),


  apiLoader: function() { throw new Error('No API loader set'); }
});

require('./service');

require('./credentials');
require('./credentials/credential_provider_chain');
require('./credentials/temporary_credentials');
require('./credentials/web_identity_credentials');
require('./credentials/cognito_identity_credentials');
require('./credentials/saml_credentials');

require('./config');
require('./http');
require('./sequential_executor');
require('./event_listeners');
require('./request');
require('./response');
require('./resource_waiter');
require('./signers/request_signer');
require('./param_validator');


AWS.events = new AWS.SequentialExecutor();

},{"./config":9,"./credentials":11,"./credentials/cognito_identity_credentials":12,"./credentials/credential_provider_chain":13,"./credentials/saml_credentials":14,"./credentials/temporary_credentials":15,"./credentials/web_identity_credentials":16,"./event_listeners":17,"./http":18,"./json/builder":20,"./json/parser":21,"./model/api":22,"./model/operation":24,"./model/paginator":25,"./model/resource_waiter":26,"./model/shape":27,"./param_validator":28,"./protocol/json":29,"./protocol/query":30,"./protocol/rest":31,"./protocol/rest_json":32,"./protocol/rest_xml":33,"./request":37,"./resource_waiter":38,"./response":39,"./sequential_executor":40,"./service":41,"./signers/request_signer":45,"./util":52,"./xml/builder":54}],11:[function(require,module,exports){
var AWS = require('./core');


AWS.Credentials = AWS.util.inherit({

  constructor: function Credentials() {
    AWS.util.hideProperties(this, ['secretAccessKey']);

    this.expired = false;
    this.expireTime = null;
    if (arguments.length === 1 && typeof arguments[0] === 'object') {
      var creds = arguments[0].credentials || arguments[0];
      this.accessKeyId = creds.accessKeyId;
      this.secretAccessKey = creds.secretAccessKey;
      this.sessionToken = creds.sessionToken;
    } else {
      this.accessKeyId = arguments[0];
      this.secretAccessKey = arguments[1];
      this.sessionToken = arguments[2];
    }
  },


  expiryWindow: 15,


  needsRefresh: function needsRefresh() {
    var currentTime = AWS.util.date.getDate().getTime();
    var adjustedTime = new Date(currentTime + this.expiryWindow * 1000);

    if (this.expireTime && adjustedTime > this.expireTime) {
      return true;
    } else {
      return this.expired || !this.accessKeyId || !this.secretAccessKey;
    }
  },


  get: function get(callback) {
    var self = this;
    if (this.needsRefresh()) {
      this.refresh(function(err) {
        if (!err) self.expired = false; // reset expired flag
        if (callback) callback(err);
      });
    } else if (callback) {
      callback();
    }
  },






  refresh: function refresh(callback) {
    this.expired = false;
    callback();
  }
});


AWS.Credentials.addPromisesToClass = function addPromisesToClass(PromiseDependency) {
  this.prototype.getPromise = AWS.util.promisifyMethod('get', PromiseDependency);
  this.prototype.refreshPromise = AWS.util.promisifyMethod('refresh', PromiseDependency);
};


AWS.Credentials.deletePromisesFromClass = function deletePromisesFromClass() {
  delete this.prototype.getPromise;
  delete this.prototype.refreshPromise;
};

AWS.util.addPromises(AWS.Credentials);

},{"./core":10}],12:[function(require,module,exports){
var AWS = require('../core');
var CognitoIdentity = require('../../clients/cognitoidentity');
var STS = require('../../clients/sts');


AWS.CognitoIdentityCredentials = AWS.util.inherit(AWS.Credentials, {

  localStorageKey: {
    id: 'aws.cognito.identity-id.',
    providers: 'aws.cognito.identity-providers.'
  },


  constructor: function CognitoIdentityCredentials(params) {
    AWS.Credentials.call(this);
    this.expired = true;
    this.params = params;
    this.data = null;
    this.identityId = null;
    this.loadCachedId();
  },


  refresh: function refresh(callback) {
    var self = this;
    self.createClients();
    self.data = null;
    self.identityId = null;
    self.getId(function(err) {
      if (!err) {
        if (!self.params.RoleArn) {
          self.getCredentialsForIdentity(callback);
        } else {
          self.getCredentialsFromSTS(callback);
        }
      } else {
        self.clearIdOnNotAuthorized(err);
        callback(err);
      }
    });
  },


  clearCachedId: function clearCache() {
    this.identityId = null;
    delete this.params.IdentityId;

    var poolId = this.params.IdentityPoolId;
    var loginId = this.params.LoginId || '';
    delete this.storage[this.localStorageKey.id + poolId + loginId];
    delete this.storage[this.localStorageKey.providers + poolId + loginId];
  },


  clearIdOnNotAuthorized: function clearIdOnNotAuthorized(err) {
    var self = this;
    if (err.code == 'NotAuthorizedException') {
      self.clearCachedId();
    }
  },


  getId: function getId(callback) {
    var self = this;
    if (typeof self.params.IdentityId === 'string') {
      return callback(null, self.params.IdentityId);
    }

    self.cognito.getId(function(err, data) {
      if (!err && data.IdentityId) {
        self.params.IdentityId = data.IdentityId;
        callback(null, data.IdentityId);
      } else {
        callback(err);
      }
    });
  },



  loadCredentials: function loadCredentials(data, credentials) {
    if (!data || !credentials) return;
    credentials.expired = false;
    credentials.accessKeyId = data.Credentials.AccessKeyId;
    credentials.secretAccessKey = data.Credentials.SecretKey;
    credentials.sessionToken = data.Credentials.SessionToken;
    credentials.expireTime = data.Credentials.Expiration;
  },


  getCredentialsForIdentity: function getCredentialsForIdentity(callback) {
    var self = this;
    self.cognito.getCredentialsForIdentity(function(err, data) {
      if (!err) {
        self.cacheId(data);
        self.data = data;
        self.loadCredentials(self.data, self);
      } else {
        self.clearIdOnNotAuthorized(err);
      }
      callback(err);
    });
  },


  getCredentialsFromSTS: function getCredentialsFromSTS(callback) {
    var self = this;
    self.cognito.getOpenIdToken(function(err, data) {
      if (!err) {
        self.cacheId(data);
        self.params.WebIdentityToken = data.Token;
        self.webIdentityCredentials.refresh(function(webErr) {
          if (!webErr) {
            self.data = self.webIdentityCredentials.data;
            self.sts.credentialsFrom(self.data, self);
          }
          callback(webErr);
        });
      } else {
        self.clearIdOnNotAuthorized(err);
        callback(err);
      }
    });
  },


  loadCachedId: function loadCachedId() {
    var self = this;

    if (AWS.util.isBrowser() && !self.params.IdentityId) {
      var id = self.getStorage('id');
      if (id && self.params.Logins) {
        var actualProviders = Object.keys(self.params.Logins);
        var cachedProviders =
          (self.getStorage('providers') || '').split(',');

        var intersect = cachedProviders.filter(function(n) {
          return actualProviders.indexOf(n) !== -1;
        });
        if (intersect.length !== 0) {
          self.params.IdentityId = id;
        }
      } else if (id) {
        self.params.IdentityId = id;
      }
    }
  },


  createClients: function() {
    this.webIdentityCredentials = this.webIdentityCredentials ||
      new AWS.WebIdentityCredentials(this.params);
    this.cognito = this.cognito ||
      new CognitoIdentity({params: this.params});
    this.sts = this.sts || new STS();
  },


  cacheId: function cacheId(data) {
    this.identityId = data.IdentityId;
    this.params.IdentityId = this.identityId;

    if (AWS.util.isBrowser()) {
      this.setStorage('id', data.IdentityId);

      if (this.params.Logins) {
        this.setStorage('providers', Object.keys(this.params.Logins).join(','));
      }
    }
  },


  getStorage: function getStorage(key) {
    return this.storage[this.localStorageKey[key] + this.params.IdentityPoolId + (this.params.LoginId || '')];
  },


  setStorage: function setStorage(key, val) {
    try {
      this.storage[this.localStorageKey[key] + this.params.IdentityPoolId + (this.params.LoginId || '')] = val;
    } catch (_) {}
  },


  storage: (function() {
    try {
      return AWS.util.isBrowser() && window.localStorage !== null && typeof window.localStorage === 'object' ?
             window.localStorage : {};
    } catch (_) {
      return {};
    }
  })()
});

},{"../../clients/cognitoidentity":5,"../../clients/sts":6,"../core":10}],13:[function(require,module,exports){
var AWS = require('../core');


AWS.CredentialProviderChain = AWS.util.inherit(AWS.Credentials, {


  constructor: function CredentialProviderChain(providers) {
    if (providers) {
      this.providers = providers;
    } else {
      this.providers = AWS.CredentialProviderChain.defaultProviders.slice(0);
    }
  },




  resolve: function resolve(callback) {
    if (this.providers.length === 0) {
      callback(new Error('No providers'));
      return this;
    }

    var index = 0;
    var providers = this.providers.slice(0);

    function resolveNext(err, creds) {
      if ((!err && creds) || index === providers.length) {
        callback(err, creds);
        return;
      }

      var provider = providers[index++];
      if (typeof provider === 'function') {
        creds = provider.call();
      } else {
        creds = provider;
      }

      if (creds.get) {
        creds.get(function(getErr) {
          resolveNext(getErr, getErr ? null : creds);
        });
      } else {
        resolveNext(null, creds);
      }
    }

    resolveNext();
    return this;
  }
});


AWS.CredentialProviderChain.defaultProviders = [];


AWS.CredentialProviderChain.addPromisesToClass = function addPromisesToClass(PromiseDependency) {
  this.prototype.resolvePromise = AWS.util.promisifyMethod('resolve', PromiseDependency);
};


AWS.CredentialProviderChain.deletePromisesFromClass = function deletePromisesFromClass() {
  delete this.prototype.resolvePromise;
};

AWS.util.addPromises(AWS.CredentialProviderChain);

},{"../core":10}],14:[function(require,module,exports){
var AWS = require('../core');
var STS = require('../../clients/sts');


AWS.SAMLCredentials = AWS.util.inherit(AWS.Credentials, {

  constructor: function SAMLCredentials(params) {
    AWS.Credentials.call(this);
    this.expired = true;
    this.params = params;
  },


  refresh: function refresh(callback) {
    var self = this;
    self.createClients();
    if (!callback) callback = function(err) { if (err) throw err; };

    self.service.assumeRoleWithSAML(function (err, data) {
      if (!err) {
        self.service.credentialsFrom(data, self);
      }
      callback(err);
    });
  },


  createClients: function() {
    this.service = this.service || new STS({params: this.params});
  }

});

},{"../../clients/sts":6,"../core":10}],15:[function(require,module,exports){
var AWS = require('../core');
var STS = require('../../clients/sts');


AWS.TemporaryCredentials = AWS.util.inherit(AWS.Credentials, {

  constructor: function TemporaryCredentials(params) {
    AWS.Credentials.call(this);
    this.loadMasterCredentials();
    this.expired = true;

    this.params = params || {};
    if (this.params.RoleArn) {
      this.params.RoleSessionName =
        this.params.RoleSessionName || 'temporary-credentials';
    }
  },


  refresh: function refresh(callback) {
    var self = this;
    self.createClients();
    if (!callback) callback = function(err) { if (err) throw err; };

    self.service.config.credentials = self.masterCredentials;
    var operation = self.params.RoleArn ?
      self.service.assumeRole : self.service.getSessionToken;
    operation.call(self.service, function (err, data) {
      if (!err) {
        self.service.credentialsFrom(data, self);
      }
      callback(err);
    });
  },


  loadMasterCredentials: function loadMasterCredentials() {
    this.masterCredentials = AWS.config.credentials;
    while (this.masterCredentials.masterCredentials) {
      this.masterCredentials = this.masterCredentials.masterCredentials;
    }
  },


  createClients: function() {
    this.service = this.service || new STS({params: this.params});
  }

});

},{"../../clients/sts":6,"../core":10}],16:[function(require,module,exports){
var AWS = require('../core');
var STS = require('../../clients/sts');


AWS.WebIdentityCredentials = AWS.util.inherit(AWS.Credentials, {

  constructor: function WebIdentityCredentials(params) {
    AWS.Credentials.call(this);
    this.expired = true;
    this.params = params;
    this.params.RoleSessionName = this.params.RoleSessionName || 'web-identity';
    this.data = null;
  },


  refresh: function refresh(callback) {
    var self = this;
    self.createClients();
    if (!callback) callback = function(err) { if (err) throw err; };

    self.service.assumeRoleWithWebIdentity(function (err, data) {
      self.data = null;
      if (!err) {
        self.data = data;
        self.service.credentialsFrom(data, self);
      }
      callback(err);
    });
  },


  createClients: function() {
    this.service = this.service || new STS({params: this.params});
  }

});

},{"../../clients/sts":6,"../core":10}],17:[function(require,module,exports){
var AWS = require('./core');
var SequentialExecutor = require('./sequential_executor');


AWS.EventListeners = {

  Core: {} /* doc hack */
};

AWS.EventListeners = {
  Core: new SequentialExecutor().addNamedListeners(function(add, addAsync) {
    addAsync('VALIDATE_CREDENTIALS', 'validate',
        function VALIDATE_CREDENTIALS(req, done) {
      if (!req.service.api.signatureVersion) return done(); // none
      req.service.config.getCredentials(function(err) {
        if (err) {
          req.response.error = AWS.util.error(err,
            {code: 'CredentialsError', message: 'Missing credentials in config'});
        }
        done();
      });
    });

    add('VALIDATE_REGION', 'validate', function VALIDATE_REGION(req) {
      if (!req.service.config.region && !req.service.isGlobalEndpoint) {
        req.response.error = AWS.util.error(new Error(),
          {code: 'ConfigError', message: 'Missing region in config'});
      }
    });

    add('VALIDATE_PARAMETERS', 'validate', function VALIDATE_PARAMETERS(req) {
      var rules = req.service.api.operations[req.operation].input;
      var validation = req.service.config.paramValidation;
      new AWS.ParamValidator(validation).validate(rules, req.params);
    });

    addAsync('COMPUTE_SHA256', 'afterBuild', function COMPUTE_SHA256(req, done) {
      req.haltHandlersOnError();
      if (!req.service.api.signatureVersion) return done(); // none
      if (req.service.getSignerClass(req) === AWS.Signers.V4) {
        var body = req.httpRequest.body || '';
        AWS.util.computeSha256(body, function(err, sha) {
          if (err) {
            done(err);
          }
          else {
            req.httpRequest.headers['X-Amz-Content-Sha256'] = sha;
            done();
          }
        });
      } else {
        done();
      }
    });

    add('SET_CONTENT_LENGTH', 'afterBuild', function SET_CONTENT_LENGTH(req) {
      if (req.httpRequest.headers['Content-Length'] === undefined) {
        var length = AWS.util.string.byteLength(req.httpRequest.body);
        req.httpRequest.headers['Content-Length'] = length;
      }
    });

    add('SET_HTTP_HOST', 'afterBuild', function SET_HTTP_HOST(req) {
      req.httpRequest.headers['Host'] = req.httpRequest.endpoint.host;
    });

    add('RESTART', 'restart', function RESTART() {
      var err = this.response.error;
      if (!err || !err.retryable) return;

      this.httpRequest = new AWS.HttpRequest(
        this.service.endpoint,
        this.service.region
      );

      if (this.response.retryCount < this.service.config.maxRetries) {
        this.response.retryCount++;
      } else {
        this.response.error = null;
      }
    });

    addAsync('SIGN', 'sign', function SIGN(req, done) {
      var service = req.service;
      if (!service.api.signatureVersion) return done(); // none

      service.config.getCredentials(function (err, credentials) {
        if (err) {
          req.response.error = err;
          return done();
        }

        try {
          var date = AWS.util.date.getDate();
          var SignerClass = service.getSignerClass(req);
          var signer = new SignerClass(req.httpRequest,
            service.api.signingName || service.api.endpointPrefix,
           service.config.signatureCache);
          signer.setServiceClientId(service._clientId);

          delete req.httpRequest.headers['Authorization'];
          delete req.httpRequest.headers['Date'];
          delete req.httpRequest.headers['X-Amz-Date'];

          signer.addAuthorization(credentials, date);
          req.signedAt = date;
        } catch (e) {
          req.response.error = e;
        }
        done();
      });
    });

    add('VALIDATE_RESPONSE', 'validateResponse', function VALIDATE_RESPONSE(resp) {
      if (this.service.successfulResponse(resp, this)) {
        resp.data = {};
        resp.error = null;
      } else {
        resp.data = null;
        resp.error = AWS.util.error(new Error(),
          {code: 'UnknownError', message: 'An unknown error occurred.'});
      }
    });

    addAsync('SEND', 'send', function SEND(resp, done) {
      resp.httpResponse._abortCallback = done;
      resp.error = null;
      resp.data = null;

      function callback(httpResp) {
        resp.httpResponse.stream = httpResp;

        httpResp.on('headers', function onHeaders(statusCode, headers) {
          resp.request.emit('httpHeaders', [statusCode, headers, resp]);

          if (!resp.httpResponse.streaming) {
            if (AWS.HttpClient.streamsApiVersion === 2) { // streams2 API check
              httpResp.on('readable', function onReadable() {
                var data = httpResp.read();
                if (data !== null) {
                  resp.request.emit('httpData', [data, resp]);
                }
              });
            } else { // legacy streams API
              httpResp.on('data', function onData(data) {
                resp.request.emit('httpData', [data, resp]);
              });
            }
          }
        });

        httpResp.on('end', function onEnd() {
          resp.request.emit('httpDone');
          done();
        });
      }

      function progress(httpResp) {
        httpResp.on('sendProgress', function onSendProgress(value) {
          resp.request.emit('httpUploadProgress', [value, resp]);
        });

        httpResp.on('receiveProgress', function onReceiveProgress(value) {
          resp.request.emit('httpDownloadProgress', [value, resp]);
        });
      }

      function error(err) {
        resp.error = AWS.util.error(err, {
          code: 'NetworkingError',
          region: resp.request.httpRequest.region,
          hostname: resp.request.httpRequest.endpoint.hostname,
          retryable: true
        });
        resp.request.emit('httpError', [resp.error, resp], function() {
          done();
        });
      }

      function executeSend() {
        var http = AWS.HttpClient.getInstance();
        var httpOptions = resp.request.service.config.httpOptions || {};
        try {
          var stream = http.handleRequest(resp.request.httpRequest, httpOptions,
                                          callback, error);
          progress(stream);
        } catch (err) {
          error(err);
        }
      }

      var timeDiff = (AWS.util.date.getDate() - this.signedAt) / 1000;
      if (timeDiff >= 60 * 10) { // if we signed 10min ago, re-sign
        this.emit('sign', [this], function(err) {
          if (err) done(err);
          else executeSend();
        });
      } else {
        executeSend();
      }
    });

    add('HTTP_HEADERS', 'httpHeaders',
        function HTTP_HEADERS(statusCode, headers, resp) {
      resp.httpResponse.statusCode = statusCode;
      resp.httpResponse.headers = headers;
      resp.httpResponse.body = new AWS.util.Buffer('');
      resp.httpResponse.buffers = [];
      resp.httpResponse.numBytes = 0;
      var dateHeader = headers.date || headers.Date;
      if (dateHeader) {
        var serverTime = Date.parse(dateHeader);
        if (resp.request.service.config.correctClockSkew
            && AWS.util.isClockSkewed(serverTime)) {
          AWS.util.applyClockOffset(serverTime);
        }
      }
    });

    add('HTTP_DATA', 'httpData', function HTTP_DATA(chunk, resp) {
      if (chunk) {
        if (AWS.util.isNode()) {
          resp.httpResponse.numBytes += chunk.length;

          var total = resp.httpResponse.headers['content-length'];
          var progress = { loaded: resp.httpResponse.numBytes, total: total };
          resp.request.emit('httpDownloadProgress', [progress, resp]);
        }

        resp.httpResponse.buffers.push(new AWS.util.Buffer(chunk));
      }
    });

    add('HTTP_DONE', 'httpDone', function HTTP_DONE(resp) {
      if (resp.httpResponse.buffers && resp.httpResponse.buffers.length > 0) {
        var body = AWS.util.buffer.concat(resp.httpResponse.buffers);
        resp.httpResponse.body = body;
      }
      delete resp.httpResponse.numBytes;
      delete resp.httpResponse.buffers;
    });

    add('FINALIZE_ERROR', 'retry', function FINALIZE_ERROR(resp) {
      if (resp.httpResponse.statusCode) {
        resp.error.statusCode = resp.httpResponse.statusCode;
        if (resp.error.retryable === undefined) {
          resp.error.retryable = this.service.retryableError(resp.error, this);
        }
      }
    });

    add('INVALIDATE_CREDENTIALS', 'retry', function INVALIDATE_CREDENTIALS(resp) {
      if (!resp.error) return;
      switch (resp.error.code) {
        case 'RequestExpired': // EC2 only
        case 'ExpiredTokenException':
        case 'ExpiredToken':
          resp.error.retryable = true;
          resp.request.service.config.credentials.expired = true;
      }
    });

    add('EXPIRED_SIGNATURE', 'retry', function EXPIRED_SIGNATURE(resp) {
      var err = resp.error;
      if (!err) return;
      if (typeof err.code === 'string' && typeof err.message === 'string') {
        if (err.code.match(/Signature/) && err.message.match(/expired/)) {
          resp.error.retryable = true;
        }
      }
    });

    add('CLOCK_SKEWED', 'retry', function CLOCK_SKEWED(resp) {
      if (!resp.error) return;
      if (this.service.clockSkewError(resp.error)
          && this.service.config.correctClockSkew
          && AWS.config.isClockSkewed) {
        resp.error.retryable = true;
      }
    });

    add('REDIRECT', 'retry', function REDIRECT(resp) {
      if (resp.error && resp.error.statusCode >= 300 &&
          resp.error.statusCode < 400 && resp.httpResponse.headers['location']) {
        this.httpRequest.endpoint =
          new AWS.Endpoint(resp.httpResponse.headers['location']);
        this.httpRequest.headers['Host'] = this.httpRequest.endpoint.host;
        resp.error.redirect = true;
        resp.error.retryable = true;
      }
    });

    add('RETRY_CHECK', 'retry', function RETRY_CHECK(resp) {
      if (resp.error) {
        if (resp.error.redirect && resp.redirectCount < resp.maxRedirects) {
          resp.error.retryDelay = 0;
        } else if (resp.retryCount < resp.maxRetries) {
          resp.error.retryDelay = this.service.retryDelays(resp.retryCount) || 0;
        }
      }
    });

    addAsync('RESET_RETRY_STATE', 'afterRetry', function RESET_RETRY_STATE(resp, done) {
      var delay, willRetry = false;

      if (resp.error) {
        delay = resp.error.retryDelay || 0;
        if (resp.error.retryable && resp.retryCount < resp.maxRetries) {
          resp.retryCount++;
          willRetry = true;
        } else if (resp.error.redirect && resp.redirectCount < resp.maxRedirects) {
          resp.redirectCount++;
          willRetry = true;
        }
      }

      if (willRetry) {
        resp.error = null;
        setTimeout(done, delay);
      } else {
        done();
      }
    });
  }),

  CorePost: new SequentialExecutor().addNamedListeners(function(add) {
    add('EXTRACT_REQUEST_ID', 'extractData', AWS.util.extractRequestId);
    add('EXTRACT_REQUEST_ID', 'extractError', AWS.util.extractRequestId);

    add('ENOTFOUND_ERROR', 'httpError', function ENOTFOUND_ERROR(err) {
      if (err.code === 'NetworkingError' && err.errno === 'ENOTFOUND') {
        var message = 'Inaccessible host: `' + err.hostname +
          '\'. This service may not be available in the `' + err.region +
          '\' region.';
        this.response.error = AWS.util.error(new Error(message), {
          code: 'UnknownEndpoint',
          region: err.region,
          hostname: err.hostname,
          retryable: true,
          originalError: err
        });
      }
    });
  }),

  Logger: new SequentialExecutor().addNamedListeners(function(add) {
    add('LOG_REQUEST', 'complete', function LOG_REQUEST(resp) {
      var req = resp.request;
      var logger = req.service.config.logger;
      if (!logger) return;

      function buildMessage() {
        var time = AWS.util.date.getDate().getTime();
        var delta = (time - req.startTime.getTime()) / 1000;
        var ansi = logger.isTTY ? true : false;
        var status = resp.httpResponse.statusCode;
        var params = require('util').inspect(req.params, true, null);

        var message = '';
        if (ansi) message += '\x1B[33m';
        message += '[AWS ' + req.service.serviceIdentifier + ' ' + status;
        message += ' ' + delta.toString() + 's ' + resp.retryCount + ' retries]';
        if (ansi) message += '\x1B[0;1m';
        message += ' ' + AWS.util.string.lowerFirst(req.operation);
        message += '(' + params + ')';
        if (ansi) message += '\x1B[0m';
        return message;
      }

      var line = buildMessage();
      if (typeof logger.log === 'function') {
        logger.log(line);
      } else if (typeof logger.write === 'function') {
        logger.write(line + '\n');
      }
    });
  }),

  Json: new SequentialExecutor().addNamedListeners(function(add) {
    var svc = require('./protocol/json');
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  }),

  Rest: new SequentialExecutor().addNamedListeners(function(add) {
    var svc = require('./protocol/rest');
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  }),

  RestJson: new SequentialExecutor().addNamedListeners(function(add) {
    var svc = require('./protocol/rest_json');
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  }),

  RestXml: new SequentialExecutor().addNamedListeners(function(add) {
    var svc = require('./protocol/rest_xml');
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  }),

  Query: new SequentialExecutor().addNamedListeners(function(add) {
    var svc = require('./protocol/query');
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  })
};

},{"./core":10,"./protocol/json":29,"./protocol/query":30,"./protocol/rest":31,"./protocol/rest_json":32,"./protocol/rest_xml":33,"./sequential_executor":40,"util":128}],18:[function(require,module,exports){
var AWS = require('./core');
var inherit = AWS.util.inherit;


AWS.Endpoint = inherit({


  constructor: function Endpoint(endpoint, config) {
    AWS.util.hideProperties(this, ['slashes', 'auth', 'hash', 'search', 'query']);

    if (typeof endpoint === 'undefined' || endpoint === null) {
      throw new Error('Invalid endpoint: ' + endpoint);
    } else if (typeof endpoint !== 'string') {
      return AWS.util.copy(endpoint);
    }

    if (!endpoint.match(/^http/)) {
      var useSSL = config && config.sslEnabled !== undefined ?
        config.sslEnabled : AWS.config.sslEnabled;
      endpoint = (useSSL ? 'https' : 'http') + '://' + endpoint;
    }

    AWS.util.update(this, AWS.util.urlParse(endpoint));

    if (this.port) {
      this.port = parseInt(this.port, 10);
    } else {
      this.port = this.protocol === 'https:' ? 443 : 80;
    }
  }

});


AWS.HttpRequest = inherit({


  constructor: function HttpRequest(endpoint, region, customUserAgent) {
    endpoint = new AWS.Endpoint(endpoint);
    this.method = 'POST';
    this.path = endpoint.path || '/';
    this.headers = {};
    this.body = '';
    this.endpoint = endpoint;
    this.region = region;
    this.setUserAgent(customUserAgent);
  },


  setUserAgent: function setUserAgent(customUserAgent) {
    var prefix = AWS.util.isBrowser() ? 'X-Amz-' : '';
    var customSuffix = '';
    if (typeof customUserAgent === 'string' && customUserAgent) {
      customSuffix += ' ' + customUserAgent;
    }
    this.headers[prefix + 'User-Agent'] = AWS.util.userAgent() + customSuffix;
  },


  pathname: function pathname() {
    return this.path.split('?', 1)[0];
  },


  search: function search() {
    var query = this.path.split('?', 2)[1];
    if (query) {
      query = AWS.util.queryStringParse(query);
      return AWS.util.queryParamsToString(query);
    }
    return '';
  }

});


AWS.HttpResponse = inherit({


  constructor: function HttpResponse() {
    this.statusCode = undefined;
    this.headers = {};
    this.body = undefined;
    this.streaming = false;
    this.stream = null;
  },


  createUnbufferedStream: function createUnbufferedStream() {
    this.streaming = true;
    return this.stream;
  }
});


AWS.HttpClient = inherit({});


AWS.HttpClient.getInstance = function getInstance() {
  if (this.singleton === undefined) {
    this.singleton = new this();
  }
  return this.singleton;
};

},{"./core":10}],19:[function(require,module,exports){
var AWS = require('../core');
var EventEmitter = require('events').EventEmitter;
require('../http');


AWS.XHRClient = AWS.util.inherit({
  handleRequest: function handleRequest(httpRequest, httpOptions, callback, errCallback) {
    var self = this;
    var endpoint = httpRequest.endpoint;
    var emitter = new EventEmitter();
    var href = endpoint.protocol + '//' + endpoint.hostname;
    if (endpoint.port !== 80 && endpoint.port !== 443) {
      href += ':' + endpoint.port;
    }
    href += httpRequest.path;

    var xhr = new XMLHttpRequest(), headersEmitted = false;
    httpRequest.stream = xhr;

    xhr.addEventListener('readystatechange', function() {
      try {
        if (xhr.status === 0) return; // 0 code is invalid
      } catch (e) { return; }

      if (this.readyState >= this.HEADERS_RECEIVED && !headersEmitted) {
        try { xhr.responseType = 'arraybuffer'; } catch (e) {}
        emitter.statusCode = xhr.status;
        emitter.headers = self.parseHeaders(xhr.getAllResponseHeaders());
        emitter.emit('headers', emitter.statusCode, emitter.headers);
        headersEmitted = true;
      }
      if (this.readyState === this.DONE) {
        self.finishRequest(xhr, emitter);
      }
    }, false);
    xhr.upload.addEventListener('progress', function (evt) {
      emitter.emit('sendProgress', evt);
    });
    xhr.addEventListener('progress', function (evt) {
      emitter.emit('receiveProgress', evt);
    }, false);
    xhr.addEventListener('timeout', function () {
      errCallback(AWS.util.error(new Error('Timeout'), {code: 'TimeoutError'}));
    }, false);
    xhr.addEventListener('error', function () {
      errCallback(AWS.util.error(new Error('Network Failure'), {
        code: 'NetworkingError'
      }));
    }, false);
    /** BEGIN HOT-FIX: DO NOT REMOVE https://issues.amazon.com/issues/JS-358 */
    xhr.addEventListener('abort', function () {
      errCallback(AWS.util.error(new Error('Connection aborted'), {
        code: 'RequestAborted'
      }));
    }, false);
    /** END */

    callback(emitter);
    xhr.open(httpRequest.method, href, httpOptions.xhrAsync !== false);
    AWS.util.each(httpRequest.headers, function (key, value) {
      if (key !== 'Content-Length' && key !== 'User-Agent' && key !== 'Host') {
        xhr.setRequestHeader(key, value);
      }
    });

    if (httpOptions.timeout && httpOptions.xhrAsync !== false) {
      xhr.timeout = httpOptions.timeout;
    }

    if (httpOptions.xhrWithCredentials) {
      xhr.withCredentials = true;
    }

    try {
      xhr.send(httpRequest.body);
    } catch (err) {
      if (httpRequest.body && typeof httpRequest.body.buffer === 'object') {
        xhr.send(httpRequest.body.buffer); // send ArrayBuffer directly
      } else {
        throw err;
      }
    }

    return emitter;
  },

  parseHeaders: function parseHeaders(rawHeaders) {
    var headers = {};
    AWS.util.arrayEach(rawHeaders.split(/\r?\n/), function (line) {
      var key = line.split(':', 1)[0];
      var value = line.substring(key.length + 2);
      if (key.length > 0) headers[key.toLowerCase()] = value;
    });
    return headers;
  },

  finishRequest: function finishRequest(xhr, emitter) {
    var buffer;
    if (xhr.responseType === 'arraybuffer' && xhr.response) {
      var ab = xhr.response;
      buffer = new AWS.util.Buffer(ab.byteLength);
      var view = new Uint8Array(ab);
      for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
      }
    }

    try {
      if (!buffer && typeof xhr.responseText === 'string') {
        buffer = new AWS.util.Buffer(xhr.responseText);
      }
    } catch (e) {}

    if (buffer) emitter.emit('data', buffer);
    emitter.emit('end');
  }
});


AWS.HttpClient.prototype = AWS.XHRClient.prototype;


AWS.HttpClient.streamsApiVersion = 1;

},{"../core":10,"../http":18,"events":65}],20:[function(require,module,exports){
var util = require('../util');

function JsonBuilder() { }

JsonBuilder.prototype.build = function(value, shape) {
  return JSON.stringify(translate(value, shape));
};

function translate(value, shape) {
  if (!shape || value === undefined || value === null) return undefined;

  switch (shape.type) {
    case 'structure': return translateStructure(value, shape);
    case 'map': return translateMap(value, shape);
    case 'list': return translateList(value, shape);
    default: return translateScalar(value, shape);
  }
}

function translateStructure(structure, shape) {
  var struct = {};
  util.each(structure, function(name, value) {
    var memberShape = shape.members[name];
    if (memberShape) {
      if (memberShape.location !== 'body') return;
      var locationName = memberShape.isLocationName ? memberShape.name : name;
      var result = translate(value, memberShape);
      if (result !== undefined) struct[locationName] = result;
    }
  });
  return struct;
}

function translateList(list, shape) {
  var out = [];
  util.arrayEach(list, function(value) {
    var result = translate(value, shape.member);
    if (result !== undefined) out.push(result);
  });
  return out;
}

function translateMap(map, shape) {
  var out = {};
  util.each(map, function(key, value) {
    var result = translate(value, shape.value);
    if (result !== undefined) out[key] = result;
  });
  return out;
}

function translateScalar(value, shape) {
  return shape.toWireFormat(value);
}

module.exports = JsonBuilder;

},{"../util":52}],21:[function(require,module,exports){
var util = require('../util');

function JsonParser() { }

JsonParser.prototype.parse = function(value, shape) {
  return translate(JSON.parse(value), shape);
};

function translate(value, shape) {
  if (!shape || value === undefined) return undefined;

  switch (shape.type) {
    case 'structure': return translateStructure(value, shape);
    case 'map': return translateMap(value, shape);
    case 'list': return translateList(value, shape);
    default: return translateScalar(value, shape);
  }
}

function translateStructure(structure, shape) {
  if (structure == null) return undefined;

  var struct = {};
  var shapeMembers = shape.members;
  util.each(shapeMembers, function(name, memberShape) {
    var locationName = memberShape.isLocationName ? memberShape.name : name;
    if (Object.prototype.hasOwnProperty.call(structure, locationName)) {
      var value = structure[locationName];
      var result = translate(value, memberShape);
      if (result !== undefined) struct[name] = result;
    }
  });
  return struct;
}

function translateList(list, shape) {
  if (list == null) return undefined;

  var out = [];
  util.arrayEach(list, function(value) {
    var result = translate(value, shape.member);
    if (result === undefined) out.push(null);
    else out.push(result);
  });
  return out;
}

function translateMap(map, shape) {
  if (map == null) return undefined;

  var out = {};
  util.each(map, function(key, value) {
    var result = translate(value, shape.value);
    if (result === undefined) out[key] = null;
    else out[key] = result;
  });
  return out;
}

function translateScalar(value, shape) {
  return shape.toType(value);
}

module.exports = JsonParser;

},{"../util":52}],22:[function(require,module,exports){
var Collection = require('./collection');
var Operation = require('./operation');
var Shape = require('./shape');
var Paginator = require('./paginator');
var ResourceWaiter = require('./resource_waiter');

var util = require('../util');
var property = util.property;
var memoizedProperty = util.memoizedProperty;

function Api(api, options) {
  api = api || {};
  options = options || {};
  options.api = this;

  api.metadata = api.metadata || {};

  property(this, 'isApi', true, false);
  property(this, 'apiVersion', api.metadata.apiVersion);
  property(this, 'endpointPrefix', api.metadata.endpointPrefix);
  property(this, 'signingName', api.metadata.signingName);
  property(this, 'globalEndpoint', api.metadata.globalEndpoint);
  property(this, 'signatureVersion', api.metadata.signatureVersion);
  property(this, 'jsonVersion', api.metadata.jsonVersion);
  property(this, 'targetPrefix', api.metadata.targetPrefix);
  property(this, 'protocol', api.metadata.protocol);
  property(this, 'timestampFormat', api.metadata.timestampFormat);
  property(this, 'xmlNamespaceUri', api.metadata.xmlNamespace);
  property(this, 'abbreviation', api.metadata.serviceAbbreviation);
  property(this, 'fullName', api.metadata.serviceFullName);

  memoizedProperty(this, 'className', function() {
    var name = api.metadata.serviceAbbreviation || api.metadata.serviceFullName;
    if (!name) return null;

    name = name.replace(/^Amazon|AWS\s*|\(.*|\s+|\W+/g, '');
    if (name === 'ElasticLoadBalancing') name = 'ELB';
    return name;
  });

  property(this, 'operations', new Collection(api.operations, options, function(name, operation) {
    return new Operation(name, operation, options);
  }, util.string.lowerFirst));

  property(this, 'shapes', new Collection(api.shapes, options, function(name, shape) {
    return Shape.create(shape, options);
  }));

  property(this, 'paginators', new Collection(api.paginators, options, function(name, paginator) {
    return new Paginator(name, paginator, options);
  }));

  property(this, 'waiters', new Collection(api.waiters, options, function(name, waiter) {
    return new ResourceWaiter(name, waiter, options);
  }, util.string.lowerFirst));

  if (options.documentation) {
    property(this, 'documentation', api.documentation);
    property(this, 'documentationUrl', api.documentationUrl);
  }
}

module.exports = Api;

},{"../util":52,"./collection":23,"./operation":24,"./paginator":25,"./resource_waiter":26,"./shape":27}],23:[function(require,module,exports){
var memoizedProperty = require('../util').memoizedProperty;

function memoize(name, value, fn, nameTr) {
  memoizedProperty(this, nameTr(name), function() {
    return fn(name, value);
  });
}

function Collection(iterable, options, fn, nameTr) {
  nameTr = nameTr || String;
  var self = this;

  for (var id in iterable) {
    if (Object.prototype.hasOwnProperty.call(iterable, id)) {
      memoize.call(self, id, iterable[id], fn, nameTr);
    }
  }
}

module.exports = Collection;

},{"../util":52}],24:[function(require,module,exports){
var Shape = require('./shape');

var util = require('../util');
var property = util.property;
var memoizedProperty = util.memoizedProperty;

function Operation(name, operation, options) {
  options = options || {};

  property(this, 'name', operation.name || name);
  property(this, 'api', options.api, false);

  operation.http = operation.http || {};
  property(this, 'httpMethod', operation.http.method || 'POST');
  property(this, 'httpPath', operation.http.requestUri || '/');
  property(this, 'authtype', operation.authtype || '');

  memoizedProperty(this, 'input', function() {
    if (!operation.input) {
      return new Shape.create({type: 'structure'}, options);
    }
    return Shape.create(operation.input, options);
  });

  memoizedProperty(this, 'output', function() {
    if (!operation.output) {
      return new Shape.create({type: 'structure'}, options);
    }
    return Shape.create(operation.output, options);
  });

  memoizedProperty(this, 'errors', function() {
    var list = [];
    if (!operation.errors) return null;

    for (var i = 0; i < operation.errors.length; i++) {
      list.push(Shape.create(operation.errors[i], options));
    }

    return list;
  });

  memoizedProperty(this, 'paginator', function() {
    return options.api.paginators[name];
  });

  if (options.documentation) {
    property(this, 'documentation', operation.documentation);
    property(this, 'documentationUrl', operation.documentationUrl);
  }
}

module.exports = Operation;

},{"../util":52,"./shape":27}],25:[function(require,module,exports){
var property = require('../util').property;

function Paginator(name, paginator) {
  property(this, 'inputToken', paginator.input_token);
  property(this, 'limitKey', paginator.limit_key);
  property(this, 'moreResults', paginator.more_results);
  property(this, 'outputToken', paginator.output_token);
  property(this, 'resultKey', paginator.result_key);
}

module.exports = Paginator;

},{"../util":52}],26:[function(require,module,exports){
var util = require('../util');
var property = util.property;

function ResourceWaiter(name, waiter, options) {
  options = options || {};
  property(this, 'name', name);
  property(this, 'api', options.api, false);

  if (waiter.operation) {
    property(this, 'operation', util.string.lowerFirst(waiter.operation));
  }

  var self = this;
  var keys = [
    'type',
    'description',
    'delay',
    'maxAttempts',
    'acceptors'
  ];

  keys.forEach(function(key) {
    var value = waiter[key];
    if (value) {
      property(self, key, value);
    }
  });
}

module.exports = ResourceWaiter;

},{"../util":52}],27:[function(require,module,exports){
var Collection = require('./collection');

var util = require('../util');

function property(obj, name, value) {
  if (value !== null && value !== undefined) {
    util.property.apply(this, arguments);
  }
}

function memoizedProperty(obj, name) {
  if (!obj.constructor.prototype[name]) {
    util.memoizedProperty.apply(this, arguments);
  }
}

function Shape(shape, options, memberName) {
  options = options || {};

  property(this, 'shape', shape.shape);
  property(this, 'api', options.api, false);
  property(this, 'type', shape.type);
  property(this, 'enum', shape.enum);
  property(this, 'min', shape.min);
  property(this, 'max', shape.max);
  property(this, 'pattern', shape.pattern);
  property(this, 'location', shape.location || this.location || 'body');
  property(this, 'name', this.name || shape.xmlName || shape.queryName ||
    shape.locationName || memberName);
  property(this, 'isStreaming', shape.streaming || this.isStreaming || false);
  property(this, 'isComposite', shape.isComposite || false);
  property(this, 'isShape', true, false);
  property(this, 'isQueryName', shape.queryName ? true : false, false);
  property(this, 'isLocationName', shape.locationName ? true : false, false);

  if (options.documentation) {
    property(this, 'documentation', shape.documentation);
    property(this, 'documentationUrl', shape.documentationUrl);
  }

  if (shape.xmlAttribute) {
    property(this, 'isXmlAttribute', shape.xmlAttribute || false);
  }

  property(this, 'defaultValue', null);
  this.toWireFormat = function(value) {
    if (value === null || value === undefined) return '';
    return value;
  };
  this.toType = function(value) { return value; };
}


Shape.normalizedTypes = {
  character: 'string',
  double: 'float',
  long: 'integer',
  short: 'integer',
  biginteger: 'integer',
  bigdecimal: 'float',
  blob: 'binary'
};


Shape.types = {
  'structure': StructureShape,
  'list': ListShape,
  'map': MapShape,
  'boolean': BooleanShape,
  'timestamp': TimestampShape,
  'float': FloatShape,
  'integer': IntegerShape,
  'string': StringShape,
  'base64': Base64Shape,
  'binary': BinaryShape
};

Shape.resolve = function resolve(shape, options) {
  if (shape.shape) {
    var refShape = options.api.shapes[shape.shape];
    if (!refShape) {
      throw new Error('Cannot find shape reference: ' + shape.shape);
    }

    return refShape;
  } else {
    return null;
  }
};

Shape.create = function create(shape, options, memberName) {
  if (shape.isShape) return shape;

  var refShape = Shape.resolve(shape, options);
  if (refShape) {
    var filteredKeys = Object.keys(shape);
    if (!options.documentation) {
      filteredKeys = filteredKeys.filter(function(name) {
        return !name.match(/documentation/);
      });
    }
    if (filteredKeys === ['shape']) { // no inline customizations
      return refShape;
    }

    var InlineShape = function() {
      refShape.constructor.call(this, shape, options, memberName);
    };
    InlineShape.prototype = refShape;
    return new InlineShape();
  } else {
    if (!shape.type) {
      if (shape.members) shape.type = 'structure';
      else if (shape.member) shape.type = 'list';
      else if (shape.key) shape.type = 'map';
      else shape.type = 'string';
    }

    var origType = shape.type;
    if (Shape.normalizedTypes[shape.type]) {
      shape.type = Shape.normalizedTypes[shape.type];
    }

    if (Shape.types[shape.type]) {
      return new Shape.types[shape.type](shape, options, memberName);
    } else {
      throw new Error('Unrecognized shape type: ' + origType);
    }
  }
};

function CompositeShape(shape) {
  Shape.apply(this, arguments);
  property(this, 'isComposite', true);

  if (shape.flattened) {
    property(this, 'flattened', shape.flattened || false);
  }
}

function StructureShape(shape, options) {
  var requiredMap = null, firstInit = !this.isShape;

  CompositeShape.apply(this, arguments);

  if (firstInit) {
    property(this, 'defaultValue', function() { return {}; });
    property(this, 'members', {});
    property(this, 'memberNames', []);
    property(this, 'required', []);
    property(this, 'isRequired', function() { return false; });
  }

  if (shape.members) {
    property(this, 'members', new Collection(shape.members, options, function(name, member) {
      return Shape.create(member, options, name);
    }));
    memoizedProperty(this, 'memberNames', function() {
      return shape.xmlOrder || Object.keys(shape.members);
    });
  }

  if (shape.required) {
    property(this, 'required', shape.required);
    property(this, 'isRequired', function(name) {
      if (!requiredMap) {
        requiredMap = {};
        for (var i = 0; i < shape.required.length; i++) {
          requiredMap[shape.required[i]] = true;
        }
      }

      return requiredMap[name];
    }, false, true);
  }

  property(this, 'resultWrapper', shape.resultWrapper || null);

  if (shape.payload) {
    property(this, 'payload', shape.payload);
  }

  if (typeof shape.xmlNamespace === 'string') {
    property(this, 'xmlNamespaceUri', shape.xmlNamespace);
  } else if (typeof shape.xmlNamespace === 'object') {
    property(this, 'xmlNamespacePrefix', shape.xmlNamespace.prefix);
    property(this, 'xmlNamespaceUri', shape.xmlNamespace.uri);
  }
}

function ListShape(shape, options) {
  var self = this, firstInit = !this.isShape;
  CompositeShape.apply(this, arguments);

  if (firstInit) {
    property(this, 'defaultValue', function() { return []; });
  }

  if (shape.member) {
    memoizedProperty(this, 'member', function() {
      return Shape.create(shape.member, options);
    });
  }

  if (this.flattened) {
    var oldName = this.name;
    memoizedProperty(this, 'name', function() {
      return self.member.name || oldName;
    });
  }
}

function MapShape(shape, options) {
  var firstInit = !this.isShape;
  CompositeShape.apply(this, arguments);

  if (firstInit) {
    property(this, 'defaultValue', function() { return {}; });
    property(this, 'key', Shape.create({type: 'string'}, options));
    property(this, 'value', Shape.create({type: 'string'}, options));
  }

  if (shape.key) {
    memoizedProperty(this, 'key', function() {
      return Shape.create(shape.key, options);
    });
  }
  if (shape.value) {
    memoizedProperty(this, 'value', function() {
      return Shape.create(shape.value, options);
    });
  }
}

function TimestampShape(shape) {
  var self = this;
  Shape.apply(this, arguments);

  if (this.location === 'header') {
    property(this, 'timestampFormat', 'rfc822');
  } else if (shape.timestampFormat) {
    property(this, 'timestampFormat', shape.timestampFormat);
  } else if (this.api) {
    if (this.api.timestampFormat) {
      property(this, 'timestampFormat', this.api.timestampFormat);
    } else {
      switch (this.api.protocol) {
        case 'json':
        case 'rest-json':
          property(this, 'timestampFormat', 'unixTimestamp');
          break;
        case 'rest-xml':
        case 'query':
        case 'ec2':
          property(this, 'timestampFormat', 'iso8601');
          break;
      }
    }
  }

  this.toType = function(value) {
    if (value === null || value === undefined) return null;
    if (typeof value.toUTCString === 'function') return value;
    return typeof value === 'string' || typeof value === 'number' ?
           util.date.parseTimestamp(value) : null;
  };

  this.toWireFormat = function(value) {
    return util.date.format(value, self.timestampFormat);
  };
}

function StringShape() {
  Shape.apply(this, arguments);

  if (this.api) {
    switch (this.api.protocol) {
      case 'rest-xml':
      case 'query':
      case 'ec2':
        this.toType = function(value) { return value || ''; };
    }
  }
}

function FloatShape() {
  Shape.apply(this, arguments);

  this.toType = function(value) {
    if (value === null || value === undefined) return null;
    return parseFloat(value);
  };
  this.toWireFormat = this.toType;
}

function IntegerShape() {
  Shape.apply(this, arguments);

  this.toType = function(value) {
    if (value === null || value === undefined) return null;
    return parseInt(value, 10);
  };
  this.toWireFormat = this.toType;
}

function BinaryShape() {
  Shape.apply(this, arguments);
  this.toType = util.base64.decode;
  this.toWireFormat = util.base64.encode;
}

function Base64Shape() {
  BinaryShape.apply(this, arguments);
}

function BooleanShape() {
  Shape.apply(this, arguments);

  this.toType = function(value) {
    if (typeof value === 'boolean') return value;
    if (value === null || value === undefined) return null;
    return value === 'true';
  };
}


Shape.shapes = {
  StructureShape: StructureShape,
  ListShape: ListShape,
  MapShape: MapShape,
  StringShape: StringShape,
  BooleanShape: BooleanShape,
  Base64Shape: Base64Shape
};

module.exports = Shape;

},{"../util":52,"./collection":23}],28:[function(require,module,exports){
var AWS = require('./core');


AWS.ParamValidator = AWS.util.inherit({

  constructor: function ParamValidator(validation) {
    if (validation === true || validation === undefined) {
      validation = {'min': true};
    }
    this.validation = validation;
  },

  validate: function validate(shape, params, context) {
    this.errors = [];
    this.validateMember(shape, params || {}, context || 'params');

    if (this.errors.length > 1) {
      var msg = this.errors.join('\n* ');
      msg = 'There were ' + this.errors.length +
        ' validation errors:\n* ' + msg;
      throw AWS.util.error(new Error(msg),
        {code: 'MultipleValidationErrors', errors: this.errors});
    } else if (this.errors.length === 1) {
      throw this.errors[0];
    } else {
      return true;
    }
  },

  fail: function fail(code, message) {
    this.errors.push(AWS.util.error(new Error(message), {code: code}));
  },

  validateStructure: function validateStructure(shape, params, context) {
    this.validateType(params, context, ['object'], 'structure');

    var paramName;
    for (var i = 0; shape.required && i < shape.required.length; i++) {
      paramName = shape.required[i];
      var value = params[paramName];
      if (value === undefined || value === null) {
        this.fail('MissingRequiredParameter',
          'Missing required key \'' + paramName + '\' in ' + context);
      }
    }

    for (paramName in params) {
      if (!Object.prototype.hasOwnProperty.call(params, paramName)) continue;

      var paramValue = params[paramName],
          memberShape = shape.members[paramName];

      if (memberShape !== undefined) {
        var memberContext = [context, paramName].join('.');
        this.validateMember(memberShape, paramValue, memberContext);
      } else {
        this.fail('UnexpectedParameter',
          'Unexpected key \'' + paramName + '\' found in ' + context);
      }
    }

    return true;
  },

  validateMember: function validateMember(shape, param, context) {
    switch (shape.type) {
      case 'structure':
        return this.validateStructure(shape, param, context);
      case 'list':
        return this.validateList(shape, param, context);
      case 'map':
        return this.validateMap(shape, param, context);
      default:
        return this.validateScalar(shape, param, context);
    }
  },

  validateList: function validateList(shape, params, context) {
    if (this.validateType(params, context, [Array])) {
      this.validateRange(shape, params.length, context, 'list member count');
      for (var i = 0; i < params.length; i++) {
        this.validateMember(shape.member, params[i], context + '[' + i + ']');
      }
    }
  },

  validateMap: function validateMap(shape, params, context) {
    if (this.validateType(params, context, ['object'], 'map')) {
      var mapCount = 0;
      for (var param in params) {
        if (!Object.prototype.hasOwnProperty.call(params, param)) continue;
        this.validateMember(shape.key, param,
                            context + '[key=\'' + param + '\']')
        this.validateMember(shape.value, params[param],
                            context + '[\'' + param + '\']');
        mapCount++;
      }
      this.validateRange(shape, mapCount, context, 'map member count');
    }
  },

  validateScalar: function validateScalar(shape, value, context) {
    switch (shape.type) {
      case null:
      case undefined:
      case 'string':
        return this.validateString(shape, value, context);
      case 'base64':
      case 'binary':
        return this.validatePayload(value, context);
      case 'integer':
      case 'float':
        return this.validateNumber(shape, value, context);
      case 'boolean':
        return this.validateType(value, context, ['boolean']);
      case 'timestamp':
        return this.validateType(value, context, [Date,
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, 'number'],
          'Date object, ISO-8601 string, or a UNIX timestamp');
      default:
        return this.fail('UnkownType', 'Unhandled type ' +
                         shape.type + ' for ' + context);
    }
  },

  validateString: function validateString(shape, value, context) {
    if (this.validateType(value, context, ['string'])) {
      this.validateEnum(shape, value, context);
      this.validateRange(shape, value.length, context, 'string length');
      this.validatePattern(shape, value, context);
    }
  },

  validatePattern: function validatePattern(shape, value, context) {
    if (this.validation['pattern'] && shape['pattern'] !== undefined) {
      if (!(new RegExp(shape['pattern'])).test(value)) {
        this.fail('PatternMatchError', 'Provided value "' + value + '" '
          + 'does not match regex pattern /' + shape['pattern'] + '/ for '
          + context);
      }
    }
  },

  validateRange: function validateRange(shape, value, context, descriptor) {
    if (this.validation['min']) {
      if (shape['min'] !== undefined && value < shape['min']) {
        this.fail('MinRangeError', 'Expected ' + descriptor + ' >= '
          + shape['min'] + ', but found ' + value + ' for ' + context);
      }
    }
    if (this.validation['max']) {
      if (shape['max'] !== undefined && value > shape['max']) {
        this.fail('MaxRangeError', 'Expected ' + descriptor + ' <= '
          + shape['max'] + ', but found ' + value + ' for ' + context);
      }
    }
  },

  validateEnum: function validateRange(shape, value, context) {
    if (this.validation['enum'] && shape['enum'] !== undefined) {
      if (shape['enum'].indexOf(value) === -1) {
        this.fail('EnumError', 'Found string value of ' + value + ', but '
          + 'expected ' + shape['enum'].join('|') + ' for ' + context);
      }
    }
  },

  validateType: function validateType(value, context, acceptedTypes, type) {
    if (value === null || value === undefined) return false;

    var foundInvalidType = false;
    for (var i = 0; i < acceptedTypes.length; i++) {
      if (typeof acceptedTypes[i] === 'string') {
        if (typeof value === acceptedTypes[i]) return true;
      } else if (acceptedTypes[i] instanceof RegExp) {
        if ((value || '').toString().match(acceptedTypes[i])) return true;
      } else {
        if (value instanceof acceptedTypes[i]) return true;
        if (AWS.util.isType(value, acceptedTypes[i])) return true;
        if (!type && !foundInvalidType) acceptedTypes = acceptedTypes.slice();
        acceptedTypes[i] = AWS.util.typeName(acceptedTypes[i]);
      }
      foundInvalidType = true;
    }

    var acceptedType = type;
    if (!acceptedType) {
      acceptedType = acceptedTypes.join(', ').replace(/,([^,]+)$/, ', or$1');
    }

    var vowel = acceptedType.match(/^[aeiou]/i) ? 'n' : '';
    this.fail('InvalidParameterType', 'Expected ' + context + ' to be a' +
              vowel + ' ' + acceptedType);
    return false;
  },

  validateNumber: function validateNumber(shape, value, context) {
    if (value === null || value === undefined) return;
    if (typeof value === 'string') {
      var castedValue = parseFloat(value);
      if (castedValue.toString() === value) value = castedValue;
    }
    if (this.validateType(value, context, ['number'])) {
      this.validateRange(shape, value, context, 'numeric value');
    }
  },

  validatePayload: function validatePayload(value, context) {
    if (value === null || value === undefined) return;
    if (typeof value === 'string') return;
    if (value && typeof value.byteLength === 'number') return; // typed arrays
    if (AWS.util.isNode()) { // special check for buffer/stream in Node.js
      var Stream = AWS.util.stream.Stream;
      if (AWS.util.Buffer.isBuffer(value) || value instanceof Stream) return;
    }

    var types = ['Buffer', 'Stream', 'File', 'Blob', 'ArrayBuffer', 'DataView'];
    if (value) {
      for (var i = 0; i < types.length; i++) {
        if (AWS.util.isType(value, types[i])) return;
        if (AWS.util.typeName(value.constructor) === types[i]) return;
      }
    }

    this.fail('InvalidParameterType', 'Expected ' + context + ' to be a ' +
      'string, Buffer, Stream, Blob, or typed array object');
  }
});

},{"./core":10}],29:[function(require,module,exports){
var util = require('../util');
var JsonBuilder = require('../json/builder');
var JsonParser = require('../json/parser');

function buildRequest(req) {
  var httpRequest = req.httpRequest;
  var api = req.service.api;
  var target = api.targetPrefix + '.' + api.operations[req.operation].name;
  var version = api.jsonVersion || '1.0';
  var input = api.operations[req.operation].input;
  var builder = new JsonBuilder();

  if (version === 1) version = '1.0';
  httpRequest.body = builder.build(req.params || {}, input);
  httpRequest.headers['Content-Type'] = 'application/x-amz-json-' + version;
  httpRequest.headers['X-Amz-Target'] = target;
}

function extractError(resp) {
  var error = {};
  var httpResponse = resp.httpResponse;

  error.code = httpResponse.headers['x-amzn-errortype'] || 'UnknownError';
  if (typeof error.code === 'string') {
    error.code = error.code.split(':')[0];
  }

  if (httpResponse.body.length > 0) {
    var e = JSON.parse(httpResponse.body.toString());
    if (e.__type || e.code) {
      error.code = (e.__type || e.code).split('#').pop();
    }
    if (error.code === 'RequestEntityTooLarge') {
      error.message = 'Request body must be less than 1 MB';
    } else {
      error.message = (e.message || e.Message || null);
    }
  } else {
    error.statusCode = httpResponse.statusCode;
    error.message = httpResponse.statusCode.toString();
  }

  resp.error = util.error(new Error(), error);
}

function extractData(resp) {
  var body = resp.httpResponse.body.toString() || '{}';
  if (resp.request.service.config.convertResponseTypes === false) {
    resp.data = JSON.parse(body);
  } else {
    var operation = resp.request.service.api.operations[resp.request.operation];
    var shape = operation.output || {};
    var parser = new JsonParser();
    resp.data = parser.parse(body, shape);
  }
}

module.exports = {
  buildRequest: buildRequest,
  extractError: extractError,
  extractData: extractData
};

},{"../json/builder":20,"../json/parser":21,"../util":52}],30:[function(require,module,exports){
var AWS = require('../core');
var util = require('../util');
var QueryParamSerializer = require('../query/query_param_serializer');
var Shape = require('../model/shape');

function buildRequest(req) {
  var operation = req.service.api.operations[req.operation];
  var httpRequest = req.httpRequest;
  httpRequest.headers['Content-Type'] =
    'application/x-www-form-urlencoded; charset=utf-8';
  httpRequest.params = {
    Version: req.service.api.apiVersion,
    Action: operation.name
  };

  var builder = new QueryParamSerializer();
  builder.serialize(req.params, operation.input, function(name, value) {
    httpRequest.params[name] = value;
  });
  httpRequest.body = util.queryParamsToString(httpRequest.params);
}

function extractError(resp) {
  var data, body = resp.httpResponse.body.toString();
  if (body.match('<UnknownOperationException')) {
    data = {
      Code: 'UnknownOperation',
      Message: 'Unknown operation ' + resp.request.operation
    };
  } else {
    data = new AWS.XML.Parser().parse(body);
  }

  if (data.requestId && !resp.requestId) resp.requestId = data.requestId;
  if (data.Errors) data = data.Errors;
  if (data.Error) data = data.Error;
  if (data.Code) {
    resp.error = util.error(new Error(), {
      code: data.Code,
      message: data.Message
    });
  } else {
    resp.error = util.error(new Error(), {
      code: resp.httpResponse.statusCode,
      message: null
    });
  }
}

function extractData(resp) {
  var req = resp.request;
  var operation = req.service.api.operations[req.operation];
  var shape = operation.output || {};
  var origRules = shape;

  if (origRules.resultWrapper) {
    var tmp = Shape.create({type: 'structure'});
    tmp.members[origRules.resultWrapper] = shape;
    tmp.memberNames = [origRules.resultWrapper];
    util.property(shape, 'name', shape.resultWrapper);
    shape = tmp;
  }

  var parser = new AWS.XML.Parser();

  if (shape && shape.members && !shape.members._XAMZRequestId) {
    var requestIdShape = Shape.create(
      { type: 'string' },
      { api: { protocol: 'query' } },
      'requestId'
    );
    shape.members._XAMZRequestId = requestIdShape;
  }

  var data = parser.parse(resp.httpResponse.body.toString(), shape);
  resp.requestId = data._XAMZRequestId || data.requestId;

  if (data._XAMZRequestId) delete data._XAMZRequestId;

  if (origRules.resultWrapper) {
    if (data[origRules.resultWrapper]) {
      util.update(data, data[origRules.resultWrapper]);
      delete data[origRules.resultWrapper];
    }
  }

  resp.data = data;
}

module.exports = {
  buildRequest: buildRequest,
  extractError: extractError,
  extractData: extractData
};

},{"../core":10,"../model/shape":27,"../query/query_param_serializer":34,"../util":52}],31:[function(require,module,exports){
var util = require('../util');

function populateMethod(req) {
  req.httpRequest.method = req.service.api.operations[req.operation].httpMethod;
}

function populateURI(req) {
  var operation = req.service.api.operations[req.operation];
  var input = operation.input;
  var uri = [req.httpRequest.endpoint.path, operation.httpPath].join('/');
  uri = uri.replace(/\/+/g, '/');

  var queryString = {}, queryStringSet = false;
  util.each(input.members, function (name, member) {
    var paramValue = req.params[name];
    if (paramValue === null || paramValue === undefined) return;
    if (member.location === 'uri') {
      var regex = new RegExp('\\{' + member.name + '(\\+)?\\}');
      uri = uri.replace(regex, function(_, plus) {
        var fn = plus ? util.uriEscapePath : util.uriEscape;
        return fn(String(paramValue));
      });
    } else if (member.location === 'querystring') {
      queryStringSet = true;

      if (member.type === 'list') {
        queryString[member.name] = paramValue.map(function(val) {
          return util.uriEscape(String(val));
        });
      } else if (member.type === 'map') {
        util.each(paramValue, function(key, value) {
          if (Array.isArray(value)) {
            queryString[key] = value.map(function(val) {
              return util.uriEscape(String(val));
            });
          } else {
            queryString[key] = util.uriEscape(String(value));
          }
        });
      } else {
        queryString[member.name] = util.uriEscape(String(paramValue));
      }
    }
  });

  if (queryStringSet) {
    uri += (uri.indexOf('?') >= 0 ? '&' : '?');
    var parts = [];
    util.arrayEach(Object.keys(queryString).sort(), function(key) {
      if (!Array.isArray(queryString[key])) {
        queryString[key] = [queryString[key]];
      }
      for (var i = 0; i < queryString[key].length; i++) {
        parts.push(util.uriEscape(String(key)) + '=' + queryString[key][i]);
      }
    });
    uri += parts.join('&');
  }

  req.httpRequest.path = uri;
}

function populateHeaders(req) {
  var operation = req.service.api.operations[req.operation];
  util.each(operation.input.members, function (name, member) {
    var value = req.params[name];
    if (value === null || value === undefined) return;

    if (member.location === 'headers' && member.type === 'map') {
      util.each(value, function(key, memberValue) {
        req.httpRequest.headers[member.name + key] = memberValue;
      });
    } else if (member.location === 'header') {
      value = member.toWireFormat(value).toString();
      req.httpRequest.headers[member.name] = value;
    }
  });
}

function buildRequest(req) {
  populateMethod(req);
  populateURI(req);
  populateHeaders(req);
}

function extractError() {
}

function extractData(resp) {
  var req = resp.request;
  var data = {};
  var r = resp.httpResponse;
  var operation = req.service.api.operations[req.operation];
  var output = operation.output;

  var headers = {};
  util.each(r.headers, function (k, v) {
    headers[k.toLowerCase()] = v;
  });

  util.each(output.members, function(name, member) {
    var header = (member.name || name).toLowerCase();
    if (member.location === 'headers' && member.type === 'map') {
      data[name] = {};
      var location = member.isLocationName ? member.name : '';
      var pattern = new RegExp('^' + location + '(.+)', 'i');
      util.each(r.headers, function (k, v) {
        var result = k.match(pattern);
        if (result !== null) {
          data[name][result[1]] = v;
        }
      });
    } else if (member.location === 'header') {
      if (headers[header] !== undefined) {
        data[name] = headers[header];
      }
    } else if (member.location === 'statusCode') {
      data[name] = parseInt(r.statusCode, 10);
    }
  });

  resp.data = data;
}

module.exports = {
  buildRequest: buildRequest,
  extractError: extractError,
  extractData: extractData
};

},{"../util":52}],32:[function(require,module,exports){
var util = require('../util');
var Rest = require('./rest');
var Json = require('./json');
var JsonBuilder = require('../json/builder');
var JsonParser = require('../json/parser');

function populateBody(req) {
  var builder = new JsonBuilder();
  var input = req.service.api.operations[req.operation].input;

  if (input.payload) {
    var params = {};
    var payloadShape = input.members[input.payload];
    params = req.params[input.payload];
    if (params === undefined) return;

    if (payloadShape.type === 'structure') {
      req.httpRequest.body = builder.build(params, payloadShape);
    } else { // non-JSON payload
      req.httpRequest.body = params;
    }
  } else {
    req.httpRequest.body = builder.build(req.params, input);
  }
}

function buildRequest(req) {
  Rest.buildRequest(req);

  if (['GET', 'HEAD', 'DELETE'].indexOf(req.httpRequest.method) < 0) {
    populateBody(req);
  }
}

function extractError(resp) {
  Json.extractError(resp);
}

function extractData(resp) {
  Rest.extractData(resp);

  var req = resp.request;
  var rules = req.service.api.operations[req.operation].output || {};
  if (rules.payload) {
    var payloadMember = rules.members[rules.payload];
    var body = resp.httpResponse.body;
    if (payloadMember.isStreaming) {
      resp.data[rules.payload] = body;
    } else if (payloadMember.type === 'structure' || payloadMember.type === 'list') {
      var parser = new JsonParser();
      resp.data[rules.payload] = parser.parse(body, payloadMember);
    } else {
      resp.data[rules.payload] = body.toString();
    }
  } else {
    var data = resp.data;
    Json.extractData(resp);
    resp.data = util.merge(data, resp.data);
  }
}

module.exports = {
  buildRequest: buildRequest,
  extractError: extractError,
  extractData: extractData
};

},{"../json/builder":20,"../json/parser":21,"../util":52,"./json":29,"./rest":31}],33:[function(require,module,exports){
var AWS = require('../core');
var util = require('../util');
var Rest = require('./rest');

function populateBody(req) {
  var input = req.service.api.operations[req.operation].input;
  var builder = new AWS.XML.Builder();
  var params = req.params;

  var payload = input.payload;
  if (payload) {
    var payloadMember = input.members[payload];
    params = params[payload];
    if (params === undefined) return;

    if (payloadMember.type === 'structure') {
      var rootElement = payloadMember.name;
      req.httpRequest.body = builder.toXML(params, payloadMember, rootElement, true);
    } else { // non-xml payload
      req.httpRequest.body = params;
    }
  } else {
    req.httpRequest.body = builder.toXML(params, input, input.name ||
      input.shape || util.string.upperFirst(req.operation) + 'Request');
  }
}

function buildRequest(req) {
  Rest.buildRequest(req);

  if (['GET', 'HEAD'].indexOf(req.httpRequest.method) < 0) {
    populateBody(req);
  }
}

function extractError(resp) {
  Rest.extractError(resp);

  var data = new AWS.XML.Parser().parse(resp.httpResponse.body.toString());
  if (data.Errors) data = data.Errors;
  if (data.Error) data = data.Error;
  if (data.Code) {
    resp.error = util.error(new Error(), {
      code: data.Code,
      message: data.Message
    });
  } else {
    resp.error = util.error(new Error(), {
      code: resp.httpResponse.statusCode,
      message: null
    });
  }
}

function extractData(resp) {
  Rest.extractData(resp);

  var parser;
  var req = resp.request;
  var body = resp.httpResponse.body;
  var operation = req.service.api.operations[req.operation];
  var output = operation.output;

  var payload = output.payload;
  if (payload) {
    var payloadMember = output.members[payload];
    if (payloadMember.isStreaming) {
      resp.data[payload] = body;
    } else if (payloadMember.type === 'structure') {
      parser = new AWS.XML.Parser();
      resp.data[payload] = parser.parse(body.toString(), payloadMember);
    } else {
      resp.data[payload] = body.toString();
    }
  } else if (body.length > 0) {
    parser = new AWS.XML.Parser();
    var data = parser.parse(body.toString(), output);
    util.update(resp.data, data);
  }
}

module.exports = {
  buildRequest: buildRequest,
  extractError: extractError,
  extractData: extractData
};

},{"../core":10,"../util":52,"./rest":31}],34:[function(require,module,exports){
var util = require('../util');

function QueryParamSerializer() {
}

QueryParamSerializer.prototype.serialize = function(params, shape, fn) {
  serializeStructure('', params, shape, fn);
};

function ucfirst(shape) {
  if (shape.isQueryName || shape.api.protocol !== 'ec2') {
    return shape.name;
  } else {
    return shape.name[0].toUpperCase() + shape.name.substr(1);
  }
}

function serializeStructure(prefix, struct, rules, fn) {
  util.each(rules.members, function(name, member) {
    var value = struct[name];
    if (value === null || value === undefined) return;

    var memberName = ucfirst(member);
    memberName = prefix ? prefix + '.' + memberName : memberName;
    serializeMember(memberName, value, member, fn);
  });
}

function serializeMap(name, map, rules, fn) {
  var i = 1;
  util.each(map, function (key, value) {
    var prefix = rules.flattened ? '.' : '.entry.';
    var position = prefix + (i++) + '.';
    var keyName = position + (rules.key.name || 'key');
    var valueName = position + (rules.value.name || 'value');
    serializeMember(name + keyName, key, rules.key, fn);
    serializeMember(name + valueName, value, rules.value, fn);
  });
}

function serializeList(name, list, rules, fn) {
  var memberRules = rules.member || {};

  if (list.length === 0) {
    fn.call(this, name, null);
    return;
  }

  util.arrayEach(list, function (v, n) {
    var suffix = '.' + (n + 1);
    if (rules.api.protocol === 'ec2') {
      suffix = suffix + ''; // make linter happy
    } else if (rules.flattened) {
      if (memberRules.name) {
        var parts = name.split('.');
        parts.pop();
        parts.push(ucfirst(memberRules));
        name = parts.join('.');
      }
    } else {
      suffix = '.member' + suffix;
    }
    serializeMember(name + suffix, v, memberRules, fn);
  });
}

function serializeMember(name, value, rules, fn) {
  if (value === null || value === undefined) return;
  if (rules.type === 'structure') {
    serializeStructure(name, value, rules, fn);
  } else if (rules.type === 'list') {
    serializeList(name, value, rules, fn);
  } else if (rules.type === 'map') {
    serializeMap(name, value, rules, fn);
  } else {
    fn(name, rules.toWireFormat(value).toString());
  }
}

module.exports = QueryParamSerializer;

},{"../util":52}],35:[function(require,module,exports){
module.exports={
  "rules": {
    "*/*": {
      "endpoint": "{service}.{region}.amazonaws.com"
    },
    "cn-*/*": {
      "endpoint": "{service}.{region}.amazonaws.com.cn"
    },
    "*/budgets": "globalSSL",
    "*/cloudfront": "globalSSL",
    "*/iam": "globalSSL",
    "*/sts": "globalSSL",
    "*/importexport": {
      "endpoint": "{service}.amazonaws.com",
      "signatureVersion": "v2",
      "globalEndpoint": true
    },
    "*/route53": {
      "endpoint": "https://{service}.amazonaws.com",
      "signatureVersion": "v3https",
      "globalEndpoint": true
    },
    "*/waf": "globalSSL",
    "us-gov-*/iam": "globalGovCloud",
    "us-gov-*/sts": {
      "endpoint": "{service}.{region}.amazonaws.com"
    },
    "us-gov-west-1/s3": "s3dash",
    "us-west-1/s3": "s3dash",
    "us-west-2/s3": "s3dash",
    "eu-west-1/s3": "s3dash",
    "ap-southeast-1/s3": "s3dash",
    "ap-southeast-2/s3": "s3dash",
    "ap-northeast-1/s3": "s3dash",
    "sa-east-1/s3": "s3dash",
    "us-east-1/s3": {
      "endpoint": "{service}.amazonaws.com",
      "signatureVersion": "s3"
    },
    "us-east-1/sdb": {
      "endpoint": "{service}.amazonaws.com",
      "signatureVersion": "v2"
    },
    "*/sdb": {
      "endpoint": "{service}.{region}.amazonaws.com",
      "signatureVersion": "v2"
    }
  },

  "patterns": {
    "globalSSL": {
      "endpoint": "https://{service}.amazonaws.com",
      "globalEndpoint": true
    },
    "globalGovCloud": {
      "endpoint": "{service}.us-gov.amazonaws.com"
    },
    "s3dash": {
      "endpoint": "{service}-{region}.amazonaws.com",
      "signatureVersion": "s3"
    }
  }
}

},{}],36:[function(require,module,exports){
var util = require('./util');
var regionConfig = require('./region_config.json');

function generateRegionPrefix(region) {
  if (!region) return null;

  var parts = region.split('-');
  if (parts.length < 3) return null;
  return parts.slice(0, parts.length - 2).join('-') + '-*';
}

function derivedKeys(service) {
  var region = service.config.region;
  var regionPrefix = generateRegionPrefix(region);
  var endpointPrefix = service.api.endpointPrefix;

  return [
    [region, endpointPrefix],
    [regionPrefix, endpointPrefix],
    [region, '*'],
    [regionPrefix, '*'],
    ['*', endpointPrefix],
    ['*', '*']
  ].map(function(item) {
    return item[0] && item[1] ? item.join('/') : null;
  });
}

function applyConfig(service, config) {
  util.each(config, function(key, value) {
    if (key === 'globalEndpoint') return;
    if (service.config[key] === undefined || service.config[key] === null) {
      service.config[key] = value;
    }
  });
}

function configureEndpoint(service) {
  var keys = derivedKeys(service);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!key) continue;

    if (Object.prototype.hasOwnProperty.call(regionConfig.rules, key)) {
      var config = regionConfig.rules[key];
      if (typeof config === 'string') {
        config = regionConfig.patterns[config];
      }

      if (service.config.useDualstack && util.isDualstackAvailable(service)) {
        config = util.copy(config);
        config.endpoint = '{service}.dualstack.{region}.amazonaws.com';
      }

      service.isGlobalEndpoint = !!config.globalEndpoint;

      if (!config.signatureVersion) config.signatureVersion = 'v4';

      applyConfig(service, config);
      return;
    }
  }
}

module.exports = configureEndpoint;

},{"./region_config.json":35,"./util":52}],37:[function(require,module,exports){
(function (process){
var AWS = require('./core');
var AcceptorStateMachine = require('./state_machine');
var inherit = AWS.util.inherit;
var domain = AWS.util.domain;
var jmespath = require('jmespath');


var hardErrorStates = {success: 1, error: 1, complete: 1};

function isTerminalState(machine) {
  return Object.prototype.hasOwnProperty.call(hardErrorStates, machine._asm.currentState);
}

var fsm = new AcceptorStateMachine();
fsm.setupStates = function() {
  var transition = function(_, done) {
    var self = this;
    self._haltHandlersOnError = false;

    self.emit(self._asm.currentState, function(err) {
      if (err) {
        if (isTerminalState(self)) {
          if (domain && self.domain instanceof domain.Domain) {
            err.domainEmitter = self;
            err.domain = self.domain;
            err.domainThrown = false;
            self.domain.emit('error', err);
          } else {
            throw err;
          }
        } else {
          self.response.error = err;
          done(err);
        }
      } else {
        done(self.response.error);
      }
    });

  };

  this.addState('validate', 'build', 'error', transition);
  this.addState('build', 'afterBuild', 'restart', transition);
  this.addState('afterBuild', 'sign', 'restart', transition);
  this.addState('sign', 'send', 'retry', transition);
  this.addState('retry', 'afterRetry', 'afterRetry', transition);
  this.addState('afterRetry', 'sign', 'error', transition);
  this.addState('send', 'validateResponse', 'retry', transition);
  this.addState('validateResponse', 'extractData', 'extractError', transition);
  this.addState('extractError', 'extractData', 'retry', transition);
  this.addState('extractData', 'success', 'retry', transition);
  this.addState('restart', 'build', 'error', transition);
  this.addState('success', 'complete', 'complete', transition);
  this.addState('error', 'complete', 'complete', transition);
  this.addState('complete', null, null, transition);
};
fsm.setupStates();


AWS.Request = inherit({


  constructor: function Request(service, operation, params) {
    var endpoint = service.endpoint;
    var region = service.config.region;
    var customUserAgent = service.config.customUserAgent;

    if (service.isGlobalEndpoint) region = 'us-east-1';

    this.domain = domain && domain.active;
    this.service = service;
    this.operation = operation;
    this.params = params || {};
    this.httpRequest = new AWS.HttpRequest(endpoint, region, customUserAgent);
    this.startTime = AWS.util.date.getDate();

    this.response = new AWS.Response(this);
    this._asm = new AcceptorStateMachine(fsm.states, 'validate');
    this._haltHandlersOnError = false;

    AWS.SequentialExecutor.call(this);
    this.emit = this.emitEvent;
  },




  send: function send(callback) {
    if (callback) {
      this.on('complete', function (resp) {
        callback.call(resp, resp.error, resp.data);
      });
    }
    this.runTo();

    return this.response;
  },




  build: function build(callback) {
    return this.runTo('send', callback);
  },


  runTo: function runTo(state, done) {
    this._asm.runTo(state, done, this);
    return this;
  },


  abort: function abort() {
    this.removeAllListeners('validateResponse');
    this.removeAllListeners('extractError');
    this.on('validateResponse', function addAbortedError(resp) {
      resp.error = AWS.util.error(new Error('Request aborted by user'), {
         code: 'RequestAbortedError', retryable: false
      });
    });

    if (this.httpRequest.stream) { // abort HTTP stream
      this.httpRequest.stream.abort();
      if (this.httpRequest._abortCallback) {
         this.httpRequest._abortCallback();
      } else {
        this.removeAllListeners('send'); // haven't sent yet, so let's not
      }
    }

    return this;
  },


  eachPage: function eachPage(callback) {
    callback = AWS.util.fn.makeAsync(callback, 3);

    function wrappedCallback(response) {
      callback.call(response, response.error, response.data, function (result) {
        if (result === false) return;

        if (response.hasNextPage()) {
          response.nextPage().on('complete', wrappedCallback).send();
        } else {
          callback.call(response, null, null, AWS.util.fn.noop);
        }
      });
    }

    this.on('complete', wrappedCallback).send();
  },


  eachItem: function eachItem(callback) {
    var self = this;
    function wrappedCallback(err, data) {
      if (err) return callback(err, null);
      if (data === null) return callback(null, null);

      var config = self.service.paginationConfig(self.operation);
      var resultKey = config.resultKey;
      if (Array.isArray(resultKey)) resultKey = resultKey[0];
      var items = jmespath.search(data, resultKey);
      var continueIteration = true;
      AWS.util.arrayEach(items, function(item) {
        continueIteration = callback(null, item);
        if (continueIteration === false) {
          return AWS.util.abort;
        }
      });
      return continueIteration;
    }

    this.eachPage(wrappedCallback);
  },


  isPageable: function isPageable() {
    return this.service.paginationConfig(this.operation) ? true : false;
  },


  createReadStream: function createReadStream() {
    var streams = AWS.util.stream;
    var req = this;
    var stream = null;

    if (AWS.HttpClient.streamsApiVersion === 2) {
      stream = new streams.PassThrough();
      req.send();
    } else {
      stream = new streams.Stream();
      stream.readable = true;

      stream.sent = false;
      stream.on('newListener', function(event) {
        if (!stream.sent && event === 'data') {
          stream.sent = true;
          process.nextTick(function() { req.send(); });
        }
      });
    }

    this.on('httpHeaders', function streamHeaders(statusCode, headers, resp) {
      if (statusCode < 300) {
        req.removeListener('httpData', AWS.EventListeners.Core.HTTP_DATA);
        req.removeListener('httpError', AWS.EventListeners.Core.HTTP_ERROR);
        req.on('httpError', function streamHttpError(error) {
          resp.error = error;
          resp.error.retryable = false;
        });

        var shouldCheckContentLength = false;
        var expectedLen;
        if (req.httpRequest.method !== 'HEAD') {
          expectedLen = parseInt(headers['content-length'], 10);
        }
        if (expectedLen !== undefined && !isNaN(expectedLen) && expectedLen >= 0) {
          shouldCheckContentLength = true;
          var receivedLen = 0;
        }

        var checkContentLengthAndEmit = function checkContentLengthAndEmit() {
          if (shouldCheckContentLength && receivedLen !== expectedLen) {
            stream.emit('error', AWS.util.error(
              new Error('Stream content length mismatch. Received ' +
                receivedLen + ' of ' + expectedLen + ' bytes.'),
              { code: 'StreamContentLengthMismatch' }
            ));
          } else if (AWS.HttpClient.streamsApiVersion === 2) {
            stream.end();
          } else {
            stream.emit('end')
          }
        }

        var httpStream = resp.httpResponse.createUnbufferedStream();

        if (AWS.HttpClient.streamsApiVersion === 2) {
          if (shouldCheckContentLength) {
            var lengthAccumulator = new streams.PassThrough();
            lengthAccumulator._write = function(chunk) {
              if (chunk && chunk.length) {
                receivedLen += chunk.length;
              }
              return streams.PassThrough.prototype._write.apply(this, arguments);
            };

            lengthAccumulator.on('end', checkContentLengthAndEmit);
            httpStream.pipe(lengthAccumulator).pipe(stream, { end: false });
          } else {
            httpStream.pipe(stream);
          }
        } else {

          if (shouldCheckContentLength) {
            httpStream.on('data', function(arg) {
              if (arg && arg.length) {
                receivedLen += arg.length;
              }
            });
          }

          httpStream.on('data', function(arg) {
            stream.emit('data', arg);
          });
          httpStream.on('end', checkContentLengthAndEmit);
        }

        httpStream.on('error', function(err) {
          shouldCheckContentLength = false;
          stream.emit('error', err);
        });
      }
    });

    this.on('error', function(err) {
      stream.emit('error', err);
    });

    return stream;
  },


  emitEvent: function emit(eventName, args, done) {
    if (typeof args === 'function') { done = args; args = null; }
    if (!done) done = function() { };
    if (!args) args = this.eventParameters(eventName, this.response);

    var origEmit = AWS.SequentialExecutor.prototype.emit;
    origEmit.call(this, eventName, args, function (err) {
      if (err) this.response.error = err;
      done.call(this, err);
    });
  },


  eventParameters: function eventParameters(eventName) {
    switch (eventName) {
      case 'restart':
      case 'validate':
      case 'sign':
      case 'build':
      case 'afterValidate':
      case 'afterBuild':
        return [this];
      case 'error':
        return [this.response.error, this.response];
      default:
        return [this.response];
    }
  },


  presign: function presign(expires, callback) {
    if (!callback && typeof expires === 'function') {
      callback = expires;
      expires = null;
    }
    return new AWS.Signers.Presign().sign(this.toGet(), expires, callback);
  },


  isPresigned: function isPresigned() {
    return Object.prototype.hasOwnProperty.call(this.httpRequest.headers, 'presigned-expires');
  },


  toUnauthenticated: function toUnauthenticated() {
    this.removeListener('validate', AWS.EventListeners.Core.VALIDATE_CREDENTIALS);
    this.removeListener('sign', AWS.EventListeners.Core.SIGN);
    return this;
  },


  toGet: function toGet() {
    if (this.service.api.protocol === 'query' ||
        this.service.api.protocol === 'ec2') {
      this.removeListener('build', this.buildAsGet);
      this.addListener('build', this.buildAsGet);
    }
    return this;
  },


  buildAsGet: function buildAsGet(request) {
    request.httpRequest.method = 'GET';
    request.httpRequest.path = request.service.endpoint.path +
                               '?' + request.httpRequest.body;
    request.httpRequest.body = '';

    delete request.httpRequest.headers['Content-Length'];
    delete request.httpRequest.headers['Content-Type'];
  },


  haltHandlersOnError: function haltHandlersOnError() {
    this._haltHandlersOnError = true;
  }
});


AWS.Request.addPromisesToClass = function addPromisesToClass(PromiseDependency) {
  this.prototype.promise = function promise() {
    var self = this;
    return new PromiseDependency(function(resolve, reject) {
      self.on('complete', function(resp) {
        if (resp.error) {
          reject(resp.error);
        } else {
          resolve(resp.data);
        }
      });
      self.runTo();
    });
  };
};


AWS.Request.deletePromisesFromClass = function deletePromisesFromClass() {
  delete this.prototype.promise;
};

AWS.util.addPromises(AWS.Request);

AWS.util.mixin(AWS.Request, AWS.SequentialExecutor);

}).call(this,require('_process'))
},{"./core":10,"./state_machine":51,"_process":117,"jmespath":68}],38:[function(require,module,exports){


var AWS = require('./core');
var inherit = AWS.util.inherit;
var jmespath = require('jmespath');


function CHECK_ACCEPTORS(resp) {
  var waiter = resp.request._waiter;
  var acceptors = waiter.config.acceptors;
  var acceptorMatched = false;
  var state = 'retry';

  acceptors.forEach(function(acceptor) {
    if (!acceptorMatched) {
      var matcher = waiter.matchers[acceptor.matcher];
      if (matcher && matcher(resp, acceptor.expected, acceptor.argument)) {
        acceptorMatched = true;
        state = acceptor.state;
      }
    }
  });

  if (!acceptorMatched && resp.error) state = 'failure';

  if (state === 'success') {
    waiter.setSuccess(resp);
  } else {
    waiter.setError(resp, state === 'retry');
  }
}


AWS.ResourceWaiter = inherit({

  constructor: function constructor(service, state) {
    this.service = service;
    this.state = state;
    this.loadWaiterConfig(this.state);
  },

  service: null,

  state: null,

  config: null,

  matchers: {
    path: function(resp, expected, argument) {
      var result = jmespath.search(resp.data, argument);
      return jmespath.strictDeepEqual(result,expected);
    },

    pathAll: function(resp, expected, argument) {
      var results = jmespath.search(resp.data, argument);
      if (!Array.isArray(results)) results = [results];
      var numResults = results.length;
      if (!numResults) return false;
      for (var ind = 0 ; ind < numResults; ind++) {
        if (!jmespath.strictDeepEqual(results[ind], expected)) {
          return false;
        }
      }
      return true;
    },

    pathAny: function(resp, expected, argument) {
      var results = jmespath.search(resp.data, argument);
      if (!Array.isArray(results)) results = [results];
      var numResults = results.length;
      for (var ind = 0 ; ind < numResults; ind++) {
        if (jmespath.strictDeepEqual(results[ind], expected)) {
          return true;
        }
      }
      return false;
    },

    status: function(resp, expected) {
      var statusCode = resp.httpResponse.statusCode;
      return (typeof statusCode === 'number') && (statusCode === expected);
    },

    error: function(resp, expected) {
      if (typeof expected === 'string' && resp.error) {
        return expected === resp.error.code;
      }
      return expected === !!resp.error;
    }
  },

  listeners: new AWS.SequentialExecutor().addNamedListeners(function(add) {
    add('RETRY_CHECK', 'retry', function(resp) {
      var waiter = resp.request._waiter;
      if (resp.error && resp.error.code === 'ResourceNotReady') {
        resp.error.retryDelay = (waiter.config.delay || 0) * 1000;
      }
    });

    add('CHECK_OUTPUT', 'extractData', CHECK_ACCEPTORS);

    add('CHECK_ERROR', 'extractError', CHECK_ACCEPTORS);
  }),


  wait: function wait(params, callback) {
    if (typeof params === 'function') {
      callback = params; params = undefined;
    }

    var request = this.service.makeRequest(this.config.operation, params);
    request._waiter = this;
    request.response.maxRetries = this.config.maxAttempts;
    request.addListeners(this.listeners);

    if (callback) request.send(callback);
    return request;
  },

  setSuccess: function setSuccess(resp) {
    resp.error = null;
    resp.data = resp.data || {};
    resp.request.removeAllListeners('extractData');
  },

  setError: function setError(resp, retryable) {
    resp.data = null;
    resp.error = AWS.util.error(resp.error || new Error(), {
      code: 'ResourceNotReady',
      message: 'Resource is not in the state ' + this.state,
      retryable: retryable
    });
  },


  loadWaiterConfig: function loadWaiterConfig(state) {
    if (!this.service.api.waiters[state]) {
      throw new AWS.util.error(new Error(), {
        code: 'StateNotFoundError',
        message: 'State ' + state + ' not found.'
      });
    }

    this.config = this.service.api.waiters[state];
  }
});

},{"./core":10,"jmespath":68}],39:[function(require,module,exports){
var AWS = require('./core');
var inherit = AWS.util.inherit;
var jmespath = require('jmespath');


AWS.Response = inherit({


  constructor: function Response(request) {
    this.request = request;
    this.data = null;
    this.error = null;
    this.retryCount = 0;
    this.redirectCount = 0;
    this.httpResponse = new AWS.HttpResponse();
    if (request) {
      this.maxRetries = request.service.numRetries();
      this.maxRedirects = request.service.config.maxRedirects;
    }
  },


  nextPage: function nextPage(callback) {
    var config;
    var service = this.request.service;
    var operation = this.request.operation;
    try {
      config = service.paginationConfig(operation, true);
    } catch (e) { this.error = e; }

    if (!this.hasNextPage()) {
      if (callback) callback(this.error, null);
      else if (this.error) throw this.error;
      return null;
    }

    var params = AWS.util.copy(this.request.params);
    if (!this.nextPageTokens) {
      return callback ? callback(null, null) : null;
    } else {
      var inputTokens = config.inputToken;
      if (typeof inputTokens === 'string') inputTokens = [inputTokens];
      for (var i = 0; i < inputTokens.length; i++) {
        params[inputTokens[i]] = this.nextPageTokens[i];
      }
      return service.makeRequest(this.request.operation, params, callback);
    }
  },


  hasNextPage: function hasNextPage() {
    this.cacheNextPageTokens();
    if (this.nextPageTokens) return true;
    if (this.nextPageTokens === undefined) return undefined;
    else return false;
  },


  cacheNextPageTokens: function cacheNextPageTokens() {
    if (Object.prototype.hasOwnProperty.call(this, 'nextPageTokens')) return this.nextPageTokens;
    this.nextPageTokens = undefined;

    var config = this.request.service.paginationConfig(this.request.operation);
    if (!config) return this.nextPageTokens;

    this.nextPageTokens = null;
    if (config.moreResults) {
      if (!jmespath.search(this.data, config.moreResults)) {
        return this.nextPageTokens;
      }
    }

    var exprs = config.outputToken;
    if (typeof exprs === 'string') exprs = [exprs];
    AWS.util.arrayEach.call(this, exprs, function (expr) {
      var output = jmespath.search(this.data, expr);
      if (output) {
        this.nextPageTokens = this.nextPageTokens || [];
        this.nextPageTokens.push(output);
      }
    });

    return this.nextPageTokens;
  }

});

},{"./core":10,"jmespath":68}],40:[function(require,module,exports){
var AWS = require('./core');


AWS.SequentialExecutor = AWS.util.inherit({

  constructor: function SequentialExecutor() {
    this._events = {};
  },


  listeners: function listeners(eventName) {
    return this._events[eventName] ? this._events[eventName].slice(0) : [];
  },

  on: function on(eventName, listener) {
    if (this._events[eventName]) {
      this._events[eventName].push(listener);
    } else {
      this._events[eventName] = [listener];
    }
    return this;
  },


  onAsync: function onAsync(eventName, listener) {
    listener._isAsync = true;
    return this.on(eventName, listener);
  },

  removeListener: function removeListener(eventName, listener) {
    var listeners = this._events[eventName];
    if (listeners) {
      var length = listeners.length;
      var position = -1;
      for (var i = 0; i < length; ++i) {
        if (listeners[i] === listener) {
          position = i;
        }
      }
      if (position > -1) {
        listeners.splice(position, 1);
      }
    }
    return this;
  },

  removeAllListeners: function removeAllListeners(eventName) {
    if (eventName) {
      delete this._events[eventName];
    } else {
      this._events = {};
    }
    return this;
  },


  emit: function emit(eventName, eventArgs, doneCallback) {
    if (!doneCallback) doneCallback = function() { };
    var listeners = this.listeners(eventName);
    var count = listeners.length;
    this.callListeners(listeners, eventArgs, doneCallback);
    return count > 0;
  },


  callListeners: function callListeners(listeners, args, doneCallback, prevError) {
    var self = this;
    var error = prevError || null;

    function callNextListener(err) {
      if (err) {
        error = AWS.util.error(error || new Error(), err);
        if (self._haltHandlersOnError) {
          return doneCallback.call(self, error);
        }
      }
      self.callListeners(listeners, args, doneCallback, error);
    }

    while (listeners.length > 0) {
      var listener = listeners.shift();
      if (listener._isAsync) { // asynchronous listener
        listener.apply(self, args.concat([callNextListener]));
        return; // stop here, callNextListener will continue
      } else { // synchronous listener
        try {
          listener.apply(self, args);
        } catch (err) {
          error = AWS.util.error(error || new Error(), err);
        }
        if (error && self._haltHandlersOnError) {
          doneCallback.call(self, error);
          return;
        }
      }
    }
    doneCallback.call(self, error);
  },


  addListeners: function addListeners(listeners) {
    var self = this;

    if (listeners._events) listeners = listeners._events;

    AWS.util.each(listeners, function(event, callbacks) {
      if (typeof callbacks === 'function') callbacks = [callbacks];
      AWS.util.arrayEach(callbacks, function(callback) {
        self.on(event, callback);
      });
    });

    return self;
  },


  addNamedListener: function addNamedListener(name, eventName, callback) {
    this[name] = callback;
    this.addListener(eventName, callback);
    return this;
  },


  addNamedAsyncListener: function addNamedAsyncListener(name, eventName, callback) {
    callback._isAsync = true;
    return this.addNamedListener(name, eventName, callback);
  },


  addNamedListeners: function addNamedListeners(callback) {
    var self = this;
    callback(
      function() {
        self.addNamedListener.apply(self, arguments);
      },
      function() {
        self.addNamedAsyncListener.apply(self, arguments);
      }
    );
    return this;
  }
});


AWS.SequentialExecutor.prototype.addListener = AWS.SequentialExecutor.prototype.on;

module.exports = AWS.SequentialExecutor;

},{"./core":10}],41:[function(require,module,exports){
var AWS = require('./core');
var Api = require('./model/api');
var regionConfig = require('./region_config');
var inherit = AWS.util.inherit;
var clientCount = 0;


AWS.Service = inherit({

  constructor: function Service(config) {
    if (!this.loadServiceClass) {
      throw AWS.util.error(new Error(),
        'Service must be constructed with `new\' operator');
    }
    var ServiceClass = this.loadServiceClass(config || {});
    if (ServiceClass) {
      var originalConfig = AWS.util.copy(config);
      var svc = new ServiceClass(config);
      Object.defineProperty(svc, '_originalConfig', {
        get: function() { return originalConfig; },
        enumerable: false,
        configurable: true
      });
      svc._clientId = ++clientCount;
      return svc;
    }
    this.initialize(config);
  },


  initialize: function initialize(config) {
    var svcConfig = AWS.config[this.serviceIdentifier];

    this.config = new AWS.Config(AWS.config);
    if (svcConfig) this.config.update(svcConfig, true);
    if (config) this.config.update(config, true);

    this.validateService();
    if (!this.config.endpoint) regionConfig(this);

    this.config.endpoint = this.endpointFromTemplate(this.config.endpoint);
    this.setEndpoint(this.config.endpoint);
  },


  validateService: function validateService() {
  },


  loadServiceClass: function loadServiceClass(serviceConfig) {
    var config = serviceConfig;
    if (!AWS.util.isEmpty(this.api)) {
      return null;
    } else if (config.apiConfig) {
      return AWS.Service.defineServiceApi(this.constructor, config.apiConfig);
    } else if (!this.constructor.services) {
      return null;
    } else {
      config = new AWS.Config(AWS.config);
      config.update(serviceConfig, true);
      var version = config.apiVersions[this.constructor.serviceIdentifier];
      version = version || config.apiVersion;
      return this.getLatestServiceClass(version);
    }
  },


  getLatestServiceClass: function getLatestServiceClass(version) {
    version = this.getLatestServiceVersion(version);
    if (this.constructor.services[version] === null) {
      AWS.Service.defineServiceApi(this.constructor, version);
    }

    return this.constructor.services[version];
  },


  getLatestServiceVersion: function getLatestServiceVersion(version) {
    if (!this.constructor.services || this.constructor.services.length === 0) {
      throw new Error('No services defined on ' +
                      this.constructor.serviceIdentifier);
    }

    if (!version) {
      version = 'latest';
    } else if (AWS.util.isType(version, Date)) {
      version = AWS.util.date.iso8601(version).split('T')[0];
    }

    if (Object.hasOwnProperty(this.constructor.services, version)) {
      return version;
    }

    var keys = Object.keys(this.constructor.services).sort();
    var selectedVersion = null;
    for (var i = keys.length - 1; i >= 0; i--) {
      if (keys[i][keys[i].length - 1] !== '*') {
        selectedVersion = keys[i];
      }
      if (keys[i].substr(0, 10) <= version) {
        return selectedVersion;
      }
    }

    throw new Error('Could not find ' + this.constructor.serviceIdentifier +
                    ' API to satisfy version constraint `' + version + '\'');
  },


  api: {},


  defaultRetryCount: 3,


  makeRequest: function makeRequest(operation, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = null;
    }

    params = params || {};
    if (this.config.params) { // copy only toplevel bound params
      var rules = this.api.operations[operation];
      if (rules) {
        params = AWS.util.copy(params);
        AWS.util.each(this.config.params, function(key, value) {
          if (rules.input.members[key]) {
            if (params[key] === undefined || params[key] === null) {
              params[key] = value;
            }
          }
        });
      }
    }

    var request = new AWS.Request(this, operation, params);
    this.addAllRequestListeners(request);

    if (callback) request.send(callback);
    return request;
  },


  makeUnauthenticatedRequest: function makeUnauthenticatedRequest(operation, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = {};
    }

    var request = this.makeRequest(operation, params).toUnauthenticated();
    return callback ? request.send(callback) : request;
  },


  waitFor: function waitFor(state, params, callback) {
    var waiter = new AWS.ResourceWaiter(this, state);
    return waiter.wait(params, callback);
  },


  addAllRequestListeners: function addAllRequestListeners(request) {
    var list = [AWS.events, AWS.EventListeners.Core, this.serviceInterface(),
                AWS.EventListeners.CorePost];
    for (var i = 0; i < list.length; i++) {
      if (list[i]) request.addListeners(list[i]);
    }

    if (!this.config.paramValidation) {
      request.removeListener('validate',
        AWS.EventListeners.Core.VALIDATE_PARAMETERS);
    }

    if (this.config.logger) { // add logging events
      request.addListeners(AWS.EventListeners.Logger);
    }

    this.setupRequestListeners(request);
  },


  setupRequestListeners: function setupRequestListeners() {
  },


  getSignerClass: function getSignerClass() {
    var version;
    if (this.config.signatureVersion) {
      version = this.config.signatureVersion;
    } else {
      version = this.api.signatureVersion;
    }
    return AWS.Signers.RequestSigner.getVersion(version);
  },


  serviceInterface: function serviceInterface() {
    switch (this.api.protocol) {
      case 'ec2': return AWS.EventListeners.Query;
      case 'query': return AWS.EventListeners.Query;
      case 'json': return AWS.EventListeners.Json;
      case 'rest-json': return AWS.EventListeners.RestJson;
      case 'rest-xml': return AWS.EventListeners.RestXml;
    }
    if (this.api.protocol) {
      throw new Error('Invalid service `protocol\' ' +
        this.api.protocol + ' in API config');
    }
  },


  successfulResponse: function successfulResponse(resp) {
    return resp.httpResponse.statusCode < 300;
  },


  numRetries: function numRetries() {
    if (this.config.maxRetries !== undefined) {
      return this.config.maxRetries;
    } else {
      return this.defaultRetryCount;
    }
  },


  retryDelays: function retryDelays(retryCount) {
    return AWS.util.calculateRetryDelay(retryCount, this.config.retryDelayOptions);
  },


  retryableError: function retryableError(error) {
    if (this.networkingError(error)) return true;
    if (this.expiredCredentialsError(error)) return true;
    if (this.throttledError(error)) return true;
    if (error.statusCode >= 500) return true;
    return false;
  },


  networkingError: function networkingError(error) {
    return error.code === 'NetworkingError';
  },


  expiredCredentialsError: function expiredCredentialsError(error) {
    return (error.code === 'ExpiredTokenException');
  },


  clockSkewError: function clockSkewError(error) {
    switch (error.code) {
      case 'RequestTimeTooSkewed':
      case 'RequestExpired':
      case 'InvalidSignatureException':
      case 'SignatureDoesNotMatch':
      case 'AuthFailure':
      case 'RequestInTheFuture':
        return true;
      default: return false;
    }
  },


  throttledError: function throttledError(error) {
    switch (error.code) {
      case 'ProvisionedThroughputExceededException':
      case 'Throttling':
      case 'ThrottlingException':
      case 'RequestLimitExceeded':
      case 'RequestThrottled':
        return true;
      default:
        return false;
    }
  },


  endpointFromTemplate: function endpointFromTemplate(endpoint) {
    if (typeof endpoint !== 'string') return endpoint;

    var e = endpoint;
    e = e.replace(/\{service\}/g, this.api.endpointPrefix);
    e = e.replace(/\{region\}/g, this.config.region);
    e = e.replace(/\{scheme\}/g, this.config.sslEnabled ? 'https' : 'http');
    return e;
  },


  setEndpoint: function setEndpoint(endpoint) {
    this.endpoint = new AWS.Endpoint(endpoint, this.config);
  },


  paginationConfig: function paginationConfig(operation, throwException) {
    var paginator = this.api.operations[operation].paginator;
    if (!paginator) {
      if (throwException) {
        var e = new Error();
        throw AWS.util.error(e, 'No pagination configuration for ' + operation);
      }
      return null;
    }

    return paginator;
  }
});

AWS.util.update(AWS.Service, {


  defineMethods: function defineMethods(svc) {
    AWS.util.each(svc.prototype.api.operations, function iterator(method) {
      if (svc.prototype[method]) return;
      var operation = svc.prototype.api.operations[method];
      if (operation.authtype === 'none') {
        svc.prototype[method] = function (params, callback) {
          return this.makeUnauthenticatedRequest(method, params, callback);
        };
      } else {
        svc.prototype[method] = function (params, callback) {
          return this.makeRequest(method, params, callback);
        };
      }
    });
  },


  defineService: function defineService(serviceIdentifier, versions, features) {
    AWS.Service._serviceMap[serviceIdentifier] = true;
    if (!Array.isArray(versions)) {
      features = versions;
      versions = [];
    }

    var svc = inherit(AWS.Service, features || {});

    if (typeof serviceIdentifier === 'string') {
      AWS.Service.addVersions(svc, versions);

      var identifier = svc.serviceIdentifier || serviceIdentifier;
      svc.serviceIdentifier = identifier;
    } else { // defineService called with an API
      svc.prototype.api = serviceIdentifier;
      AWS.Service.defineMethods(svc);
    }

    return svc;
  },


  addVersions: function addVersions(svc, versions) {
    if (!Array.isArray(versions)) versions = [versions];

    svc.services = svc.services || {};
    for (var i = 0; i < versions.length; i++) {
      if (svc.services[versions[i]] === undefined) {
        svc.services[versions[i]] = null;
      }
    }

    svc.apiVersions = Object.keys(svc.services).sort();
  },


  defineServiceApi: function defineServiceApi(superclass, version, apiConfig) {
    var svc = inherit(superclass, {
      serviceIdentifier: superclass.serviceIdentifier
    });

    function setApi(api) {
      if (api.isApi) {
        svc.prototype.api = api;
      } else {
        svc.prototype.api = new Api(api);
      }
    }

    if (typeof version === 'string') {
      if (apiConfig) {
        setApi(apiConfig);
      } else {
        try {
          setApi(AWS.apiLoader(superclass.serviceIdentifier, version));
        } catch (err) {
          throw AWS.util.error(err, {
            message: 'Could not find API configuration ' +
              superclass.serviceIdentifier + '-' + version
          });
        }
      }
      if (!Object.prototype.hasOwnProperty.call(superclass.services, version)) {
        superclass.apiVersions = superclass.apiVersions.concat(version).sort();
      }
      superclass.services[version] = svc;
    } else {
      setApi(version);
    }

    AWS.Service.defineMethods(svc);
    return svc;
  },


  hasService: function(identifier) {
    return Object.prototype.hasOwnProperty.call(AWS.Service._serviceMap, identifier);
  },


  _serviceMap: {}
});

module.exports = AWS.Service;
},{"./core":10,"./model/api":22,"./region_config":36}],42:[function(require,module,exports){
var AWS = require('../core');

AWS.util.update(AWS.CognitoIdentity.prototype, {
  getOpenIdToken: function getOpenIdToken(params, callback) {
    return this.makeUnauthenticatedRequest('getOpenIdToken', params, callback);
  },

  getId: function getId(params, callback) {
    return this.makeUnauthenticatedRequest('getId', params, callback);
  },

  getCredentialsForIdentity: function getCredentialsForIdentity(params, callback) {
    return this.makeUnauthenticatedRequest('getCredentialsForIdentity', params, callback);
  }
});

},{"../core":10}],43:[function(require,module,exports){
var AWS = require('../core');

AWS.util.update(AWS.STS.prototype, {

  credentialsFrom: function credentialsFrom(data, credentials) {
    if (!data) return null;
    if (!credentials) credentials = new AWS.TemporaryCredentials();
    credentials.expired = false;
    credentials.accessKeyId = data.Credentials.AccessKeyId;
    credentials.secretAccessKey = data.Credentials.SecretAccessKey;
    credentials.sessionToken = data.Credentials.SessionToken;
    credentials.expireTime = data.Credentials.Expiration;
    return credentials;
  },

  assumeRoleWithWebIdentity: function assumeRoleWithWebIdentity(params, callback) {
    return this.makeUnauthenticatedRequest('assumeRoleWithWebIdentity', params, callback);
  },

  assumeRoleWithSAML: function assumeRoleWithSAML(params, callback) {
    return this.makeUnauthenticatedRequest('assumeRoleWithSAML', params, callback);
  }
});

},{"../core":10}],44:[function(require,module,exports){
var AWS = require('../core');
var inherit = AWS.util.inherit;


var expiresHeader = 'presigned-expires';


function signedUrlBuilder(request) {
  var expires = request.httpRequest.headers[expiresHeader];
  var signerClass = request.service.getSignerClass(request);

  delete request.httpRequest.headers['User-Agent'];
  delete request.httpRequest.headers['X-Amz-User-Agent'];

  if (signerClass === AWS.Signers.V4) {
    if (expires > 604800) { // one week expiry is invalid
      var message = 'Presigning does not support expiry time greater ' +
                    'than a week with SigV4 signing.';
      throw AWS.util.error(new Error(), {
        code: 'InvalidExpiryTime', message: message, retryable: false
      });
    }
    request.httpRequest.headers[expiresHeader] = expires;
  } else if (signerClass === AWS.Signers.S3) {
    request.httpRequest.headers[expiresHeader] = parseInt(
      AWS.util.date.unixTimestamp() + expires, 10).toString();
  } else {
    throw AWS.util.error(new Error(), {
      message: 'Presigning only supports S3 or SigV4 signing.',
      code: 'UnsupportedSigner', retryable: false
    });
  }
}


function signedUrlSigner(request) {
  var endpoint = request.httpRequest.endpoint;
  var parsedUrl = AWS.util.urlParse(request.httpRequest.path);
  var queryParams = {};

  if (parsedUrl.search) {
    queryParams = AWS.util.queryStringParse(parsedUrl.search.substr(1));
  }

  AWS.util.each(request.httpRequest.headers, function (key, value) {
    if (key === expiresHeader) key = 'Expires';
    if (key.indexOf('x-amz-meta-') === 0) {
      delete queryParams[key];
      key = key.toLowerCase();
    }
    queryParams[key] = value;
  });
  delete request.httpRequest.headers[expiresHeader];

  var auth = queryParams['Authorization'].split(' ');
  if (auth[0] === 'AWS') {
    auth = auth[1].split(':');
    queryParams['AWSAccessKeyId'] = auth[0];
    queryParams['Signature'] = auth[1];
  } else if (auth[0] === 'AWS4-HMAC-SHA256') { // SigV4 signing
    auth.shift();
    var rest = auth.join(' ');
    var signature = rest.match(/Signature=(.*?)(?:,|\s|\r?\n|$)/)[1];
    queryParams['X-Amz-Signature'] = signature;
    delete queryParams['Expires'];
  }
  delete queryParams['Authorization'];
  delete queryParams['Host'];

  endpoint.pathname = parsedUrl.pathname;
  endpoint.search = AWS.util.queryParamsToString(queryParams);
}


AWS.Signers.Presign = inherit({

  sign: function sign(request, expireTime, callback) {
    request.httpRequest.headers[expiresHeader] = expireTime || 3600;
    request.on('build', signedUrlBuilder);
    request.on('sign', signedUrlSigner);
    request.removeListener('afterBuild',
      AWS.EventListeners.Core.SET_CONTENT_LENGTH);
    request.removeListener('afterBuild',
      AWS.EventListeners.Core.COMPUTE_SHA256);

    request.emit('beforePresign', [request]);

    if (callback) {
      request.build(function() {
        if (this.response.error) callback(this.response.error);
        else {
          callback(null, AWS.util.urlFormat(request.httpRequest.endpoint));
        }
      });
    } else {
      request.build();
      if (request.response.error) throw request.response.error;
      return AWS.util.urlFormat(request.httpRequest.endpoint);
    }
  }
});

module.exports = AWS.Signers.Presign;

},{"../core":10}],45:[function(require,module,exports){
var AWS = require('../core');
var inherit = AWS.util.inherit;


AWS.Signers.RequestSigner = inherit({
  constructor: function RequestSigner(request) {
    this.request = request;
  },

  setServiceClientId: function setServiceClientId(id) {
    this.serviceClientId = id;
  },

  getServiceClientId: function getServiceClientId() {
    return this.serviceClientId;
  }
});

AWS.Signers.RequestSigner.getVersion = function getVersion(version) {
  switch (version) {
    case 'v2': return AWS.Signers.V2;
    case 'v3': return AWS.Signers.V3;
    case 'v4': return AWS.Signers.V4;
    case 's3': return AWS.Signers.S3;
    case 'v3https': return AWS.Signers.V3Https;
  }
  throw new Error('Unknown signing version ' + version);
};

require('./v2');
require('./v3');
require('./v3https');
require('./v4');
require('./s3');
require('./presign');

},{"../core":10,"./presign":44,"./s3":46,"./v2":47,"./v3":48,"./v3https":49,"./v4":50}],46:[function(require,module,exports){
var AWS = require('../core');
var inherit = AWS.util.inherit;


AWS.Signers.S3 = inherit(AWS.Signers.RequestSigner, {

  subResources: {
    'acl': 1,
    'accelerate': 1,
    'cors': 1,
    'lifecycle': 1,
    'delete': 1,
    'location': 1,
    'logging': 1,
    'notification': 1,
    'partNumber': 1,
    'policy': 1,
    'requestPayment': 1,
    'replication': 1,
    'restore': 1,
    'tagging': 1,
    'torrent': 1,
    'uploadId': 1,
    'uploads': 1,
    'versionId': 1,
    'versioning': 1,
    'versions': 1,
    'website': 1
  },

  responseHeaders: {
    'response-content-type': 1,
    'response-content-language': 1,
    'response-expires': 1,
    'response-cache-control': 1,
    'response-content-disposition': 1,
    'response-content-encoding': 1
  },

  addAuthorization: function addAuthorization(credentials, date) {
    if (!this.request.headers['presigned-expires']) {
      this.request.headers['X-Amz-Date'] = AWS.util.date.rfc822(date);
    }

    if (credentials.sessionToken) {
      this.request.headers['x-amz-security-token'] = credentials.sessionToken;
    }

    var signature = this.sign(credentials.secretAccessKey, this.stringToSign());
    var auth = 'AWS ' + credentials.accessKeyId + ':' + signature;

    this.request.headers['Authorization'] = auth;
  },

  stringToSign: function stringToSign() {
    var r = this.request;

    var parts = [];
    parts.push(r.method);
    parts.push(r.headers['Content-MD5'] || '');
    parts.push(r.headers['Content-Type'] || '');

    parts.push(r.headers['presigned-expires'] || '');

    var headers = this.canonicalizedAmzHeaders();
    if (headers) parts.push(headers);
    parts.push(this.canonicalizedResource());

    return parts.join('\n');

  },

  canonicalizedAmzHeaders: function canonicalizedAmzHeaders() {

    var amzHeaders = [];

    AWS.util.each(this.request.headers, function (name) {
      if (name.match(/^x-amz-/i))
        amzHeaders.push(name);
    });

    amzHeaders.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });

    var parts = [];
    AWS.util.arrayEach.call(this, amzHeaders, function (name) {
      parts.push(name.toLowerCase() + ':' + String(this.request.headers[name]));
    });

    return parts.join('\n');

  },

  canonicalizedResource: function canonicalizedResource() {

    var r = this.request;

    var parts = r.path.split('?');
    var path = parts[0];
    var querystring = parts[1];

    var resource = '';

    if (r.virtualHostedBucket)
      resource += '/' + r.virtualHostedBucket;

    resource += path;

    if (querystring) {

      var resources = [];

      AWS.util.arrayEach.call(this, querystring.split('&'), function (param) {
        var name = param.split('=')[0];
        var value = param.split('=')[1];
        if (this.subResources[name] || this.responseHeaders[name]) {
          var subresource = { name: name };
          if (value !== undefined) {
            if (this.subResources[name]) {
              subresource.value = value;
            } else {
              subresource.value = decodeURIComponent(value);
            }
          }
          resources.push(subresource);
        }
      });

      resources.sort(function (a, b) { return a.name < b.name ? -1 : 1; });

      if (resources.length) {

        querystring = [];
        AWS.util.arrayEach(resources, function (res) {
          if (res.value === undefined) {
            querystring.push(res.name);
          } else {
            querystring.push(res.name + '=' + res.value);
          }
        });

        resource += '?' + querystring.join('&');
      }

    }

    return resource;

  },

  sign: function sign(secret, string) {
    return AWS.util.crypto.hmac(secret, string, 'base64', 'sha1');
  }
});

module.exports = AWS.Signers.S3;

},{"../core":10}],47:[function(require,module,exports){
var AWS = require('../core');
var inherit = AWS.util.inherit;


AWS.Signers.V2 = inherit(AWS.Signers.RequestSigner, {
  addAuthorization: function addAuthorization(credentials, date) {

    if (!date) date = AWS.util.date.getDate();

    var r = this.request;

    r.params.Timestamp = AWS.util.date.iso8601(date);
    r.params.SignatureVersion = '2';
    r.params.SignatureMethod = 'HmacSHA256';
    r.params.AWSAccessKeyId = credentials.accessKeyId;

    if (credentials.sessionToken) {
      r.params.SecurityToken = credentials.sessionToken;
    }

    delete r.params.Signature; // delete old Signature for re-signing
    r.params.Signature = this.signature(credentials);

    r.body = AWS.util.queryParamsToString(r.params);
    r.headers['Content-Length'] = r.body.length;
  },

  signature: function signature(credentials) {
    return AWS.util.crypto.hmac(credentials.secretAccessKey, this.stringToSign(), 'base64');
  },

  stringToSign: function stringToSign() {
    var parts = [];
    parts.push(this.request.method);
    parts.push(this.request.endpoint.host.toLowerCase());
    parts.push(this.request.pathname());
    parts.push(AWS.util.queryParamsToString(this.request.params));
    return parts.join('\n');
  }

});

module.exports = AWS.Signers.V2;

},{"../core":10}],48:[function(require,module,exports){
var AWS = require('../core');
var inherit = AWS.util.inherit;


AWS.Signers.V3 = inherit(AWS.Signers.RequestSigner, {
  addAuthorization: function addAuthorization(credentials, date) {

    var datetime = AWS.util.date.rfc822(date);

    this.request.headers['X-Amz-Date'] = datetime;

    if (credentials.sessionToken) {
      this.request.headers['x-amz-security-token'] = credentials.sessionToken;
    }

    this.request.headers['X-Amzn-Authorization'] =
      this.authorization(credentials, datetime);

  },

  authorization: function authorization(credentials) {
    return 'AWS3 ' +
      'AWSAccessKeyId=' + credentials.accessKeyId + ',' +
      'Algorithm=HmacSHA256,' +
      'SignedHeaders=' + this.signedHeaders() + ',' +
      'Signature=' + this.signature(credentials);
  },

  signedHeaders: function signedHeaders() {
    var headers = [];
    AWS.util.arrayEach(this.headersToSign(), function iterator(h) {
      headers.push(h.toLowerCase());
    });
    return headers.sort().join(';');
  },

  canonicalHeaders: function canonicalHeaders() {
    var headers = this.request.headers;
    var parts = [];
    AWS.util.arrayEach(this.headersToSign(), function iterator(h) {
      parts.push(h.toLowerCase().trim() + ':' + String(headers[h]).trim());
    });
    return parts.sort().join('\n') + '\n';
  },

  headersToSign: function headersToSign() {
    var headers = [];
    AWS.util.each(this.request.headers, function iterator(k) {
      if (k === 'Host' || k === 'Content-Encoding' || k.match(/^X-Amz/i)) {
        headers.push(k);
      }
    });
    return headers;
  },

  signature: function signature(credentials) {
    return AWS.util.crypto.hmac(credentials.secretAccessKey, this.stringToSign(), 'base64');
  },

  stringToSign: function stringToSign() {
    var parts = [];
    parts.push(this.request.method);
    parts.push('/');
    parts.push('');
    parts.push(this.canonicalHeaders());
    parts.push(this.request.body);
    return AWS.util.crypto.sha256(parts.join('\n'));
  }

});

module.exports = AWS.Signers.V3;

},{"../core":10}],49:[function(require,module,exports){
var AWS = require('../core');
var inherit = AWS.util.inherit;

require('./v3');


AWS.Signers.V3Https = inherit(AWS.Signers.V3, {
  authorization: function authorization(credentials) {
    return 'AWS3-HTTPS ' +
      'AWSAccessKeyId=' + credentials.accessKeyId + ',' +
      'Algorithm=HmacSHA256,' +
      'Signature=' + this.signature(credentials);
  },

  stringToSign: function stringToSign() {
    return this.request.headers['X-Amz-Date'];
  }
});

module.exports = AWS.Signers.V3Https;

},{"../core":10,"./v3":48}],50:[function(require,module,exports){
var AWS = require('../core');
var inherit = AWS.util.inherit;


var cachedSecret = {};


var cacheQueue = [];


var maxCacheEntries = 50;


var expiresHeader = 'presigned-expires';


AWS.Signers.V4 = inherit(AWS.Signers.RequestSigner, {
  constructor: function V4(request, serviceName, signatureCache) {
    AWS.Signers.RequestSigner.call(this, request);
    this.serviceName = serviceName;
    this.signatureCache = signatureCache;
  },

  algorithm: 'AWS4-HMAC-SHA256',

  addAuthorization: function addAuthorization(credentials, date) {
    var datetime = AWS.util.date.iso8601(date).replace(/[:\-]|\.\d{3}/g, '');

    if (this.isPresigned()) {
      this.updateForPresigned(credentials, datetime);
    } else {
      this.addHeaders(credentials, datetime);
    }

    this.request.headers['Authorization'] =
      this.authorization(credentials, datetime);
  },

  addHeaders: function addHeaders(credentials, datetime) {
    this.request.headers['X-Amz-Date'] = datetime;
    if (credentials.sessionToken) {
      this.request.headers['x-amz-security-token'] = credentials.sessionToken;
    }
  },

  updateForPresigned: function updateForPresigned(credentials, datetime) {
    var credString = this.credentialString(datetime);
    var qs = {
      'X-Amz-Date': datetime,
      'X-Amz-Algorithm': this.algorithm,
      'X-Amz-Credential': credentials.accessKeyId + '/' + credString,
      'X-Amz-Expires': this.request.headers[expiresHeader],
      'X-Amz-SignedHeaders': this.signedHeaders()
    };

    if (credentials.sessionToken) {
      qs['X-Amz-Security-Token'] = credentials.sessionToken;
    }

    if (this.request.headers['Content-Type']) {
      qs['Content-Type'] = this.request.headers['Content-Type'];
    }
    if (this.request.headers['Content-MD5']) {
      qs['Content-MD5'] = this.request.headers['Content-MD5'];
    }
    if (this.request.headers['Cache-Control']) {
      qs['Cache-Control'] = this.request.headers['Cache-Control'];
    }

    AWS.util.each.call(this, this.request.headers, function(key, value) {
      if (key === expiresHeader) return;
      if (this.isSignableHeader(key)) {
        var lowerKey = key.toLowerCase();
        if (lowerKey.indexOf('x-amz-meta-') === 0) {
          qs[lowerKey] = value;
        } else if (lowerKey.indexOf('x-amz-') === 0) {
          qs[key] = value;
        }
      }
    });

    var sep = this.request.path.indexOf('?') >= 0 ? '&' : '?';
    this.request.path += sep + AWS.util.queryParamsToString(qs);
  },

  authorization: function authorization(credentials, datetime) {
    var parts = [];
    var credString = this.credentialString(datetime);
    parts.push(this.algorithm + ' Credential=' +
      credentials.accessKeyId + '/' + credString);
    parts.push('SignedHeaders=' + this.signedHeaders());
    parts.push('Signature=' + this.signature(credentials, datetime));
    return parts.join(', ');
  },

  signature: function signature(credentials, datetime) {
    var cache = null;
    var cacheIdentifier = this.serviceName + (this.getServiceClientId() ? '_' + this.getServiceClientId() : '');
    if (this.signatureCache) {
      var cache = cachedSecret[cacheIdentifier];
      if (!cache) {
        cacheQueue.push(cacheIdentifier);
        if (cacheQueue.length > maxCacheEntries) {
          delete cachedSecret[cacheQueue.shift()];
        }
      }

    }
    var date = datetime.substr(0, 8);

    if (!cache ||
        cache.akid !== credentials.accessKeyId ||
        cache.region !== this.request.region ||
        cache.date !== date) {

      var kSecret = credentials.secretAccessKey;
      var kDate = AWS.util.crypto.hmac('AWS4' + kSecret, date, 'buffer');
      var kRegion = AWS.util.crypto.hmac(kDate, this.request.region, 'buffer');
      var kService = AWS.util.crypto.hmac(kRegion, this.serviceName, 'buffer');
      var kCredentials = AWS.util.crypto.hmac(kService, 'aws4_request', 'buffer');

      if (!this.signatureCache) {
        return AWS.util.crypto.hmac(kCredentials, this.stringToSign(datetime), 'hex');
      }

      cachedSecret[cacheIdentifier] = {
        region: this.request.region, date: date,
        key: kCredentials, akid: credentials.accessKeyId
      };
    }

    var key = cachedSecret[cacheIdentifier].key;
    return AWS.util.crypto.hmac(key, this.stringToSign(datetime), 'hex');
  },

  stringToSign: function stringToSign(datetime) {
    var parts = [];
    parts.push('AWS4-HMAC-SHA256');
    parts.push(datetime);
    parts.push(this.credentialString(datetime));
    parts.push(this.hexEncodedHash(this.canonicalString()));
    return parts.join('\n');
  },

  canonicalString: function canonicalString() {
    var parts = [], pathname = this.request.pathname();
    if (this.serviceName !== 's3') pathname = AWS.util.uriEscapePath(pathname);

    parts.push(this.request.method);
    parts.push(pathname);
    parts.push(this.request.search());
    parts.push(this.canonicalHeaders() + '\n');
    parts.push(this.signedHeaders());
    parts.push(this.hexEncodedBodyHash());
    return parts.join('\n');
  },

  canonicalHeaders: function canonicalHeaders() {
    var headers = [];
    AWS.util.each.call(this, this.request.headers, function (key, item) {
      headers.push([key, item]);
    });
    headers.sort(function (a, b) {
      return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1;
    });
    var parts = [];
    AWS.util.arrayEach.call(this, headers, function (item) {
      var key = item[0].toLowerCase();
      if (this.isSignableHeader(key)) {
        parts.push(key + ':' +
          this.canonicalHeaderValues(item[1].toString()));
      }
    });
    return parts.join('\n');
  },

  canonicalHeaderValues: function canonicalHeaderValues(values) {
    return values.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  },

  signedHeaders: function signedHeaders() {
    var keys = [];
    AWS.util.each.call(this, this.request.headers, function (key) {
      key = key.toLowerCase();
      if (this.isSignableHeader(key)) keys.push(key);
    });
    return keys.sort().join(';');
  },

  credentialString: function credentialString(datetime) {
    var parts = [];
    parts.push(datetime.substr(0, 8));
    parts.push(this.request.region);
    parts.push(this.serviceName);
    parts.push('aws4_request');
    return parts.join('/');
  },

  hexEncodedHash: function hash(string) {
    return AWS.util.crypto.sha256(string, 'hex');
  },

  hexEncodedBodyHash: function hexEncodedBodyHash() {
    if (this.isPresigned() && this.serviceName === 's3' && !this.request.body) {
      return 'UNSIGNED-PAYLOAD';
    } else if (this.request.headers['X-Amz-Content-Sha256']) {
      return this.request.headers['X-Amz-Content-Sha256'];
    } else {
      return this.hexEncodedHash(this.request.body || '');
    }
  },

  unsignableHeaders: ['authorization', 'content-type', 'content-length',
                      'user-agent', expiresHeader, 'expect'],

  isSignableHeader: function isSignableHeader(key) {
    if (key.toLowerCase().indexOf('x-amz-') === 0) return true;
    return this.unsignableHeaders.indexOf(key) < 0;
  },

  isPresigned: function isPresigned() {
    return this.request.headers[expiresHeader] ? true : false;
  }

});

module.exports = AWS.Signers.V4;

},{"../core":10}],51:[function(require,module,exports){
function AcceptorStateMachine(states, state) {
  this.currentState = state || null;
  this.states = states || {};
}

AcceptorStateMachine.prototype.runTo = function runTo(finalState, done, bindObject, inputError) {
  if (typeof finalState === 'function') {
    inputError = bindObject; bindObject = done;
    done = finalState; finalState = null;
  }

  var self = this;
  var state = self.states[self.currentState];
  state.fn.call(bindObject || self, inputError, function(err) {
    if (err) {
      if (state.fail) self.currentState = state.fail;
      else return done ? done.call(bindObject, err) : null;
    } else {
      if (state.accept) self.currentState = state.accept;
      else return done ? done.call(bindObject) : null;
    }
    if (self.currentState === finalState) {
      return done ? done.call(bindObject, err) : null;
    }

    self.runTo(finalState, done, bindObject, err);
  });
};

AcceptorStateMachine.prototype.addState = function addState(name, acceptState, failState, fn) {
  if (typeof acceptState === 'function') {
    fn = acceptState; acceptState = null; failState = null;
  } else if (typeof failState === 'function') {
    fn = failState; failState = null;
  }

  if (!this.currentState) this.currentState = name;
  this.states[name] = { accept: acceptState, fail: failState, fn: fn };
  return this;
};

module.exports = AcceptorStateMachine;

},{}],52:[function(require,module,exports){
(function (process){

var AWS;


var util = {
  engine: function engine() {
    if (util.isBrowser() && typeof navigator !== 'undefined') {
      return navigator.userAgent;
    } else {
      return process.platform + '/' + process.version;
    }
  },

  userAgent: function userAgent() {
    var name = util.isBrowser() ? 'js' : 'nodejs';
    var agent = 'aws-sdk-' + name + '/' + require('./core').VERSION;
    if (name === 'nodejs') agent += ' ' + util.engine();
    return agent;
  },

  isBrowser: function isBrowser() { return process && process.browser; },
  isNode: function isNode() { return !util.isBrowser(); },
  uriEscape: function uriEscape(string) {
    var output = encodeURIComponent(string);
    output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);

    output = output.replace(/[*]/g, function(ch) {
      return '%' + ch.charCodeAt(0).toString(16).toUpperCase();
    });

    return output;
  },

  uriEscapePath: function uriEscapePath(string) {
    var parts = [];
    util.arrayEach(string.split('/'), function (part) {
      parts.push(util.uriEscape(part));
    });
    return parts.join('/');
  },

  urlParse: function urlParse(url) {
    return util.url.parse(url);
  },

  urlFormat: function urlFormat(url) {
    return util.url.format(url);
  },

  queryStringParse: function queryStringParse(qs) {
    return util.querystring.parse(qs);
  },

  queryParamsToString: function queryParamsToString(params) {
    var items = [];
    var escape = util.uriEscape;
    var sortedKeys = Object.keys(params).sort();

    util.arrayEach(sortedKeys, function(name) {
      var value = params[name];
      var ename = escape(name);
      var result = ename + '=';
      if (Array.isArray(value)) {
        var vals = [];
        util.arrayEach(value, function(item) { vals.push(escape(item)); });
        result = ename + '=' + vals.sort().join('&' + ename + '=');
      } else if (value !== undefined && value !== null) {
        result = ename + '=' + escape(value);
      }
      items.push(result);
    });

    return items.join('&');
  },

  readFileSync: function readFileSync(path) {
    if (util.isBrowser()) return null;
    return require('fs').readFileSync(path, 'utf-8');
  },

  base64: {

    encode: function encode64(string) {
      return new util.Buffer(string).toString('base64');
    },

    decode: function decode64(string) {
      return new util.Buffer(string, 'base64');
    }

  },

  buffer: {
    toStream: function toStream(buffer) {
      if (!util.Buffer.isBuffer(buffer)) buffer = new util.Buffer(buffer);

      var readable = new (util.stream.Readable)();
      var pos = 0;
      readable._read = function(size) {
        if (pos >= buffer.length) return readable.push(null);

        var end = pos + size;
        if (end > buffer.length) end = buffer.length;
        readable.push(buffer.slice(pos, end));
        pos = end;
      };

      return readable;
    },


    concat: function(buffers) {
      var length = 0,
          offset = 0,
          buffer = null, i;

      for (i = 0; i < buffers.length; i++) {
        length += buffers[i].length;
      }

      buffer = new util.Buffer(length);

      for (i = 0; i < buffers.length; i++) {
        buffers[i].copy(buffer, offset);
        offset += buffers[i].length;
      }

      return buffer;
    }
  },

  string: {
    byteLength: function byteLength(string) {
      if (string === null || string === undefined) return 0;
      if (typeof string === 'string') string = new util.Buffer(string);

      if (typeof string.byteLength === 'number') {
        return string.byteLength;
      } else if (typeof string.length === 'number') {
        return string.length;
      } else if (typeof string.size === 'number') {
        return string.size;
      } else if (typeof string.path === 'string') {
        return require('fs').lstatSync(string.path).size;
      } else {
        throw util.error(new Error('Cannot determine length of ' + string),
          { object: string });
      }
    },

    upperFirst: function upperFirst(string) {
      return string[0].toUpperCase() + string.substr(1);
    },

    lowerFirst: function lowerFirst(string) {
      return string[0].toLowerCase() + string.substr(1);
    }
  },

  ini: {
    parse: function string(ini) {
      var currentSection, map = {};
      util.arrayEach(ini.split(/\r?\n/), function(line) {
        line = line.split(/(^|\s)[;#]/)[0]; // remove comments
        var section = line.match(/^\s*\[([^\[\]]+)\]\s*$/);
        if (section) {
          currentSection = section[1];
        } else if (currentSection) {
          var item = line.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
          if (item) {
            map[currentSection] = map[currentSection] || {};
            map[currentSection][item[1]] = item[2];
          }
        }
      });

      return map;
    }
  },

  fn: {
    noop: function() {},


    makeAsync: function makeAsync(fn, expectedArgs) {
      if (expectedArgs && expectedArgs <= fn.length) {
        return fn;
      }

      return function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var callback = args.pop();
        var result = fn.apply(null, args);
        callback(result);
      };
    }
  },


  date: {


    getDate: function getDate() {
      if (!AWS) AWS = require('./core');
      if (AWS.config.systemClockOffset) { // use offset when non-zero
        return new Date(new Date().getTime() + AWS.config.systemClockOffset);
      } else {
        return new Date();
      }
    },


    iso8601: function iso8601(date) {
      if (date === undefined) { date = util.date.getDate(); }
      return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    },


    rfc822: function rfc822(date) {
      if (date === undefined) { date = util.date.getDate(); }
      return date.toUTCString();
    },


    unixTimestamp: function unixTimestamp(date) {
      if (date === undefined) { date = util.date.getDate(); }
      return date.getTime() / 1000;
    },


    from: function format(date) {
      if (typeof date === 'number') {
        return new Date(date * 1000); // unix timestamp
      } else {
        return new Date(date);
      }
    },


    format: function format(date, formatter) {
      if (!formatter) formatter = 'iso8601';
      return util.date[formatter](util.date.from(date));
    },

    parseTimestamp: function parseTimestamp(value) {
      if (typeof value === 'number') { // unix timestamp (number)
        return new Date(value * 1000);
      } else if (value.match(/^\d+$/)) { // unix timestamp
        return new Date(value * 1000);
      } else if (value.match(/^\d{4}/)) { // iso8601
        return new Date(value);
      } else if (value.match(/^\w{3},/)) { // rfc822
        return new Date(value);
      } else {
        throw util.error(
          new Error('unhandled timestamp format: ' + value),
          {code: 'TimestampParserError'});
      }
    }

  },

  crypto: {
    crc32Table: [
     0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419,
     0x706AF48F, 0xE963A535, 0x9E6495A3, 0x0EDB8832, 0x79DCB8A4,
     0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07,
     0x90BF1D91, 0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE,
     0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7, 0x136C9856,
     0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9,
     0xFA0F3D63, 0x8D080DF5, 0x3B6E20C8, 0x4C69105E, 0xD56041E4,
     0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
     0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3,
     0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 0x26D930AC, 0x51DE003A,
     0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599,
     0xB8BDA50F, 0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924,
     0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D, 0x76DC4190,
     0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F,
     0x9FBFE4A5, 0xE8B8D433, 0x7807C9A2, 0x0F00F934, 0x9609A88E,
     0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
     0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED,
     0x1B01A57B, 0x8208F4C1, 0xF50FC457, 0x65B0D9C6, 0x12B7E950,
     0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3,
     0xFBD44C65, 0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2,
     0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 0x4369E96A,
     0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5,
     0xAA0A4C5F, 0xDD0D7CC9, 0x5005713C, 0x270241AA, 0xBE0B1010,
     0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
     0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17,
     0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 0xEDB88320, 0x9ABFB3B6,
     0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615,
     0x73DC1683, 0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8,
     0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 0xF00F9344,
     0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB,
     0x196C3671, 0x6E6B06E7, 0xFED41B76, 0x89D32BE0, 0x10DA7A5A,
     0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
     0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1,
     0xA6BC5767, 0x3FB506DD, 0x48B2364B, 0xD80D2BDA, 0xAF0A1B4C,
     0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF,
     0x4669BE79, 0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236,
     0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 0xC5BA3BBE,
     0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31,
     0x2CD99E8B, 0x5BDEAE1D, 0x9B64C2B0, 0xEC63F226, 0x756AA39C,
     0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
     0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B,
     0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 0x86D3D2D4, 0xF1D4E242,
     0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1,
     0x18B74777, 0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C,
     0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 0xA00AE278,
     0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7,
     0x4969474D, 0x3E6E77DB, 0xAED16A4A, 0xD9D65ADC, 0x40DF0B66,
     0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
     0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605,
     0xCDD70693, 0x54DE5729, 0x23D967BF, 0xB3667A2E, 0xC4614AB8,
     0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B,
     0x2D02EF8D],

    crc32: function crc32(data) {
      var tbl = util.crypto.crc32Table;
      var crc = 0 ^ -1;

      if (typeof data === 'string') {
        data = new util.Buffer(data);
      }

      for (var i = 0; i < data.length; i++) {
        var code = data.readUInt8(i);
        crc = (crc >>> 8) ^ tbl[(crc ^ code) & 0xFF];
      }
      return (crc ^ -1) >>> 0;
    },

    hmac: function hmac(key, string, digest, fn) {
      if (!digest) digest = 'binary';
      if (digest === 'buffer') { digest = undefined; }
      if (!fn) fn = 'sha256';
      if (typeof string === 'string') string = new util.Buffer(string);
      return util.crypto.lib.createHmac(fn, key).update(string).digest(digest);
    },

    md5: function md5(data, digest, callback) {
      return util.crypto.hash('md5', data, digest, callback);
    },

    sha256: function sha256(data, digest, callback) {
      return util.crypto.hash('sha256', data, digest, callback);
    },

    hash: function(algorithm, data, digest, callback) {
      var hash = util.crypto.createHash(algorithm);
      if (!digest) { digest = 'binary'; }
      if (digest === 'buffer') { digest = undefined; }
      if (typeof data === 'string') data = new util.Buffer(data);
      var sliceFn = util.arraySliceFn(data);
      var isBuffer = util.Buffer.isBuffer(data);
      if (util.isBrowser() && typeof ArrayBuffer !== 'undefined' && data && data.buffer instanceof ArrayBuffer) isBuffer = true;

      if (callback && typeof data === 'object' &&
          typeof data.on === 'function' && !isBuffer) {
        data.on('data', function(chunk) { hash.update(chunk); });
        data.on('error', function(err) { callback(err); });
        data.on('end', function() { callback(null, hash.digest(digest)); });
      } else if (callback && sliceFn && !isBuffer &&
                 typeof FileReader !== 'undefined') {
        var index = 0, size = 1024 * 512;
        var reader = new FileReader();
        reader.onerror = function() {
          callback(new Error('Failed to read data.'));
        };
        reader.onload = function() {
          var buf = new util.Buffer(new Uint8Array(reader.result));
          hash.update(buf);
          index += buf.length;
          reader._continueReading();
        };
        reader._continueReading = function() {
          if (index >= data.size) {
            callback(null, hash.digest(digest));
            return;
          }

          var back = index + size;
          if (back > data.size) back = data.size;
          reader.readAsArrayBuffer(sliceFn.call(data, index, back));
        };

        reader._continueReading();
      } else {
        if (util.isBrowser() && typeof data === 'object' && !isBuffer) {
          data = new util.Buffer(new Uint8Array(data));
        }
        var out = hash.update(data).digest(digest);
        if (callback) callback(null, out);
        return out;
      }
    },

    toHex: function toHex(data) {
      var out = [];
      for (var i = 0; i < data.length; i++) {
        out.push(('0' + data.charCodeAt(i).toString(16)).substr(-2, 2));
      }
      return out.join('');
    },

    createHash: function createHash(algorithm) {
      return util.crypto.lib.createHash(algorithm);
    }

  },




  abort: {},

  each: function each(object, iterFunction) {
    for (var key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        var ret = iterFunction.call(this, key, object[key]);
        if (ret === util.abort) break;
      }
    }
  },

  arrayEach: function arrayEach(array, iterFunction) {
    for (var idx in array) {
      if (Object.prototype.hasOwnProperty.call(array, idx)) {
        var ret = iterFunction.call(this, array[idx], parseInt(idx, 10));
        if (ret === util.abort) break;
      }
    }
  },

  update: function update(obj1, obj2) {
    util.each(obj2, function iterator(key, item) {
      obj1[key] = item;
    });
    return obj1;
  },

  merge: function merge(obj1, obj2) {
    return util.update(util.copy(obj1), obj2);
  },

  copy: function copy(object) {
    if (object === null || object === undefined) return object;
    var dupe = {};
    for (var key in object) {
      dupe[key] = object[key];
    }
    return dupe;
  },

  isEmpty: function isEmpty(obj) {
    for (var prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        return false;
      }
    }
    return true;
  },

  arraySliceFn: function arraySliceFn(obj) {
    var fn = obj.slice || obj.webkitSlice || obj.mozSlice;
    return typeof fn === 'function' ? fn : null;
  },

  isType: function isType(obj, type) {
    if (typeof type === 'function') type = util.typeName(type);
    return Object.prototype.toString.call(obj) === '[object ' + type + ']';
  },

  typeName: function typeName(type) {
    if (Object.prototype.hasOwnProperty.call(type, 'name')) return type.name;
    var str = type.toString();
    var match = str.match(/^\s*function (.+)\(/);
    return match ? match[1] : str;
  },

  error: function error(err, options) {
    var originalError = null;
    if (typeof err.message === 'string' && err.message !== '') {
      if (typeof options === 'string' || (options && options.message)) {
        originalError = util.copy(err);
        originalError.message = err.message;
      }
    }
    err.message = err.message || null;

    if (typeof options === 'string') {
      err.message = options;
    } else if (typeof options === 'object' && options !== null) {
      util.update(err, options);
      if (options.message)
        err.message = options.message;
      if (options.code || options.name)
        err.code = options.code || options.name;
      if (options.stack)
        err.stack = options.stack;
    }

    if (typeof Object.defineProperty === 'function') {
      Object.defineProperty(err, 'name', {writable: true, enumerable: false});
      Object.defineProperty(err, 'message', {enumerable: true});
    }

    err.name = options && options.name || err.name || err.code || 'Error';
    err.time = new Date();

    if (originalError) err.originalError = originalError;

    return err;
  },


  inherit: function inherit(klass, features) {
    var newObject = null;
    if (features === undefined) {
      features = klass;
      klass = Object;
      newObject = {};
    } else {
      var ctor = function ConstructorWrapper() {};
      ctor.prototype = klass.prototype;
      newObject = new ctor();
    }

    if (features.constructor === Object) {
      features.constructor = function() {
        if (klass !== Object) {
          return klass.apply(this, arguments);
        }
      };
    }

    features.constructor.prototype = newObject;
    util.update(features.constructor.prototype, features);
    features.constructor.__super__ = klass;
    return features.constructor;
  },


  mixin: function mixin() {
    var klass = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
      for (var prop in arguments[i].prototype) {
        var fn = arguments[i].prototype[prop];
        if (prop !== 'constructor') {
          klass.prototype[prop] = fn;
        }
      }
    }
    return klass;
  },


  hideProperties: function hideProperties(obj, props) {
    if (typeof Object.defineProperty !== 'function') return;

    util.arrayEach(props, function (key) {
      Object.defineProperty(obj, key, {
        enumerable: false, writable: true, configurable: true });
    });
  },


  property: function property(obj, name, value, enumerable, isValue) {
    var opts = {
      configurable: true,
      enumerable: enumerable !== undefined ? enumerable : true
    };
    if (typeof value === 'function' && !isValue) {
      opts.get = value;
    }
    else {
      opts.value = value; opts.writable = true;
    }

    Object.defineProperty(obj, name, opts);
  },


  memoizedProperty: function memoizedProperty(obj, name, get, enumerable) {
    var cachedValue = null;

    util.property(obj, name, function() {
      if (cachedValue === null) {
        cachedValue = get();
      }
      return cachedValue;
    }, enumerable);
  },


  hoistPayloadMember: function hoistPayloadMember(resp) {
    var req = resp.request;
    var operation = req.operation;
    var output = req.service.api.operations[operation].output;
    if (output.payload) {
      var payloadMember = output.members[output.payload];
      var responsePayload = resp.data[output.payload];
      if (payloadMember.type === 'structure') {
        util.each(responsePayload, function(key, value) {
          util.property(resp.data, key, value, false);
        });
      }
    }
  },


  computeSha256: function computeSha256(body, done) {
    if (util.isNode()) {
      var Stream = util.stream.Stream;
      var fs = require('fs');
      if (body instanceof Stream) {
        if (typeof body.path === 'string') { // assume file object
          var settings = {};
          if (typeof body.start === 'number') {
            settings.start = body.start;
          }
          if (typeof body.end === 'number') {
            settings.end = body.end;
          }
          body = fs.createReadStream(body.path, settings);
        } else { // TODO support other stream types
          return done(new Error('Non-file stream objects are ' +
                                'not supported with SigV4'));
        }
      }
    }

    util.crypto.sha256(body, 'hex', function(err, sha) {
      if (err) done(err);
      else done(null, sha);
    });
  },


  isClockSkewed: function isClockSkewed(serverTime) {
    if (serverTime) {
      util.property(AWS.config, 'isClockSkewed',
        Math.abs(new Date().getTime() - serverTime) >= 300000, false);
      return AWS.config.isClockSkewed;
    }
  },

  applyClockOffset: function applyClockOffset(serverTime) {
    if (serverTime)
      AWS.config.systemClockOffset = serverTime - new Date().getTime();
  },


  extractRequestId: function extractRequestId(resp) {
    var requestId = resp.httpResponse.headers['x-amz-request-id'] ||
                     resp.httpResponse.headers['x-amzn-requestid'];

    if (!requestId && resp.data && resp.data.ResponseMetadata) {
      requestId = resp.data.ResponseMetadata.RequestId;
    }

    if (requestId) {
      resp.requestId = requestId;
    }

    if (resp.error) {
      resp.error.requestId = requestId;
    }
  },


  addPromises: function addPromises(constructors, PromiseDependency) {
    if (PromiseDependency === undefined && AWS && AWS.config) {
      PromiseDependency = AWS.config.getPromisesDependency();
    }
    if (PromiseDependency === undefined && typeof Promise !== 'undefined') {
      PromiseDependency = Promise;
    }
    if (typeof PromiseDependency !== 'function') var deletePromises = true;
    if (!Array.isArray(constructors)) constructors = [constructors];

    for (var ind = 0; ind < constructors.length; ind++) {
      var constructor = constructors[ind];
      if (deletePromises) {
        if (constructor.deletePromisesFromClass) {
          constructor.deletePromisesFromClass();
        }
      } else if (constructor.addPromisesToClass) {
        constructor.addPromisesToClass(PromiseDependency);
      }
    }
  },


  promisifyMethod: function promisifyMethod(methodName, PromiseDependency) {
    return function promise() {
      var self = this;
      return new PromiseDependency(function(resolve, reject) {
        self[methodName](function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    };
  },


  isDualstackAvailable: function isDualstackAvailable(service) {
    if (!service) return false;
    var metadata = require('../apis/metadata.json');
    if (typeof service !== 'string') service = service.serviceIdentifier;
    if (typeof service !== 'string' || !metadata.hasOwnProperty(service)) return false;
    return !!metadata[service].dualstackAvailable;
  },


  calculateRetryDelay: function calculateRetryDelay(retryCount, retryDelayOptions) {
    if (!retryDelayOptions) retryDelayOptions = {};
    var customBackoff = retryDelayOptions.customBackoff || null;
    if (typeof customBackoff === 'function') {
      return customBackoff(retryCount);
    }
    var base = retryDelayOptions.base || 100;
    var delay = Math.random() * (Math.pow(2, retryCount) * base);
    return delay;
  },


  handleRequestWithRetries: function handleRequestWithRetries(httpRequest, options, cb) {
    if (!options) options = {};
    var http = AWS.HttpClient.getInstance();
    var httpOptions = options.httpOptions || {};
    var retryCount = 0;

    var errCallback = function(err) {
      var maxRetries = options.maxRetries || 0;
      if (err && err.code === 'TimeoutError') err.retryable = true;
      if (err && err.retryable && retryCount < maxRetries) {
        retryCount++;
        var delay = util.calculateRetryDelay(retryCount, options.retryDelayOptions);
        setTimeout(sendRequest, delay + (err.retryAfter || 0));
      } else {
        cb(err);
      }
    };

    var sendRequest = function() {
      var data = '';
      http.handleRequest(httpRequest, httpOptions, function(httpResponse) {
        httpResponse.on('data', function(chunk) { data += chunk.toString(); });
        httpResponse.on('end', function() {
          var statusCode = httpResponse.statusCode;
          if (statusCode < 300) {
            cb(null, data);
          } else {
            var retryAfter = parseInt(httpResponse.headers['retry-after'], 10) * 1000 || 0;
            var err = util.error(new Error(),
              { retryable: statusCode >= 500 || statusCode === 429 }
            );
            if (retryAfter && err.retryable) err.retryAfter = retryAfter;
            errCallback(err);
          }
        });
      }, errCallback);
    };

    process.nextTick(sendRequest);
  }

};

module.exports = util;

}).call(this,require('_process'))
},{"../apis/metadata.json":3,"./core":10,"_process":117,"fs":56}],53:[function(require,module,exports){
var util = require('../util');
var Shape = require('../model/shape');

function DomXmlParser() { }

DomXmlParser.prototype.parse = function(xml, shape) {
  if (xml.replace(/^\s+/, '') === '') return {};

  var result, error;
  try {
    if (window.DOMParser) {
      try {
        var parser = new DOMParser();
        result = parser.parseFromString(xml, 'text/xml');
      } catch (syntaxError) {
        throw util.error(new Error('Parse error in document'),
          {
            originalError: syntaxError,
            code: 'XMLParserError',
            retryable: true
          });
      }

      if (result.documentElement === null) {
        throw util.error(new Error('Cannot parse empty document.'),
          {
            code: 'XMLParserError',
            retryable: true
          });
      }

      var isError = result.getElementsByTagName('parsererror')[0];
      if (isError && (isError.parentNode === result ||
          isError.parentNode.nodeName === 'body' ||
          isError.parentNode.parentNode === result ||
          isError.parentNode.parentNode.nodeName === 'body')) {
        var errorElement = isError.getElementsByTagName('div')[0] || isError;
        throw util.error(new Error(errorElement.textContent || 'Parser error in document'),
          {
            code: 'XMLParserError',
            retryable: true
          });
      }
    } else if (window.ActiveXObject) {
      result = new window.ActiveXObject('Microsoft.XMLDOM');
      result.async = false;

      if (!result.loadXML(xml)) {
        throw util.error(new Error('Parse error in document'),
          {
            code: 'XMLParserError',
            retryable: true
          });
      }
    } else {
      throw new Error('Cannot load XML parser');
    }
  } catch (e) {
    error = e;
  }

  if (result && result.documentElement && !error) {
    var data = parseXml(result.documentElement, shape);
    var metadata = result.getElementsByTagName('ResponseMetadata')[0];
    if (metadata) {
      data.ResponseMetadata = parseXml(metadata, {});
    }
    return data;
  } else if (error) {
    throw util.error(error || new Error(), {code: 'XMLParserError', retryable: true});
  } else { // empty xml document
    return {};
  }
};

function parseXml(xml, shape) {
  if (!shape) shape = {};
  switch (shape.type) {
    case 'structure': return parseStructure(xml, shape);
    case 'map': return parseMap(xml, shape);
    case 'list': return parseList(xml, shape);
    case undefined: case null: return parseUnknown(xml);
    default: return parseScalar(xml, shape);
  }
}

function parseStructure(xml, shape) {
  var data = {};
  if (xml === null) return data;

  util.each(shape.members, function(memberName, memberShape) {
    if (memberShape.isXmlAttribute) {
      if (Object.prototype.hasOwnProperty.call(xml.attributes, memberShape.name)) {
        var value = xml.attributes[memberShape.name].value;
        data[memberName] = parseXml({textContent: value}, memberShape);
      }
    } else {
      var xmlChild = memberShape.flattened ? xml :
        xml.getElementsByTagName(memberShape.name)[0];
      if (xmlChild) {
        data[memberName] = parseXml(xmlChild, memberShape);
      } else if (!memberShape.flattened && memberShape.type === 'list') {
        data[memberName] = memberShape.defaultValue;
      }
    }
  });

  return data;
}

function parseMap(xml, shape) {
  var data = {};
  var xmlKey = shape.key.name || 'key';
  var xmlValue = shape.value.name || 'value';
  var tagName = shape.flattened ? shape.name : 'entry';

  var child = xml.firstElementChild;
  while (child) {
    if (child.nodeName === tagName) {
      var key = child.getElementsByTagName(xmlKey)[0].textContent;
      var value = child.getElementsByTagName(xmlValue)[0];
      data[key] = parseXml(value, shape.value);
    }
    child = child.nextElementSibling;
  }
  return data;
}

function parseList(xml, shape) {
  var data = [];
  var tagName = shape.flattened ? shape.name : (shape.member.name || 'member');

  var child = xml.firstElementChild;
  while (child) {
    if (child.nodeName === tagName) {
      data.push(parseXml(child, shape.member));
    }
    child = child.nextElementSibling;
  }
  return data;
}

function parseScalar(xml, shape) {
  if (xml.getAttribute) {
    var encoding = xml.getAttribute('encoding');
    if (encoding === 'base64') {
      shape = new Shape.create({type: encoding});
    }
  }

  var text = xml.textContent;
  if (text === '') text = null;
  if (typeof shape.toType === 'function') {
    return shape.toType(text);
  } else {
    return text;
  }
}

function parseUnknown(xml) {
  if (xml === undefined || xml === null) return '';

  if (!xml.firstElementChild) {
    if (xml.parentNode.parentNode === null) return {};
    if (xml.childNodes.length === 0) return '';
    else return xml.textContent;
  }

  var shape = {type: 'structure', members: {}};
  var child = xml.firstElementChild;
  while (child) {
    var tag = child.nodeName;
    if (Object.prototype.hasOwnProperty.call(shape.members, tag)) {
      shape.members[tag].type = 'list';
    } else {
      shape.members[tag] = {name: tag};
    }
    child = child.nextElementSibling;
  }
  return parseStructure(xml, shape);
}

module.exports = DomXmlParser;

},{"../model/shape":27,"../util":52}],54:[function(require,module,exports){
var util = require('../util');
var builder = require('xmlbuilder');

function XmlBuilder() { }

XmlBuilder.prototype.toXML = function(params, shape, rootElement, noEmpty) {
  var xml = builder.create(rootElement);
  applyNamespaces(xml, shape);
  serialize(xml, params, shape);
  return xml.children.length > 0 || noEmpty ? xml.root().toString() : '';
};

function serialize(xml, value, shape) {
  switch (shape.type) {
    case 'structure': return serializeStructure(xml, value, shape);
    case 'map': return serializeMap(xml, value, shape);
    case 'list': return serializeList(xml, value, shape);
    default: return serializeScalar(xml, value, shape);
  }
}

function serializeStructure(xml, params, shape) {
  util.arrayEach(shape.memberNames, function(memberName) {
    var memberShape = shape.members[memberName];
    if (memberShape.location !== 'body') return;

    var value = params[memberName];
    var name = memberShape.name;
    if (value !== undefined && value !== null) {
      if (memberShape.isXmlAttribute) {
        xml.att(name, value);
      } else if (memberShape.flattened) {
        serialize(xml, value, memberShape);
      } else {
        var element = xml.ele(name);
        applyNamespaces(element, memberShape);
        serialize(element, value, memberShape);
      }
    }
  });
}

function serializeMap(xml, map, shape) {
  var xmlKey = shape.key.name || 'key';
  var xmlValue = shape.value.name || 'value';

  util.each(map, function(key, value) {
    var entry = xml.ele(shape.flattened ? shape.name : 'entry');
    serialize(entry.ele(xmlKey), key, shape.key);
    serialize(entry.ele(xmlValue), value, shape.value);
  });
}

function serializeList(xml, list, shape) {
  if (shape.flattened) {
    util.arrayEach(list, function(value) {
      var name = shape.member.name || shape.name;
      var element = xml.ele(name);
      serialize(element, value, shape.member);
    });
  } else {
    util.arrayEach(list, function(value) {
      var name = shape.member.name || 'member';
      var element = xml.ele(name);
      serialize(element, value, shape.member);
    });
  }
}

function serializeScalar(xml, value, shape) {
  xml.txt(shape.toWireFormat(value));
}

function applyNamespaces(xml, shape) {
  var uri, prefix = 'xmlns';
  if (shape.xmlNamespaceUri) {
    uri = shape.xmlNamespaceUri;
    if (shape.xmlNamespacePrefix) prefix += ':' + shape.xmlNamespacePrefix;
  } else if (xml.isRoot && shape.api.xmlNamespaceUri) {
    uri = shape.api.xmlNamespaceUri;
  }

  if (uri) xml.att(prefix, uri);
}

module.exports = XmlBuilder;

},{"../util":52,"xmlbuilder":145}],55:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],56:[function(require,module,exports){

},{}],57:[function(require,module,exports){
(function (global){



'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50


Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()


exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}



function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}


Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}


Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}


Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}

Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false


  if (start === undefined || start < 0) {
    start = 0
  }
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  if (buffer.length === 0) return -1

  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}


function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

Buffer.prototype.fill = function fill (val, start, end, encoding) {
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}


var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  if (str.length < 2) return ''
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      if (!leadSurrogate) {
        if (codePoint > 0xDBFF) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        leadSurrogate = codePoint

        continue
      }

      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":55,"ieee754":66,"isarray":67}],58:[function(require,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"base64-js":55,"dup":57,"ieee754":66,"isarray":67}],59:[function(require,module,exports){
var Buffer = require('buffer').Buffer;
var intSize = 4;
var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
var chrsz = 8;

function toArray(buf, bigEndian) {
  if ((buf.length % intSize) !== 0) {
    var len = buf.length + (intSize - (buf.length % intSize));
    buf = Buffer.concat([buf, zeroBuffer], len);
  }

  var arr = [];
  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
  for (var i = 0; i < buf.length; i += intSize) {
    arr.push(fn.call(buf, i));
  }
  return arr;
}

function toBuffer(arr, size, bigEndian) {
  var buf = new Buffer(size);
  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
  for (var i = 0; i < arr.length; i++) {
    fn.call(buf, arr[i], i * 4, true);
  }
  return buf;
}

function hash(buf, fn, hashSize, bigEndian) {
  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
  return toBuffer(arr, hashSize, bigEndian);
}

module.exports = { hash: hash };

},{"buffer":57}],60:[function(require,module,exports){
var Buffer = require('buffer').Buffer
var sha = require('./sha')
var sha256 = require('./sha256')
var rng = require('./rng')
var md5 = require('./md5')

var algorithms = {
  sha1: sha,
  sha256: sha256,
  md5: md5
}

var blocksize = 64
var zeroBuffer = new Buffer(blocksize); zeroBuffer.fill(0)
function hmac(fn, key, data) {
  if(!Buffer.isBuffer(key)) key = new Buffer(key)
  if(!Buffer.isBuffer(data)) data = new Buffer(data)

  if(key.length > blocksize) {
    key = fn(key)
  } else if(key.length < blocksize) {
    key = Buffer.concat([key, zeroBuffer], blocksize)
  }

  var ipad = new Buffer(blocksize), opad = new Buffer(blocksize)
  for(var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  var hash = fn(Buffer.concat([ipad, data]))
  return fn(Buffer.concat([opad, hash]))
}

function hash(alg, key) {
  alg = alg || 'sha1'
  var fn = algorithms[alg]
  var bufs = []
  var length = 0
  if(!fn) error('algorithm:', alg, 'is not yet supported')
  return {
    update: function (data) {
      if(!Buffer.isBuffer(data)) data = new Buffer(data)
        
      bufs.push(data)
      length += data.length
      return this
    },
    digest: function (enc) {
      var buf = Buffer.concat(bufs)
      var r = key ? hmac(fn, key, buf) : fn(buf)
      bufs = null
      return enc ? r.toString(enc) : r
    }
  }
}

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
    ].join('\n'))
}

exports.createHash = function (alg) { return hash(alg) }
exports.createHmac = function (alg, key) { return hash(alg, key) }
exports.randomBytes = function(size, callback) {
  if (callback && callback.call) {
    try {
      callback.call(this, undefined, new Buffer(rng(size)))
    } catch (err) { callback(err) }
  } else {
    return new Buffer(rng(size))
  }
}

function each(a, f) {
  for(var i in a)
    f(a[i], i)
}

each(['createCredentials'
, 'createCipher'
, 'createCipheriv'
, 'createDecipher'
, 'createDecipheriv'
, 'createSign'
, 'createVerify'
, 'createDiffieHellman'
, 'pbkdf2'], function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
})

},{"./md5":61,"./rng":62,"./sha":63,"./sha256":64,"buffer":57}],61:[function(require,module,exports){


var helpers = require('./helpers');


function md5_vm_test()
{
  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
}


function core_md5(x, len)
{

  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}


function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}


function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}


function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function md5(buf) {
  return helpers.hash(buf, core_md5, 16);
};

},{"./helpers":59}],62:[function(require,module,exports){
(function() {
  var _global = this;

  var mathRNG, whatwgRNG;

  mathRNG = function(size) {
    var bytes = new Array(size);
    var r;

    for (var i = 0, r; i < size; i++) {
      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return bytes;
  }

  if (_global.crypto && crypto.getRandomValues) {
    whatwgRNG = function(size) {
      var bytes = new Uint8Array(size);
      crypto.getRandomValues(bytes);
      return bytes;
    }
  }

  module.exports = whatwgRNG || mathRNG;

}())

},{}],63:[function(require,module,exports){


var helpers = require('./helpers');


function core_sha1(x, len)
{

  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}


function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}


function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}


function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}


function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function sha1(buf) {
  return helpers.hash(buf, core_sha1, 20, true);
};

},{"./helpers":59}],64:[function(require,module,exports){



var helpers = require('./helpers');

var safe_add = function(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
};

var S = function(X, n) {
  return (X >>> n) | (X << (32 - n));
};

var R = function(X, n) {
  return (X >>> n);
};

var Ch = function(x, y, z) {
  return ((x & y) ^ ((~x) & z));
};

var Maj = function(x, y, z) {
  return ((x & y) ^ (x & z) ^ (y & z));
};

var Sigma0256 = function(x) {
  return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
};

var Sigma1256 = function(x) {
  return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
};

var Gamma0256 = function(x) {
  return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
};

var Gamma1256 = function(x) {
  return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
};

var core_sha256 = function(m, l) {
  var K = new Array(0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x6CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2);
  var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
    var W = new Array(64);
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;

  m[l >> 5] |= 0x80 << (24 - l % 32);
  m[((l + 64 >> 9) << 4) + 15] = l;
  for (var i = 0; i < m.length; i += 16) {
    a = HASH[0]; b = HASH[1]; c = HASH[2]; d = HASH[3]; e = HASH[4]; f = HASH[5]; g = HASH[6]; h = HASH[7];
    for (var j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = m[j + i];
      } else {
        W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
      }
      T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
      T2 = safe_add(Sigma0256(a), Maj(a, b, c));
      h = g; g = f; f = e; e = safe_add(d, T1); d = c; c = b; b = a; a = safe_add(T1, T2);
    }
    HASH[0] = safe_add(a, HASH[0]); HASH[1] = safe_add(b, HASH[1]); HASH[2] = safe_add(c, HASH[2]); HASH[3] = safe_add(d, HASH[3]);
    HASH[4] = safe_add(e, HASH[4]); HASH[5] = safe_add(f, HASH[5]); HASH[6] = safe_add(g, HASH[6]); HASH[7] = safe_add(h, HASH[7]);
  }
  return HASH;
};

module.exports = function sha256(buf) {
  return helpers.hash(buf, core_sha256, 32, true);
};

},{"./helpers":59}],65:[function(require,module,exports){

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

EventEmitter.defaultMaxListeners = 10;

EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    this._events[type].push(listener);
  else
    this._events[type] = [this._events[type], listener];

  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],66:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],67:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],68:[function(require,module,exports){
(function(exports) {
  "use strict";

  function isArray(obj) {
    if (obj !== null) {
      return Object.prototype.toString.call(obj) === "[object Array]";
    } else {
      return false;
    }
  }

  function isObject(obj) {
    if (obj !== null) {
      return Object.prototype.toString.call(obj) === "[object Object]";
    } else {
      return false;
    }
  }

  function strictDeepEqual(first, second) {
    if (first === second) {
      return true;
    }

    var firstType = Object.prototype.toString.call(first);
    if (firstType !== Object.prototype.toString.call(second)) {
      return false;
    }
    if (isArray(first) === true) {
      if (first.length !== second.length) {
        return false;
      }
      for (var i = 0; i < first.length; i++) {
        if (strictDeepEqual(first[i], second[i]) === false) {
          return false;
        }
      }
      return true;
    }
    if (isObject(first) === true) {
      var keysSeen = {};
      for (var key in first) {
        if (hasOwnProperty.call(first, key)) {
          if (strictDeepEqual(first[key], second[key]) === false) {
            return false;
          }
          keysSeen[key] = true;
        }
      }
      for (var key2 in second) {
        if (hasOwnProperty.call(second, key2)) {
          if (keysSeen[key2] !== true) {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  }

  function isFalse(obj) {

    if (obj === "" || obj === false || obj === null) {
        return true;
    } else if (isArray(obj) && obj.length === 0) {
        return true;
    } else if (isObject(obj)) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              return false;
            }
        }
        return true;
    } else {
        return false;
    }
  }

  function objValues(obj) {
    var keys = Object.keys(obj);
    var values = [];
    for (var i = 0; i < keys.length; i++) {
      values.push(obj[keys[i]]);
    }
    return values;
  }

  function merge(a, b) {
      var merged = {};
      for (var key in a) {
          merged[key] = a[key];
      }
      for (var key2 in b) {
          merged[key2] = b[key2];
      }
      return merged;
  }

  var trimLeft;
  if (typeof String.prototype.trimLeft === "function") {
    trimLeft = function(str) {
      return str.trimLeft();
    };
  } else {
    trimLeft = function(str) {
      return str.match(/^\s*(.*)/)[1];
    };
  }

  var TYPE_NUMBER = 0;
  var TYPE_ANY = 1;
  var TYPE_STRING = 2;
  var TYPE_ARRAY = 3;
  var TYPE_OBJECT = 4;
  var TYPE_BOOLEAN = 5;
  var TYPE_EXPREF = 6;
  var TYPE_NULL = 7;
  var TYPE_ARRAY_NUMBER = 8;
  var TYPE_ARRAY_STRING = 9;

  var TOK_EOF = "EOF";
  var TOK_UNQUOTEDIDENTIFIER = "UnquotedIdentifier";
  var TOK_QUOTEDIDENTIFIER = "QuotedIdentifier";
  var TOK_RBRACKET = "Rbracket";
  var TOK_RPAREN = "Rparen";
  var TOK_COMMA = "Comma";
  var TOK_COLON = "Colon";
  var TOK_RBRACE = "Rbrace";
  var TOK_NUMBER = "Number";
  var TOK_CURRENT = "Current";
  var TOK_EXPREF = "Expref";
  var TOK_PIPE = "Pipe";
  var TOK_OR = "Or";
  var TOK_AND = "And";
  var TOK_EQ = "EQ";
  var TOK_GT = "GT";
  var TOK_LT = "LT";
  var TOK_GTE = "GTE";
  var TOK_LTE = "LTE";
  var TOK_NE = "NE";
  var TOK_FLATTEN = "Flatten";
  var TOK_STAR = "Star";
  var TOK_FILTER = "Filter";
  var TOK_DOT = "Dot";
  var TOK_NOT = "Not";
  var TOK_LBRACE = "Lbrace";
  var TOK_LBRACKET = "Lbracket";
  var TOK_LPAREN= "Lparen";
  var TOK_LITERAL= "Literal";


  var basicTokens = {
    ".": TOK_DOT,
    "*": TOK_STAR,
    ",": TOK_COMMA,
    ":": TOK_COLON,
    "{": TOK_LBRACE,
    "}": TOK_RBRACE,
    "]": TOK_RBRACKET,
    "(": TOK_LPAREN,
    ")": TOK_RPAREN,
    "@": TOK_CURRENT
  };

  var operatorStartToken = {
      "<": true,
      ">": true,
      "=": true,
      "!": true
  };

  var skipChars = {
      " ": true,
      "\t": true,
      "\n": true
  };


  function isAlpha(ch) {
      return (ch >= "a" && ch <= "z") ||
             (ch >= "A" && ch <= "Z") ||
             ch === "_";
  }

  function isNum(ch) {
      return (ch >= "0" && ch <= "9") ||
             ch === "-";
  }
  function isAlphaNum(ch) {
      return (ch >= "a" && ch <= "z") ||
             (ch >= "A" && ch <= "Z") ||
             (ch >= "0" && ch <= "9") ||
             ch === "_";
  }

  function Lexer() {
  }
  Lexer.prototype = {
      tokenize: function(stream) {
          var tokens = [];
          this._current = 0;
          var start;
          var identifier;
          var token;
          while (this._current < stream.length) {
              if (isAlpha(stream[this._current])) {
                  start = this._current;
                  identifier = this._consumeUnquotedIdentifier(stream);
                  tokens.push({type: TOK_UNQUOTEDIDENTIFIER,
                               value: identifier,
                               start: start});
              } else if (basicTokens[stream[this._current]] !== undefined) {
                  tokens.push({type: basicTokens[stream[this._current]],
                              value: stream[this._current],
                              start: this._current});
                  this._current++;
              } else if (isNum(stream[this._current])) {
                  token = this._consumeNumber(stream);
                  tokens.push(token);
              } else if (stream[this._current] === "[") {
                  token = this._consumeLBracket(stream);
                  tokens.push(token);
              } else if (stream[this._current] === "\"") {
                  start = this._current;
                  identifier = this._consumeQuotedIdentifier(stream);
                  tokens.push({type: TOK_QUOTEDIDENTIFIER,
                               value: identifier,
                               start: start});
              } else if (stream[this._current] === "'") {
                  start = this._current;
                  identifier = this._consumeRawStringLiteral(stream);
                  tokens.push({type: TOK_LITERAL,
                               value: identifier,
                               start: start});
              } else if (stream[this._current] === "`") {
                  start = this._current;
                  var literal = this._consumeLiteral(stream);
                  tokens.push({type: TOK_LITERAL,
                               value: literal,
                               start: start});
              } else if (operatorStartToken[stream[this._current]] !== undefined) {
                  tokens.push(this._consumeOperator(stream));
              } else if (skipChars[stream[this._current]] !== undefined) {
                  this._current++;
              } else if (stream[this._current] === "&") {
                  start = this._current;
                  this._current++;
                  if (stream[this._current] === "&") {
                      this._current++;
                      tokens.push({type: TOK_AND, value: "&&", start: start});
                  } else {
                      tokens.push({type: TOK_EXPREF, value: "&", start: start});
                  }
              } else if (stream[this._current] === "|") {
                  start = this._current;
                  this._current++;
                  if (stream[this._current] === "|") {
                      this._current++;
                      tokens.push({type: TOK_OR, value: "||", start: start});
                  } else {
                      tokens.push({type: TOK_PIPE, value: "|", start: start});
                  }
              } else {
                  var error = new Error("Unknown character:" + stream[this._current]);
                  error.name = "LexerError";
                  throw error;
              }
          }
          return tokens;
      },

      _consumeUnquotedIdentifier: function(stream) {
          var start = this._current;
          this._current++;
          while (this._current < stream.length && isAlphaNum(stream[this._current])) {
              this._current++;
          }
          return stream.slice(start, this._current);
      },

      _consumeQuotedIdentifier: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (stream[this._current] !== "\"" && this._current < maxLength) {
              var current = this._current;
              if (stream[current] === "\\" && (stream[current + 1] === "\\" ||
                                               stream[current + 1] === "\"")) {
                  current += 2;
              } else {
                  current++;
              }
              this._current = current;
          }
          this._current++;
          return JSON.parse(stream.slice(start, this._current));
      },

      _consumeRawStringLiteral: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (stream[this._current] !== "'" && this._current < maxLength) {
              var current = this._current;
              if (stream[current] === "\\" && (stream[current + 1] === "\\" ||
                                               stream[current + 1] === "'")) {
                  current += 2;
              } else {
                  current++;
              }
              this._current = current;
          }
          this._current++;
          var literal = stream.slice(start + 1, this._current - 1);
          return literal.replace("\\'", "'");
      },

      _consumeNumber: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (isNum(stream[this._current]) && this._current < maxLength) {
              this._current++;
          }
          var value = parseInt(stream.slice(start, this._current));
          return {type: TOK_NUMBER, value: value, start: start};
      },

      _consumeLBracket: function(stream) {
          var start = this._current;
          this._current++;
          if (stream[this._current] === "?") {
              this._current++;
              return {type: TOK_FILTER, value: "[?", start: start};
          } else if (stream[this._current] === "]") {
              this._current++;
              return {type: TOK_FLATTEN, value: "[]", start: start};
          } else {
              return {type: TOK_LBRACKET, value: "[", start: start};
          }
      },

      _consumeOperator: function(stream) {
          var start = this._current;
          var startingChar = stream[start];
          this._current++;
          if (startingChar === "!") {
              if (stream[this._current] === "=") {
                  this._current++;
                  return {type: TOK_NE, value: "!=", start: start};
              } else {
                return {type: TOK_NOT, value: "!", start: start};
              }
          } else if (startingChar === "<") {
              if (stream[this._current] === "=") {
                  this._current++;
                  return {type: TOK_LTE, value: "<=", start: start};
              } else {
                  return {type: TOK_LT, value: "<", start: start};
              }
          } else if (startingChar === ">") {
              if (stream[this._current] === "=") {
                  this._current++;
                  return {type: TOK_GTE, value: ">=", start: start};
              } else {
                  return {type: TOK_GT, value: ">", start: start};
              }
          } else if (startingChar === "=") {
              if (stream[this._current] === "=") {
                  this._current++;
                  return {type: TOK_EQ, value: "==", start: start};
              }
          }
      },

      _consumeLiteral: function(stream) {
          this._current++;
          var start = this._current;
          var maxLength = stream.length;
          var literal;
          while(stream[this._current] !== "`" && this._current < maxLength) {
              var current = this._current;
              if (stream[current] === "\\" && (stream[current + 1] === "\\" ||
                                               stream[current + 1] === "`")) {
                  current += 2;
              } else {
                  current++;
              }
              this._current = current;
          }
          var literalString = trimLeft(stream.slice(start, this._current));
          literalString = literalString.replace("\\`", "`");
          if (this._looksLikeJSON(literalString)) {
              literal = JSON.parse(literalString);
          } else {
              literal = JSON.parse("\"" + literalString + "\"");
          }
          this._current++;
          return literal;
      },

      _looksLikeJSON: function(literalString) {
          var startingChars = "[{\"";
          var jsonLiterals = ["true", "false", "null"];
          var numberLooking = "-0123456789";

          if (literalString === "") {
              return false;
          } else if (startingChars.indexOf(literalString[0]) >= 0) {
              return true;
          } else if (jsonLiterals.indexOf(literalString) >= 0) {
              return true;
          } else if (numberLooking.indexOf(literalString[0]) >= 0) {
              try {
                  JSON.parse(literalString);
                  return true;
              } catch (ex) {
                  return false;
              }
          } else {
              return false;
          }
      }
  };

      var bindingPower = {};
      bindingPower[TOK_EOF] = 0;
      bindingPower[TOK_UNQUOTEDIDENTIFIER] = 0;
      bindingPower[TOK_QUOTEDIDENTIFIER] = 0;
      bindingPower[TOK_RBRACKET] = 0;
      bindingPower[TOK_RPAREN] = 0;
      bindingPower[TOK_COMMA] = 0;
      bindingPower[TOK_RBRACE] = 0;
      bindingPower[TOK_NUMBER] = 0;
      bindingPower[TOK_CURRENT] = 0;
      bindingPower[TOK_EXPREF] = 0;
      bindingPower[TOK_PIPE] = 1;
      bindingPower[TOK_OR] = 2;
      bindingPower[TOK_AND] = 3;
      bindingPower[TOK_EQ] = 5;
      bindingPower[TOK_GT] = 5;
      bindingPower[TOK_LT] = 5;
      bindingPower[TOK_GTE] = 5;
      bindingPower[TOK_LTE] = 5;
      bindingPower[TOK_NE] = 5;
      bindingPower[TOK_FLATTEN] = 9;
      bindingPower[TOK_STAR] = 20;
      bindingPower[TOK_FILTER] = 21;
      bindingPower[TOK_DOT] = 40;
      bindingPower[TOK_NOT] = 45;
      bindingPower[TOK_LBRACE] = 50;
      bindingPower[TOK_LBRACKET] = 55;
      bindingPower[TOK_LPAREN] = 60;

  function Parser() {
  }

  Parser.prototype = {
      parse: function(expression) {
          this._loadTokens(expression);
          this.index = 0;
          var ast = this.expression(0);
          if (this._lookahead(0) !== TOK_EOF) {
              var t = this._lookaheadToken(0);
              var error = new Error(
                  "Unexpected token type: " + t.type + ", value: " + t.value);
              error.name = "ParserError";
              throw error;
          }
          return ast;
      },

      _loadTokens: function(expression) {
          var lexer = new Lexer();
          var tokens = lexer.tokenize(expression);
          tokens.push({type: TOK_EOF, value: "", start: expression.length});
          this.tokens = tokens;
      },

      expression: function(rbp) {
          var leftToken = this._lookaheadToken(0);
          this._advance();
          var left = this.nud(leftToken);
          var currentToken = this._lookahead(0);
          while (rbp < bindingPower[currentToken]) {
              this._advance();
              left = this.led(currentToken, left);
              currentToken = this._lookahead(0);
          }
          return left;
      },

      _lookahead: function(number) {
          return this.tokens[this.index + number].type;
      },

      _lookaheadToken: function(number) {
          return this.tokens[this.index + number];
      },

      _advance: function() {
          this.index++;
      },

      nud: function(token) {
        var left;
        var right;
        var expression;
        switch (token.type) {
          case TOK_LITERAL:
            return {type: "Literal", value: token.value};
          case TOK_UNQUOTEDIDENTIFIER:
            return {type: "Field", name: token.value};
          case TOK_QUOTEDIDENTIFIER:
            var node = {type: "Field", name: token.value};
            if (this._lookahead(0) === TOK_LPAREN) {
                throw new Error("Quoted identifier not allowed for function names.");
            } else {
                return node;
            }
            break;
          case TOK_NOT:
            right = this.expression(bindingPower.Not);
            return {type: "NotExpression", children: [right]};
          case TOK_STAR:
            left = {type: "Identity"};
            right = null;
            if (this._lookahead(0) === TOK_RBRACKET) {
                right = {type: "Identity"};
            } else {
                right = this._parseProjectionRHS(bindingPower.Star);
            }
            return {type: "ValueProjection", children: [left, right]};
          case TOK_FILTER:
            return this.led(token.type, {type: "Identity"});
          case TOK_LBRACE:
            return this._parseMultiselectHash();
          case TOK_FLATTEN:
            left = {type: TOK_FLATTEN, children: [{type: "Identity"}]};
            right = this._parseProjectionRHS(bindingPower.Flatten);
            return {type: "Projection", children: [left, right]};
          case TOK_LBRACKET:
            if (this._lookahead(0) === TOK_NUMBER || this._lookahead(0) === TOK_COLON) {
                right = this._parseIndexExpression();
                return this._projectIfSlice({type: "Identity"}, right);
            } else if (this._lookahead(0) === TOK_STAR &&
                       this._lookahead(1) === TOK_RBRACKET) {
                this._advance();
                this._advance();
                right = this._parseProjectionRHS(bindingPower.Star);
                return {type: "Projection",
                        children: [{type: "Identity"}, right]};
            } else {
                return this._parseMultiselectList();
            }
            break;
          case TOK_CURRENT:
            return {type: TOK_CURRENT};
          case TOK_EXPREF:
            expression = this.expression(bindingPower.Expref);
            return {type: "ExpressionReference", children: [expression]};
          case TOK_LPAREN:
            var args = [];
            while (this._lookahead(0) !== TOK_RPAREN) {
              if (this._lookahead(0) === TOK_CURRENT) {
                expression = {type: TOK_CURRENT};
                this._advance();
              } else {
                expression = this.expression(0);
              }
              args.push(expression);
            }
            this._match(TOK_RPAREN);
            return args[0];
          default:
            this._errorToken(token);
        }
      },

      led: function(tokenName, left) {
        var right;
        switch(tokenName) {
          case TOK_DOT:
            var rbp = bindingPower.Dot;
            if (this._lookahead(0) !== TOK_STAR) {
                right = this._parseDotRHS(rbp);
                return {type: "Subexpression", children: [left, right]};
            } else {
                this._advance();
                right = this._parseProjectionRHS(rbp);
                return {type: "ValueProjection", children: [left, right]};
            }
            break;
          case TOK_PIPE:
            right = this.expression(bindingPower.Pipe);
            return {type: TOK_PIPE, children: [left, right]};
          case TOK_OR:
            right = this.expression(bindingPower.Or);
            return {type: "OrExpression", children: [left, right]};
          case TOK_AND:
            right = this.expression(bindingPower.And);
            return {type: "AndExpression", children: [left, right]};
          case TOK_LPAREN:
            var name = left.name;
            var args = [];
            var expression, node;
            while (this._lookahead(0) !== TOK_RPAREN) {
              if (this._lookahead(0) === TOK_CURRENT) {
                expression = {type: TOK_CURRENT};
                this._advance();
              } else {
                expression = this.expression(0);
              }
              if (this._lookahead(0) === TOK_COMMA) {
                this._match(TOK_COMMA);
              }
              args.push(expression);
            }
            this._match(TOK_RPAREN);
            node = {type: "Function", name: name, children: args};
            return node;
          case TOK_FILTER:
            var condition = this.expression(0);
            this._match(TOK_RBRACKET);
            if (this._lookahead(0) === TOK_FLATTEN) {
              right = {type: "Identity"};
            } else {
              right = this._parseProjectionRHS(bindingPower.Filter);
            }
            return {type: "FilterProjection", children: [left, right, condition]};
          case TOK_FLATTEN:
            var leftNode = {type: TOK_FLATTEN, children: [left]};
            var rightNode = this._parseProjectionRHS(bindingPower.Flatten);
            return {type: "Projection", children: [leftNode, rightNode]};
          case TOK_EQ:
          case TOK_NE:
          case TOK_GT:
          case TOK_GTE:
          case TOK_LT:
          case TOK_LTE:
            return this._parseComparator(left, tokenName);
          case TOK_LBRACKET:
            var token = this._lookaheadToken(0);
            if (token.type === TOK_NUMBER || token.type === TOK_COLON) {
                right = this._parseIndexExpression();
                return this._projectIfSlice(left, right);
            } else {
                this._match(TOK_STAR);
                this._match(TOK_RBRACKET);
                right = this._parseProjectionRHS(bindingPower.Star);
                return {type: "Projection", children: [left, right]};
            }
            break;
          default:
            this._errorToken(this._lookaheadToken(0));
        }
      },

      _match: function(tokenType) {
          if (this._lookahead(0) === tokenType) {
              this._advance();
          } else {
              var t = this._lookaheadToken(0);
              var error = new Error("Expected " + tokenType + ", got: " + t.type);
              error.name = "ParserError";
              throw error;
          }
      },

      _errorToken: function(token) {
          var error = new Error("Invalid token (" +
                                token.type + "): \"" +
                                token.value + "\"");
          error.name = "ParserError";
          throw error;
      },


      _parseIndexExpression: function() {
          if (this._lookahead(0) === TOK_COLON || this._lookahead(1) === TOK_COLON) {
              return this._parseSliceExpression();
          } else {
              var node = {
                  type: "Index",
                  value: this._lookaheadToken(0).value};
              this._advance();
              this._match(TOK_RBRACKET);
              return node;
          }
      },

      _projectIfSlice: function(left, right) {
          var indexExpr = {type: "IndexExpression", children: [left, right]};
          if (right.type === "Slice") {
              return {
                  type: "Projection",
                  children: [indexExpr, this._parseProjectionRHS(bindingPower.Star)]
              };
          } else {
              return indexExpr;
          }
      },

      _parseSliceExpression: function() {
          var parts = [null, null, null];
          var index = 0;
          var currentToken = this._lookahead(0);
          while (currentToken !== TOK_RBRACKET && index < 3) {
              if (currentToken === TOK_COLON) {
                  index++;
                  this._advance();
              } else if (currentToken === TOK_NUMBER) {
                  parts[index] = this._lookaheadToken(0).value;
                  this._advance();
              } else {
                  var t = this._lookahead(0);
                  var error = new Error("Syntax error, unexpected token: " +
                                        t.value + "(" + t.type + ")");
                  error.name = "Parsererror";
                  throw error;
              }
              currentToken = this._lookahead(0);
          }
          this._match(TOK_RBRACKET);
          return {
              type: "Slice",
              children: parts
          };
      },

      _parseComparator: function(left, comparator) {
        var right = this.expression(bindingPower[comparator]);
        return {type: "Comparator", name: comparator, children: [left, right]};
      },

      _parseDotRHS: function(rbp) {
          var lookahead = this._lookahead(0);
          var exprTokens = [TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER, TOK_STAR];
          if (exprTokens.indexOf(lookahead) >= 0) {
              return this.expression(rbp);
          } else if (lookahead === TOK_LBRACKET) {
              this._match(TOK_LBRACKET);
              return this._parseMultiselectList();
          } else if (lookahead === TOK_LBRACE) {
              this._match(TOK_LBRACE);
              return this._parseMultiselectHash();
          }
      },

      _parseProjectionRHS: function(rbp) {
          var right;
          if (bindingPower[this._lookahead(0)] < 10) {
              right = {type: "Identity"};
          } else if (this._lookahead(0) === TOK_LBRACKET) {
              right = this.expression(rbp);
          } else if (this._lookahead(0) === TOK_FILTER) {
              right = this.expression(rbp);
          } else if (this._lookahead(0) === TOK_DOT) {
              this._match(TOK_DOT);
              right = this._parseDotRHS(rbp);
          } else {
              var t = this._lookaheadToken(0);
              var error = new Error("Sytanx error, unexpected token: " +
                                    t.value + "(" + t.type + ")");
              error.name = "ParserError";
              throw error;
          }
          return right;
      },

      _parseMultiselectList: function() {
          var expressions = [];
          while (this._lookahead(0) !== TOK_RBRACKET) {
              var expression = this.expression(0);
              expressions.push(expression);
              if (this._lookahead(0) === TOK_COMMA) {
                  this._match(TOK_COMMA);
                  if (this._lookahead(0) === TOK_RBRACKET) {
                    throw new Error("Unexpected token Rbracket");
                  }
              }
          }
          this._match(TOK_RBRACKET);
          return {type: "MultiSelectList", children: expressions};
      },

      _parseMultiselectHash: function() {
        var pairs = [];
        var identifierTypes = [TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER];
        var keyToken, keyName, value, node;
        for (;;) {
          keyToken = this._lookaheadToken(0);
          if (identifierTypes.indexOf(keyToken.type) < 0) {
            throw new Error("Expecting an identifier token, got: " +
                            keyToken.type);
          }
          keyName = keyToken.value;
          this._advance();
          this._match(TOK_COLON);
          value = this.expression(0);
          node = {type: "KeyValuePair", name: keyName, value: value};
          pairs.push(node);
          if (this._lookahead(0) === TOK_COMMA) {
            this._match(TOK_COMMA);
          } else if (this._lookahead(0) === TOK_RBRACE) {
            this._match(TOK_RBRACE);
            break;
          }
        }
        return {type: "MultiSelectHash", children: pairs};
      }
  };


  function TreeInterpreter(runtime) {
    this.runtime = runtime;
  }

  TreeInterpreter.prototype = {
      search: function(node, value) {
          return this.visit(node, value);
      },

      visit: function(node, value) {
          var matched, current, result, first, second, field, left, right, collected, i;
          switch (node.type) {
            case "Field":
              if (value === null ) {
                  return null;
              } else if (isObject(value)) {
                  field = value[node.name];
                  if (field === undefined) {
                      return null;
                  } else {
                      return field;
                  }
              } else {
                return null;
              }
              break;
            case "Subexpression":
              result = this.visit(node.children[0], value);
              for (i = 1; i < node.children.length; i++) {
                  result = this.visit(node.children[1], result);
                  if (result === null) {
                      return null;
                  }
              }
              return result;
            case "IndexExpression":
              left = this.visit(node.children[0], value);
              right = this.visit(node.children[1], left);
              return right;
            case "Index":
              if (!isArray(value)) {
                return null;
              }
              var index = node.value;
              if (index < 0) {
                index = value.length + index;
              }
              result = value[index];
              if (result === undefined) {
                result = null;
              }
              return result;
            case "Slice":
              if (!isArray(value)) {
                return null;
              }
              var sliceParams = node.children.slice(0);
              var computed = this.computeSliceParams(value.length, sliceParams);
              var start = computed[0];
              var stop = computed[1];
              var step = computed[2];
              result = [];
              if (step > 0) {
                  for (i = start; i < stop; i += step) {
                      result.push(value[i]);
                  }
              } else {
                  for (i = start; i > stop; i += step) {
                      result.push(value[i]);
                  }
              }
              return result;
            case "Projection":
              var base = this.visit(node.children[0], value);
              if (!isArray(base)) {
                return null;
              }
              collected = [];
              for (i = 0; i < base.length; i++) {
                current = this.visit(node.children[1], base[i]);
                if (current !== null) {
                  collected.push(current);
                }
              }
              return collected;
            case "ValueProjection":
              base = this.visit(node.children[0], value);
              if (!isObject(base)) {
                return null;
              }
              collected = [];
              var values = objValues(base);
              for (i = 0; i < values.length; i++) {
                current = this.visit(node.children[1], values[i]);
                if (current !== null) {
                  collected.push(current);
                }
              }
              return collected;
            case "FilterProjection":
              base = this.visit(node.children[0], value);
              if (!isArray(base)) {
                return null;
              }
              var filtered = [];
              var finalResults = [];
              for (i = 0; i < base.length; i++) {
                matched = this.visit(node.children[2], base[i]);
                if (!isFalse(matched)) {
                  filtered.push(base[i]);
                }
              }
              for (var j = 0; j < filtered.length; j++) {
                current = this.visit(node.children[1], filtered[j]);
                if (current !== null) {
                  finalResults.push(current);
                }
              }
              return finalResults;
            case "Comparator":
              first = this.visit(node.children[0], value);
              second = this.visit(node.children[1], value);
              switch(node.name) {
                case TOK_EQ:
                  result = strictDeepEqual(first, second);
                  break;
                case TOK_NE:
                  result = !strictDeepEqual(first, second);
                  break;
                case TOK_GT:
                  result = first > second;
                  break;
                case TOK_GTE:
                  result = first >= second;
                  break;
                case TOK_LT:
                  result = first < second;
                  break;
                case TOK_LTE:
                  result = first <= second;
                  break;
                default:
                  throw new Error("Unknown comparator: " + node.name);
              }
              return result;
            case TOK_FLATTEN:
              var original = this.visit(node.children[0], value);
              if (!isArray(original)) {
                return null;
              }
              var merged = [];
              for (i = 0; i < original.length; i++) {
                current = original[i];
                if (isArray(current)) {
                  merged.push.apply(merged, current);
                } else {
                  merged.push(current);
                }
              }
              return merged;
            case "Identity":
              return value;
            case "MultiSelectList":
              if (value === null) {
                return null;
              }
              collected = [];
              for (i = 0; i < node.children.length; i++) {
                  collected.push(this.visit(node.children[i], value));
              }
              return collected;
            case "MultiSelectHash":
              if (value === null) {
                return null;
              }
              collected = {};
              var child;
              for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                collected[child.name] = this.visit(child.value, value);
              }
              return collected;
            case "OrExpression":
              matched = this.visit(node.children[0], value);
              if (isFalse(matched)) {
                  matched = this.visit(node.children[1], value);
              }
              return matched;
            case "AndExpression":
              first = this.visit(node.children[0], value);

              if (isFalse(first) === true) {
                return first;
              }
              return this.visit(node.children[1], value);
            case "NotExpression":
              first = this.visit(node.children[0], value);
              return isFalse(first);
            case "Literal":
              return node.value;
            case TOK_PIPE:
              left = this.visit(node.children[0], value);
              return this.visit(node.children[1], left);
            case TOK_CURRENT:
              return value;
            case "Function":
              var resolvedArgs = [];
              for (i = 0; i < node.children.length; i++) {
                  resolvedArgs.push(this.visit(node.children[i], value));
              }
              return this.runtime.callFunction(node.name, resolvedArgs);
            case "ExpressionReference":
              var refNode = node.children[0];
              refNode.jmespathType = TOK_EXPREF;
              return refNode;
            default:
              throw new Error("Unknown node type: " + node.type);
          }
      },

      computeSliceParams: function(arrayLength, sliceParams) {
        var start = sliceParams[0];
        var stop = sliceParams[1];
        var step = sliceParams[2];
        var computed = [null, null, null];
        if (step === null) {
          step = 1;
        } else if (step === 0) {
          var error = new Error("Invalid slice, step cannot be 0");
          error.name = "RuntimeError";
          throw error;
        }
        var stepValueNegative = step < 0 ? true : false;

        if (start === null) {
            start = stepValueNegative ? arrayLength - 1 : 0;
        } else {
            start = this.capSliceRange(arrayLength, start, step);
        }

        if (stop === null) {
            stop = stepValueNegative ? -1 : arrayLength;
        } else {
            stop = this.capSliceRange(arrayLength, stop, step);
        }
        computed[0] = start;
        computed[1] = stop;
        computed[2] = step;
        return computed;
      },

      capSliceRange: function(arrayLength, actualValue, step) {
          if (actualValue < 0) {
              actualValue += arrayLength;
              if (actualValue < 0) {
                  actualValue = step < 0 ? -1 : 0;
              }
          } else if (actualValue >= arrayLength) {
              actualValue = step < 0 ? arrayLength - 1 : arrayLength;
          }
          return actualValue;
      }

  };

  function Runtime(interpreter) {
    this._interpreter = interpreter;
    this.functionTable = {
        abs: {_func: this._functionAbs, _signature: [{types: [TYPE_NUMBER]}]},
        avg: {_func: this._functionAvg, _signature: [{types: [TYPE_ARRAY_NUMBER]}]},
        ceil: {_func: this._functionCeil, _signature: [{types: [TYPE_NUMBER]}]},
        contains: {
            _func: this._functionContains,
            _signature: [{types: [TYPE_STRING, TYPE_ARRAY]},
                        {types: [TYPE_ANY]}]},
        "ends_with": {
            _func: this._functionEndsWith,
            _signature: [{types: [TYPE_STRING]}, {types: [TYPE_STRING]}]},
        floor: {_func: this._functionFloor, _signature: [{types: [TYPE_NUMBER]}]},
        length: {
            _func: this._functionLength,
            _signature: [{types: [TYPE_STRING, TYPE_ARRAY, TYPE_OBJECT]}]},
        map: {
            _func: this._functionMap,
            _signature: [{types: [TYPE_EXPREF]}, {types: [TYPE_ARRAY]}]},
        max: {
            _func: this._functionMax,
            _signature: [{types: [TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING]}]},
        "merge": {
            _func: this._functionMerge,
            _signature: [{types: [TYPE_OBJECT], variadic: true}]
        },
        "max_by": {
          _func: this._functionMaxBy,
          _signature: [{types: [TYPE_ARRAY]}, {types: [TYPE_EXPREF]}]
        },
        sum: {_func: this._functionSum, _signature: [{types: [TYPE_ARRAY_NUMBER]}]},
        "starts_with": {
            _func: this._functionStartsWith,
            _signature: [{types: [TYPE_STRING]}, {types: [TYPE_STRING]}]},
        min: {
            _func: this._functionMin,
            _signature: [{types: [TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING]}]},
        "min_by": {
          _func: this._functionMinBy,
          _signature: [{types: [TYPE_ARRAY]}, {types: [TYPE_EXPREF]}]
        },
        type: {_func: this._functionType, _signature: [{types: [TYPE_ANY]}]},
        keys: {_func: this._functionKeys, _signature: [{types: [TYPE_OBJECT]}]},
        values: {_func: this._functionValues, _signature: [{types: [TYPE_OBJECT]}]},
        sort: {_func: this._functionSort, _signature: [{types: [TYPE_ARRAY_STRING, TYPE_ARRAY_NUMBER]}]},
        "sort_by": {
          _func: this._functionSortBy,
          _signature: [{types: [TYPE_ARRAY]}, {types: [TYPE_EXPREF]}]
        },
        join: {
            _func: this._functionJoin,
            _signature: [
                {types: [TYPE_STRING]},
                {types: [TYPE_ARRAY_STRING]}
            ]
        },
        reverse: {
            _func: this._functionReverse,
            _signature: [{types: [TYPE_STRING, TYPE_ARRAY]}]},
        "to_array": {_func: this._functionToArray, _signature: [{types: [TYPE_ANY]}]},
        "to_string": {_func: this._functionToString, _signature: [{types: [TYPE_ANY]}]},
        "to_number": {_func: this._functionToNumber, _signature: [{types: [TYPE_ANY]}]},
        "not_null": {
            _func: this._functionNotNull,
            _signature: [{types: [TYPE_ANY], variadic: true}]
        }
    };
  }

  Runtime.prototype = {
    callFunction: function(name, resolvedArgs) {
      var functionEntry = this.functionTable[name];
      if (functionEntry === undefined) {
          throw new Error("Unknown function: " + name + "()");
      }
      this._validateArgs(name, resolvedArgs, functionEntry._signature);
      return functionEntry._func.call(this, resolvedArgs);
    },

    _validateArgs: function(name, args, signature) {
        var pluralized;
        if (signature[signature.length - 1].variadic) {
            if (args.length < signature.length) {
                pluralized = signature.length === 1 ? " argument" : " arguments";
                throw new Error("ArgumentError: " + name + "() " +
                                "takes at least" + signature.length + pluralized +
                                " but received " + args.length);
            }
        } else if (args.length !== signature.length) {
            pluralized = signature.length === 1 ? " argument" : " arguments";
            throw new Error("ArgumentError: " + name + "() " +
                            "takes " + signature.length + pluralized +
                            " but received " + args.length);
        }
        var currentSpec;
        var actualType;
        var typeMatched;
        for (var i = 0; i < signature.length; i++) {
            typeMatched = false;
            currentSpec = signature[i].types;
            actualType = this._getTypeName(args[i]);
            for (var j = 0; j < currentSpec.length; j++) {
                if (this._typeMatches(actualType, currentSpec[j], args[i])) {
                    typeMatched = true;
                    break;
                }
            }
            if (!typeMatched) {
                throw new Error("TypeError: " + name + "() " +
                                "expected argument " + (i + 1) +
                                " to be type " + currentSpec +
                                " but received type " + actualType +
                                " instead.");
            }
        }
    },

    _typeMatches: function(actual, expected, argValue) {
        if (expected === TYPE_ANY) {
            return true;
        }
        if (expected === TYPE_ARRAY_STRING ||
            expected === TYPE_ARRAY_NUMBER ||
            expected === TYPE_ARRAY) {
            if (expected === TYPE_ARRAY) {
                return actual === TYPE_ARRAY;
            } else if (actual === TYPE_ARRAY) {
                var subtype;
                if (expected === TYPE_ARRAY_NUMBER) {
                  subtype = TYPE_NUMBER;
                } else if (expected === TYPE_ARRAY_STRING) {
                  subtype = TYPE_STRING;
                }
                for (var i = 0; i < argValue.length; i++) {
                    if (!this._typeMatches(
                            this._getTypeName(argValue[i]), subtype,
                                             argValue[i])) {
                        return false;
                    }
                }
                return true;
            }
        } else {
            return actual === expected;
        }
    },
    _getTypeName: function(obj) {
        switch (Object.prototype.toString.call(obj)) {
            case "[object String]":
              return TYPE_STRING;
            case "[object Number]":
              return TYPE_NUMBER;
            case "[object Array]":
              return TYPE_ARRAY;
            case "[object Boolean]":
              return TYPE_BOOLEAN;
            case "[object Null]":
              return TYPE_NULL;
            case "[object Object]":
              if (obj.jmespathType === TOK_EXPREF) {
                return TYPE_EXPREF;
              } else {
                return TYPE_OBJECT;
              }
        }
    },

    _functionStartsWith: function(resolvedArgs) {
        return resolvedArgs[0].lastIndexOf(resolvedArgs[1]) === 0;
    },

    _functionEndsWith: function(resolvedArgs) {
        var searchStr = resolvedArgs[0];
        var suffix = resolvedArgs[1];
        return searchStr.indexOf(suffix, searchStr.length - suffix.length) !== -1;
    },

    _functionReverse: function(resolvedArgs) {
        var typeName = this._getTypeName(resolvedArgs[0]);
        if (typeName === TYPE_STRING) {
          var originalStr = resolvedArgs[0];
          var reversedStr = "";
          for (var i = originalStr.length - 1; i >= 0; i--) {
              reversedStr += originalStr[i];
          }
          return reversedStr;
        } else {
          var reversedArray = resolvedArgs[0].slice(0);
          reversedArray.reverse();
          return reversedArray;
        }
    },

    _functionAbs: function(resolvedArgs) {
      return Math.abs(resolvedArgs[0]);
    },

    _functionCeil: function(resolvedArgs) {
        return Math.ceil(resolvedArgs[0]);
    },

    _functionAvg: function(resolvedArgs) {
        var sum = 0;
        var inputArray = resolvedArgs[0];
        for (var i = 0; i < inputArray.length; i++) {
            sum += inputArray[i];
        }
        return sum / inputArray.length;
    },

    _functionContains: function(resolvedArgs) {
        return resolvedArgs[0].indexOf(resolvedArgs[1]) >= 0;
    },

    _functionFloor: function(resolvedArgs) {
        return Math.floor(resolvedArgs[0]);
    },

    _functionLength: function(resolvedArgs) {
       if (!isObject(resolvedArgs[0])) {
         return resolvedArgs[0].length;
       } else {
         return Object.keys(resolvedArgs[0]).length;
       }
    },

    _functionMap: function(resolvedArgs) {
      var mapped = [];
      var interpreter = this._interpreter;
      var exprefNode = resolvedArgs[0];
      var elements = resolvedArgs[1];
      for (var i = 0; i < elements.length; i++) {
          mapped.push(interpreter.visit(exprefNode, elements[i]));
      }
      return mapped;
    },

    _functionMerge: function(resolvedArgs) {
      var merged = {};
      for (var i = 0; i < resolvedArgs.length; i++) {
        var current = resolvedArgs[i];
        for (var key in current) {
          merged[key] = current[key];
        }
      }
      return merged;
    },

    _functionMax: function(resolvedArgs) {
      if (resolvedArgs[0].length > 0) {
        var typeName = this._getTypeName(resolvedArgs[0][0]);
        if (typeName === TYPE_NUMBER) {
          return Math.max.apply(Math, resolvedArgs[0]);
        } else {
          var elements = resolvedArgs[0];
          var maxElement = elements[0];
          for (var i = 1; i < elements.length; i++) {
              if (maxElement.localeCompare(elements[i]) < 0) {
                  maxElement = elements[i];
              }
          }
          return maxElement;
        }
      } else {
          return null;
      }
    },

    _functionMin: function(resolvedArgs) {
      if (resolvedArgs[0].length > 0) {
        var typeName = this._getTypeName(resolvedArgs[0][0]);
        if (typeName === TYPE_NUMBER) {
          return Math.min.apply(Math, resolvedArgs[0]);
        } else {
          var elements = resolvedArgs[0];
          var minElement = elements[0];
          for (var i = 1; i < elements.length; i++) {
              if (elements[i].localeCompare(minElement) < 0) {
                  minElement = elements[i];
              }
          }
          return minElement;
        }
      } else {
        return null;
      }
    },

    _functionSum: function(resolvedArgs) {
      var sum = 0;
      var listToSum = resolvedArgs[0];
      for (var i = 0; i < listToSum.length; i++) {
        sum += listToSum[i];
      }
      return sum;
    },

    _functionType: function(resolvedArgs) {
        switch (this._getTypeName(resolvedArgs[0])) {
          case TYPE_NUMBER:
            return "number";
          case TYPE_STRING:
            return "string";
          case TYPE_ARRAY:
            return "array";
          case TYPE_OBJECT:
            return "object";
          case TYPE_BOOLEAN:
            return "boolean";
          case TYPE_EXPREF:
            return "expref";
          case TYPE_NULL:
            return "null";
        }
    },

    _functionKeys: function(resolvedArgs) {
        return Object.keys(resolvedArgs[0]);
    },

    _functionValues: function(resolvedArgs) {
        var obj = resolvedArgs[0];
        var keys = Object.keys(obj);
        var values = [];
        for (var i = 0; i < keys.length; i++) {
            values.push(obj[keys[i]]);
        }
        return values;
    },

    _functionJoin: function(resolvedArgs) {
        var joinChar = resolvedArgs[0];
        var listJoin = resolvedArgs[1];
        return listJoin.join(joinChar);
    },

    _functionToArray: function(resolvedArgs) {
        if (this._getTypeName(resolvedArgs[0]) === TYPE_ARRAY) {
            return resolvedArgs[0];
        } else {
            return [resolvedArgs[0]];
        }
    },

    _functionToString: function(resolvedArgs) {
        if (this._getTypeName(resolvedArgs[0]) === TYPE_STRING) {
            return resolvedArgs[0];
        } else {
            return JSON.stringify(resolvedArgs[0]);
        }
    },

    _functionToNumber: function(resolvedArgs) {
        var typeName = this._getTypeName(resolvedArgs[0]);
        var convertedValue;
        if (typeName === TYPE_NUMBER) {
            return resolvedArgs[0];
        } else if (typeName === TYPE_STRING) {
            convertedValue = +resolvedArgs[0];
            if (!isNaN(convertedValue)) {
                return convertedValue;
            }
        }
        return null;
    },

    _functionNotNull: function(resolvedArgs) {
        for (var i = 0; i < resolvedArgs.length; i++) {
            if (this._getTypeName(resolvedArgs[i]) !== TYPE_NULL) {
                return resolvedArgs[i];
            }
        }
        return null;
    },

    _functionSort: function(resolvedArgs) {
        var sortedArray = resolvedArgs[0].slice(0);
        sortedArray.sort();
        return sortedArray;
    },

    _functionSortBy: function(resolvedArgs) {
        var sortedArray = resolvedArgs[0].slice(0);
        if (sortedArray.length === 0) {
            return sortedArray;
        }
        var interpreter = this._interpreter;
        var exprefNode = resolvedArgs[1];
        var requiredType = this._getTypeName(
            interpreter.visit(exprefNode, sortedArray[0]));
        if ([TYPE_NUMBER, TYPE_STRING].indexOf(requiredType) < 0) {
            throw new Error("TypeError");
        }
        var that = this;
        var decorated = [];
        for (var i = 0; i < sortedArray.length; i++) {
          decorated.push([i, sortedArray[i]]);
        }
        decorated.sort(function(a, b) {
          var exprA = interpreter.visit(exprefNode, a[1]);
          var exprB = interpreter.visit(exprefNode, b[1]);
          if (that._getTypeName(exprA) !== requiredType) {
              throw new Error(
                  "TypeError: expected " + requiredType + ", received " +
                  that._getTypeName(exprA));
          } else if (that._getTypeName(exprB) !== requiredType) {
              throw new Error(
                  "TypeError: expected " + requiredType + ", received " +
                  that._getTypeName(exprB));
          }
          if (exprA > exprB) {
            return 1;
          } else if (exprA < exprB) {
            return -1;
          } else {
            return a[0] - b[0];
          }
        });
        for (var j = 0; j < decorated.length; j++) {
          sortedArray[j] = decorated[j][1];
        }
        return sortedArray;
    },

    _functionMaxBy: function(resolvedArgs) {
      var exprefNode = resolvedArgs[1];
      var resolvedArray = resolvedArgs[0];
      var keyFunction = this.createKeyFunction(exprefNode, [TYPE_NUMBER, TYPE_STRING]);
      var maxNumber = -Infinity;
      var maxRecord;
      var current;
      for (var i = 0; i < resolvedArray.length; i++) {
        current = keyFunction(resolvedArray[i]);
        if (current > maxNumber) {
          maxNumber = current;
          maxRecord = resolvedArray[i];
        }
      }
      return maxRecord;
    },

    _functionMinBy: function(resolvedArgs) {
      var exprefNode = resolvedArgs[1];
      var resolvedArray = resolvedArgs[0];
      var keyFunction = this.createKeyFunction(exprefNode, [TYPE_NUMBER, TYPE_STRING]);
      var minNumber = Infinity;
      var minRecord;
      var current;
      for (var i = 0; i < resolvedArray.length; i++) {
        current = keyFunction(resolvedArray[i]);
        if (current < minNumber) {
          minNumber = current;
          minRecord = resolvedArray[i];
        }
      }
      return minRecord;
    },

    createKeyFunction: function(exprefNode, allowedTypes) {
      var that = this;
      var interpreter = this._interpreter;
      var keyFunc = function(x) {
        var current = interpreter.visit(exprefNode, x);
        if (allowedTypes.indexOf(that._getTypeName(current)) < 0) {
          var msg = "TypeError: expected one of " + allowedTypes +
                    ", received " + that._getTypeName(current);
          throw new Error(msg);
        }
        return current;
      };
      return keyFunc;
    }

  };

  function compile(stream) {
    var parser = new Parser();
    var ast = parser.parse(stream);
    return ast;
  }

  function tokenize(stream) {
      var lexer = new Lexer();
      return lexer.tokenize(stream);
  }

  function search(data, expression) {
      var parser = new Parser();
      var runtime = new Runtime();
      var interpreter = new TreeInterpreter(runtime);
      runtime._interpreter = interpreter;
      var node = parser.parse(expression);
      return interpreter.search(node, data);
  }

  exports.tokenize = tokenize;
  exports.compile = compile;
  exports.search = search;
  exports.strictDeepEqual = strictDeepEqual;
})(typeof exports === "undefined" ? this.jmespath = {} : exports);

},{}],69:[function(require,module,exports){
var arrayEvery = require('../internal/arrayEvery'),
    baseCallback = require('../internal/baseCallback'),
    baseEvery = require('../internal/baseEvery'),
    isArray = require('../lang/isArray');


function every(collection, predicate, thisArg) {
  var func = isArray(collection) ? arrayEvery : baseEvery;
  if (typeof predicate != 'function' || typeof thisArg != 'undefined') {
    predicate = baseCallback(predicate, thisArg, 3);
  }
  return func(collection, predicate);
}

module.exports = every;

},{"../internal/arrayEvery":70,"../internal/baseCallback":72,"../internal/baseEvery":76,"../lang/isArray":103}],70:[function(require,module,exports){

function arrayEvery(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (!predicate(array[index], index, array)) {
      return false;
    }
  }
  return true;
}

module.exports = arrayEvery;

},{}],71:[function(require,module,exports){
var baseCopy = require('./baseCopy'),
    keys = require('../object/keys');


function baseAssign(object, source, customizer) {
  var props = keys(source);
  if (!customizer) {
    return baseCopy(source, object, props);
  }
  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index],
        value = object[key],
        result = customizer(value, source[key], key, object, source);

    if ((result === result ? (result !== value) : (value === value)) ||
        (typeof value == 'undefined' && !(key in object))) {
      object[key] = result;
    }
  }
  return object;
}

module.exports = baseAssign;

},{"../object/keys":112,"./baseCopy":73}],72:[function(require,module,exports){
var baseMatches = require('./baseMatches'),
    baseMatchesProperty = require('./baseMatchesProperty'),
    baseProperty = require('./baseProperty'),
    bindCallback = require('./bindCallback'),
    identity = require('../utility/identity'),
    isBindable = require('./isBindable');


function baseCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (type == 'function') {
    return (typeof thisArg != 'undefined' && isBindable(func))
      ? bindCallback(func, thisArg, argCount)
      : func;
  }
  if (func == null) {
    return identity;
  }
  if (type == 'object') {
    return baseMatches(func);
  }
  return typeof thisArg == 'undefined'
    ? baseProperty(func + '')
    : baseMatchesProperty(func + '', thisArg);
}

module.exports = baseCallback;

},{"../utility/identity":116,"./baseMatches":83,"./baseMatchesProperty":84,"./baseProperty":85,"./bindCallback":88,"./isBindable":93}],73:[function(require,module,exports){

function baseCopy(source, object, props) {
  if (!props) {
    props = object;
    object = {};
  }
  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];
    object[key] = source[key];
  }
  return object;
}

module.exports = baseCopy;

},{}],74:[function(require,module,exports){
(function (global){
var isObject = require('../lang/isObject');


var baseCreate = (function() {
  function Object() {}
  return function(prototype) {
    if (isObject(prototype)) {
      Object.prototype = prototype;
      var result = new Object;
      Object.prototype = null;
    }
    return result || global.Object();
  };
}());

module.exports = baseCreate;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lang/isObject":107}],75:[function(require,module,exports){
var baseForOwn = require('./baseForOwn'),
    isLength = require('./isLength'),
    toObject = require('./toObject');


function baseEach(collection, iteratee) {
  var length = collection ? collection.length : 0;
  if (!isLength(length)) {
    return baseForOwn(collection, iteratee);
  }
  var index = -1,
      iterable = toObject(collection);

  while (++index < length) {
    if (iteratee(iterable[index], index, iterable) === false) {
      break;
    }
  }
  return collection;
}

module.exports = baseEach;

},{"./baseForOwn":78,"./isLength":96,"./toObject":101}],76:[function(require,module,exports){
var baseEach = require('./baseEach');


function baseEvery(collection, predicate) {
  var result = true;
  baseEach(collection, function(value, index, collection) {
    result = !!predicate(value, index, collection);
    return result;
  });
  return result;
}

module.exports = baseEvery;

},{"./baseEach":75}],77:[function(require,module,exports){
var toObject = require('./toObject');


function baseFor(object, iteratee, keysFunc) {
  var index = -1,
      iterable = toObject(object),
      props = keysFunc(object),
      length = props.length;

  while (++index < length) {
    var key = props[index];
    if (iteratee(iterable[key], key, iterable) === false) {
      break;
    }
  }
  return object;
}

module.exports = baseFor;

},{"./toObject":101}],78:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keys = require('../object/keys');


function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"../object/keys":112,"./baseFor":77}],79:[function(require,module,exports){
var baseIsEqualDeep = require('./baseIsEqualDeep');


function baseIsEqual(value, other, customizer, isWhere, stackA, stackB) {
  if (value === other) {
    return value !== 0 || (1 / value == 1 / other);
  }
  var valType = typeof value,
      othType = typeof other;

  if ((valType != 'function' && valType != 'object' && othType != 'function' && othType != 'object') ||
      value == null || other == null) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isWhere, stackA, stackB);
}

module.exports = baseIsEqual;

},{"./baseIsEqualDeep":80}],80:[function(require,module,exports){
var equalArrays = require('./equalArrays'),
    equalByTag = require('./equalByTag'),
    equalObjects = require('./equalObjects'),
    isArray = require('../lang/isArray'),
    isTypedArray = require('../lang/isTypedArray');


var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';


var objectProto = Object.prototype;


var hasOwnProperty = objectProto.hasOwnProperty;


var objToString = objectProto.toString;


function baseIsEqualDeep(object, other, equalFunc, customizer, isWhere, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  var valWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
      othWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

  if (valWrapped || othWrapped) {
    return equalFunc(valWrapped ? object.value() : object, othWrapped ? other.value() : other, customizer, isWhere, stackA, stackB);
  }
  if (!isSameTag) {
    return false;
  }
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isWhere, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

module.exports = baseIsEqualDeep;

},{"../lang/isArray":103,"../lang/isTypedArray":109,"./equalArrays":90,"./equalByTag":91,"./equalObjects":92}],81:[function(require,module,exports){

function baseIsFunction(value) {
  return typeof value == 'function' || false;
}

module.exports = baseIsFunction;

},{}],82:[function(require,module,exports){
var baseIsEqual = require('./baseIsEqual');


var objectProto = Object.prototype;


var hasOwnProperty = objectProto.hasOwnProperty;


function baseIsMatch(object, props, values, strictCompareFlags, customizer) {
  var length = props.length;
  if (object == null) {
    return !length;
  }
  var index = -1,
      noCustomizer = !customizer;

  while (++index < length) {
    if ((noCustomizer && strictCompareFlags[index])
          ? values[index] !== object[props[index]]
          : !hasOwnProperty.call(object, props[index])
        ) {
      return false;
    }
  }
  index = -1;
  while (++index < length) {
    var key = props[index];
    if (noCustomizer && strictCompareFlags[index]) {
      var result = hasOwnProperty.call(object, key);
    } else {
      var objValue = object[key],
          srcValue = values[index];

      result = customizer ? customizer(objValue, srcValue, key) : undefined;
      if (typeof result == 'undefined') {
        result = baseIsEqual(srcValue, objValue, customizer, true);
      }
    }
    if (!result) {
      return false;
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"./baseIsEqual":79}],83:[function(require,module,exports){
var baseIsMatch = require('./baseIsMatch'),
    isStrictComparable = require('./isStrictComparable'),
    keys = require('../object/keys');


var objectProto = Object.prototype;


var hasOwnProperty = objectProto.hasOwnProperty;


function baseMatches(source) {
  var props = keys(source),
      length = props.length;

  if (length == 1) {
    var key = props[0],
        value = source[key];

    if (isStrictComparable(value)) {
      return function(object) {
        return object != null && object[key] === value && hasOwnProperty.call(object, key);
      };
    }
  }
  var values = Array(length),
      strictCompareFlags = Array(length);

  while (length--) {
    value = source[props[length]];
    values[length] = value;
    strictCompareFlags[length] = isStrictComparable(value);
  }
  return function(object) {
    return baseIsMatch(object, props, values, strictCompareFlags);
  };
}

module.exports = baseMatches;

},{"../object/keys":112,"./baseIsMatch":82,"./isStrictComparable":98}],84:[function(require,module,exports){
var baseIsEqual = require('./baseIsEqual'),
    isStrictComparable = require('./isStrictComparable');


function baseMatchesProperty(key, value) {
  if (isStrictComparable(value)) {
    return function(object) {
      return object != null && object[key] === value;
    };
  }
  return function(object) {
    return object != null && baseIsEqual(value, object[key], null, true);
  };
}

module.exports = baseMatchesProperty;

},{"./baseIsEqual":79,"./isStrictComparable":98}],85:[function(require,module,exports){

function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],86:[function(require,module,exports){
var identity = require('../utility/identity'),
    metaMap = require('./metaMap');


var baseSetData = !metaMap ? identity : function(func, data) {
  metaMap.set(func, data);
  return func;
};

module.exports = baseSetData;

},{"../utility/identity":116,"./metaMap":99}],87:[function(require,module,exports){

function baseToString(value) {
  if (typeof value == 'string') {
    return value;
  }
  return value == null ? '' : (value + '');
}

module.exports = baseToString;

},{}],88:[function(require,module,exports){
var identity = require('../utility/identity');


function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (typeof thisArg == 'undefined') {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"../utility/identity":116}],89:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isIterateeCall = require('./isIterateeCall');


function createAssigner(assigner) {
  return function() {
    var args = arguments,
        length = args.length,
        object = args[0];

    if (length < 2 || object == null) {
      return object;
    }
    var customizer = args[length - 2],
        thisArg = args[length - 1],
        guard = args[3];

    if (length > 3 && typeof customizer == 'function') {
      customizer = bindCallback(customizer, thisArg, 5);
      length -= 2;
    } else {
      customizer = (length > 2 && typeof thisArg == 'function') ? thisArg : null;
      length -= (customizer ? 1 : 0);
    }
    if (guard && isIterateeCall(args[1], args[2], guard)) {
      customizer = length == 3 ? null : customizer;
      length = 2;
    }
    var index = 0;
    while (++index < length) {
      var source = args[index];
      if (source) {
        assigner(object, source, customizer);
      }
    }
    return object;
  };
}

module.exports = createAssigner;

},{"./bindCallback":88,"./isIterateeCall":95}],90:[function(require,module,exports){

function equalArrays(array, other, equalFunc, customizer, isWhere, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length,
      result = true;

  if (arrLength != othLength && !(isWhere && othLength > arrLength)) {
    return false;
  }
  while (result && ++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    result = undefined;
    if (customizer) {
      result = isWhere
        ? customizer(othValue, arrValue, index)
        : customizer(arrValue, othValue, index);
    }
    if (typeof result == 'undefined') {
      if (isWhere) {
        var othIndex = othLength;
        while (othIndex--) {
          othValue = other[othIndex];
          result = (arrValue && arrValue === othValue) || equalFunc(arrValue, othValue, customizer, isWhere, stackA, stackB);
          if (result) {
            break;
          }
        }
      } else {
        result = (arrValue && arrValue === othValue) || equalFunc(arrValue, othValue, customizer, isWhere, stackA, stackB);
      }
    }
  }
  return !!result;
}

module.exports = equalArrays;

},{}],91:[function(require,module,exports){

var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';


function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      return (object != +object)
        ? other != +other
        : (object == 0 ? ((1 / object) == (1 / other)) : object == +other);

    case regexpTag:
    case stringTag:
      return object == (other + '');
  }
  return false;
}

module.exports = equalByTag;

},{}],92:[function(require,module,exports){
var keys = require('../object/keys');


var objectProto = Object.prototype;


var hasOwnProperty = objectProto.hasOwnProperty;


function equalObjects(object, other, equalFunc, customizer, isWhere, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isWhere) {
    return false;
  }
  var hasCtor,
      index = -1;

  while (++index < objLength) {
    var key = objProps[index],
        result = hasOwnProperty.call(other, key);

    if (result) {
      var objValue = object[key],
          othValue = other[key];

      result = undefined;
      if (customizer) {
        result = isWhere
          ? customizer(othValue, objValue, key)
          : customizer(objValue, othValue, key);
      }
      if (typeof result == 'undefined') {
        result = (objValue && objValue === othValue) || equalFunc(objValue, othValue, customizer, isWhere, stackA, stackB);
      }
    }
    if (!result) {
      return false;
    }
    hasCtor || (hasCtor = key == 'constructor');
  }
  if (!hasCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

module.exports = equalObjects;

},{"../object/keys":112}],93:[function(require,module,exports){
var baseSetData = require('./baseSetData'),
    isNative = require('../lang/isNative'),
    support = require('../support');


var reFuncName = /^\s*function[ \n\r\t]+\w/;


var reThis = /\bthis\b/;


var fnToString = Function.prototype.toString;


function isBindable(func) {
  var result = !(support.funcNames ? func.name : support.funcDecomp);

  if (!result) {
    var source = fnToString.call(func);
    if (!support.funcNames) {
      result = !reFuncName.test(source);
    }
    if (!result) {
      result = reThis.test(source) || isNative(func);
      baseSetData(func, result);
    }
  }
  return result;
}

module.exports = isBindable;

},{"../lang/isNative":106,"../support":115,"./baseSetData":86}],94:[function(require,module,exports){

var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;


function isIndex(value, length) {
  value = +value;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],95:[function(require,module,exports){
var isIndex = require('./isIndex'),
    isLength = require('./isLength'),
    isObject = require('../lang/isObject');


function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number') {
    var length = object.length,
        prereq = isLength(length) && isIndex(index, length);
  } else {
    prereq = type == 'string' && index in object;
  }
  if (prereq) {
    var other = object[index];
    return value === value ? (value === other) : (other !== other);
  }
  return false;
}

module.exports = isIterateeCall;

},{"../lang/isObject":107,"./isIndex":94,"./isLength":96}],96:[function(require,module,exports){

var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;


function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],97:[function(require,module,exports){

function isObjectLike(value) {
  return (value && typeof value == 'object') || false;
}

module.exports = isObjectLike;

},{}],98:[function(require,module,exports){
var isObject = require('../lang/isObject');


function isStrictComparable(value) {
  return value === value && (value === 0 ? ((1 / value) > 0) : !isObject(value));
}

module.exports = isStrictComparable;

},{"../lang/isObject":107}],99:[function(require,module,exports){
(function (global){
var isNative = require('../lang/isNative');


var WeakMap = isNative(WeakMap = global.WeakMap) && WeakMap;


var metaMap = WeakMap && new WeakMap;

module.exports = metaMap;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lang/isNative":106}],100:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('./isIndex'),
    isLength = require('./isLength'),
    keysIn = require('../object/keysIn'),
    support = require('../support');


var objectProto = Object.prototype;


var hasOwnProperty = objectProto.hasOwnProperty;


function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = length && isLength(length) &&
    (isArray(object) || (support.nonEnumArgs && isArguments(object)));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"../lang/isArguments":102,"../lang/isArray":103,"../object/keysIn":113,"../support":115,"./isIndex":94,"./isLength":96}],101:[function(require,module,exports){
var isObject = require('../lang/isObject');


function toObject(value) {
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"../lang/isObject":107}],102:[function(require,module,exports){
var isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');


var argsTag = '[object Arguments]';


var objectProto = Object.prototype;


var objToString = objectProto.toString;


function isArguments(value) {
  var length = isObjectLike(value) ? value.length : undefined;
  return (isLength(length) && objToString.call(value) == argsTag) || false;
}

module.exports = isArguments;

},{"../internal/isLength":96,"../internal/isObjectLike":97}],103:[function(require,module,exports){
var isLength = require('../internal/isLength'),
    isNative = require('./isNative'),
    isObjectLike = require('../internal/isObjectLike');


var arrayTag = '[object Array]';


var objectProto = Object.prototype;


var objToString = objectProto.toString;


var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;


var isArray = nativeIsArray || function(value) {
  return (isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag) || false;
};

module.exports = isArray;

},{"../internal/isLength":96,"../internal/isObjectLike":97,"./isNative":106}],104:[function(require,module,exports){
var isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isFunction = require('./isFunction'),
    isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike'),
    isString = require('./isString'),
    keys = require('../object/keys');


function isEmpty(value) {
  if (value == null) {
    return true;
  }
  var length = value.length;
  if (isLength(length) && (isArray(value) || isString(value) || isArguments(value) ||
      (isObjectLike(value) && isFunction(value.splice)))) {
    return !length;
  }
  return !keys(value).length;
}

module.exports = isEmpty;

},{"../internal/isLength":96,"../internal/isObjectLike":97,"../object/keys":112,"./isArguments":102,"./isArray":103,"./isFunction":105,"./isString":108}],105:[function(require,module,exports){
(function (global){
var baseIsFunction = require('../internal/baseIsFunction'),
    isNative = require('./isNative');


var funcTag = '[object Function]';


var objectProto = Object.prototype;


var objToString = objectProto.toString;


var Uint8Array = isNative(Uint8Array = global.Uint8Array) && Uint8Array;


var isFunction = !(baseIsFunction(/x/) || (Uint8Array && !baseIsFunction(Uint8Array))) ? baseIsFunction : function(value) {
  return objToString.call(value) == funcTag;
};

module.exports = isFunction;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../internal/baseIsFunction":81,"./isNative":106}],106:[function(require,module,exports){
var escapeRegExp = require('../string/escapeRegExp'),
    isObjectLike = require('../internal/isObjectLike');


var funcTag = '[object Function]';


var reHostCtor = /^\[object .+?Constructor\]$/;


var objectProto = Object.prototype;


var fnToString = Function.prototype.toString;


var objToString = objectProto.toString;


var reNative = RegExp('^' +
  escapeRegExp(objToString)
  .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);


function isNative(value) {
  if (value == null) {
    return false;
  }
  if (objToString.call(value) == funcTag) {
    return reNative.test(fnToString.call(value));
  }
  return (isObjectLike(value) && reHostCtor.test(value)) || false;
}

module.exports = isNative;

},{"../internal/isObjectLike":97,"../string/escapeRegExp":114}],107:[function(require,module,exports){

function isObject(value) {
  var type = typeof value;
  return type == 'function' || (value && type == 'object') || false;
}

module.exports = isObject;

},{}],108:[function(require,module,exports){
var isObjectLike = require('../internal/isObjectLike');


var stringTag = '[object String]';


var objectProto = Object.prototype;


var objToString = objectProto.toString;


function isString(value) {
  return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag) || false;
}

module.exports = isString;

},{"../internal/isObjectLike":97}],109:[function(require,module,exports){
var isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');


var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';


var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;


var objectProto = Object.prototype;


var objToString = objectProto.toString;


function isTypedArray(value) {
  return (isObjectLike(value) && isLength(value.length) && typedArrayTags[objToString.call(value)]) || false;
}

module.exports = isTypedArray;

},{"../internal/isLength":96,"../internal/isObjectLike":97}],110:[function(require,module,exports){
var baseAssign = require('../internal/baseAssign'),
    createAssigner = require('../internal/createAssigner');


var assign = createAssigner(baseAssign);

module.exports = assign;

},{"../internal/baseAssign":71,"../internal/createAssigner":89}],111:[function(require,module,exports){
var baseCopy = require('../internal/baseCopy'),
    baseCreate = require('../internal/baseCreate'),
    isIterateeCall = require('../internal/isIterateeCall'),
    keys = require('./keys');


function create(prototype, properties, guard) {
  var result = baseCreate(prototype);
  if (guard && isIterateeCall(prototype, properties, guard)) {
    properties = null;
  }
  return properties ? baseCopy(properties, result, keys(properties)) : result;
}

module.exports = create;

},{"../internal/baseCopy":73,"../internal/baseCreate":74,"../internal/isIterateeCall":95,"./keys":112}],112:[function(require,module,exports){
var isLength = require('../internal/isLength'),
    isNative = require('../lang/isNative'),
    isObject = require('../lang/isObject'),
    shimKeys = require('../internal/shimKeys');


var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;


var keys = !nativeKeys ? shimKeys : function(object) {
  if (object) {
    var Ctor = object.constructor,
        length = object.length;
  }
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && (length && isLength(length)))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"../internal/isLength":96,"../internal/shimKeys":100,"../lang/isNative":106,"../lang/isObject":107}],113:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('../internal/isIndex'),
    isLength = require('../internal/isLength'),
    isObject = require('../lang/isObject'),
    support = require('../support');


var objectProto = Object.prototype;


var hasOwnProperty = objectProto.hasOwnProperty;


function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || (support.nonEnumArgs && isArguments(object))) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"../internal/isIndex":94,"../internal/isLength":96,"../lang/isArguments":102,"../lang/isArray":103,"../lang/isObject":107,"../support":115}],114:[function(require,module,exports){
var baseToString = require('../internal/baseToString');


var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
    reHasRegExpChars = RegExp(reRegExpChars.source);


function escapeRegExp(string) {
  string = baseToString(string);
  return (string && reHasRegExpChars.test(string))
    ? string.replace(reRegExpChars, '\\$&')
    : string;
}

module.exports = escapeRegExp;

},{"../internal/baseToString":87}],115:[function(require,module,exports){
(function (global){
var isNative = require('./lang/isNative');


var reThis = /\bthis\b/;


var objectProto = Object.prototype;


var document = (document = global.window) && document.document;


var propertyIsEnumerable = objectProto.propertyIsEnumerable;


var support = {};

(function(x) {


  support.funcDecomp = !isNative(global.WinRTError) && reThis.test(function() { return this; });


  support.funcNames = typeof Function.name == 'string';


  try {
    support.dom = document.createDocumentFragment().nodeType === 11;
  } catch(e) {
    support.dom = false;
  }


  try {
    support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);
  } catch(e) {
    support.nonEnumArgs = true;
  }
}(0, 0));

module.exports = support;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lang/isNative":106}],116:[function(require,module,exports){

function identity(value) {
  return value;
}

module.exports = identity;

},{}],117:[function(require,module,exports){
var process = module.exports = {};


var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        return setTimeout(fun, 0);
    }
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        return clearTimeout(marker);
    }
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],118:[function(require,module,exports){
(function (global){

;(function(root) {


	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}


	var punycode,


	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1


	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'


	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators


	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},


	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,


	key;




	function error(type) {
		throw new RangeError(errors[type]);
	}


	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}


	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			result = parts[0] + '@';
			string = parts[1];
		}
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}


	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}


	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}


	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}


	function digitToBasic(digit, flag) {
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}


	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}


	function decode(input) {
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,

		    baseMinusT;


		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}


		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}


	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],

		    inputLength,

		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		input = ucs2decode(input);

		inputLength = input.length;

		n = initialN;
		delta = 0;
		bias = initialBias;

		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;


		if (basicLength) {
			output.push(delimiter);
		}

		while (handledCPCount < inputLength) {

			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}


	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}


	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}




	punycode = {

		'version': '1.4.1',

		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};


	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			freeModule.exports = punycode;
		} else {
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],119:[function(require,module,exports){

'use strict';

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],120:[function(require,module,exports){

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],121:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":119,"./encode":120}],122:[function(require,module,exports){

'use strict';

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (Array.isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

},{}],123:[function(require,module,exports){

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).map(function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (Array.isArray(obj[k])) {
        return obj[k].map(function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

},{}],124:[function(require,module,exports){
arguments[4][121][0].apply(exports,arguments)
},{"./decode":122,"./encode":123,"dup":121}],125:[function(require,module,exports){

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}


var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    autoEscape = ['\''].concat(unwise),
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var rest = url;

  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {



    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    var auth, atSign;
    if (hostEnd === -1) {
      atSign = rest.lastIndexOf('@');
    } else {
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    this.parseHost();

    this.hostname = this.hostname || '';

    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      var domainArray = this.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      this.hostname = newOut.join('.');
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  if (!unsafeProtocol[lowerProto]) {

    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  var hash = rest.indexOf('#');
  if (hash !== -1) {
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  this.href = this.format();
  return this;
};

function urlFormat(obj) {
  if (isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  Object.keys(this).forEach(function(k) {
    result[k] = this[k];
  }, this);

  result.hash = relative.hash;

  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  if (relative.slashes && !relative.protocol) {
    Object.keys(relative).forEach(function(k) {
      if (k !== 'protocol')
        result[k] = relative[k];
    });

    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    if (!slashedProtocol[relative.protocol]) {
      Object.keys(relative).forEach(function(k) {
        result[k] = relative[k];
      });
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
  } else if (relPath.length) {
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    result.pathname = null;
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

function isString(arg) {
  return typeof arg === "string";
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return  arg == null;
}

},{"punycode":118,"querystring":121}],126:[function(require,module,exports){
if (typeof Object.create === 'function') {
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],127:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],128:[function(require,module,exports){
(function (process,global){

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


exports.deprecate = function(fn, msg) {
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};




function inspect(obj, opts) {
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    ctx.showHidden = opts;
  } else if (opts) {
    exports._extend(ctx, opts);
  }
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      value.inspect !== exports.inspect &&
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};



exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":127,"_process":117,"inherits":126}],129:[function(require,module,exports){
(function() {
  var XMLAttribute, create;

  create = require('lodash/object/create');

  module.exports = XMLAttribute = (function() {
    function XMLAttribute(parent, name, value) {
      this.stringify = parent.stringify;
      if (name == null) {
        throw new Error("Missing attribute name of element " + parent.name);
      }
      if (value == null) {
        throw new Error("Missing attribute value for attribute " + name + " of element " + parent.name);
      }
      this.name = this.stringify.attName(name);
      this.value = this.stringify.attValue(value);
    }

    XMLAttribute.prototype.clone = function() {
      return create(XMLAttribute.prototype, this);
    };

    XMLAttribute.prototype.toString = function(options, level) {
      return ' ' + this.name + '="' + this.value + '"';
    };

    return XMLAttribute;

  })();

}).call(this);

},{"lodash/object/create":111}],130:[function(require,module,exports){
(function() {
  var XMLBuilder, XMLDeclaration, XMLDocType, XMLElement, XMLStringifier;

  XMLStringifier = require('./XMLStringifier');

  XMLDeclaration = require('./XMLDeclaration');

  XMLDocType = require('./XMLDocType');

  XMLElement = require('./XMLElement');

  module.exports = XMLBuilder = (function() {
    function XMLBuilder(name, options) {
      var root, temp;
      if (name == null) {
        throw new Error("Root element needs a name");
      }
      if (options == null) {
        options = {};
      }
      this.options = options;
      this.stringify = new XMLStringifier(options);
      temp = new XMLElement(this, 'doc');
      root = temp.element(name);
      root.isRoot = true;
      root.documentObject = this;
      this.rootObject = root;
      if (!options.headless) {
        root.declaration(options);
        if ((options.pubID != null) || (options.sysID != null)) {
          root.doctype(options);
        }
      }
    }

    XMLBuilder.prototype.root = function() {
      return this.rootObject;
    };

    XMLBuilder.prototype.end = function(options) {
      return this.toString(options);
    };

    XMLBuilder.prototype.toString = function(options) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      r = '';
      if (this.xmldec != null) {
        r += this.xmldec.toString(options);
      }
      if (this.doctype != null) {
        r += this.doctype.toString(options);
      }
      r += this.rootObject.toString(options);
      if (pretty && r.slice(-newline.length) === newline) {
        r = r.slice(0, -newline.length);
      }
      return r;
    };

    return XMLBuilder;

  })();

}).call(this);

},{"./XMLDeclaration":137,"./XMLDocType":138,"./XMLElement":139,"./XMLStringifier":143}],131:[function(require,module,exports){
(function() {
  var XMLCData, XMLNode, create,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  create = require('lodash/object/create');

  XMLNode = require('./XMLNode');

  module.exports = XMLCData = (function(superClass) {
    extend(XMLCData, superClass);

    function XMLCData(parent, text) {
      XMLCData.__super__.constructor.call(this, parent);
      if (text == null) {
        throw new Error("Missing CDATA text");
      }
      this.text = this.stringify.cdata(text);
    }

    XMLCData.prototype.clone = function() {
      return create(XMLCData.prototype, this);
    };

    XMLCData.prototype.toString = function(options, level) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += '<![CDATA[' + this.text + ']]>';
      if (pretty) {
        r += newline;
      }
      return r;
    };

    return XMLCData;

  })(XMLNode);

}).call(this);

},{"./XMLNode":140,"lodash/object/create":111}],132:[function(require,module,exports){
(function() {
  var XMLComment, XMLNode, create,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  create = require('lodash/object/create');

  XMLNode = require('./XMLNode');

  module.exports = XMLComment = (function(superClass) {
    extend(XMLComment, superClass);

    function XMLComment(parent, text) {
      XMLComment.__super__.constructor.call(this, parent);
      if (text == null) {
        throw new Error("Missing comment text");
      }
      this.text = this.stringify.comment(text);
    }

    XMLComment.prototype.clone = function() {
      return create(XMLComment.prototype, this);
    };

    XMLComment.prototype.toString = function(options, level) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += '<!-- ' + this.text + ' -->';
      if (pretty) {
        r += newline;
      }
      return r;
    };

    return XMLComment;

  })(XMLNode);

}).call(this);

},{"./XMLNode":140,"lodash/object/create":111}],133:[function(require,module,exports){
(function() {
  var XMLDTDAttList, create;

  create = require('lodash/object/create');

  module.exports = XMLDTDAttList = (function() {
    function XMLDTDAttList(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue) {
      this.stringify = parent.stringify;
      if (elementName == null) {
        throw new Error("Missing DTD element name");
      }
      if (attributeName == null) {
        throw new Error("Missing DTD attribute name");
      }
      if (!attributeType) {
        throw new Error("Missing DTD attribute type");
      }
      if (!defaultValueType) {
        throw new Error("Missing DTD attribute default");
      }
      if (defaultValueType.indexOf('#') !== 0) {
        defaultValueType = '#' + defaultValueType;
      }
      if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) {
        throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT");
      }
      if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) {
        throw new Error("Default value only applies to #FIXED or #DEFAULT");
      }
      this.elementName = this.stringify.eleName(elementName);
      this.attributeName = this.stringify.attName(attributeName);
      this.attributeType = this.stringify.dtdAttType(attributeType);
      this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
      this.defaultValueType = defaultValueType;
    }

    XMLDTDAttList.prototype.clone = function() {
      return create(XMLDTDAttList.prototype, this);
    };

    XMLDTDAttList.prototype.toString = function(options, level) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += '<!ATTLIST ' + this.elementName + ' ' + this.attributeName + ' ' + this.attributeType;
      if (this.defaultValueType !== '#DEFAULT') {
        r += ' ' + this.defaultValueType;
      }
      if (this.defaultValue) {
        r += ' "' + this.defaultValue + '"';
      }
      r += '>';
      if (pretty) {
        r += newline;
      }
      return r;
    };

    return XMLDTDAttList;

  })();

}).call(this);

},{"lodash/object/create":111}],134:[function(require,module,exports){
(function() {
  var XMLDTDElement, create, isArray;

  create = require('lodash/object/create');

  isArray = require('lodash/lang/isArray');

  module.exports = XMLDTDElement = (function() {
    function XMLDTDElement(parent, name, value) {
      this.stringify = parent.stringify;
      if (name == null) {
        throw new Error("Missing DTD element name");
      }
      if (!value) {
        value = '(#PCDATA)';
      }
      if (isArray(value)) {
        value = '(' + value.join(',') + ')';
      }
      this.name = this.stringify.eleName(name);
      this.value = this.stringify.dtdElementValue(value);
    }

    XMLDTDElement.prototype.clone = function() {
      return create(XMLDTDElement.prototype, this);
    };

    XMLDTDElement.prototype.toString = function(options, level) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += '<!ELEMENT ' + this.name + ' ' + this.value + '>';
      if (pretty) {
        r += newline;
      }
      return r;
    };

    return XMLDTDElement;

  })();

}).call(this);

},{"lodash/lang/isArray":103,"lodash/object/create":111}],135:[function(require,module,exports){
(function() {
  var XMLDTDEntity, create, isObject;

  create = require('lodash/object/create');

  isObject = require('lodash/lang/isObject');

  module.exports = XMLDTDEntity = (function() {
    function XMLDTDEntity(parent, pe, name, value) {
      this.stringify = parent.stringify;
      if (name == null) {
        throw new Error("Missing entity name");
      }
      if (value == null) {
        throw new Error("Missing entity value");
      }
      this.pe = !!pe;
      this.name = this.stringify.eleName(name);
      if (!isObject(value)) {
        this.value = this.stringify.dtdEntityValue(value);
      } else {
        if (!value.pubID && !value.sysID) {
          throw new Error("Public and/or system identifiers are required for an external entity");
        }
        if (value.pubID && !value.sysID) {
          throw new Error("System identifier is required for a public external entity");
        }
        if (value.pubID != null) {
          this.pubID = this.stringify.dtdPubID(value.pubID);
        }
        if (value.sysID != null) {
          this.sysID = this.stringify.dtdSysID(value.sysID);
        }
        if (value.nData != null) {
          this.nData = this.stringify.dtdNData(value.nData);
        }
        if (this.pe && this.nData) {
          throw new Error("Notation declaration is not allowed in a parameter entity");
        }
      }
    }

    XMLDTDEntity.prototype.clone = function() {
      return create(XMLDTDEntity.prototype, this);
    };

    XMLDTDEntity.prototype.toString = function(options, level) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += '<!ENTITY';
      if (this.pe) {
        r += ' %';
      }
      r += ' ' + this.name;
      if (this.value) {
        r += ' "' + this.value + '"';
      } else {
        if (this.pubID && this.sysID) {
          r += ' PUBLIC "' + this.pubID + '" "' + this.sysID + '"';
        } else if (this.sysID) {
          r += ' SYSTEM "' + this.sysID + '"';
        }
        if (this.nData) {
          r += ' NDATA ' + this.nData;
        }
      }
      r += '>';
      if (pretty) {
        r += newline;
      }
      return r;
    };

    return XMLDTDEntity;

  })();

}).call(this);

},{"lodash/lang/isObject":107,"lodash/object/create":111}],136:[function(require,module,exports){
(function() {
  var XMLDTDNotation, create;

  create = require('lodash/object/create');

  module.exports = XMLDTDNotation = (function() {
    function XMLDTDNotation(parent, name, value) {
      this.stringify = parent.stringify;
      if (name == null) {
        throw new Error("Missing notation name");
      }
      if (!value.pubID && !value.sysID) {
        throw new Error("Public or system identifiers are required for an external entity");
      }
      this.name = this.stringify.eleName(name);
      if (value.pubID != null) {
        this.pubID = this.stringify.dtdPubID(value.pubID);
      }
      if (value.sysID != null) {
        this.sysID = this.stringify.dtdSysID(value.sysID);
      }
    }

    XMLDTDNotation.prototype.clone = function() {
      return create(XMLDTDNotation.prototype, this);
    };

    XMLDTDNotation.prototype.toString = function(options, level) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += '<!NOTATION ' + this.name;
      if (this.pubID && this.sysID) {
        r += ' PUBLIC "' + this.pubID + '" "' + this.sysID + '"';
      } else if (this.pubID) {
        r += ' PUBLIC "' + this.pubID + '"';
      } else if (this.sysID) {
        r += ' SYSTEM "' + this.sysID + '"';
      }
      r += '>';
      if (pretty) {
        r += newline;
      }
      return r;
    };

    return XMLDTDNotation;

  })();

}).call(this);

},{"lodash/object/create":111}],137:[function(require,module,exports){
(function() {
  var XMLDeclaration, XMLNode, create, isObject,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  create = require('lodash/object/create');

  isObject = require('lodash/lang/isObject');

  XMLNode = require('./XMLNode');

  module.exports = XMLDeclaration = (function(superClass) {
    extend(XMLDeclaration, superClass);

    function XMLDeclaration(parent, version, encoding, standalone) {
      var ref;
      XMLDeclaration.__super__.constructor.call(this, parent);
      if (isObject(version)) {
        ref = version, version = ref.version, encoding = ref.encoding, standalone = ref.standalone;
      }
      if (!version) {
        version = '1.0';
      }
      if (version != null) {
        this.version = this.stringify.xmlVersion(version);
      }
      if (encoding != null) {
        this.encoding = this.stringify.xmlEncoding(encoding);
      }
      if (standalone != null) {
        this.standalone = this.stringify.xmlStandalone(standalone);
      }
    }

    XMLDeclaration.prototype.clone = function() {
      return create(XMLDeclaration.prototype, this);
    };

    XMLDeclaration.prototype.toString = function(options, level) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += '<?xml';
      if (this.version != null) {
        r += ' version="' + this.version + '"';
      }
      if (this.encoding != null) {
        r += ' encoding="' + this.encoding + '"';
      }
      if (this.standalone != null) {
        r += ' standalone="' + this.standalone + '"';
      }
      r += '?>';
      if (pretty) {
        r += newline;
      }
      return r;
    };

    return XMLDeclaration;

  })(XMLNode);

}).call(this);

},{"./XMLNode":140,"lodash/lang/isObject":107,"lodash/object/create":111}],138:[function(require,module,exports){
(function() {
  var XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDocType, XMLProcessingInstruction, create, isObject;

  create = require('lodash/object/create');

  isObject = require('lodash/lang/isObject');

  XMLCData = require('./XMLCData');

  XMLComment = require('./XMLComment');

  XMLDTDAttList = require('./XMLDTDAttList');

  XMLDTDEntity = require('./XMLDTDEntity');

  XMLDTDElement = require('./XMLDTDElement');

  XMLDTDNotation = require('./XMLDTDNotation');

  XMLProcessingInstruction = require('./XMLProcessingInstruction');

  module.exports = XMLDocType = (function() {
    function XMLDocType(parent, pubID, sysID) {
      var ref, ref1;
      this.documentObject = parent;
      this.stringify = this.documentObject.stringify;
      this.children = [];
      if (isObject(pubID)) {
        ref = pubID, pubID = ref.pubID, sysID = ref.sysID;
      }
      if (sysID == null) {
        ref1 = [pubID, sysID], sysID = ref1[0], pubID = ref1[1];
      }
      if (pubID != null) {
        this.pubID = this.stringify.dtdPubID(pubID);
      }
      if (sysID != null) {
        this.sysID = this.stringify.dtdSysID(sysID);
      }
    }

    XMLDocType.prototype.clone = function() {
      return create(XMLDocType.prototype, this);
    };

    XMLDocType.prototype.element = function(name, value) {
      var child;
      child = new XMLDTDElement(this, name, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
      var child;
      child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.entity = function(name, value) {
      var child;
      child = new XMLDTDEntity(this, false, name, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.pEntity = function(name, value) {
      var child;
      child = new XMLDTDEntity(this, true, name, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.notation = function(name, value) {
      var child;
      child = new XMLDTDNotation(this, name, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.cdata = function(value) {
      var child;
      child = new XMLCData(this, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.comment = function(value) {
      var child;
      child = new XMLComment(this, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.instruction = function(target, value) {
      var child;
      child = new XMLProcessingInstruction(this, target, value);
      this.children.push(child);
      return this;
    };

    XMLDocType.prototype.root = function() {
      return this.documentObject.root();
    };

    XMLDocType.prototype.document = function() {
      return this.documentObject;
    };

    XMLDocType.prototype.toString = function(options, level) {
      var child, i, indent, len, newline, offset, pretty, r, ref, ref1, ref2, ref3, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += '<!DOCTYPE ' + this.root().name;
      if (this.pubID && this.sysID) {
        r += ' PUBLIC "' + this.pubID + '" "' + this.sysID + '"';
      } else if (this.sysID) {
        r += ' SYSTEM "' + this.sysID + '"';
      }
      if (this.children.length > 0) {
        r += ' [';
        if (pretty) {
          r += newline;
        }
        ref3 = this.children;
        for (i = 0, len = ref3.length; i < len; i++) {
          child = ref3[i];
          r += child.toString(options, level + 1);
        }
        r += ']';
      }
      r += '>';
      if (pretty) {
        r += newline;
      }
      return r;
    };

    XMLDocType.prototype.ele = function(name, value) {
      return this.element(name, value);
    };

    XMLDocType.prototype.att = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
      return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
    };

    XMLDocType.prototype.ent = function(name, value) {
      return this.entity(name, value);
    };

    XMLDocType.prototype.pent = function(name, value) {
      return this.pEntity(name, value);
    };

    XMLDocType.prototype.not = function(name, value) {
      return this.notation(name, value);
    };

    XMLDocType.prototype.dat = function(value) {
      return this.cdata(value);
    };

    XMLDocType.prototype.com = function(value) {
      return this.comment(value);
    };

    XMLDocType.prototype.ins = function(target, value) {
      return this.instruction(target, value);
    };

    XMLDocType.prototype.up = function() {
      return this.root();
    };

    XMLDocType.prototype.doc = function() {
      return this.document();
    };

    return XMLDocType;

  })();

}).call(this);

},{"./XMLCData":131,"./XMLComment":132,"./XMLDTDAttList":133,"./XMLDTDElement":134,"./XMLDTDEntity":135,"./XMLDTDNotation":136,"./XMLProcessingInstruction":141,"lodash/lang/isObject":107,"lodash/object/create":111}],139:[function(require,module,exports){
(function() {
  var XMLAttribute, XMLElement, XMLNode, XMLProcessingInstruction, create, every, isArray, isFunction, isObject,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  create = require('lodash/object/create');

  isObject = require('lodash/lang/isObject');

  isArray = require('lodash/lang/isArray');

  isFunction = require('lodash/lang/isFunction');

  every = require('lodash/collection/every');

  XMLNode = require('./XMLNode');

  XMLAttribute = require('./XMLAttribute');

  XMLProcessingInstruction = require('./XMLProcessingInstruction');

  module.exports = XMLElement = (function(superClass) {
    extend(XMLElement, superClass);

    function XMLElement(parent, name, attributes) {
      XMLElement.__super__.constructor.call(this, parent);
      if (name == null) {
        throw new Error("Missing element name");
      }
      this.name = this.stringify.eleName(name);
      this.children = [];
      this.instructions = [];
      this.attributes = {};
      if (attributes != null) {
        this.attribute(attributes);
      }
    }

    XMLElement.prototype.clone = function() {
      var att, attName, clonedSelf, i, len, pi, ref, ref1;
      clonedSelf = create(XMLElement.prototype, this);
      if (clonedSelf.isRoot) {
        clonedSelf.documentObject = null;
      }
      clonedSelf.attributes = {};
      ref = this.attributes;
      for (attName in ref) {
        if (!hasProp.call(ref, attName)) continue;
        att = ref[attName];
        clonedSelf.attributes[attName] = att.clone();
      }
      clonedSelf.instructions = [];
      ref1 = this.instructions;
      for (i = 0, len = ref1.length; i < len; i++) {
        pi = ref1[i];
        clonedSelf.instructions.push(pi.clone());
      }
      clonedSelf.children = [];
      this.children.forEach(function(child) {
        var clonedChild;
        clonedChild = child.clone();
        clonedChild.parent = clonedSelf;
        return clonedSelf.children.push(clonedChild);
      });
      return clonedSelf;
    };

    XMLElement.prototype.attribute = function(name, value) {
      var attName, attValue;
      if (name != null) {
        name = name.valueOf();
      }
      if (isObject(name)) {
        for (attName in name) {
          if (!hasProp.call(name, attName)) continue;
          attValue = name[attName];
          this.attribute(attName, attValue);
        }
      } else {
        if (isFunction(value)) {
          value = value.apply();
        }
        if (!this.options.skipNullAttributes || (value != null)) {
          this.attributes[name] = new XMLAttribute(this, name, value);
        }
      }
      return this;
    };

    XMLElement.prototype.removeAttribute = function(name) {
      var attName, i, len;
      if (name == null) {
        throw new Error("Missing attribute name");
      }
      name = name.valueOf();
      if (isArray(name)) {
        for (i = 0, len = name.length; i < len; i++) {
          attName = name[i];
          delete this.attributes[attName];
        }
      } else {
        delete this.attributes[name];
      }
      return this;
    };

    XMLElement.prototype.instruction = function(target, value) {
      var i, insTarget, insValue, instruction, len;
      if (target != null) {
        target = target.valueOf();
      }
      if (value != null) {
        value = value.valueOf();
      }
      if (isArray(target)) {
        for (i = 0, len = target.length; i < len; i++) {
          insTarget = target[i];
          this.instruction(insTarget);
        }
      } else if (isObject(target)) {
        for (insTarget in target) {
          if (!hasProp.call(target, insTarget)) continue;
          insValue = target[insTarget];
          this.instruction(insTarget, insValue);
        }
      } else {
        if (isFunction(value)) {
          value = value.apply();
        }
        instruction = new XMLProcessingInstruction(this, target, value);
        this.instructions.push(instruction);
      }
      return this;
    };

    XMLElement.prototype.toString = function(options, level) {
      var att, child, i, indent, instruction, j, len, len1, name, newline, offset, pretty, r, ref, ref1, ref2, ref3, ref4, ref5, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      ref3 = this.instructions;
      for (i = 0, len = ref3.length; i < len; i++) {
        instruction = ref3[i];
        r += instruction.toString(options, level + 1);
      }
      if (pretty) {
        r += space;
      }
      r += '<' + this.name;
      ref4 = this.attributes;
      for (name in ref4) {
        if (!hasProp.call(ref4, name)) continue;
        att = ref4[name];
        r += att.toString(options);
      }
      if (this.children.length === 0 || every(this.children, function(e) {
        return e.value === '';
      })) {
        r += '/>';
        if (pretty) {
          r += newline;
        }
      } else if (pretty && this.children.length === 1 && (this.children[0].value != null)) {
        r += '>';
        r += this.children[0].value;
        r += '</' + this.name + '>';
        r += newline;
      } else {
        r += '>';
        if (pretty) {
          r += newline;
        }
        ref5 = this.children;
        for (j = 0, len1 = ref5.length; j < len1; j++) {
          child = ref5[j];
          r += child.toString(options, level + 1);
        }
        if (pretty) {
          r += space;
        }
        r += '</' + this.name + '>';
        if (pretty) {
          r += newline;
        }
      }
      return r;
    };

    XMLElement.prototype.att = function(name, value) {
      return this.attribute(name, value);
    };

    XMLElement.prototype.ins = function(target, value) {
      return this.instruction(target, value);
    };

    XMLElement.prototype.a = function(name, value) {
      return this.attribute(name, value);
    };

    XMLElement.prototype.i = function(target, value) {
      return this.instruction(target, value);
    };

    return XMLElement;

  })(XMLNode);

}).call(this);

},{"./XMLAttribute":129,"./XMLNode":140,"./XMLProcessingInstruction":141,"lodash/collection/every":69,"lodash/lang/isArray":103,"lodash/lang/isFunction":105,"lodash/lang/isObject":107,"lodash/object/create":111}],140:[function(require,module,exports){
(function() {
  var XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLElement, XMLNode, XMLRaw, XMLText, isArray, isEmpty, isFunction, isObject,
    hasProp = {}.hasOwnProperty;

  isObject = require('lodash/lang/isObject');

  isArray = require('lodash/lang/isArray');

  isFunction = require('lodash/lang/isFunction');

  isEmpty = require('lodash/lang/isEmpty');

  XMLElement = null;

  XMLCData = null;

  XMLComment = null;

  XMLDeclaration = null;

  XMLDocType = null;

  XMLRaw = null;

  XMLText = null;

  module.exports = XMLNode = (function() {
    function XMLNode(parent) {
      this.parent = parent;
      this.options = this.parent.options;
      this.stringify = this.parent.stringify;
      if (XMLElement === null) {
        XMLElement = require('./XMLElement');
        XMLCData = require('./XMLCData');
        XMLComment = require('./XMLComment');
        XMLDeclaration = require('./XMLDeclaration');
        XMLDocType = require('./XMLDocType');
        XMLRaw = require('./XMLRaw');
        XMLText = require('./XMLText');
      }
    }

    XMLNode.prototype.clone = function() {
      throw new Error("Cannot clone generic XMLNode");
    };

    XMLNode.prototype.element = function(name, attributes, text) {
      var item, j, key, lastChild, len, ref, val;
      lastChild = null;
      if (attributes == null) {
        attributes = {};
      }
      attributes = attributes.valueOf();
      if (!isObject(attributes)) {
        ref = [attributes, text], text = ref[0], attributes = ref[1];
      }
      if (name != null) {
        name = name.valueOf();
      }
      if (isArray(name)) {
        for (j = 0, len = name.length; j < len; j++) {
          item = name[j];
          lastChild = this.element(item);
        }
      } else if (isFunction(name)) {
        lastChild = this.element(name.apply());
      } else if (isObject(name)) {
        for (key in name) {
          if (!hasProp.call(name, key)) continue;
          val = name[key];
          if (isFunction(val)) {
            val = val.apply();
          }
          if ((isObject(val)) && (isEmpty(val))) {
            val = null;
          }
          if (!this.options.ignoreDecorators && this.stringify.convertAttKey && key.indexOf(this.stringify.convertAttKey) === 0) {
            lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
          } else if (!this.options.ignoreDecorators && this.stringify.convertPIKey && key.indexOf(this.stringify.convertPIKey) === 0) {
            lastChild = this.instruction(key.substr(this.stringify.convertPIKey.length), val);
          } else if (isObject(val)) {
            if (!this.options.ignoreDecorators && this.stringify.convertListKey && key.indexOf(this.stringify.convertListKey) === 0 && isArray(val)) {
              lastChild = this.element(val);
            } else {
              lastChild = this.element(key);
              lastChild.element(val);
            }
          } else {
            lastChild = this.element(key, val);
          }
        }
      } else {
        if (!this.options.ignoreDecorators && this.stringify.convertTextKey && name.indexOf(this.stringify.convertTextKey) === 0) {
          lastChild = this.text(text);
        } else if (!this.options.ignoreDecorators && this.stringify.convertCDataKey && name.indexOf(this.stringify.convertCDataKey) === 0) {
          lastChild = this.cdata(text);
        } else if (!this.options.ignoreDecorators && this.stringify.convertCommentKey && name.indexOf(this.stringify.convertCommentKey) === 0) {
          lastChild = this.comment(text);
        } else if (!this.options.ignoreDecorators && this.stringify.convertRawKey && name.indexOf(this.stringify.convertRawKey) === 0) {
          lastChild = this.raw(text);
        } else {
          lastChild = this.node(name, attributes, text);
        }
      }
      if (lastChild == null) {
        throw new Error("Could not create any elements with: " + name);
      }
      return lastChild;
    };

    XMLNode.prototype.insertBefore = function(name, attributes, text) {
      var child, i, removed;
      if (this.isRoot) {
        throw new Error("Cannot insert elements at root level");
      }
      i = this.parent.children.indexOf(this);
      removed = this.parent.children.splice(i);
      child = this.parent.element(name, attributes, text);
      Array.prototype.push.apply(this.parent.children, removed);
      return child;
    };

    XMLNode.prototype.insertAfter = function(name, attributes, text) {
      var child, i, removed;
      if (this.isRoot) {
        throw new Error("Cannot insert elements at root level");
      }
      i = this.parent.children.indexOf(this);
      removed = this.parent.children.splice(i + 1);
      child = this.parent.element(name, attributes, text);
      Array.prototype.push.apply(this.parent.children, removed);
      return child;
    };

    XMLNode.prototype.remove = function() {
      var i, ref;
      if (this.isRoot) {
        throw new Error("Cannot remove the root element");
      }
      i = this.parent.children.indexOf(this);
      [].splice.apply(this.parent.children, [i, i - i + 1].concat(ref = [])), ref;
      return this.parent;
    };

    XMLNode.prototype.node = function(name, attributes, text) {
      var child, ref;
      if (name != null) {
        name = name.valueOf();
      }
      if (attributes == null) {
        attributes = {};
      }
      attributes = attributes.valueOf();
      if (!isObject(attributes)) {
        ref = [attributes, text], text = ref[0], attributes = ref[1];
      }
      child = new XMLElement(this, name, attributes);
      if (text != null) {
        child.text(text);
      }
      this.children.push(child);
      return child;
    };

    XMLNode.prototype.text = function(value) {
      var child;
      child = new XMLText(this, value);
      this.children.push(child);
      return this;
    };

    XMLNode.prototype.cdata = function(value) {
      var child;
      child = new XMLCData(this, value);
      this.children.push(child);
      return this;
    };

    XMLNode.prototype.comment = function(value) {
      var child;
      child = new XMLComment(this, value);
      this.children.push(child);
      return this;
    };

    XMLNode.prototype.raw = function(value) {
      var child;
      child = new XMLRaw(this, value);
      this.children.push(child);
      return this;
    };

    XMLNode.prototype.declaration = function(version, encoding, standalone) {
      var doc, xmldec;
      doc = this.document();
      xmldec = new XMLDeclaration(doc, version, encoding, standalone);
      doc.xmldec = xmldec;
      return doc.root();
    };

    XMLNode.prototype.doctype = function(pubID, sysID) {
      var doc, doctype;
      doc = this.document();
      doctype = new XMLDocType(doc, pubID, sysID);
      doc.doctype = doctype;
      return doctype;
    };

    XMLNode.prototype.up = function() {
      if (this.isRoot) {
        throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
      }
      return this.parent;
    };

    XMLNode.prototype.root = function() {
      var child;
      if (this.isRoot) {
        return this;
      }
      child = this.parent;
      while (!child.isRoot) {
        child = child.parent;
      }
      return child;
    };

    XMLNode.prototype.document = function() {
      return this.root().documentObject;
    };

    XMLNode.prototype.end = function(options) {
      return this.document().toString(options);
    };

    XMLNode.prototype.prev = function() {
      var i;
      if (this.isRoot) {
        throw new Error("Root node has no siblings");
      }
      i = this.parent.children.indexOf(this);
      if (i < 1) {
        throw new Error("Already at the first node");
      }
      return this.parent.children[i - 1];
    };

    XMLNode.prototype.next = function() {
      var i;
      if (this.isRoot) {
        throw new Error("Root node has no siblings");
      }
      i = this.parent.children.indexOf(this);
      if (i === -1 || i === this.parent.children.length - 1) {
        throw new Error("Already at the last node");
      }
      return this.parent.children[i + 1];
    };

    XMLNode.prototype.importXMLBuilder = function(xmlbuilder) {
      var clonedRoot;
      clonedRoot = xmlbuilder.root().clone();
      clonedRoot.parent = this;
      clonedRoot.isRoot = false;
      this.children.push(clonedRoot);
      return this;
    };

    XMLNode.prototype.ele = function(name, attributes, text) {
      return this.element(name, attributes, text);
    };

    XMLNode.prototype.nod = function(name, attributes, text) {
      return this.node(name, attributes, text);
    };

    XMLNode.prototype.txt = function(value) {
      return this.text(value);
    };

    XMLNode.prototype.dat = function(value) {
      return this.cdata(value);
    };

    XMLNode.prototype.com = function(value) {
      return this.comment(value);
    };

    XMLNode.prototype.doc = function() {
      return this.document();
    };

    XMLNode.prototype.dec = function(version, encoding, standalone) {
      return this.declaration(version, encoding, standalone);
    };

    XMLNode.prototype.dtd = function(pubID, sysID) {
      return this.doctype(pubID, sysID);
    };

    XMLNode.prototype.e = function(name, attributes, text) {
      return this.element(name, attributes, text);
    };

    XMLNode.prototype.n = function(name, attributes, text) {
      return this.node(name, attributes, text);
    };

    XMLNode.prototype.t = function(value) {
      return this.text(value);
    };

    XMLNode.prototype.d = function(value) {
      return this.cdata(value);
    };

    XMLNode.prototype.c = function(value) {
      return this.comment(value);
    };

    XMLNode.prototype.r = function(value) {
      return this.raw(value);
    };

    XMLNode.prototype.u = function() {
      return this.up();
    };

    return XMLNode;

  })();

}).call(this);

},{"./XMLCData":131,"./XMLComment":132,"./XMLDeclaration":137,"./XMLDocType":138,"./XMLElement":139,"./XMLRaw":142,"./XMLText":144,"lodash/lang/isArray":103,"lodash/lang/isEmpty":104,"lodash/lang/isFunction":105,"lodash/lang/isObject":107}],141:[function(require,module,exports){
(function() {
  var XMLProcessingInstruction, create;

  create = require('lodash/object/create');

  module.exports = XMLProcessingInstruction = (function() {
    function XMLProcessingInstruction(parent, target, value) {
      this.stringify = parent.stringify;
      if (target == null) {
        throw new Error("Missing instruction target");
      }
      this.target = this.stringify.insTarget(target);
      if (value) {
        this.value = this.stringify.insValue(value);
      }
    }

    XMLProcessingInstruction.prototype.clone = function() {
      return create(XMLProcessingInstruction.prototype, this);
    };

    XMLProcessingInstruction.prototype.toString = function(options, level) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += '<?';
      r += this.target;
      if (this.value) {
        r += ' ' + this.value;
      }
      r += '?>';
      if (pretty) {
        r += newline;
      }
      return r;
    };

    return XMLProcessingInstruction;

  })();

}).call(this);

},{"lodash/object/create":111}],142:[function(require,module,exports){
(function() {
  var XMLNode, XMLRaw, create,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  create = require('lodash/object/create');

  XMLNode = require('./XMLNode');

  module.exports = XMLRaw = (function(superClass) {
    extend(XMLRaw, superClass);

    function XMLRaw(parent, text) {
      XMLRaw.__super__.constructor.call(this, parent);
      if (text == null) {
        throw new Error("Missing raw text");
      }
      this.value = this.stringify.raw(text);
    }

    XMLRaw.prototype.clone = function() {
      return create(XMLRaw.prototype, this);
    };

    XMLRaw.prototype.toString = function(options, level) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += this.value;
      if (pretty) {
        r += newline;
      }
      return r;
    };

    return XMLRaw;

  })(XMLNode);

}).call(this);

},{"./XMLNode":140,"lodash/object/create":111}],143:[function(require,module,exports){
(function() {
  var XMLStringifier,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    hasProp = {}.hasOwnProperty;

  module.exports = XMLStringifier = (function() {
    function XMLStringifier(options) {
      this.assertLegalChar = bind(this.assertLegalChar, this);
      var key, ref, value;
      this.allowSurrogateChars = options != null ? options.allowSurrogateChars : void 0;
      ref = (options != null ? options.stringify : void 0) || {};
      for (key in ref) {
        if (!hasProp.call(ref, key)) continue;
        value = ref[key];
        this[key] = value;
      }
    }

    XMLStringifier.prototype.eleName = function(val) {
      val = '' + val || '';
      return this.assertLegalChar(val);
    };

    XMLStringifier.prototype.eleText = function(val) {
      val = '' + val || '';
      return this.assertLegalChar(this.elEscape(val));
    };

    XMLStringifier.prototype.cdata = function(val) {
      val = '' + val || '';
      if (val.match(/]]>/)) {
        throw new Error("Invalid CDATA text: " + val);
      }
      return this.assertLegalChar(val);
    };

    XMLStringifier.prototype.comment = function(val) {
      val = '' + val || '';
      if (val.match(/--/)) {
        throw new Error("Comment text cannot contain double-hypen: " + val);
      }
      return this.assertLegalChar(val);
    };

    XMLStringifier.prototype.raw = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.attName = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.attValue = function(val) {
      val = '' + val || '';
      return this.attEscape(val);
    };

    XMLStringifier.prototype.insTarget = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.insValue = function(val) {
      val = '' + val || '';
      if (val.match(/\?>/)) {
        throw new Error("Invalid processing instruction value: " + val);
      }
      return val;
    };

    XMLStringifier.prototype.xmlVersion = function(val) {
      val = '' + val || '';
      if (!val.match(/1\.[0-9]+/)) {
        throw new Error("Invalid version number: " + val);
      }
      return val;
    };

    XMLStringifier.prototype.xmlEncoding = function(val) {
      val = '' + val || '';
      if (!val.match(/[A-Za-z](?:[A-Za-z0-9._-]|-)*/)) {
        throw new Error("Invalid encoding: " + val);
      }
      return val;
    };

    XMLStringifier.prototype.xmlStandalone = function(val) {
      if (val) {
        return "yes";
      } else {
        return "no";
      }
    };

    XMLStringifier.prototype.dtdPubID = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.dtdSysID = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.dtdElementValue = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.dtdAttType = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.dtdAttDefault = function(val) {
      if (val != null) {
        return '' + val || '';
      } else {
        return val;
      }
    };

    XMLStringifier.prototype.dtdEntityValue = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.dtdNData = function(val) {
      return '' + val || '';
    };

    XMLStringifier.prototype.convertAttKey = '@';

    XMLStringifier.prototype.convertPIKey = '?';

    XMLStringifier.prototype.convertTextKey = '#text';

    XMLStringifier.prototype.convertCDataKey = '#cdata';

    XMLStringifier.prototype.convertCommentKey = '#comment';

    XMLStringifier.prototype.convertRawKey = '#raw';

    XMLStringifier.prototype.convertListKey = '#list';

    XMLStringifier.prototype.assertLegalChar = function(str) {
      var chars, chr;
      if (this.allowSurrogateChars) {
        chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uFFFE-\uFFFF]/;
      } else {
        chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE-\uFFFF]/;
      }
      chr = str.match(chars);
      if (chr) {
        throw new Error("Invalid character (" + chr + ") in string: " + str + " at index " + chr.index);
      }
      return str;
    };

    XMLStringifier.prototype.elEscape = function(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#xD;');
    };

    XMLStringifier.prototype.attEscape = function(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/\t/g, '&#x9;').replace(/\n/g, '&#xA;').replace(/\r/g, '&#xD;');
    };

    return XMLStringifier;

  })();

}).call(this);

},{}],144:[function(require,module,exports){
(function() {
  var XMLNode, XMLText, create,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  create = require('lodash/object/create');

  XMLNode = require('./XMLNode');

  module.exports = XMLText = (function(superClass) {
    extend(XMLText, superClass);

    function XMLText(parent, text) {
      XMLText.__super__.constructor.call(this, parent);
      if (text == null) {
        throw new Error("Missing element text");
      }
      this.value = this.stringify.eleText(text);
    }

    XMLText.prototype.clone = function() {
      return create(XMLText.prototype, this);
    };

    XMLText.prototype.toString = function(options, level) {
      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += this.value;
      if (pretty) {
        r += newline;
      }
      return r;
    };

    return XMLText;

  })(XMLNode);

}).call(this);

},{"./XMLNode":140,"lodash/object/create":111}],145:[function(require,module,exports){
(function() {
  var XMLBuilder, assign;

  assign = require('lodash/object/assign');

  XMLBuilder = require('./XMLBuilder');

  module.exports.create = function(name, xmldec, doctype, options) {
    options = assign({}, xmldec, doctype, options);
    return new XMLBuilder(name, options).root();
  };

}).call(this);

},{"./XMLBuilder":130,"lodash/object/assign":110}],146:[function(require,module,exports){
require('./browser_loader');

var AWS = require('./core');

if (typeof window !== 'undefined') window.AWS = AWS;
if (typeof module !== 'undefined') module.exports = AWS;
if (typeof self !== 'undefined') self.AWS = AWS;

if (!Object.prototype.hasOwnProperty.call(AWS, 'Connect')) {
  AWS.apiLoader.services['connect'] = {};
  AWS.Connect = AWS.Service.defineService('connect', [ '2017-02-15' ]);
}
AWS.apiLoader.services['connect']['2017-02-15'] = require('../apis/connect-2017-02-15.min');

if (!Object.prototype.hasOwnProperty.call(AWS, 'STS')) {
  AWS.apiLoader.services['sts'] = {};
  AWS.STS = AWS.Service.defineService('sts', [ '2011-06-15' ]);
  require('./services/sts');
}
AWS.apiLoader.services['sts']['2011-06-15'] = require('../apis/sts-2011-06-15.min');


},{"../apis/connect-2017-02-15.min":2,"../apis/sts-2011-06-15.min":4,"./browser_loader":8,"./core":10,"./services/sts":43}]},{},[146]);


/*! @license sprintf.js | Copyright (c) 2007-2013 Alexandru Marasteanu <hello at alexei dot ro> | 3 clause BSD license */

(function() {
   var ctx = this;

	var sprintf = function() {
		if (!sprintf.cache.hasOwnProperty(arguments[0])) {
			sprintf.cache[arguments[0]] = sprintf.parse(arguments[0]);
		}
		return sprintf.format.call(null, sprintf.cache[arguments[0]], arguments);
	};

	sprintf.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = arg >>> 0; break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	sprintf.cache = {};

	sprintf.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] huh?');
							}
						}
					}
					else {
						throw('[sprintf] huh?');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	var vsprintf = function(fmt, argv, _argv) {
		_argv = argv.slice(0);
		_argv.splice(0, 0, fmt);
		return sprintf.apply(null, _argv);
	};

	/**
	 * helpers
	 */
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}

	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	/**
	 * export to either browser or node.js
	 */
	ctx.sprintf = sprintf;
	ctx.vsprintf = vsprintf;
})();


/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  // How frequently logs should be collected and reported to shared worker.
  var LOG_REPORT_INTERVAL_MILLIS = 5000;

  // The default log roll interval (30min)
  var DEFAULT_LOG_ROLL_INTERVAL = 1800000;

  /**
   * An enumeration of common logging levels.
   */
  var LogLevel = {
    TEST: "TEST",
    TRACE: "TRACE",
    DEBUG: "DEBUG",
    INFO: "INFO",
    LOG: "LOG",
    WARN: "WARN",
    ERROR: "ERROR",
    CRITICAL: "CRITICAL"
  };

  /**
   * An enumeration of common logging components.
   */
  var LogComponent = {
    CCP: "ccp",
    SOFTPHONE: "softphone",
    CHAT: "chat"
  };

  /**
   * The numeric order of the logging levels above.
   * They are spaced to allow the addition of other log
   * levels at a later time.
   */
  var LogLevelOrder = {
    TEST: 0,
    TRACE: 10,
    DEBUG: 20,
    INFO: 30,
    LOG: 40,
    WARN: 50,
    ERROR: 100,
    CRITICAL: 200

  };

  /**
   * A map from log level to console logger function.
   */
  var CONSOLE_LOGGER_MAP = {
    TRACE: function (text) { console.info(text); },
    DEBUG: function (text) { console.info(text); },
    INFO: function (text) { console.info(text); },
    LOG: function (text) { console.log(text); },
    TEST: function (text) { console.log(text); },
    WARN: function (text) { console.warn(text); },
    ERROR: function (text) { console.error(text); },
    CRITICAL: function (text) { console.error(text); }
  };

  /**
  * Checks if it is a valid log component enum
  */

  var isValidLogComponent = function (component) {
    return [LogComponent.SOFTPHONE, LogComponent.CCP, LogComponent.CHAT].indexOf(component) !== -1;
  };

  /**
  * Extract the custom arguments as required by the logger
  */
  var extractLoggerArgs = function (loggerArgs) {
    var args = Array.prototype.slice.call(loggerArgs, 0);
    var firstArg = args.shift();
    var format;
    var component;
    if (isValidLogComponent(firstArg)) {
      component = firstArg;
      format = args.shift();
    } else {
      //default to CCP component
      format = firstArg;
      component = LogComponent.CCP;
    }
    return {
      format: format,
      component: component,
      args: args
    };
  };

  /**
   * A log entry.
   *
   * @param level The log level of this log entry.
   * @param text The text contained in the log entry.
   *
   * Log entries are aware of their timestamp, order,
   * and can contain objects and exception stack traces.
   */
  var LogEntry = function (component, level, text) {
    this.component = component;
    this.level = level;
    this.text = text;
    this.time = new Date();
    this.exception = null;
    this.objects = [];
    this.line = 0;
  };

  LogEntry.fromObject = function (obj) {
    var entry = new LogEntry(LogComponent.CCP, obj.level, obj.text);

    // Required to check for Date objects sent across frame boundaries
    if (Object.prototype.toString.call(obj.time) === '[object Date]') {
      entry.time = new Date(obj.time.getTime());
    } else if (typeof obj.time === 'number') {
      entry.time = new Date(obj.time);
    } else if (typeof obj.time === 'string') {
      entry.time = Date.parse(obj.time);
    } else {
      entry.time = new Date();
    }
    entry.exception = obj.exception;
    entry.objects = obj.objects;
    return entry;
  };

  /**
   * Pulls the type, message, and stack trace
   * out of the given exception for JSON serialization.
   */
  var LoggedException = function (e) {
    this.type = Object.prototype.toString.call(e);
    this.message = e.message;
    this.stack = e.stack ? e.stack.split('\n') : [];
  };

  /**
   * Minimally stringify this log entry for printing
   * to the console.
   */
  LogEntry.prototype.toString = function () {
    return connect.sprintf("[%s] [%s]: %s",
      this.getTime() && this.getTime().toISOString ? this.getTime().toISOString() : "???",
      this.getLevel(),
      this.getText());
  };

  /**
   * Get the log entry timestamp.
   */
  LogEntry.prototype.getTime = function () {
    return this.time;
  };

  /**
   * Get the level of the log entry.
   */
  LogEntry.prototype.getLevel = function () {
    return this.level;
  };

  /**
   * Get the log entry text.
   */
  LogEntry.prototype.getText = function () {
    return this.text;
  };

  /**
   * Get the log entry component.
   */
  LogEntry.prototype.getComponent = function () {
    return this.component;
  };

  /**
   * Add an exception stack trace to this log entry.
   * A log entry may contain only one exception stack trace.
   */
  LogEntry.prototype.withException = function (e) {
    this.exception = new LoggedException(e);
    return this;
  };

  /**
   * Add an arbitrary object to the log entry.  A log entry
   * may contain any number of objects.
   */
  LogEntry.prototype.withObject = function (obj) {
    this.objects.push(connect.deepcopy(obj));
    return this;
  };

  /**
   * The logger instance.
   */
  var Logger = function () {
    this._logs = [];
    this._rolledLogs = [];
    this._logsToPush = [];
    this._echoLevel = LogLevelOrder.INFO;
    this._logLevel = LogLevelOrder.INFO;
    this._lineCount = 0;
    this._logRollInterval = 0;
    this._logRollTimer = null;
    this.setLogRollInterval(DEFAULT_LOG_ROLL_INTERVAL);
  };

  /**
   * Sets the interval in milliseconds that the logs will be rotated.
   * Logs are rotated out completely at the end of the second roll
   * and will eventually be garbage collected.
   */
  Logger.prototype.setLogRollInterval = function (interval) {
    var self = this;

    if (!(this._logRollTimer) || interval !== this._logRollInterval) {
      if (this._logRollTimer) {
        global.clearInterval(this._logRollTimer);
      }
      this._logRollInterval = interval;
      this._logRollTimer = global.setInterval(function () {
        this._rolledLogs = this._logs;
        this._logs = [];
        self.info("Log roll interval occurred.");
      }, this._logRollInterval);
    } else {
      this.warn("Logger is already set to the given interval: %d", this._logRollInterval);
    }
  };

  /**
   * Set the log level.  This is the minimum level at which logs will
   * be kept for later archiving.
   */
  Logger.prototype.setLogLevel = function (level) {
    if (level in LogLevelOrder) {
      this._logLevel = LogLevelOrder[level];
    } else {
      throw new Error("Unknown logging level: " + level);
    }
  };

  /**
   * Set the echo level.  This is the minimum level at which logs will
   * be printed to the javascript console.
   */
  Logger.prototype.setEchoLevel = function (level) {
    if (level in LogLevelOrder) {
      this._echoLevel = LogLevelOrder[level];
    } else {
      throw new Error("Unknown logging level: " + level);
    }
  };

  /**
   * Write a particular log entry.
   *
   * @param level The logging level of the entry.
   * @param text The text contents of the entry.
   *
   * @returns The new log entry.
   */
  Logger.prototype.write = function (component, level, text) {
    var logEntry = new LogEntry(component, level, text);
    this.addLogEntry(logEntry);
    return logEntry;
  };

  Logger.prototype.addLogEntry = function (logEntry) {
    this._logs.push(logEntry);
    //For now only send softphone logs only.
    //TODO add CCP logs once we are sure that no sensitive data is being logged.
    if (LogComponent.SOFTPHONE === logEntry.component) {
      this._logsToPush.push(logEntry);
    }

    if (logEntry.level in LogLevelOrder &&
      LogLevelOrder[logEntry.level] >= this._logLevel) {

      if (LogLevelOrder[logEntry.level] >= this._echoLevel) {
        CONSOLE_LOGGER_MAP[logEntry.getLevel()](logEntry.toString());
      }

      logEntry.line = this._lineCount++;
    }
  };

  /**
   * Remove all objects from all log entries.
   */
  Logger.prototype.clearObjects = function () {
    for (var x = 0; x < this._logs.length; x++) {
      if (this._logs[x].objects) {
        delete this._logs[x].objects;
      }
    }
  };

  /**
   * Remove all exception stack traces from the log entries.
   */
  Logger.prototype.clearExceptions = function () {
    for (var x = 0; x < this._logs.length; x++) {
      if (this._logs[x].exception) {
        delete this._logs[x].exception;
      }
    }
  };

  Logger.prototype.trace = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.TRACE, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.debug = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.DEBUG, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.info = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.INFO, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.log = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.LOG, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.test = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.TEST, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.warn = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.WARN, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.error = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.ERROR, connect.vsprintf(logArgs.format, logArgs.args));
  };

  Logger.prototype.critical = function () {
    var logArgs = extractLoggerArgs(arguments);
    return this.write(logArgs.component, LogLevel.ERROR, connect.vsprintf(logArgs.format, logArgs.args));
  };

  /**
   * Create a string representation of the logger contents.
   */
  Logger.prototype.toString = function () {
    var lines = [];
    for (var x = 0; x < this._logs.length; x++) {
      lines.push(this._logs[x].toString());
    }

    return lines.join("\n");
  };

  Logger.prototype.download = function () {
    var logBlob = new global.Blob([JSON.stringify(this._rolledLogs.concat(this._logs), undefined, 4)], ['text/plain']);
    var downloadLink = document.createElement('a');
    downloadLink.href = global.URL.createObjectURL(logBlob);
    downloadLink.download = 'agent-log.txt';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  Logger.prototype.scheduleUpstreamLogPush = function (conduit) {
    if (!connect.upstreamLogPushScheduled) {
      connect.upstreamLogPushScheduled = true;
      /** Schedule pushing logs frequently to sharedworker upstream, sharedworker will report to LARS*/
      global.setInterval(connect.hitch(this, this.reportMasterLogsUpStream, conduit), LOG_REPORT_INTERVAL_MILLIS);
    }
  };

  Logger.prototype.reportMasterLogsUpStream = function (conduit) {
    var logsToPush = this._logsToPush.slice();
    this._logsToPush = [];
    connect.ifMaster(connect.MasterTopics.SEND_LOGS, function () {
      if (logsToPush.length > 0) {
        conduit.sendUpstream(connect.EventType.SEND_LOGS, logsToPush);
      }
    });
  };

  var DownstreamConduitLogger = function (conduit) {
    Logger.call(this);
    this.conduit = conduit;
    global.setInterval(connect.hitch(this, this._pushLogsDownstream),
      DownstreamConduitLogger.LOG_PUSH_INTERVAL);

    // Disable log rolling, we will purge our own logs once they have
    // been pushed downstream.
    global.clearInterval(this._logRollTimer);
    this._logRollTimer = null;
  };
  // How frequently logs should be collected and delivered downstream.
  DownstreamConduitLogger.LOG_PUSH_INTERVAL = 1000;
  DownstreamConduitLogger.prototype = Object.create(Logger.prototype);
  DownstreamConduitLogger.prototype.constructor = DownstreamConduitLogger;

  DownstreamConduitLogger.prototype._pushLogsDownstream = function () {
    var self = this;
    this._logs.forEach(function (log) {
      self.conduit.sendDownstream(connect.EventType.LOG, log);
    });
    this._logs = [];
  };

  /** Create the singleton logger instance. */
  connect.rootLogger = new Logger();

  /** Fetch the singleton logger instance. */
  var getLog = function () {
    return connect.rootLogger;
  };

  connect = connect || {};
  connect.getLog = getLog;
  connect.LogEntry = LogEntry;
  connect.Logger = Logger;
  connect.LogLevel = LogLevel;
  connect.LogComponent = LogComponent;
  connect.DownstreamConduitLogger = DownstreamConduitLogger;
})();

/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function() {
   var global = this;
   connect = global.connect || {};
   global.connect = connect;
   global.lily = connect;

   var userAgent = navigator.userAgent;
   var ONE_DAY_MILLIS = 24*60*60*1000;

   /**
    * Unpollute sprintf functions from the global namespace.
    */
   connect.sprintf = global.sprintf;
   connect.vsprintf = global.vsprintf;
   delete global.sprintf;
   delete global.vsprintf;

   connect.HTTP_STATUS_CODES = {
    SUCCESS: 200,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500
   };

   /**
    * Binds the given instance object as the context for
    * the method provided.
    *
    * @param scope The instance object to be set as the scope
    *    of the function.
    * @param method The method to be encapsulated.
    *
    * All other arguments, if any, are bound to the method
    * invocation inside the closure.
    *
    * @return A closure encapsulating the invocation of the
    *    method provided in context of the given instance.
    */
   connect.hitch = function() {
      var args = Array.prototype.slice.call(arguments);
      var scope = args.shift();
      var method = args.shift();

      connect.assertNotNull(scope, 'scope');
      connect.assertNotNull(method, 'method');
      connect.assertTrue(connect.isFunction(method), 'method must be a function');

      return function() {
         var closureArgs = Array.prototype.slice.call(arguments);
         return method.apply(scope, args.concat(closureArgs));
      };
   };

   /**
    * Determine if the given value is a callable function type.
    * Borrowed from Underscore.js.
    */
   connect.isFunction = function(obj) {
      return !!(obj && obj.constructor && obj.call && obj.apply);
   };

   /**
    * Determine if the given value is an array.
    */
   connect.isArray = function(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
   };

   /**
    * Get a list of keys from a Javascript object used
    * as a hash map.
    */
   connect.keys = function(map) {
      var keys = [];

      connect.assertNotNull(map, 'map');

      for (var k in map) {
         keys.push(k);
      }

      return keys;
   };

   /**
    * Get a list of values from a Javascript object used
    * as a hash map.
    */
   connect.values = function(map) {
      var values = [];

      connect.assertNotNull(map, 'map');

      for (var k in map) {
         values.push(map[k]);
      }

      return values;
   };

   /**
    * Get a list of key/value pairs from the given map.
    */
   connect.entries = function(map) {
      var entries = [];

      for (var k in map) {
         entries.push({key: k, value: map[k]});
      }

      return entries;
   };

   /**
    * Merge two or more maps together into a new map,
    * or simply copy a single map.
    */
   connect.merge = function() {
      var argMaps = Array.prototype.slice.call(arguments, 0);
      var resultMap = {};

      argMaps.forEach(function(map) {
         connect.entries(map).forEach(function(kv) {
            resultMap[kv.key] = kv.value;
         });
      });

      return resultMap;
   };

   connect.now = function() {
      return new Date().getTime();
   };

   connect.find = function(array, predicate) {
      for (var x = 0; x < array.length; x++) {
         if (predicate(array[x])) {
            return array[x];
         }
      }

      return null;
   };

   connect.contains = function(obj, value) {
      if (obj instanceof Array) {
         return connect.find(obj, function(v) { return v === value; }) != null;

      } else {
         return (value in obj);
      }
   };

   connect.containsValue = function(obj, value) {
      if (obj instanceof Array) {
         return connect.find(obj, function(v) { return v === value; }) != null;

      } else {
         return connect.find(connect.values(obj), function(v) { return v === value; }) != null;
      }
   };

   /**
    * Generate a random ID consisting of the current timestamp
    * and a random base-36 number based on Math.random().
    */
   connect.randomId = function() {
      return connect.sprintf("%s-%s", connect.now(), Math.random().toString(36).slice(2));
   };

   /**
    * Generate an enum from the given list of lower-case enum values,
    * where the enum keys will be upper case.
    *
    * Conversion from pascal case based on code from here:
    * http://stackoverflow.com/questions/30521224
    */
   connect.makeEnum = function(values) {
      var enumObj = {};

      values.forEach(function(value) {
         var key = value.replace(/\.?([a-z]+)_?/g, function (x, y) { return y.toUpperCase() + "_"; })
            .replace(/_$/, "");

         enumObj[key] = value;
      });

      return enumObj;
   };

   connect.makeNamespacedEnum = function(prefix, values) {
      var enumObj = connect.makeEnum(values);
      connect.keys(enumObj).forEach(function(key) {
         enumObj[key] = connect.sprintf("%s::%s", prefix, enumObj[key]);
      });
      return enumObj;
   };

   /**
   * Methods to determine browser type and versions, used for softphone initialization.
   */
   connect.isChromeBrowser = function() {
       return userAgent.indexOf("Chrome") !== -1;
   };

   connect.isFirefoxBrowser = function() {
       return userAgent.indexOf("Firefox") !== -1;
   };

   connect.isOperaBrowser = function() {
       return userAgent.indexOf("Opera") !== -1;
   };

   connect.getChromeBrowserVersion = function() {
       var chromeVersion = userAgent.substring(userAgent.indexOf("Chrome")+7);
       if (chromeVersion) {
           return parseFloat(chromeVersion);
       } else {
           return -1;
       }
   };

   connect.getFirefoxBrowserVersion = function() {
       var firefoxVersion = userAgent.substring(userAgent.indexOf("Firefox")+8);
       if (firefoxVersion) {
           return parseFloat(firefoxVersion);
       } else {
           return -1;
       }
   };

   connect.getOperaBrowserVersion = function() {
       var versionOffset = userAgent.indexOf("Opera");
       var operaVersion = (userAgent.indexOf("Version") !== -1) ? userAgent.substring(versionOffset+8) : userAgent.substring(versionOffset+6);
       if (operaVersion) {
           return parseFloat(operaVersion);
       } else {
           return -1;
       }
   };

   /**
    * Return a map of items in the given list indexed by
    * keys determined by the closure provided.
    *
    * @param iterable A list-like object.
    * @param closure A closure to determine the index for the
    *    items in the iterable.
    * @return A map from index to item for each item in the iterable.
    */
   connect.index = function(iterable, closure) {
      var map = {};

      iterable.forEach(function(item) {
         map[closure(item)] = item;
      });

      return map;
   };

   /**
    * Converts the given array into a map as a set,
    * where elements in the array are mapped to 1.
    */
   connect.set = function(arrayIn) {
      var setMap = {};

      arrayIn.forEach(function(key) {
         setMap[key] = 1;
      });

      return setMap;
   };

   /**
    * Returns a map for each key in mapB which
    * is NOT in mapA.
    */
   connect.relativeComplement = function(mapA, mapB) {
      var compMap = {};

      connect.keys(mapB).forEach(function(key) {
         if (! (key in mapA)) {
            compMap[key] = mapB[key];
         }
      });

      return compMap;
   };

   /**
    * Asserts that a premise is true.
    */
   connect.assertTrue = function(premise, message) {
      if (! premise) {
         throw new connect.ValueError(message);
      }
   };

   /**
    * Asserts that a value is not null or undefined.
    */
   connect.assertNotNull = function(value, name) {
      connect.assertTrue(value != null && typeof value !== undefined,
            connect.sprintf("%s must be provided", name || 'A value'));
      return value;
   };

   connect.deepcopy = function(src) {
      return JSON.parse(JSON.stringify(src));
   };

   /**
    * Get the current base url of the open page, e.g. if the page is
    * https://example.com:9494/oranges, this will be "https://example.com:9494".
    */
   connect.getBaseUrl = function() {
      var location = global.location;
      return connect.sprintf("%s//%s:%s", location.protocol, location.hostname, location.port);
   };

   /**
    * Determine if the current window is in an iframe.
    * Courtesy: http://stackoverflow.com/questions/326069/
    */
   connect.isFramed = function() {
      try {
         return window.self !== window.top;
      } catch (e) {
         return true;
      }
   };

   connect.fetch = function(endpoint, options, milliInterval, maxRetry){
      maxRetry = maxRetry || 5;
      milliInterval = milliInterval || 1000;
      options = options || {};
      return new Promise(function(resolve, reject) {
        function fetchData(maxRetry){
          fetch(endpoint, options).then(function (res) {
            if (res.status === connect.HTTP_STATUS_CODES.SUCCESS) {
              resolve(res.json());
            } else if (maxRetry !== 1 && (res.status >= connect.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR || res.status === connect.HTTP_STATUS_CODES.TOO_MANY_REQUESTS)) {
              setTimeout(function () {
                fetchData(--maxRetry);
              }, milliInterval);
            } else {
                reject(res);
            }
          }).catch(function(e){ 
              reject(e);
          });
        }
        fetchData(maxRetry);
      });
   };

   /**
    * Calling a function with exponential backoff with full jitter retry strategy
    * It will retry calling the function for maximum maxRetry times if it fails.
    * Success callback will be called if the function succeeded.
    * Failure callback will be called only if the last try failed.
    */
   connect.backoff = function(func, milliInterval, maxRetry, callbacks) {
      connect.assertTrue(connect.isFunction(func), "func must be a Function");
      var self = this;
      var ratio = 2;

      func({
         success: function(data) {
            if (callbacks && callbacks.success) {
               callbacks.success(data);
            }
         },
         failure: function(err, data) {
            if (maxRetry > 0) {
               var interval = milliInterval * 2 * Math.random();
               global.setTimeout(function() {
                  self.backoff(func, interval * ratio, --maxRetry, callbacks);
               }, interval);
            } else {
               if (callbacks && callbacks.failure) {
                  callbacks.failure(err, data);
               }
            }
         }
      });
   };

   connect.publishMetric = function(metricData) {
      var bus = connect.core.getEventBus();
      bus.trigger(connect.EventType.CLIENT_METRIC, metricData);
   };

   /**
    * A wrapper around Window.open() for managing single instance popups.
    */
   connect.PopupManager = function() {};

   connect.PopupManager.prototype.open = function(url, name) {
      var then = this._getLastOpenedTimestamp(name);
      var now = new Date().getTime();

      if (now - then > ONE_DAY_MILLIS) {
         var win = window.open('', name);
         if (win.location !== url) {
            window.open(url, name);
         }
         this._setLastOpenedTimestamp(name, now);
      }
   };

   connect.PopupManager.prototype.clear = function(name) {
      var key = this._getLocalStorageKey(name);
      global.localStorage.removeItem(key);
   };

   connect.PopupManager.prototype._getLastOpenedTimestamp = function(name) {
      var key = this._getLocalStorageKey(name);
      var value = global.localStorage.getItem(key);

      if (value) {
         return parseInt(value, 10);

      } else {
         return 0;
      }
   };

   connect.PopupManager.prototype._setLastOpenedTimestamp = function(name, ts) {
      var key = this._getLocalStorageKey(name);
      global.localStorage.setItem(key, '' + ts);
   };

   connect.PopupManager.prototype._getLocalStorageKey = function(name) {
      return "connectPopupManager::" + name;
   };

   /**
    * An enumeration of the HTML5 notification permission values.
    */
   var NotificationPermission = connect.makeEnum([
      'granted',
      'denied',
      'default'
   ]);

   /**
    * A simple engine for showing notification popups.
    */
   connect.NotificationManager = function() {
      this.queue = [];
      this.permission = NotificationPermission.DEFAULT;
   };

   connect.NotificationManager.prototype.requestPermission = function() {
      var self = this;
      if (!("Notification" in global)) {
         connect.getLog().warn("This browser doesn't support notifications.");
         this.permission = NotificationPermission.DENIED;

      } else if (global.Notification.permission === NotificationPermission.DENIED) {
         connect.getLog().warn("The user has requested to not receive notifications.");
         this.permission = NotificationPermission.DENIED;

      } else if (this.permission !== NotificationPermission.GRANTED) {
         global.Notification.requestPermission().then(function(permission) {
            self.permission = permission;
            if (permission === NotificationPermission.GRANTED) {
               self._showQueued();

            } else {
               self.queue = [];
            }
         });
      }
   };

   connect.NotificationManager.prototype.show = function(title, options) {
      if (this.permission === NotificationPermission.GRANTED) {
         return this._showImpl({title: title, options: options});

      } else if (this.permission === NotificationPermission.DENIED) {
         connect.getLog().warn("Unable to show notification.").withObject({
            title: title,
            options: options
         });

      } else {
         var params = {title: title, options: options};
         connect.getLog().warn("Deferring notification until user decides to allow or deny.")
            .withObject(params);
         this.queue.push(params);
      }
   };

   connect.NotificationManager.prototype._showQueued = function() {
      var self = this;
      var notifications = this.queue.map(function(params) {
         return self._showImpl(params);
      });
      this.queue = [];
      return notifications;
   };

   connect.NotificationManager.prototype._showImpl = function(params) {
      var notification = new global.Notification(params.title, params.options);
      if (params.options.clicked) {
         notification.onclick = function() {
            params.options.clicked.call(notification);
         };
      }
      return notification;
   };

   connect.BaseError = function(format, args) {
      global.Error.call(this, connect.vsprintf(format, args));
   };
   connect.BaseError.prototype = Object.create(Error.prototype);
   connect.BaseError.prototype.constructor = connect.BaseError;

   connect.ValueError = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var format = args.shift();
      connect.BaseError.call(this, format, args);
   };
   connect.ValueError.prototype = Object.create(connect.BaseError.prototype);
   connect.ValueError.prototype.constructor = connect.ValueError;

   connect.NotImplementedError = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var format = args.shift();
      connect.BaseError.call(this, format, args);
   };
   connect.NotImplementedError.prototype = Object.create(connect.BaseError.prototype);
   connect.NotImplementedError.prototype.constructor = connect.NotImplementedError;

   connect.StateError = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var format = args.shift();
      connect.BaseError.call(this, format, args);
   };
   connect.StateError.prototype = Object.create(connect.BaseError.prototype);
   connect.StateError.prototype.constructor = connect.StateError;

})();

/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;

  var ALL_EVENTS = '<<all>>';

  /**---------------------------------------------------------------
   * enum EventType
   */
  var EventType = connect.makeEnum([
    'acknowledge',
    'ack_timeout',
    'api_request',
    'api_response',
    'auth_fail',
    'access_denied',
    'close',
    'configure',
    'log',
    'master_request',
    'master_response',
    'synchronize',
    'terminate',
    'terminated',
    'send_logs',
    'reload_agent_configuration',
    'broadcast',
    'api_metric',
    'client_metric',
    'mute'
  ]);

  /**---------------------------------------------------------------
   * enum MasterTopics
   */
  var MasterTopics = connect.makeNamespacedEnum('connect', [
    'loginPopup',
    'sendLogs',
    'softphone',
    'ringtone',
    'metrics'
  ]);

  /**---------------------------------------------------------------
   * enum AgentEvents
   */
  var AgentEvents = connect.makeNamespacedEnum('agent', [
    'init',
    'update',
    'refresh',
    'routable',
    'not_routable',
    'pending',
    'contact_pending',
    'offline',
    'error',
    'softphone_error',
    'state_change',
    'acw',
    'mute_toggle'
  ]);

  /**---------------------------------------------------------------
   * enum WebSocketEvents
   */
  var WebSocketEvents = connect.makeNamespacedEnum('webSocket', [
    'init_failure',
    'connection_gain',
    'connection_lost',
    'subscription_update',
    'subscription_failure',
    'all_message',
    'send',
    'subscribe'
  ]);

  /**---------------------------------------------------------------
   * enum ContactEvents
   */
  var ContactEvents = connect.makeNamespacedEnum('contact', [
    'init',
    'refresh',
    'destroyed',
    'incoming',
    'pending',
    'connecting',
    'connected',
    'missed',
    'acw',
    'view',
    'ended',
    'error',
    'accepted'
  ]);


   /**---------------------------------------------------------------
   * enum ConnnectionEvents
   */
  var ConnnectionEvents = connect.makeNamespacedEnum('connection', [
    'session_init'
  ]);

  /**---------------------------------------------------------------
   * class EventFactory
   */
  var EventFactory = function () { };
  EventFactory.createRequest = function (type, method, params) {
    return {
      event: type,
      requestId: connect.randomId(),
      method: method,
      params: params
    };
  };

  EventFactory.createResponse = function (type, request, data, err) {
    return {
      event: type,
      requestId: request.requestId,
      data: data,
      err: err || null
    };
  };

  /**
   * An object representing an event subscription in an EventBus.
   */
  var Subscription = function (subMap, eventName, f) {
    this.subMap = subMap;
    this.id = connect.randomId();
    this.eventName = eventName;
    this.f = f;
  };

  /**
   * Unsubscribe the handler of this subscription from the EventBus
   * from which it was created.
   */
  Subscription.prototype.unsubscribe = function () {
    this.subMap.unsubscribe(this.eventName, this.id);
  };

  /**
   * A map of event subscriptions, used by the EventBus.
   */
  var SubscriptionMap = function () {
    this.subIdMap = {};
    this.subEventNameMap = {};
  };

  /**
   * Add a subscription for the named event.  Creates a new Subscription
   * object and returns it.  This object can be used to unsubscribe.
   */
  SubscriptionMap.prototype.subscribe = function (eventName, f) {
    var sub = new Subscription(this, eventName, f);

    this.subIdMap[sub.id] = sub;
    var subList = this.subEventNameMap[eventName] || [];
    subList.push(sub);
    this.subEventNameMap[eventName] = subList;
    return sub;
  };

  /**
   * Unsubscribe a subscription matching the given event name and id.
   */
  SubscriptionMap.prototype.unsubscribe = function (eventName, subId) {
    if (connect.contains(this.subEventNameMap, eventName)) {
      this.subEventNameMap[eventName] = this.subEventNameMap[eventName].filter(function (s) { return s.id !== subId; });

      if (this.subEventNameMap[eventName].length < 1) {
        delete this.subEventNameMap[eventName];
      }
    }

    if (connect.contains(this.subIdMap, subId)) {
      delete this.subIdMap[subId];
    }
  };

  /**
   * Get a list of all subscriptions in the subscription map.
   */
  SubscriptionMap.prototype.getAllSubscriptions = function () {
    return connect.values(this.subEventNameMap).reduce(function (a, b) {
      return a.concat(b);
    }, []);
  };

  /**
   * Get a list of subscriptions for the given event name, or an empty
   * list if there are no subscriptions.
   */
  SubscriptionMap.prototype.getSubscriptions = function (eventName) {
    return this.subEventNameMap[eventName] || [];
  };

  /**
   * An object which maintains a map of subscriptions and serves as the
   * mechanism for triggering events to be handled by subscribers.
   */
  var EventBus = function (paramsIn) {
    var params = paramsIn || {};

    this.subMap = new SubscriptionMap();
    this.logEvents = params.logEvents || false;
  };

  /**
   * Subscribe to the named event.  Returns a new Subscription object
   * which can be used to unsubscribe.
   */
  EventBus.prototype.subscribe = function (eventName, f) {
    connect.assertNotNull(eventName, 'eventName');
    connect.assertNotNull(f, 'f');
    connect.assertTrue(connect.isFunction(f), 'f must be a function');
    return this.subMap.subscribe(eventName, f);
  };

  /**
   * Subscribe a function to be called on all events.
   */
  EventBus.prototype.subscribeAll = function (f) {
    connect.assertNotNull(f, 'f');
    connect.assertTrue(connect.isFunction(f), 'f must be a function');
    return this.subMap.subscribe(ALL_EVENTS, f);
  };

  /**
   * Get a list of subscriptions for the given event name, or an empty
   * list if there are no subscriptions.
   */
  EventBus.prototype.getSubscriptions = function (eventName) {
    return this.subMap.getSubscriptions(eventName);
  };

  /**
   * Trigger the given event with the given data.  All methods subscribed
   * to this event will be called and are provided with the given arbitrary
   * data object and the name of the event, in that order.
   */
  EventBus.prototype.trigger = function (eventName, data) {
    connect.assertNotNull(eventName, 'eventName');
    var self = this;
    var allEventSubs = this.subMap.getSubscriptions(ALL_EVENTS);
    var eventSubs = this.subMap.getSubscriptions(eventName);

    if (this.logEvents && (eventName !== connect.EventType.LOG && eventName !== connect.EventType.MASTER_RESPONSE && eventName !== connect.EventType.API_METRIC)) {
      connect.getLog().trace("Publishing event: %s", eventName);
    }

    allEventSubs.concat(eventSubs).forEach(function (sub) {
      try {
        sub.f(data || null, eventName, self);

      } catch (e) {
        connect.getLog().error("'%s' event handler failed.", eventName).withException(e);
      }
    });
  };

  /**
   * Returns a closure which bridges an event from another EventBus to this bus.
   *
   * Usage:
   * conduit.onUpstream("MyEvent", bus.bridge());
   */
  EventBus.prototype.bridge = function () {
    var self = this;
    return function (data, event) {
      self.trigger(event, data);
    };
  };

  /**
   * Unsubscribe all events in the event bus.
   */
  EventBus.prototype.unsubscribeAll = function () {
    this.subMap.getAllSubscriptions().forEach(function (sub) {
      sub.unsubscribe();
    });
  };

  connect.EventBus = EventBus;
  connect.EventFactory = EventFactory;
  connect.EventType = EventType;
  connect.AgentEvents = AgentEvents;
  connect.ConnnectionEvents = ConnnectionEvents;
  connect.ContactEvents = ContactEvents;
  connect.WebSocketEvents = WebSocketEvents;
  connect.MasterTopics = MasterTopics;
})();

/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function() {
   var global = this;
   connect = global.connect || {};
   global.connect = connect;
   global.lily = connect;

   /**---------------------------------------------------------------
    * class Stream
    *
    * Represents an object from which messages can be read and to which
    * messages can be sent.
    */
   var Stream = function() {};

   /**
    * Send a message to the stream.  This method must be implemented by subclasses.
    */
   Stream.prototype.send = function(message) {
      throw new connect.NotImplementedError();
   };

   /**
    * Provide a method to be called when messages are received from this stream.
    * This method must be implemented by subclasses.
    */
   Stream.prototype.onMessage = function(f) {
      throw new connect.NotImplementedError();
   };

   /**---------------------------------------------------------------
    * class NullStream extends Stream
    *
    * A null stream which provides no message sending or receiving facilities.
    */
   var NullStream = function() {
      Stream.call(this);
   };
   NullStream.prototype = Object.create(Stream.prototype);
   NullStream.prototype.constructor = NullStream;

   NullStream.prototype.onMessage = function(f) {};
   NullStream.prototype.send = function(message) {};

   /**---------------------------------------------------------------
    * class WindowStream extends Stream
    *
    * A stream for communicating with a window object.  The domain provided
    * must match the allowed message domains of the downstream receiver
    * or messages will be rejected, see https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
    * for more info.
    */
   var WindowStream = function(win, domain) {
      Stream.call(this);
      this.window = win;
      this.domain = domain || '*';
   };
   WindowStream.prototype = Object.create(Stream.prototype);
   WindowStream.prototype.constructor = WindowStream;

   WindowStream.prototype.send = function(message) {
      this.window.postMessage(message, this.domain);
   };

   WindowStream.prototype.onMessage = function(f) {
      this.window.addEventListener("message", f);
   };

   /**---------------------------------------------------------------
    * class WindowIOStream extends Stream
    *
    * A stream used by IFrame/popup windows to communicate with their parents
    * and vise versa.
    *
    * This object encapsulates the fact that incoming and outgoing messages
    * arrive on different windows and allows this to be managed as a single
    * Stream object.
    */
   var WindowIOStream = function(inputwin, outputwin, domain) {
      Stream.call(this);
      this.input = inputwin;
      this.output = outputwin;
      this.domain = domain || '*';
   };
   WindowIOStream.prototype = Object.create(Stream.prototype);
   WindowIOStream.prototype.constructor = WindowIOStream;

   WindowIOStream.prototype.send = function(message) {
      this.output.postMessage(message, this.domain);
   };

   WindowIOStream.prototype.onMessage = function(f) {
      this.input.addEventListener("message", f);
   };

   /**---------------------------------------------------------------
    * class PortStream extends Stream
    *
    * A stream wrapping an HTML5 Worker port.  This could be the port
    * used to connect to a Worker or one of the multitude of ports
    * made available to a SharedWorker for communication back to
    * its connected clients.
    */
   var PortStream = function(port) {
      Stream.call(this);
      this.port = port;
      this.id = connect.randomId();
   };
   PortStream.prototype = Object.create(Stream.prototype);
   PortStream.prototype.constructor = PortStream;

   PortStream.prototype.send = function(message) {
      this.port.postMessage(message);
   };

   PortStream.prototype.onMessage = function(f) {
      this.port.addEventListener("message", f);
   };

   PortStream.prototype.getId = function() {
      return this.id;
   };

   /**---------------------------------------------------------------
    * class StreamMultiplexer extends Stream
    *
    * A wrapper for multiplexed downstream communication with
    * multiple streams at once.  Mainly useful for the SharedWorker to
    * broadcast events to many PortStream objects at once.
    */
   var StreamMultiplexer = function(streams) {
      Stream.call(this);
      this.streamMap = streams ?
         connect.index(streams, function(s) { return s.getId(); }) : {};
      this.messageListeners = [];
   };
   StreamMultiplexer.prototype = Object.create(Stream.prototype);
   StreamMultiplexer.prototype.constructor = StreamMultiplexer;

   /**
    * Send a message to all ports in the multiplexer.
    */
   StreamMultiplexer.prototype.send = function(message) {
      this.getStreams().forEach(function(stream) {
         try {
            stream.send(message);

         } catch (e) {
            // Couldn't send message to one of the downstreams for some reason...
            // No reliable logging possible without further failures,
            // no recovery, just eat it.
         }
      });
   };

   /**
    * Register a method which will be called when a message is received from
    * any of the downstreams.
    */
   StreamMultiplexer.prototype.onMessage = function(f) {
      this.messageListeners.push(f);

      // Update existing streams with the new listener.
      this.getStreams().forEach(function(stream) {
         stream.onMessage(f);
      });
   };

   /**
    * Add a stream to the multiplexer.
    */
   StreamMultiplexer.prototype.addStream = function(stream) {
      var self = this;
      this.streamMap[stream.getId()] = stream;

      // Update stream with existing listeners.
      this.messageListeners.forEach(function(messageListener) {
         stream.onMessage(messageListener);
      });
   };

   /**
    * Remove the given downstream.  This is typically used in response
    * to the SharedWorker's onclose event, indicating that a consumer
    * tab has been closed.
    */
   StreamMultiplexer.prototype.removeStream = function(stream) {
      delete this.streamMap[stream.getId()];
   };

   /**
    * Get a list of streams in the multiplexer.
    */
   StreamMultiplexer.prototype.getStreams = function(stream) {
      return connect.values(this.streamMap);
   };

   /**
    * Get the stream matching the given port.
    */
   StreamMultiplexer.prototype.getStreamForPort = function(port) {
      return connect.find(this.getStreams(), function(s) {
         return s.port === port;
      });
   };

   /**---------------------------------------------------------------
    * class Conduit
    *
    * An object which bridges an upstream and a downstream, allowing messages
    * to be passed to and from each and providing an event bus for event
    * subscriptions to be made upstream and downstream.
    */
   var Conduit = function(name, upstream, downstream) {
      this.name = name;
      this.upstream = upstream || new NullStream();
      this.downstream = downstream || new NullStream();
      this.downstreamBus = new connect.EventBus();
      this.upstreamBus = new connect.EventBus();

      this.upstream.onMessage(connect.hitch(this, this._dispatchEvent, this.upstreamBus));
      this.downstream.onMessage(connect.hitch(this, this._dispatchEvent, this.downstreamBus));
   };

   Conduit.prototype.onUpstream = function(eventName, f) {
      connect.assertNotNull(eventName, 'eventName');
      connect.assertNotNull(f, 'f');
      connect.assertTrue(connect.isFunction(f), 'f must be a function');
      return this.upstreamBus.subscribe(eventName, f);
   };

   Conduit.prototype.onAllUpstream = function(f) {
      connect.assertNotNull(f, 'f');
      connect.assertTrue(connect.isFunction(f), 'f must be a function');
      return this.upstreamBus.subscribeAll(f);
   };

   Conduit.prototype.onDownstream = function(eventName, f) {
      connect.assertNotNull(eventName, 'eventName');
      connect.assertNotNull(f, 'f');
      connect.assertTrue(connect.isFunction(f), 'f must be a function');
      return this.downstreamBus.subscribe(eventName, f);
   };

   Conduit.prototype.onAllDownstream = function(f) {
      connect.assertNotNull(f, 'f');
      connect.assertTrue(connect.isFunction(f), 'f must be a function');
      return this.downstreamBus.subscribeAll(f);
   };

   Conduit.prototype.sendUpstream = function(eventName, data) {
      connect.assertNotNull(eventName, 'eventName');
      this.upstream.send({event: eventName, data: data});
   };

   Conduit.prototype.sendDownstream = function(eventName, data) {
      connect.assertNotNull(eventName, 'eventName');
      this.downstream.send({event: eventName, data: data});
   };

   Conduit.prototype._dispatchEvent = function(bus, messageEvent) {
      var message = messageEvent.data;
      if (message.event) {
         bus.trigger(message.event, message.data);
      }
   };

   /**
    * Returns a closure which passes events upstream.
    *
    * Usage:
    * conduit.onDownstream("MyEvent", conduit.passUpstream());
    */
   Conduit.prototype.passUpstream = function() {
      var self = this;
      return function(data, eventName) {
         self.upstream.send({event: eventName, data: data});
      };
   };

   /**
    * Returns a closure which passes events downstream.
    *
    * Usage:
    * conduit.onUpstream("MyEvent", conduit.passDownstream());
    */
   Conduit.prototype.passDownstream = function() {
      var self = this;
      return function(data, eventName) {
         self.downstream.send({event: eventName, data: data});
      };
   };

   /**
    * Shutdown the conduit's event busses and remove all subscriptions.
    */
   Conduit.prototype.shutdown = function() {
      this.upstreamBus.unsubscribeAll();
      this.downstreamBus.unsubscribeAll();
   };

   /**---------------------------------------------------------------
    * class IFrameConduit extends Conduit
    *
    * Creates a conduit for the given IFrame element.
    */
   var IFrameConduit = function(name, window, iframe, domain) {
      Conduit.call(this, name, new WindowIOStream(window, iframe.contentWindow, domain || '*'), null);
   };
   IFrameConduit.prototype = Object.create(Conduit.prototype);
   IFrameConduit.prototype.constructor = IFrameConduit;

   connect.Stream = Stream;
   connect.NullStream = NullStream;
   connect.WindowStream = WindowStream;
   connect.WindowIOStream = WindowIOStream;
   connect.PortStream = PortStream;
   connect.StreamMultiplexer = StreamMultiplexer;
   connect.Conduit = Conduit;
   connect.IFrameConduit = IFrameConduit;
})();

/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function() {
   var global = this;
   connect = global.connect || {};
   global.connect = connect;
   global.lily = connect;

   /**---------------------------------------------------------------
    * enum ClientMethods
    */
   connect.ClientMethods = connect.makeEnum([
         'getAgentSnapshot',
         'putAgentState',
         'getAgentStates',
         'getDialableCountryCodes',
         'getRoutingProfileQueues',
         'getAgentPermissions',
         'getAgentConfiguration',
         'updateAgentConfiguration',
         'acceptContact',
         'createOutboundContact',
         'destroyContact',
         'notifyContactIssue',
         'updateContactAttributes',
         'createAdditionalConnection',
         'destroyConnection',
         'holdConnection',
         'resumeConnection',
         'toggleActiveConnections',
         'conferenceConnections',
         'sendClientLogs',
         'sendDigits',
         'sendSoftphoneCallReport',
         'sendSoftphoneCallMetrics',
         'getEndpoints',
         'getNewAuthToken',
         'createTransport'
   ]);

   /**---------------------------------------------------------------
    * enum MasterMethods
    */
   connect.MasterMethods = connect.makeEnum([
         'becomeMaster',
         'checkMaster'
   ]);

   /**---------------------------------------------------------------
    * abstract class ClientBase
    */
   var ClientBase = function() {};
   ClientBase.EMPTY_CALLBACKS = {
      success: function() { },
      failure: function() { }
   };

   ClientBase.prototype.call = function(method, paramsIn, callbacksIn) {
      connect.assertNotNull(method, 'method');
      var params = paramsIn || {};
      var callbacks = callbacksIn || ClientBase.EMPTY_CALLBACKS;
      this._callImpl(method, params, callbacks);
   };

   ClientBase.prototype._callImpl = function(method, params, callbacks) {
      throw new connect.NotImplementedError();
   };

   /**---------------------------------------------------------------
    * class NullClient extends ClientBase
    */
   var NullClient = function() {
      ClientBase.call(this);
   };
   NullClient.prototype = Object.create(ClientBase.prototype);
   NullClient.prototype.constructor = NullClient;

   NullClient.prototype._callImpl = function(method, params, callbacks) {
      if (callbacks && callbacks.failure) {
         var message = connect.sprintf('No such method exists on NULL client: %s', method);
         callbacks.failure(new connect.ValueError(message), {message: message});
      }
   };

   /**---------------------------------------------------------------
    * abstract class UpstreamConduitClientBase extends ClientBase
    */
   var UpstreamConduitClientBase = function(conduit, requestEvent, responseEvent) {
      ClientBase.call(this);
      this.conduit = conduit;
      this.requestEvent = requestEvent;
      this.responseEvent = responseEvent;
      this._requestIdCallbacksMap = {};

      this.conduit.onUpstream(responseEvent, connect.hitch(this, this._handleResponse));
   };

   UpstreamConduitClientBase.prototype = Object.create(ClientBase.prototype);
   UpstreamConduitClientBase.prototype.constructor = UpstreamConduitClientBase;

   UpstreamConduitClientBase.prototype._callImpl = function(method, params, callbacks) {
      var request = connect.EventFactory.createRequest(this.requestEvent, method, params);
      this._requestIdCallbacksMap[request.requestId] = callbacks;
      this.conduit.sendUpstream(request.event, request);
   };

   UpstreamConduitClientBase.prototype._getCallbacksForRequest = function(requestId) {
      var callbacks = this._requestIdCallbacksMap[requestId] || null;

      if (callbacks != null) {
         delete this._requestIdCallbacksMap[requestId];
      }

      return callbacks;
   };

   UpstreamConduitClientBase.prototype._handleResponse = function(data) {
      var callbacks = this._getCallbacksForRequest(data.requestId);
      if (callbacks == null) {
         return;
      }

      if (data.err && callbacks.failure) {
         callbacks.failure(data.err, data.data);

      } else if (callbacks.success) {
         callbacks.success(data.data);
      }
   };

   /**---------------------------------------------------------------
    * class UpstreamConduitClient extends ClientBase
    */
   var UpstreamConduitClient = function(conduit) {
      UpstreamConduitClientBase.call(this, conduit, connect.EventType.API_REQUEST, connect.EventType.API_RESPONSE);
   };
   UpstreamConduitClient.prototype = Object.create(UpstreamConduitClientBase.prototype);
   UpstreamConduitClient.prototype.constructor = UpstreamConduitClient;

   /**---------------------------------------------------------------
    * class UpstreamConduitMasterClient extends ClientBase
    */
   var UpstreamConduitMasterClient = function(conduit) {
      UpstreamConduitClientBase.call(this, conduit, connect.EventType.MASTER_REQUEST, connect.EventType.MASTER_RESPONSE);
   };
   UpstreamConduitMasterClient.prototype = Object.create(UpstreamConduitClientBase.prototype);
   UpstreamConduitMasterClient.prototype.constructor = UpstreamConduitMasterClient;

   /**---------------------------------------------------------------
    * class AWSClient extends ClientBase
    */
   var AWSClient = function(authToken, region, endpointIn) {
      connect.assertNotNull(authToken, 'authToken');
      connect.assertNotNull(region, 'region');
      ClientBase.call(this);
      AWS.config.credentials = new AWS.Credentials({});
      AWS.config.region = region;
      this.authToken = authToken;
      var endpointUrl = endpointIn || connect.getBaseUrl() + '/connect/api';
      var endpoint = new AWS.Endpoint(endpointUrl);
      this.client = new AWS.Connect({endpoint: endpoint});
   };
   AWSClient.prototype = Object.create(ClientBase.prototype);
   AWSClient.prototype.constructor = AWSClient;

   AWSClient.prototype._callImpl = function(method, params, callbacks) {
      var self = this;
      var log = connect.getLog();

      params.authentication = {
         authToken: this.authToken
      };

      if (! connect.contains(this.client, method)) {
         var message = connect.sprintf('No such method exists on AWS client: %s', method);
         callbacks.failure(new connect.ValueError(message), {message: message});

      } else {
         params = this._translateParams(method, params);

         log.trace("AWSClient: --> Calling operation '%s'", method);

         this.client[method](params)
            .on('build', function(request) {
               request.httpRequest.headers['X-Amz-Bearer'] = self.authToken;
            })
            .send(function(err, data) {
               try {
                  if (err) {
                     if (err.code === connect.CTIExceptions.UNAUTHORIZED_EXCEPTION) {
                        callbacks.authFailure();
                     } else if (callbacks.accessDenied && (err.code === connect.CTIExceptions.ACCESS_DENIED_EXCEPTION || err.statusCode === 403)) {
                        callbacks.accessDenied();
                     } else{
                        // Can't pass err directly to postMessage
                        // postMessage() tries to clone the err object and failed.
                        // Refer to https://github.com/goatslacker/alt-devtool/issues/5
                        var error = {};
                        error.type = err.code;
                        error.message = err.message;
                        error.stack = err.stack ? err.stack.split('\n') : [];
                        callbacks.failure(error, data);
                     }

                     log.trace("AWSClient: <-- Operation '%s' failed: %s", method, JSON.stringify(err));

                  } else {
                     log.trace("AWSClient: <-- Operation '%s' succeeded.", method).withObject(data);
                     callbacks.success(data);
                  }
               } catch (e) {
                  connect.getLog().error("Failed to handle AWS API request for method %s", method)
                        .withException(e);
               }
            });
      }
   };

   AWSClient.prototype._translateParams = function(method, params) {
      switch (method) {
         case connect.ClientMethods.UPDATE_AGENT_CONFIGURATION:
            params.configuration = this._translateAgentConfiguration(params.configuration);
            break;

         case connect.ClientMethods.SEND_SOFTPHONE_CALL_METRICS:
            params.softphoneStreamStatistics = this._translateSoftphoneStreamStatistics(
                  params.softphoneStreamStatistics);
            break;

         case connect.ClientMethods.SEND_SOFTPHONE_CALL_REPORT:
            params.report = this._translateSoftphoneCallReport(params.report);
            break;

         default:
            break;
      }

      return params;
   };

   AWSClient.prototype._translateAgentConfiguration = function(config) {
      return {
         name: config.name,
         softphoneEnabled: config.softphoneEnabled,
         softphoneAutoAccept: config.softphoneAutoAccept,
         extension: config.extension,
         routingProfile: this._translateRoutingProfile(config.routingProfile),
         agentPreferences: config.agentPreferences
      };
   };

   AWSClient.prototype._translateRoutingProfile = function(profile) {
      return {
         name: profile.name,
         routingProfileARN: profile.routingProfileARN,
         defaultOutboundQueue: this._translateQueue(profile.defaultOutboundQueue)
      };
   };

   AWSClient.prototype._translateQueue = function(queue) {
      return {
         queueARN:   queue.queueARN,
         name:       queue.name
      };
   };

   AWSClient.prototype._translateSoftphoneStreamStatistics = function(stats) {
      stats.forEach(function(stat) {
         if ('packetsCount' in stat) {
            stat.packetCount = stat.packetsCount;
            delete stat.packetsCount;
         }
      });

      return stats;
   };

   AWSClient.prototype._translateSoftphoneCallReport = function(report) {
      if ('handshakingTimeMillis' in report) {
         report.handshakeTimeMillis = report.handshakingTimeMillis;
         delete report.handshakingTimeMillis;
      }

      if ('preTalkingTimeMillis' in report) {
         report.preTalkTimeMillis = report.preTalkingTimeMillis;
         delete report.preTalkingTimeMillis;
      }

      if ('handshakingFailure' in report) {
         report.handshakeFailure = report.handshakingFailure;
         delete report.handshakingFailure;
      }

      if ('talkingTimeMillis' in report) {
         report.talkTimeMillis = report.talkingTimeMillis;
         delete report.talkingTimeMillis;
      }

      report.softphoneStreamStatistics = this._translateSoftphoneStreamStatistics(
            report.softphoneStreamStatistics);

      return report;
   };

   connect.ClientBase = ClientBase;
   connect.NullClient = NullClient;
   connect.UpstreamConduitClient = UpstreamConduitClient;
   connect.UpstreamConduitMasterClient = UpstreamConduitMasterClient;
   connect.AWSClient = AWSClient;

})();

/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function() {
   var global = this;
   connect = global.connect || {};
   global.connect = connect;
   global.lily = connect;

   /**-------------------------------------------------------------------------
    * GraphLink <<abstract class>>
    *
    * Represents the association of one or more attributes to a state transition.
    */
   var GraphLink = function(fromState, toState) {
      connect.assertNotNull(fromState, 'fromState');
      connect.assertNotNull(toState, 'toState');
      this.fromState = fromState;
      this.toState = toState;
   };

   GraphLink.prototype.getAssociations = function(context) {
      throw connect.NotImplementedError();
   };

   GraphLink.prototype.getFromState = function() {
      return this.fromState;
   };

   GraphLink.prototype.getToState = function() {
      return this.toState;
   };

   /**-------------------------------------------------------------------------
    * DirectGraphLink <<concrete class>> extends GraphLink
    *
    * Represents the by-value representation of one or more attributes to a
    * state transition.
    */
   var DirectGraphLink = function(fromState, toState, associations) {
      connect.assertNotNull(fromState, 'fromState');
      connect.assertNotNull(toState, 'toState');
      connect.assertNotNull(associations, 'associations');
      GraphLink.call(this, fromState, toState);
      this.associations = associations;
   };
   DirectGraphLink.prototype = Object.create(GraphLink.prototype);
   DirectGraphLink.prototype.constructor = DirectGraphLink;

   DirectGraphLink.prototype.getAssociations = function(context) {
      return this.associations;
   };

   /**
    * FunctionalGraphLink <<concrete class>> extends GraphLink
    *
    * Represents a functional association of one or more attributes to a
    * state transition.
    */
   var FunctionalGraphLink = function(fromState, toState, closure) {
      connect.assertNotNull(fromState, 'fromState');
      connect.assertNotNull(toState, 'toState');
      connect.assertNotNull(closure, 'closure');
      connect.assertTrue(connect.isFunction(closure), 'closure must be a function');
      GraphLink.call(this, fromState, toState);
      this.closure = closure;
   };
   FunctionalGraphLink.prototype = Object.create(GraphLink.prototype);
   FunctionalGraphLink.prototype.constructor = FunctionalGraphLink;

   FunctionalGraphLink.prototype.getAssociations = function(context) {
      return this.closure(context, this.getFromState(), this.getToState());
   };

   /**-------------------------------------------------------------------------
    * EventGraph <<class>>
    *
    * Builds a map of associations from one state to another in context of a
    * particular object.  The associations can be direct (one or more values)
    * or functional (a method returning one or more values), and are used to
    * provide additional contextual event hooks for the UI to consume.
    */
   var EventGraph = function() {
      this.fromMap = {};
   };
   EventGraph.ANY = "<<any>>";

   EventGraph.prototype.assoc = function(fromStateObj, toStateObj, assocObj) {
      var self = this;

      if (! fromStateObj) {
         throw new Error("fromStateObj is not defined.");
      }

      if (! toStateObj) {
         throw new Error("toStateObj is not defined.");
      }

      if (! assocObj) {
         throw new Error("assocObj is not defined.");
      }

      if (fromStateObj instanceof Array) {
         fromStateObj.forEach(function(fromState) {
            self.assoc(fromState, toStateObj, assocObj);
         });
      } else if (toStateObj instanceof Array) {
         toStateObj.forEach(function(toState) {
            self.assoc(fromStateObj, toState, assocObj);
         });
      } else {
         if (typeof assocObj === "function") {
            this._addAssociation(new FunctionalGraphLink(fromStateObj, toStateObj, assocObj));
         } else if (assocObj instanceof Array) {
            this._addAssociation(new DirectGraphLink(fromStateObj, toStateObj, assocObj));
         } else {
            this._addAssociation(new DirectGraphLink(fromStateObj, toStateObj, [assocObj]));
         }
      }
      return this;
   };

   EventGraph.prototype.getAssociations = function(context, fromState, toState) {
      connect.assertNotNull(fromState, 'fromState');
      connect.assertNotNull(toState, 'toState');
      var associations = [];

      var toMapFromAny = this.fromMap[EventGraph.ANY] || {};
      var toMap = this.fromMap[fromState] || {};

      associations = associations.concat(this._getAssociationsFromMap(
               toMapFromAny, context, fromState, toState));
      associations = associations.concat(this._getAssociationsFromMap(
               toMap, context, fromState, toState));

      return associations;
   };

   EventGraph.prototype._addAssociation = function(assoc) {
      var toMap = this.fromMap[assoc.getFromState()];

      if (! toMap) {
         toMap = this.fromMap[assoc.getFromState()] = {};
      }

      var assocList = toMap[assoc.getToState()];

      if (! assocList) {
         assocList = toMap[assoc.getToState()] = [];
      }

      assocList.push(assoc);
   };

   EventGraph.prototype._getAssociationsFromMap = function(map, context, fromState, toState) {
      var assocList = (map[EventGraph.ANY] || []).concat(map[toState] || []);
      return assocList.reduce(function(prev, assoc) {
         return prev.concat(assoc.getAssociations(context));
      }, []);
   };

   connect.EventGraph = EventGraph;

})();

/*
* Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
*
* Licensed under the Amazon Software License (the "License"). You may not use
* this file except in compliance with the License. A copy of the License is
* located at
*
*    http://aws.amazon.com/asl/
*
* or in the "license" file accompanying this file. This file is distributed
* on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
* or implied. See the License for the specific language governing permissions
* and limitations under the License.
*/
(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  /*----------------------------------------------------------------
  * enum AgentStateType
  */
  connect.AgentStateType = connect.makeEnum([
    'init',
    'routable',
    'not_routable',
    'offline'
  ]);
  connect.AgentStatusType = connect.AgentStateType;

  /**
   * enum AgentAvailStates
   */
  connect.AgentAvailStates = connect.makeEnum([
    'Init',
    'Busy',
    'AfterCallWork',
    'CallingCustomer',
    'Dialing',
    'Joining',
    'PendingAvailable',
    'PendingBusy'
  ]);

  /**
   * enum AgentErrorStates
   */
  connect.AgentErrorStates = connect.makeEnum([
    'Error',
    'AgentHungUp',
    'BadAddressAgent',
    'BadAddressCustomer',
    'Default',
    'FailedConnectAgent',
    'FailedConnectCustomer',
    'LineEngagedAgent',
    'LineEngagedCustomer',
    'MissedCallAgent',
    'MissedCallCustomer',
    'MultipleCcpWindows',
    'RealtimeCommunicationError'
  ]);

  /*----------------------------------------------------------------
  * enum AddressType
  */
  connect.EndpointType = connect.makeEnum([
    'phone_number',
    'agent',
    'queue'
  ]);
  connect.AddressType = connect.EndpointType;

  /*----------------------------------------------------------------
  * enum ConnectionType
  */
  connect.ConnectionType = connect.makeEnum([
    'agent',
    'inbound',
    'outbound',
    'monitoring'
  ]);

  /*----------------------------------------------------------------
  * enum ConnectionStateType
  */
  connect.ConnectionStateType = connect.makeEnum([
    'init',
    'connecting',
    'connected',
    'hold',
    'disconnected'
  ]);
  connect.ConnectionStatusType = connect.ConnectionStateType;

  connect.CONNECTION_ACTIVE_STATES = connect.set([
    connect.ConnectionStateType.CONNECTING,
    connect.ConnectionStateType.CONNECTED,
    connect.ConnectionStateType.HOLD
  ]);

  /*----------------------------------------------------------------
  * enum ContactStateType
  */
  connect.ContactStateType = connect.makeEnum([
    'init',
    'incoming',
    'pending',
    'connecting',
    'connected',
    'missed',
    'error',
    'ended'
  ]);
  connect.ContactStatusType = connect.ContactStateType;

  connect.CONTACT_ACTIVE_STATES = connect.makeEnum([
    'incoming',
    'connecting',
    'connected'
  ]);

  /*----------------------------------------------------------------
  * enum ContactType
  */
  connect.ContactType = connect.makeEnum([
    'voice',
    'queue_callback',
    'chat'
  ]);

  /*----------------------------------------------------------------
  * enum MediaType
  */
  connect.MediaType = connect.makeEnum([
    'softphone',
    'chat'
  ]);

  /*----------------------------------------------------------------
  * enum SoftphoneCallType
  */
  connect.SoftphoneCallType = connect.makeEnum([
    'audio_video',
    'video_only',
    'audio_only',
    'none'
  ]);

  /*----------------------------------------------------------------
  * enum for SoftphoneErrorTypes
  */
  connect.SoftphoneErrorTypes = connect.makeEnum([
    'unsupported_browser',
    'microphone_not_shared',
    'signalling_handshake_failure',
    'signalling_connection_failure',
    'ice_collection_timeout',
    'user_busy_error',
    'webrtc_error',
    'realtime_communication_error',
    'other'
  ]);

  /*----------------------------------------------------------------
  * enum for CTI exceptions
  */
  connect.CTIExceptions = connect.makeEnum([
    "AccessDeniedException",
    "InvalidStateException",
    "BadEndpointException",
    "InvalidAgentARNException",
    "InvalidConfigurationException",
    "InvalidContactTypeException",
    "PaginationException",
    "RefreshTokenExpiredException",
    "SendDataFailedException",
    "UnauthorizedException"
  ]);
  /*----------------------------------------------------------------
  * class Agent
  */
  var Agent = function () {
    if (!connect.agent.initialized) {
      throw new connect.StateError("The agent is not yet initialized!");
    }
  };

  Agent.prototype._getData = function () {
    return connect.core.getAgentDataProvider().getAgentData();
  };

  Agent.prototype._createContactAPI = function (contactData) {
    return new connect.Contact(contactData.contactId);
  };

  Agent.prototype.onContactPending = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.CONTACT_PENDING, f);
  };

  Agent.prototype.onRefresh = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.REFRESH, f);
  };

  Agent.prototype.onRoutable = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.ROUTABLE, f);
  };

  Agent.prototype.onNotRoutable = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.NOT_ROUTABLE, f);
  };

  Agent.prototype.onOffline = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.OFFLINE, f);
  };

  Agent.prototype.onError = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.ERROR, f);
  };

  Agent.prototype.onSoftphoneError = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.SOFTPHONE_ERROR, f);
  };

  Agent.prototype.onAfterCallWork = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.ACW, f);
  };

  Agent.prototype.onStateChange = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(connect.AgentEvents.STATE_CHANGE, f);
  };

  Agent.prototype.onMuteToggle = function (f) {
    connect.core.getUpstream().onUpstream(connect.AgentEvents.MUTE_TOGGLE, f);
  };

  Agent.prototype.mute = function () {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
      {
        event: connect.EventType.MUTE,
        data: { mute: true }
      });
  };

  Agent.prototype.unmute = function () {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
      {
        event: connect.EventType.MUTE,
        data: { mute: false }
      });
  };

  Agent.prototype.getState = function () {
    return this._getData().snapshot.state;
  };

  Agent.prototype.getStatus = Agent.prototype.getState;

  Agent.prototype.getStateDuration = function () {
    return connect.now() - this._getData().snapshot.state.startTimestamp.getTime() + connect.core.getSkew();
  };

  Agent.prototype.getStatusDuration = Agent.prototype.getStateDuration;

  Agent.prototype.getPermissions = function () {
    return this.getConfiguration().permissions;
  };

  Agent.prototype.getContacts = function (contactTypeFilter) {
    var self = this;
    return this._getData().snapshot.contacts.map(function (contactData) {
      return self._createContactAPI(contactData);
    }).filter(function (contact) {
      return (!contactTypeFilter) || contact.getType() === contactTypeFilter;
    });
  };

  Agent.prototype.getConfiguration = function () {
    return this._getData().configuration;
  };

  Agent.prototype.getAgentStates = function () {
    return this.getConfiguration().agentStates;
  };

  Agent.prototype.getRoutingProfile = function () {
    return this.getConfiguration().routingProfile;
  };

  Agent.prototype.getName = function () {
    return this.getConfiguration().name;
  };

  Agent.prototype.getExtension = function () {
    return this.getConfiguration().extension;
  };

  Agent.prototype.getDialableCountries = function () {
    return this.getConfiguration().dialableCountries;
  };

  Agent.prototype.isSoftphoneEnabled = function () {
    return this.getConfiguration().softphoneEnabled;
  };

  Agent.prototype.setConfiguration = function (configuration, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.UPDATE_AGENT_CONFIGURATION, {
      configuration: connect.assertNotNull(configuration, 'configuration')
    }, {
        success: function (data) {
          // We need to ask the shared worker to reload agent config
          // once we change it so every tab has accurate config.
          var conduit = connect.core.getUpstream();
          conduit.sendUpstream(connect.EventType.RELOAD_AGENT_CONFIGURATION);

          if (callbacks.success) {
            callbacks.success(data);
          }
        },
        failure: callbacks.failure
      });
  };

  Agent.prototype.setState = function (state, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.PUT_AGENT_STATE, {
      state: connect.assertNotNull(state, 'state')
    }, callbacks);
  };

  Agent.prototype.setStatus = Agent.prototype.setState;

  Agent.prototype.connect = function (endpointIn, params) {
    var client = connect.core.getClient();
    var endpoint = new connect.Endpoint(endpointIn);
    // Have to remove the endpointId field or AWS JS SDK gets mad.
    delete endpoint.endpointId;

    client.call(connect.ClientMethods.CREATE_OUTBOUND_CONTACT, {
      endpoint: connect.assertNotNull(endpoint, 'endpoint'),
      queueARN: params.queueARN || params.queueId || this.getRoutingProfile().defaultOutboundQueue.queueARN
    }, {
        success: params.success,
        failure: params.failure
      });
  };

  Agent.prototype.getAllQueueARNs = function () {
    return this.getConfiguration().routingProfile.queues.map(function (queue) {
      return queue.queueARN;
    });
  };

  Agent.prototype.getEndpoints = function (queueARNs, callbacks, pageInfoIn) {
    var self = this;
    var client = connect.core.getClient();
    var pageInfo = pageInfoIn || { endpoints: [] };

    pageInfo.maxResults = pageInfo.maxResults || connect.DEFAULT_BATCH_SIZE;

    // Backwards compatibility allowing a single queueARN to be specified
    // instead of an array.
    if (!connect.isArray(queueARNs)) {
      queueARNs = [queueARNs];
    }

    client.call(connect.ClientMethods.GET_ENDPOINTS, {
      queueARNs: queueARNs,
      nextToken: pageInfo.nextToken || null,
      maxResults: pageInfo.maxResults
    }, {
        success: function (data) {
          if (data.nextToken) {
            self.getEndpoints(queueARNs, callbacks, {
              nextToken: data.nextToken,
              maxResults: pageInfo.maxResults,
              endpoints: pageInfo.endpoints.concat(data.endpoints)
            });
          } else {
            pageInfo.endpoints = pageInfo.endpoints.concat(data.endpoints);
            var endpoints = pageInfo.endpoints.map(function (endpoint) {
              return new connect.Endpoint(endpoint);
            });

            callbacks.success({
              endpoints: endpoints,
              addresses: endpoints
            });
          }
        },
        failure: callbacks.failure
      });
  };

  Agent.prototype.getAddresses = Agent.prototype.getEndpoints;

  Agent.prototype.toSnapshot = function () {
    return new connect.AgentSnapshot(this._getData());
  };

  /*----------------------------------------------------------------
  * class AgentSnapshot
  */
  var AgentSnapshot = function (agentData) {
    connect.Agent.call(this);
    this.agentData = agentData;
  };
  AgentSnapshot.prototype = Object.create(Agent.prototype);
  AgentSnapshot.prototype.constructor = AgentSnapshot;

  AgentSnapshot.prototype._getData = function () {
    return this.agentData;
  };

  AgentSnapshot.prototype._createContactAPI = function (contactData) {
    return new connect.ContactSnapshot(contactData);
  };

  /*----------------------------------------------------------------
  * class Contact
  */
  var Contact = function (contactId) {
    this.contactId = contactId;
  };

  Contact.prototype._getData = function () {
    return connect.core.getAgentDataProvider().getContactData(this.getContactId());
  };

  Contact.prototype._createConnectionAPI = function (connectionData) {
    if (this.getType() === connect.ContactType.CHAT) {
      return new connect.ChatConnection(this.contactId, connectionData.connectionId);
    } else {
      return new connect.VoiceConnection(this.contactId, connectionData.connectionId);
    }
  };

  Contact.prototype.getEventName = function (eventName) {
    return connect.core.getContactEventName(eventName, this.getContactId());
  };

  Contact.prototype.onRefresh = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.REFRESH), f);
  };

  Contact.prototype.onIncoming = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.INCOMING), f);
  };

  Contact.prototype.onConnecting = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.CONNECTING), f);
  };

  Contact.prototype.onPending = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.PENDING), f);
  };

  Contact.prototype.onAccepted = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.ACCEPTED), f);
  };

  Contact.prototype.onMissed = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.MISSED), f);
  };

  Contact.prototype.onEnded = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.ENDED), f);
    bus.subscribe(this.getEventName(connect.ContactEvents.DESTROYED), f);
  };

  Contact.prototype.onDestroy = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.DESTROYED), f);
  };

  Contact.prototype.onACW = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.ACW), f);
  };

  Contact.prototype.onConnected = function (f) {
    var bus = connect.core.getEventBus();
    bus.subscribe(this.getEventName(connect.ContactEvents.CONNECTED), f);
  };

  Contact.prototype.getContactId = function () {
    return this.contactId;
  };

  Contact.prototype.getOriginalContactId = function () {
    return this._getData().initialContactId;
  };

  Contact.prototype.getType = function () {
    return this._getData().type;
  };

  Contact.prototype.getStatus = function () {
    return this._getData().state;
  };

  Contact.prototype.getStatusDuration = function () {
    return connect.now() - this._getData().state.timestamp.getTime() + connect.core.getSkew();
  };

  Contact.prototype.getQueue = function () {
    return this._getData().queue;
  };

  Contact.prototype.getQueueTimestamp = function () {
    return this._getData().queueTimestamp;
  };

  Contact.prototype.getConnections = function () {
    var self = this;
    return this._getData().connections.map(function (connData) {
      if (self.getType() === connect.ContactType.CHAT) {
        return new connect.ChatConnection(self.contactId, connData.connectionId);
      } else {
        return new connect.VoiceConnection(self.contactId, connData.connectionId);
      }
    });
  };

  Contact.prototype.getInitialConnection = function () {
    return connect.find(this.getConnections(), function (conn) {
      return conn.isInitialConnection();
    }) || null;
  };

  Contact.prototype.getActiveInitialConnection = function () {
    var initialConn = this.getInitialConnection();
    if (initialConn != null && initialConn.isActive()) {
      return initialConn;
    } else {
      return null;
    }
  };

  Contact.prototype.getThirdPartyConnections = function () {
    return this.getConnections().filter(function (conn) {
      return !conn.isInitialConnection() && conn.getType() !== connect.ConnectionType.AGENT;
    });
  };

  Contact.prototype.getSingleActiveThirdPartyConnection = function () {
    return this.getThirdPartyConnections().filter(function (conn) {
      return conn.isActive();
    })[0] || null;
  };

  Contact.prototype.getAgentConnection = function () {
    return connect.find(this.getConnections(), function (conn) {
      var connType = conn.getType();
      return connType === connect.ConnectionType.AGENT || connType === connect.ConnectionType.MONITORING;
    });
  };

  Contact.prototype.getAttributes = function () {
    return this._getData().attributes;
  };

  Contact.prototype.isSoftphoneCall = function () {
    return connect.find(this.getConnections(), function (conn) {
      return conn.getSoftphoneMediaInfo() != null;
    }) != null;
  };

  Contact.prototype.isInbound = function () {
    var conn = this.getInitialConnection();
    return conn ? conn.getType() === connect.ConnectionType.INBOUND : false;
  };

  Contact.prototype.isConnected = function () {
    return this.getStatus().type === connect.ContactStateType.CONNECTED;
  };

  Contact.prototype.accept = function (callbacks) {
    var client = connect.core.getClient();
    var self = this;
    client.call(connect.ClientMethods.ACCEPT_CONTACT, {
      contactId: this.getContactId()
    }, {
        success: function (data) {
          var conduit = connect.core.getUpstream();
          conduit.sendUpstream(connect.EventType.BROADCAST, {
            event: connect.ContactEvents.ACCEPTED
          });
          conduit.sendUpstream(connect.EventType.BROADCAST, {
            event: connect.core.getContactEventName(connect.ContactEvents.ACCEPTED,
              self.getContactId())
          });

          if (callbacks && callbacks.success) {
            callbacks.success(data);
          }
        },
        failure: callbacks ? callbacks.failure : null
      });
  };

  Contact.prototype.destroy = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.DESTROY_CONTACT, {
      contactId: this.getContactId()
    }, callbacks);
  };

  Contact.prototype.notifyIssue = function (issueCode, description, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.NOTIFY_CONTACT_ISSUE, {
      contactId: this.getContactId(),
      issueCode: issueCode,
      description: description
    }, callbacks);
  };

  Contact.prototype.addConnection = function (endpointIn, callbacks) {
    var client = connect.core.getClient();
    var endpoint = new connect.Endpoint(endpointIn);
    // Have to remove the endpointId field or AWS JS SDK gets mad.
    delete endpoint.endpointId;

    client.call(connect.ClientMethods.CREATE_ADDITIONAL_CONNECTION, {
      contactId: this.getContactId(),
      endpoint: endpoint
    }, callbacks);
  };

  Contact.prototype.toggleActiveConnections = function (callbacks) {
    var client = connect.core.getClient();
    var connectionId = null;
    var holdingConn = connect.find(this.getConnections(), function (conn) {
      return conn.getStatus().type === connect.ConnectionStateType.HOLD;
    });

    if (holdingConn != null) {
      connectionId = holdingConn.getConnectionId();

    } else {
      var activeConns = this.getConnections().filter(function (conn) {
        return conn.isActive();
      });
      if (activeConns.length > 0) {
        connectionId = activeConns[0].getConnectionId();
      }
    }

    client.call(connect.ClientMethods.TOGGLE_ACTIVE_CONNECTIONS, {
      contactId: this.getContactId(),
      connectionId: connectionId
    }, callbacks);
  };

  Contact.prototype.sendSoftphoneMetrics = function (softphoneStreamStatistics, callbacks) {
    var client = connect.core.getClient();

    client.call(connect.ClientMethods.SEND_SOFTPHONE_CALL_METRICS, {
      contactId: this.getContactId(),
      softphoneStreamStatistics: softphoneStreamStatistics
    }, callbacks);
  };

  Contact.prototype.sendSoftphoneReport = function (report, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.SEND_SOFTPHONE_CALL_REPORT, {
      contactId: this.getContactId(),
      report: report
    }, callbacks);
  };

  Contact.prototype.conferenceConnections = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.CONFERENCE_CONNECTIONS, {
      contactId: this.getContactId()
    }, callbacks);
  };

  Contact.prototype.toSnapshot = function () {
    return new connect.ContactSnapshot(this._getData());
  };

  /*----------------------------------------------------------------
  * class ContactSnapshot
  */
  var ContactSnapshot = function (contactData) {
    connect.Contact.call(this, contactData.contactId);
    this.contactData = contactData;
  };
  ContactSnapshot.prototype = Object.create(Contact.prototype);
  ContactSnapshot.prototype.constructor = ContactSnapshot;

  ContactSnapshot.prototype._getData = function () {
    return this.contactData;
  };

  ContactSnapshot.prototype._createConnectionAPI = function (connectionData) {
    return new connect.ConnectionSnapshot(connectionData);
  };

  /*----------------------------------------------------------------
  * class Connection
  */
  var Connection = function (contactId, connectionId) {
    this.contactId = contactId;
    this.connectionId = connectionId;
    this._initMediaController();
  };

  Connection.prototype._getData = function () {
    return connect.core.getAgentDataProvider().getConnectionData(
      this.getContactId(), this.getConnectionId());
  };

  Connection.prototype.getContactId = function () {
    return this.contactId;
  };

  Connection.prototype.getConnectionId = function () {
    return this.connectionId;
  };

  Connection.prototype.getEndpoint = function () {
    return new connect.Endpoint(this._getData().endpoint);
  };

  Connection.prototype.getAddress = Connection.prototype.getEndpoint;

  Connection.prototype.getStatus = function () {
    return this._getData().state;
  };

  Connection.prototype.getStatusDuration = function () {
    return connect.now() - this._getData().state.timestamp.getTime() + connect.core.getSkew();
  };

  Connection.prototype.getType = function () {
    return this._getData().type;
  };

  Connection.prototype.isInitialConnection = function () {
    return this._getData().initial;
  };

  Connection.prototype.isActive = function () {
    return connect.contains(connect.CONNECTION_ACTIVE_STATES, this.getStatus().type);
  };

  Connection.prototype.isConnected = function () {
    return this.getStatus().type === connect.ConnectionStateType.CONNECTED;
  };

  Connection.prototype.isConnecting = function () {
    return this.getStatus().type === connect.ConnectionStateType.CONNECTING;
  };

  Connection.prototype.isOnHold = function () {
    return this.getStatus().type === connect.ConnectionStateType.HOLD;
  };

  Connection.prototype.getSoftphoneMediaInfo = function () {
    return this._getData().softphoneMediaInfo;
  };

  /**
   * Gets the currently monitored contact info, Returns null if does not exists.
   * @return {{agentName:string, customerName:string, joinTime:Date}}
   */
  Connection.prototype.getMonitorInfo = function () {
    return this._getData().monitoringInfo;
  };


  Connection.prototype.destroy = function (callbacks) {
    var client = connect.core.getClient(), self = this;

    client.call(connect.ClientMethods.DESTROY_CONNECTION, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId()
    }, callbacks);
  };

  Connection.prototype.sendDigits = function (digits, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.SEND_DIGITS, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId(),
      digits: digits
    }, callbacks);
  };

  Connection.prototype.hold = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.HOLD_CONNECTION, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId()
    }, callbacks);
  };

  Connection.prototype.resume = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.RESUME_CONNECTION, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId()
    }, callbacks);
  };

  Connection.prototype.toSnapshot = function () {
    return new connect.ConnectionSnapshot(this._getData());
  };

  Connection.prototype._initMediaController = function () {
    if (this.getMediaInfo()) {
      connect.core.mediaFactory.get(this).catch(function () { });
    }
  }

  /**
   * @class VoiceConnection
   * @param {number} contactId 
   * @param {number} connectionId 
   * @description - Provides voice media specific operations
   */
  var VoiceConnection = function (contactId, connectionId) {
    Connection.call(this, contactId, connectionId);
  };

  VoiceConnection.prototype = Object.create(Connection.prototype);
  VoiceConnection.prototype.constructor = VoiceConnection;

  VoiceConnection.prototype.sendDigits = function (digits, callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.SEND_DIGITS, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId(),
      digits: digits
    }, callbacks);
  };

  VoiceConnection.prototype.hold = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.HOLD_CONNECTION, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId()
    }, callbacks);
  };

  VoiceConnection.prototype.resume = function (callbacks) {
    var client = connect.core.getClient();
    client.call(connect.ClientMethods.RESUME_CONNECTION, {
      contactId: this.getContactId(),
      connectionId: this.getConnectionId()
    }, callbacks);
  };

  VoiceConnection.prototype.isOnHold = function () {
    return this.getStatus().type === connect.ConnectionStateType.HOLD;
  };

  /**
  * @deprecated
  * Please use getMediaInfo 
  */
  VoiceConnection.prototype.getSoftphoneMediaInfo = function () {
    return this._getData().softphoneMediaInfo;
  };

  VoiceConnection.prototype.getMediaInfo = function () {
    return this._getData().softphoneMediaInfo;
  };

  VoiceConnection.prototype.getMediaType = function () {
    return connect.MediaType.SOFTPHONE;
  };

  VoiceConnection.prototype.getMediaController = function () {
    return connect.core.mediaFactory.get(this);
  }


  /**
   * @class ChatConnection
   * @param {*} contactId 
   * @param {*} connectionId 
   * @description adds the chat media specific functionality
   */
  var ChatConnection = function (contactId, connectionId) {
    Connection.call(this, contactId, connectionId);
  };

  ChatConnection.prototype = Object.create(Connection.prototype);
  ChatConnection.prototype.constructor = ChatConnection;

  ChatConnection.prototype.getMediaInfo = function () {
    var data = this._getData().chatMediaInfo;
    if (!data) {
      return null;
    } else {
      var contactData = connect.core.getAgentDataProvider().getContactData(this.contactId);
      var mediaObject = {
        contactId: this.contactId,
        initialContactId: contactData.initialContactId || this.contactId,
        participantId: this.connectionId
      };
      if (data.connectionData) {
        try {
          mediaObject.participantToken = JSON.parse(data.connectionData).ConnectionAuthenticationToken;
        } catch (e) {
          connect.getLog().error(connect.LogComponent.CHAT, "Connection data is invalid").withObject(data).withException(e);
          mediaObject.participantToken = null;
        }
      }
      /** Just to keep the data accessible */
      mediaObject.originalInfo = this._getData().chatMediaInfo;
      return mediaObject;
    }
  };

  ChatConnection.prototype.getMediaType = function () {
    return connect.MediaType.CHAT;
  };

  ChatConnection.prototype.getMediaController = function () {
    return connect.core.mediaFactory.get(this);
  };

  ChatConnection.prototype._initMediaController = function () {
    var mediaInfo = this.getMediaInfo();
    if (mediaInfo.participantToken) {
      connect.core.mediaFactory.get(this).catch(function () { });
    }
  }

  /*----------------------------------------------------------------
  * class ConnectionSnapshot
  */
  var ConnectionSnapshot = function (connectionData) {
    connect.Connection.call(this, connectionData.contactId, connectionData.connectionId);
    this.connectionData = connectionData;
  };
  ConnectionSnapshot.prototype = Object.create(Connection.prototype);
  ConnectionSnapshot.prototype.constructor = ConnectionSnapshot;

  ConnectionSnapshot.prototype._getData = function () {
    return this.connectionData;
  };

  ConnectionSnapshot.prototype._initMediaController = function () { };

  var Endpoint = function (paramsIn) {
    var params = paramsIn || {};
    this.endpointARN = params.endpointId || params.endpointARN || null;
    this.endpointId = this.endpointARN;
    this.type = params.type || null;
    this.name = params.name || null;
    this.phoneNumber = params.phoneNumber || null;
    this.agentLogin = params.agentLogin || null;
    this.queue = params.queue || null;
  };

  /**
   * Strip the SIP endpoint components from the phoneNumber field.
   */
  Endpoint.prototype.stripPhoneNumber = function () {
    return this.phoneNumber ? this.phoneNumber.replace(/sip:([^@]*)@.*/, "$1") : "";
  };

  /**
   * Create an Endpoint object from the given phone number and name.
   */
  Endpoint.byPhoneNumber = function (number, name) {
    return new Endpoint({
      type: connect.EndpointType.PHONE_NUMBER,
      phoneNumber: number,
      name: name || null
    });
  };

  /*----------------------------------------------------------------
  * class SoftphoneError
  */
  var SoftphoneError = function (errorType, errorMessage, endPointUrl) {
    this.errorType = errorType;
    this.errorMessage = errorMessage;
    this.endPointUrl = endPointUrl;
  };
  SoftphoneError.prototype.getErrorType = function () {
    return this.errorType;
  };
  SoftphoneError.prototype.getErrorMessage = function () {
    return this.errorMessage;
  };
  SoftphoneError.prototype.getEndPointUrl = function () {
    return this.endPointUrl;
  };

  /*----------------------------------------------------------------
  * Root Subscription APIs.
  */
  connect.agent = function (f) {
    var bus = connect.core.getEventBus();
    var sub = bus.subscribe(connect.AgentEvents.INIT, f);
    if (connect.agent.initialized) {
      f(new connect.Agent());
    }
    return sub;
  };
  connect.agent.initialized = false;

  connect.contact = function (f) {
    var bus = connect.core.getEventBus();
    return bus.subscribe(connect.ContactEvents.INIT, f);
  };

  /**
   * Execute the given function asynchronously only if the shared worker
   * says we are the master for the given topic.  If there is no master for
   * the given topic, we become the master and execute the function.
   *
   * @param topic The master topic we are concerned about.
   * @param f_true The callback to be invoked if we are the master.
   * @param f_else [optional] A callback to be invoked if we are not the master.
   */
  connect.ifMaster = function (topic, f_true, f_else) {
    connect.assertNotNull(topic, "A topic must be provided.");
    connect.assertNotNull(f_true, "A true callback must be provided.");

    if (!connect.core.masterClient) {
      // We can't be the master because there is no master client!
      connect.getLog().warn("We can't be the master for topic '%s' because there is no master client!", topic);
      if (f_else) {
        f_else();
      }
      return;
    }

    var masterClient = connect.core.getMasterClient();
    masterClient.call(connect.MasterMethods.CHECK_MASTER, {
      topic: topic
    }, {
        success: function (data) {
          if (data.isMaster) {
            f_true();

          } else if (f_else) {
            f_else();
          }
        }
      });
  };

  /**
   * Notify the shared worker that we are now the master for the given topic.
   */
  connect.becomeMaster = function (topic) {
    connect.assertNotNull(topic, "A topic must be provided.");
    var masterClient = connect.core.getMasterClient();
    masterClient.call(connect.MasterMethods.BECOME_MASTER, {
      topic: topic
    });
  };

  connect.Agent = Agent;
  connect.AgentSnapshot = AgentSnapshot;
  connect.Contact = Contact;
  connect.ContactSnapshot = ContactSnapshot;
  /** Default will get the Voice connection */
  connect.Connection = VoiceConnection;
  connect.BaseConnection = Connection;
  connect.VoiceConnection = VoiceConnection;
  connect.ChatConnection = ChatConnection;
  connect.ConnectionSnapshot = ConnectionSnapshot;
  connect.Endpoint = Endpoint;
  connect.Address = Endpoint;
  connect.SoftphoneError = SoftphoneError;
})();

/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  connect.core = {};

  connect.core.initialized = false;

  connect.DEFAULT_BATCH_SIZE = 100;


  var CCP_SYN_TIMEOUT = 1000; // 1 sec
  var CCP_ACK_TIMEOUT = 3000; // 3 sec
  var CCP_LOAD_TIMEOUT = 3000; // 3 sec
  var CCP_IFRAME_REFRESH_INTERVAL = 5000; // 5 sec

  var LOGIN_URL_PATTERN = "https://{alias}.awsapps.com/auth/?client_id={client_id}&redirect_uri={redirect}";
  var CLIENT_ID_MAP = {
    "us-east-1": "06919f4fd8ed324e"
  };

  var AUTHORIZE_ENDPOINT = "/connect/auth/authorize";
  var AUTHORIZE_RETRY_INTERVAL = 2000;
  var AUTHORIZE_MAX_RETRY = 5;

  var WHITELISTED_ORIGINS_ENDPOINT = "/connect/whitelisted-origins";
  var WHITELISTED_ORIGINS_RETRY_INTERVAL = 2000;
  var WHITELISTED_ORIGINS_MAX_RETRY = 5;

  /**
   * @deprecated
   * We will no longer need this function soon.
   */
  var createLoginUrl = function (params) {
    var redirect = "https://lily.us-east-1.amazonaws.com/taw/auth/code";
    connect.assertNotNull(redirect);

    if (params.alias) {
      return LOGIN_URL_PATTERN.replace("{alias}", params.alias)
        .replace("{client_id}", CLIENT_ID_MAP["us-east-1"])
        .replace("{redirect}", global.encodeURIComponent(redirect));
    } else if (params.loginUrl) {
      /** Now SAML users can pass custom Login URLs to handle the Auth*/
      return params.loginUrl;
    } else {
      return params.ccpUrl;
    }
  };

  /**-------------------------------------------------------------------------
   * Returns scheme://host:port for a given url
   */
  function sanitizeDomain(url){
    var domain = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/ig);
    return domain.length ? domain[0] : "";
  }

  /**-------------------------------------------------------------------------
   * Print a warning message if the Connect core is not initialized.
   */
  connect.core.checkNotInitialized = function () {
    if (connect.core.initialized) {
      var log = connect.getLog();
      log.warn("Connect core already initialized, only needs to be initialized once.");
    }
  };
  /**-------------------------------------------------------------------------
   * Basic Connect client initialization.
   * Should be used only by the API Shared Worker.
   */
  connect.core.init = function (params) {
    connect.core.eventBus = new connect.EventBus();
    connect.core.agentDataProvider = new AgentDataProvider(connect.core.getEventBus());
    connect.core.initClient(params);
    connect.core.initialized = true;
  };

  /**-------------------------------------------------------------------------
   * Initialized AWS client
   * Should be used by Shared Worker to update AWS client with new credentials
   * after refreshed authentication.
   */
  connect.core.initClient = function (params) {
    connect.assertNotNull(params, 'params');

    var authToken = connect.assertNotNull(params.authToken, 'params.authToken');
    var region = connect.assertNotNull(params.region, 'params.region');
    var endpoint = params.endpoint || null;

    connect.core.client = new connect.AWSClient(authToken, region, endpoint);
  };

  /**-------------------------------------------------------------------------
   * Uninitialize Connect.
   */
  connect.core.terminate = function () {
    connect.core.client = new connect.NullClient();
    connect.core.masterClient = new connect.NullClient();
    var bus = connect.core.getEventBus();
    if (bus) bus.unsubscribeAll();
    connect.core.bus = new connect.EventBus();
    connect.core.agentDataProvider = null;
    connect.core.upstream = null;
    connect.core.keepaliveManager = null;
    connect.agent.initialized = false;
    connect.core.initialized = false;
  };

  /**-------------------------------------------------------------------------
   * Setup the SoftphoneManager to be initialized when the agent
   * is determined to have softphone enabled.
   */
  connect.core.softphoneUserMediaStream = null;

  connect.core.getSoftphoneUserMediaStream = function () {
    return connect.core.softphoneUserMediaStream;
  };

  connect.core.setSoftphoneUserMediaStream = function (stream) {
    connect.core.softphoneUserMediaStream = stream;
  };

  connect.core.initRingtoneEngines = function (params) {
    connect.assertNotNull(params, "params");

    var setupRingtoneEngines = function (ringtoneSettings) {
      connect.assertNotNull(ringtoneSettings, "ringtoneSettings");
      connect.assertNotNull(ringtoneSettings.voice, "ringtoneSettings.voice");
      connect.assertTrue(ringtoneSettings.voice.ringtoneUrl || ringtoneSettings.voice.disabled, "ringtoneSettings.voice.ringtoneUrl must be provided or ringtoneSettings.voice.disabled must be true");
      connect.assertNotNull(ringtoneSettings.queue_callback, "ringtoneSettings.queue_callback");
      connect.assertTrue(ringtoneSettings.queue_callback.ringtoneUrl || ringtoneSettings.queue_callback.disabled, "ringtoneSettings.voice.ringtoneUrl must be provided or ringtoneSettings.queue_callback.disabled must be true");

      connect.core.ringtoneEngines = {};

      connect.agent(function (agent) {
        agent.onRefresh(function () {
          connect.ifMaster(connect.MasterTopics.RINGTONE, function () {
            if (!ringtoneSettings.voice.disabled && !connect.core.ringtoneEngines.voice) {
              connect.core.ringtoneEngines.voice =
                new connect.VoiceRingtoneEngine(ringtoneSettings.voice);
              connect.getLog().info("VoiceRingtoneEngine initialized.");
            }

            if (!ringtoneSettings.chat.disabled && !connect.core.ringtoneEngines.chat) {
              connect.core.ringtoneEngines.chat =
                new connect.ChatRingtoneEngine(ringtoneSettings.chat);
              connect.getLog().info("ChatRingtoneEngine initialized.");
            }

            if (!ringtoneSettings.queue_callback.disabled && !connect.core.ringtoneEngines.queue_callback) {
              connect.core.ringtoneEngines.queue_callback =
                new connect.QueueCallbackRingtoneEngine(ringtoneSettings.queue_callback);
              connect.getLog().info("QueueCallbackRingtoneEngine initialized.");
            }
          });
        });
      });
    };

    var mergeParams = function (params, otherParams) {
      // For backwards compatibility: support pulling disabled flag and ringtoneUrl
      // from softphone config if it exists from downstream into the ringtone config.
      params.ringtone = params.ringtone || {};
      params.ringtone.voice = params.ringtone.voice || {};
      params.ringtone.queue_callback = params.ringtone.queue_callback || {};
      params.ringtone.chat = params.ringtone.chat || { disabled: true };

      if (otherParams.softphone) {
        if (otherParams.softphone.disableRingtone) {
          params.ringtone.voice.disabled = true;
          params.ringtone.queue_callback.disabled = true;
        }

        if (otherParams.softphone.ringtoneUrl) {
          params.ringtone.voice.ringtoneUrl = otherParams.softphone.ringtoneUrl;
          params.ringtone.queue_callback.ringtoneUrl = otherParams.softphone.ringtoneUrl;
        }
      }

      // Merge in ringtone settings from downstream.
      if (otherParams.ringtone) {
        params.ringtone.voice = connect.merge(params.ringtone.voice,
          otherParams.ringtone.voice || {});
        params.ringtone.queue_callback = connect.merge(params.ringtone.queue_callback,
          otherParams.ringtone.voice || {});
        params.ringtone.chat = connect.merge(params.ringtone.chat,
          otherParams.ringtone.chat || {});
      }
    };

    // Merge params from params.softphone into params.ringtone
    // for embedded and non-embedded use cases so that defaults
    // are picked up.
    mergeParams(params, params);

    if (connect.isFramed()) {
      // If the CCP is in a frame, wait for configuration from downstream.
      var bus = connect.core.getEventBus();
      bus.subscribe(connect.EventType.CONFIGURE, function (data) {
        this.unsubscribe();
        // Merge all params from data into params for any overridden
        // values in either legacy "softphone" or "ringtone" settings.
        mergeParams(params, data);
        setupRingtoneEngines(params.ringtone);
      });

    } else {
      setupRingtoneEngines(params.ringtone);
    }
  };

  connect.core.initSoftphoneManager = function (paramsIn) {
    var params = paramsIn || {};

    var competeForMasterOnAgentUpdate = function (softphoneParamsIn) {
      var softphoneParams = connect.merge(params.softphone || {}, softphoneParamsIn);

      connect.agent(function (agent) {
        agent.onRefresh(function () {
          var sub = this;

          connect.ifMaster(connect.MasterTopics.SOFTPHONE, function () {
            if (!connect.core.softphoneManager && agent.isSoftphoneEnabled()) {
              // Become master to send logs, since we need logs from softphone tab.
              connect.becomeMaster(connect.MasterTopics.SEND_LOGS);
              connect.core.softphoneManager = new connect.SoftphoneManager(softphoneParams);
              sub.unsubscribe();
            }
          });
        });
      });
    };

    /**
     * If the window is framed, we need to wait for a CONFIGURE message from
     * downstream before we try to initialize, unless params.allowFramedSoftphone is true.
     */
    if (connect.isFramed() && !params.allowFramedSoftphone) {
      var bus = connect.core.getEventBus();
      bus.subscribe(connect.EventType.CONFIGURE, function (data) {
        if (data.softphone && data.softphone.allowFramedSoftphone) {
          this.unsubscribe();
          competeForMasterOnAgentUpdate(data.softphone);
        }
      });
    } else {
      competeForMasterOnAgentUpdate(params);
    }


    connect.agent(function (agent) {
      // Sync mute across all tabs 
      if (agent.isSoftphoneEnabled()) {
        connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST,
          {
            event: connect.EventType.MUTE
          });
      }
    });
  };
  
  connect.core.authorize = function (endpoint) { 
    var options = {
      credentials: 'include'
    };
    return connect.fetch(endpoint || AUTHORIZE_ENDPOINT, options, AUTHORIZE_RETRY_INTERVAL, AUTHORIZE_MAX_RETRY);
  };

  connect.core.verifyDomainAccess = function (authToken, endpoint) {
    if (!connect.isFramed()) {
      return Promise.resolve();
    }
    var options = {
      headers: {
        'X-Amz-Bearer': authToken
      }
    };
    return connect.fetch(endpoint || WHITELISTED_ORIGINS_ENDPOINT, options, WHITELISTED_ORIGINS_RETRY_INTERVAL, WHITELISTED_ORIGINS_MAX_RETRY).then(function (response) {
      var topDomain = sanitizeDomain(window.document.referrer);
      var isAllowed = response.whitelistedOrigins.some(function (origin) {
        return topDomain === sanitizeDomain(origin);
      });
      return isAllowed ? Promise.resolve() : Promise.reject();
    });
  };

  /**-------------------------------------------------------------------------
   * Initializes Connect by creating or connecting to the API Shared Worker.
   * Used primarily by the CCP.
   */
  connect.core.initSharedWorker = function (params) {
    connect.core.checkNotInitialized();
    if (connect.core.initialized) {
      return;
    }
    connect.assertNotNull(params, 'params');

    var sharedWorkerUrl = connect.assertNotNull(params.sharedWorkerUrl, 'params.sharedWorkerUrl');
    var authToken = connect.assertNotNull(params.authToken, 'params.authToken');
    var refreshToken = connect.assertNotNull(params.refreshToken, 'params.refreshToken');
    var authTokenExpiration = connect.assertNotNull(params.authTokenExpiration, 'params.authTokenExpiration');
    var region = connect.assertNotNull(params.region, 'params.region');
    var endpoint = params.endpoint || null;
    var authorizeEndpoint = params.authorizeEndpoint || "/connect/auth/authorize";

    try {
      // Initialize the event bus and agent data providers.
      connect.core.eventBus = new connect.EventBus({ logEvents: true });
      connect.core.agentDataProvider = new AgentDataProvider(connect.core.getEventBus());
      connect.core.mediaFactory = new connect.MediaFactory(params);
      // Create the shared worker and upstream conduit.
      var worker = new SharedWorker(sharedWorkerUrl, "ConnectSharedWorker");
      var conduit = new connect.Conduit("ConnectSharedWorkerConduit",
        new connect.PortStream(worker.port),
        new connect.WindowIOStream(window, parent));

      // Set the global upstream conduit for external use.
      connect.core.upstream = conduit;

      connect.core.webSocketProvider = new WebSocketProvider();

      // Close our port to the shared worker before the window closes.
      global.onunload = function () {
        conduit.sendUpstream(connect.EventType.CLOSE);
        worker.port.close();
      };

      connect.getLog().scheduleUpstreamLogPush(conduit);
      // Bridge all upstream messages into the event bus.
      conduit.onAllUpstream(connect.core.getEventBus().bridge());
      // Bridge all downstream messages into the event bus.
      conduit.onAllDownstream(connect.core.getEventBus().bridge());
      // Pass all upstream messages (from shared worker) downstream (to CCP consumer).
      conduit.onAllUpstream(conduit.passDownstream());
      // Pass all downstream messages (from CCP consumer) upstream (to shared worker).
      conduit.onAllDownstream(conduit.passUpstream());
      // Send configuration up to the shared worker.

      conduit.sendUpstream(connect.EventType.CONFIGURE, {
        authToken: authToken,
        authTokenExpiration: authTokenExpiration,
        endpoint: endpoint,
        refreshToken: refreshToken,
        region: region,
        authorizeEndpoint: authorizeEndpoint
      });
      
      conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function () {
        connect.getLog().info("Acknowledged by the ConnectSharedWorker!");
        connect.core.initialized = true;
        this.unsubscribe();
      });
      // Add all upstream log entries to our own logger.
      conduit.onUpstream(connect.EventType.LOG, function (logEntry) {
        connect.getLog().addLogEntry(connect.LogEntry.fromObject(logEntry));
      });
      // Reload the page if the shared worker detects an API auth failure.
      conduit.onUpstream(connect.EventType.AUTH_FAIL, function (logEntry) {
        location.reload();
      });

      connect.core.client = new connect.UpstreamConduitClient(conduit);
      connect.core.masterClient = new connect.UpstreamConduitMasterClient(conduit);

      // Pass the TERMINATE request upstream to the shared worker.
      connect.core.getEventBus().subscribe(connect.EventType.TERMINATE,
        conduit.passUpstream());

      // Refresh the page when we receive the TERMINATED response from the
      // shared worker.
      connect.core.getEventBus().subscribe(connect.EventType.TERMINATED, function () {
        window.location.reload(true);
      });

      worker.port.start();

      // Attempt to get permission to show notifications.
      var nm = connect.core.getNotificationManager();
      nm.requestPermission();

    } catch (e) {
      connect.getLog().error("Failed to initialize the API shared worker, we're dead!")
        .withException(e);
    }
  };

  /**-------------------------------------------------------------------------
   * Initializes Connect by creating or connecting to the API Shared Worker.
   * Initializes Connect by loading the CCP in an iframe and connecting to it.
   */
  connect.core.initCCP = function (containerDiv, paramsIn) {
    connect.core.checkNotInitialized();
    if (connect.core.initialized) {
      return;
    }

    // For backwards compatibility, when instead of taking a params object
    // as input we only accepted ccpUrl.
    var params = {};
    if (typeof (paramsIn) === 'string') {
      params.ccpUrl = paramsIn;
    } else {
      params = paramsIn;
    }

    var softphoneParams = params.softphone || null;

    connect.assertNotNull(containerDiv, 'containerDiv');
    connect.assertNotNull(params.ccpUrl, 'params.ccpUrl');

    // Create the CCP iframe and append it to the container div.
    var iframe = document.createElement('iframe');
    iframe.src = params.ccpUrl;
    iframe.allow = "microphone";
    iframe.style = "width: 100%; height: 100%";
    containerDiv.appendChild(iframe);

    // Initialize the event bus and agent data providers.
    // NOTE: Setting logEvents here to FALSE in order to avoid duplicating
    // events which are logged in CCP.
    connect.core.eventBus = new connect.EventBus({ logEvents: false });
    connect.core.agentDataProvider = new AgentDataProvider(connect.core.getEventBus());
    connect.core.mediaFactory = new connect.MediaFactory(params);

    // Build the upstream conduit communicating with the CCP iframe.
    var conduit = new connect.IFrameConduit(params.ccpUrl, window, iframe);

    // Set the global upstream conduit for external use.
    connect.core.upstream = conduit;

    conduit.onAllUpstream(connect.core.getEventBus().bridge());

    // Initialize the keepalive manager.
    connect.core.keepaliveManager = new KeepaliveManager(conduit,
      connect.core.getEventBus(),
      params.ccpSynTimeout || CCP_SYN_TIMEOUT,
      params.ccpAckTimeout || CCP_ACK_TIMEOUT);
    connect.core.iframeRefreshInterval = null;

    // Allow 10 sec (default) before receiving the first ACK from the CCP.
    connect.core.ccpLoadTimeoutInstance = global.setTimeout(function () {
      connect.core.ccpLoadTimeoutInstance = null;
      connect.core.getEventBus().trigger(connect.EventType.ACK_TIMEOUT);
    }, params.ccpLoadTimeout || CCP_LOAD_TIMEOUT);

    // Once we receive the first ACK, setup our upstream API client and establish
    // the SYN/ACK refresh flow.
    conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function () {
      connect.getLog().info("Acknowledged by the CCP!");
      connect.core.client = new connect.UpstreamConduitClient(conduit);
      connect.core.masterClient = new connect.UpstreamConduitMasterClient(conduit);
      connect.core.initialized = true;

      if (softphoneParams) {
        // Send configuration up to the CCP.
        conduit.sendUpstream(connect.EventType.CONFIGURE, {
          softphone: softphoneParams
        });
      }

      if (connect.core.ccpLoadTimeoutInstance) {
        global.clearTimeout(connect.core.ccpLoadTimeoutInstance);
        connect.core.ccpLoadTimeoutInstance = null;
      }

      connect.core.keepaliveManager.start();
      this.unsubscribe();
    });

    // Add any logs from the upstream to our own logger.
    conduit.onUpstream(connect.EventType.LOG, function (logEntry) {
      connect.getLog().addLogEntry(connect.LogEntry.fromObject(logEntry));
    });

    // Pop a login page when we encounter an ACK timeout.
    connect.core.getEventBus().subscribe(connect.EventType.ACK_TIMEOUT, function () {
      // loginPopup is true by default, only false if explicitly set to false.
      if (params.loginPopup !== false) {
        try {
          var loginUrl = createLoginUrl(params);
          connect.getLog().warn("ACK_TIMEOUT occurred, attempting to pop the login page if not already open.");
          connect.core.getPopupManager().open(loginUrl, connect.MasterTopics.LOGIN_POPUP);

        } catch (e) {
          connect.getLog().error("ACK_TIMEOUT occurred but we are unable to open the login popup.").withException(e);
        }
      }

      if (connect.core.iframeRefreshInterval == null) {
        connect.core.iframeRefreshInterval = window.setInterval(function () {
          iframe.src = params.ccpUrl;
        }, CCP_IFRAME_REFRESH_INTERVAL);

        conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function () {
          this.unsubscribe();
          global.clearInterval(connect.core.iframeRefreshInterval);
          connect.core.iframeRefreshInterval = null;
          connect.core.getPopupManager().clear(connect.MasterTopics.LOGIN_POPUP);
        });
      }
    });
  };

  /**-----------------------------------------------------------------------*/
  var KeepaliveManager = function (conduit, eventBus, synTimeout, ackTimeout) {
    this.conduit = conduit;
    this.eventBus = eventBus;
    this.synTimeout = synTimeout;
    this.ackTimeout = ackTimeout;
    this.ackTimer = null;
    this.synTimer = null;
    this.ackSub = null;
  };

  KeepaliveManager.prototype.start = function () {
    var self = this;

    this.conduit.sendUpstream(connect.EventType.SYNCHRONIZE);
    this.ackSub = this.conduit.onUpstream(connect.EventType.ACKNOWLEDGE, function () {
      this.unsubscribe();
      global.clearTimeout(self.ackTimer);
      self.deferStart();
    });
    this.ackTimer = global.setTimeout(function () {
      self.ackSub.unsubscribe();
      self.eventBus.trigger(connect.EventType.ACK_TIMEOUT);
      self.deferStart();
    }, this.ackTimeout);
  };

  KeepaliveManager.prototype.deferStart = function () {
    if (this.synTimer == null) {
      this.synTimer = global.setTimeout(connect.hitch(this, this.start), this.synTimeout);
    }
  };

  /**-----------------------------------------------------------------------*/

  var WebSocketProvider = function() {

    var callbacks = {
      initFailure: new Set(),
      subscriptionUpdate: new Set(),
      subscriptionFailure: new Set(),
      topic: new Map(),
      allMessage: new Set(),
      connectionGain: new Set(),
      connectionLost: new Set()
    };

    var invokeCallbacks = function(callbacks, response) {
      callbacks.forEach(function (callback) {
        callback(response);
      });
    };

    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.INIT_FAILURE, function () {
      invokeCallbacks(callbacks.initFailure);
    });

    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.CONNECTION_GAIN, function () {
      invokeCallbacks(callbacks.connectionGain);
    });

    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.CONNECTION_LOST, function () {
      invokeCallbacks(callbacks.connectionLost);
    });

    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.SUBSCRIPTION_UPDATE, function (response) {
      invokeCallbacks(callbacks.subscriptionUpdate, response);
    });

    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.SUBSCRIPTION_FAILURE, function (response) {
      invokeCallbacks(callbacks.subscriptionFailure, response);
    });

    connect.core.getUpstream().onUpstream(connect.WebSocketEvents.ALL_MESSAGE, function (response) {
      invokeCallbacks(callbacks.allMessage, response);
      if (callbacks.topic.has(response.topic)) {
        invokeCallbacks(callbacks.topic.get(response.topic), response);
      }
    });

    this.sendMessage = function(webSocketPayload) {
      connect.core.getUpstream().sendUpstream(connect.WebSocketEvents.SEND, webSocketPayload);
    };

    this.onInitFailure = function(cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.initFailure.add(cb);
      return function () {
        return callbacks.initFailure.delete(cb);
      };
    };

    this.onConnectionGain = function(cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.connectionGain.add(cb);
      return function () {
        return callbacks.connectionGain.delete(cb);
      };
    };

    this.onConnectionLost = function(cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.connectionLost.add(cb);
      return function () {
        return callbacks.connectionLost.delete(cb);
      };
    };

    this.onSubscriptionUpdate = function(cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.subscriptionUpdate.add(cb);
      return function () {
        return callbacks.subscriptionUpdate.delete(cb);
      };
    };

    this.onSubscriptionFailure = function(cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.subscriptionFailure.add(cb);
      return function () {
        return callbacks.subscriptionFailure.delete(cb);
      };
    };

    this.subscribeTopics = function(topics) {
      connect.assertNotNull(topics, 'topics');
      connect.assertTrue(connect.isArray(topics), 'topics must be a array');
      connect.core.getUpstream().sendUpstream(connect.WebSocketEvents.SUBSCRIBE, topics);
    };

    this.onMessage = function(topicName, cb) {
      connect.assertNotNull(topicName, 'topicName');
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      if (callbacks.topic.has(topicName)) {
        callbacks.topic.get(topicName).add(cb);
      } else {
        callbacks.topic.set(topicName, new Set([cb]));
      }
      return function () {
        return callbacks.topic.get(topicName).delete(cb);
      };
    };

    this.onAllMessage = function (cb) {
      connect.assertTrue(connect.isFunction(cb), 'method must be a function');
      callbacks.allMessage.add(cb);
      return function () {
        return callbacks.allMessage.delete(cb);
      };
    };

  };

  /**-----------------------------------------------------------------------*/
  var AgentDataProvider = function (bus) {
    var agentData = null;
    this.bus = bus;
    this.bus.subscribe(connect.AgentEvents.UPDATE, connect.hitch(this, this.updateAgentData));
  };

  AgentDataProvider.prototype.updateAgentData = function (agentData) {
    var oldAgentData = this.agentData;
    this.agentData = agentData;

    if (oldAgentData == null) {
      connect.agent.initialized = true;
      this.bus.trigger(connect.AgentEvents.INIT, new connect.Agent());
    }

    this.bus.trigger(connect.AgentEvents.REFRESH, new connect.Agent());

    this._fireAgentUpdateEvents(oldAgentData);
  };

  AgentDataProvider.prototype.getAgentData = function () {
    if (this.agentData == null) {
      throw new connect.StateError('No agent data is available yet!');
    }

    return this.agentData;
  };

  AgentDataProvider.prototype.getContactData = function (contactId) {
    var agentData = this.getAgentData();
    var contactData = connect.find(agentData.snapshot.contacts, function (ctdata) {
      return ctdata.contactId === contactId;
    });

    if (contactData == null) {
      throw new connect.StateError('Contact %s no longer exists.', contactId);
    }

    return contactData;
  };

  AgentDataProvider.prototype.getConnectionData = function (contactId, connectionId) {
    var contactData = this.getContactData(contactId);
    var connectionData = connect.find(contactData.connections, function (cdata) {
      return cdata.connectionId === connectionId;
    });

    if (connectionData == null) {
      throw new connect.StateError('Connection %s for contact %s no longer exists.', connectionId, contactId);
    }

    return connectionData;
  };

  AgentDataProvider.prototype._diffContacts = function (oldAgentData) {
    var diff = {
      added: {},
      removed: {},
      common: {},
      oldMap: connect.index(oldAgentData == null ? [] : oldAgentData.snapshot.contacts, function (contact) { return contact.contactId; }),
      newMap: connect.index(this.agentData.snapshot.contacts, function (contact) { return contact.contactId; })
    };

    connect.keys(diff.oldMap).forEach(function (contactId) {
      if (connect.contains(diff.newMap, contactId)) {
        diff.common[contactId] = diff.newMap[contactId];
      } else {
        diff.removed[contactId] = diff.oldMap[contactId];
      }
    });

    connect.keys(diff.newMap).forEach(function (contactId) {
      if (!connect.contains(diff.oldMap, contactId)) {
        diff.added[contactId] = diff.newMap[contactId];
      }
    });

    return diff;
  };

  AgentDataProvider.prototype._fireAgentUpdateEvents = function (oldAgentData) {
    var self = this;
    var diff = null;
    var oldAgentState = oldAgentData == null ? connect.AgentAvailStates.INIT : oldAgentData.snapshot.state.name;
    var newAgentState = this.agentData.snapshot.state.name;
    var oldRoutingState = oldAgentData == null ? connect.AgentStateType.INIT : oldAgentData.snapshot.state.type;
    var newRoutingState = this.agentData.snapshot.state.type;

    if (oldRoutingState !== newRoutingState) {
      connect.core.getAgentRoutingEventGraph().getAssociations(this, oldRoutingState, newRoutingState).forEach(function (event) {
        self.bus.trigger(event, new connect.Agent());
      });
    }

    if (oldAgentState !== newAgentState) {
      this.bus.trigger(connect.AgentEvents.STATE_CHANGE, {
        agent: new connect.Agent(),
        oldState: oldAgentState,
        newState: newAgentState

      });
      connect.core.getAgentStateEventGraph().getAssociations(this, oldAgentState, newAgentState).forEach(function (event) {
        self.bus.trigger(event, new connect.Agent());
      });
    }

    if (oldAgentData !== null) {
      diff = this._diffContacts(oldAgentData);

    } else {
      diff = {
        added: connect.index(this.agentData.snapshot.contacts, function (contact) { return contact.contactId; }),
        removed: {},
        common: {},
        oldMap: {},
        newMap: connect.index(this.agentData.snapshot.contacts, function (contact) { return contact.contactId; })
      };
    }

    connect.values(diff.added).forEach(function (contactData) {
      self.bus.trigger(connect.ContactEvents.INIT, new connect.Contact(contactData.contactId));
      self._fireContactUpdateEvents(contactData.contactId, connect.ContactStateType.INIT, contactData.state.type);
    });

    connect.values(diff.removed).forEach(function (contactData) {
      self.bus.trigger(connect.ContactEvents.DESTROYED, new connect.ContactSnapshot(contactData));
      self.bus.trigger(connect.core.getContactEventName(connect.ContactEvents.DESTROYED, contactData.contactId), new connect.ContactSnapshot(contactData));
      self._unsubAllContactEventsForContact(contactData.contactId);
    });

    connect.keys(diff.common).forEach(function (contactId) {
      self._fireContactUpdateEvents(contactId, diff.oldMap[contactId].state.type, diff.newMap[contactId].state.type);
    });
  };

  AgentDataProvider.prototype._fireContactUpdateEvents = function (contactId, oldContactState, newContactState) {
    var self = this;
    if (oldContactState !== newContactState) {
      connect.core.getContactEventGraph().getAssociations(this, oldContactState, newContactState).forEach(function (event) {
        self.bus.trigger(event, new connect.Contact(contactId));
        self.bus.trigger(connect.core.getContactEventName(event, contactId), new connect.Contact(contactId));
      });
    }

    self.bus.trigger(connect.ContactEvents.REFRESH, new connect.Contact(contactId));
    self.bus.trigger(connect.core.getContactEventName(connect.ContactEvents.REFRESH, contactId), new connect.Contact(contactId));
  };

  AgentDataProvider.prototype._unsubAllContactEventsForContact = function (contactId) {
    var self = this;
    connect.values(connect.ContactEvents).forEach(function (eventName) {
      self.bus.getSubscriptions(connect.core.getContactEventName(eventName, contactId))
        .map(function (sub) { sub.unsubscribe(); });
    });
  };

  /** ----- minimal view layer event handling **/

  connect.core.onViewContact = function (f) {
    connect.core.getUpstream().onUpstream(connect.ContactEvents.VIEW, f);
  };

  /**
   * Used of agent interface control. 
   * connect.core.viewContact("contactId") ->  this is curently programmed to get the contact into view.
   */
  connect.core.viewContact = function (contactId) {
    connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
      event: connect.ContactEvents.VIEW,
      data: {
        contactId: contactId
      }
    });
  };

  /** ------------------------------------------------- */

   /**
   * This will be helpful for the custom and embedded CCPs 
   * to handle the access denied use case. 
   */
  connect.core.onAccessDenied = function (f) {
    connect.core.getUpstream().onUpstream(connect.EventType.ACCESS_DENIED, f);
  };
  
   /**s
   * This will be helpful for SAML use cases to handle the custom logins. 
   */
  connect.core.onAuthFail = function (f) {
    connect.core.getUpstream().onUpstream(connect.EventType.AUTH_FAIL, f);
  };

  /** ------------------------------------------------- */

  /**
   * Used for handling the rtc session stats.
   * Usage
   * connect.core.onSoftphoneSessionInit(function({ connectionId }) {
   *     var softphoneManager = connect.core.getSoftphoneManager();
   *     if(softphoneManager){
   *        // access session
   *        var session = softphoneManager.getSession(connectionId); 
   *      }
   * });
   */

  connect.core.onSoftphoneSessionInit = function (f) {
    connect.core.getUpstream().onUpstream(connect.ConnnectionEvents.SESSION_INIT, f);
  };

  /**-----------------------------------------------------------------------*/
  connect.core.getContactEventName = function (eventName, contactId) {
    connect.assertNotNull(eventName, 'eventName');
    connect.assertNotNull(contactId, 'contactId');
    if (!connect.contains(connect.values(connect.ContactEvents), eventName)) {
      throw new connect.ValueError('%s is not a valid contact event.', eventName);
    }
    return connect.sprintf('%s::%s', eventName, contactId);
  };

  /**-----------------------------------------------------------------------*/
  connect.core.getEventBus = function () {
    return connect.core.eventBus;
  };

  /**-----------------------------------------------------------------------*/
  connect.core.getWebSocketManager = function () {
    return connect.core.webSocketProvider;
  };

  /**-----------------------------------------------------------------------*/
  connect.core.getAgentDataProvider = function () {
    return connect.core.agentDataProvider;
  };

  /**-----------------------------------------------------------------------*/
  connect.core.getLocalTimestamp = function () {
    return connect.core.getAgentDataProvider().getAgentData().snapshot.localTimestamp;
  };

  /**-----------------------------------------------------------------------*/
  connect.core.getSkew = function () {
    return connect.core.getAgentDataProvider().getAgentData().snapshot.skew;
  };

  /**-----------------------------------------------------------------------*/
  connect.core.getAgentRoutingEventGraph = function () {
    return connect.core.agentRoutingEventGraph;
  };
  connect.core.agentRoutingEventGraph = new connect.EventGraph()
    .assoc(connect.EventGraph.ANY, connect.AgentStateType.ROUTABLE,
      connect.AgentEvents.ROUTABLE)
    .assoc(connect.EventGraph.ANY, connect.AgentStateType.NOT_ROUTABLE,
      connect.AgentEvents.NOT_ROUTABLE)
    .assoc(connect.EventGraph.ANY, connect.AgentStateType.OFFLINE,
      connect.AgentEvents.OFFLINE);

  /**-----------------------------------------------------------------------*/
  connect.core.getAgentStateEventGraph = function () {
    return connect.core.agentStateEventGraph;
  };
  connect.core.agentStateEventGraph = new connect.EventGraph()
    .assoc(connect.EventGraph.ANY,
      connect.values(connect.AgentErrorStates),
      connect.AgentEvents.ERROR)
    .assoc(connect.EventGraph.ANY, connect.AgentAvailStates.AFTER_CALL_WORK,
      connect.AgentEvents.ACW);

  /**-----------------------------------------------------------------------*/
  connect.core.getContactEventGraph = function () {
    return connect.core.contactEventGraph;
  };

  connect.core.contactEventGraph = new connect.EventGraph()
    .assoc(connect.EventGraph.ANY,
      connect.ContactStateType.INCOMING,
      connect.ContactEvents.INCOMING)
    .assoc(connect.EventGraph.ANY,
      connect.ContactStateType.PENDING,
      connect.ContactEvents.PENDING)
    .assoc(connect.EventGraph.ANY,
      connect.ContactStateType.CONNECTING,
      connect.ContactEvents.CONNECTING)
    .assoc(connect.EventGraph.ANY,
      connect.ContactStateType.CONNECTED,
      connect.ContactEvents.CONNECTED)
    .assoc(connect.ContactStateType.INCOMING,
      connect.ContactStateType.ERROR,
      connect.ContactEvents.MISSED)
    .assoc(connect.EventGraph.ANY,
      connect.ContactStateType.ENDED,
      connect.ContactEvents.ACW)
    .assoc(connect.values(connect.CONTACT_ACTIVE_STATES),
      connect.values(connect.relativeComplement(connect.CONTACT_ACTIVE_STATES, connect.ContactStateType)),
      connect.ContactEvents.ENDED);

  /**-----------------------------------------------------------------------*/
  connect.core.getClient = function () {
    if (!connect.core.client) {
      throw new connect.StateError('The connect core has not been initialized!');
    }
    return connect.core.client;
  };
  connect.core.client = null;

  /**-----------------------------------------------------------------------*/
  connect.core.getMasterClient = function () {
    if (!connect.core.masterClient) {
      throw new connect.StateError('The connect master client has not been initialized!');
    }
    return connect.core.masterClient;
  };
  connect.core.masterClient = null;

  /**-----------------------------------------------------------------------*/
  connect.core.getSoftphoneManager = function () {
    return connect.core.softphoneManager;
  };
  connect.core.softphoneManager = null;

  /**-----------------------------------------------------------------------*/
  connect.core.getNotificationManager = function () {
    if (!connect.core.notificationManager) {
      connect.core.notificationManager = new connect.NotificationManager();
    }
    return connect.core.notificationManager;
  };
  connect.core.notificationManager = null;

  /**-----------------------------------------------------------------------*/
  connect.core.getPopupManager = function () {
    return connect.core.popupManager;
  };
  connect.core.popupManager = new connect.PopupManager();

  /**-----------------------------------------------------------------------*/
  connect.core.getPopupManager = function () {
    return connect.core.popupManager;
  };
  connect.core.popupManager = new connect.PopupManager();

  /**-----------------------------------------------------------------------*/
  connect.core.getUpstream = function () {
    if (!connect.core.upstream) {
      throw new connect.StateError('There is no upstream conduit!');
    }
    return connect.core.upstream;
  };
  connect.core.upstream = null;

  /**-----------------------------------------------------------------------*/
  connect.core.AgentDataProvider = AgentDataProvider;

})();

/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function () {
  var global = this;
  var connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  var RingtoneEngineBase = function (ringtoneConfig) {
    var self = this;
    this._prevContactId = null;

    connect.assertNotNull(ringtoneConfig, "ringtoneConfig");
    if (!ringtoneConfig.ringtoneUrl) {
      throw new Error("ringtoneUrl is required!");
    }

    if (global.Audio && typeof global.Promise !== "undefined") {
      this._playableAudioPromise = new Promise(function (resolve, reject) {
        self._audio = new Audio(ringtoneConfig.ringtoneUrl);
        self._audio.loop = true;
        self._audio.addEventListener("canplay", function () {
          self._audioPlayable = true;
          resolve(self._audio);
        });
      });

    } else {
      this._audio = null;
      connect.getLog().error("Unable to provide a ringtone.");
    }

    self._driveRingtone();
  };

  RingtoneEngineBase.prototype._driveRingtone = function () {
    throw new Error("Not implemented.");
  };

  RingtoneEngineBase.prototype._startRingtone = function (contact) {
    if (this._audio) {
      this._audio.play();
      this._publishTelemetryEvent("Ringtone Start", contact);
    }
  };

  RingtoneEngineBase.prototype._stopRingtone = function (contact) {
    if (this._audio) {
      this._audio.pause();
      this._audio.currentTime = 0;
      this._publishTelemetryEvent("Ringtone Stop", contact);
    }
  };

  /**
   * Stop ringtone.
   */
  RingtoneEngineBase.prototype.stopRingtone = function () {
    this._stopRingtone();
  };

  RingtoneEngineBase.prototype._ringtoneSetup = function (contact) {
    var self = this;
    connect.ifMaster(connect.MasterTopics.RINGTONE, function () {
      self._startRingtone(contact);
      self._prevContactId = contact.getContactId();

      contact.onConnected(lily.hitch(self, self._stopRingtone));
      contact.onAccepted(lily.hitch(self, self._stopRingtone));
      contact.onEnded(lily.hitch(self, self._stopRingtone));
      // Just to make sure to stop the ringtone in case of the failures of specific callbacks(onAccepted,onConnected);
      contact.onRefresh(function (contact) {
        if (contact.getStatus().type !== connect.ContactStatusType.CONNECTING) {
          self._stopRingtone();
        }
      });
    });
  };

  RingtoneEngineBase.prototype._publishTelemetryEvent = function (eventName, contact) {
    if (contact && contact.getContactId()) {
      connect.publishMetric({
        name: eventName,
        contactId: contact.getContactId()
      });
    }
  };

  /**
   * Change the audio device used to play ringtone.
   * If audio element is not fully initialized, the API will wait _audioPlayablePromise for 3 seconds and fail on timeout.
   * This API is supported only by browsers that implemented ES6 Promise and http://www.w3.org/TR/audio-output/
   * Return a Promise that indicates the result of changing output device.
   */
  RingtoneEngineBase.prototype.setOutputDevice = function (deviceId) {
    if (this._playableAudioPromise) {
      var playableAudioWithTimeout = Promise.race([
        this._playableAudioPromise,
        new Promise(function (resolve, reject) {
          global.setTimeout(function () { reject("Timed out waiting for playable audio"); }, 3000/*ms*/);
        })
      ]);
      return playableAudioWithTimeout.then(function (audio) {
        if (audio.setSinkId) {
          return Promise.resolve(audio.setSinkId(deviceId));
        } else {
          return Promise.reject("Not supported");
        }
      });
    }

    if (global.Promise) {
      return Promise.reject("Not eligible ringtone owner");
    }
  };

  var VoiceRingtoneEngine = function (ringtoneConfig) {
    RingtoneEngineBase.call(this, ringtoneConfig);
  };
  VoiceRingtoneEngine.prototype = Object.create(RingtoneEngineBase.prototype);
  VoiceRingtoneEngine.prototype.constructor = VoiceRingtoneEngine;

  VoiceRingtoneEngine.prototype._driveRingtone = function () {
    var self = this;

    var onContactConnect = function (contact) {
      if (contact.getType() === lily.ContactType.VOICE &&
        contact.isSoftphoneCall() && contact.isInbound()) {
        self._ringtoneSetup(contact);
        self._publishTelemetryEvent("Ringtone Connecting", contact);
      }
    };

    connect.contact(function (contact) {
      contact.onConnecting(onContactConnect);
    });

    new connect.Agent().getContacts().forEach(function (contact) {
      if (contact.getStatus().type === connect.ContactStatusType.CONNECTING) {
        onContactConnect(contact);
      }
    });
  };


  var ChatRingtoneEngine = function (ringtoneConfig) {
    RingtoneEngineBase.call(this, ringtoneConfig);
  };
  ChatRingtoneEngine.prototype = Object.create(RingtoneEngineBase.prototype);
  ChatRingtoneEngine.prototype.constructor = ChatRingtoneEngine;

  ChatRingtoneEngine.prototype._driveRingtone = function () {
    var self = this;

    var onContactConnect = function (contact) {
      if (contact.getType() === lily.ContactType.CHAT && contact.isInbound()) {
        self._ringtoneSetup(contact);
        self._publishTelemetryEvent("Chat Ringtone Connecting", contact);
      }
    };

    connect.contact(function (contact) {
      contact.onConnecting(onContactConnect);
    });
  };

  var QueueCallbackRingtoneEngine = function (ringtoneConfig) {
    RingtoneEngineBase.call(this, ringtoneConfig);
  };
  QueueCallbackRingtoneEngine.prototype = Object.create(RingtoneEngineBase.prototype);
  QueueCallbackRingtoneEngine.prototype.constructor = QueueCallbackRingtoneEngine;

  QueueCallbackRingtoneEngine.prototype._driveRingtone = function () {
    var self = this;

    connect.contact(function (contact) {
      contact.onIncoming(function () {
        if (contact.getType() === lily.ContactType.QUEUE_CALLBACK) {
          self._ringtoneSetup(contact);
          self._publishTelemetryEvent("Callback Ringtone Connecting", contact);
        }
      });
    });
  };

  /* export connect.RingtoneEngine */
  connect.VoiceRingtoneEngine = VoiceRingtoneEngine;
  connect.ChatRingtoneEngine = ChatRingtoneEngine;
  connect.QueueCallbackRingtoneEngine = QueueCallbackRingtoneEngine;
})();

/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function() {
    var global = this;
    connect = global.connect || {};
    global.connect = connect;
    global.lily = connect;

    var RTPJobIntervalMs = 1000;
    var statsReportingJobIntervalMs = 30000;
    var streamBufferSize = 500;
    var CallTypeMap = {};
    CallTypeMap[connect.SoftphoneCallType.AUDIO_ONLY] = 'Audio';
    CallTypeMap[connect.SoftphoneCallType.VIDEO_ONLY] = 'Video';
    CallTypeMap[connect.SoftphoneCallType.AUDIO_VIDEO] = 'AudioVideo';
    CallTypeMap[connect.SoftphoneCallType.NONE] = 'None';
    var AUDIO_INPUT = 'audio_input';
    var AUDIO_OUTPUT = 'audio_output';

    var MediaTypeMap = {};
    MediaTypeMap[connect.ContactType.VOICE] = "Voice";
    var UNKNOWN_MEDIA_TYPE = "Unknown";

    var timeSeriesStreamStatsBuffer = [];
    var aggregatedUserAudioStats = {};
    var aggregatedRemoteAudioStats = {};
    var rtpStatsJob = null;
    var reportStatsJob = null;
    //Logger specific to softphone.
    var logger = null;
    var SoftphoneErrorTypes = connect.SoftphoneErrorTypes;
    var HANG_UP_MULTIPLE_SESSIONS_EVENT = "MultiSessionHangUp";
    var MULTIPLE_SESSIONS_EVENT = "MultiSessions";

    var localMediaStream = {};

    var SoftphoneManager = function(softphoneParams) {
        logger = new SoftphoneLogger(connect.getLog());
        if (!isBrowserSoftPhoneSupported()) {
            publishError(SoftphoneErrorTypes.UNSUPPORTED_BROWSER,
                      "Connect does not support this browser. Some functionality may not work. ",
                      "");
        }
        var gumPromise = fetchUserMedia({
            success: function(stream) {
                if (connect.isFirefoxBrowser()) {
                    connect.core.setSoftphoneUserMediaStream(stream);
                }
            },
            failure: function(err) {
                publishError(err, "Your microphone is not enabled in your browser. ", "");
            }
        });
        handleSoftPhoneMuteToggle();

        this.ringtoneEngine = null;
        var cleanMultipleSessions = 'true' === softphoneParams.cleanMultipleSessions;
        var rtcSessions = {};
        // Tracks the agent connection ID, so that if the same contact gets re-routed to the same agent, it'll still set up softphone
        var callsDetected = {};

        // helper method to provide access to rtc sessions
        this.getSession = function(connectionId){
          return rtcSessions[connectionId];
        }

        var isContactTerminated = function(contact) {
            return contact.getStatus().type === connect.ContactStatusType.ENDED ||
                   contact.getStatus().type === connect.ContactStatusType.ERROR ||
                   contact.getStatus().type === connect.ContactStatusType.MISSED;
        };

        var destroySession = function (agentConnectionId) {
            if (rtcSessions.hasOwnProperty(agentConnectionId)) {
                var session = rtcSessions[agentConnectionId];
                // Currently the assumption is it will throw an exception only and if only it already has been hung up.
                // TODO: Update once the hangup API does not throw exceptions
                new Promise(function(resolve, reject){
                    delete rtcSessions[agentConnectionId];
                    delete callsDetected[agentConnectionId];
                    session.hangup();
                }).catch(function(err){
                    lily.getLog().warn("Clean up the session locally " + agentConnectionId, err.message);
                });
            }
        };

        // When feature access control flag is on, ignore the new call and hang up the previous sessions.
        // Otherwise just log the contact and agent in the client side metrics.
        // TODO: Update when connect-rtc exposes an API to detect session status.
        var sanityCheckActiveSessions = function(rtcSessions) {
            if (Object.keys(rtcSessions).length > 0) {
                if (cleanMultipleSessions) {
                    // Error! our state doesn't match, tear it all down.
                    for (var connectionId in rtcSessions) {
                        if (rtcSessions.hasOwnProperty(connectionId)) {
                            // Log an error for the session we are about to kill.
                            publishMultipleSessionsEvent(HANG_UP_MULTIPLE_SESSIONS_EVENT, rtcSessions[connectionId].callId, connectionId);
                            destroySession(connectionId);
                        }
                    }
                    throw new Error("duplicate session detected, refusing to setup new connection");
                } else {
                    for (var _connectionId in rtcSessions) {
                        if (rtcSessions.hasOwnProperty(_connectionId)) {
                            publishMultipleSessionsEvent(MULTIPLE_SESSIONS_EVENT, rtcSessions[_connectionId].callId, _connectionId);
                        }
                    }
                }
            }
        };

        var onRefreshContact = function(contact, agentConnectionId) {
                if (rtcSessions[agentConnectionId] && isContactTerminated(contact)) {
                    destroySession(agentConnectionId);
                }
                if (contact.isSoftphoneCall() && !callsDetected[agentConnectionId] && (
                        contact.getStatus().type === connect.ContactStatusType.CONNECTING ||
                        contact.getStatus().type === connect.ContactStatusType.INCOMING)) {

                    // Set to true, this will block subsequent invokes from entering.
                    callsDetected[agentConnectionId] = true;
                    logger.info("Softphone call detected:", "contactId " + contact.getContactId(), "agent connectionId " + agentConnectionId);

                    // Ensure our session state matches our contact state to prevent issues should we lose track of a contact.
                    sanityCheckActiveSessions(rtcSessions);

                    if (contact.getStatus().type === connect.ContactStatusType.CONNECTING) {
                        publishTelemetryEvent("Softphone Connecting", contact.getContactId());
                    }

                    initializeParams();
                    var softphoneInfo = contact.getAgentConnection().getSoftphoneMediaInfo();
                    var callConfig = parseCallConfig(softphoneInfo.callConfigJson);
                    var webSocketProvider;
                    if (callConfig.useWebSocketProvider) {
                        webSocketProvider = connect.core.getWebSocketManager();
                    }
                    var session = new connect.RTCSession(
                        callConfig.signalingEndpoint,
                        callConfig.iceServers,
                        softphoneInfo.callContextToken,
                        logger,
                        contact.getContactId(),
                        agentConnectionId,
                        webSocketProvider);

                    rtcSessions[agentConnectionId] = session;

                    if (connect.core.getSoftphoneUserMediaStream()) {
                        session.mediaStream = connect.core.getSoftphoneUserMediaStream();
                    }

                     // Custom Event to indicate the session init operations
                    connect.core.upstream.sendUpstream(connect.EventType.BROADCAST, {
                      event: connect.ConnnectionEvents.SESSION_INIT,
                      data: {
                        connectionId: agentConnectionId
                      }
                    });

                    session.onSessionFailed = function (rtcSession, reason) {
                        delete rtcSessions[agentConnectionId];
                        delete callsDetected[agentConnectionId];
                        publishSoftphoneFailureLogs(rtcSession, reason);
                        publishSessionFailureTelemetryEvent(contact.getContactId(), reason);
                        stopJobsAndReport(contact, rtcSession.sessionReport);
                    };
                    session.onSessionConnected = function (rtcSession) {
                        publishTelemetryEvent("Softphone Session Connected", contact.getContactId());
                        // Become master to send logs, since we need logs from softphone tab.
                        connect.becomeMaster(connect.MasterTopics.SEND_LOGS);
                        //start stats collection and reporting jobs
                        startStatsCollectionJob(rtcSession);
                        startStatsReportingJob(contact);
                        fireContactAcceptedEvent(contact);
                    };

                    session.onSessionCompleted = function (rtcSession) {
                        publishTelemetryEvent("Softphone Session Completed", contact.getContactId());

                        delete rtcSessions[agentConnectionId];
                        delete callsDetected[agentConnectionId];
                        // Stop all jobs and perform one last job.
                        stopJobsAndReport(contact, rtcSession.sessionReport);

                        // Cleanup the cached streams
                        deleteLocalMediaStream(agentConnectionId);
                    };

                    session.onLocalStreamAdded = function (rtcSession, stream) {
                       // Cache the streams for mute/unmute
                       localMediaStream[agentConnectionId] = {
                            stream: stream
                        };
                    };

                    session.remoteAudioElement = document.getElementById('remote-audio');
                    session.connect();
                }
        };

        var onInitContact = function(contact){
            var agentConnectionId = contact.getAgentConnection().connectionId;
            logger.info("Contact detected:", "contactId " + contact.getContactId(), "agent connectionId " + agentConnectionId);

            if (!callsDetected[agentConnectionId]) {
                contact.onRefresh(function() {
                    onRefreshContact(contact, agentConnectionId);
                });
            }
        };

        connect.contact(onInitContact);

        // Contact already in connecting state scenario - In this case contact INIT is missed hence the OnRefresh callback is missed. 
        new connect.Agent().getContacts().forEach(function(contact){
            var agentConnectionId = contact.getAgentConnection().connectionId;
            logger.info("Contact exist in the snapshot. Reinitiate the Contact and RTC session creation for contactId" + contact.getContactId(), "agent connectionId " + agentConnectionId);
            onInitContact(contact);
            onRefreshContact(contact, agentConnectionId);
        });
    };

    var fireContactAcceptedEvent = function(contact) {
        var conduit = connect.core.getUpstream();
        var agentConnection = contact.getAgentConnection();
        if (!agentConnection) {
            logger.info("Not able to retrieve the auto-accept setting from null AgentConnection, ignoring event publish..");
            return;
        }
        var softphoneMediaInfo = agentConnection.getSoftphoneMediaInfo();
        if (!softphoneMediaInfo) {
            logger.info("Not able to retrieve the auto-accept setting from null SoftphoneMediaInfo, ignoring event publish..");
            return;
        }
        if (softphoneMediaInfo.autoAccept === true) {
            logger.info("Auto-accept is enabled, sending out Accepted event to stop ringtone..");
            conduit.sendUpstream(connect.EventType.BROADCAST, {
                event: connect.ContactEvents.ACCEPTED
            });
            conduit.sendUpstream(connect.EventType.BROADCAST, {
                event: connect.core.getContactEventName(connect.ContactEvents.ACCEPTED, contact.contactId)
            });
        } else {
            logger.info("Auto-accept is disabled, ringtone will be stopped by user action.");
        }
    };
    
    // Bind events for mute
    var handleSoftPhoneMuteToggle = function(){
        var bus = connect.core.getEventBus();
        bus.subscribe(connect.EventType.MUTE, muteToggle);
    };

    // Make sure once we disconnected we get the mute state back to normal
    var deleteLocalMediaStream = function(connectionId){
        delete localMediaStream[connectionId];
        connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
          event: connect.AgentEvents.MUTE_TOGGLE,
          data: {muted: false}
        });
    };

    // Check for the local streams if exists  -  revert it
    // And inform other clients about the change 
    var muteToggle = function(data){
        var status;
        if(connect.keys(localMediaStream).length === 0){
            return;
        }

        if(data && data.mute !== undefined){
          status = data.mute;
        }

        for(var connectionId in localMediaStream){
          if (localMediaStream.hasOwnProperty(connectionId)) {
            var localMedia = localMediaStream[connectionId].stream;
            if(localMedia){
              var audioTracks = localMedia.getAudioTracks()[0];
              if(status !== undefined){
                audioTracks.enabled = !status;
                localMediaStream[connectionId].muted = status;

                if(status){
                    logger.info("Agent has muted the contact, connectionId -  " + connectionId);
                }else{
                    logger.info("Agent has unmuted the contact, connectionId - " + connectionId);
                }

              }else{
                status = localMediaStream[connectionId].muted || false;
              }
            }
          }
        }

        connect.core.getUpstream().sendUpstream(connect.EventType.BROADCAST, {
          event: connect.AgentEvents.MUTE_TOGGLE,
          data: {muted: status}
        });
    };

    var publishSoftphoneFailureLogs = function (rtcSession, reason) {
        if (reason === connect.RTCErrors.ICE_COLLECTION_TIMEOUT) {
            var endPointUrl = "\n";
            for (var i = 0; i < rtcSession._iceServers.length; i++) {
                for (var j = 0; j < rtcSession._iceServers[i].urls.length; j++) {
                    endPointUrl = endPointUrl + rtcSession._iceServers[i].urls[j] + "\n";
                }
            }
            publishError(SoftphoneErrorTypes.ICE_COLLECTION_TIMEOUT, "Ice collection timedout. ", endPointUrl);
        } else if (reason === connect.RTCErrors.USER_BUSY) {
            publishError(SoftphoneErrorTypes.USER_BUSY_ERROR,
                "Softphone call UserBusy error. ",
                "");
        } else if (reason === connect.RTCErrors.SIGNALLING_HANDSHAKE_FAILURE) {
            publishError(SoftphoneErrorTypes.SIGNALLING_HANDSHAKE_FAILURE,
                "Handshaking with Signalling Server " + rtcSession._signalingUri + " failed. ",
                rtcSession._signalingUri);
        } else if (reason === connect.RTCErrors.GUM_TIMEOUT_FAILURE || reason === connect.RTCErrors.GUM_OTHER_FAILURE) {
            publishError(SoftphoneErrorTypes.MICROPHONE_NOT_SHARED,
                "Your microphone is not enabled in your browser. ",
                "");
        } else if (reason === connect.RTCErrors.SIGNALLING_CONNECTION_FAILURE) {
            publishError(SoftphoneErrorTypes.SIGNALLING_CONNECTION_FAILURE,
                "URL " + rtcSession._signalingUri + " cannot be reached. ",
                rtcSession._signalingUri);
        } else if (reason === connect.RTCErrors.CALL_NOT_FOUND) {
            // No need to publish any softphone error for this case. CCP UX will handle this case.
            logger.error("Softphone call failed due to CallNotFoundException.");
        } else {
            publishError(SoftphoneErrorTypes.WEBRTC_ERROR,
                "webrtc system error. ",
                "");
        }
    };

    /** Parse the JSON encoded web call config into the data it represents. */
    var parseCallConfig = function(serializedConfig) {
        // Our underscore is too old for unescape
        // https://issues.amazon.com/issues/CSWF-1467
        var decodedJSON = serializedConfig.replace(/&quot;/g, '"');
        return JSON.parse(decodedJSON);
    };

    var fetchUserMedia = function(callbacksIn) {
        var callbacks = callbacksIn || {};
        callbacks.success = callbacks.success || function() {};
        callbacks.failure = callbacks.failure || function() {};

        var CONSTRAINT = {
            audio: true
        };

        var promise = null;

        if (typeof Promise !== "function") {
            callbacks.failure(SoftphoneErrorTypes.UNSUPPORTED_BROWSER);
            return;
        }

        if (typeof navigator.mediaDevices === "object" && typeof navigator.mediaDevices.getUserMedia === "function") {
            promise = navigator.mediaDevices.getUserMedia(CONSTRAINT);

        } else if (typeof navigator.webkitGetUserMedia === "function") {
            promise = new Promise(function(resolve, reject) {
                navigator.webkitGetUserMedia(CONSTRAINT, resolve, reject);
            });

        } else {
            callbacks.failure(SoftphoneErrorTypes.UNSUPPORTED_BROWSER);
            return;
        }

        promise.then(function(stream) {
            var audioTracks = stream.getAudioTracks();
            if (audioTracks && audioTracks.length > 0) {
                callbacks.success(stream);
            } else {
                callbacks.failure(SoftphoneErrorTypes.MICROPHONE_NOT_SHARED);
            }
        }, function(err) {
            callbacks.failure(SoftphoneErrorTypes.MICROPHONE_NOT_SHARED);
        });
        return promise;
    };

    var publishError = function(errorType, message, endPointUrl) {
        var bus = connect.core.getEventBus();
        logger.error("Softphone error occurred : ", errorType,
            message || "");

        connect.core.upstream.sendUpstream(connect.EventType.BROADCAST, {
            event: connect.AgentEvents.SOFTPHONE_ERROR,
            data: new connect.SoftphoneError(errorType, message, endPointUrl)
        });
    };

    var publishSessionFailureTelemetryEvent = function(contactId, reason) {
        publishTelemetryEvent("Softphone Session Failed", contactId, {
            failedReason: reason
        });
    };

    var publishTelemetryEvent = function(eventName, contactId, data) {
        if (contactId) {
            connect.publishMetric({
                name: eventName,
                contactId: contactId,
                data: data
            });
        }
    };

    // Publish the contact and agent information in a multiple sessions scenarios
    var publishMultipleSessionsEvent = function(eventName, contactId, agentConnectionId) {
        publishTelemetryEvent(eventName, contactId, [{
            name: "AgentConnectionId",
            value: agentConnectionId
        }]);
        logger.info("Publish multiple session error metrics", eventName, "contactId " + contactId, "agent connectionId " + agentConnectionId);
    };

    var isBrowserSoftPhoneSupported = function () {
        // In Opera, the true version is after "Opera" or after "Version"
        if (connect.isOperaBrowser() && connect.getOperaBrowserVersion() > 17) {
            return true;
        }
        // In Chrome, the true version is after "Chrome"
        else if (connect.isChromeBrowser() && connect.getChromeBrowserVersion() > 22) {
            return true;
        }
        // In Firefox, the true version is after "Firefox"
        else if (connect.isFirefoxBrowser() && connect.getFirefoxBrowserVersion() > 21) {
            return true;
        } else {
            return false;
        }
    };

    var sendSoftphoneMetrics = function(contact) {
        var streamStats = timeSeriesStreamStatsBuffer.slice();
        timeSeriesStreamStatsBuffer = [];
        if (streamStats.length > 0) {
            contact.sendSoftphoneMetrics(streamStats, {
               success: function(){
                   logger.info("sendSoftphoneMetrics success");
               },
               failure: function(data){
                   logger.error("sendSoftphoneMetrics failed.")
                      .withObject(data);
               }
            });
        }
    };

    var sendSoftphoneReport = function(contact, report, userAudioStats, remoteAudioStats) {
        report.streamStats = [ addStreamTypeToStats(userAudioStats, AUDIO_INPUT),
                                addStreamTypeToStats(remoteAudioStats, AUDIO_OUTPUT) ];
        var callReport = {
                        callStartTime: report.sessionStartTime,
                        callEndTime: report.sessionEndTime,
                        gumTimeMillis: report.gumTimeMillis,
                        initializationTimeMillis: report.initializationTimeMillis,
                        iceCollectionTimeMillis: report.iceCollectionTimeMillis,
                        signallingConnectTimeMillis: report.signallingConnectTimeMillis,
                        handshakingTimeMillis: report.handshakingTimeMillis,
                        preTalkingTimeMillis: report.preTalkingTimeMillis,
                        talkingTimeMillis: report.talkingTimeMillis,
                        cleanupTimeMillis: report.cleanupTimeMillis,
                        iceCollectionFailure: report.iceCollectionFailure,
                        signallingConnectionFailure: report.signallingConnectionFailure,
                        handshakingFailure: report.handshakingFailure,
                        gumOtherFailure: report.gumOtherFailure,
                        gumTimeoutFailure: report.gumTimeoutFailure,
                        createOfferFailure: report.createOfferFailure,
                        setLocalDescriptionFailure: report.setLocalDescriptionFailure,
                        userBusyFailure: report.userBusyFailure,
                        invalidRemoteSDPFailure: report.invalidRemoteSDPFailure,
                        noRemoteIceCandidateFailure: report.noRemoteIceCandidateFailure,
                        setRemoteDescriptionFailure: report.setRemoteDescriptionFailure,
                        softphoneStreamStatistics: report.streamStats
                      };
        contact.sendSoftphoneReport(callReport, {
            success: function(){
                logger.info("sendSoftphoneReport success");
            },
            failure: function(data){
                logger.error("sendSoftphoneReport failed.")
                    .withObject(data);
            }
        });
    };

    var startStatsCollectionJob = function(rtcSession) {
        rtpStatsJob = window.setInterval(function() {
            rtcSession.getUserAudioStats().then(function(stats) {
                var previousUserStats = aggregatedUserAudioStats;
                aggregatedUserAudioStats = stats;
                timeSeriesStreamStatsBuffer.push(getTimeSeriesStats(aggregatedUserAudioStats, previousUserStats, AUDIO_INPUT));
            }, function(error) {
                logger.debug("Failed to get user audio stats.", error);
            });
            rtcSession.getRemoteAudioStats().then(function(stats) {
                var previousRemoteStats = aggregatedRemoteAudioStats;
                aggregatedRemoteAudioStats = stats;
                timeSeriesStreamStatsBuffer.push(getTimeSeriesStats(aggregatedRemoteAudioStats, previousRemoteStats, AUDIO_OUTPUT));
            }, function(error) {
                logger.debug("Failed to get remote audio stats.", error);
            });
        }, 1000);
    };

    var startStatsReportingJob = function(contact) {
        reportStatsJob = window.setInterval(function() {
                           sendSoftphoneMetrics(contact);
        }, statsReportingJobIntervalMs);
    };

    var initializeParams = function() {
        aggregatedUserAudioStats = null;
        aggregatedRemoteAudioStats = null;
        timeSeriesStreamStatsBuffer = [];
        rtpStatsJob = null;
        reportStatsJob = null;
    };

    var getTimeSeriesStats = function(currentStats, previousStats, streamType) {
        if (previousStats && currentStats) {
            var packetsLost = currentStats.packetsLost > previousStats.packetsLost ? currentStats.packetsLost - previousStats.packetsLost : 0;
            var packetsCount = currentStats.packetsCount > previousStats.packetsCount ? currentStats.packetsCount - previousStats.packetsCount : 0;
            return new RTPStreamStats(currentStats.timestamp,
                                      packetsLost,
                                      packetsCount,
                                      streamType,
                                      currentStats.audioLevel,
                                      currentStats.jbMilliseconds,
                                      currentStats.rttMilliseconds);
        } else {
            return new RTPStreamStats(currentStats.timestamp,
                                      currentStats.packetsLost,
                                      currentStats.packetsCount,
                                      streamType,
                                      currentStats.audioLevel,
                                      currentStats.jbMilliseconds,
                                      currentStats.rttMilliseconds);
        }
    };

    var stopJob = function(task) {
        if (task !== null){
            window.clearInterval(task);
        }
        return null;
    };

    var stopJobsAndReport = function(contact, sessionReport) {
       rtpStatsJob = stopJob(rtpStatsJob);
       reportStatsJob = stopJob(reportStatsJob);
       sendSoftphoneReport(contact, sessionReport, addStreamTypeToStats(aggregatedUserAudioStats, AUDIO_INPUT), addStreamTypeToStats(aggregatedRemoteAudioStats, AUDIO_OUTPUT));
       sendSoftphoneMetrics(contact);
    };

    /**
    *   Adding streamtype parameter on top of RTCJS RTStats object.
    */
    var RTPStreamStats = function(timestamp, packetsLost, packetsCount, streamType, audioLevel, jitterBufferMillis, roundTripTimeMillis) {
        this.softphoneStreamType = streamType;
        this.timestamp = timestamp;
        this.packetsLost = packetsLost;
        this.packetsCount = packetsCount;
        this.audioLevel = audioLevel;
        this.jitterBufferMillis = jitterBufferMillis;
        this.roundTripTimeMillis = roundTripTimeMillis;
    };

    var addStreamTypeToStats = function(stats, streamType) {
        stats = stats || {};
        return new RTPStreamStats(stats.timestamp, stats.packetsLost, stats.packetsCount, streamType, stats.audioLevel);
    };

    var SoftphoneLogger = function(logger) {
        this._originalLogger = logger;
        var self = this;
        this._tee = function(level, method) {
            return function() {
                // call the original logger object to output to browser
                //Connect logger follows %s format to print objects to console.
                var args = Array.prototype.slice.call(arguments[0]);
                var format = "";
                args.forEach(function(){
                    format = format + " %s";
                });
                method.apply(self._originalLogger, [connect.LogComponent.SOFTPHONE, format].concat(args));
            };
        };
    };

    SoftphoneLogger.prototype.debug =  function() {
        this._tee(1, this._originalLogger.debug)(arguments);
    };
    SoftphoneLogger.prototype.info =  function() {
        this._tee(2, this._originalLogger.info)(arguments);
    };
    SoftphoneLogger.prototype.log =  function() {
        this._tee(3, this._originalLogger.log)(arguments);
    };
    SoftphoneLogger.prototype.warn =  function() {
        this._tee(4, this._originalLogger.warn)(arguments);
    };
    SoftphoneLogger.prototype.error =  function() {
        this._tee(5, this._originalLogger.error)(arguments);
    };

    connect.SoftphoneManager = SoftphoneManager;
})();
/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;
  global.lily = connect;

  connect.worker = {};

  var GET_AGENT_TIMEOUT_MS = 30000;
  var GET_AGENT_RECOVERY_TIMEOUT_MS = 5000;
  var GET_AGENT_SUCCESS_TIMEOUT_MS = 100;
  var LOG_BUFFER_CAP_SIZE = 400;

  var CHECK_AUTH_TOKEN_INTERVAL_MS = 300000; // 5 minuts
  var REFRESH_AUTH_TOKEN_INTERVAL_MS = 10000; // 10 seconds
  var REFRESH_AUTH_TOKEN_MAX_TRY = 4;

  var GET_AGENT_CONFIGURATION_INTERVAL_MS = 30000;

  /**-----------------------------------------------------------------------*/
  var MasterTopicCoordinator = function () {
    this.topicMasterMap = {};
  };

  MasterTopicCoordinator.prototype.getMaster = function (topic) {
    connect.assertNotNull(topic, 'topic');
    return this.topicMasterMap[topic] || null;
  };

  MasterTopicCoordinator.prototype.setMaster = function (topic, id) {
    connect.assertNotNull(topic, 'topic');
    connect.assertNotNull(id, 'id');
    this.topicMasterMap[topic] = id;
  };

  MasterTopicCoordinator.prototype.removeMaster = function (id) {
    connect.assertNotNull(id, 'id');
    var self = this;

    connect.entries(this.topicMasterMap).filter(function (entry) {
      return entry.value === id;
    }).forEach(function (entry) {
      delete self.topicMasterMap[entry.key];
    });
  };

  /**---------------------------------------------------------------
   * class WorkerClient extends ClientBase
   */
  var WorkerClient = function (conduit) {
    connect.ClientBase.call(this);
    this.conduit = conduit;
  };
  WorkerClient.prototype = Object.create(connect.ClientBase.prototype);
  WorkerClient.prototype.constructor = WorkerClient;

  WorkerClient.prototype._callImpl = function (method, params, callbacks) {
    var self = this;
    var request_start = new Date().getTime();
    connect.core.getClient()._callImpl(method, params, {
      success: function (data) {
        self._recordAPILatency(method, request_start);
        callbacks.success(data);
      },
      failure: function (error, data) {
        self._recordAPILatency(method, request_start, error);
        callbacks.failure(error, data);
      },
      authFailure: function () {
        self._recordAPILatency(method, request_start);
        callbacks.authFailure();
      },
      accessDenied: function () {
        callbacks.accessDenied && callbacks.accessDenied();
      }
    });
  };

  WorkerClient.prototype._recordAPILatency = function (method, request_start, err) {
    var request_end = new Date().getTime();
    var request_time = request_end - request_start;
    this._sendAPIMetrics(method, request_time, err);
  };

  WorkerClient.prototype._sendAPIMetrics = function (method, time, err) {
    this.conduit.sendDownstream(connect.EventType.API_METRIC, {
      name: method,
      time: time,
      dimensions: [
        {
          name: "Category",
          value: "API"
        }
      ],
      error: err
    });
  };

  /**-------------------------------------------------------------------------
   * The object responsible for polling and passing data downstream to all
   * consumer ports.
   */
  var ClientEngine = function () {
    var self = this;

    this.multiplexer = new connect.StreamMultiplexer();
    this.conduit = new connect.Conduit("AmazonConnectSharedWorker", null, this.multiplexer);
    this.client = new WorkerClient(this.conduit);
    this.timeout = null;
    this.agent = null;
    this.nextToken = null;
    this.initData = {};
    this.portConduitMap = {};
    this.masterCoord = new MasterTopicCoordinator();
    this.logsBuffer = [];

    connect.rootLogger = new connect.DownstreamConduitLogger(this.conduit);

    this.conduit.onDownstream(connect.EventType.SEND_LOGS, function (logsToUpload) {
      self.logsBuffer = self.logsBuffer.concat(logsToUpload);
      //only call API to send logs if buffer reached cap
      if (self.logsBuffer.length > LOG_BUFFER_CAP_SIZE) {
        self.handleSendLogsRequest(self.logsBuffer);
      }
    });
    this.conduit.onDownstream(connect.EventType.CONFIGURE, function (data) {
      if (data.authToken && data.authToken !== self.initData.authToken) {
        self.initData = data;
        connect.core.init(data);

        // Start polling for agent data.
        if (!self.agentPolling) {
          connect.getLog().info("Kicking off agent polling");
          self.agentPolling = true;
          self.pollForAgent();
        } else {
          connect.getLog().info("Not kicking off new agent polling, since there's already polling going on");
        }
        if (!self.configPolling) {
          connect.getLog().info("Kicking off config polling");
          self.configPolling = true;
          self.pollForAgentConfiguration({ repeatForever: true });
        } else {
          connect.getLog().info("Not kicking off new config polling, since there's already polling going on");
        }
        if (!global.checkAuthTokenInterval) {
          connect.getLog().info("Kicking off auth token polling");
          global.checkAuthTokenInterval = global.setInterval(connect.hitch(self, self.checkAuthToken), CHECK_AUTH_TOKEN_INTERVAL_MS);
        } else {
          connect.getLog().info("Not kicking off auth token polling, since there's already polling going on");
        }

        connect.WebSocketManager.setGlobalConfig({
          loggerConfig: { logger: connect.getLog() }
        });
        var webSocketManager = connect.WebSocketManager.create();

        webSocketManager.onInitFailure(function () {
          self.conduit.sendDownstream(connect.WebSocketEvents.INIT_FAILURE);
        });

        webSocketManager.onConnectionGain(function () {
          self.conduit.sendDownstream(connect.WebSocketEvents.CONNECTION_GAIN);
        });

        webSocketManager.onConnectionLost(function () {
          self.conduit.sendDownstream(connect.WebSocketEvents.CONNECTION_LOST);
        });

        webSocketManager.onSubscriptionUpdate(function (response) {
          self.conduit.sendDownstream(connect.WebSocketEvents.SUBSCRIPTION_UPDATE, response);
        });

        webSocketManager.onSubscriptionFailure(function (response) {
          self.conduit.sendDownstream(connect.WebSocketEvents.SUBSCRIPTION_FAILURE, response);
        });

        webSocketManager.onAllMessage(function (response) {
          self.conduit.sendDownstream(connect.WebSocketEvents.ALL_MESSAGE, response);
        });

        self.conduit.onDownstream(connect.WebSocketEvents.SEND, function (message) {
          webSocketManager.sendMessage(message);
        });

        self.conduit.onDownstream(connect.WebSocketEvents.SUBSCRIBE, function (topics) {
          webSocketManager.subscribeTopics(topics);
        });

        webSocketManager.init(connect.hitch(self, self.getConnectionDetails, { transportType: "web_socket" }));
      }
    });
    this.conduit.onDownstream(connect.EventType.TERMINATE, function () {
      //upload pending logs before terminating.
      self.handleSendLogsRequest(self.logsBuffer);
      connect.core.terminate();
      self.conduit.sendDownstream(connect.EventType.TERMINATED);
    });
    this.conduit.onDownstream(connect.EventType.SYNCHRONIZE, function () {
      self.conduit.sendDownstream(connect.EventType.ACKNOWLEDGE);
    });
    this.conduit.onDownstream(connect.EventType.BROADCAST, function (data) {
      self.conduit.sendDownstream(data.event, data.data);
    });

    /**
     * Called when a consumer port connects to this SharedWorker.
     * Let's add them to our multiplexer.
     */
    global.onconnect = function (event) {
      var port = event.ports[0];
      var stream = new connect.PortStream(port);
      self.multiplexer.addStream(stream);
      port.start();

      var portConduit = new connect.Conduit(stream.getId(), null, stream);
      portConduit.sendDownstream(connect.EventType.ACKNOWLEDGE, { id: stream.getId() });

      self.portConduitMap[stream.getId()] = portConduit;

      if (self.agent !== null) {
        self.updateAgent();
      }

      portConduit.onDownstream(connect.EventType.API_REQUEST,
        connect.hitch(self, self.handleAPIRequest, portConduit));
      portConduit.onDownstream(connect.EventType.MASTER_REQUEST,
        connect.hitch(self, self.handleMasterRequest, portConduit, stream.getId()));
      portConduit.onDownstream(connect.EventType.RELOAD_AGENT_CONFIGURATION,
        connect.hitch(self, self.pollForAgentConfiguration));
      portConduit.onDownstream(connect.EventType.CLOSE, function () {
        self.multiplexer.removeStream(stream);
        delete self.portConduitMap[stream.getId()];
        self.masterCoord.removeMaster(stream.getId());
      });
    };
  };

  ClientEngine.prototype.pollForAgent = function () {
    var self = this;
    var client = connect.core.getClient();
    var onAuthFail = connect.hitch(self, self.handleAuthFail);

    this.client.call(connect.ClientMethods.GET_AGENT_SNAPSHOT, {
      nextToken: self.nextToken,
      timeout: GET_AGENT_TIMEOUT_MS
    }, {
        success: function (data) {
          try {
            self.agent = self.agent || {};
            self.agent.snapshot = data.snapshot;
            self.agent.snapshot.localTimestamp = connect.now();
            self.agent.snapshot.skew = self.agent.snapshot.snapshotTimestamp - self.agent.snapshot.localTimestamp;
            self.nextToken = data.nextToken;
            connect.getLog().trace("GET_AGENT_SNAPSHOT succeeded.").withObject(data);
            self.updateAgent();
          } catch (e) {
            connect.getLog().error("Long poll failed to update agent.").withObject(data).withException(e);
          } finally {
            global.setTimeout(connect.hitch(self, self.pollForAgent), GET_AGENT_SUCCESS_TIMEOUT_MS);
          }
        },
        failure: function (err, data) {
          try {
            connect.getLog().error("Failed to get agent data.")
              .withObject({
                err: err,
                data: data
              });

          } finally {
            global.setTimeout(connect.hitch(self, self.pollForAgent), GET_AGENT_RECOVERY_TIMEOUT_MS);
          }
        },
        authFailure: function () {
          self.agentPolling = false;
          onAuthFail();
        },
        accessDenied: connect.hitch(self, self.handleAccessDenied)

      });

  };

  ClientEngine.prototype.pollForAgentConfiguration = function (paramsIn) {
    var self = this;
    var params = paramsIn || {};
    var onAuthFail = connect.hitch(self, self.handleAuthFail);

    this.client.call(connect.ClientMethods.GET_AGENT_CONFIGURATION, {}, {
      success: function (data) {
        var configuration = data.configuration;
        self.pollForAgentPermissions(configuration);
        self.pollForAgentStates(configuration);
        self.pollForDialableCountryCodes(configuration);
        self.pollForRoutingProfileQueues(configuration);
        if (params.repeatForever) {
          global.setTimeout(connect.hitch(self, self.pollForAgentConfiguration, params),
            GET_AGENT_CONFIGURATION_INTERVAL_MS);
        }
      },
      failure: function (err, data) {
        try {
          connect.getLog().error("Failed to fetch agent configuration data.")
            .withObject({
              err: err,
              data: data
            });
        } finally {
          if (params.repeatForever) {
            global.setTimeout(connect.hitch(self, self.pollForAgentConfiguration),
              GET_AGENT_CONFIGURATION_INTERVAL_MS, params);
          }
        }
      },
      authFailure: function () {
        self.configPolling = false;
        onAuthFail();
      },
      accessDenied: connect.hitch(self, self.handleAccessDenied)
    });
  };

  ClientEngine.prototype.pollForAgentStates = function (configuration, paramsIn) {
    var self = this;
    var params = paramsIn || {};
    params.maxResults = params.maxResults || connect.DEFAULT_BATCH_SIZE;

    this.client.call(connect.ClientMethods.GET_AGENT_STATES, {
      nextToken: params.nextToken || null,
      maxResults: params.maxResults

    }, {
        success: function (data) {
          if (data.nextToken) {
            self.pollForAgentStates(configuration, {
              states: (params.states || []).concat(data.states),
              nextToken: data.nextToken,
              maxResults: params.maxResults
            });

          } else {
            configuration.agentStates = (params.states || []).concat(data.states);
            self.updateAgentConfiguration(configuration);
          }
        },
        failure: function (err, data) {
          connect.getLog().error("Failed to fetch agent states list.")
            .withObject({
              err: err,
              data: data
            });
        },
        authFailure: connect.hitch(self, self.handleAuthFail),
        accessDenied: connect.hitch(self, self.handleAccessDenied)
      });
  };

  ClientEngine.prototype.pollForAgentPermissions = function (configuration, paramsIn) {
    var self = this;
    var params = paramsIn || {};
    params.maxResults = params.maxResults || connect.DEFAULT_BATCH_SIZE;

    this.client.call(connect.ClientMethods.GET_AGENT_PERMISSIONS, {
      nextToken: params.nextToken || null,
      maxResults: params.maxResults

    }, {
        success: function (data) {
          if (data.nextToken) {
            self.pollForAgentPermissions(configuration, {
              permissions: (params.permissions || []).concat(data.permissions),
              nextToken: data.nextToken,
              maxResults: params.maxResults
            });

          } else {
            configuration.permissions = (params.permissions || []).concat(data.permissions);
            self.updateAgentConfiguration(configuration);
          }
        },
        failure: function (err, data) {
          connect.getLog().error("Failed to fetch agent permissions list.")
            .withObject({
              err: err,
              data: data
            });
        },
        authFailure: connect.hitch(self, self.handleAuthFail),
        accessDenied: connect.hitch(self, self.handleAccessDenied)
      });
  };

  ClientEngine.prototype.pollForDialableCountryCodes = function (configuration, paramsIn) {
    var self = this;
    var params = paramsIn || {};
    params.maxResults = params.maxResults || connect.DEFAULT_BATCH_SIZE;

    this.client.call(connect.ClientMethods.GET_DIALABLE_COUNTRY_CODES, {
      nextToken: params.nextToken || null,
      maxResults: params.maxResults
    }, {
        success: function (data) {
          if (data.nextToken) {
            self.pollForDialableCountryCodes(configuration, {
              countryCodes: (params.countryCodes || []).concat(data.countryCodes),
              nextToken: data.nextToken,
              maxResults: params.maxResults
            });

          } else {
            configuration.dialableCountries = (params.countryCodes || []).concat(data.countryCodes);
            self.updateAgentConfiguration(configuration);
          }
        },
        failure: function (err, data) {
          connect.getLog().error("Failed to fetch dialable country codes list.")
            .withObject({
              err: err,
              data: data
            });
        },
        authFailure: connect.hitch(self, self.handleAuthFail),
        accessDenied: connect.hitch(self, self.handleAccessDenied)
      });
  };

  ClientEngine.prototype.pollForRoutingProfileQueues = function (configuration, paramsIn) {
    var self = this;
    var params = paramsIn || {};
    params.maxResults = params.maxResults || connect.DEFAULT_BATCH_SIZE;

    this.client.call(connect.ClientMethods.GET_ROUTING_PROFILE_QUEUES, {
      routingProfileARN: configuration.routingProfile.routingProfileARN,
      nextToken: params.nextToken || null,
      maxResults: params.maxResults
    }, {
        success: function (data) {
          if (data.nextToken) {
            self.pollForRoutingProfileQueues(configuration, {
              countryCodes: (params.queues || []).concat(data.queues),
              nextToken: data.nextToken,
              maxResults: params.maxResults
            });

          } else {
            configuration.routingProfile.queues = (params.queues || []).concat(data.queues);
            self.updateAgentConfiguration(configuration);
          }
        },
        failure: function (err, data) {
          connect.getLog().error("Failed to fetch routing profile queues list.")
            .withObject({
              err: err,
              data: data
            });
        },
        authFailure: connect.hitch(self, self.handleAuthFail),
        accessDenied: connect.hitch(self, self.handleAccessDenied)
      });
  };

  ClientEngine.prototype.handleAPIRequest = function (portConduit, request) {
    var self = this;

    this.client.call(request.method, request.params, {
      success: function (data) {
        var response = connect.EventFactory.createResponse(connect.EventType.API_RESPONSE, request, data);
        portConduit.sendDownstream(response.event, response);
      },
      failure: function (err, data) {
        var response = connect.EventFactory.createResponse(connect.EventType.API_RESPONSE, request, data, JSON.stringify(err));
        portConduit.sendDownstream(response.event, response);
        connect.getLog().error("'%s' API request failed: %s", request.method, err)
          .withObject({ request: self.filterAuthToken(request), response: response });
      },
      authFailure: connect.hitch(self, self.handleAuthFail),
      accessDenied: connect.hitch(self, self.handleAccessDenied)
    });
  };

  /**
   * Handle incoming master query or modification requests from connected tab ports.
   */
  ClientEngine.prototype.handleMasterRequest = function (portConduit, portId, request) {
    var response = null;

    switch (request.method) {
      case connect.MasterMethods.BECOME_MASTER:
        this.masterCoord.setMaster(request.params.topic, portId);
        response = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: portId,
          isMaster: true,
          topic: request.params.topic
        });

        break;

      case connect.MasterMethods.CHECK_MASTER:
        var masterId = this.masterCoord.getMaster(request.params.topic);
        if (!masterId) {
          this.masterCoord.setMaster(request.params.topic, portId);
          masterId = portId;
        }

        response = connect.EventFactory.createResponse(connect.EventType.MASTER_RESPONSE, request, {
          masterId: masterId,
          isMaster: portId === masterId,
          topic: request.params.topic
        });

        break;

      default:
        throw new Error("Unknown master method: " + request.method);
    }

    portConduit.sendDownstream(response.event, response);
  };

  ClientEngine.prototype.updateAgentConfiguration = function (configuration) {
    if (configuration.permissions &&
      configuration.dialableCountries &&
      configuration.agentStates &&
      configuration.routingProfile.queues) {

      this.agent = this.agent || {};
      this.agent.configuration = configuration;
      this.updateAgent();

    } else {
      connect.getLog().trace("Waiting to update agent configuration until all config data has been fetched.");
    }
  };

  ClientEngine.prototype.updateAgent = function () {
    if (!this.agent) {
      connect.getLog().trace("Waiting to update agent until the agent has been fully constructed.");

    } else if (!this.agent.snapshot) {
      connect.getLog().trace("Waiting to update agent until the agent snapshot is available.");

    } else if (!this.agent.configuration) {
      connect.getLog().trace("Waiting to update agent until the agent configuration is available.");

    } else {
      // Alias some of the properties for backwards compatibility.
      this.agent.snapshot.status = this.agent.state;

      // Sort the contacts on the timestamp
      if (this.agent.snapshot.contacts && this.agent.snapshot.contacts.length > 1) {
        this.agent.snapshot.contacts.sort(function (contactA, contactB) {
          return contactA.state.timestamp.getTime() - contactB.state.timestamp.getTime();
        });
      }

      this.agent.snapshot.contacts.forEach(function (contact) {
        contact.status = contact.state;

        contact.connections.forEach(function (connection) {
          connection.address = connection.endpoint;
        });
      });

      this.agent.configuration.routingProfile.defaultOutboundQueue.queueId =
        this.agent.configuration.routingProfile.defaultOutboundQueue.queueARN;
      this.agent.configuration.routingProfile.queues.forEach(function (queue) {
        queue.queueId = queue.queueARN;
      });
      this.agent.snapshot.contacts.forEach(function (contact) {
        //contact.queue is null when monitoring
        if (contact.queue !== undefined) {
          contact.queue.queueId = contact.queue.queueARN;
        }
      });
      this.agent.configuration.routingProfile.routingProfileId =
        this.agent.configuration.routingProfile.routingProfileARN;

      this.conduit.sendDownstream(connect.AgentEvents.UPDATE, this.agent);
    }
  };

  ClientEngine.prototype.getConnectionDetails = function(transport) {
    var self = this;
    var client = connect.core.getClient();
    var onAuthFail = connect.hitch(self, self.handleAuthFail);
    var onAccessDenied = connect.hitch(self, self.handleAccessDenied);

    return new Promise(function (resolve, reject) {
      client.call(connect.ClientMethods.CREATE_TRANSPORT, transport, {
        success: function (data) {
          connect.getLog().info("getConnectionDetails succeeded");
          resolve(data);
        },
        failure: function (err, data) {
          connect.getLog().error("getConnectionDetails failed")
              .withObject({
                err: err,
                data: data
              });
          reject(Error("getConnectionDetails failed"));
        },
        authFailure: function () {
          connect.getLog().error("getConnectionDetails Auth Failure");
          reject(Error("Authentication failed while getting getConnectionDetails"));
          onAuthFail();
        },
        accessDenied: function () {
          connect.getLog().error("getConnectionDetails Access Denied");
          reject(Error("Access Denied while getting getConnectionDetails"));
          onAccessDenied();
        }
      });
    });
  };

  /**
   * Send a message downstream to all consumers when we detect that authentication
   * against one of our APIs has failed.
   */
  ClientEngine.prototype.handleSendLogsRequest = function () {
    var self = this;
    var logEvents = [];
    var logsToSend = self.logsBuffer.slice();
    self.logsBuffer = [];
    logsToSend.forEach(function (log) {
      logEvents.push({
        timestamp: log.time,
        component: log.component,
        message: log.text
      });
    });
    this.client.call(connect.ClientMethods.SEND_CLIENT_LOGS, { logEvents: logEvents }, {
      success: function (data) {
        connect.getLog().info("SendLogs request succeeded.");
      },
      failure: function (err, data) {
        connect.getLog().error("SendLogs request failed. %s", err);
      },
      authFailure: connect.hitch(self, self.handleAuthFail)
    });
  };

  ClientEngine.prototype.handleAuthFail = function () {
    var self = this;
    self.conduit.sendDownstream(connect.EventType.AUTH_FAIL);
  };

  ClientEngine.prototype.handleAccessDenied = function () {
    var self = this;
    self.conduit.sendDownstream(connect.EventType.ACCESS_DENIED);
  };

  ClientEngine.prototype.checkAuthToken = function () {
    var self = this;
    var expirationDate = new Date(self.initData.authTokenExpiration);
    var currentTimeStamp = new Date().getTime();
    var thirtyMins = 30 * 60 * 1000;

    // refresh token 30 minutes before expiration
    if (expirationDate.getTime() < (currentTimeStamp + thirtyMins)) {
      connect.getLog().info("Auth token expires at " + expirationDate + " Start refreshing token with retry.");
      connect.backoff(connect.hitch(self, self.authorize), REFRESH_AUTH_TOKEN_INTERVAL_MS, REFRESH_AUTH_TOKEN_MAX_TRY);
    }
  };
  

  ClientEngine.prototype.authorize = function (callbacks) {
    var self = this;
    connect.core.authorize(this.initData.authorizeEndpoint).then(function (response) {
      var expiration = new Date(response.expiration);
      connect.getLog().info("Authorization succeded and the token expires at %s", expiration);
      self.initData.authToken = response.accessToken;
      self.initData.authTokenExpiration = expiration;
      connect.core.initClient(self.initData);
      callbacks.success();
    }).catch(function (response) {
      connect.getLog().error("Authorization failed %s ", response);
      if (response.status === 401) {
        self.handleAuthFail();
      } else {
        callbacks.failure();
      }
    });
  };

  /**
   * Filter the 'authentication' field of the request params from the given API_REQUEST event.
   */
  ClientEngine.prototype.filterAuthToken = function (request) {
    var new_request = {};

    for (var keyA in request) {
      if (keyA === 'params') {
        var new_params = {};
        for (var keyB in request.params) {
          if (keyB !== 'authentication') {
            new_params[keyB] = request.params[keyB];
          }
        }

        new_request.params = new_params;
      } else {
        new_request[keyA] = request[keyA];
      }
    }

    return new_request;
  };

  /**-----------------------------------------------------------------------*/
  connect.worker.main = function () {
    connect.worker.clientEngine = new ClientEngine();
  };

})();

/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;

  connect.ChatMediaController = function (mediaInfo, metadata) {

    var logger = connect.getLog();
    var logComponent = connect.LogComponent.CHAT;

    var createMediaInstance = function () {
      publishTelemetryEvent("Chat media controller init", mediaInfo.contactId);
      logger.info(logComponent, "Chat media controller init").withObject(mediaInfo);

      connect.ChatSession.setGlobalConfig({
        loggerConfig: {
          logger: logger
        },
        region: metadata.region
      });
      /** Could be also CUSTOMER -  For now we are creating only Agent connection media object */
      var controller = connect.ChatSession.create({
        chatDetails: mediaInfo,
        type: "AGENT",
        websocketManager: connect.core.getWebSocketManager()
      });
      
      trackChatConnectionStatus(controller);
      return controller
        .connect()
        .then(function (data) {
          logger.info(logComponent, "Chat Session Successfully established for contactId %s", mediaInfo.contactId);
          publishTelemetryEvent("Chat Session Successfully established", mediaInfo.contactId);
          return controller;
        })
        .catch(function (error) {
          logger.error(logComponent, "Chat Session establishement failed for contact %s", mediaInfo.contactId).withException(error);
          publishTelemetryEvent("Chat Session establishement failed", mediaInfo.contactId, error);
          throw error;
        });
    };

    var publishTelemetryEvent = function (eventName, data) {
      connect.publishMetric({
        name: eventName,
        contactId: mediaInfo.contactId,
        data: data || mediaInfo
      });
    };

    var trackChatConnectionStatus = function (controller) {
      controller.onConnectionBroken(function (data) {
        logger.error(logComponent, "Chat Session connection broken").withException(data);
        publishTelemetryEvent("Chat Session connection broken", data);
      });

      controller.onConnectionEstablished(function (data) {
        logger.info(logComponent, "Chat Session connection established").withObject(data);
        publishTelemetryEvent("Chat Session connection established", data);
      });
    }

    return {
      get: function () {
        return createMediaInstance();
      }
    }
  }
})();

/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;

  connect.MediaFactory = function (params) {
    /** controller holder */
    var mediaControllers = {};

    var logger = connect.getLog();
    var logComponent = connect.LogComponent.CHAT;

    var metadata = params || {};
    metadata.region =  metadata.region || "us-west-2"; // Default it to us-west-2

    var getMediaController = function (connectionObj) {
      var connectionId = connectionObj.getConnectionId();
      var mediaInfo = connectionObj.getMediaInfo();
      /** if we do not have the media info then just reject the request */
      if (!mediaInfo) {
        logger.error(logComponent, "Media info does not exists for a media type %s").withObject(connectionObj);
        return Promise.reject("Media info does not exists for this connection");
      }

      if (!mediaControllers[connectionId]) {
        logger.info(logComponent, "media controller of type %s init", connectionObj.getMediaType()).withObject(connectionObj);
        switch (connectionObj.getMediaType()) {
          case connect.MediaType.CHAT:
            return mediaControllers[connectionId] = new connect.ChatMediaController(connectionObj.getMediaInfo(), metadata).get();
          case connect.MediaType.SOFTPHONE:
            return mediaControllers[connectionId] = new connect.SoftphoneMediaController(connectionObj.getMediaInfo()).get();
          default:
            logger.error(logComponent, "Unrecognized media type %s ", connectionObj.getMediaType());
            return Promise.reject();
        }
      } else {
        return mediaControllers[connectionId];
      }
    };

    /** Check all the active states for the connection */
    var ifConnectionActive = function (connectionObj) {
      return connectionObj.isActive();
    };

    var get = function (connectionObj) {
      if (ifConnectionActive(connectionObj)) {
        return getMediaController(connectionObj);
      } else {
        destroy(connectionObj.getConnectionId());
        return Promise.reject("Media Controller is no longer available for this connection");
      }
    };

    var destroy = function (connectionId) {
      if (mediaControllers[connectionId]) {
        logger.info(logComponent, "Destroying mediaController for %s", connectionId);
        delete mediaControllers[connectionId];
      }
    };

    return {
      get: get,
      destroy: destroy
    };
  }
})();
/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

(function () {
  var global = this;
  connect = global.connect || {};
  global.connect = connect;

  // TODO move softphone implementations here - Wil do this for GA
  connect.SoftphoneMediaController = function (mediaInfo) {
    return {
      get: function () {
        return Promise.resolve(mediaInfo)
      }
    }
  }
})();

!function(e){var n={};function t(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,t),o.l=!0,o.exports}t.m=e,t.c=n,t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:r})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(t.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var o in e)t.d(r,o,function(n){return e[n]}.bind(null,o));return r},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="",t(t.s=2)}([function(e,n,t){"use strict";var r=t(1);function o(e){return(o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}var i={assertTrue:function(e,n){if(!e)throw new Error(n)},assertNotNull:function(e,n){return i.assertTrue(null!==e&&void 0!==o(e),Object(r.sprintf)("%s must be provided",n||"A value")),e},isString:function(e){return"string"==typeof e},assertIsNonEmptyString:function(e,n){if(!e||"string"!=typeof e)throw new Error(n+" is not a non-empty string!")},assertIsList:function(e,n){if(!Array.isArray(e))throw new Error(n+" is not an array")},assertIsEnum:function(e,n,t){var r;for(r=0;r<n.length;r++)if(n[r]===e)return;throw new Error(t+" passed is not valid. Allowed values are: "+n)},makeEnum:function(e){var n={};return e.forEach(function(e){var t=e.replace(/\.?([a-z]+)_?/g,function(e,n){return n.toUpperCase()+"_"}).replace(/_$/,"");n[t]=e}),n},isFunction:function(e){return!!(e&&e.constructor&&e.call&&e.apply)},isObject:function(e){return!("object"!==o(e)||null===e)}};i.isString=function(e){return"string"==typeof e},i.isNumber=function(e){return"number"==typeof e};var a=new RegExp("^(wss://)\\w*");i.validWSUrl=function(e){return a.test(e)},i.assertIsObject=function(e,n){if(!i.isObject(e))throw new Error(n+" is not an object!")};var s=i,c="NULL",u="CLIENT_LOGGER",l="DEBUG",f="aws/subscribe",p="aws/unsubscribe",g="aws/heartbeat";function d(e){return(d="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function b(e,n){return!n||"object"!==d(n)&&"function"!=typeof n?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):n}function y(e){return(y=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function v(e,n){return(v=Object.setPrototypeOf||function(e,n){return e.__proto__=n,e})(e,n)}function m(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}function h(e,n){for(var t=0;t<n.length;t++){var r=n[t];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function w(e,n,t){return n&&h(e.prototype,n),t&&h(e,t),e}var S=function(){function e(){m(this,e)}return w(e,[{key:"debug",value:function(e){}},{key:"info",value:function(e){}},{key:"warn",value:function(e){}},{key:"error",value:function(e){}}]),e}(),k={DEBUG:10,INFO:20,WARN:30,ERROR:40},_=function(){function e(){m(this,e),this.updateLoggerConfig(),this.consoleLoggerWrapper=x()}return w(e,[{key:"writeToClientLogger",value:function(e,n){if(this.hasClientLogger())switch(e){case k.DEBUG:return this._clientLogger.debug(n);case k.INFO:return this._clientLogger.info(n);case k.WARN:return this._clientLogger.warn(n);case k.ERROR:return this._clientLogger.error(n)}}},{key:"isLevelEnabled",value:function(e){return e>=this._level}},{key:"hasClientLogger",value:function(){return null!==this._clientLogger}},{key:"getLogger",value:function(e){var n=e.prefix||"";return this._logsDestination===l?this.consoleLoggerWrapper:new C(n)}},{key:"updateLoggerConfig",value:function(e){var n=e||{};this._level=n.level||k.INFO,this._clientLogger=n.logger||null,this._logsDestination=c,n.debug&&(this._logsDestination=l),n.logger&&(this._logsDestination=u)}}]),e}(),T=function(){function e(){m(this,e)}return w(e,[{key:"debug",value:function(){}},{key:"info",value:function(){}},{key:"warn",value:function(){}},{key:"error",value:function(){}}]),e}(),C=function(e){function n(e){var t;return m(this,n),(t=b(this,y(n).call(this))).prefix=e||"",t}return function(e,n){if("function"!=typeof n&&null!==n)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(n&&n.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),n&&v(e,n)}(n,T),w(n,[{key:"debug",value:function(){for(var e=arguments.length,n=new Array(e),t=0;t<e;t++)n[t]=arguments[t];this._log(k.DEBUG,n)}},{key:"info",value:function(){for(var e=arguments.length,n=new Array(e),t=0;t<e;t++)n[t]=arguments[t];this._log(k.INFO,n)}},{key:"warn",value:function(){for(var e=arguments.length,n=new Array(e),t=0;t<e;t++)n[t]=arguments[t];this._log(k.WARN,n)}},{key:"error",value:function(){for(var e=arguments.length,n=new Array(e),t=0;t<e;t++)n[t]=arguments[t];this._log(k.ERROR,n)}},{key:"_shouldLog",value:function(e){return L.hasClientLogger()&&L.isLevelEnabled(e)}},{key:"_writeToClientLogger",value:function(e,n){L.writeToClientLogger(e,n)}},{key:"_log",value:function(e,n){if(this._shouldLog(e)){var t=this._convertToSingleStatement(n);this._writeToClientLogger(e,t)}}},{key:"_convertToSingleStatement",value:function(e){var n="";this.prefix&&(n+=this.prefix+" ");for(var t=0;t<e.length;t++){var r=e[t];n+=this._convertToString(r)+" "}return n}},{key:"_convertToString",value:function(e){try{if(!e)return"";if(s.isString(e))return e;if(s.isObject(e)&&s.isFunction(e.toString)){var n=e.toString();if("[object Object]"!==n)return n}return JSON.stringify(e)}catch(n){return console.error("Error while converting argument to string",e,n),""}}}]),n}(),x=function(){var e=new T;return e.debug=console.debug,e.info=console.info,e.warn=console.warn,e.error=console.error,e},L=new _;t.d(n,"a",function(){return E});var O=function(){var e=L.getLogger({}),n=null,t={reconnectWebSocket:!1,websocketInitFailed:!1,linearConnectAttempt:0,exponentialConnectAttempt:0,exponentialBackOffTime:1,exponentialTimeoutHandle:null,lifeTimeTimeoutHandle:null},r={pendingResponse:!1,intervalHandle:null},o={initFailure:new Set,getWebSocketTransport:null,subscriptionUpdate:new Set,subscriptionFailure:new Set,topic:new Map,allMessage:new Set,connectionGain:new Set,connectionLost:new Set},i={connConfig:null,promiseHandle:null,promiseCompleted:!1},a={subscribed:new Set,pending:new Set},c=new Set([f,p,g]),u=navigator.onLine,l=setInterval(function(){u!==navigator.onLine&&(u=navigator.onLine)&&(!n||n.readyState>1)&&(e.info("Network online, Connecting to websocket"),C())},250),d=function(e,n){e.forEach(function(e){e(n)})},b=function(){if(r.pendingResponse)return e.warn("Heartbeat response not received, Reopening web socket connection"),clearInterval(r.intervalHandle),r.pendingResponse=!1,void S();e.debug("Sending heartbeat"),n.send(_(g)),r.pendingResponse=!0},y=function(){t.linearConnectAttempt=0,t.exponentialConnectAttempt=0,t.exponentialBackOffTime=1,r.pendingResponse=!1,t.reconnectWebSocket=!1,clearTimeout(t.lifeTimeTimeoutHandle),clearInterval(r.intervalHandle),clearTimeout(t.exponentialTimeoutHandle)},v=function(){try{if(e.info("WebSocket connection established!"),d(o.connectionGain),y(),a.subscribed.size>0||a.pending.size>0){var t=Array.from(a.subscribed.values());t=t.concat(Array.from(a.pending.values())),a.subscribed.clear(),n.send(_(f,{topics:t}))}b(),r.intervalHandle=setInterval(b,1e4)}catch(n){e.error("Error after establishing web socket connection, error: ",n)}},m=function(n){t.linearConnectAttempt<=1&&d(o.connectionLost),e.info("Socket connection is closed. event: ",n),t.reconnectWebSocket&&x()},h=function(n){e.error("WebSocketManager Error, error_event: ",n),S()},w=function(n){e.debug("Message received from webSocket server",n.data);var t=JSON.parse(n.data);switch(t.topic){case f:"success"===t.content.status?(t.content.topics.forEach(function(e){a.subscribed.add(e),a.pending.delete(e)}),d(o.subscriptionUpdate,t)):d(o.subscriptionFailure,t);break;case g:e.debug("Heartbeat response received"),r.pendingResponse=!1;break;default:if(t.topic){if(0===o.allMessage.size&&0===o.topic.size)return void e.warn("No registered callback listener for Topic: ",t);d(o.allMessage,t),o.topic.has(t.topic)&&d(o.topic.get(t.topic),t)}else t.message?e.warn("WebSocketManager Message Error, error: ",t):e.warn("Invalid incoming message, error: ",t)}},S=function(){clearTimeout(t.lifeTimeTimeoutHandle),clearInterval(r.intervalHandle),t.linearConnectAttempt<3?(t.linearConnectAttempt++,e.debug("Starting Consecutive WebSocket reconnect, Attempt : "+t.linearConnectAttempt),t.reconnectWebSocket=!0,C()):t.exponentialConnectAttempt<5?(t.exponentialConnectAttempt++,t.exponentialBackOffTime*=2,e.debug("Starting Exponential WebSocket reconnect, Attempt : "+t.exponentialConnectAttempt+" with delay "+t.exponentialBackOffTime+" sec."),i.promiseCompleted=!1,i.connConfig=null,t.exponentialTimeoutHandle=setTimeout(function(){t.reconnectWebSocket=!0,C()},1e3*t.exponentialBackOffTime)):i.promiseCompleted&&(e.error("Could not connect to WebSocket after several attempts"),k())},k=function(){y(),n&&n.readyState!==WebSocket.CLOSED&&n.close(1e3,"Terminating WebSocket Manager"),e.error("WebSocket Initialization failed"),t.websocketInitFailed=!0,clearInterval(l),d(o.initFailure)},_=function(e,n){return JSON.stringify({topic:e,content:n})},T=function(n){return!!(s.isObject(n)&&s.isObject(n.webSocketTransport)&&s.isString(n.webSocketTransport.url)&&s.validWSUrl(n.webSocketTransport.url)&&s.isNumber(n.webSocketTransport.transportLifeTimeInSeconds))||(e.error("Invalid WebSocket Connection Configuration",n),!1)},C=function(){t.websocketInitFailed||(i.connConfig=null,i.promiseCompleted=!1,i.promiseHandle=o.getWebSocketTransport(),i.promiseHandle.then(function(t){i.promiseCompleted=!0,e.debug("Successfully fetched webSocket connection configuration"),T(t)?(i.connConfig=t,navigator.onLine&&(n&&n.readyState!==WebSocket.CLOSED?n.close(1e3,"Restarting WebSocket Manager"):x())):k()},function(n){i.promiseCompleted=!0,e.error("Failed to fetch webSocket connection configuration",n),navigator.onLine&&S()}))},x=function(){if(!t.websocketInitFailed){e.debug("Initializing Websocket Manager");try{T(i.connConfig)?((n=new WebSocket(i.connConfig.webSocketTransport.url)).addEventListener("open",v),n.addEventListener("message",w),n.addEventListener("error",h),n.addEventListener("close",m),t.lifeTimeTimeoutHandle=setTimeout(function(){S()},1e3*i.connConfig.webSocketTransport.transportLifeTimeInSeconds)):i.promiseCompleted&&k()}catch(n){e.error("Error Initializing web-socket-manager",n),k()}}};this.init=function(n){s.assertTrue(s.isFunction(n),"transportHandle must be a function"),null===o.getWebSocketTransport?(o.getWebSocketTransport=n,C()):e.warn("Web Socket Manager was already initialized")},this.onInitFailure=function(e){s.assertTrue(s.isFunction(e),"cb must be a function"),o.initFailure.add(e)},this.onConnectionGain=function(e){s.assertTrue(s.isFunction(e),"cb must be a function"),o.connectionGain.add(e)},this.onConnectionLost=function(e){s.assertTrue(s.isFunction(e),"cb must be a function"),o.connectionLost.add(e)},this.onSubscriptionUpdate=function(e){s.assertTrue(s.isFunction(e),"cb must be a function"),o.subscriptionUpdate.add(e)},this.onSubscriptionFailure=function(e){s.assertTrue(s.isFunction(e),"cb must be a function"),o.subscriptionFailure.add(e)},this.onMessage=function(e,n){s.assertNotNull(e,"topicName"),s.assertTrue(s.isFunction(n),"cb must be a function"),o.topic.has(e)?o.topic.get(e).push(n):o.topic.set(e,new Set([n]))},this.onAllMessage=function(e){s.assertTrue(s.isFunction(e),"cb must be a function"),o.allMessage.add(e)},this.subscribeTopics=function(e){s.assertNotNull(e,"topics"),s.assertIsList(e),e.forEach(function(e){a.pending.add(e)}),n&&n.readyState===WebSocket.OPEN&&n.send(_(f,{topics:e}))},this.sendMessage=function(t){if(s.assertIsObject(t,"payload"),void 0===t.topic||c.has(t.topic))e.warn("Cannot send message, Invalid topic",t);else{try{t=JSON.stringify(t)}catch(n){return void e.warn("Error stringify message",t)}n&&n.readyState===WebSocket.OPEN?(e.debug("WebSocketManager sending message",t),n.send(t)):e.warn("Cannot send message, web socket connection is not open")}}},E={create:function(){return new O},setGlobalConfig:function(e){var n=e.loggerConfig;L.updateLoggerConfig(n)},LogLevel:k,Logger:S}},function(e,n,t){var r;!function(){"use strict";var o={not_string:/[^s]/,not_bool:/[^t]/,not_type:/[^T]/,not_primitive:/[^v]/,number:/[diefg]/,numeric_arg:/[bcdiefguxX]/,json:/[j]/,not_json:/[^j]/,text:/^[^\x25]+/,modulo:/^\x25{2}/,placeholder:/^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,key:/^([a-z_][a-z_\d]*)/i,key_access:/^\.([a-z_][a-z_\d]*)/i,index_access:/^\[(\d+)\]/,sign:/^[+-]/};function i(e){return function(e,n){var t,r,a,s,c,u,l,f,p,g=1,d=e.length,b="";for(r=0;r<d;r++)if("string"==typeof e[r])b+=e[r];else if("object"==typeof e[r]){if((s=e[r]).keys)for(t=n[g],a=0;a<s.keys.length;a++){if(null==t)throw new Error(i('[sprintf] Cannot access property "%s" of undefined value "%s"',s.keys[a],s.keys[a-1]));t=t[s.keys[a]]}else t=s.param_no?n[s.param_no]:n[g++];if(o.not_type.test(s.type)&&o.not_primitive.test(s.type)&&t instanceof Function&&(t=t()),o.numeric_arg.test(s.type)&&"number"!=typeof t&&isNaN(t))throw new TypeError(i("[sprintf] expecting number but found %T",t));switch(o.number.test(s.type)&&(f=t>=0),s.type){case"b":t=parseInt(t,10).toString(2);break;case"c":t=String.fromCharCode(parseInt(t,10));break;case"d":case"i":t=parseInt(t,10);break;case"j":t=JSON.stringify(t,null,s.width?parseInt(s.width):0);break;case"e":t=s.precision?parseFloat(t).toExponential(s.precision):parseFloat(t).toExponential();break;case"f":t=s.precision?parseFloat(t).toFixed(s.precision):parseFloat(t);break;case"g":t=s.precision?String(Number(t.toPrecision(s.precision))):parseFloat(t);break;case"o":t=(parseInt(t,10)>>>0).toString(8);break;case"s":t=String(t),t=s.precision?t.substring(0,s.precision):t;break;case"t":t=String(!!t),t=s.precision?t.substring(0,s.precision):t;break;case"T":t=Object.prototype.toString.call(t).slice(8,-1).toLowerCase(),t=s.precision?t.substring(0,s.precision):t;break;case"u":t=parseInt(t,10)>>>0;break;case"v":t=t.valueOf(),t=s.precision?t.substring(0,s.precision):t;break;case"x":t=(parseInt(t,10)>>>0).toString(16);break;case"X":t=(parseInt(t,10)>>>0).toString(16).toUpperCase()}o.json.test(s.type)?b+=t:(!o.number.test(s.type)||f&&!s.sign?p="":(p=f?"+":"-",t=t.toString().replace(o.sign,"")),u=s.pad_char?"0"===s.pad_char?"0":s.pad_char.charAt(1):" ",l=s.width-(p+t).length,c=s.width&&l>0?u.repeat(l):"",b+=s.align?p+t+c:"0"===u?p+c+t:c+p+t)}return b}(function(e){if(s[e])return s[e];var n,t=e,r=[],i=0;for(;t;){if(null!==(n=o.text.exec(t)))r.push(n[0]);else if(null!==(n=o.modulo.exec(t)))r.push("%");else{if(null===(n=o.placeholder.exec(t)))throw new SyntaxError("[sprintf] unexpected placeholder");if(n[2]){i|=1;var a=[],c=n[2],u=[];if(null===(u=o.key.exec(c)))throw new SyntaxError("[sprintf] failed to parse named argument key");for(a.push(u[1]);""!==(c=c.substring(u[0].length));)if(null!==(u=o.key_access.exec(c)))a.push(u[1]);else{if(null===(u=o.index_access.exec(c)))throw new SyntaxError("[sprintf] failed to parse named argument key");a.push(u[1])}n[2]=a}else i|=2;if(3===i)throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported");r.push({placeholder:n[0],param_no:n[1],keys:n[2],sign:n[3],pad_char:n[4],align:n[5],width:n[6],precision:n[7],type:n[8]})}t=t.substring(n[0].length)}return s[e]=r}(e),arguments)}function a(e,n){return i.apply(null,[e].concat(n||[]))}var s=Object.create(null);n.sprintf=i,n.vsprintf=a,"undefined"!=typeof window&&(window.sprintf=i,window.vsprintf=a,void 0===(r=function(){return{sprintf:i,vsprintf:a}}.call(n,t,n,e))||(e.exports=r))}()},function(e,n,t){"use strict";t.r(n),function(e){t.d(n,"WebSocketManager",function(){return o});var r=t(0);e.connect=e.connect||{},connect.WebSocketManager=r.a;var o=r.a}.call(this,t(3))},function(e,n){var t;t=function(){return this}();try{t=t||new Function("return this")()}catch(e){"object"==typeof window&&(t=window)}e.exports=t}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL3V0aWxzLmpzIiwid2VicGFjazovLy8uL3NyYy9jb25zdGFudHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xvZy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvd2ViU29ja2V0TWFuYWdlci5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvc3ByaW50Zi1qcy9zcmMvc3ByaW50Zi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLyh3ZWJwYWNrKS9idWlsZGluL2dsb2JhbC5qcyJdLCJuYW1lcyI6WyJpbnN0YWxsZWRNb2R1bGVzIiwiX193ZWJwYWNrX3JlcXVpcmVfXyIsIm1vZHVsZUlkIiwiZXhwb3J0cyIsIm1vZHVsZSIsImkiLCJsIiwibW9kdWxlcyIsImNhbGwiLCJtIiwiYyIsImQiLCJuYW1lIiwiZ2V0dGVyIiwibyIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiZW51bWVyYWJsZSIsImdldCIsInIiLCJTeW1ib2wiLCJ0b1N0cmluZ1RhZyIsInZhbHVlIiwidCIsIm1vZGUiLCJfX2VzTW9kdWxlIiwibnMiLCJjcmVhdGUiLCJrZXkiLCJiaW5kIiwibiIsIm9iamVjdCIsInByb3BlcnR5IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJwIiwicyIsIlV0aWxzIiwicHJlbWlzZSIsIm1lc3NhZ2UiLCJFcnJvciIsImFzc2VydFRydWUiLCJ1bmRlZmluZWQiLCJfdHlwZW9mIiwic3ByaW50ZiIsIkFycmF5IiwiaXNBcnJheSIsImFsbG93ZWRWYWx1ZXMiLCJsZW5ndGgiLCJ2YWx1ZXMiLCJlbnVtT2JqIiwiZm9yRWFjaCIsInJlcGxhY2UiLCJ4IiwieSIsInRvVXBwZXJDYXNlIiwib2JqIiwiY29uc3RydWN0b3IiLCJhcHBseSIsImlzU3RyaW5nIiwiaXNOdW1iZXIiLCJ3c1JlZ2V4IiwiUmVnRXhwIiwidmFsaWRXU1VybCIsIndzVXJsIiwidGVzdCIsImFzc2VydElzT2JqZWN0IiwiaXNPYmplY3QiLCJMT0dTX0RFU1RJTkFUSU9OIiwiUk9VVEVfS0VZIiwiTG9nZ2VyIiwiZGF0YSIsIkxvZ0xldmVsIiwiREVCVUciLCJJTkZPIiwiV0FSTiIsIkVSUk9SIiwiTG9nTWFuYWdlckltcGwiLCJfY2xhc3NDYWxsQ2hlY2siLCJ0aGlzIiwidXBkYXRlTG9nZ2VyQ29uZmlnIiwiY29uc29sZUxvZ2dlcldyYXBwZXIiLCJjcmVhdGVDb25zb2xlTG9nZ2VyIiwibGV2ZWwiLCJsb2dTdGF0ZW1lbnQiLCJoYXNDbGllbnRMb2dnZXIiLCJfY2xpZW50TG9nZ2VyIiwiZGVidWciLCJpbmZvIiwid2FybiIsImVycm9yIiwiX2xldmVsIiwib3B0aW9ucyIsInByZWZpeCIsIl9sb2dzRGVzdGluYXRpb24iLCJMb2dnZXJXcmFwcGVySW1wbCIsImlucHV0Q29uZmlnIiwiY29uZmlnIiwibG9nZ2VyIiwiTG9nZ2VyV3JhcHBlciIsIl90aGlzIiwiX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4iLCJfZ2V0UHJvdG90eXBlT2YiLCJfbGVuIiwiYXJndW1lbnRzIiwiYXJncyIsIl9rZXkiLCJfbG9nIiwiX2xlbjIiLCJfa2V5MiIsIl9sZW4zIiwiX2tleTMiLCJfbGVuNCIsIl9rZXk0IiwiTG9nTWFuYWdlciIsImlzTGV2ZWxFbmFibGVkIiwid3JpdGVUb0NsaWVudExvZ2dlciIsIl9zaG91bGRMb2ciLCJfY29udmVydFRvU2luZ2xlU3RhdGVtZW50IiwiX3dyaXRlVG9DbGllbnRMb2dnZXIiLCJpbmRleCIsImFyZyIsIl9jb252ZXJ0VG9TdHJpbmciLCJpc0Z1bmN0aW9uIiwidG9TdHJpbmciLCJ0b1N0cmluZ1Jlc3VsdCIsIkpTT04iLCJzdHJpbmdpZnkiLCJjb25zb2xlIiwiX193ZWJwYWNrX2V4cG9ydHNfXyIsIldlYlNvY2tldE1hbmFnZXJPYmplY3QiLCJXZWJTb2NrZXRNYW5hZ2VyIiwiZ2V0TG9nZ2VyIiwid2ViU29ja2V0IiwicmVjb25uZWN0Q29uZmlnIiwicmVjb25uZWN0V2ViU29ja2V0Iiwid2Vic29ja2V0SW5pdEZhaWxlZCIsImxpbmVhckNvbm5lY3RBdHRlbXB0IiwiZXhwb25lbnRpYWxDb25uZWN0QXR0ZW1wdCIsImV4cG9uZW50aWFsQmFja09mZlRpbWUiLCJleHBvbmVudGlhbFRpbWVvdXRIYW5kbGUiLCJsaWZlVGltZVRpbWVvdXRIYW5kbGUiLCJoZWFydGJlYXRDb25maWciLCJwZW5kaW5nUmVzcG9uc2UiLCJpbnRlcnZhbEhhbmRsZSIsImNhbGxiYWNrcyIsImluaXRGYWlsdXJlIiwiU2V0IiwiZ2V0V2ViU29ja2V0VHJhbnNwb3J0Iiwic3Vic2NyaXB0aW9uVXBkYXRlIiwic3Vic2NyaXB0aW9uRmFpbHVyZSIsInRvcGljIiwiTWFwIiwiYWxsTWVzc2FnZSIsImNvbm5lY3Rpb25HYWluIiwiY29ubmVjdGlvbkxvc3QiLCJ3ZWJTb2NrZXRDb25maWciLCJjb25uQ29uZmlnIiwicHJvbWlzZUhhbmRsZSIsInByb21pc2VDb21wbGV0ZWQiLCJ0b3BpY1N1YnNjcmlwdGlvbiIsInN1YnNjcmliZWQiLCJwZW5kaW5nIiwiaW52YWxpZFNlbmRNZXNzYWdlUm91dGVLZXlzIiwib25saW5lIiwibmF2aWdhdG9yIiwib25MaW5lIiwibmV0d29ya0Nvbm5lY3Rpdml0eUNoZWNrZXIiLCJzZXRJbnRlcnZhbCIsInJlYWR5U3RhdGUiLCJnZXRXZWJTb2NrZXRDb25uQ29uZmlnIiwiaW52b2tlQ2FsbGJhY2tzIiwicmVzcG9uc2UiLCJjYWxsYmFjayIsInNlbmRIZWFydEJlYXQiLCJjbGVhckludGVydmFsIiwicmVmcmVzaFdlYlNvY2tldENvbm5lY3Rpb24iLCJzZW5kIiwiY3JlYXRlV2ViU29ja2V0UGF5bG9hZCIsInJlc2V0U3RhdGUiLCJjbGVhclRpbWVvdXQiLCJ3ZWJTb2NrZXRPbk9wZW4iLCJzaXplIiwidG9waWNzIiwiZnJvbSIsImNvbmNhdCIsImNsZWFyIiwid2ViU29ja2V0T25DbG9zZSIsImV2ZW50IiwiaW5pdFdlYlNvY2tldCIsIndlYlNvY2tldE9uRXJyb3IiLCJ3ZWJTb2NrZXRPbk1lc3NhZ2UiLCJwYXJzZSIsImNvbnRlbnQiLCJzdGF0dXMiLCJ0b3BpY05hbWUiLCJhZGQiLCJoYXMiLCJzZXRUaW1lb3V0IiwidGVybWluYXRlV2ViU29ja2V0TWFuYWdlciIsIldlYlNvY2tldCIsIkNMT1NFRCIsImNsb3NlIiwidmFsaWRXZWJTb2NrZXRDb25uQ29uZmlnIiwid2ViU29ja2V0VHJhbnNwb3J0IiwidXJsIiwidHJhbnNwb3J0TGlmZVRpbWVJblNlY29uZHMiLCJ0aGVuIiwicmVhc29uIiwiYWRkRXZlbnRMaXN0ZW5lciIsImluaXQiLCJ0cmFuc3BvcnRIYW5kbGUiLCJvbkluaXRGYWlsdXJlIiwiY2IiLCJvbkNvbm5lY3Rpb25HYWluIiwib25Db25uZWN0aW9uTG9zdCIsIm9uU3Vic2NyaXB0aW9uVXBkYXRlIiwib25TdWJzY3JpcHRpb25GYWlsdXJlIiwib25NZXNzYWdlIiwiYXNzZXJ0Tm90TnVsbCIsInB1c2giLCJzZXQiLCJvbkFsbE1lc3NhZ2UiLCJzdWJzY3JpYmVUb3BpY3MiLCJhc3NlcnRJc0xpc3QiLCJPUEVOIiwic2VuZE1lc3NhZ2UiLCJwYXlsb2FkIiwic2V0R2xvYmFsQ29uZmlnIiwibG9nZ2VyQ29uZmlnIiwiX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18iLCJyZSIsIm5vdF9zdHJpbmciLCJub3RfYm9vbCIsIm5vdF90eXBlIiwibm90X3ByaW1pdGl2ZSIsIm51bWJlciIsIm51bWVyaWNfYXJnIiwianNvbiIsIm5vdF9qc29uIiwidGV4dCIsIm1vZHVsbyIsInBsYWNlaG9sZGVyIiwia2V5X2FjY2VzcyIsImluZGV4X2FjY2VzcyIsInNpZ24iLCJwYXJzZV90cmVlIiwiYXJndiIsImsiLCJwaCIsInBhZCIsInBhZF9jaGFyYWN0ZXIiLCJwYWRfbGVuZ3RoIiwiaXNfcG9zaXRpdmUiLCJjdXJzb3IiLCJ0cmVlX2xlbmd0aCIsIm91dHB1dCIsImtleXMiLCJwYXJhbV9ubyIsInR5cGUiLCJGdW5jdGlvbiIsImlzTmFOIiwiVHlwZUVycm9yIiwicGFyc2VJbnQiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJ3aWR0aCIsInByZWNpc2lvbiIsInBhcnNlRmxvYXQiLCJ0b0V4cG9uZW50aWFsIiwidG9GaXhlZCIsIk51bWJlciIsInRvUHJlY2lzaW9uIiwic3Vic3RyaW5nIiwic2xpY2UiLCJ0b0xvd2VyQ2FzZSIsInZhbHVlT2YiLCJwYWRfY2hhciIsImNoYXJBdCIsInJlcGVhdCIsImFsaWduIiwic3ByaW50Zl9mb3JtYXQiLCJmbXQiLCJzcHJpbnRmX2NhY2hlIiwibWF0Y2giLCJfZm10IiwiYXJnX25hbWVzIiwiZXhlYyIsIlN5bnRheEVycm9yIiwiZmllbGRfbGlzdCIsInJlcGxhY2VtZW50X2ZpZWxkIiwiZmllbGRfbWF0Y2giLCJzcHJpbnRmX3BhcnNlIiwidnNwcmludGYiLCJ3aW5kb3ciLCJnbG9iYWwiLCJfd2ViU29ja2V0TWFuYWdlcl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fIiwiY29ubmVjdCIsImciLCJlIl0sIm1hcHBpbmdzIjoiYUFDQSxJQUFBQSxFQUFBLEdBR0EsU0FBQUMsRUFBQUMsR0FHQSxHQUFBRixFQUFBRSxHQUNBLE9BQUFGLEVBQUFFLEdBQUFDLFFBR0EsSUFBQUMsRUFBQUosRUFBQUUsR0FBQSxDQUNBRyxFQUFBSCxFQUNBSSxHQUFBLEVBQ0FILFFBQUEsSUFVQSxPQU5BSSxFQUFBTCxHQUFBTSxLQUFBSixFQUFBRCxRQUFBQyxJQUFBRCxRQUFBRixHQUdBRyxFQUFBRSxHQUFBLEVBR0FGLEVBQUFELFFBS0FGLEVBQUFRLEVBQUFGLEVBR0FOLEVBQUFTLEVBQUFWLEVBR0FDLEVBQUFVLEVBQUEsU0FBQVIsRUFBQVMsRUFBQUMsR0FDQVosRUFBQWEsRUFBQVgsRUFBQVMsSUFDQUcsT0FBQUMsZUFBQWIsRUFBQVMsRUFBQSxDQUEwQ0ssWUFBQSxFQUFBQyxJQUFBTCxLQUsxQ1osRUFBQWtCLEVBQUEsU0FBQWhCLEdBQ0Esb0JBQUFpQixlQUFBQyxhQUNBTixPQUFBQyxlQUFBYixFQUFBaUIsT0FBQUMsWUFBQSxDQUF3REMsTUFBQSxXQUV4RFAsT0FBQUMsZUFBQWIsRUFBQSxjQUFpRG1CLE9BQUEsS0FRakRyQixFQUFBc0IsRUFBQSxTQUFBRCxFQUFBRSxHQUVBLEdBREEsRUFBQUEsSUFBQUYsRUFBQXJCLEVBQUFxQixJQUNBLEVBQUFFLEVBQUEsT0FBQUYsRUFDQSxLQUFBRSxHQUFBLGlCQUFBRixRQUFBRyxXQUFBLE9BQUFILEVBQ0EsSUFBQUksRUFBQVgsT0FBQVksT0FBQSxNQUdBLEdBRkExQixFQUFBa0IsRUFBQU8sR0FDQVgsT0FBQUMsZUFBQVUsRUFBQSxXQUF5Q1QsWUFBQSxFQUFBSyxVQUN6QyxFQUFBRSxHQUFBLGlCQUFBRixFQUFBLFFBQUFNLEtBQUFOLEVBQUFyQixFQUFBVSxFQUFBZSxFQUFBRSxFQUFBLFNBQUFBLEdBQWdILE9BQUFOLEVBQUFNLElBQXFCQyxLQUFBLEtBQUFELElBQ3JJLE9BQUFGLEdBSUF6QixFQUFBNkIsRUFBQSxTQUFBMUIsR0FDQSxJQUFBUyxFQUFBVCxLQUFBcUIsV0FDQSxXQUEyQixPQUFBckIsRUFBQSxTQUMzQixXQUFpQyxPQUFBQSxHQUVqQyxPQURBSCxFQUFBVSxFQUFBRSxFQUFBLElBQUFBLEdBQ0FBLEdBSUFaLEVBQUFhLEVBQUEsU0FBQWlCLEVBQUFDLEdBQXNELE9BQUFqQixPQUFBa0IsVUFBQUMsZUFBQTFCLEtBQUF1QixFQUFBQyxJQUd0RC9CLEVBQUFrQyxFQUFBLEdBSUFsQyxJQUFBbUMsRUFBQSxrUkNqRkEsSUFBTUMsRUFBUSxDQUtkQSxXQUFtQixTQUFTQyxFQUFTQyxHQUNuQyxJQUFLRCxFQUNILE1BQU0sSUFBSUUsTUFBTUQsSUFPcEJGLGNBQXNCLFNBQVNmLEVBQU9WLEdBS3BDLE9BSkF5QixFQUFNSSxXQUNNLE9BQVZuQixRQUFtQ29CLElBQWpCQyxFQUFPckIsR0FDekJzQixrQkFBUSxzQkFBdUJoQyxHQUFRLFlBRWxDVSxHQUdUZSxTQUFpQixTQUFTZixHQUN4QixNQUF3QixpQkFBVkEsR0FHaEJlLHVCQUErQixTQUFTZixFQUFPTSxHQUM3QyxJQUFLTixHQUEwQixpQkFBVkEsRUFDbkIsTUFBTSxJQUFJa0IsTUFBTVosRUFBTSxnQ0FJMUJTLGFBQXFCLFNBQVNmLEVBQU9NLEdBQ25DLElBQUtpQixNQUFNQyxRQUFReEIsR0FDakIsTUFBTSxJQUFJa0IsTUFBTVosRUFBTSxxQkFJMUJTLGFBQXFCLFNBQVNmLEVBQU95QixFQUFlbkIsR0FDbEQsSUFBSXZCLEVBQ0osSUFBS0EsRUFBSSxFQUFHQSxFQUFJMEMsRUFBY0MsT0FBUTNDLElBQ3BDLEdBQUkwQyxFQUFjMUMsS0FBT2lCLEVBQ3ZCLE9BR0osTUFBTSxJQUFJa0IsTUFDUlosRUFBTSw2Q0FBb0RtQixJQVc5RFYsU0FBaUIsU0FBU1ksR0FDeEIsSUFBSUMsRUFBVSxHQVlkLE9BVkFELEVBQU9FLFFBQVEsU0FBUzdCLEdBQ3RCLElBQUlNLEVBQU1OLEVBQ1A4QixRQUFRLGlCQUFrQixTQUFTQyxFQUFHQyxHQUNyQyxPQUFPQSxFQUFFQyxjQUFnQixNQUUxQkgsUUFBUSxLQUFNLElBRWpCRixFQUFRdEIsR0FBT04sSUFHVjRCLEdBT1RiLFdBQW1CLFNBQVNtQixHQUMxQixTQUFVQSxHQUFPQSxFQUFJQyxhQUFlRCxFQUFJaEQsTUFBUWdELEVBQUlFLFFBR3REckIsU0FBaUIsU0FBU2YsR0FDeEIsUUFBMEIsV0FBakJxQixFQUFPckIsSUFBZ0MsT0FBVkEsS0FHeENlLEVBQU1zQixTQUFXLFNBQVNyQyxHQUN4QixNQUF3QixpQkFBVkEsR0FHaEJlLEVBQU11QixTQUFXLFNBQVN0QyxHQUN4QixNQUF3QixpQkFBVkEsR0FHaEIsSUFBTXVDLEVBQVUsSUFBSUMsT0FBTyxpQkFDM0J6QixFQUFNMEIsV0FBYSxTQUFVQyxHQUMzQixPQUFPSCxFQUFRSSxLQUFLRCxJQUd0QjNCLEVBQU02QixlQUFpQixTQUFTNUMsRUFBT00sR0FDckMsSUFBS1MsRUFBTThCLFNBQVM3QyxHQUNsQixNQUFNLElBQUlrQixNQUFNWixFQUFNLHVCQUlYUyxRQ3hHRitCLEVBQ0wsT0FES0EsRUFFSSxnQkFGSkEsRUFHSixRQU9JQyxFQUNBLGdCQURBQSxFQUVFLGtCQUZGQSxFQUdBLGs5QkNWUEMsNEVBQ0VDLGlDQUVEQSxpQ0FFQUEsa0NBRUNBLGFBSUZDLEVBQVcsQ0FDZkMsTUFBTyxHQUNQQyxLQUFNLEdBQ05DLEtBQU0sR0FDTkMsTUFBTyxJQUdIQyxhQUNKLFNBQUFBLElBQWNDLEVBQUFDLEtBQUFGLEdBQ1pFLEtBQUtDLHFCQUNMRCxLQUFLRSxxQkFBdUJDLDBEQUdWQyxFQUFPQyxHQUN6QixHQUFLTCxLQUFLTSxrQkFHVixPQUFRRixHQUNOLEtBQUtYLEVBQVNDLE1BQ1osT0FBT00sS0FBS08sY0FBY0MsTUFBTUgsR0FDbEMsS0FBS1osRUFBU0UsS0FDWixPQUFPSyxLQUFLTyxjQUFjRSxLQUFLSixHQUNqQyxLQUFLWixFQUFTRyxLQUNaLE9BQU9JLEtBQUtPLGNBQWNHLEtBQUtMLEdBQ2pDLEtBQUtaLEVBQVNJLE1BQ1osT0FBT0csS0FBS08sY0FBY0ksTUFBTU4sMkNBSXZCRCxHQUNiLE9BQU9BLEdBQVNKLEtBQUtZLGlEQUlyQixPQUE4QixPQUF2QlosS0FBS08sZ0RBR0pNLEdBQ1IsSUFBSUMsRUFBU0QsRUFBUUMsUUFBVSxHQUMvQixPQUFJZCxLQUFLZSxtQkFBcUIxQixFQUNyQlcsS0FBS0UscUJBRVAsSUFBSWMsRUFBa0JGLDhDQUdaRyxHQUNqQixJQUFJQyxFQUFTRCxHQUFlLEdBQzVCakIsS0FBS1ksT0FBU00sRUFBT2QsT0FBU1gsRUFBU0UsS0FDdkNLLEtBQUtPLGNBQWdCVyxFQUFPQyxRQUFVLEtBQ3RDbkIsS0FBS2UsaUJBQW1CMUIsRUFDcEI2QixFQUFPVixRQUNUUixLQUFLZSxpQkFBbUIxQixHQUV0QjZCLEVBQU9DLFNBQ1RuQixLQUFLZSxpQkFBbUIxQixZQUt4QitCLHlMQVVBSixjQUNKLFNBQUFBLEVBQVlGLEdBQVEsSUFBQU8sRUFBQSxPQUFBdEIsRUFBQUMsS0FBQWdCLElBQ2xCSyxFQUFBQyxFQUFBdEIsS0FBQXVCLEVBQUFQLEdBQUF2RixLQUFBdUUsUUFDS2MsT0FBU0EsR0FBVSxHQUZOTyw4T0FEVUQsc0NBTWYsUUFBQUksRUFBQUMsVUFBQXhELE9BQU55RCxFQUFNLElBQUE1RCxNQUFBMEQsR0FBQUcsRUFBQSxFQUFBQSxFQUFBSCxFQUFBRyxJQUFORCxFQUFNQyxHQUFBRixVQUFBRSxHQUNiM0IsS0FBSzRCLEtBQUtuQyxFQUFTQyxNQUFPZ0Msa0NBR2QsUUFBQUcsRUFBQUosVUFBQXhELE9BQU55RCxFQUFNLElBQUE1RCxNQUFBK0QsR0FBQUMsRUFBQSxFQUFBQSxFQUFBRCxFQUFBQyxJQUFOSixFQUFNSSxHQUFBTCxVQUFBSyxHQUNaOUIsS0FBSzRCLEtBQUtuQyxFQUFTRSxLQUFNK0Isa0NBR2IsUUFBQUssRUFBQU4sVUFBQXhELE9BQU55RCxFQUFNLElBQUE1RCxNQUFBaUUsR0FBQUMsRUFBQSxFQUFBQSxFQUFBRCxFQUFBQyxJQUFOTixFQUFNTSxHQUFBUCxVQUFBTyxHQUNaaEMsS0FBSzRCLEtBQUtuQyxFQUFTRyxLQUFNOEIsbUNBR1osUUFBQU8sRUFBQVIsVUFBQXhELE9BQU55RCxFQUFNLElBQUE1RCxNQUFBbUUsR0FBQUMsRUFBQSxFQUFBQSxFQUFBRCxFQUFBQyxJQUFOUixFQUFNUSxHQUFBVCxVQUFBUyxHQUNibEMsS0FBSzRCLEtBQUtuQyxFQUFTSSxNQUFPNkIsc0NBR2pCdEIsR0FDVCxPQUFPK0IsRUFBVzdCLG1CQUFxQjZCLEVBQVdDLGVBQWVoQyxnREFHOUNBLEVBQU9DLEdBQzFCOEIsRUFBV0Usb0JBQW9CakMsRUFBT0MsZ0NBR25DRCxFQUFPc0IsR0FDVixHQUFJMUIsS0FBS3NDLFdBQVdsQyxHQUFRLENBQzFCLElBQUlDLEVBQWVMLEtBQUt1QywwQkFBMEJiLEdBQ2xEMUIsS0FBS3dDLHFCQUFxQnBDLEVBQU9DLHNEQUlYcUIsR0FDeEIsSUFBSXJCLEVBQWUsR0FDZkwsS0FBS2MsU0FDUFQsR0FBZ0JMLEtBQUtjLE9BQVMsS0FFaEMsSUFBSyxJQUFJMkIsRUFBUSxFQUFHQSxFQUFRZixFQUFLekQsT0FBUXdFLElBQVMsQ0FDaEQsSUFBSUMsRUFBTWhCLEVBQUtlLEdBQ2ZwQyxHQUFnQkwsS0FBSzJDLGlCQUFpQkQsR0FBTyxJQUUvQyxPQUFPckMsMkNBR1FxQyxHQUNmLElBQ0UsSUFBS0EsRUFDSCxNQUFPLEdBRVQsR0FBSXBGLEVBQU1zQixTQUFTOEQsR0FDakIsT0FBT0EsRUFFVCxHQUFJcEYsRUFBTThCLFNBQVNzRCxJQUFRcEYsRUFBTXNGLFdBQVdGLEVBQUlHLFVBQVcsQ0FDekQsSUFBSUMsRUFBaUJKLEVBQUlHLFdBQ3pCLEdBQXVCLG9CQUFuQkMsRUFDRixPQUFPQSxFQUdYLE9BQU9DLEtBQUtDLFVBQVVOLEdBQ3RCLE1BQU8vQixHQUVQLE9BREFzQyxRQUFRdEMsTUFBTSw0Q0FBNkMrQixFQUFLL0IsR0FDekQsYUFLVFIsRUFBc0IsV0FDeEIsSUFBSWdCLEVBQVMsSUFBSUMsRUFLakIsT0FKQUQsRUFBT1gsTUFBUXlDLFFBQVF6QyxNQUN2QlcsRUFBT1YsS0FBT3dDLFFBQVF4QyxLQUN0QlUsRUFBT1QsS0FBT3VDLFFBQVF2QyxLQUN0QlMsRUFBT1IsTUFBUXNDLFFBQVF0QyxNQUNoQlEsR0FHSGdCLEVBQWEsSUFBSXJDLEVDcEt2QjVFLEVBQUFVLEVBQUFzSCxFQUFBLHNCQUFBQyxJQVVBLElBQU1DLEVBQW1CLFdBRXJCLElBQU1qQyxFQUFTZ0IsRUFBV2tCLFVBQVUsSUFFaENDLEVBQVksS0FFWkMsRUFBa0IsQ0FDbEJDLG9CQUFvQixFQUNwQkMscUJBQXFCLEVBQ3JCQyxxQkFBc0IsRUFDdEJDLDBCQUEyQixFQUMzQkMsdUJBQXdCLEVBQ3hCQyx5QkFBMEIsS0FDMUJDLHNCQUF1QixNQUd2QkMsRUFBa0IsQ0FDbEJDLGlCQUFpQixFQUNqQkMsZUFBZ0IsTUFHaEJDLEVBQVksQ0FDWkMsWUFBYSxJQUFJQyxJQUNqQkMsc0JBQXVCLEtBQ3ZCQyxtQkFBb0IsSUFBSUYsSUFDeEJHLG9CQUFxQixJQUFJSCxJQUN6QkksTUFBTyxJQUFJQyxJQUNYQyxXQUFZLElBQUlOLElBQ2hCTyxlQUFnQixJQUFJUCxJQUNwQlEsZUFBZ0IsSUFBSVIsS0FHcEJTLEVBQWtCLENBQ2xCQyxXQUFZLEtBQ1pDLGNBQWUsS0FDZkMsa0JBQWtCLEdBR2xCQyxFQUFvQixDQUNwQkMsV0FBWSxJQUFJZCxJQUNoQmUsUUFBUyxJQUFJZixLQUdYZ0IsRUFBOEIsSUFBSWhCLElBQUksQ0FBQzlFLEVBQXFCQSxFQUF1QkEsSUFFckYrRixFQUFTQyxVQUFVQyxPQUNqQkMsRUFBNkJDLFlBQVksV0FDdkNKLElBQVdDLFVBQVVDLFNBQ3JCRixFQUFTQyxVQUFVQyxXQUNIakMsR0FBYUEsRUFBVW9DLFdBQWEsS0FDaER2RSxFQUFPVixLQUFLLDJDQUNaa0YsTUFHVCxLQUVHQyxFQUFrQixTQUFTMUIsRUFBVzJCLEdBQ3hDM0IsRUFBVTlGLFFBQVEsU0FBVTBILEdBQ3hCQSxFQUFTRCxNQUlYRSxFQUFnQixXQUNsQixHQUFJaEMsRUFBZ0JDLGdCQUtoQixPQUpBN0MsRUFBT1QsS0FBSyxvRUFDWnNGLGNBQWNqQyxFQUFnQkUsZ0JBQzlCRixFQUFnQkMsaUJBQWtCLE9BQ2xDaUMsSUFHSjlFLEVBQU9YLE1BQU0scUJBQ2I4QyxFQUFVNEMsS0FBS0MsRUFBdUI3RyxJQUN0Q3lFLEVBQWdCQyxpQkFBa0IsR0FHaENvQyxFQUFhLFdBQ2Y3QyxFQUFnQkcscUJBQXVCLEVBQ3ZDSCxFQUFnQkksMEJBQTRCLEVBQzVDSixFQUFnQkssdUJBQXlCLEVBQ3pDRyxFQUFnQkMsaUJBQWtCLEVBQ2xDVCxFQUFnQkMsb0JBQXFCLEVBRXJDNkMsYUFBYTlDLEVBQWdCTyx1QkFDN0JrQyxjQUFjakMsRUFBZ0JFLGdCQUM5Qm9DLGFBQWE5QyxFQUFnQk0sMkJBRzNCeUMsRUFBa0IsV0FDcEIsSUFNSSxHQUxBbkYsRUFBT1YsS0FBSyxxQ0FDWm1GLEVBQWdCMUIsRUFBVVMsZ0JBRTFCeUIsSUFFSW5CLEVBQWtCQyxXQUFXcUIsS0FBTyxHQUFLdEIsRUFBa0JFLFFBQVFvQixLQUFPLEVBQUcsQ0FDN0UsSUFBSUMsRUFBUzFJLE1BQU0ySSxLQUFLeEIsRUFBa0JDLFdBQVdoSCxVQUNyRHNJLEVBQVNBLEVBQU9FLE9BQU81SSxNQUFNMkksS0FBS3hCLEVBQWtCRSxRQUFRakgsV0FDNUQrRyxFQUFrQkMsV0FBV3lCLFFBQzdCckQsRUFBVTRDLEtBQUtDLEVBQXVCN0csRUFBcUIsQ0FBQ2tILE9BQVVBLEtBRzFFVCxJQUNBaEMsRUFBZ0JFLGVBQWlCd0IsWUFBWU0sRUFBZSxLQUM5RCxNQUFPcEYsR0FDTFEsRUFBT1IsTUFBTSwwREFBMkRBLEtBSTFFaUcsRUFBbUIsU0FBU0MsR0FDMUJ0RCxFQUFnQkcsc0JBQXdCLEdBQ3hDa0MsRUFBZ0IxQixFQUFVVSxnQkFFOUJ6RCxFQUFPVixLQUFLLHVDQUF3Q29HLEdBQ2hEdEQsRUFBZ0JDLG9CQUNoQnNELEtBSUZDLEVBQW1CLFNBQVNGLEdBQzlCMUYsRUFBT1IsTUFBTSx3Q0FBeUNrRyxHQUN0RFosS0FHRWUsRUFBcUIsU0FBU0gsR0FDaEMxRixFQUFPWCxNQUFNLHlDQUEwQ3FHLEVBQU1ySCxNQUM3RCxJQUFNcUcsRUFBVzlDLEtBQUtrRSxNQUFNSixFQUFNckgsTUFDbEMsT0FBUXFHLEVBQVNyQixPQUNiLEtBQUtsRixFQUMrQixZQUE1QnVHLEVBQVNxQixRQUFRQyxRQUNqQnRCLEVBQVNxQixRQUFRVixPQUFPcEksUUFBUyxTQUFVZ0osR0FDdkNuQyxFQUFrQkMsV0FBV21DLElBQUlELEdBQ2pDbkMsRUFBa0JFLFFBQWxCLE9BQWlDaUMsS0FFckN4QixFQUFnQjFCLEVBQVVJLG1CQUFvQnVCLElBRTlDRCxFQUFnQjFCLEVBQVVLLG9CQUFxQnNCLEdBRW5ELE1BQ0osS0FBS3ZHLEVBQ0Q2QixFQUFPWCxNQUFNLCtCQUNidUQsRUFBZ0JDLGlCQUFrQixFQUNsQyxNQUNKLFFBQ0ksR0FBSTZCLEVBQVNyQixNQUFPLENBQ2hCLEdBQWtDLElBQTlCTixFQUFVUSxXQUFXNkIsTUFBdUMsSUFBekJyQyxFQUFVTSxNQUFNK0IsS0FFbkQsWUFEQXBGLEVBQU9ULEtBQUssOENBQStDbUYsR0FHL0RELEVBQWdCMUIsRUFBVVEsV0FBWW1CLEdBQ2xDM0IsRUFBVU0sTUFBTThDLElBQUl6QixFQUFTckIsUUFDN0JvQixFQUFnQjFCLEVBQVVNLE1BQU1ySSxJQUFJMEosRUFBU3JCLE9BQVFxQixRQUVsREEsRUFBU3JJLFFBQ2hCMkQsRUFBT1QsS0FBSywwQ0FBMkNtRixHQUV2RDFFLEVBQU9ULEtBQUssb0NBQXFDbUYsS0FLM0RJLEVBQTZCLFdBQy9CSSxhQUFhOUMsRUFBZ0JPLHVCQUM3QmtDLGNBQWNqQyxFQUFnQkUsZ0JBRTFCVixFQUFnQkcscUJGdktlLEdFd0svQkgsRUFBZ0JHLHVCQUNoQnZDLEVBQU9YLE1BQU0sdURBQXlEK0MsRUFBZ0JHLHNCQUN0RkgsRUFBZ0JDLG9CQUFxQixFQUNyQ21DLEtBQ09wQyxFQUFnQkksMEJGM0thLEdFNEtwQ0osRUFBZ0JJLDRCQUNoQkosRUFBZ0JLLHdCQUEwQixFQUMxQ3pDLEVBQU9YLE1BQU0sdURBQ1ArQyxFQUFnQkksMEJBQTRCLGVBQzVDSixFQUFnQkssdUJBQXlCLFNBRy9DaUIsRUFBZ0JHLGtCQUFtQixFQUNuQ0gsRUFBZ0JDLFdBQWEsS0FFN0J2QixFQUFnQk0seUJBQTJCMEQsV0FBVyxXQUNsRGhFLEVBQWdCQyxvQkFBcUIsRUFDckNtQyxLQUNELElBQU9wQyxFQUFnQksseUJBQ25CaUIsRUFBZ0JHLG1CQUN2QjdELEVBQU9SLE1BQU0seURBQ2I2RyxNQUlGQSxFQUE0QixXQUM5QnBCLElBQ0k5QyxHQUFhQSxFQUFVb0MsYUFBZStCLFVBQVVDLFFBQ2hEcEUsRUFBVXFFLE1BQU0sSUFBTSxpQ0FFMUJ4RyxFQUFPUixNQUFNLG1DQUNiNEMsRUFBZ0JFLHFCQUFzQixFQUN0Q3VDLGNBQWNSLEdBQ2RJLEVBQWdCMUIsRUFBVUMsY0FHeEJnQyxFQUF5QixTQUFVdEosRUFBS3FLLEdBQzFDLE9BQU9uRSxLQUFLQyxVQUFVLENBQ2xCd0IsTUFBUzNILEVBQ1RxSyxRQUFXQSxLQXFDYlUsRUFBMkIsU0FBVTlDLEdBQ3ZDLFNBQUl4SCxFQUFNOEIsU0FBUzBGLElBQWV4SCxFQUFNOEIsU0FBUzBGLEVBQVcrQyxxQkFDckR2SyxFQUFNc0IsU0FBU2tHLEVBQVcrQyxtQkFBbUJDLE1BQzdDeEssRUFBTTBCLFdBQVc4RixFQUFXK0MsbUJBQW1CQyxNQUMvQ3hLLEVBQU11QixTQUFTaUcsRUFBVytDLG1CQUFtQkUsK0JBR3BENUcsRUFBT1IsTUFBTSw2Q0FBOENtRSxJQUNwRCxJQUdMYSxFQUF5QixXQUN2QnBDLEVBQWdCRSxzQkFHcEJvQixFQUFnQkMsV0FBYSxLQUM3QkQsRUFBZ0JHLGtCQUFtQixFQUNuQ0gsRUFBZ0JFLGNBQWdCYixFQUFVRyx3QkFDMUNRLEVBQWdCRSxjQUNYaUQsS0FBSyxTQUFTbkMsR0FDUGhCLEVBQWdCRyxrQkFBbUIsRUFDbkM3RCxFQUFPWCxNQUFNLDJEQUNSb0gsRUFBeUIvQixJQUk5QmhCLEVBQWdCQyxXQUFhZSxFQUN4QlAsVUFBVUMsU0FHWGpDLEdBQWFBLEVBQVVvQyxhQUFlK0IsVUFBVUMsT0FDaERwRSxFQUFVcUUsTUFBTSxJQUFNLGdDQUcxQmIsTUFYSVUsS0FhUixTQUFTUyxHQUNMcEQsRUFBZ0JHLGtCQUFtQixFQUNuQzdELEVBQU9SLE1BQU0scURBQXNEc0gsR0FDL0QzQyxVQUFVQyxRQUNWVSxRQUtkYSxFQUFnQixXQUNsQixJQUFJdkQsRUFBZ0JFLG9CQUFwQixDQUdBdEMsRUFBT1gsTUFBTSxrQ0FDYixJQUNRb0gsRUFBeUIvQyxFQUFnQkMsY0FFekN4QixFQUFZLElBQUltRSxVQUFVNUMsRUFBZ0JDLFdBQVcrQyxtQkFBbUJDLE1BQzlESSxpQkFBaUIsT0FBUTVCLEdBQ25DaEQsRUFBVTRFLGlCQUFpQixVQUFXbEIsR0FDdEMxRCxFQUFVNEUsaUJBQWlCLFFBQVNuQixHQUNwQ3pELEVBQVU0RSxpQkFBaUIsUUFBU3RCLEdBRXBDckQsRUFBZ0JPLHNCQUF3QnlELFdBQVcsV0FDL0N0QixLQUNELElBQU9wQixFQUFnQkMsV0FBVytDLG1CQUFtQkUsNkJBR3BEbEQsRUFBZ0JHLGtCQUNoQndDLElBR1YsTUFBTzdHLEdBQ0xRLEVBQU9SLE1BQU0sd0NBQXlDQSxHQUN0RDZHLE9BdURSeEgsS0FBS21JLEtBcENRLFNBQVNDLEdBQ2xCOUssRUFBTUksV0FBV0osRUFBTXNGLFdBQVd3RixHQUFrQixzQ0FDWixPQUFwQ2xFLEVBQVVHLHVCQUlkSCxFQUFVRyxzQkFBd0IrRCxFQUVsQ3pDLEtBTEl4RSxFQUFPVCxLQUFLLCtDQWtDcEJWLEtBQUtxSSxjQTFDaUIsU0FBU0MsR0FDM0JoTCxFQUFNSSxXQUFXSixFQUFNc0YsV0FBVzBGLEdBQUsseUJBQ3ZDcEUsRUFBVUMsWUFBWWtELElBQUlpQixJQXlDOUJ0SSxLQUFLdUksaUJBckRvQixTQUFTRCxHQUM5QmhMLEVBQU1JLFdBQVdKLEVBQU1zRixXQUFXMEYsR0FBSyx5QkFDdkNwRSxFQUFVUyxlQUFlMEMsSUFBSWlCLElBb0RqQ3RJLEtBQUt3SSxpQkFqRG9CLFNBQVNGLEdBQzlCaEwsRUFBTUksV0FBV0osRUFBTXNGLFdBQVcwRixHQUFLLHlCQUN2Q3BFLEVBQVVVLGVBQWV5QyxJQUFJaUIsSUFnRGpDdEksS0FBS3lJLHFCQTdCd0IsU0FBU0gsR0FDbENoTCxFQUFNSSxXQUFXSixFQUFNc0YsV0FBVzBGLEdBQUsseUJBQ3ZDcEUsRUFBVUksbUJBQW1CK0MsSUFBSWlCLElBNEJyQ3RJLEtBQUswSSxzQkF6QnlCLFNBQVNKLEdBQ25DaEwsRUFBTUksV0FBV0osRUFBTXNGLFdBQVcwRixHQUFLLHlCQUN2Q3BFLEVBQVVLLG9CQUFvQjhDLElBQUlpQixJQXdCdEN0SSxLQUFLMkksVUFyQmEsU0FBU3ZCLEVBQVdrQixHQUNsQ2hMLEVBQU1zTCxjQUFjeEIsRUFBVyxhQUMvQjlKLEVBQU1JLFdBQVdKLEVBQU1zRixXQUFXMEYsR0FBSyx5QkFDbkNwRSxFQUFVTSxNQUFNOEMsSUFBSUYsR0FDcEJsRCxFQUFVTSxNQUFNckksSUFBSWlMLEdBQVd5QixLQUFLUCxHQUVwQ3BFLEVBQVVNLE1BQU1zRSxJQUFJMUIsRUFBVyxJQUFJaEQsSUFBSSxDQUFDa0UsTUFnQmhEdEksS0FBSytJLGFBWmdCLFNBQVVULEdBQzNCaEwsRUFBTUksV0FBV0osRUFBTXNGLFdBQVcwRixHQUFLLHlCQUN2Q3BFLEVBQVVRLFdBQVcyQyxJQUFJaUIsSUFXN0J0SSxLQUFLZ0osZ0JBbEptQixTQUFTeEMsR0FDN0JsSixFQUFNc0wsY0FBY3BDLEVBQVEsVUFDNUJsSixFQUFNMkwsYUFBYXpDLEdBRW5CQSxFQUFPcEksUUFBUSxTQUFVb0csR0FDckJTLEVBQWtCRSxRQUFRa0MsSUFBSTdDLEtBRzlCbEIsR0FBYUEsRUFBVW9DLGFBQWUrQixVQUFVeUIsTUFDaEQ1RixFQUFVNEMsS0FBS0MsRUFBdUI3RyxFQUFxQixDQUFDa0gsT0FBVUEsTUEwSTlFeEcsS0FBS21KLFlBdktlLFNBQVNDLEdBRXpCLEdBREE5TCxFQUFNNkIsZUFBZWlLLEVBQVMsZ0JBQ1J6TCxJQUFsQnlMLEVBQVE1RSxPQUF1QlksRUFBNEJrQyxJQUFJOEIsRUFBUTVFLE9BQ3ZFckQsRUFBT1QsS0FBSyxxQ0FBc0MwSSxPQUR0RCxDQUlBLElBQ0lBLEVBQVVyRyxLQUFLQyxVQUFVb0csR0FDM0IsTUFBT3pJLEdBRUwsWUFEQVEsRUFBT1QsS0FBSywwQkFBMkIwSSxHQUd2QzlGLEdBQWFBLEVBQVVvQyxhQUFlK0IsVUFBVXlCLE1BQ2hEL0gsRUFBT1gsTUFBTSxtQ0FBb0M0SSxHQUNqRDlGLEVBQVU0QyxLQUFLa0QsSUFFZmpJLEVBQU9ULEtBQUssNkRBbUtsQnlDLEVBQXlCLENBQzNCdkcsT0FWZ0MsV0FDaEMsT0FBTyxJQUFJd0csR0FVWGlHLGdCQVBvQixTQUFBbkksR0FDcEIsSUFBTW9JLEVBQWVwSSxFQUFPb0ksYUFDNUJuSCxFQUFXbEMsbUJBQW1CcUosSUFNOUI3SixTQUFVQSxFQUNWRixPQUFRQSxvQkNqWlosSUFBQWdLLEdBRUEsV0FDQSxhQUVBLElBQUFDLEVBQUEsQ0FDQUMsV0FBQSxPQUNBQyxTQUFBLE9BQ0FDLFNBQUEsT0FDQUMsY0FBQSxPQUNBQyxPQUFBLFVBQ0FDLFlBQUEsZUFDQUMsS0FBQSxNQUNBQyxTQUFBLE9BQ0FDLEtBQUEsWUFDQUMsT0FBQSxXQUNBQyxZQUFBLDJGQUNBdE4sSUFBQSxzQkFDQXVOLFdBQUEsd0JBQ0FDLGFBQUEsYUFDQUMsS0FBQSxTQUdBLFNBQUF6TSxFQUFBaEIsR0FFQSxPQU9BLFNBQUEwTixFQUFBQyxHQUNBLElBQUE5SCxFQUFBcEgsRUFBQW1QLEVBQUFDLEVBQUFDLEVBQUFDLEVBQUFDLEVBQUFDLEVBQUFSLEVBQUFTLEVBQUEsRUFBQUMsRUFBQVQsRUFBQXRNLE9BQUFnTixFQUFBLEdBQ0EsSUFBQTNQLEVBQUEsRUFBbUJBLEVBQUEwUCxFQUFpQjFQLElBQ3BDLG9CQUFBaVAsRUFBQWpQLEdBQ0EyUCxHQUFBVixFQUFBalAsUUFFQSxvQkFBQWlQLEVBQUFqUCxHQUFBLENBRUEsSUFEQW9QLEVBQUFILEVBQUFqUCxJQUNBNFAsS0FFQSxJQURBeEksRUFBQThILEVBQUFPLEdBQ0FOLEVBQUEsRUFBK0JBLEVBQUFDLEVBQUFRLEtBQUFqTixPQUFvQndNLElBQUEsQ0FDbkQsR0FBQTlNLE1BQUErRSxFQUNBLFVBQUFqRixNQUFBSSxFQUFBLGdFQUFBNk0sRUFBQVEsS0FBQVQsR0FBQUMsRUFBQVEsS0FBQVQsRUFBQSxLQUVBL0gsSUFBQWdJLEVBQUFRLEtBQUFULFNBSUEvSCxFQURBZ0ksRUFBQVMsU0FDQVgsRUFBQUUsRUFBQVMsVUFHQVgsRUFBQU8sS0FPQSxHQUpBdkIsRUFBQUcsU0FBQXpLLEtBQUF3TCxFQUFBVSxPQUFBNUIsRUFBQUksY0FBQTFLLEtBQUF3TCxFQUFBVSxPQUFBMUksYUFBQTJJLFdBQ0EzSSxPQUdBOEcsRUFBQU0sWUFBQTVLLEtBQUF3TCxFQUFBVSxPQUFBLGlCQUFBMUksR0FBQTRJLE1BQUE1SSxHQUNBLFVBQUE2SSxVQUFBMU4sRUFBQSwwQ0FBQTZFLElBT0EsT0FKQThHLEVBQUFLLE9BQUEzSyxLQUFBd0wsRUFBQVUsUUFDQU4sRUFBQXBJLEdBQUEsR0FHQWdJLEVBQUFVLE1BQ0EsUUFDQTFJLEVBQUE4SSxTQUFBOUksRUFBQSxJQUFBRyxTQUFBLEdBQ0EsTUFDQSxRQUNBSCxFQUFBK0ksT0FBQUMsYUFBQUYsU0FBQTlJLEVBQUEsS0FDQSxNQUNBLFFBQ0EsUUFDQUEsRUFBQThJLFNBQUE5SSxFQUFBLElBQ0EsTUFDQSxRQUNBQSxFQUFBSyxLQUFBQyxVQUFBTixFQUFBLEtBQUFnSSxFQUFBaUIsTUFBQUgsU0FBQWQsRUFBQWlCLE9BQUEsR0FDQSxNQUNBLFFBQ0FqSixFQUFBZ0ksRUFBQWtCLFVBQUFDLFdBQUFuSixHQUFBb0osY0FBQXBCLEVBQUFrQixXQUFBQyxXQUFBbkosR0FBQW9KLGdCQUNBLE1BQ0EsUUFDQXBKLEVBQUFnSSxFQUFBa0IsVUFBQUMsV0FBQW5KLEdBQUFxSixRQUFBckIsRUFBQWtCLFdBQUFDLFdBQUFuSixHQUNBLE1BQ0EsUUFDQUEsRUFBQWdJLEVBQUFrQixVQUFBSCxPQUFBTyxPQUFBdEosRUFBQXVKLFlBQUF2QixFQUFBa0IsYUFBQUMsV0FBQW5KLEdBQ0EsTUFDQSxRQUNBQSxHQUFBOEksU0FBQTlJLEVBQUEsU0FBQUcsU0FBQSxHQUNBLE1BQ0EsUUFDQUgsRUFBQStJLE9BQUEvSSxHQUNBQSxFQUFBZ0ksRUFBQWtCLFVBQUFsSixFQUFBd0osVUFBQSxFQUFBeEIsRUFBQWtCLFdBQUFsSixFQUNBLE1BQ0EsUUFDQUEsRUFBQStJLFNBQUEvSSxHQUNBQSxFQUFBZ0ksRUFBQWtCLFVBQUFsSixFQUFBd0osVUFBQSxFQUFBeEIsRUFBQWtCLFdBQUFsSixFQUNBLE1BQ0EsUUFDQUEsRUFBQTFHLE9BQUFrQixVQUFBMkYsU0FBQXBILEtBQUFpSCxHQUFBeUosTUFBQSxNQUFBQyxjQUNBMUosRUFBQWdJLEVBQUFrQixVQUFBbEosRUFBQXdKLFVBQUEsRUFBQXhCLEVBQUFrQixXQUFBbEosRUFDQSxNQUNBLFFBQ0FBLEVBQUE4SSxTQUFBOUksRUFBQSxRQUNBLE1BQ0EsUUFDQUEsSUFBQTJKLFVBQ0EzSixFQUFBZ0ksRUFBQWtCLFVBQUFsSixFQUFBd0osVUFBQSxFQUFBeEIsRUFBQWtCLFdBQUFsSixFQUNBLE1BQ0EsUUFDQUEsR0FBQThJLFNBQUE5SSxFQUFBLFNBQUFHLFNBQUEsSUFDQSxNQUNBLFFBQ0FILEdBQUE4SSxTQUFBOUksRUFBQSxTQUFBRyxTQUFBLElBQUFyRSxjQUdBZ0wsRUFBQU8sS0FBQTdLLEtBQUF3TCxFQUFBVSxNQUNBSCxHQUFBdkksSUFHQThHLEVBQUFLLE9BQUEzSyxLQUFBd0wsRUFBQVUsT0FBQU4sSUFBQUosRUFBQUosS0FLQUEsRUFBQSxJQUpBQSxFQUFBUSxFQUFBLFFBQ0FwSSxJQUFBRyxXQUFBeEUsUUFBQW1MLEVBQUFjLEtBQUEsS0FLQU0sRUFBQUYsRUFBQTRCLFNBQUEsTUFBQTVCLEVBQUE0QixTQUFBLElBQUE1QixFQUFBNEIsU0FBQUMsT0FBQSxPQUNBMUIsRUFBQUgsRUFBQWlCLE9BQUFyQixFQUFBNUgsR0FBQXpFLE9BQ0EwTSxFQUFBRCxFQUFBaUIsT0FBQWQsRUFBQSxFQUFBRCxFQUFBNEIsT0FBQTNCLEdBQUEsR0FDQUksR0FBQVAsRUFBQStCLE1BQUFuQyxFQUFBNUgsRUFBQWlJLEVBQUEsTUFBQUMsRUFBQU4sRUFBQUssRUFBQWpJLEVBQUFpSSxFQUFBTCxFQUFBNUgsR0FJQSxPQUFBdUksRUFqSEF5QixDQXNIQSxTQUFBQyxHQUNBLEdBQUFDLEVBQUFELEdBQ0EsT0FBQUMsRUFBQUQsR0FHQSxJQUFBRSxFQUFBQyxFQUFBSCxFQUFBcEMsRUFBQSxHQUFBd0MsRUFBQSxFQUNBLEtBQUFELEdBQUEsQ0FDQSxXQUFBRCxFQUFBckQsRUFBQVMsS0FBQStDLEtBQUFGLElBQ0F2QyxFQUFBMUIsS0FBQWdFLEVBQUEsU0FFQSxXQUFBQSxFQUFBckQsRUFBQVUsT0FBQThDLEtBQUFGLElBQ0F2QyxFQUFBMUIsS0FBQSxTQUVBLFlBQUFnRSxFQUFBckQsRUFBQVcsWUFBQTZDLEtBQUFGLElBNkNBLFVBQUFHLFlBQUEsb0NBNUNBLEdBQUFKLEVBQUEsSUFDQUUsR0FBQSxFQUNBLElBQUFHLEVBQUEsR0FBQUMsRUFBQU4sRUFBQSxHQUFBTyxFQUFBLEdBQ0EsV0FBQUEsRUFBQTVELEVBQUEzTSxJQUFBbVEsS0FBQUcsSUFlQSxVQUFBRixZQUFBLGdEQWJBLElBREFDLEVBQUFyRSxLQUFBdUUsRUFBQSxJQUNBLE1BQUFELElBQUFqQixVQUFBa0IsRUFBQSxHQUFBblAsVUFDQSxXQUFBbVAsRUFBQTVELEVBQUFZLFdBQUE0QyxLQUFBRyxJQUNBRCxFQUFBckUsS0FBQXVFLEVBQUEsUUFFQSxZQUFBQSxFQUFBNUQsRUFBQWEsYUFBQTJDLEtBQUFHLElBSUEsVUFBQUYsWUFBQSxnREFIQUMsRUFBQXJFLEtBQUF1RSxFQUFBLElBVUFQLEVBQUEsR0FBQUssT0FHQUgsR0FBQSxFQUVBLE9BQUFBLEVBQ0EsVUFBQXRQLE1BQUEsNkVBR0E4TSxFQUFBMUIsS0FDQSxDQUNBc0IsWUFBQTBDLEVBQUEsR0FDQTFCLFNBQUEwQixFQUFBLEdBQ0EzQixLQUFBMkIsRUFBQSxHQUNBdkMsS0FBQXVDLEVBQUEsR0FDQVAsU0FBQU8sRUFBQSxHQUNBSixNQUFBSSxFQUFBLEdBQ0FsQixNQUFBa0IsRUFBQSxHQUNBakIsVUFBQWlCLEVBQUEsR0FDQXpCLEtBQUF5QixFQUFBLEtBT0FDLElBQUFaLFVBQUFXLEVBQUEsR0FBQTVPLFFBRUEsT0FBQTJPLEVBQUFELEdBQUFwQyxFQXBMQThDLENBQUF4USxHQUFBNEUsV0FHQSxTQUFBNkwsRUFBQVgsRUFBQW5DLEdBQ0EsT0FBQTNNLEVBQUFjLE1BQUEsTUFBQWdPLEdBQUFqRyxPQUFBOEQsR0FBQSxLQWdIQSxJQUFBb0MsRUFBQTVRLE9BQUFZLE9BQUEsTUF3RUF4QixFQUFBLFFBQUF5QyxFQUNBekMsRUFBQSxTQUFBa1MsRUFFQSxvQkFBQUMsU0FDQUEsT0FBQSxRQUFBMVAsRUFDQTBQLE9BQUEsU0FBQUQsT0FRYTNQLEtBTEQ0TCxFQUFBLFdBQ1osT0FDQTFMLFVBQ0F5UCxhQUVhN1IsS0FBQUwsRUFBQUYsRUFBQUUsRUFBQUMsUUFBQUQsUUFBQW1PLElBaE9iLGlDQ0ZBck8sRUFBQWtCLEVBQUE4RyxHQUFBLFNBQUFzSyxHQUFBdFMsRUFBQVUsRUFBQXNILEVBQUEscUNBQUFFLElBQUEsSUFBQXFLLEVBQUF2UyxFQUFBLEdBR0FzUyxFQUFPRSxRQUFVRixFQUFPRSxTQUFXLEdBQ25DQSxRQUFRdEssaUJBQW1CRCxJQUVwQixJQUFNQyxFQUFtQkQsb0NDTmhDLElBQUF3SyxFQUdBQSxFQUFBLFdBQ0EsT0FBQTNOLEtBREEsR0FJQSxJQUVBMk4sS0FBQSxJQUFBdEMsU0FBQSxpQkFDQyxNQUFBdUMsR0FFRCxpQkFBQUwsU0FBQUksRUFBQUosUUFPQWxTLEVBQUFELFFBQUF1UyIsImZpbGUiOiJhbWF6b24tY29ubmVjdC13ZWJzb2NrZXQtbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSAyKTtcbiIsImltcG9ydCB7IHNwcmludGYgfSBmcm9tIFwic3ByaW50Zi1qc1wiO1xuY29uc3QgVXRpbHMgPSB7fTtcblxuLyoqXG4gKiBBc3NlcnRzIHRoYXQgYSBwcmVtaXNlIGlzIHRydWUuXG4gKi9cblV0aWxzLmFzc2VydFRydWUgPSBmdW5jdGlvbihwcmVtaXNlLCBtZXNzYWdlKSB7XG4gIGlmICghcHJlbWlzZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBBc3NlcnRzIHRoYXQgYSB2YWx1ZSBpcyBub3QgbnVsbCBvciB1bmRlZmluZWQuXG4gKi9cblV0aWxzLmFzc2VydE5vdE51bGwgPSBmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICBVdGlscy5hc3NlcnRUcnVlKFxuICAgIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSAhPT0gdW5kZWZpbmVkLFxuICAgIHNwcmludGYoXCIlcyBtdXN0IGJlIHByb3ZpZGVkXCIsIG5hbWUgfHwgXCJBIHZhbHVlXCIpXG4gICk7XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cblV0aWxzLmlzU3RyaW5nID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIjtcbn07XG5cblV0aWxzLmFzc2VydElzTm9uRW1wdHlTdHJpbmcgPSBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGtleSArIFwiIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmchXCIpO1xuICB9XG59O1xuXG5VdGlscy5hc3NlcnRJc0xpc3QgPSBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3Ioa2V5ICsgXCIgaXMgbm90IGFuIGFycmF5XCIpO1xuICB9XG59O1xuXG5VdGlscy5hc3NlcnRJc0VudW0gPSBmdW5jdGlvbih2YWx1ZSwgYWxsb3dlZFZhbHVlcywga2V5KSB7XG4gIHZhciBpO1xuICBmb3IgKGkgPSAwOyBpIDwgYWxsb3dlZFZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChhbGxvd2VkVmFsdWVzW2ldID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAga2V5ICsgXCIgcGFzc2VkIGlzIG5vdCB2YWxpZC4gXCIgKyBcIkFsbG93ZWQgdmFsdWVzIGFyZTogXCIgKyBhbGxvd2VkVmFsdWVzXG4gICk7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIGFuIGVudW0gZnJvbSB0aGUgZ2l2ZW4gbGlzdCBvZiBsb3dlci1jYXNlIGVudW0gdmFsdWVzLFxuICogd2hlcmUgdGhlIGVudW0ga2V5cyB3aWxsIGJlIHVwcGVyIGNhc2UuXG4gKlxuICogQ29udmVyc2lvbiBmcm9tIHBhc2NhbCBjYXNlIGJhc2VkIG9uIGNvZGUgZnJvbSBoZXJlOlxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zMDUyMTIyNFxuICovXG5VdGlscy5tYWtlRW51bSA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICB2YXIgZW51bU9iaiA9IHt9O1xuXG4gIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIGtleSA9IHZhbHVlXG4gICAgICAucmVwbGFjZSgvXFwuPyhbYS16XSspXz8vZywgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4geS50b1VwcGVyQ2FzZSgpICsgXCJfXCI7XG4gICAgICB9KVxuICAgICAgLnJlcGxhY2UoL18kLywgXCJcIik7XG5cbiAgICBlbnVtT2JqW2tleV0gPSB2YWx1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGVudW1PYmo7XG59O1xuXG4vKipcbiAqIERldGVybWluZSBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBjYWxsYWJsZSBmdW5jdGlvbiB0eXBlLlxuICogQm9ycm93ZWQgZnJvbSBVbmRlcnNjb3JlLmpzLlxuICovXG5VdGlscy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiAhIShvYmogJiYgb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jYWxsICYmIG9iai5hcHBseSk7XG59O1xuXG5VdGlscy5pc09iamVjdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiAhKHR5cGVvZiB2YWx1ZSAhPT0gXCJvYmplY3RcIiB8fCB2YWx1ZSA9PT0gbnVsbCk7XG59O1xuXG5VdGlscy5pc1N0cmluZyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCI7XG59O1xuXG5VdGlscy5pc051bWJlciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCI7XG59O1xuXG5jb25zdCB3c1JlZ2V4ID0gbmV3IFJlZ0V4cChcIl4od3NzOi8vKVxcXFx3KlwiKTtcblV0aWxzLnZhbGlkV1NVcmwgPSBmdW5jdGlvbiAod3NVcmwpIHtcbiAgcmV0dXJuIHdzUmVnZXgudGVzdCh3c1VybCk7XG59O1xuXG5VdGlscy5hc3NlcnRJc09iamVjdCA9IGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgaWYgKCFVdGlscy5pc09iamVjdCh2YWx1ZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3Ioa2V5ICsgXCIgaXMgbm90IGFuIG9iamVjdCFcIik7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFV0aWxzO1xuXG4iLCJcbmV4cG9ydCBjb25zdCBMT0dTX0RFU1RJTkFUSU9OID0ge1xuICBOVUxMOiBcIk5VTExcIixcbiAgQ0xJRU5UX0xPR0dFUjogXCJDTElFTlRfTE9HR0VSXCIsXG4gIERFQlVHOiBcIkRFQlVHXCJcbn07XG5cbmV4cG9ydCBjb25zdCBNQVhfTElORUFSX0NPTk5FQ1RfQVRURU1QVFMgPSAzO1xuZXhwb3J0IGNvbnN0IE1BWF9FWFBPTkVOVElBTF9DT05ORUNUX0FUVEVNUFRTID0gNTtcbmV4cG9ydCBjb25zdCBIRUFSVEJFQVRfSU5URVJWQUwgPSAxMDsgLy9zZWNvbmRzXG5cbmV4cG9ydCBjb25zdCBST1VURV9LRVkgPSB7XG4gIFNVQlNDUklCRTogXCJhd3Mvc3Vic2NyaWJlXCIsXG4gIFVOU1VCU0NSSUJFOiBcImF3cy91bnN1YnNjcmliZVwiLFxuICBIRUFSVEJFQVQ6IFwiYXdzL2hlYXJ0YmVhdFwiXG59O1xuIiwiaW1wb3J0IFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgeyBMT0dTX0RFU1RJTkFUSU9OIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5cbi8qZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMqL1xuY2xhc3MgTG9nZ2VyIHtcbiAgZGVidWcoZGF0YSkge31cblxuICBpbmZvKGRhdGEpIHt9XG5cbiAgd2FybihkYXRhKSB7fVxuXG4gIGVycm9yKGRhdGEpIHt9XG59XG4vKmVzbGludC1lbmFibGUgbm8tdW51c2VkLXZhcnMqL1xuXG5jb25zdCBMb2dMZXZlbCA9IHtcbiAgREVCVUc6IDEwLFxuICBJTkZPOiAyMCxcbiAgV0FSTjogMzAsXG4gIEVSUk9SOiA0MFxufTtcblxuY2xhc3MgTG9nTWFuYWdlckltcGwge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnVwZGF0ZUxvZ2dlckNvbmZpZygpO1xuICAgIHRoaXMuY29uc29sZUxvZ2dlcldyYXBwZXIgPSBjcmVhdGVDb25zb2xlTG9nZ2VyKCk7XG4gIH1cblxuICB3cml0ZVRvQ2xpZW50TG9nZ2VyKGxldmVsLCBsb2dTdGF0ZW1lbnQpIHtcbiAgICBpZiAoIXRoaXMuaGFzQ2xpZW50TG9nZ2VyKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3dpdGNoIChsZXZlbCkge1xuICAgICAgY2FzZSBMb2dMZXZlbC5ERUJVRzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NsaWVudExvZ2dlci5kZWJ1Zyhsb2dTdGF0ZW1lbnQpO1xuICAgICAgY2FzZSBMb2dMZXZlbC5JTkZPOlxuICAgICAgICByZXR1cm4gdGhpcy5fY2xpZW50TG9nZ2VyLmluZm8obG9nU3RhdGVtZW50KTtcbiAgICAgIGNhc2UgTG9nTGV2ZWwuV0FSTjpcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NsaWVudExvZ2dlci53YXJuKGxvZ1N0YXRlbWVudCk7XG4gICAgICBjYXNlIExvZ0xldmVsLkVSUk9SOlxuICAgICAgICByZXR1cm4gdGhpcy5fY2xpZW50TG9nZ2VyLmVycm9yKGxvZ1N0YXRlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgaXNMZXZlbEVuYWJsZWQobGV2ZWwpIHtcbiAgICByZXR1cm4gbGV2ZWwgPj0gdGhpcy5fbGV2ZWw7XG4gIH1cblxuICBoYXNDbGllbnRMb2dnZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NsaWVudExvZ2dlciAhPT0gbnVsbDtcbiAgfVxuXG4gIGdldExvZ2dlcihvcHRpb25zKSB7XG4gICAgdmFyIHByZWZpeCA9IG9wdGlvbnMucHJlZml4IHx8IFwiXCI7XG4gICAgaWYgKHRoaXMuX2xvZ3NEZXN0aW5hdGlvbiA9PT0gTE9HU19ERVNUSU5BVElPTi5ERUJVRykge1xuICAgICAgcmV0dXJuIHRoaXMuY29uc29sZUxvZ2dlcldyYXBwZXI7XG4gICAgfVxuICAgIHJldHVybiBuZXcgTG9nZ2VyV3JhcHBlckltcGwocHJlZml4KTtcbiAgfVxuXG4gIHVwZGF0ZUxvZ2dlckNvbmZpZyhpbnB1dENvbmZpZykge1xuICAgIHZhciBjb25maWcgPSBpbnB1dENvbmZpZyB8fCB7fTtcbiAgICB0aGlzLl9sZXZlbCA9IGNvbmZpZy5sZXZlbCB8fCBMb2dMZXZlbC5JTkZPO1xuICAgIHRoaXMuX2NsaWVudExvZ2dlciA9IGNvbmZpZy5sb2dnZXIgfHwgbnVsbDtcbiAgICB0aGlzLl9sb2dzRGVzdGluYXRpb24gPSBMT0dTX0RFU1RJTkFUSU9OLk5VTEw7XG4gICAgaWYgKGNvbmZpZy5kZWJ1Zykge1xuICAgICAgdGhpcy5fbG9nc0Rlc3RpbmF0aW9uID0gTE9HU19ERVNUSU5BVElPTi5ERUJVRztcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5sb2dnZXIpIHtcbiAgICAgIHRoaXMuX2xvZ3NEZXN0aW5hdGlvbiA9IExPR1NfREVTVElOQVRJT04uQ0xJRU5UX0xPR0dFUjtcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgTG9nZ2VyV3JhcHBlciB7XG4gIGRlYnVnKCkge31cblxuICBpbmZvKCkge31cblxuICB3YXJuKCkge31cblxuICBlcnJvcigpIHt9XG59XG5cbmNsYXNzIExvZ2dlcldyYXBwZXJJbXBsIGV4dGVuZHMgTG9nZ2VyV3JhcHBlciB7XG4gIGNvbnN0cnVjdG9yKHByZWZpeCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXggfHwgXCJcIjtcbiAgfVxuXG4gIGRlYnVnKC4uLmFyZ3MpIHtcbiAgICB0aGlzLl9sb2coTG9nTGV2ZWwuREVCVUcsIGFyZ3MpO1xuICB9XG5cbiAgaW5mbyguLi5hcmdzKSB7XG4gICAgdGhpcy5fbG9nKExvZ0xldmVsLklORk8sIGFyZ3MpO1xuICB9XG5cbiAgd2FybiguLi5hcmdzKSB7XG4gICAgdGhpcy5fbG9nKExvZ0xldmVsLldBUk4sIGFyZ3MpO1xuICB9XG5cbiAgZXJyb3IoLi4uYXJncykge1xuICAgIHRoaXMuX2xvZyhMb2dMZXZlbC5FUlJPUiwgYXJncyk7XG4gIH1cblxuICBfc2hvdWxkTG9nKGxldmVsKSB7XG4gICAgcmV0dXJuIExvZ01hbmFnZXIuaGFzQ2xpZW50TG9nZ2VyKCkgJiYgTG9nTWFuYWdlci5pc0xldmVsRW5hYmxlZChsZXZlbCk7XG4gIH1cblxuICBfd3JpdGVUb0NsaWVudExvZ2dlcihsZXZlbCwgbG9nU3RhdGVtZW50KSB7XG4gICAgTG9nTWFuYWdlci53cml0ZVRvQ2xpZW50TG9nZ2VyKGxldmVsLCBsb2dTdGF0ZW1lbnQpO1xuICB9XG5cbiAgX2xvZyhsZXZlbCwgYXJncykge1xuICAgIGlmICh0aGlzLl9zaG91bGRMb2cobGV2ZWwpKSB7XG4gICAgICB2YXIgbG9nU3RhdGVtZW50ID0gdGhpcy5fY29udmVydFRvU2luZ2xlU3RhdGVtZW50KGFyZ3MpO1xuICAgICAgdGhpcy5fd3JpdGVUb0NsaWVudExvZ2dlcihsZXZlbCwgbG9nU3RhdGVtZW50KTtcbiAgICB9XG4gIH1cblxuICBfY29udmVydFRvU2luZ2xlU3RhdGVtZW50KGFyZ3MpIHtcbiAgICB2YXIgbG9nU3RhdGVtZW50ID0gXCJcIjtcbiAgICBpZiAodGhpcy5wcmVmaXgpIHtcbiAgICAgIGxvZ1N0YXRlbWVudCArPSB0aGlzLnByZWZpeCArIFwiIFwiO1xuICAgIH1cbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgYXJncy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBhcmcgPSBhcmdzW2luZGV4XTtcbiAgICAgIGxvZ1N0YXRlbWVudCArPSB0aGlzLl9jb252ZXJ0VG9TdHJpbmcoYXJnKSArIFwiIFwiO1xuICAgIH1cbiAgICByZXR1cm4gbG9nU3RhdGVtZW50O1xuICB9XG5cbiAgX2NvbnZlcnRUb1N0cmluZyhhcmcpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFhcmcpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9XG4gICAgICBpZiAoVXRpbHMuaXNTdHJpbmcoYXJnKSkge1xuICAgICAgICByZXR1cm4gYXJnO1xuICAgICAgfVxuICAgICAgaWYgKFV0aWxzLmlzT2JqZWN0KGFyZykgJiYgVXRpbHMuaXNGdW5jdGlvbihhcmcudG9TdHJpbmcpKSB7XG4gICAgICAgIHZhciB0b1N0cmluZ1Jlc3VsdCA9IGFyZy50b1N0cmluZygpO1xuICAgICAgICBpZiAodG9TdHJpbmdSZXN1bHQgIT09IFwiW29iamVjdCBPYmplY3RdXCIpIHtcbiAgICAgICAgICByZXR1cm4gdG9TdHJpbmdSZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmcpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igd2hpbGUgY29udmVydGluZyBhcmd1bWVudCB0byBzdHJpbmdcIiwgYXJnLCBlcnJvcik7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gIH1cbn1cblxudmFyIGNyZWF0ZUNvbnNvbGVMb2dnZXIgPSAoKSA9PiB7XG4gIHZhciBsb2dnZXIgPSBuZXcgTG9nZ2VyV3JhcHBlcigpO1xuICBsb2dnZXIuZGVidWcgPSBjb25zb2xlLmRlYnVnO1xuICBsb2dnZXIuaW5mbyA9IGNvbnNvbGUuaW5mbztcbiAgbG9nZ2VyLndhcm4gPSBjb25zb2xlLndhcm47XG4gIGxvZ2dlci5lcnJvciA9IGNvbnNvbGUuZXJyb3I7XG4gIHJldHVybiBsb2dnZXI7XG59O1xuXG5jb25zdCBMb2dNYW5hZ2VyID0gbmV3IExvZ01hbmFnZXJJbXBsKCk7XG5cbmV4cG9ydCB7IExvZ01hbmFnZXIsIExvZ2dlciwgTG9nTGV2ZWwgfTtcbiIsImltcG9ydCBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgTG9nTWFuYWdlciwgTG9nTGV2ZWwsIExvZ2dlciB9IGZyb20gXCIuL2xvZ1wiO1xuaW1wb3J0IHtcbiAgICBNQVhfTElORUFSX0NPTk5FQ1RfQVRURU1QVFMsXG4gICAgTUFYX0VYUE9ORU5USUFMX0NPTk5FQ1RfQVRURU1QVFMsXG4gICAgSEVBUlRCRUFUX0lOVEVSVkFMLFxuICAgIFJPVVRFX0tFWVxufSBmcm9tIFwiLi9jb25zdGFudHNcIjtcblxuXG5jb25zdCBXZWJTb2NrZXRNYW5hZ2VyID0gZnVuY3Rpb24oKSB7XG5cbiAgICBjb25zdCBsb2dnZXIgPSBMb2dNYW5hZ2VyLmdldExvZ2dlcih7fSk7XG5cbiAgICBsZXQgd2ViU29ja2V0ID0gbnVsbDtcblxuICAgIGxldCByZWNvbm5lY3RDb25maWcgPSB7XG4gICAgICAgIHJlY29ubmVjdFdlYlNvY2tldDogZmFsc2UsXG4gICAgICAgIHdlYnNvY2tldEluaXRGYWlsZWQ6IGZhbHNlLFxuICAgICAgICBsaW5lYXJDb25uZWN0QXR0ZW1wdDogMCxcbiAgICAgICAgZXhwb25lbnRpYWxDb25uZWN0QXR0ZW1wdDogMCxcbiAgICAgICAgZXhwb25lbnRpYWxCYWNrT2ZmVGltZTogMSxcbiAgICAgICAgZXhwb25lbnRpYWxUaW1lb3V0SGFuZGxlOiBudWxsLFxuICAgICAgICBsaWZlVGltZVRpbWVvdXRIYW5kbGU6IG51bGxcbiAgICB9O1xuXG4gICAgbGV0IGhlYXJ0YmVhdENvbmZpZyA9IHtcbiAgICAgICAgcGVuZGluZ1Jlc3BvbnNlOiBmYWxzZSxcbiAgICAgICAgaW50ZXJ2YWxIYW5kbGU6IG51bGxcbiAgICB9O1xuXG4gICAgbGV0IGNhbGxiYWNrcyA9IHtcbiAgICAgICAgaW5pdEZhaWx1cmU6IG5ldyBTZXQoKSxcbiAgICAgICAgZ2V0V2ViU29ja2V0VHJhbnNwb3J0OiBudWxsLFxuICAgICAgICBzdWJzY3JpcHRpb25VcGRhdGU6IG5ldyBTZXQoKSxcbiAgICAgICAgc3Vic2NyaXB0aW9uRmFpbHVyZTogbmV3IFNldCgpLFxuICAgICAgICB0b3BpYzogbmV3IE1hcCgpLFxuICAgICAgICBhbGxNZXNzYWdlOiBuZXcgU2V0KCksXG4gICAgICAgIGNvbm5lY3Rpb25HYWluOiBuZXcgU2V0KCksXG4gICAgICAgIGNvbm5lY3Rpb25Mb3N0OiBuZXcgU2V0KClcbiAgICB9O1xuXG4gICAgbGV0IHdlYlNvY2tldENvbmZpZyA9IHtcbiAgICAgICAgY29ubkNvbmZpZzogbnVsbCxcbiAgICAgICAgcHJvbWlzZUhhbmRsZTogbnVsbCxcbiAgICAgICAgcHJvbWlzZUNvbXBsZXRlZDogZmFsc2VcbiAgICB9O1xuXG4gICAgbGV0IHRvcGljU3Vic2NyaXB0aW9uID0ge1xuICAgICAgICBzdWJzY3JpYmVkOiBuZXcgU2V0KCksXG4gICAgICAgIHBlbmRpbmc6IG5ldyBTZXQoKVxuICAgIH07XG5cbiAgICBjb25zdCBpbnZhbGlkU2VuZE1lc3NhZ2VSb3V0ZUtleXMgPSBuZXcgU2V0KFtST1VURV9LRVkuU1VCU0NSSUJFLCBST1VURV9LRVkuVU5TVUJTQ1JJQkUsIFJPVVRFX0tFWS5IRUFSVEJFQVRdKTtcblxuICAgIGxldCBvbmxpbmUgPSBuYXZpZ2F0b3Iub25MaW5lO1xuICAgIGNvbnN0IG5ldHdvcmtDb25uZWN0aXZpdHlDaGVja2VyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAob25saW5lICE9PSBuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgICAgICBvbmxpbmUgPSBuYXZpZ2F0b3Iub25MaW5lO1xuICAgICAgICAgICAgaWYgKG9ubGluZSAmJiAoIXdlYlNvY2tldCB8fCB3ZWJTb2NrZXQucmVhZHlTdGF0ZSA+IDEpKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oXCJOZXR3b3JrIG9ubGluZSwgQ29ubmVjdGluZyB0byB3ZWJzb2NrZXRcIik7XG4gICAgICAgICAgICAgICAgZ2V0V2ViU29ja2V0Q29ubkNvbmZpZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwgMjUwKTtcblxuICAgIGNvbnN0IGludm9rZUNhbGxiYWNrcyA9IGZ1bmN0aW9uKGNhbGxiYWNrcywgcmVzcG9uc2UpIHtcbiAgICAgICAgY2FsbGJhY2tzLmZvckVhY2goZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCBzZW5kSGVhcnRCZWF0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChoZWFydGJlYXRDb25maWcucGVuZGluZ1Jlc3BvbnNlKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybihcIkhlYXJ0YmVhdCByZXNwb25zZSBub3QgcmVjZWl2ZWQsIFJlb3BlbmluZyB3ZWIgc29ja2V0IGNvbm5lY3Rpb25cIik7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGhlYXJ0YmVhdENvbmZpZy5pbnRlcnZhbEhhbmRsZSk7XG4gICAgICAgICAgICBoZWFydGJlYXRDb25maWcucGVuZGluZ1Jlc3BvbnNlID0gZmFsc2U7XG4gICAgICAgICAgICByZWZyZXNoV2ViU29ja2V0Q29ubmVjdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxvZ2dlci5kZWJ1ZyhcIlNlbmRpbmcgaGVhcnRiZWF0XCIpO1xuICAgICAgICB3ZWJTb2NrZXQuc2VuZChjcmVhdGVXZWJTb2NrZXRQYXlsb2FkKFJPVVRFX0tFWS5IRUFSVEJFQVQpKTtcbiAgICAgICAgaGVhcnRiZWF0Q29uZmlnLnBlbmRpbmdSZXNwb25zZSA9IHRydWU7XG4gICAgfTtcblxuICAgIGNvbnN0IHJlc2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVjb25uZWN0Q29uZmlnLmxpbmVhckNvbm5lY3RBdHRlbXB0ID0gMDtcbiAgICAgICAgcmVjb25uZWN0Q29uZmlnLmV4cG9uZW50aWFsQ29ubmVjdEF0dGVtcHQgPSAwO1xuICAgICAgICByZWNvbm5lY3RDb25maWcuZXhwb25lbnRpYWxCYWNrT2ZmVGltZSA9IDE7XG4gICAgICAgIGhlYXJ0YmVhdENvbmZpZy5wZW5kaW5nUmVzcG9uc2UgPSBmYWxzZTtcbiAgICAgICAgcmVjb25uZWN0Q29uZmlnLnJlY29ubmVjdFdlYlNvY2tldCA9IGZhbHNlO1xuXG4gICAgICAgIGNsZWFyVGltZW91dChyZWNvbm5lY3RDb25maWcubGlmZVRpbWVUaW1lb3V0SGFuZGxlKTtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChoZWFydGJlYXRDb25maWcuaW50ZXJ2YWxIYW5kbGUpO1xuICAgICAgICBjbGVhclRpbWVvdXQocmVjb25uZWN0Q29uZmlnLmV4cG9uZW50aWFsVGltZW91dEhhbmRsZSk7XG4gICAgfTtcblxuICAgIGNvbnN0IHdlYlNvY2tldE9uT3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oXCJXZWJTb2NrZXQgY29ubmVjdGlvbiBlc3RhYmxpc2hlZCFcIik7XG4gICAgICAgICAgICBpbnZva2VDYWxsYmFja3MoY2FsbGJhY2tzLmNvbm5lY3Rpb25HYWluKTtcblxuICAgICAgICAgICAgcmVzZXRTdGF0ZSgpO1xuXG4gICAgICAgICAgICBpZiAodG9waWNTdWJzY3JpcHRpb24uc3Vic2NyaWJlZC5zaXplID4gMCB8fCB0b3BpY1N1YnNjcmlwdGlvbi5wZW5kaW5nLnNpemUgPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHRvcGljcyA9IEFycmF5LmZyb20odG9waWNTdWJzY3JpcHRpb24uc3Vic2NyaWJlZC52YWx1ZXMoKSk7XG4gICAgICAgICAgICAgICAgdG9waWNzID0gdG9waWNzLmNvbmNhdChBcnJheS5mcm9tKHRvcGljU3Vic2NyaXB0aW9uLnBlbmRpbmcudmFsdWVzKCkpKTtcbiAgICAgICAgICAgICAgICB0b3BpY1N1YnNjcmlwdGlvbi5zdWJzY3JpYmVkLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgd2ViU29ja2V0LnNlbmQoY3JlYXRlV2ViU29ja2V0UGF5bG9hZChST1VURV9LRVkuU1VCU0NSSUJFLCB7XCJ0b3BpY3NcIjogdG9waWNzfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZW5kSGVhcnRCZWF0KCk7XG4gICAgICAgICAgICBoZWFydGJlYXRDb25maWcuaW50ZXJ2YWxIYW5kbGUgPSBzZXRJbnRlcnZhbChzZW5kSGVhcnRCZWF0LCAxMDAwICogSEVBUlRCRUFUX0lOVEVSVkFMKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcihcIkVycm9yIGFmdGVyIGVzdGFibGlzaGluZyB3ZWIgc29ja2V0IGNvbm5lY3Rpb24sIGVycm9yOiBcIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHdlYlNvY2tldE9uQ2xvc2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAocmVjb25uZWN0Q29uZmlnLmxpbmVhckNvbm5lY3RBdHRlbXB0IDw9IDEpIHtcbiAgICAgICAgICAgIGludm9rZUNhbGxiYWNrcyhjYWxsYmFja3MuY29ubmVjdGlvbkxvc3QpO1xuICAgICAgICB9XG4gICAgICAgIGxvZ2dlci5pbmZvKFwiU29ja2V0IGNvbm5lY3Rpb24gaXMgY2xvc2VkLiBldmVudDogXCIsIGV2ZW50KTtcbiAgICAgICAgaWYgKHJlY29ubmVjdENvbmZpZy5yZWNvbm5lY3RXZWJTb2NrZXQpIHtcbiAgICAgICAgICAgIGluaXRXZWJTb2NrZXQoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCB3ZWJTb2NrZXRPbkVycm9yID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKFwiV2ViU29ja2V0TWFuYWdlciBFcnJvciwgZXJyb3JfZXZlbnQ6IFwiLCBldmVudCk7XG4gICAgICAgIHJlZnJlc2hXZWJTb2NrZXRDb25uZWN0aW9uKCk7XG4gICAgfTtcblxuICAgIGNvbnN0IHdlYlNvY2tldE9uTWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGxvZ2dlci5kZWJ1ZyhcIk1lc3NhZ2UgcmVjZWl2ZWQgZnJvbSB3ZWJTb2NrZXQgc2VydmVyXCIsIGV2ZW50LmRhdGEpO1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgICAgIHN3aXRjaCAocmVzcG9uc2UudG9waWMpIHtcbiAgICAgICAgICAgIGNhc2UgUk9VVEVfS0VZLlNVQlNDUklCRTpcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuY29udGVudC5zdGF0dXMgPT09IFwic3VjY2Vzc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLmNvbnRlbnQudG9waWNzLmZvckVhY2goKGZ1bmN0aW9uICh0b3BpY05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcGljU3Vic2NyaXB0aW9uLnN1YnNjcmliZWQuYWRkKHRvcGljTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BpY1N1YnNjcmlwdGlvbi5wZW5kaW5nLmRlbGV0ZSh0b3BpY05hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIGludm9rZUNhbGxiYWNrcyhjYWxsYmFja3Muc3Vic2NyaXB0aW9uVXBkYXRlLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW52b2tlQ2FsbGJhY2tzKGNhbGxiYWNrcy5zdWJzY3JpcHRpb25GYWlsdXJlLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBST1VURV9LRVkuSEVBUlRCRUFUOlxuICAgICAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZyhcIkhlYXJ0YmVhdCByZXNwb25zZSByZWNlaXZlZFwiKTtcbiAgICAgICAgICAgICAgICBoZWFydGJlYXRDb25maWcucGVuZGluZ1Jlc3BvbnNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS50b3BpYykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2tzLmFsbE1lc3NhZ2Uuc2l6ZSA9PT0gMCAmJiBjYWxsYmFja3MudG9waWMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ05vIHJlZ2lzdGVyZWQgY2FsbGJhY2sgbGlzdGVuZXIgZm9yIFRvcGljOiAnLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaW52b2tlQ2FsbGJhY2tzKGNhbGxiYWNrcy5hbGxNZXNzYWdlLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja3MudG9waWMuaGFzKHJlc3BvbnNlLnRvcGljKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW52b2tlQ2FsbGJhY2tzKGNhbGxiYWNrcy50b3BpYy5nZXQocmVzcG9uc2UudG9waWMpLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oXCJXZWJTb2NrZXRNYW5hZ2VyIE1lc3NhZ2UgRXJyb3IsIGVycm9yOiBcIiwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKFwiSW52YWxpZCBpbmNvbWluZyBtZXNzYWdlLCBlcnJvcjogXCIsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgcmVmcmVzaFdlYlNvY2tldENvbm5lY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChyZWNvbm5lY3RDb25maWcubGlmZVRpbWVUaW1lb3V0SGFuZGxlKTtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChoZWFydGJlYXRDb25maWcuaW50ZXJ2YWxIYW5kbGUpO1xuXG4gICAgICAgIGlmIChyZWNvbm5lY3RDb25maWcubGluZWFyQ29ubmVjdEF0dGVtcHQgPCBNQVhfTElORUFSX0NPTk5FQ1RfQVRURU1QVFMpIHtcbiAgICAgICAgICAgIHJlY29ubmVjdENvbmZpZy5saW5lYXJDb25uZWN0QXR0ZW1wdCsrO1xuICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKFwiU3RhcnRpbmcgQ29uc2VjdXRpdmUgV2ViU29ja2V0IHJlY29ubmVjdCwgQXR0ZW1wdCA6IFwiICsgcmVjb25uZWN0Q29uZmlnLmxpbmVhckNvbm5lY3RBdHRlbXB0KTtcbiAgICAgICAgICAgIHJlY29ubmVjdENvbmZpZy5yZWNvbm5lY3RXZWJTb2NrZXQgPSB0cnVlO1xuICAgICAgICAgICAgZ2V0V2ViU29ja2V0Q29ubkNvbmZpZygpO1xuICAgICAgICB9IGVsc2UgaWYgKHJlY29ubmVjdENvbmZpZy5leHBvbmVudGlhbENvbm5lY3RBdHRlbXB0IDwgTUFYX0VYUE9ORU5USUFMX0NPTk5FQ1RfQVRURU1QVFMpIHtcbiAgICAgICAgICAgIHJlY29ubmVjdENvbmZpZy5leHBvbmVudGlhbENvbm5lY3RBdHRlbXB0Kys7XG4gICAgICAgICAgICByZWNvbm5lY3RDb25maWcuZXhwb25lbnRpYWxCYWNrT2ZmVGltZSAqPSAyO1xuICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKFwiU3RhcnRpbmcgRXhwb25lbnRpYWwgV2ViU29ja2V0IHJlY29ubmVjdCwgQXR0ZW1wdCA6IFwiXG4gICAgICAgICAgICAgICAgKyByZWNvbm5lY3RDb25maWcuZXhwb25lbnRpYWxDb25uZWN0QXR0ZW1wdCArIFwiIHdpdGggZGVsYXkgXCJcbiAgICAgICAgICAgICAgICArIHJlY29ubmVjdENvbmZpZy5leHBvbmVudGlhbEJhY2tPZmZUaW1lICsgXCIgc2VjLlwiKTtcblxuICAgICAgICAgICAgLy8gcmVxdWlyZWQgZm9yIHNjZW5hcmlvcyB3aGVuIGVycm9yIGFuZCBjbG9zZSBldmVudHMgYXJlIGZpcmVkIGJhY2sgdG8gYmFja1xuICAgICAgICAgICAgd2ViU29ja2V0Q29uZmlnLnByb21pc2VDb21wbGV0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHdlYlNvY2tldENvbmZpZy5jb25uQ29uZmlnID0gbnVsbDtcblxuICAgICAgICAgICAgcmVjb25uZWN0Q29uZmlnLmV4cG9uZW50aWFsVGltZW91dEhhbmRsZSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmVjb25uZWN0Q29uZmlnLnJlY29ubmVjdFdlYlNvY2tldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZ2V0V2ViU29ja2V0Q29ubkNvbmZpZygpO1xuICAgICAgICAgICAgfSwgMTAwMCAqIHJlY29ubmVjdENvbmZpZy5leHBvbmVudGlhbEJhY2tPZmZUaW1lKTtcbiAgICAgICAgfSBlbHNlIGlmICh3ZWJTb2NrZXRDb25maWcucHJvbWlzZUNvbXBsZXRlZCkge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKFwiQ291bGQgbm90IGNvbm5lY3QgdG8gV2ViU29ja2V0IGFmdGVyIHNldmVyYWwgYXR0ZW1wdHNcIik7XG4gICAgICAgICAgICB0ZXJtaW5hdGVXZWJTb2NrZXRNYW5hZ2VyKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgdGVybWluYXRlV2ViU29ja2V0TWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmVzZXRTdGF0ZSgpO1xuICAgICAgICBpZiAod2ViU29ja2V0ICYmIHdlYlNvY2tldC5yZWFkeVN0YXRlICE9PSBXZWJTb2NrZXQuQ0xPU0VEKSB7XG4gICAgICAgICAgICB3ZWJTb2NrZXQuY2xvc2UoMTAwMCwgXCJUZXJtaW5hdGluZyBXZWJTb2NrZXQgTWFuYWdlclwiKTtcbiAgICAgICAgfVxuICAgICAgICBsb2dnZXIuZXJyb3IoXCJXZWJTb2NrZXQgSW5pdGlhbGl6YXRpb24gZmFpbGVkXCIpO1xuICAgICAgICByZWNvbm5lY3RDb25maWcud2Vic29ja2V0SW5pdEZhaWxlZCA9IHRydWU7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwobmV0d29ya0Nvbm5lY3Rpdml0eUNoZWNrZXIpO1xuICAgICAgICBpbnZva2VDYWxsYmFja3MoY2FsbGJhY2tzLmluaXRGYWlsdXJlKTtcbiAgICB9O1xuXG4gICAgY29uc3QgY3JlYXRlV2ViU29ja2V0UGF5bG9hZCA9IGZ1bmN0aW9uIChrZXksIGNvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFwidG9waWNcIjoga2V5LFxuICAgICAgICAgICAgXCJjb250ZW50XCI6IGNvbnRlbnRcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IHNlbmRNZXNzYWdlID0gZnVuY3Rpb24ocGF5bG9hZCkge1xuICAgICAgICBVdGlscy5hc3NlcnRJc09iamVjdChwYXlsb2FkLCBcInBheWxvYWRcIik7XG4gICAgICAgIGlmIChwYXlsb2FkLnRvcGljID09PSB1bmRlZmluZWQgfHwgaW52YWxpZFNlbmRNZXNzYWdlUm91dGVLZXlzLmhhcyhwYXlsb2FkLnRvcGljKSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oXCJDYW5ub3Qgc2VuZCBtZXNzYWdlLCBJbnZhbGlkIHRvcGljXCIsIHBheWxvYWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybihcIkVycm9yIHN0cmluZ2lmeSBtZXNzYWdlXCIsIHBheWxvYWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3ZWJTb2NrZXQgJiYgd2ViU29ja2V0LnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOKSB7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoJ1dlYlNvY2tldE1hbmFnZXIgc2VuZGluZyBtZXNzYWdlJywgcGF5bG9hZCk7XG4gICAgICAgICAgICB3ZWJTb2NrZXQuc2VuZChwYXlsb2FkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKFwiQ2Fubm90IHNlbmQgbWVzc2FnZSwgd2ViIHNvY2tldCBjb25uZWN0aW9uIGlzIG5vdCBvcGVuXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHN1YnNjcmliZVRvcGljcyA9IGZ1bmN0aW9uKHRvcGljcykge1xuICAgICAgICBVdGlscy5hc3NlcnROb3ROdWxsKHRvcGljcywgJ3RvcGljcycpO1xuICAgICAgICBVdGlscy5hc3NlcnRJc0xpc3QodG9waWNzKTtcblxuICAgICAgICB0b3BpY3MuZm9yRWFjaChmdW5jdGlvbiAodG9waWMpIHtcbiAgICAgICAgICAgIHRvcGljU3Vic2NyaXB0aW9uLnBlbmRpbmcuYWRkKHRvcGljKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHdlYlNvY2tldCAmJiB3ZWJTb2NrZXQucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgICAgICAgIHdlYlNvY2tldC5zZW5kKGNyZWF0ZVdlYlNvY2tldFBheWxvYWQoUk9VVEVfS0VZLlNVQlNDUklCRSwge1widG9waWNzXCI6IHRvcGljc30pKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCB2YWxpZFdlYlNvY2tldENvbm5Db25maWcgPSBmdW5jdGlvbiAoY29ubkNvbmZpZykge1xuICAgICAgICBpZiAoVXRpbHMuaXNPYmplY3QoY29ubkNvbmZpZykgJiYgVXRpbHMuaXNPYmplY3QoY29ubkNvbmZpZy53ZWJTb2NrZXRUcmFuc3BvcnQpXG4gICAgICAgICAgICAmJiBVdGlscy5pc1N0cmluZyhjb25uQ29uZmlnLndlYlNvY2tldFRyYW5zcG9ydC51cmwpXG4gICAgICAgICAgICAmJiBVdGlscy52YWxpZFdTVXJsKGNvbm5Db25maWcud2ViU29ja2V0VHJhbnNwb3J0LnVybClcbiAgICAgICAgICAgICYmIFV0aWxzLmlzTnVtYmVyKGNvbm5Db25maWcud2ViU29ja2V0VHJhbnNwb3J0LnRyYW5zcG9ydExpZmVUaW1lSW5TZWNvbmRzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgbG9nZ2VyLmVycm9yKFwiSW52YWxpZCBXZWJTb2NrZXQgQ29ubmVjdGlvbiBDb25maWd1cmF0aW9uXCIsIGNvbm5Db25maWcpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIGNvbnN0IGdldFdlYlNvY2tldENvbm5Db25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChyZWNvbm5lY3RDb25maWcud2Vic29ja2V0SW5pdEZhaWxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHdlYlNvY2tldENvbmZpZy5jb25uQ29uZmlnID0gbnVsbDtcbiAgICAgICAgd2ViU29ja2V0Q29uZmlnLnByb21pc2VDb21wbGV0ZWQgPSBmYWxzZTtcbiAgICAgICAgd2ViU29ja2V0Q29uZmlnLnByb21pc2VIYW5kbGUgPSBjYWxsYmFja3MuZ2V0V2ViU29ja2V0VHJhbnNwb3J0KCk7XG4gICAgICAgIHdlYlNvY2tldENvbmZpZy5wcm9taXNlSGFuZGxlXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB3ZWJTb2NrZXRDb25maWcucHJvbWlzZUNvbXBsZXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZyhcIlN1Y2Nlc3NmdWxseSBmZXRjaGVkIHdlYlNvY2tldCBjb25uZWN0aW9uIGNvbmZpZ3VyYXRpb25cIik7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdmFsaWRXZWJTb2NrZXRDb25uQ29uZmlnKHJlc3BvbnNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVybWluYXRlV2ViU29ja2V0TWFuYWdlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdlYlNvY2tldENvbmZpZy5jb25uQ29uZmlnID0gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh3ZWJTb2NrZXQgJiYgd2ViU29ja2V0LnJlYWR5U3RhdGUgIT09IFdlYlNvY2tldC5DTE9TRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlYlNvY2tldC5jbG9zZSgxMDAwLCBcIlJlc3RhcnRpbmcgV2ViU29ja2V0IE1hbmFnZXJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaW5pdFdlYlNvY2tldCgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgICAgIHdlYlNvY2tldENvbmZpZy5wcm9taXNlQ29tcGxldGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKFwiRmFpbGVkIHRvIGZldGNoIHdlYlNvY2tldCBjb25uZWN0aW9uIGNvbmZpZ3VyYXRpb25cIiwgcmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hdmlnYXRvci5vbkxpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hXZWJTb2NrZXRDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgaW5pdFdlYlNvY2tldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAocmVjb25uZWN0Q29uZmlnLndlYnNvY2tldEluaXRGYWlsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsb2dnZXIuZGVidWcoXCJJbml0aWFsaXppbmcgV2Vic29ja2V0IE1hbmFnZXJcIik7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAodmFsaWRXZWJTb2NrZXRDb25uQ29uZmlnKHdlYlNvY2tldENvbmZpZy5jb25uQ29uZmlnKSkge1xuXG4gICAgICAgICAgICAgICAgd2ViU29ja2V0ID0gbmV3IFdlYlNvY2tldCh3ZWJTb2NrZXRDb25maWcuY29ubkNvbmZpZy53ZWJTb2NrZXRUcmFuc3BvcnQudXJsKTtcbiAgICAgICAgICAgICAgICB3ZWJTb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgd2ViU29ja2V0T25PcGVuKTtcbiAgICAgICAgICAgICAgICB3ZWJTb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgd2ViU29ja2V0T25NZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB3ZWJTb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIHdlYlNvY2tldE9uRXJyb3IpO1xuICAgICAgICAgICAgICAgIHdlYlNvY2tldC5hZGRFdmVudExpc3RlbmVyKFwiY2xvc2VcIiwgd2ViU29ja2V0T25DbG9zZSk7XG5cbiAgICAgICAgICAgICAgICByZWNvbm5lY3RDb25maWcubGlmZVRpbWVUaW1lb3V0SGFuZGxlID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVmcmVzaFdlYlNvY2tldENvbm5lY3Rpb24oKTtcbiAgICAgICAgICAgICAgICB9LCAxMDAwICogd2ViU29ja2V0Q29uZmlnLmNvbm5Db25maWcud2ViU29ja2V0VHJhbnNwb3J0LnRyYW5zcG9ydExpZmVUaW1lSW5TZWNvbmRzKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAod2ViU29ja2V0Q29uZmlnLnByb21pc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYXRlV2ViU29ja2V0TWFuYWdlcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcihcIkVycm9yIEluaXRpYWxpemluZyB3ZWItc29ja2V0LW1hbmFnZXJcIiwgZXJyb3IpO1xuICAgICAgICAgICAgdGVybWluYXRlV2ViU29ja2V0TWFuYWdlcigpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IG9uQ29ubmVjdGlvbkdhaW4gPSBmdW5jdGlvbihjYikge1xuICAgICAgICBVdGlscy5hc3NlcnRUcnVlKFV0aWxzLmlzRnVuY3Rpb24oY2IpLCAnY2IgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgICAgIGNhbGxiYWNrcy5jb25uZWN0aW9uR2Fpbi5hZGQoY2IpO1xuICAgIH07XG5cbiAgICBjb25zdCBvbkNvbm5lY3Rpb25Mb3N0ID0gZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgVXRpbHMuYXNzZXJ0VHJ1ZShVdGlscy5pc0Z1bmN0aW9uKGNiKSwgJ2NiIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgICAgICBjYWxsYmFja3MuY29ubmVjdGlvbkxvc3QuYWRkKGNiKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgb25Jbml0RmFpbHVyZSA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgIFV0aWxzLmFzc2VydFRydWUoVXRpbHMuaXNGdW5jdGlvbihjYiksICdjYiBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgICAgY2FsbGJhY2tzLmluaXRGYWlsdXJlLmFkZChjYik7XG4gICAgfTtcblxuICAgIGNvbnN0IGluaXQgPSBmdW5jdGlvbih0cmFuc3BvcnRIYW5kbGUpIHtcbiAgICAgICAgVXRpbHMuYXNzZXJ0VHJ1ZShVdGlscy5pc0Z1bmN0aW9uKHRyYW5zcG9ydEhhbmRsZSksICd0cmFuc3BvcnRIYW5kbGUgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgICAgIGlmIChjYWxsYmFja3MuZ2V0V2ViU29ja2V0VHJhbnNwb3J0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybihcIldlYiBTb2NrZXQgTWFuYWdlciB3YXMgYWxyZWFkeSBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFja3MuZ2V0V2ViU29ja2V0VHJhbnNwb3J0ID0gdHJhbnNwb3J0SGFuZGxlO1xuXG4gICAgICAgIGdldFdlYlNvY2tldENvbm5Db25maWcoKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgb25TdWJzY3JpcHRpb25VcGRhdGUgPSBmdW5jdGlvbihjYikge1xuICAgICAgICBVdGlscy5hc3NlcnRUcnVlKFV0aWxzLmlzRnVuY3Rpb24oY2IpLCAnY2IgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgICAgIGNhbGxiYWNrcy5zdWJzY3JpcHRpb25VcGRhdGUuYWRkKGNiKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgb25TdWJzY3JpcHRpb25GYWlsdXJlID0gZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgVXRpbHMuYXNzZXJ0VHJ1ZShVdGlscy5pc0Z1bmN0aW9uKGNiKSwgJ2NiIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgICAgICBjYWxsYmFja3Muc3Vic2NyaXB0aW9uRmFpbHVyZS5hZGQoY2IpO1xuICAgIH07XG5cbiAgICBjb25zdCBvbk1lc3NhZ2UgPSBmdW5jdGlvbih0b3BpY05hbWUsIGNiKSB7XG4gICAgICAgIFV0aWxzLmFzc2VydE5vdE51bGwodG9waWNOYW1lLCAndG9waWNOYW1lJyk7XG4gICAgICAgIFV0aWxzLmFzc2VydFRydWUoVXRpbHMuaXNGdW5jdGlvbihjYiksICdjYiBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcy50b3BpYy5oYXModG9waWNOYW1lKSkge1xuICAgICAgICAgICAgY2FsbGJhY2tzLnRvcGljLmdldCh0b3BpY05hbWUpLnB1c2goY2IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2tzLnRvcGljLnNldCh0b3BpY05hbWUsIG5ldyBTZXQoW2NiXSkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IG9uQWxsTWVzc2FnZSA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICBVdGlscy5hc3NlcnRUcnVlKFV0aWxzLmlzRnVuY3Rpb24oY2IpLCAnY2IgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgICAgIGNhbGxiYWNrcy5hbGxNZXNzYWdlLmFkZChjYik7XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdCA9IGluaXQ7XG4gICAgdGhpcy5vbkluaXRGYWlsdXJlID0gb25Jbml0RmFpbHVyZTtcbiAgICB0aGlzLm9uQ29ubmVjdGlvbkdhaW4gPSBvbkNvbm5lY3Rpb25HYWluO1xuICAgIHRoaXMub25Db25uZWN0aW9uTG9zdCA9IG9uQ29ubmVjdGlvbkxvc3Q7XG4gICAgdGhpcy5vblN1YnNjcmlwdGlvblVwZGF0ZSA9IG9uU3Vic2NyaXB0aW9uVXBkYXRlO1xuICAgIHRoaXMub25TdWJzY3JpcHRpb25GYWlsdXJlID0gb25TdWJzY3JpcHRpb25GYWlsdXJlO1xuICAgIHRoaXMub25NZXNzYWdlID0gb25NZXNzYWdlO1xuICAgIHRoaXMub25BbGxNZXNzYWdlID0gb25BbGxNZXNzYWdlO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9waWNzID0gc3Vic2NyaWJlVG9waWNzO1xuICAgIHRoaXMuc2VuZE1lc3NhZ2UgPSBzZW5kTWVzc2FnZTtcbn07XG5cbmNvbnN0IFdlYlNvY2tldE1hbmFnZXJDb25zdHJ1Y3RvciA9ICgpID0+IHtcbiAgICByZXR1cm4gbmV3IFdlYlNvY2tldE1hbmFnZXIoKTtcbn07XG5cbmNvbnN0IHNldEdsb2JhbENvbmZpZyA9IGNvbmZpZyA9PiB7XG4gICAgY29uc3QgbG9nZ2VyQ29uZmlnID0gY29uZmlnLmxvZ2dlckNvbmZpZztcbiAgICBMb2dNYW5hZ2VyLnVwZGF0ZUxvZ2dlckNvbmZpZyhsb2dnZXJDb25maWcpO1xufTtcblxuY29uc3QgV2ViU29ja2V0TWFuYWdlck9iamVjdCA9IHtcbiAgICBjcmVhdGU6IFdlYlNvY2tldE1hbmFnZXJDb25zdHJ1Y3RvcixcbiAgICBzZXRHbG9iYWxDb25maWc6IHNldEdsb2JhbENvbmZpZyxcbiAgICBMb2dMZXZlbDogTG9nTGV2ZWwsXG4gICAgTG9nZ2VyOiBMb2dnZXJcbn07XG5cbmV4cG9ydCB7IFdlYlNvY2tldE1hbmFnZXJPYmplY3QgfTsiLCIvKiBnbG9iYWwgd2luZG93LCBleHBvcnRzLCBkZWZpbmUgKi9cblxuIWZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0J1xuXG4gICAgdmFyIHJlID0ge1xuICAgICAgICBub3Rfc3RyaW5nOiAvW15zXS8sXG4gICAgICAgIG5vdF9ib29sOiAvW150XS8sXG4gICAgICAgIG5vdF90eXBlOiAvW15UXS8sXG4gICAgICAgIG5vdF9wcmltaXRpdmU6IC9bXnZdLyxcbiAgICAgICAgbnVtYmVyOiAvW2RpZWZnXS8sXG4gICAgICAgIG51bWVyaWNfYXJnOiAvW2JjZGllZmd1eFhdLyxcbiAgICAgICAganNvbjogL1tqXS8sXG4gICAgICAgIG5vdF9qc29uOiAvW15qXS8sXG4gICAgICAgIHRleHQ6IC9eW15cXHgyNV0rLyxcbiAgICAgICAgbW9kdWxvOiAvXlxceDI1ezJ9LyxcbiAgICAgICAgcGxhY2Vob2xkZXI6IC9eXFx4MjUoPzooWzEtOV1cXGQqKVxcJHxcXCgoW14pXSspXFwpKT8oXFwrKT8oMHwnW14kXSk/KC0pPyhcXGQrKT8oPzpcXC4oXFxkKykpPyhbYi1naWpvc3RUdXZ4WF0pLyxcbiAgICAgICAga2V5OiAvXihbYS16X11bYS16X1xcZF0qKS9pLFxuICAgICAgICBrZXlfYWNjZXNzOiAvXlxcLihbYS16X11bYS16X1xcZF0qKS9pLFxuICAgICAgICBpbmRleF9hY2Nlc3M6IC9eXFxbKFxcZCspXFxdLyxcbiAgICAgICAgc2lnbjogL15bKy1dL1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNwcmludGYoa2V5KSB7XG4gICAgICAgIC8vIGBhcmd1bWVudHNgIGlzIG5vdCBhbiBhcnJheSwgYnV0IHNob3VsZCBiZSBmaW5lIGZvciB0aGlzIGNhbGxcbiAgICAgICAgcmV0dXJuIHNwcmludGZfZm9ybWF0KHNwcmludGZfcGFyc2Uoa2V5KSwgYXJndW1lbnRzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZzcHJpbnRmKGZtdCwgYXJndikge1xuICAgICAgICByZXR1cm4gc3ByaW50Zi5hcHBseShudWxsLCBbZm10XS5jb25jYXQoYXJndiB8fCBbXSkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3ByaW50Zl9mb3JtYXQocGFyc2VfdHJlZSwgYXJndikge1xuICAgICAgICB2YXIgY3Vyc29yID0gMSwgdHJlZV9sZW5ndGggPSBwYXJzZV90cmVlLmxlbmd0aCwgYXJnLCBvdXRwdXQgPSAnJywgaSwgaywgcGgsIHBhZCwgcGFkX2NoYXJhY3RlciwgcGFkX2xlbmd0aCwgaXNfcG9zaXRpdmUsIHNpZ25cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRyZWVfbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyc2VfdHJlZVtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gcGFyc2VfdHJlZVtpXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIHBhcnNlX3RyZWVbaV0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgcGggPSBwYXJzZV90cmVlW2ldIC8vIGNvbnZlbmllbmNlIHB1cnBvc2VzIG9ubHlcbiAgICAgICAgICAgICAgICBpZiAocGgua2V5cykgeyAvLyBrZXl3b3JkIGFyZ3VtZW50XG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3ZbY3Vyc29yXVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgcGgua2V5cy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZyA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3ByaW50ZignW3NwcmludGZdIENhbm5vdCBhY2Nlc3MgcHJvcGVydHkgXCIlc1wiIG9mIHVuZGVmaW5lZCB2YWx1ZSBcIiVzXCInLCBwaC5rZXlzW2tdLCBwaC5rZXlzW2stMV0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnW3BoLmtleXNba11dXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocGgucGFyYW1fbm8pIHsgLy8gcG9zaXRpb25hbCBhcmd1bWVudCAoZXhwbGljaXQpXG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3ZbcGgucGFyYW1fbm9dXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgeyAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50IChpbXBsaWNpdClcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndltjdXJzb3IrK11cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmUubm90X3R5cGUudGVzdChwaC50eXBlKSAmJiByZS5ub3RfcHJpbWl0aXZlLnRlc3QocGgudHlwZSkgJiYgYXJnIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnKClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmUubnVtZXJpY19hcmcudGVzdChwaC50eXBlKSAmJiAodHlwZW9mIGFyZyAhPT0gJ251bWJlcicgJiYgaXNOYU4oYXJnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzcHJpbnRmKCdbc3ByaW50Zl0gZXhwZWN0aW5nIG51bWJlciBidXQgZm91bmQgJVQnLCBhcmcpKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZS5udW1iZXIudGVzdChwaC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBpc19wb3NpdGl2ZSA9IGFyZyA+PSAwXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChwaC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2InOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gcGFyc2VJbnQoYXJnLCAxMCkudG9TdHJpbmcoMilcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2MnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChhcmcsIDEwKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdpJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IHBhcnNlSW50KGFyZywgMTApXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdqJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IEpTT04uc3RyaW5naWZ5KGFyZywgbnVsbCwgcGgud2lkdGggPyBwYXJzZUludChwaC53aWR0aCkgOiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBwaC5wcmVjaXNpb24gPyBwYXJzZUZsb2F0KGFyZykudG9FeHBvbmVudGlhbChwaC5wcmVjaXNpb24pIDogcGFyc2VGbG9hdChhcmcpLnRvRXhwb25lbnRpYWwoKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZic6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBwaC5wcmVjaXNpb24gPyBwYXJzZUZsb2F0KGFyZykudG9GaXhlZChwaC5wcmVjaXNpb24pIDogcGFyc2VGbG9hdChhcmcpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdnJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IHBoLnByZWNpc2lvbiA/IFN0cmluZyhOdW1iZXIoYXJnLnRvUHJlY2lzaW9uKHBoLnByZWNpc2lvbikpKSA6IHBhcnNlRmxvYXQoYXJnKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbyc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSAocGFyc2VJbnQoYXJnLCAxMCkgPj4+IDApLnRvU3RyaW5nKDgpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IFN0cmluZyhhcmcpXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSAocGgucHJlY2lzaW9uID8gYXJnLnN1YnN0cmluZygwLCBwaC5wcmVjaXNpb24pIDogYXJnKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBTdHJpbmcoISFhcmcpXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSAocGgucHJlY2lzaW9uID8gYXJnLnN1YnN0cmluZygwLCBwaC5wcmVjaXNpb24pIDogYXJnKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnVCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJnKS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKHBoLnByZWNpc2lvbiA/IGFyZy5zdWJzdHJpbmcoMCwgcGgucHJlY2lzaW9uKSA6IGFyZylcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3UnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gcGFyc2VJbnQoYXJnLCAxMCkgPj4+IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3YnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnZhbHVlT2YoKVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKHBoLnByZWNpc2lvbiA/IGFyZy5zdWJzdHJpbmcoMCwgcGgucHJlY2lzaW9uKSA6IGFyZylcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKHBhcnNlSW50KGFyZywgMTApID4+PiAwKS50b1N0cmluZygxNilcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ1gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKHBhcnNlSW50KGFyZywgMTApID4+PiAwKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlLmpzb24udGVzdChwaC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgKz0gYXJnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmUubnVtYmVyLnRlc3QocGgudHlwZSkgJiYgKCFpc19wb3NpdGl2ZSB8fCBwaC5zaWduKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbiA9IGlzX3Bvc2l0aXZlID8gJysnIDogJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoKS5yZXBsYWNlKHJlLnNpZ24sICcnKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbiA9ICcnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcGFkX2NoYXJhY3RlciA9IHBoLnBhZF9jaGFyID8gcGgucGFkX2NoYXIgPT09ICcwJyA/ICcwJyA6IHBoLnBhZF9jaGFyLmNoYXJBdCgxKSA6ICcgJ1xuICAgICAgICAgICAgICAgICAgICBwYWRfbGVuZ3RoID0gcGgud2lkdGggLSAoc2lnbiArIGFyZykubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHBhZCA9IHBoLndpZHRoID8gKHBhZF9sZW5ndGggPiAwID8gcGFkX2NoYXJhY3Rlci5yZXBlYXQocGFkX2xlbmd0aCkgOiAnJykgOiAnJ1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgKz0gcGguYWxpZ24gPyBzaWduICsgYXJnICsgcGFkIDogKHBhZF9jaGFyYWN0ZXIgPT09ICcwJyA/IHNpZ24gKyBwYWQgKyBhcmcgOiBwYWQgKyBzaWduICsgYXJnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0XG4gICAgfVxuXG4gICAgdmFyIHNwcmludGZfY2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgICBmdW5jdGlvbiBzcHJpbnRmX3BhcnNlKGZtdCkge1xuICAgICAgICBpZiAoc3ByaW50Zl9jYWNoZVtmbXRdKSB7XG4gICAgICAgICAgICByZXR1cm4gc3ByaW50Zl9jYWNoZVtmbXRdXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgX2ZtdCA9IGZtdCwgbWF0Y2gsIHBhcnNlX3RyZWUgPSBbXSwgYXJnX25hbWVzID0gMFxuICAgICAgICB3aGlsZSAoX2ZtdCkge1xuICAgICAgICAgICAgaWYgKChtYXRjaCA9IHJlLnRleHQuZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlLnB1c2gobWF0Y2hbMF0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgobWF0Y2ggPSByZS5tb2R1bG8uZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlLnB1c2goJyUnKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoKG1hdGNoID0gcmUucGxhY2Vob2xkZXIuZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbMl0pIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnX25hbWVzIHw9IDFcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkX2xpc3QgPSBbXSwgcmVwbGFjZW1lbnRfZmllbGQgPSBtYXRjaFsyXSwgZmllbGRfbWF0Y2ggPSBbXVxuICAgICAgICAgICAgICAgICAgICBpZiAoKGZpZWxkX21hdGNoID0gcmUua2V5LmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdC5wdXNoKGZpZWxkX21hdGNoWzFdKVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChyZXBsYWNlbWVudF9maWVsZCA9IHJlcGxhY2VtZW50X2ZpZWxkLnN1YnN0cmluZyhmaWVsZF9tYXRjaFswXS5sZW5ndGgpKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGZpZWxkX21hdGNoID0gcmUua2V5X2FjY2Vzcy5leGVjKHJlcGxhY2VtZW50X2ZpZWxkKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdC5wdXNoKGZpZWxkX21hdGNoWzFdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgoZmllbGRfbWF0Y2ggPSByZS5pbmRleF9hY2Nlc3MuZXhlYyhyZXBsYWNlbWVudF9maWVsZCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkX2xpc3QucHVzaChmaWVsZF9tYXRjaFsxXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcignW3NwcmludGZdIGZhaWxlZCB0byBwYXJzZSBuYW1lZCBhcmd1bWVudCBrZXknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcignW3NwcmludGZdIGZhaWxlZCB0byBwYXJzZSBuYW1lZCBhcmd1bWVudCBrZXknKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoWzJdID0gZmllbGRfbGlzdFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnX25hbWVzIHw9IDJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFyZ19uYW1lcyA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tzcHJpbnRmXSBtaXhpbmcgcG9zaXRpb25hbCBhbmQgbmFtZWQgcGxhY2Vob2xkZXJzIGlzIG5vdCAoeWV0KSBzdXBwb3J0ZWQnKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHBhcnNlX3RyZWUucHVzaChcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1fbm86ICAgIG1hdGNoWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5czogICAgICAgIG1hdGNoWzJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbjogICAgICAgIG1hdGNoWzNdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkX2NoYXI6ICAgIG1hdGNoWzRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICAgICAgIG1hdGNoWzVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICAgICAgIG1hdGNoWzZdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uOiAgIG1hdGNoWzddLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogICAgICAgIG1hdGNoWzhdXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoJ1tzcHJpbnRmXSB1bmV4cGVjdGVkIHBsYWNlaG9sZGVyJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9mbXQgPSBfZm10LnN1YnN0cmluZyhtYXRjaFswXS5sZW5ndGgpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNwcmludGZfY2FjaGVbZm10XSA9IHBhcnNlX3RyZWVcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBleHBvcnQgdG8gZWl0aGVyIGJyb3dzZXIgb3Igbm9kZS5qc1xuICAgICAqL1xuICAgIC8qIGVzbGludC1kaXNhYmxlIHF1b3RlLXByb3BzICovXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBleHBvcnRzWydzcHJpbnRmJ10gPSBzcHJpbnRmXG4gICAgICAgIGV4cG9ydHNbJ3ZzcHJpbnRmJ10gPSB2c3ByaW50ZlxuICAgIH1cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgd2luZG93WydzcHJpbnRmJ10gPSBzcHJpbnRmXG4gICAgICAgIHdpbmRvd1sndnNwcmludGYnXSA9IHZzcHJpbnRmXG5cbiAgICAgICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lWydhbWQnXSkge1xuICAgICAgICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICdzcHJpbnRmJzogc3ByaW50ZixcbiAgICAgICAgICAgICAgICAgICAgJ3ZzcHJpbnRmJzogdnNwcmludGZcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qIGVzbGludC1lbmFibGUgcXVvdGUtcHJvcHMgKi9cbn0oKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuIiwiLyplc2xpbnQgbm8tdW51c2VkLXZhcnM6IFwib2ZmXCIqL1xuaW1wb3J0IHsgV2ViU29ja2V0TWFuYWdlck9iamVjdCB9IGZyb20gXCIuL3dlYlNvY2tldE1hbmFnZXJcIjtcblxuZ2xvYmFsLmNvbm5lY3QgPSBnbG9iYWwuY29ubmVjdCB8fCB7fTtcbmNvbm5lY3QuV2ViU29ja2V0TWFuYWdlciA9IFdlYlNvY2tldE1hbmFnZXJPYmplY3Q7XG5cbmV4cG9ydCBjb25zdCBXZWJTb2NrZXRNYW5hZ2VyID0gV2ViU29ja2V0TWFuYWdlck9iamVjdDtcbiIsInZhciBnO1xuXG4vLyBUaGlzIHdvcmtzIGluIG5vbi1zdHJpY3QgbW9kZVxuZyA9IChmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXM7XG59KSgpO1xuXG50cnkge1xuXHQvLyBUaGlzIHdvcmtzIGlmIGV2YWwgaXMgYWxsb3dlZCAoc2VlIENTUClcblx0ZyA9IGcgfHwgbmV3IEZ1bmN0aW9uKFwicmV0dXJuIHRoaXNcIikoKTtcbn0gY2F0Y2ggKGUpIHtcblx0Ly8gVGhpcyB3b3JrcyBpZiB0aGUgd2luZG93IHJlZmVyZW5jZSBpcyBhdmFpbGFibGVcblx0aWYgKHR5cGVvZiB3aW5kb3cgPT09IFwib2JqZWN0XCIpIGcgPSB3aW5kb3c7XG59XG5cbi8vIGcgY2FuIHN0aWxsIGJlIHVuZGVmaW5lZCwgYnV0IG5vdGhpbmcgdG8gZG8gYWJvdXQgaXQuLi5cbi8vIFdlIHJldHVybiB1bmRlZmluZWQsIGluc3RlYWQgb2Ygbm90aGluZyBoZXJlLCBzbyBpdCdzXG4vLyBlYXNpZXIgdG8gaGFuZGxlIHRoaXMgY2FzZS4gaWYoIWdsb2JhbCkgeyAuLi59XG5cbm1vZHVsZS5leHBvcnRzID0gZztcbiJdLCJzb3VyY2VSb290IjoiIn0=