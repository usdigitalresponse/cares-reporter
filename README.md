# cares-reporter

## Project setup

Copy `.env.example` to `.env` and customize as appropriate.

```
yarn install
yarn knex migrate:latest
yarn knex seed:run
```

Then navigate to the app home page (probably http://localhost:8080), and submit your email address.
This first email address will be the initial "admin" user for site.

### Compiles and hot-reloads for development
```
yarn serve
```

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
