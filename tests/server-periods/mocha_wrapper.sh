#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
export POSTGRES_URL="postgres://localhost/rptest"
export UPLOAD_DIRECTORY=`dirname $0`/mocha_uploads
export TREASURY_DIRECTORY=`dirname $0`/mocha_uploads/treasury

$DIR/reset-db.sh rptest

if [ $# -gt 0 ]; then
  mocha --require=`dirname $0`/mocha_init.js $*
else
  mocha --require=`dirname $0`/mocha_init.js 'tests/server-periods/**/*.spec.js'
fi

