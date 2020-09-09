#!/bin/bash

dbname=$1

# set -x
set -e 

mkdir -p $UPLOAD_DIRECTORY
rm -rf "$UPLOAD_DIRECTORY/*"
psql -h localhost -U postgres -w postgres -c "DROP DATABASE IF EXISTS $dbname"
psql -h localhost -U postgres -w postgres -c "CREATE DATABASE $dbname"
yarn knex migrate:latest
yarn knex seed:run


