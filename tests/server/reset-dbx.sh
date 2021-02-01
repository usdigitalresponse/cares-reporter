#!/bin/bash

# The actual directory of this file.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# set -x
set -e

# Import .env variables if not already defined.
DOTENV="$DIR/../../.env"
source /dev/stdin <<DONE
$(grep -v '^#' $DOTENV | sed -E 's|^(.+)=(.*)|: ${\1=\2}; export \1|g')
DONE

# Default dbname is "postgres"
dbname=${1:-server_test}

echo Using database $dbname
echo DIR is $DIR

psql -h localhost -U postgres -w postgres -c "DROP DATABASE IF EXISTS $dbname"
psql -h localhost -U postgres -w postgres -c "CREATE DATABASE $dbname"

yarn knex migrate:latest
yarn knex --knexfile tests/server/knexfile.js seed:run


