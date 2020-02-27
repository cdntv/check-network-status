function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const http = require('http');

const https = require('https');

const URL = require('url');

const debug = require('debug')('check-network-status');

const defaults = {
  timeout: 4500,
  backUpURL: null,
  pingDomain: 'google.com',
  method: 'GET'
};

const getNetworkCheckURL = pingDomain => {
  if (pingDomain && typeof pingDomain === 'string') {
    return `https://cloudflare-dns.com/dns-query?name=${pingDomain}&type=A&_=${Date.now()}`;
  } else {
    throw new Error("Invalid Parameters");
  }
};

const makeRequest = (url, timeout, method) => {
  if (url && timeout && method) {
    return new Promise((resolve, reject) => {
      let timerID = setTimeout(() => {
        req && req.abort && req.abort();
        reject(new Error(`Request Timed out ${timeout}ms`));
      }, timeout);
      let _request = http.request;
      let options = URL.parse(url);

      if (options.protocol && options.protocol.includes('https')) {
        _request = https.request;
      }

      options.headers = {
        'Cache-Control': 'no-cache'
      };
      options.method = method;

      if (url.includes('https://cloudflare-dns.com/dns-query')) {
        options.headers = _objectSpread({}, options.headers, {
          accept: 'application/dns-json'
        });
      }

      var req = _request(options, res => {
        debug(`Response Status Code: ${res.statusCode}`);

        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          reject(new Error("Request Failed..."));
        }

        clearTimeout(timerID);
      }).on('error', e => {
        debug(`error=> ${e.message}`);
        reject(new Error("Request Failed..."));
        clearTimeout(timerID);
      });

      req.end();
    });
  } else {
    throw new Error("Invalid Parameters");
  }
};

const checkReachability = async (url, timeout, method) => {
  if (url && timeout && method) {
    try {
      return await makeRequest(url, timeout, method);
    } catch (e) {
      debug(`Error with ${url}: ${e.message}`);
      return false;
    }
  } else {
    throw new Error("Invalid Parameters");
  }
};

const checkNetworkStatus = async options => {
  options = _objectSpread({}, defaults, {}, options);
  const NETWORK_CHECK_URL = getNetworkCheckURL(options.pingDomain);
  let response = await checkReachability(NETWORK_CHECK_URL, options.timeout, defaults.method);

  if (!response && options.backUpURL) {
    response = await checkReachability(options.backUpURL, options.timeout, options.method);
  }

  return response;
};

module.exports = {
  makeRequest,
  checkReachability,
  checkNetworkStatus,
  getNetworkCheckURL
};
