#!/bin/bash

# Default dbname is "rptest"
dbname=${1:-rptest}
echo Updating database ${dbname}

echo POSTGRES_URL abc is $POSTGRES_URL
# The actual directory of this file.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# set -x
set -e
echo DIR is ${DIR}
FIXTURES_DIRECTORY="${DIR}/fixtures"

# Import .env variables if not already defined.
DOTENV="$(pwd)/.env"
echo Getting environment from $DOTENV

source /dev/stdin <<DONE
$(grep -v '^#' $DOTENV | sed -E 's|^(.+)=(.*)|: ${\1=\2}; export \1|g')
DONE

echo environment database is $POSTGRES_URL

echo Upload directory is $UPLOAD_DIRECTORY
echo Treasury directory is $TREASURY_DIRECTORY

echo PWD is $(pwd)

mkdir -p $UPLOAD_DIRECTORY
rm -rf $UPLOAD_DIRECTORY/*
mkdir -p $TREASURY_DIRECTORY

echo readlink $(readlink) = $FIXTURES_DIRECTORY

psql -h localhost -U postgres -w postgres -c "DROP DATABASE IF EXISTS $dbname"
psql -h localhost -U postgres -w postgres -c "CREATE DATABASE $dbname"

# echo copying files
# cp ${FIXTURES_DIRECTORY}/treasury-reports/* $TREASURY_DIRECTORY

echo priming database
# psql $dbname postgres < ${FIXTURES_DIRECTORY}/${dbname}.sql >/dev/null
