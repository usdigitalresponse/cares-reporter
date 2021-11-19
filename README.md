[![Code of Conduct](https://img.shields.io/badge/%E2%9D%A4-code%20of%20conduct-blue.svg?style=flat)](./CODE_OF_CONDUCT.md)

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
To send system notification emails, Cares-Reporter can use either AWS-SES or Nodemailer, which uses a regular email account to send notifications. Either way the account credentials are excluded from Git commits. Email settings are specified in the environment. For testing this is done in a .env file; for deployment it is done in the Environment tab of the Render.com dashboard.

The tests are invoked from the project root directory with:

`$ yarn test:server-nodemailer`

`$ yarn test:server-aws-ses`

These Yarn commands are specified in the package.json file. 

Setting up AWS is somewhat more complicated than setting up Nodemailer. The test environment tests both, but before running the tests you need to add .env files to the tests/server-aws-ses and tests/server-nodemailer directories on your development system. You can just rename the 'env' files in those directories and add the credentials.

At runtime the system scans the environment for AWS credentials first, then if it can't find them, Nodemailer credentials.

#### To use a regular email account
The test environment uses an existing dedicated Gmail account - "caresreportertest@gmail.com." When a customer deploys Cares-Reporter in production they will need to supply their own email account. To use Nodemailer, add the following keys to the environment. 

`NODEMAILER_HOST e.g. "smtp.gmail.com"`

`NODEMAILER_PORT e.g. 465`

`NOTIFICATIONS_EMAIL - this is the From: address for all notifications`

`NOTIFICATIONS_EMAIL_PW - this is the password for the From: address`

#### To use AWS-SES
The test environment uses USDR's AWS credentials, but when a customer deploys Cares-Reporter in production, they will need to perform the following steps to implement AWS-SES.

1. Set up a new email address on an existing mail server to use as the From: address for sending notifications (this will be the `NOTIFICATIONS_EMAIL` in the Render Service Environment).

1. Verify that email for SES.

1. Generate the IAM credentials for sending email (these will be the `SES\_REGION`, the `AWS\_ACCESS\_KEY\_ID` and the `AWS\_SECRET\_ACCESS_KEY` in the Render Service Environment).

1. Submit an AWS customer support request to move the account out of SES Sandbox mode.

1. Submit a separate ticket to request a fixed IP address for SES.

1. Once those tickets are resolved, enter the credentials and email address to the execution environment.


## Code of Conduct

This repository falls under [U.S. Digital Response’s Code of Conduct](./CODE_OF_CONDUCT.md), and we will hold all participants in issues, pull requests, discussions, and other spaces related to this project to that Code of Conduct. Please see [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for the full code.


## Contributing

This project wouldn’t exist without the hard work of many people. Thanks to the following for all their contributions! Please see [`CONTRIBUTING.md`](./CONTRIBUTING.md) to find out how you can help.

**Lead Maintainer:** [NAME HERE (@GITHUB_HANDLE)](https://github.com/GITHUB_HANDLE)


## License & Copyright

Copyright (C) 2020-2021 U.S. Digital Response (USDR)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this software except in compliance with the License. You may obtain a copy of the License at:

[`LICENSE`](./LICENSE) in this repository or http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.