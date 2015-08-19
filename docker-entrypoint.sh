#!/bin/bash
set -e

echo 'Webitel Kibana '$VERSION

# Add kibana as command if needed
if [[ "$1" == -* ]]; then
	set -- kibana "$@"
fi

# Run as user "kibana" if the command is "kibana"
if [ "$1" = 'kibana' ]; then
	if [ "$ELASTICSEARCH_URL" -o "$ELASTICSEARCH_PORT_9200_TCP" ]; then
		: ${ELASTICSEARCH_URL:='http://elasticsearch:9200'}
		sed -ri "s!^(elasticsearch_url:).*!\1 '$ELASTICSEARCH_URL'!" /kibana/config/kibana.yml
	else
		echo >&2 'warning: missing ELASTICSEARCH_PORT_9200_TCP or ELASTICSEARCH_URL'
		echo >&2 '  Did you forget to --link some-elasticsearch:elasticsearch'
		echo >&2 '  or -e ELASTICSEARCH_URL=http://some-elasticsearch:9200 ?'
		echo >&2
	fi

       	if [ "$CORE_URL" -o "$CORE_PORT_10022_TCP" ]; then
		: ${ELASTICSEARCH_URL:='http://core:10022'}
		sed -ri "s!^(webitel_auth:).*!\1 '$CORE_URL'!" /kibana/config/kibana.yml
	else
		echo >&2 'warning: missing CORE_PORT_10022_TCP or CORE_URL'
		echo >&2 '  Did you forget to --link webitel_core:core'
		echo >&2 '  or -e CORE_URL=http://core:10022 ?'
		echo >&2
	fi

	set -- "$@"
fi

exec "$@"
