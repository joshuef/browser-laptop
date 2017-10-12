const path = require('path');
// const safeApp = require('@maidsafe/safe-node-app');
const urlParse = require('url').parse;
const mime = require('mime');
// const ipc = require('./api/ipc');
/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved */
const protocol = require('electron').protocol;
const app = require('electron').app;
// const safeAppNeon = require('safe_app_neon');
const ipcMain = require('electron').ipcMain;
const fetch = require('isomorphic-fetch');
const fs = require('fs');

global.appPath = app.getAppPath();


const appInfo = {
  id: "test.id.neon",
  vendor: "MAIDSAFE",
  name: "TEST APP",
  scope: null,
  icon: "test",
  exec: process.execPath
}

const permissions = {
  _public: [
    'Read',
    'Insert',
    'Update',
    'Delete',
    'ManagePermissions'
  ],
  _publicNames: [
    'Read',
    'Insert',
    'Update',
    'Delete',
    'ManagePermissions'
  ]
};

const ownContainer = true;


// SAFE: Express server to serve the js/wasm assets.
// Access control origin required to enable  http acess from safe: protocol.
//
// TODO:
//
// We should check that the request is coming from SAFE: sites. This could be done here, or onBeforeRequest
// checking the firstPartyUrl property of the details object
const express = require('express')
const server = express()

server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
server.use(express.static(`${app.getAppPath()}/app/safe`))
server.listen(3017, function () {
  console.log('Example app listening on port 3017!')
})




// const errorTemplate = require('./error-template.ejs');
// const safeCss = require('./safe-pages.css');

console.log("LOADING SAFE PROToCOL FILE");
const safeScheme = 'safe';
const safeLocalScheme = 'localhost';
const safeLogScheme = 'safe-logs';

const isDevMode = process.execPath.match(/[\\/]electron/);

const fetchData = (url) => {
  if (!appObj) {
    return Promise.reject(new Error('Unexpected error. SAFE App connection not ready'));
  }
  return appObj.webFetch(url);
};


const handleError = (err, mimeType, cb) => {
  // err.css = safeCss;

  const page = 'ups';
  // const page = errorTemplate(err);

  if (mimeType === 'text/html') {
    return cb({ mimeType, data: new Buffer(page) });
  }
  return cb({ mimeType, data: new Buffer(err.message) });
};


const registerSafeLocalProtocol = () => {
  protocol.registerHttpProtocol(safeLocalScheme, (req, cb) => {
    const parsed = urlParse(req.url);

    if (!parsed.host) { return; }

    const path = parsed.pathname;
    const port = parsed.port;
    const newUrl = `http://localhost:${port}${path}`;

    cb({ url: newUrl });
  });
};

const setupSafeBrowsing = () => {
  console.log("trying to register SAFE://");

  const wasmjs = `${app.getAppPath()}/app/safe/wasm_demo-b9dd1cf10ee92da1.js`;
  const preloadjs = `${app.getAppPath()}/app/safe/preload.js`;

  let wasmString = fs.readFileSync( wasmjs , "utf8");
  let preloadString = fs.readFileSync( preloadjs , "utf8");


  protocol.registerBufferProtocol(safeScheme, (req, cb) => {
    const parsedUrl = urlParse(req.url);
    const fileExt = 'html';
    // const fileExt = path.extname(path.basename(parsedUrl.pathname)) || 'html';
    const mimeType = mime.getType(fileExt);

    let data;
    console.log("urlllll", mimeType, parsedUrl );

    // SAFE: Serving _something_ here. That's all. The key is injecting the wasm and serving from out own express
    // instance.
    //
    // TODO: Set the javascript to pull from express server rather than fs parsing to string.
    fetch( `http://127.0.0.1:8082`)
    .then( res =>
    {
      console.log("got respon") ;

      if( mimeType === 'text/html' )
      {
        // SAFE: So here we're replacing the opening HEAD tag with another HEAD with our plreloadjs and rust wasm
        // incporporated as <script> tags.
        res.text()
        .then( htmlString =>
        {
          htmlString = htmlString.replace( '<head>',
                `<head>
                <script type="text/javascript">${preloadString}</script>
                <script type="text/javascript">${wasmString}</script>
                `
              )

          cb({ mimeType, data: Buffer.from( htmlString ) })
        })

      }
      else
      {
        cb({cancel: true})
      }

    })
    .catch( e => { console.error('eeee===>>>',e) })

  });
};

// const registerSafeLogs = () => {
//   return authoriseApp()
//     .then(() => setupSafeLogProtocol(appObj));
// };

module.exports = setupSafeBrowsing;
