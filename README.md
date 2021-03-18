# cares-reporter

## Developer documentation
This readme.md page explains how to set up your development environment. Documentation for sysadmins is at https://github.com/usdigitalresponse/cares-reporter/wiki/Home.

## Project setup
You will need a Postgres database running on the same machine.

Copy `.env.example` to `.env` and customize as appropriate.
* CARES Reporter uses email in its authentication, and is set up to use AWS Simple Email Service.  Enter the AWS Access Key and Secret in `.env`.
* In particular you'll want to enter your initial admin email addresses.  Note: the same email cannot be used as both an admin account and a user account.

```
yarn install
yarn knex migrate:latest
yarn knex seed:run
mkdir uploads ## (a gitignored folder for uploaded files)
```

Additional dummy data can be added with
```
node ./tests/server/fixtures/add-dummy-data.js
```

And the whole local testing database can be reset with:
```
./tests/server/reset-db.sh
```

### Compiles and hot-reloads for development
```
yarn serve
```

Then navigate to the specified app home page (probably http://localhost:8080)

This will initially redirect to a login page and you will be prompted for an email address. A one time use access code link will be sent to your email address. Clicking the link will store an access token as a cookie which will enable access to the app.

### Compiles and minifies for production
```
yarn build
```

### Run tests

#### Unit
```
yarn test:unit
```

#### Server Unit and Integration
```
yarn test:server [specific test file]
```


### Lints and fixes files
```
yarn lint
```

### Customize Vue configuration
See [Vue Configuration Reference](https://cli.vuejs.org/config/).
