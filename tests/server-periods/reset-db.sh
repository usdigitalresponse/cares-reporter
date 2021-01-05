#!/bin/bash

# The actual directory of this file.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# set -x
set -e

# Import .env variables if not already defined.
DOTENV="$DIR/../../.env"
echo Getting environment from $DOTENV

source /dev/stdin <<DONE
$(grep -v '^#' $DOTENV | sed -E 's|^(.+)=(.*)|: ${\1=\2}; export \1|g')
DONE

# Default dbname is "rptest"
dbname=${1:-rptest}

echo Using database $dbname
echo Upload directory is $UPLOAD_DIRECTORY
echo Treasury directory is $TREASURY_DIRECTORY

pwd

mkdir -p $UPLOAD_DIRECTORY
rm -rf $UPLOAD_DIRECTORY/*
mkdir -p $TREASURY_DIRECTORY


FIXTURES_DIRECTORY="./tests/server-periods/fixtures"

psql -h localhost -U postgres -w postgres -c "DROP DATABASE IF EXISTS $dbname"
psql -h localhost -U postgres -w postgres -c "CREATE DATABASE $dbname"

# echo copying files
# cp ${FIXTURES_DIRECTORY}/treasury-reports/* $TREASURY_DIRECTORY

echo priming database
psql $dbname postgres < ${FIXTURES_DIRECTORY}/${dbname}.sql >/dev/null
