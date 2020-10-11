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

### Run tests'=

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
