'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.analyzeArchive = analyzeArchive;
exports._isDirectory = _isDirectory;
exports.extractArchive = extractArchive;

var _yauzl = require('yauzl');

var _yauzl2 = _interopRequireDefault(_yauzl);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _fs = require('fs');

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns an array of package objects. There will be one for each of
 *  package.json files in the archive
 *
 * @param {string} archive - path to plugin archive zip file
 */

function analyzeArchive(archive) {
  const plugins = [];
  const regExp = new RegExp('(kibana[\\\\/][^\\\\/]+)[\\\\/]package\.json', 'i');

  return new Promise((resolve, reject) => {
    _yauzl2.default.open(archive, { lazyEntries: true }, function (err, zipfile) {
      if (err) {
        return reject(err);
      }

      zipfile.readEntry();
      zipfile.on('entry', function (entry) {
        const match = entry.fileName.match(regExp);

        if (!match) {
          return zipfile.readEntry();
        }

        zipfile.openReadStream(entry, function (err, readable) {
          const chunks = [];

          if (err) {
            return reject(err);
          }

          readable.on('data', chunk => chunks.push(chunk));

          readable.on('end', function () {
            const contents = Buffer.concat(chunks).toString();
            const pkg = JSON.parse(contents);

            plugins.push(Object.assign(pkg, {
              archivePath: match[1],
              archive: archive,

              // Plugins must specify their version, and by default that version should match
              // the version of kibana down to the patch level. If these two versions need
              // to diverge, they can specify a kibana.version to indicate the version of
              // kibana the plugin is intended to work with.
              kibanaVersion: (0, _lodash.get)(pkg, 'kibana.version', pkg.version)
            }));

            zipfile.readEntry();
          });
        });
      });

      zipfile.on('close', () => {
        resolve(plugins);
      });
    });
  });
}

const isDirectoryRegex = /(\/|\\)$/;
function _isDirectory(filename) {
  return isDirectoryRegex.test(filename);
}

function extractArchive(archive, targetDir, extractPath) {
  return new Promise((resolve, reject) => {
    _yauzl2.default.open(archive, { lazyEntries: true }, function (err, zipfile) {
      if (err) {
        return reject(err);
      }

      zipfile.readEntry();
      zipfile.on('close', resolve);
      zipfile.on('entry', function (entry) {
        let fileName = entry.fileName;

        if (extractPath && fileName.startsWith(extractPath)) {
          fileName = fileName.substring(extractPath.length);
        } else {
          return zipfile.readEntry();
        }

        if (targetDir) {
          fileName = _path2.default.join(targetDir, fileName);
        }

        if (_isDirectory(fileName)) {
          (0, _mkdirp2.default)(fileName, function (err) {
            if (err) {
              return reject(err);
            }

            zipfile.readEntry();
          });
        } else {
          // file entry
          zipfile.openReadStream(entry, function (err, readStream) {
            if (err) {
              return reject(err);
            }

            // ensure parent directory exists
            (0, _mkdirp2.default)(_path2.default.dirname(fileName), function (err) {
              if (err) {
                return reject(err);
              }

              readStream.pipe((0, _fs.createWriteStream)(fileName));
              readStream.on('end', function () {
                zipfile.readEntry();
              });
            });
          });
        }
      });
    });
  });
}
