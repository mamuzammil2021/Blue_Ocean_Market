# V26.1 dependency check

Declared runtime dependencies:
- express ^5.1.0
- better-sqlite3 ^11.10.0
- bcryptjs ^2.4.3
- jsonwebtoken ^9.0.2
- multer ^2.0.2

The source tree does not include `node_modules` by design.

Static JavaScript checks pass for server/db/client files and the existing QA suite passes.

A live `npm install --ignore-scripts` was attempted in the verification environment but could not complete before the environment timeout. Therefore no claim is made that dependencies were installed or that a live HTTP server was executed here. On the target Mac, run `npm install` in the project directory before `npm start`.
