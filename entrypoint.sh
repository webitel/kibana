#!/bin/bash
set -e
ARCHIVE="on"

echo 'Webitel Kibana '$VERSION

if [ "$WEBITEL_ARCHIVE" == "$ARCHIVE" ]; then
    echo "Webitel Archive Storage"
    cp -rf /kibana/config/kibana.yml.archive /kibana/config/kibana.yml
fi

# Add kibana as command if needed
if [[ "$1" == -* ]]; then
	set -- kibana "$@"
fi

# Run as user "kibana" if the command is "kibana"
if [ "$1" = 'kibana' ]; then
	if [ "$ELASTICSEARCH_URL" -o "$ELASTICSEARCH_PORT_9200_TCP" ]; then
		: ${ELASTICSEARCH_URL:='http://elasticsearch:9200'}
		sed -ri "s!^(elasticsearch.url:).*!\1 '$ELASTICSEARCH_URL'!" /kibana/config/kibana.yml
	fi

	if [ "$WEBITEL_PASS" ]; then
		sed -ri "s!^(webitel.security.password:).*!\1 '$WEBITEL_PASS'!" /kibana/config/kibana.yml
	fi

if [ "$ENGINE_AUTH_URL" -o "$ENGINE_AUTH_PORT_10022_TCP" ]; then
		: ${ENGINE_AUTH_URL:='http://engine:10022'}
		sed -ri "s!^(webitel.main.engineUri:).*!\1 '$ENGINE_AUTH_URL'!" /kibana/config/kibana.yml
	fi

if [ "$ENGINE_URL" -o "$ENGINE_PORT_10022_TCP" ]; then
		: ${ENGINE_URL:='http://engine:10022'}
		sed -ri "s!^(webitel.main.engineUri:).*!\1 '$ENGINE_URL'!" /kibana/config/kibana.yml
	else
		echo >&2 'warning: missing ENGINE_PORT_10022_TCP or ENGINE_URL'
		echo >&2 '  Did you forget to --link engine:engine'
		echo >&2 '  or -e ENGINE_URL=http://engine:10022 ?'
		echo >&2
	fi

if [ "$FS_URL" -o "$FS_PORT_8082_TCP" ]; then
		: ${FS_URL:='wss://freeswitch:8082'}
		sed -ri "s!^(webitel.main.webRtcUri:).*!\1 '$FS_URL'!" /kibana/config/kibana.yml
	else
		echo >&2 'warning: missing FS_PORT_8082_TCP or FS_URL'
		echo >&2 '  Did you forget to --link freeswitch:freeswitch'
		echo >&2 '  or -e FS_URL=wss://freeswitch:8082 ?'
		echo >&2
	fi


	set -- "$@"
fi

exec "$@"
