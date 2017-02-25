## core.io-express

Express server module.


### Config

- `port`:
    - `process.env.PORT`
    - `process.env.NODE_APP_PORT`
    - 3000
- `basedir`: Used to create the path to `views` and `public`.

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
-->
