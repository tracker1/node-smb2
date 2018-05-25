const FileTime = require('win32filetime');

const SMB2Forge = require('../tools/smb2-forge');
const SMB2Request = SMB2Forge.request;

const FILE_ATTRIBUTE_DIRECTORY = 16; // https://msdn.microsoft.com/fr-fr/library/windows/desktop/gg258117(v=vs.85).aspx

const bufferToInt = buf =>(buf.readUInt32LE(4) << 8) + buf.readUInt32LE(0);

const bufferToDate = buf => {
  const low = buf.readUInt32LE(0);
  const high = buf.readUInt32LE(4);
  return FileTime.toDate({low: low, high: high}).toISOString()
};


/*
 * readdir
 * =======
 *
 * list the file / directory from the path provided:
 *
 *  - open the directory
 *
 *  - query directory content
 *
 *  - close the directory
 *
 */
module.exports = function(path, options, cb) {
  path = path.split(/[\\\/]+/g).filter(p => p).join('\\');
  const connection = this;

  if (typeof options == 'function') {
    cb = options;
    options = {};
  }

  // SMB2 open directory
  SMB2Request('open', { path: path }, connection, function(err, file) {
    if (err) cb && cb(err);
    else
      // SMB2 query directory
      SMB2Request('query_directory', file, connection, function(err, files) {
        if (err && err.code != 'STATUS_NO_MORE_FILES') cb && cb(err);
        else goonQueryDir(file, connection, files, options, cb);
        //if(err) cb && cb(err);
        // SMB2 close directory
        //else SMB2Request('close', file, connection, function(err){
        //  cb && cb(
        //    null
        //  , files
        //      .map(function(v){ return v.Filename }) // get the filename only
        //      .filter(function(v){ return v!='.' && v!='..' }) // remove '.' and '..' values
        //  );
        //});
      });
  });
};

function goonQueryDir(file, connection, files, options, cb) {
  var newParams = file;
  newParams.FileIndex = files.length - 1;
  SMB2Request('query_directory_goon', file, connection, function(err, newFiles) {
    var currentFiles = newFiles ? files.concat(newFiles) : files;
    if (err) {
      if (err.code != 'STATUS_NO_MORE_FILES') {
        cb && cb(err);
      } else {
        // SMB2 close directory
        SMB2Request('close', file, connection, function(err) {
          cb &&
            cb(
              err,
              currentFiles
                .filter(v => {
                  // remove '.' and '..' values.
                  if (v.Filename === '.' || v.Filename === '..') {
                    return false;
                  }
                  return options.regex ? options.regex.test(v.Filename) : true;
                })
                .map(v => ({
                  fileChangeTime: bufferToDate(v.ChangeTime),
                  fileLastAccessTime: bufferToDate(v.LastAccessTime),
                  fileLastWriteTime: bufferToDate(v.LastWriteTime),
                  fileCreationTime: bufferToDate(v.CreationTime),
                  fileAttributes: v.FileAttributes,
                  isDirectory: v.FileAttributes & FILE_ATTRIBUTE_DIRECTORY ? true : false,
                  filename: v.Filename,
                  size: bufferToInt(v.EndofFile),
                })),
            );
        });
      }
    } else {
      goonQueryDir(file, connection, currentFiles, options, cb);
    }
  });
}
