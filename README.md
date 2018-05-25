# SMB2 Client for Node.js

[![npm version](https://badge.fury.io/js/%40tracker1%2Fsmb2.svg)](https://badge.fury.io/js/%40tracker1%2Fsmb2) [![Dependency Status](https://david-dm.org/tracker1/node-smb2.svg?theme=shields.io)](https://david-dm.org/tracker1/node-smb2)

## Introduction

This library is a simple implementation of SMB2 for Node.js. It allows you to access a SMB2 share as if you were using the native fs library.

**REQUIRES NODE 8.5 OR NEWER**

The development is still at an experimental stage and should not be yet considered for production environment.


## Installation

```bash
npm install -S @tracker1/smb2
```
or with yarn
```bash
yarn add @tracker1/smb2
```


## API

All API instance methods below (except `.close()`) will return a Promise.

All API methods may use unix-style path separators for ease of use, they may also use a leading slash, which will be stripped.

WARNING: methods from upstream versions support callbacks, and they remain as an artifact, future versions will break this behavior before 1.0.0


### new SMB2 ( options:object | share:string )
The SMB2 class is the constructor of your SMB2 client.

the parameter ```share``` supports an smb url string:

- `smb://username:password@hostname:port/share`
- Note: each part should be url encoded as necessary.  For domain users: `MyDomain\SomeUser` becomes `MyDomain%5CSomeUser` for the *username* part.

the parameter `options` accepts this list of attributes:

- `share` (mandatory): the share you want to access, this can be url encoded as above or simply `\\host\share`
- `domain` (mandatory): the domain of which the user is registred
- `username` (mandatory): the username of the user that access the share
- `password` (mandatory): the password
- `port` (optional): default `445`, the port of the SMB server
- `packetConcurrency` (optional): default `20`, the number of simulatanous packet when writting / reading data from the share
- `autoCloseTimeout` (optional): default `10000`, the timeout in milliseconds before to close the SMB2 session and the socket, if setted to `0` the connection will never be closed unless you do it 

Example:
```javascript
// load the library
var SMB2 = require('@tracker1/smb2');

// create an SMB2 instance
var smb2Client = new SMB2({
  share:'\\\\000.000.000.000\\c$'
, domain:'DOMAIN'
, username:'username'
, password:'password!'
});

// SMB2 instance using URI
var smb2Client = new SMB2('smb://DOMAIN%5Cusername:password!@0.0.0/c$');
```


### smb2Client.readdir ( path, [options] ) : Promise<FileInfo[]>
- ```path``` String
- ```options``` Object
    - ```regex``` Regex | Null default = null

Asynchronous readdir(3). Reads the contents of a directory. The list of files are returned and will have the following structure.

**FileInfo**

  - `filename`: String
  - `isDirectory`: boolean
  - `size`: Number
  - `fileCreationTime`: [ISO 8601 String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
  - `fileChangeTime`: "
  - `fileLastAccessTime`: "
  - `fileLastWriteTime`: "
  - `fileAttributes`: [File Attribute Constants](https://msdn.microsoft.com/fr-fr/library/windows/desktop/gg258117(v=vs.85).aspx)


Example:
```javascript
let options = {regex: /42isthesolution/i};
const files = await snb2Client.readdir('Windows/System32', options);
```


### smb2Client.readFile ( filename, [options] ) : Promise<String | Buffer>
- ```filename``` String
- ```options``` Object
    - ```encoding``` String | Null default = null

Asynchronously reads the entire contents of a file.

Example:
```javascript
const data = await smb2Client.readFile('path/to/my/file.txt');
```

If no encoding is specified, then the raw buffer is returned.


### smb2Client.writeFile ( filename, data, [options] ) : Promise
- ```filename``` String
- ```data``` String | Buffer
- ```options``` Object
    - ```encoding``` String | Null default = 'utf8'

Asynchronously writes data to a file, replacing the file if it already exists. data can be a string or a buffer.

The encoding option is ignored if data is a buffer. It defaults to 'utf8'.

Example:
```javascript
await smb2Client.writeFile('path/to/my/file.txt', 'Hello Node');
```


### smb2Client.mkdir ( path, [mode] ) : Promise
Asynchronous mkdir(2). Mode defaults to 0777.

Example:
```javascript
await smb2Client.mkdir('path/to/the/folder');
```


### smb2Client.rmdir ( path ) : Promise
Asynchronous rmdir(2).

Example:
```javascript
await smb2Client.rmdir('path/to/the/folder');
```


### smb2Client.exists ( path ) : Promise<Boolean>
Test whether or not the given path exists by checking with the file system.

Example:
```javascript
const exists = await smb2Client.exists('path/to/my/file.txt');
```


### smb2Client.unlink ( path ) : Promise
Asynchronous unlink(2).

Example:
```javascript
await smb2Client.unlink('path/to/my/file.txt');
```


### smb2Client.rename ( oldPath, newPath ) : Promise
Asynchronous rename(2).

Example:
```javascript
await smb2Client.rename('path/to/the/file.txt', 'new/path/to/my/new-file-name.txt');
```


### smb2Client.close ( )
This function will close the open connection if opened, it will be called automatically after ```autoCloseTimeout``` ms of no SMB2 call on the server.

Example:
```javascript
mb2Client.close(); // no promise returned
```


### smb2Client.createReadStream ( fileName, [options] ) : Promise<ReadableStream>
Returns a read stream on the file. Unlike fs.createReadStream, this function is asynchronous, as we need use asynchronous smb requests to get the stream.

Example:
```javascript
const readStream = await smb2Client.createReadStream('path/to/the/file');
```


### smb2Client.createWriteStream ( fileName, [options] ) : Promise<WriteableStream>
Returns a write stream on the file. Unlike fs.createWriteStream, this function is asynchronous, as we need use asynchronous smb requests to get the stream.

Example:
```javascript
const writeStream = await smb2Client.createWriteStream('path/to/the/file');
```


### smb2Client.ensureDir ( path ) : Promise
Ensures that the directory exists. If the directory structure does not exist, it is created.

Example:
```javascript
await smb2Client.ensureDir('path/to/the/directory');
```


## Contributors (alphabetical order)
- [Benjamin Chelli](https://github.com/bchelli)
- [David Turbert](https://github.com/dcyou)
- [Fabrice Marsaud](https://github.com/marsaud)
- [Julien Fontanet](https://github.com/julien-f)
- [Michael J. Ryan](https://github.com/tracker1)
- [Nicolas Raynaud](https://github.com/nraynaud)
- [Peter Verkoyen](https://github.com/petvek)
- [Ronan Abhamon](https://github.com/Wescoeur/)
- [Victor Diez](https://github.com/vdiez)

## References

    The[MS-SMB2]: Server Message Block (SMB) Protocol Versions 2 and 3
    Copyright (C) 2014 Microsoft
    http://msdn.microsoft.com/en-us/library/cc246482.aspx

## License

(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
