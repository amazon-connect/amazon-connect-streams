#
# Minimal Makefile for amazon-connect JS.
# Concatenates JS assets in the correct order.
#

VERSION = $(shell git describe --tags)
OUTPUT_JS = 'amazon-connect-$(VERSION).js'

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
					src/mediaControllers/* 

$(OUTPUT_JS): $(SOURCE_FILES)
	cat $^ >$@

clean:
	rm -f $(OUTPUT_JS)

.DEFAULT_GOAL := all

.PHONY: clean css

