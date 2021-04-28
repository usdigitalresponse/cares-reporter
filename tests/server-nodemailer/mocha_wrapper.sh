#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
echo $DIR
cd $DIR

if [ ! -f "./.env" ]; then
    echo ""
    echo "    You need a .env file in this directory to run this test."
    echo "    Just copy the env file into .env and fill in the blanks."
    echo ""
    exit
fi

mocha --require=mocha_init.js nodemailer.spec.js


