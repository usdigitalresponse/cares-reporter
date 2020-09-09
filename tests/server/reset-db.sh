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
dbname=${1:-postgres}

mkdir -p $UPLOAD_DIRECTORY
rm -rf "$UPLOAD_DIRECTORY/*"

if [[ $dbname = postgres ]]
then
  # if the dbname is postgres it's easier to drop the schema than the database.
  psql -h localhost -U postgres -w postgres -c "DROP SCHEMA public CASCADE"
  psql -h localhost -U postgres -w postgres -c "CREATE SCHEMA public"
else
  
  psql -h localhost -U postgres -w postgres -c "DROP DATABASE IF EXISTS $dbname"
  psql -h localhost -U postgres -w postgres -c "CREATE DATABASE $dbname"
fi
yarn knex migrate:latest
yarn knex seed:run


