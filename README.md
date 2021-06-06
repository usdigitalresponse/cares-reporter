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

### Set up Notifications email account

There is detailed documentation for email setup at https://github.com/usdigitalresponse/cares-reporter/wiki/Setting-up-Email-notifications.

To send system notification emails, Cares-Reporter can use either AWS-SES or Nodemailer, which uses a regular email account to send notifications. Either way the account credentials are specified in the environment so as to exclude them from Git commits. For testing this is done in a .env file; for deployment it is done in the Environment tab of the Render.com dashboard.

At runtime the system scans the environment for AWS credentials first, then if it can't find them, Nodemailer credentials.

See the project Wiki on Github for how to set up the notification email service in the production environment. Read on to see how to set it up in your development environment for testing.

The test environment uses an existing dedicated Gmail account - "caresreportertest@gmail.com."

Before running the tests you need to add .env files to the tests/server-aws-ses and tests/server-nodemailer directories on your development system.

1. Copy tests/server-nodemailer/env to tests/server-nodemailer/.env and populate the `NOTIFICATIONS_EMAIL_PW` key. Ask one of the other developers for this password.

1. Copy tests/server-aws-ses/env to tests/server-aws-ses/.env and populate the `SES\_REGION`, `AWS\_ACCESS\_KEY\_ID` and `AWS\_SECRET\_ACCESS_KEY` keys. Ask one of the other developers for these keys.

The tests are invoked from the project root directory with:

`$ yarn test:server-nodemailer`

`$ yarn test:server-aws-ses`

These Yarn commands are specified in the package.json file.

