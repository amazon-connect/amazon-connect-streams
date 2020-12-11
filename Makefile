#
# Minimal Makefile for amazon-connect JS.
# Concatenates JS assets in the correct order.
#

VERSION = $(shell git describe --tags)
OUTPUT_JS = 'amazon-connect-$(VERSION).js'
OUTPUT_DR_JS = 'amazon-connect-dr-$(VERSION).js'

SOURCE_FILES = src/aws-client.js \
					src/sprintf.js \
					src/log.js \
					src/util.js \
					src/event.js \
					src/streams.js \
					src/client.js \
					src/transitions.js \
					src/api.js \
					src/lib/amazon-connect-websocket-manager.js \
					src/core.js \
					src/ringtone.js \
					src/softphone.js \
					src/worker.js \
					src/mediaControllers/* \
					src/agent-app/agent-app.js \
					src/agent-app/app-registry.js

$(OUTPUT_JS): $(SOURCE_FILES)
	cat $^ >$@

$(OUTPUT_DR_JS): $(DR_SOURCE_FILES)
	cat $^ >$@
	base64 -w 0 $(OUTPUT_JS) > connect-streams-base64.txt
	sed -i '1s/^/  var LATEST_STREAMJS_BASE64_CODE = "/' connect-streams-base64.txt
	echo '";' >> connect-streams-base64.txt
	printf '%s\n' '/INSERT_LATEST_STREAMJS_BASE64_CODE/r connect-streams-base64.txt' 1 '/INSERT_LATEST_STREAMJS_BASE64_CODE/d' w | ed $@

clean:
	rm -f $(OUTPUT_JS)

.DEFAULT_GOAL := all

.PHONY: clean css

