# V30.35.0 QA Status

## PASS
- `npm run qa:v335`
- `npm run qa:v334`
- `npm run qa:v333`
- `npm run qa:v332`
- `node qa/qa_v331_button_actions.js`
- `npm run qa:current`
- `npm run qa:render`
- Node syntax checks for V30.35 client/server and full current source set

## Runtime smoke in this build container
`npm run qa:runtime` could not be completed because the clean `npm ci` dependency installation timed out in the build container and left no usable installed dependency tree. The failure occurred before application startup (`Cannot find module 'express'`), not from a V30.35 application exception. The incomplete `node_modules` directory was removed before packaging. Deployment/local startup should perform the normal clean install from `package-lock.json` and then run `npm run qa:runtime`.
