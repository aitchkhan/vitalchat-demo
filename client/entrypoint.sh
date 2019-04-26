#!/bin/sh

[ -z "$API_SERVER_URL" ] && echo "Environment API_SERVER_URL is required." && exit 1

sed -i "s#API_SERVER_URL_REPLACE#$API_SERVER_URL#g" /usr/share/nginx/html/index.bundle.js

exec "$@"
