#!/bin/bash

# set -x
set -e 

export POSTGRES_URL="postgres://localhost/server_test"
export UPLOAD_DIRECTORY=`dirname $0`/uploads
mkdir -p $UPLOAD_DIRECTORY
rm -rf "$UPLOAD_DIRECTORY/*"
psql -h localhost -U postgres -w postgres -c 'DROP DATABASE IF EXISTS server_test'
psql -h localhost -U postgres -w postgres -c 'CREATE DATABASE server_test'
yarn knex migrate:latest
yarn knex seed:run

if [ $# -gt 0 ]; then
  mocha --require=`dirname $0`/mocha_init.js $*
else
  mocha --require=`dirname $0`/mocha_init.js 'tests/server/**/*.spec.js'
fi

