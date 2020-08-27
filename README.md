# cares-reporter

## Project setup

Copy `.env.example` to `.env` and customize as appropriate.
In particular you'll want to enter your initial admin email addresses.

```
yarn install
yarn knex migrate:latest
yarn knex seed:run
mkdir uploads ## (a gitignored folder for uploaded files)
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

### Run your unit tests
```
yarn test:unit
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
