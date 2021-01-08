#!/bin/bash

# The actual directory of this file.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# set -x
set -e

FIXTURES_DIRECTORY="${DIR}/fixtures"

dbname="${POSTGRES_URL##*/}"
# Default dbname is "rptest"
# dbname=${1:-rptest}
# echo Updating database ${dbname}

# Import .env variables if not already defined.
# DOTENV="$(pwd)/.env"
DOTENV="${FIXTURES_DIRECTORY}/${dbname}.env"
# echo DOTENV file is ${DOTENV}
source /dev/stdin <<DONE
$(grep -v '^#' $DOTENV | sed -E 's|^(.+)=(.*)|: ${\1=\2}; export \1|g')
DONE

# echo Upload directory is $UPLOAD_DIRECTORY
# echo Treasury directory is $TREASURY_DIRECTORY

mkdir -p $UPLOAD_DIRECTORY
rm -rf $UPLOAD_DIRECTORY/*
mkdir -p $TREASURY_DIRECTORY

psql -h localhost -U postgres -w postgres -c "DROP DATABASE IF EXISTS $dbname" > /dev/null
psql -h localhost -U postgres -w postgres -c "CREATE DATABASE $dbname" > /dev/null

# echo copying files
# cp ${FIXTURES_DIRECTORY}/treasury-reports/* $TREASURY_DIRECTORY

# echo priming database
# echo "psql $dbname postgres < ${FIXTURES_DIRECTORY}/${dbname}.sql >/dev/null"
psql $dbname postgres < ${FIXTURES_DIRECTORY}/${dbname}.sql >/dev/null
