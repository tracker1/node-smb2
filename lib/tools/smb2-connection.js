/*
 * DEPENDENCIES
 */
var net = require('net'),
  SMB2Forge = require('./smb2-forge'),
  SMB2Request = SMB2Forge.request;

/*
 * CONNECTION MANAGER
 */
var SMB2Connection = (module.exports = {});

/*
 * CLOSE CONNECTION
 */
SMB2Connection.close = function(connection) {
  clearAutoCloseTimeout(connection);
  if (connection.connected) {
    connection.connected = false;
    connection.socket.end();
  }
};

/*
 * OPEN CONNECTION
 */
SMB2Connection.requireConnect = function(method) {
  return function() {
    var connection = this;
    var args = Array.prototype.slice.call(arguments);

    // setup deferred promise for response
    var resolve, reject;
    var promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // process the cb
    var callback = args.pop();
    if (typeof cb !== 'function') {
      args.push(callback);
    } else {
      promise.then(r => callback(null, r), cb);
    }

    var cb = (err, result) => {
      if (err) {
        if (!err instanceof Error) {
          err = new Error(String(err));
        }
        return reject(err);
      }
      return resolve(result);
    };

    cb = scheduleAutoClose(connection, cb);
    args.push(cb);

    if (connection.connected) {
      method.apply(connection, args);
      return promise;
    }

    function error_callback(err) {
      if (connection.errorHandler.length > 0) {
        connection.errorHandler[0].call(null, err);
      }
      if (connection.debug) {
        console.log('-- error');
        console.log(arguments);
      }
    }

    connection.socket = new net.Socket({ allowHalfOpen: true });
    // open TCP socket
    connection.socket.connect(connection.port, connection.ip);

    // attach data events to socket
    connection.socket.on('data', SMB2Forge.response(connection));
    connection.socket.on('lookup', function(err, address, family, host) {
      if (err) error_callback(err);
    });
    connection.socket.on('timeout', function() {
      error_callback('Timeout');
    });
    connection.socket.on('end', function() {
      error_callback('Ended');
    });
    connection.socket.on('close', function(error) {
      if (error) error_callback(error);
    });
    connection.socket.on('error', error_callback);
    connection.socket.on('connect', function() {
      // SMB2 negotiate connection
      SMB2Request('negotiate', {}, connection, function(err) {
        if (err) {
          return cb(err);
        }
        // SMB2 setup session / negotiate ntlm
        SMB2Request('session_setup_step1', {}, connection, function(err) {
          if (err) {
            return cb(err);
          }

          // SMB2 setup session / autheticate with ntlm
          SMB2Request('session_setup_step2', {}, connection, function(err) {
            if (err) {
              return cb(err);
            }

            // SMB2 tree connect
            SMB2Request('tree_connect', {}, connection, function(err) {
              if (err) {
                return cb(err);
              }

              connection.connected = true;
              method.apply(connection, args);
            });
          });
        });
      });
    });

    return promise;
  };
};

/*
 * INIT CONNECTION
 */
SMB2Connection.init = function(connection) {
  // create a socket
  connection.connected = false;
  connection.errorHandler = [];
};

/*
 * PRIVATE FUNCTION TO HANDLE CLOSING THE CONNECTION
 */
function clearAutoCloseTimeout(connection) {
  if (connection.scheduledAutoClose) {
    clearTimeout(connection.scheduledAutoClose);
    connection.scheduledAutoClose = null;
  }
}
function setAutoCloseTimeout(connection) {
  clearAutoCloseTimeout(connection);
  if (connection.autoCloseTimeout != 0) {
    connection.scheduledAutoClose = setTimeout(function() {
      connection.close();
    }, connection.autoCloseTimeout);
  }
}
function scheduleAutoClose(connection, cb) {
  addErrorListener(connection, cb);
  clearAutoCloseTimeout(connection);
  return function() {
    removeErrorListener(connection);
    setAutoCloseTimeout(connection);
    cb.apply(null, arguments);
  };
}

/*
 * PRIVATE FUNCTIONS TO HANDLE ERRORS
 */
function addErrorListener(connection, callback) {
  connection.errorHandler.unshift(callback);
}
function removeErrorListener(connection) {
  connection.errorHandler.shift();
}
