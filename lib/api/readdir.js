

var SMB2Forge = require('../tools/smb2-forge')
  , SMB2Request = SMB2Forge.request
  ;

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
module.exports = function(path, cb){
  var connection = this;

  // SMB2 open directory
  SMB2Request('open', {path:path}, connection, function(err, file){
    if(err) cb && cb(err);
    // SMB2 query directory
    else SMB2Request('query_directory', file, connection, function(err, files){
      
      if(err && err.code != 'STATUS_NO_MORE_FILES') 
        cb && cb(err);
      else
        goonQueryDir(file, connection, files, cb)
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
  
}

function goonQueryDir(file, connection, files, cb){
  var newParams = file;
      newParams.FileIndex = files.length - 1;
  SMB2Request('query_directory1', file, connection, function(err, newFiles){
      console.log(err);
      var currentFiles = newFiles ? files.concat(newFiles): files;
      if(err){ 
          if(err.code != 'STATUS_NO_MORE_FILES') cb && cb(err);
          //
          else
        // SMB2 close directory
         SMB2Request('close', file, connection, function(err){
          cb && cb(
            null
          , currentFiles
              .map(function(v){ return v.Filename }) // get the filename only
              .filter(function(v){ return v!='.' && v!='..' }) // remove '.' and '..' values
          );
        });
      } else{
          goonQueryDir(file, connection, currentFiles, cb)
       }
    });
}


