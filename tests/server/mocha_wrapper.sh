#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
export POSTGRES_URL="postgres://localhost/server_test"
export UPLOAD_DIRECTORY=`dirname $0`/mocha_uploads
export TREASURY_DIRECTORY=`dirname $0`/mocha_uploads/treasury

$DIR/reset-db.sh server_test

if [ $# -gt 0 ]; then
  mocha --require=`dirname $0`/mocha_init.js $*
else
  mocha --require=`dirname $0`/mocha_init.js 'tests/server/**/*.spec.js'
fi

