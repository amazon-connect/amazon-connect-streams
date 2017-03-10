#
# Minimal Makefile for amazon-connect JS.
# Concatenates JS assets in the correct order.
#

VERSION = 'v0.1'
OUTPUT_JS = 'amazon-connect-$(VERSION).js'

SOURCE_FILES = src/lily.js \
					src/sprintf.js \
					src/log.js \
					src/util.js \
					src/aws.js \
					src/event.js \
					src/streams.js \
					src/client.js \
					src/transitions.js \
					src/api.js \
					src/core.js \
					src/ringtone.js \
					src/softphone.js \
					src/worker.js

all: $(OUTPUT_JS)

$(OUTPUT_JS): $(SOURCE_FILES)
	cat $^ >$@

clean:
	rm $(OUTPUT_JS)

.DEFAULT_GOAL := all

.PHONY: clean css

