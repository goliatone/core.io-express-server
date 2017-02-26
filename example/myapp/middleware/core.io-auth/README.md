## core.io-auth


#### Routes

- `GET  /login`: Show login form.
- `POST /login`: Handle local strategy login.
- `GET  /logout`: Destroy session.
- `GET  /signup`: Show signup form.
- `POST /signup`:
- `GET /auth/:`


- `POST /register`: 'UserController.create',
- `POST /logout`:  'AuthController.logout',

- `POST /auth/local`: 'AuthController.callback',
- `POST /auth/local/:action`: 'AuthController.callback',

- `POST /auth/:provider`: 'AuthController.callback',
- `POST /auth/:provider/:action`: 'AuthController.callback',

- `GET /auth/:provider`: 'AuthController.provider',
- `GET /auth/:provider/callback`: 'AuthController.callback',
- `GET /auth/:provider/:action`: 'AuthController.callback'
