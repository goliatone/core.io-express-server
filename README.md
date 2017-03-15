## core.io-express

Express server module.


### Config

- `port`:
    - `process.env.PORT`
    - `process.env.NODE_APP_PORT`
    - 3000
- `basedir`: Used to create the path to `views` and `public`.
- `locals`: It will be made available to all requests through [app.locals](http://expressjs.com/en/api.html#app.locals).
- `routeLocas`:  Specify locals per route. Example:
```js
routeLocals: {
    '/admin': {
        layout: require('path').resolve('./modules/dashboard/views/layout.ejs')
    }
}
```

### TODO
- [ ] Handle unique assets, like favicon.
    config: { favicon: <ABSOLUTE_PATH>}
- [ ] Provide a way to override layout for error.ejs
- [ ] Default app: take config options
    - merge middleware

<!--
Integrate with:
For the API part. Or maybe just the CRUD module?
https://github.com/apiaryio/dredd

https://apiblueprint.org/tools.html

https://github.com/expressjs/vhost

Create responses:
res.ok();
res.send404();
res.sendError();

https://github.com/balderdashy/sails/blob/e7947170dd60a96fb5cdac2ab00de170d6854074/lib/hooks/responses/defaults/notFound.js

https://github.com/selcukfatihsevinc/app.io
-->
