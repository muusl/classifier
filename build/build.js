(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/home/henry/work/Project/classifier/build/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 15);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("zlib");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {

  PNG_SIGNATURE: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],

  TYPE_IHDR: 0x49484452,
  TYPE_IEND: 0x49454e44,
  TYPE_IDAT: 0x49444154,
  TYPE_PLTE: 0x504c5445,
  TYPE_tRNS: 0x74524e53, // eslint-disable-line camelcase
  TYPE_gAMA: 0x67414d41, // eslint-disable-line camelcase

  // color-type bits
  COLORTYPE_GRAYSCALE: 0,
  COLORTYPE_PALETTE: 1,
  COLORTYPE_COLOR: 2,
  COLORTYPE_ALPHA: 4, // e.g. grayscale and alpha

  // color-type combinations
  COLORTYPE_PALETTE_COLOR: 3,
  COLORTYPE_COLOR_ALPHA: 6,

  COLORTYPE_TO_BPP_MAP: {
    0: 1,
    2: 3,
    3: 1,
    4: 2,
    6: 4
  },

  GAMMA_DIVISION: 100000
};

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("stream");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var util = __webpack_require__(0);
var Stream = __webpack_require__(3);

var ChunkStream = module.exports = function () {
  Stream.call(this);

  this._buffers = [];
  this._buffered = 0;

  this._reads = [];
  this._paused = false;

  this._encoding = 'utf8';
  this.writable = true;
};
util.inherits(ChunkStream, Stream);

ChunkStream.prototype.read = function (length, callback) {

  this._reads.push({
    length: Math.abs(length), // if length < 0 then at most this length
    allowLess: length < 0,
    func: callback
  });

  process.nextTick(function () {
    this._process();

    // its paused and there is not enought data then ask for more
    if (this._paused && this._reads.length > 0) {
      this._paused = false;

      this.emit('drain');
    }
  }.bind(this));
};

ChunkStream.prototype.write = function (data, encoding) {

  if (!this.writable) {
    this.emit('error', new Error('Stream not writable'));
    return false;
  }

  var dataBuffer;
  if (Buffer.isBuffer(data)) {
    dataBuffer = data;
  } else {
    dataBuffer = new Buffer(data, encoding || this._encoding);
  }

  this._buffers.push(dataBuffer);
  this._buffered += dataBuffer.length;

  this._process();

  // ok if there are no more read requests
  if (this._reads && this._reads.length === 0) {
    this._paused = true;
  }

  return this.writable && !this._paused;
};

ChunkStream.prototype.end = function (data, encoding) {

  if (data) {
    this.write(data, encoding);
  }

  this.writable = false;

  // already destroyed
  if (!this._buffers) {
    return;
  }

  // enqueue or handle end
  if (this._buffers.length === 0) {
    this._end();
  } else {
    this._buffers.push(null);
    this._process();
  }
};

ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;

ChunkStream.prototype._end = function () {

  if (this._reads.length > 0) {
    this.emit('error', new Error('There are some read requests waiting on finished stream'));
  }

  this.destroy();
};

ChunkStream.prototype.destroy = function () {

  if (!this._buffers) {
    return;
  }

  this.writable = false;
  this._reads = null;
  this._buffers = null;

  this.emit('close');
};

ChunkStream.prototype._processReadAllowingLess = function (read) {
  // ok there is any data so that we can satisfy this request
  this._reads.shift(); // == read

  // first we need to peek into first buffer
  var smallerBuf = this._buffers[0];

  // ok there is more data than we need
  if (smallerBuf.length > read.length) {

    this._buffered -= read.length;
    this._buffers[0] = smallerBuf.slice(read.length);

    read.func.call(this, smallerBuf.slice(0, read.length));
  } else {
    // ok this is less than maximum length so use it all
    this._buffered -= smallerBuf.length;
    this._buffers.shift(); // == smallerBuf

    read.func.call(this, smallerBuf);
  }
};

ChunkStream.prototype._processRead = function (read) {
  this._reads.shift(); // == read

  var pos = 0;
  var count = 0;
  var data = new Buffer(read.length);

  // create buffer for all data
  while (pos < read.length) {

    var buf = this._buffers[count++];
    var len = Math.min(buf.length, read.length - pos);

    buf.copy(data, pos, 0, len);
    pos += len;

    // last buffer wasn't used all so just slice it and leave
    if (len !== buf.length) {
      this._buffers[--count] = buf.slice(len);
    }
  }

  // remove all used buffers
  if (count > 0) {
    this._buffers.splice(0, count);
  }

  this._buffered -= read.length;

  read.func.call(this, data);
};

ChunkStream.prototype._process = function () {

  try {
    // as long as there is any data and read requests
    while (this._buffered > 0 && this._reads && this._reads.length > 0) {

      var read = this._reads[0];

      // read any data (but no more than length)
      if (read.allowLess) {
        this._processReadAllowingLess(read);
      } else if (this._buffered >= read.length) {
        // ok we can meet some expectations

        this._processRead(read);
      } else {
        // not enought data to satisfy first request in queue
        // so we need to wait for more
        break;
      }
    }

    if (this._buffers && this._buffers.length > 0 && this._buffers[0] === null) {
      this._end();
    }
  } catch (ex) {
    this.emit('error', ex);
  }
};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var interlaceUtils = __webpack_require__(7);
var paethPredictor = __webpack_require__(8);

function getByteWidth(width, bpp, depth) {
  var byteWidth = width * bpp;
  if (depth !== 8) {
    byteWidth = Math.ceil(byteWidth / (8 / depth));
  }
  return byteWidth;
}

var Filter = module.exports = function (bitmapInfo, dependencies) {

  var width = bitmapInfo.width;
  var height = bitmapInfo.height;
  var interlace = bitmapInfo.interlace;
  var bpp = bitmapInfo.bpp;
  var depth = bitmapInfo.depth;

  this.read = dependencies.read;
  this.write = dependencies.write;
  this.complete = dependencies.complete;

  this._imageIndex = 0;
  this._images = [];
  if (interlace) {
    var passes = interlaceUtils.getImagePasses(width, height);
    for (var i = 0; i < passes.length; i++) {
      this._images.push({
        byteWidth: getByteWidth(passes[i].width, bpp, depth),
        height: passes[i].height,
        lineIndex: 0
      });
    }
  } else {
    this._images.push({
      byteWidth: getByteWidth(width, bpp, depth),
      height: height,
      lineIndex: 0
    });
  }

  // when filtering the line we look at the pixel to the left
  // the spec also says it is done on a byte level regardless of the number of pixels
  // so if the depth is byte compatible (8 or 16) we subtract the bpp in order to compare back
  // a pixel rather than just a different byte part. However if we are sub byte, we ignore.
  if (depth === 8) {
    this._xComparison = bpp;
  } else if (depth === 16) {
    this._xComparison = bpp * 2;
  } else {
    this._xComparison = 1;
  }
};

Filter.prototype.start = function () {
  this.read(this._images[this._imageIndex].byteWidth + 1, this._reverseFilterLine.bind(this));
};

Filter.prototype._unFilterType1 = function (rawData, unfilteredLine, byteWidth) {

  var xComparison = this._xComparison;
  var xBiggerThan = xComparison - 1;

  for (var x = 0; x < byteWidth; x++) {
    var rawByte = rawData[1 + x];
    var f1Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
    unfilteredLine[x] = rawByte + f1Left;
  }
};

Filter.prototype._unFilterType2 = function (rawData, unfilteredLine, byteWidth) {

  var lastLine = this._lastLine;

  for (var x = 0; x < byteWidth; x++) {
    var rawByte = rawData[1 + x];
    var f2Up = lastLine ? lastLine[x] : 0;
    unfilteredLine[x] = rawByte + f2Up;
  }
};

Filter.prototype._unFilterType3 = function (rawData, unfilteredLine, byteWidth) {

  var xComparison = this._xComparison;
  var xBiggerThan = xComparison - 1;
  var lastLine = this._lastLine;

  for (var x = 0; x < byteWidth; x++) {
    var rawByte = rawData[1 + x];
    var f3Up = lastLine ? lastLine[x] : 0;
    var f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
    var f3Add = Math.floor((f3Left + f3Up) / 2);
    unfilteredLine[x] = rawByte + f3Add;
  }
};

Filter.prototype._unFilterType4 = function (rawData, unfilteredLine, byteWidth) {

  var xComparison = this._xComparison;
  var xBiggerThan = xComparison - 1;
  var lastLine = this._lastLine;

  for (var x = 0; x < byteWidth; x++) {
    var rawByte = rawData[1 + x];
    var f4Up = lastLine ? lastLine[x] : 0;
    var f4Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
    var f4UpLeft = x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0;
    var f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
    unfilteredLine[x] = rawByte + f4Add;
  }
};

Filter.prototype._reverseFilterLine = function (rawData) {

  var filter = rawData[0];
  var unfilteredLine;
  var currentImage = this._images[this._imageIndex];
  var byteWidth = currentImage.byteWidth;

  if (filter === 0) {
    unfilteredLine = rawData.slice(1, byteWidth + 1);
  } else {

    unfilteredLine = new Buffer(byteWidth);

    switch (filter) {
      case 1:
        this._unFilterType1(rawData, unfilteredLine, byteWidth);
        break;
      case 2:
        this._unFilterType2(rawData, unfilteredLine, byteWidth);
        break;
      case 3:
        this._unFilterType3(rawData, unfilteredLine, byteWidth);
        break;
      case 4:
        this._unFilterType4(rawData, unfilteredLine, byteWidth);
        break;
      default:
        throw new Error('Unrecognised filter type - ' + filter);
    }
  }

  this.write(unfilteredLine);

  currentImage.lineIndex++;
  if (currentImage.lineIndex >= currentImage.height) {
    this._lastLine = null;
    this._imageIndex++;
    currentImage = this._images[this._imageIndex];
  } else {
    this._lastLine = unfilteredLine;
  }

  if (currentImage) {
    // read, using the byte width that may be from the new current image
    this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
  } else {
    this._lastLine = null;
    this.complete();
  }
};

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Adam 7
//   0 1 2 3 4 5 6 7
// 0 x 6 4 6 x 6 4 6
// 1 7 7 7 7 7 7 7 7
// 2 5 6 5 6 5 6 5 6
// 3 7 7 7 7 7 7 7 7
// 4 3 6 4 6 3 6 4 6
// 5 7 7 7 7 7 7 7 7
// 6 5 6 5 6 5 6 5 6
// 7 7 7 7 7 7 7 7 7


var imagePasses = [{ // pass 1 - 1px
  x: [0],
  y: [0]
}, { // pass 2 - 1px
  x: [4],
  y: [0]
}, { // pass 3 - 2px
  x: [0, 4],
  y: [4]
}, { // pass 4 - 4px
  x: [2, 6],
  y: [0, 4]
}, { // pass 5 - 8px
  x: [0, 2, 4, 6],
  y: [2, 6]
}, { // pass 6 - 16px
  x: [1, 3, 5, 7],
  y: [0, 2, 4, 6]
}, { // pass 7 - 32px
  x: [0, 1, 2, 3, 4, 5, 6, 7],
  y: [1, 3, 5, 7]
}];

exports.getImagePasses = function (width, height) {
  var images = [];
  var xLeftOver = width % 8;
  var yLeftOver = height % 8;
  var xRepeats = (width - xLeftOver) / 8;
  var yRepeats = (height - yLeftOver) / 8;
  for (var i = 0; i < imagePasses.length; i++) {
    var pass = imagePasses[i];
    var passWidth = xRepeats * pass.x.length;
    var passHeight = yRepeats * pass.y.length;
    for (var j = 0; j < pass.x.length; j++) {
      if (pass.x[j] < xLeftOver) {
        passWidth++;
      } else {
        break;
      }
    }
    for (j = 0; j < pass.y.length; j++) {
      if (pass.y[j] < yLeftOver) {
        passHeight++;
      } else {
        break;
      }
    }
    if (passWidth > 0 && passHeight > 0) {
      images.push({ width: passWidth, height: passHeight, index: i });
    }
  }
  return images;
};

exports.getInterlaceIterator = function (width) {
  return function (x, y, pass) {
    var outerXLeftOver = x % imagePasses[pass].x.length;
    var outerX = (x - outerXLeftOver) / imagePasses[pass].x.length * 8 + imagePasses[pass].x[outerXLeftOver];
    var outerYLeftOver = y % imagePasses[pass].y.length;
    var outerY = (y - outerYLeftOver) / imagePasses[pass].y.length * 8 + imagePasses[pass].y[outerYLeftOver];
    return outerX * 4 + outerY * width * 4;
  };
};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function paethPredictor(left, above, upLeft) {

  var paeth = left + above - upLeft;
  var pLeft = Math.abs(paeth - left);
  var pAbove = Math.abs(paeth - above);
  var pUpLeft = Math.abs(paeth - upLeft);

  if (pLeft <= pAbove && pLeft <= pUpLeft) {
    return left;
  }
  if (pAbove <= pUpLeft) {
    return above;
  }
  return upLeft;
};

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var constants = __webpack_require__(2);
var CrcCalculator = __webpack_require__(10);

var Parser = module.exports = function (options, dependencies) {

  this._options = options;
  options.checkCRC = options.checkCRC !== false;

  this._hasIHDR = false;
  this._hasIEND = false;

  // input flags/metadata
  this._palette = [];
  this._colorType = 0;

  this._chunks = {};
  this._chunks[constants.TYPE_IHDR] = this._handleIHDR.bind(this);
  this._chunks[constants.TYPE_IEND] = this._handleIEND.bind(this);
  this._chunks[constants.TYPE_IDAT] = this._handleIDAT.bind(this);
  this._chunks[constants.TYPE_PLTE] = this._handlePLTE.bind(this);
  this._chunks[constants.TYPE_tRNS] = this._handleTRNS.bind(this);
  this._chunks[constants.TYPE_gAMA] = this._handleGAMA.bind(this);

  this.read = dependencies.read;
  this.error = dependencies.error;
  this.metadata = dependencies.metadata;
  this.gamma = dependencies.gamma;
  this.transColor = dependencies.transColor;
  this.palette = dependencies.palette;
  this.parsed = dependencies.parsed;
  this.inflateData = dependencies.inflateData;
  this.finished = dependencies.finished;
};

Parser.prototype.start = function () {
  this.read(constants.PNG_SIGNATURE.length, this._parseSignature.bind(this));
};

Parser.prototype._parseSignature = function (data) {

  var signature = constants.PNG_SIGNATURE;

  for (var i = 0; i < signature.length; i++) {
    if (data[i] !== signature[i]) {
      this.error(new Error('Invalid file signature'));
      return;
    }
  }
  this.read(8, this._parseChunkBegin.bind(this));
};

Parser.prototype._parseChunkBegin = function (data) {

  // chunk content length
  var length = data.readUInt32BE(0);

  // chunk type
  var type = data.readUInt32BE(4);
  var name = '';
  for (var i = 4; i < 8; i++) {
    name += String.fromCharCode(data[i]);
  }

  //console.log('chunk ', name, length);

  // chunk flags
  var ancillary = Boolean(data[4] & 0x20); // or critical
  //    priv = Boolean(data[5] & 0x20), // or public
  //    safeToCopy = Boolean(data[7] & 0x20); // or unsafe

  if (!this._hasIHDR && type !== constants.TYPE_IHDR) {
    this.error(new Error('Expected IHDR on beggining'));
    return;
  }

  this._crc = new CrcCalculator();
  this._crc.write(new Buffer(name));

  if (this._chunks[type]) {
    return this._chunks[type](length);
  }

  if (!ancillary) {
    this.error(new Error('Unsupported critical chunk type ' + name));
    return;
  }

  this.read(length + 4, this._skipChunk.bind(this));
};

Parser.prototype._skipChunk = function () /*data*/{
  this.read(8, this._parseChunkBegin.bind(this));
};

Parser.prototype._handleChunkEnd = function () {
  this.read(4, this._parseChunkEnd.bind(this));
};

Parser.prototype._parseChunkEnd = function (data) {

  var fileCrc = data.readInt32BE(0);
  var calcCrc = this._crc.crc32();

  // check CRC
  if (this._options.checkCRC && calcCrc !== fileCrc) {
    this.error(new Error('Crc error - ' + fileCrc + ' - ' + calcCrc));
    return;
  }

  if (!this._hasIEND) {
    this.read(8, this._parseChunkBegin.bind(this));
  }
};

Parser.prototype._handleIHDR = function (length) {
  this.read(length, this._parseIHDR.bind(this));
};
Parser.prototype._parseIHDR = function (data) {

  this._crc.write(data);

  var width = data.readUInt32BE(0);
  var height = data.readUInt32BE(4);
  var depth = data[8];
  var colorType = data[9]; // bits: 1 palette, 2 color, 4 alpha
  var compr = data[10];
  var filter = data[11];
  var interlace = data[12];

  // console.log('    width', width, 'height', height,
  //     'depth', depth, 'colorType', colorType,
  //     'compr', compr, 'filter', filter, 'interlace', interlace
  // );

  if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
    this.error(new Error('Unsupported bit depth ' + depth));
    return;
  }
  if (!(colorType in constants.COLORTYPE_TO_BPP_MAP)) {
    this.error(new Error('Unsupported color type'));
    return;
  }
  if (compr !== 0) {
    this.error(new Error('Unsupported compression method'));
    return;
  }
  if (filter !== 0) {
    this.error(new Error('Unsupported filter method'));
    return;
  }
  if (interlace !== 0 && interlace !== 1) {
    this.error(new Error('Unsupported interlace method'));
    return;
  }

  this._colorType = colorType;

  var bpp = constants.COLORTYPE_TO_BPP_MAP[this._colorType];

  this._hasIHDR = true;

  this.metadata({
    width: width,
    height: height,
    depth: depth,
    interlace: Boolean(interlace),
    palette: Boolean(colorType & constants.COLORTYPE_PALETTE),
    color: Boolean(colorType & constants.COLORTYPE_COLOR),
    alpha: Boolean(colorType & constants.COLORTYPE_ALPHA),
    bpp: bpp,
    colorType: colorType
  });

  this._handleChunkEnd();
};

Parser.prototype._handlePLTE = function (length) {
  this.read(length, this._parsePLTE.bind(this));
};
Parser.prototype._parsePLTE = function (data) {

  this._crc.write(data);

  var entries = Math.floor(data.length / 3);
  // console.log('Palette:', entries);

  for (var i = 0; i < entries; i++) {
    this._palette.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2], 0xff]);
  }

  this.palette(this._palette);

  this._handleChunkEnd();
};

Parser.prototype._handleTRNS = function (length) {
  this.read(length, this._parseTRNS.bind(this));
};
Parser.prototype._parseTRNS = function (data) {

  this._crc.write(data);

  // palette
  if (this._colorType === constants.COLORTYPE_PALETTE_COLOR) {
    if (this._palette.length === 0) {
      this.error(new Error('Transparency chunk must be after palette'));
      return;
    }
    if (data.length > this._palette.length) {
      this.error(new Error('More transparent colors than palette size'));
      return;
    }
    for (var i = 0; i < data.length; i++) {
      this._palette[i][3] = data[i];
    }
    this.palette(this._palette);
  }

  // for colorType 0 (grayscale) and 2 (rgb)
  // there might be one gray/color defined as transparent
  if (this._colorType === constants.COLORTYPE_GRAYSCALE) {
    // grey, 2 bytes
    this.transColor([data.readUInt16BE(0)]);
  }
  if (this._colorType === constants.COLORTYPE_COLOR) {
    this.transColor([data.readUInt16BE(0), data.readUInt16BE(2), data.readUInt16BE(4)]);
  }

  this._handleChunkEnd();
};

Parser.prototype._handleGAMA = function (length) {
  this.read(length, this._parseGAMA.bind(this));
};
Parser.prototype._parseGAMA = function (data) {

  this._crc.write(data);
  this.gamma(data.readUInt32BE(0) / constants.GAMMA_DIVISION);

  this._handleChunkEnd();
};

Parser.prototype._handleIDAT = function (length) {
  this.read(-length, this._parseIDAT.bind(this, length));
};
Parser.prototype._parseIDAT = function (length, data) {

  this._crc.write(data);

  if (this._colorType === constants.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) {
    throw new Error('Expected palette not found');
  }

  this.inflateData(data);
  var leftOverLength = length - data.length;

  if (leftOverLength > 0) {
    this._handleIDAT(leftOverLength);
  } else {
    this._handleChunkEnd();
  }
};

Parser.prototype._handleIEND = function (length) {
  this.read(length, this._parseIEND.bind(this));
};
Parser.prototype._parseIEND = function (data) {

  this._crc.write(data);

  this._hasIEND = true;
  this._handleChunkEnd();

  if (this.finished) {
    this.finished();
  }
};

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var crcTable = [];

(function () {
  for (var i = 0; i < 256; i++) {
    var currentCrc = i;
    for (var j = 0; j < 8; j++) {
      if (currentCrc & 1) {
        currentCrc = 0xedb88320 ^ currentCrc >>> 1;
      } else {
        currentCrc = currentCrc >>> 1;
      }
    }
    crcTable[i] = currentCrc;
  }
})();

var CrcCalculator = module.exports = function () {
  this._crc = -1;
};

CrcCalculator.prototype.write = function (data) {

  for (var i = 0; i < data.length; i++) {
    this._crc = crcTable[(this._crc ^ data[i]) & 0xff] ^ this._crc >>> 8;
  }
  return true;
};

CrcCalculator.prototype.crc32 = function () {
  return this._crc ^ -1;
};

CrcCalculator.crc32 = function (buf) {

  var crc = -1;
  for (var i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ crc >>> 8;
  }
  return crc ^ -1;
};

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var interlaceUtils = __webpack_require__(7);

var pixelBppMap = {
  1: { // L
    0: 0,
    1: 0,
    2: 0,
    3: 0xff
  },
  2: { // LA
    0: 0,
    1: 0,
    2: 0,
    3: 1
  },
  3: { // RGB
    0: 0,
    1: 1,
    2: 2,
    3: 0xff
  },
  4: { // RGBA
    0: 0,
    1: 1,
    2: 2,
    3: 3
  }
};

function bitRetriever(data, depth) {

  var leftOver = [];
  var i = 0;

  function split() {
    if (i === data.length) {
      throw new Error('Ran out of data');
    }
    var byte = data[i];
    i++;
    var byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
    switch (depth) {
      default:
        throw new Error('unrecognised depth');
      case 16:
        byte2 = data[i];
        i++;
        leftOver.push((byte << 8) + byte2);
        break;
      case 4:
        byte2 = byte & 0x0f;
        byte1 = byte >> 4;
        leftOver.push(byte1, byte2);
        break;
      case 2:
        byte4 = byte & 3;
        byte3 = byte >> 2 & 3;
        byte2 = byte >> 4 & 3;
        byte1 = byte >> 6 & 3;
        leftOver.push(byte1, byte2, byte3, byte4);
        break;
      case 1:
        byte8 = byte & 1;
        byte7 = byte >> 1 & 1;
        byte6 = byte >> 2 & 1;
        byte5 = byte >> 3 & 1;
        byte4 = byte >> 4 & 1;
        byte3 = byte >> 5 & 1;
        byte2 = byte >> 6 & 1;
        byte1 = byte >> 7 & 1;
        leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
        break;
    }
  }

  return {
    get: function get(count) {
      while (leftOver.length < count) {
        split();
      }
      var returner = leftOver.slice(0, count);
      leftOver = leftOver.slice(count);
      return returner;
    },
    resetAfterLine: function resetAfterLine() {
      leftOver.length = 0;
    },
    end: function end() {
      if (i !== data.length) {
        throw new Error('extra data found');
      }
    }
  };
}

function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) {
  // eslint-disable-line max-params
  var imageWidth = image.width;
  var imageHeight = image.height;
  var imagePass = image.index;
  for (var y = 0; y < imageHeight; y++) {
    for (var x = 0; x < imageWidth; x++) {
      var pxPos = getPxPos(x, y, imagePass);

      for (var i = 0; i < 4; i++) {
        var idx = pixelBppMap[bpp][i];
        if (idx === 0xff) {
          pxData[pxPos + i] = 0xff;
        } else {
          var dataPos = idx + rawPos;
          if (dataPos === data.length) {
            throw new Error('Ran out of data');
          }
          pxData[pxPos + i] = data[dataPos];
        }
      }
      rawPos += bpp; //eslint-disable-line no-param-reassign
    }
  }
  return rawPos;
}

function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) {
  // eslint-disable-line max-params
  var imageWidth = image.width;
  var imageHeight = image.height;
  var imagePass = image.index;
  for (var y = 0; y < imageHeight; y++) {
    for (var x = 0; x < imageWidth; x++) {
      var pixelData = bits.get(bpp);
      var pxPos = getPxPos(x, y, imagePass);

      for (var i = 0; i < 4; i++) {
        var idx = pixelBppMap[bpp][i];
        pxData[pxPos + i] = idx !== 0xff ? pixelData[idx] : maxBit;
      }
    }
    bits.resetAfterLine();
  }
}

exports.dataToBitMap = function (data, bitmapInfo) {

  var width = bitmapInfo.width;
  var height = bitmapInfo.height;
  var depth = bitmapInfo.depth;
  var bpp = bitmapInfo.bpp;
  var interlace = bitmapInfo.interlace;

  if (depth !== 8) {
    var bits = bitRetriever(data, depth);
  }
  var pxData;
  if (depth <= 8) {
    pxData = new Buffer(width * height * 4);
  } else {
    pxData = new Uint16Array(width * height * 4);
  }
  var maxBit = Math.pow(2, depth) - 1;
  var rawPos = 0;
  var images;
  var getPxPos;

  if (interlace) {
    images = interlaceUtils.getImagePasses(width, height);
    getPxPos = interlaceUtils.getInterlaceIterator(width, height);
  } else {
    var nonInterlacedPxPos = 0;
    getPxPos = function getPxPos() {
      var returner = nonInterlacedPxPos;
      nonInterlacedPxPos += 4;
      return returner;
    };
    images = [{ width: width, height: height }];
  }

  for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
    if (depth === 8) {
      rawPos = mapImage8Bit(images[imageIndex], pxData, getPxPos, bpp, data, rawPos);
    } else {
      mapImageCustomBit(images[imageIndex], pxData, getPxPos, bpp, bits, maxBit);
    }
  }
  if (depth === 8) {
    if (rawPos !== data.length) {
      throw new Error('extra data found');
    }
  } else {
    bits.end();
  }

  return pxData;
};

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function dePalette(indata, outdata, width, height, palette) {
  var pxPos = 0;
  // use values from palette
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var color = palette[indata[pxPos]];

      if (!color) {
        throw new Error('index ' + indata[pxPos] + ' not in palette');
      }

      for (var i = 0; i < 4; i++) {
        outdata[pxPos + i] = color[i];
      }
      pxPos += 4;
    }
  }
}

function replaceTransparentColor(indata, outdata, width, height, transColor) {
  var pxPos = 0;
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var makeTrans = false;

      if (transColor.length === 1) {
        if (transColor[0] === indata[pxPos]) {
          makeTrans = true;
        }
      } else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) {
        makeTrans = true;
      }
      if (makeTrans) {
        for (var i = 0; i < 4; i++) {
          outdata[pxPos + i] = 0;
        }
      }
      pxPos += 4;
    }
  }
}

function scaleDepth(indata, outdata, width, height, depth) {
  var maxOutSample = 255;
  var maxInSample = Math.pow(2, depth) - 1;
  var pxPos = 0;

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      for (var i = 0; i < 4; i++) {
        outdata[pxPos + i] = Math.floor(indata[pxPos + i] * maxOutSample / maxInSample + 0.5);
      }
      pxPos += 4;
    }
  }
}

module.exports = function (indata, imageData) {

  var depth = imageData.depth;
  var width = imageData.width;
  var height = imageData.height;
  var colorType = imageData.colorType;
  var transColor = imageData.transColor;
  var palette = imageData.palette;

  var outdata = indata; // only different for 16 bits

  if (colorType === 3) {
    // paletted
    dePalette(indata, outdata, width, height, palette);
  } else {
    if (transColor) {
      replaceTransparentColor(indata, outdata, width, height, transColor);
    }
    // if it needs scaling
    if (depth !== 8) {
      // if we need to change the buffer size
      if (depth === 16) {
        outdata = new Buffer(width * height * 4);
      }
      scaleDepth(indata, outdata, width, height, depth);
    }
  }
  return outdata;
};

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var constants = __webpack_require__(2);
var CrcStream = __webpack_require__(10);
var bitPacker = __webpack_require__(21);
var filter = __webpack_require__(22);
var zlib = __webpack_require__(1);

var Packer = module.exports = function (options) {
  this._options = options;

  options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
  options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
  options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
  options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
  options.deflateFactory = options.deflateFactory || zlib.createDeflate;
  options.bitDepth = options.bitDepth || 8;
  // This is outputColorType
  options.colorType = typeof options.colorType === 'number' ? options.colorType : constants.COLORTYPE_COLOR_ALPHA;
  options.inputColorType = typeof options.inputColorType === 'number' ? options.inputColorType : constants.COLORTYPE_COLOR_ALPHA;

  if ([constants.COLORTYPE_GRAYSCALE, constants.COLORTYPE_COLOR, constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(options.colorType) === -1) {
    throw new Error('option color type:' + options.colorType + ' is not supported at present');
  }
  if ([constants.COLORTYPE_GRAYSCALE, constants.COLORTYPE_COLOR, constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(options.inputColorType) === -1) {
    throw new Error('option input color type:' + options.inputColorType + ' is not supported at present');
  }
  if (options.bitDepth !== 8 && options.bitDepth !== 16) {
    throw new Error('option bit depth:' + options.bitDepth + ' is not supported at present');
  }
};

Packer.prototype.getDeflateOptions = function () {
  return {
    chunkSize: this._options.deflateChunkSize,
    level: this._options.deflateLevel,
    strategy: this._options.deflateStrategy
  };
};

Packer.prototype.createDeflate = function () {
  return this._options.deflateFactory(this.getDeflateOptions());
};

Packer.prototype.filterData = function (data, width, height) {
  // convert to correct format for filtering (e.g. right bpp and bit depth)
  var packedData = bitPacker(data, width, height, this._options);

  // filter pixel data
  var bpp = constants.COLORTYPE_TO_BPP_MAP[this._options.colorType];
  var filteredData = filter(packedData, width, height, this._options, bpp);
  return filteredData;
};

Packer.prototype._packChunk = function (type, data) {

  var len = data ? data.length : 0;
  var buf = new Buffer(len + 12);

  buf.writeUInt32BE(len, 0);
  buf.writeUInt32BE(type, 4);

  if (data) {
    data.copy(buf, 8);
  }

  buf.writeInt32BE(CrcStream.crc32(buf.slice(4, buf.length - 4)), buf.length - 4);
  return buf;
};

Packer.prototype.packGAMA = function (gamma) {
  var buf = new Buffer(4);
  buf.writeUInt32BE(Math.floor(gamma * constants.GAMMA_DIVISION), 0);
  return this._packChunk(constants.TYPE_gAMA, buf);
};

Packer.prototype.packIHDR = function (width, height) {

  var buf = new Buffer(13);
  buf.writeUInt32BE(width, 0);
  buf.writeUInt32BE(height, 4);
  buf[8] = this._options.bitDepth; // Bit depth
  buf[9] = this._options.colorType; // colorType
  buf[10] = 0; // compression
  buf[11] = 0; // filter
  buf[12] = 0; // interlace

  return this._packChunk(constants.TYPE_IHDR, buf);
};

Packer.prototype.packIDAT = function (data) {
  return this._packChunk(constants.TYPE_IDAT, data);
};

Packer.prototype.packIEND = function () {
  return this._packChunk(constants.TYPE_IEND, null);
};

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var SyncReader = module.exports = function (buffer) {

  this._buffer = buffer;
  this._reads = [];
};

SyncReader.prototype.read = function (length, callback) {

  this._reads.push({
    length: Math.abs(length), // if length < 0 then at most this length
    allowLess: length < 0,
    func: callback
  });
};

SyncReader.prototype.process = function () {

  // as long as there is any data and read requests
  while (this._reads.length > 0 && this._buffer.length) {

    var read = this._reads[0];

    if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {

      // ok there is any data so that we can satisfy this request
      this._reads.shift(); // == read

      var buf = this._buffer;

      this._buffer = buf.slice(read.length);

      read.func.call(this, buf.slice(0, read.length));
    } else {
      break;
    }
  }

  if (this._reads.length > 0) {
    return new Error('There are some read requests waitng on finished stream');
  }

  if (this._buffer.length > 0) {
    return new Error('unrecognised content at end of stream');
  }
};

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = __webpack_require__(16),
    Network = _require.Network;

var fs = __webpack_require__(4);

var _require2 = __webpack_require__(17),
    PNG = _require2.PNG;

function loadImage(url) {
  return new Promise(function (resolve) {
    var width = void 0,
        height = void 0;
    fs.createReadStream(url).pipe(new PNG()).on("metadata", function (data) {
      width = data.width;
      height = data.height;
    }).on("parsed", function (data) {
      var arr = [];
      for (var i = 0; i < data.length; i += 4) {
        arr.push(data[i]);
      }
      resolve({
        width: width,
        height: height,
        data: arr
      });
    });
  });
}

function chunkImage(_ref) {
  var width = _ref.width,
      height = _ref.height,
      data = _ref.data;

  var pixelsPerSecong = 600 / 30;
  var secondsPerChunk = 3;
  var chunkWidth = pixelsPerSecong * secondsPerChunk;
  var chunkCount = Math.floor(width / chunkWidth);

  var chunked = [];
  for (var i = 0; i < width; i += chunkWidth) {
    var chunk = [];
    // j=1 to chop off first layer to make image even height :)
    for (var j = 1; j < height; j++) {
      var idx = j * width + i;
      chunk = chunk.concat(data.slice(idx, idx + chunkWidth));
    }
    chunked.push(chunk);
  }
  return chunked;
}

var Classifier = function () {
  function Classifier(network) {
    _classCallCheck(this, Classifier);

    if (!network) {
      network = this.constructor.createNetwork();
    }
    this.network = network;
  }

  _createClass(Classifier, [{
    key: "fromPath",
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(path) {
        var image;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return loadImage(path);

              case 2:
                image = _context.sent;
                return _context.abrupt("return", this.classify(image));

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function fromPath(_x) {
        return _ref2.apply(this, arguments);
      }

      return fromPath;
    }()
  }, {
    key: "softmax",
    value: function softmax(arr) {
      var exps = arr.map(function (x) {
        return Math.exp(x);
      });
      var summedExps = exps.reduce(function () {
        var a = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        return a + b;
      });
      var softmaxed = exps.map(function (x) {
        return Math.round(1000 * x / summedExps) / 1000;
      });
      return softmaxed;
    }
  }, {
    key: "vote",
    value: function vote(arr) {
      var summed = arr.reduce(function (acc, x) {
        return acc.map(function (y, i) {
          return x[i] + y;
        });
      });
      return this.softmax(summed);
    }
  }, {
    key: "classify",
    value: function classify(image) {
      console.log(image);
      var chunked = chunkImage(image);
      var array = this.network.classify(chunked);
      var final = this.vote(array);
      return { array: array, final: final };
    }
  }, {
    key: "train",
    value: function train(data, labels, options) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.network.train(data, labels, options);
        resolve();
      });
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.network.toJSON();
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(json) {
      var network = Network.fromJSON(json);
      return new Classifier(network);
    }
  }, {
    key: "createNetwork",
    value: function createNetwork() {
      var network = new Network();
      var layer = network.addLayer("convolutional", {
        inW: 60,
        inH: 128,
        inD: 1,
        filterW: 20, // 1 second filter
        filterH: 1,
        zeroPaddingX: 10,
        zeroPaddingY: 0,
        strideX: 4, // fifth second checks
        strideY: 1,
        filters: 8
      });
      network.addLayer("relu");
      var layer2 = network.addLayer("convolutional", {
        inW: 16,
        inH: 128,
        inD: 8,
        filterW: 2,
        filterH: 8,
        strideX: 1,
        strideY: 4,
        zeroPaddingX: 1,
        zeroPaddingY: 2,
        filters: 8
      });
      network.addLayer("relu");
      var layer3 = network.addLayer("convolutional", {
        inW: 17,
        inH: 32,
        inD: 8,
        filterW: 3,
        filterH: 6,
        zeroPaddingX: 1,
        zeroPaddingY: 1,
        strideX: 2,
        strideY: 4,
        filters: 4
        // outW: 8,
        // outH: 8,
        // outD: 4,
      });
      network.addLayer("sigmoid");
      network.addLayer("linear", [288, 10]);
      network.addLayer("softmax");
      return network;
    }
  }]);

  return Classifier;
}();

exports.default = Classifier;

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (e, a) {
  for (var i in a) {
    e[i] = a[i];
  }
})(exports, /******/function (modules) {
  // webpackBootstrap
  /******/ // The module cache
  /******/var installedModules = {};
  /******/
  /******/ // The require function
  /******/function __webpack_require__(moduleId) {
    /******/
    /******/ // Check if module is in cache
    /******/if (installedModules[moduleId]) {
      /******/return installedModules[moduleId].exports;
      /******/
    }
    /******/ // Create a new module (and put it into the cache)
    /******/var module = installedModules[moduleId] = {
      /******/i: moduleId,
      /******/l: false,
      /******/exports: {}
      /******/ };
    /******/
    /******/ // Execute the module function
    /******/modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/
    /******/ // Flag the module as loaded
    /******/module.l = true;
    /******/
    /******/ // Return the exports of the module
    /******/return module.exports;
    /******/
  }
  /******/
  /******/
  /******/ // expose the modules object (__webpack_modules__)
  /******/__webpack_require__.m = modules;
  /******/
  /******/ // expose the module cache
  /******/__webpack_require__.c = installedModules;
  /******/
  /******/ // define getter function for harmony exports
  /******/__webpack_require__.d = function (exports, name, getter) {
    /******/if (!__webpack_require__.o(exports, name)) {
      /******/Object.defineProperty(exports, name, {
        /******/configurable: false,
        /******/enumerable: true,
        /******/get: getter
        /******/ });
      /******/
    }
    /******/
  };
  /******/
  /******/ // getDefaultExport function for compatibility with non-harmony modules
  /******/__webpack_require__.n = function (module) {
    /******/var getter = module && module.__esModule ?
    /******/function getDefault() {
      return module['default'];
    } :
    /******/function getModuleExports() {
      return module;
    };
    /******/__webpack_require__.d(getter, 'a', getter);
    /******/return getter;
    /******/
  };
  /******/
  /******/ // Object.prototype.hasOwnProperty.call
  /******/__webpack_require__.o = function (object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };
  /******/
  /******/ // __webpack_public_path__
  /******/__webpack_require__.p = "/";
  /******/
  /******/ // Load entry module and return exports
  /******/return __webpack_require__(__webpack_require__.s = 6);
  /******/
}(
/************************************************************************/
/******/[
/* 0 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  /**
   * class to group all matrix functions
   */
  var Matrix = function () {
    function Matrix() {
      _classCallCheck(this, Matrix);
    }

    _createClass(Matrix, null, [{
      key: "dot",

      /**
       * @param {number[][]} a
       * @param {number[][]} b
       * @returns {number[][]} the dot product of a and b
       */
      value: function dot(a, b) {
        return a.map(function (_, i) {
          return b[0].map(function (_, j) {
            return b.reduce(function (acc, _, k) {
              return acc + a[i][k] * b[k][j];
            }, 0);
          });
        });
      }

      /**
       * calls the function cb for every element in the matrix
       * cb gets passed the value at that position, the x and y coord and the matrix itself
       * the return value of the function is captured and a matrix of the same size
       *    containing these values is returned
       * @param  {number[][]} a
       * @param  {(val:number, x: number, y: number, a:number[][]):any=>{}} cb
       * @returns {any[][]}
       */

    }, {
      key: "map",
      value: function map(a, cb) {
        return a.map(function (row, y) {
          return row.map(function (cell, x) {
            return cb(cell, x, y, a);
          });
        });
      }

      /**
       * performs element-wise addition on a and b
       * @param  {number[][]} a
       * @param  {number[][]} b
       * @returns {number[][]} a+b
       */

    }, {
      key: "add",
      value: function add(a, b) {
        return Matrix.map(a, function (el, x, y) {
          return el + b[y][x];
        });
      }

      /**
       * performs element-wise subtraction on a and b
       * @param  {number[][]} a
       * @param  {number[][]} b
       * @returns {number[][]} a-b
       */

    }, {
      key: "sub",
      value: function sub(a, b) {
        return Matrix.map(a, function (el, x, y) {
          return el - b[y][x];
        });
      }

      /**
       * performs element-wise multiplication on a and b
       * @param  {number[][]} a
       * @param  {number[][]} b
       * @returns {number[][]} a*b
       */

    }, {
      key: "multiply",
      value: function multiply(a, b) {
        return Matrix.map(a, function (el, x, y) {
          return el * b[y][x];
        });
      }

      /**
       * performs element-wise division on a and b
       * @param  {number[][]} a
       * @param  {number[][]} b
       * @returns {number[][]} a/b
       */

    }, {
      key: "divide",
      value: function divide(a, b) {
        return Matrix.map(a, function (el, x, y) {
          return el / b[y][x];
        });
      }

      /**
       * @param  {number[][]} a
       * @returns {number[][]} transposed version of a
       */

    }, {
      key: "transpose",
      value: function transpose(a) {
        return a[0].map(function (_, x) {
          return a.map(function (_, y) {
            return a[y][x];
          });
        });
      }

      /**
       * flattens a matrix into a single array in the form of [ row | row| row ]
       * @param {number[][]} a
       * @returns {number[]}
       */

    }, {
      key: "flatten",
      value: function flatten(a) {
        return Array.prototype.concat.apply([], a);
      }

      /**
       * oppisite of .flatten
       * returns a 2d matrix given a single dimensional array and a desired dimension
       * @param {number[]} a
       * @param {number} rows
       * @param {number} cols
       * @returns {number[][]}
       * @throws {Error} if the dimension does not match the amount of data supplied
       */

    }, {
      key: "inflate",
      value: function inflate(a, rows, cols) {
        if (a.length !== rows * cols) throw new Error("incompatible sizes, length or array must match rows*cols");
        return Matrix.create(rows, cols, function (x, y) {
          return a[y * cols + x];
        });
      }

      /**
       * sums every element in the matrix
       * @param {number[][]} a
       * @returns {number}
       */

    }, {
      key: "sum",
      value: function sum(a) {
        return this.flatten(a).reduce(function () {
          var a = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
          return a + b;
        });
      }

      /**
       * creates a matrix of size rows*cols
       * if initializer function is passed then it is invoked for every x, y coord
       *     and the result is placed at the position
       * @param  {number} rows
       * @param  {number} cols
       * @param  {(x:number, y:number):any=>{}} [initializer]
       * @returns {number[][]}
       */

    }, {
      key: "create",
      value: function create(rows, cols, initializer) {
        var mat = Array(rows).fill(null).map(function () {
          return Array(cols).fill(null);
        });

        if (initializer) {
          return Matrix.map(mat, function (_, x, y) {
            return initializer(x, y);
          });
        }
        return mat;
      }
    }]);

    return Matrix;
  }();

  exports.default = Matrix;

  /***/
},
/* 1 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  /**
   * Layer
   * Abstract layer which provides ground work for all further layers
   * Usable layers will extend this class and override certain functions
   * For instance a SigmoidLayer will override the getOutput function in order to
   * manipulate the data before passing it forward
   */
  var Layer = function () {
    function Layer() {
      _classCallCheck(this, Layer);
    }

    _createClass(Layer, [{
      key: "getOutput",

      /**
       * calculates and sets the output of the activation
       * @param  {Activation} activation
       * @param  {number[][]} activation.input
       */
      value: function getOutput(activation) {
        activation.output = activation.input;
      }

      /**
       * pass input backwards using the differential of the activation function
       * usally means passing the outputGradient back along the weights
       * sets the activation.inputGradient property
       * @param  {Activation} activation
       * @param  {number[][]} activation.outputGradient
       */

    }, {
      key: "getInputGradient",
      value: function getInputGradient(activation) {
        return activation.inputGradient = [];
      }
      /**
       * @returns {number[]} weights to be adjusted
       */

    }, {
      key: "getParams",
      value: function getParams() {
        return null;
      }
      /**
       * @param {number[]} newParams - new paramaeters for the layer, in the same order
       * as returned from .getParams()
       */

    }, {
      key: "setParams",
      value: function setParams(newParams) {}

      /**
       * calculates the error over the params and sets the result on activation.paramGrads
       * this usally mean multiplying the input by the output gradient
       * @param  {Activation} activation - for this layer
       */

    }, {
      key: "getParamGrads",
      value: function getParamGrads(activation) {
        activation.paramGrads = [];
      }

      /**
       * serializes all data necessary to restore the layer at a later time
       * used for saving the layer to file
       */

    }, {
      key: "toJSON",
      value: function toJSON() {
        return {};
      }

      /**
       * revereses the serialization of .toJSON
       * @param  {Object} json
       * @returns {Layer} returns instantiated layer with the same config
       */

    }], [{
      key: "fromJSON",
      value: function fromJSON(json) {
        return new this();
      }
    }]);

    return Layer;
  }();

  exports.default = Layer;

  /***/
},
/* 2 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  /**
   * returns a + b
   * performs element-wise addition if an array is passed
   * @param  {number[]|number} a
   * @param  {number[]|number} b
   * @returns {number[]|number}
   */
  var arrayAdd = exports.arrayAdd = function arrayAdd(a, b) {
    var aArray = Array.isArray(a);
    var bArray = Array.isArray(b);
    if (aArray && bArray) {
      return a.map(function (aEl, i) {
        return aEl + b[i];
      });
    } else if (aArray) {
      return a.map(function (el) {
        return el + b;
      });
    } else if (bArray) {
      return b.map(function (el) {
        return a + el;
      });
    } else {
      return a + b;
    }
  };

  /**
   * returns a - b
   * performs element-wise subtraction if an array is passed
   * @param  {number[]|number} a
   * @param  {number[]|number} b
   * @returns {number[]|number}
   */
  var arraySub = exports.arraySub = function arraySub(a, b) {
    var aArray = Array.isArray(a);
    var bArray = Array.isArray(b);
    if (aArray && bArray) {
      return a.map(function (aEl, i) {
        return aEl - b[i];
      });
    } else if (aArray) {
      return a.map(function (el) {
        return el - b;
      });
    } else if (bArray) {
      return b.map(function (el) {
        return a - el;
      });
    } else {
      return a - b;
    }
  };

  /**
   * returns a * b
   * performs element-wise multiplication if an array is passed
   * @param  {number[]|number} a
   * @param  {number[]|number} b
   * @returns {number[]|number}
   */
  var arrayMultiply = exports.arrayMultiply = function arrayMultiply(a, b) {
    var aArray = Array.isArray(a);
    var bArray = Array.isArray(b);
    if (aArray && bArray) {
      return a.map(function (aEl, i) {
        return aEl * b[i];
      });
    } else if (aArray) {
      return a.map(function (el) {
        return el * b;
      });
    } else if (bArray) {
      return b.map(function (el) {
        return a * el;
      });
    } else {
      return a * b;
    }
  };

  /**
   * returns a / b
   * performs element-wise division if an array is passed
   * @param  {(number[]|number)} a
   * @param  {number[]|number} b
   * @returns {number[]|number}
   */
  var arrayDivide = exports.arrayDivide = function arrayDivide(a, b) {
    var aArray = Array.isArray(a);
    var bArray = Array.isArray(b);
    if (aArray && bArray) {
      return a.map(function (aEl, i) {
        return aEl / b[i];
      });
    } else if (aArray) {
      return a.map(function (el) {
        return el / b;
      });
    } else if (bArray) {
      return b.map(function (el) {
        return a / el;
      });
    } else {
      return a / b;
    }
  };

  var arraySum = exports.arraySum = function arraySum(arr) {
    return arr.reduce(sum);
  };

  /**
   * creates an array of length n filled with `value`. if value is a function
   * then it will be invoked for each element and its return will be that elements
   * value.
   * @param  {number} n - length of the array
   * @param  {any|(index:number)=>any} value - default value or callback for each element
   * @returns {any[]}
   */
  var createArray = exports.createArray = function createArray(n, value) {
    if (typeof value === "function") {
      return Array(n).fill(undefined).map(function (_, i) {
        return value(i);
      });
    } else {
      return Array(n).fill(value);
    }
  };

  /**
   * returns a+b
   * used primarily to find the sum of an array arr.reduce(sum)
   * @param  {} a=0
   * @param  {} b=0
   */
  var sum = exports.sum = function sum() {
    var a = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    return a + b;
  };

  var flatten = exports.flatten = function flatten(arr) {
    return Array.prototype.concat.apply([], arr);
  };

  /***/
},
/* 3 */
/***/function (module, exports, __webpack_require__) {

  "use strict";
  /**
   * Copyright (c) 2013-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  /**
   * Use invariant() to assert state which your program assumes to be true.
   *
   * Provide sprintf-style format (only %s is supported) and arguments
   * to provide information about what broke and what you were
   * expecting.
   *
   * The invariant message will be stripped in production, but the invariant
   * will remain to ensure logic does not differ in production.
   */

  var NODE_ENV = process.env.NODE_ENV;

  var invariant = function invariant(condition, format, a, b, c, d, e, f) {
    if (NODE_ENV !== 'production') {
      if (format === undefined) {
        throw new Error('invariant requires an error message argument');
      }
    }

    if (!condition) {
      var error;
      if (format === undefined) {
        error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
      } else {
        var args = [a, b, c, d, e, f];
        var argIndex = 0;
        error = new Error(format.replace(/%s/g, function () {
          return args[argIndex++];
        }));
        error.name = 'Invariant Violation';
      }

      error.framesToPop = 1; // we don't care about invariant's own frame
      throw error;
    }
  };

  module.exports = invariant;

  /***/
},
/* 4 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  var _Matrix = __webpack_require__(0);

  var _Matrix2 = _interopRequireDefault(_Matrix);

  var _utils = __webpack_require__(2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var Output = function () {
    function Output(predicted, labels) {
      _classCallCheck(this, Output);

      this.predicted = predicted;
      this.labels = labels;
    }

    _createClass(Output, [{
      key: "avg",
      value: function avg(arr) {
        return arr.reduce(function (a, b) {
          return a + b;
        }, 0) / arr.length;
      }
    }, {
      key: "percentage",
      value: function percentage() {
        var errors = _Matrix2.default.divide(this.predicted, this.labels);
        // errors = Matrix.map(errors, Math.abs);
        // errors = Matrix.divide(errors, actual);
        var tot = 0;
        var cnt = 0;

        _Matrix2.default.map(errors, function (el, x, y) {
          if (el === Infinity) return;
          el *= 100;
          tot += el > 100 ? 200 - el : el;
          cnt++;
        });
        return tot / cnt;
      }
    }, {
      key: "rmse",
      value: function rmse() {
        var _this = this;

        return this.avg(this.predicted.map(function (ps, i) {
          var as = _this.labels[i];
          var x = _this.avg((0, _utils.arraySub)(ps, as).map(function (x) {
            return Math.pow(x, 2);
          }));
          return Math.pow(x, 0.5);
        }));
      }
    }, {
      key: "msre",
      value: function msre() {
        var _this2 = this;

        return this.avg(this.predicted.map(function (ps, i) {
          var as = _this2.labels[i];
          return _this2.avg((0, _utils.arrayDivide)((0, _utils.arraySub)(ps, as), as).map(function (x) {
            return Math.pow(x, 2);
          }));
        }));
      }
    }, {
      key: "ce",
      value: function ce() {
        var _this3 = this;

        return this.avg(this.predicted.map(function (ps, i) {
          var as = _this3.labels[i];

          var top = (0, _utils.arraySum)((0, _utils.arraySub)(ps, as).map(function (x) {
            return Math.pow(x, 2);
          }));
          var bottom = (0, _utils.arraySum)((0, _utils.arraySub)(as, _this3.avg(as)).map(function (x) {
            return Math.pow(x, 2);
          }));
          return 1 - top / bottom;
        }));
      }
    }, {
      key: "rsqr",
      value: function rsqr() {
        var _this4 = this;

        return this.avg(this.predicted.map(function (ps, i) {
          var as = _this4.labels[i];
          var top = (0, _utils.arraySum)((0, _utils.arrayMultiply)((0, _utils.arraySub)(as, _this4.avg(as)), (0, _utils.arraySub)(ps, _this4.avg(ps))));
          var bottom = Math.sqrt((0, _utils.arraySum)((0, _utils.arrayMultiply)((0, _utils.arraySub)(as, _this4.avg(as)).map(function (x) {
            return Math.pow(x, 2);
          }), (0, _utils.arraySub)(ps, _this4.avg(ps)).map(function (x) {
            return Math.pow(x, 2);
          }))));
          console.log({ top: top, bottom: bottom });
          return Math.pow(top / bottom, 2);
        }));
      }
    }, {
      key: "n",
      get: function get() {
        return this.predicted.length;
      }
    }]);

    return Output;
  }();

  exports.default = Output;

  /***/
},
/* 5 */
/***/function (module, exports) {

  module.exports = __webpack_require__(4);

  /***/
},
/* 6 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Output = exports.Network = undefined;

  var _Network = __webpack_require__(7);

  Object.defineProperty(exports, "Network", {
    enumerable: true,
    get: function get() {
      return _interopRequireDefault(_Network).default;
    }
  });

  var _Output = __webpack_require__(4);

  Object.defineProperty(exports, "Output", {
    enumerable: true,
    get: function get() {
      return _interopRequireDefault(_Output).default;
    }
  });

  var _Network2 = _interopRequireDefault(_Network);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  console.log('network', _Network2.default);

  /***/
},
/* 7 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  var _class, _temp;

  var _Matrix = __webpack_require__(0);

  var _Matrix2 = _interopRequireDefault(_Matrix);

  var _invariant = __webpack_require__(3);

  var _invariant2 = _interopRequireDefault(_invariant);

  var _Activation = __webpack_require__(8);

  var _Activation2 = _interopRequireDefault(_Activation);

  var _utils = __webpack_require__(2);

  var _Output = __webpack_require__(4);

  var _Output2 = _interopRequireDefault(_Output);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function _objectWithoutProperties(obj, keys) {
    var target = {};for (var i in obj) {
      if (keys.indexOf(i) >= 0) continue;if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;target[i] = obj[i];
    }return target;
  }

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }return arr2;
    } else {
      return Array.from(arr);
    }
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var Network = (_temp = _class = function () {
    function Network() {
      _classCallCheck(this, Network);

      this.layers = [];
    }
    //whoa!!!!!


    _createClass(Network, [{
      key: "addLayer",
      value: function addLayer(layerOrName) {
        var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

        if (typeof layerOrName === "string") {
          var cls = this.constructor.layerTypes[layerOrName];
          (0, _invariant2.default)(cls !== undefined, "unknwon layer type " + layerOrName);
          if (!Array.isArray(args)) args = [args];
          var layer = new (Function.prototype.bind.apply(cls, [null].concat(_toConsumableArray(args))))();
          this.layers.push(layer);
          return layer;
        } else {
          this.layers.push(layerOrName);
          return layerOrName;
        }
      }
    }, {
      key: "forward",
      value: function forward(input) {
        var activations = [];

        this.layers.forEach(function (layer, i) {
          var activation = void 0;
          if (i === 0) {
            activation = new _Activation2.default();
            activation.input = input;
          } else {
            activation = activations[activations.length - 1].createNext();
          }
          activation.layer = layer;
          activations.push(activation);

          layer.getOutput(activation);
        });
        return activations;
      }
    }, {
      key: "classify",
      value: function classify(input) {
        var single = !Array.isArray(input[0]);
        if (single) input = [input];
        var activations = this.forward(input);
        var output = activations[activations.length - 1].output;

        return single ? output[0] : output;
      }
    }, {
      key: "backErrors",
      value: function backErrors(activations, expected) {
        // calculate the cost
        var cost = _Matrix2.default.sub(expected, activations[activations.length - 1].output);
        activations[activations.length - 1].outputGradient = cost;

        var currentActivation = activations[activations.length - 1];
        while (currentActivation) {
          currentActivation.layer.getParamGrads(currentActivation);
          currentActivation.layer.getInputGradient(currentActivation);
          currentActivation = currentActivation.previous;
        }
      }
    }, {
      key: "train",
      value: function train(input, expected) {
        var _this = this;

        var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            batchSize = _ref.batchSize,
            _ref$noOfIterations = _ref.noOfIterations,
            noOfIterations = _ref$noOfIterations === undefined ? 300 : _ref$noOfIterations,
            _ref$learningRate = _ref.learningRate,
            learningRate = _ref$learningRate === undefined ? 0.1 : _ref$learningRate,
            _ref$momentum = _ref.momentum,
            momentum = _ref$momentum === undefined ? 0 : _ref$momentum,
            _ref$onStep = _ref.onStep,
            onStep = _ref$onStep === undefined ? function () {} : _ref$onStep;

        (0, _invariant2.default)(momentum < 1, "momentum cant be greater then 1");

        var batched = false;
        if (batchSize && batchSize < input.length) {
          batched = true;
          var noOfBatches = Math.ceil(input.length / batchSize);
        }

        var trainingRound = function trainingRound(inp, exp) {
          var activations = _this.forward(inp);
          _this.backErrors(activations, exp);

          _this.layers.forEach(function (layer, idx) {
            var params = layer.getParams();
            // if there are no params on the layer then why bother
            if (!params) return;

            var paramDeltas = activations[idx].paramGrads;

            if (Array.isArray(paramDeltas[0])) {
              //average delta accross each input
              var numberGrads = paramDeltas.length;
              paramDeltas = paramDeltas.reduce(function (acc, x) {
                return (0, _utils.arrayAdd)(acc, x);
              }).map(function (a) {
                return a / numberGrads;
              });
            }

            paramDeltas = paramDeltas.map(function (v) {
              return v * learningRate;
            });

            if (momentum) {
              if (layer.lastUpdate) {
                var momentumDeltas = layer.lastUpdate.map(function (x) {
                  return x * momentum;
                });
                paramDeltas = (0, _utils.arrayAdd)(paramDeltas, momentumDeltas);
              }

              layer.lastUpdate = paramDeltas;
            }

            var newParams = (0, _utils.arrayAdd)(params, paramDeltas);

            if (newParams.some(function (el) {
              return el !== el;
            })) debugger;

            layer.setParams(newParams);
          });
        };

        var shuffleInputAndExpected = function shuffleInputAndExpected() {
          var arrEnd = input.length;
          while (arrEnd) {
            var idx = Math.floor(Math.random() * arrEnd--);

            var temp = void 0;
            temp = input[arrEnd];
            input[arrEnd] = input[idx];
            input[idx] = temp;

            temp = expected[arrEnd];
            expected[arrEnd] = expected[idx];
            expected[idx] = temp;
          }
        };

        if (batched) {
          for (var i = 0; i < noOfIterations; i++) {
            onStep(i);
            // console.time(`batch ${i + 1}`)
            shuffleInputAndExpected();
            var batchStartIndex = 0;
            while (batchStartIndex < input.length) {
              var batchInputs = input.slice(batchStartIndex, batchStartIndex + batchSize);
              var batchExpected = expected.slice(batchStartIndex, batchStartIndex + batchSize);
              trainingRound(batchInputs, batchExpected);
              batchStartIndex += batchSize;
            }
            // console.timeEnd(`batch ${i + 1}`)
          }
        } else {
          for (var _i = 0; _i < noOfIterations; _i++) {
            onStep(_i);
            trainingRound(input, expected);
          }
        }
        // this.saveNetwork("./backups/network-final");
      }
    }, {
      key: "saveNetwork",
      value: function saveNetwork(path) {
        var json = JSON.stringify(this.toJSON());
        __webpack_require__(5).writeFile(path, json, function (err) {
          if (err) throw err;
        });
      }
    }, {
      key: "toJSON",
      value: function toJSON() {
        return this.layers.map(function (layer) {
          var json = layer.toJSON();
          json.type = layer.type;
          return json;
        });
      }
    }], [{
      key: "loadNetwork",
      value: function loadNetwork(path) {
        var _this2 = this;

        return new Promise(function (resolve, reject) {
          __webpack_require__(5).readFile(path, function (err, data) {
            if (err) return reject(err);
            var json = JSON.parse(data);
            var network = _this2.fromJSON(json);
            return network;
          });
        });
      }
    }, {
      key: "fromJSON",
      value: function fromJSON(json) {
        var _this3 = this;

        var network = new this();
        network.layers = json.map(function (_ref2) {
          var type = _ref2.type,
              layerJson = _objectWithoutProperties(_ref2, ["type"]);

          return _this3.layerTypes[type].fromJSON(layerJson);
        });
        return network;
      }
    }]);

    return Network;
  }(), _class.layerTypes = {
    linear: __webpack_require__(9).default,
    pooling: __webpack_require__(10).default,
    convolutional: __webpack_require__(11).default,
    sigmoid: __webpack_require__(12).default,
    relu: __webpack_require__(13).default,
    softmax: __webpack_require__(14).default }, _temp);
  exports.default = Network;

  /***/
},
/* 8 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var Activation = function () {
    function Activation() {
      _classCallCheck(this, Activation);

      this.grads = [];
      this.paramGrads = [];
    }

    _createClass(Activation, [{
      key: "createNext",

      /**
       * creates a new activation and sets it up as the next in the chain
       * @returns {Activation}
       */
      value: function createNext() {
        this.next = new this.constructor();
        this.next.previous = this;
        return this.next;
      }
    }, {
      key: "toJSON",
      value: function toJSON() {
        return {
          input: this.input,
          output: this.output,
          layerType: this.layer.type
        };
      }
    }, {
      key: "input",

      /**
       * returns the input for this activation
       * if one has been set then it will return that else it returns the previous
       * layers output
       */
      get: function get() {
        return this._input ? this._input : this.previous.output;
      }

      /**
       * sets the input to this layer
       * @param  {number[][]} val - input value
       */

      , set: function set(val) {
        this._input = val;
      }

      // get output() {
      //   if (!this._output) {
      //     this.layer.getOutput(this)
      //   }
      //   return this._output
      // }
      // set output(value) {
      //   this._output = value
      // }

      /**
       * returns the output gradient for this activation
       * if one has been set then that will be returned
       * otherwise it defaults to the next layerers input gradient
       */

    }, {
      key: "outputGradient",
      get: function get() {
        return this._outputGradient || this.next.inputGradient;
      }

      /**
       * sets the output gradient
       * used at the last layer to set the final error
       * @param  {number[][]} val - output gradient
       */

      , set: function set(val) {
        this._outputGradient = val;
      }
    }]);

    return Activation;
  }();

  exports.default = Activation;

  /***/
},
/* 9 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  var _Layer2 = __webpack_require__(1);

  var _Layer3 = _interopRequireDefault(_Layer2);

  var _Matrix = __webpack_require__(0);

  var _Matrix2 = _interopRequireDefault(_Matrix);

  var _utils = __webpack_require__(2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  /**
   * Linear layer
   * basic fully connected layer
   * @extends Layer
   */
  var LinearLayer = function (_Layer) {
    _inherits(LinearLayer, _Layer);

    /**
     * @param  {Object} params
     * @param  {number} params.inpSize - number of inputs
     * @param  {number} params.outSize - number of outputs
     */
    function LinearLayer(inpSize, outSize) {
      _classCallCheck(this, LinearLayer);

      var _this = _possibleConstructorReturn(this, (LinearLayer.__proto__ || Object.getPrototypeOf(LinearLayer)).call(this));

      _this.type = "linear";

      _this.in = inpSize;
      _this.out = outSize;
      if (inpSize) {
        _this.w = _Matrix2.default.create(inpSize, outSize, function () {
          return Math.random() - 0.5;
        });
        _this.b = Array(outSize).fill(0);
      }
      return _this;
    }

    /** @inheritdoc */

    _createClass(LinearLayer, [{
      key: "getOutput",
      value: function getOutput(activation) {
        var _this2 = this;

        var input = activation.input;

        activation.output = _Matrix2.default.dot(input, this.w).map(function (row) {
          return (0, _utils.arrayAdd)(row, _this2.b);
        });
      }

      /** @inheritdoc */

    }, {
      key: "getInputGradient",
      value: function getInputGradient(activation) {
        activation.inputGradient = _Matrix2.default.dot(activation.outputGradient, _Matrix2.default.transpose(this.w));
      }

      /** @inheritdoc */

    }, {
      key: "getParams",
      value: function getParams() {
        return _Matrix2.default.flatten(this.w.concat([this.b]));
      }

      /** @inheritdoc */

    }, {
      key: "setParams",
      value: function setParams(val) {
        var w = val.slice(0, val.length - this.out);
        this.w = _Matrix2.default.inflate(w, this.in, this.out);
        this.b = val.slice(val.length - this.out);
      }

      /** @inheritdoc */

    }, {
      key: "getParamGrads",
      value: function getParamGrads(activation) {
        // """Return a list of gradients over the parameters."""
        var JW = _Matrix2.default.dot(_Matrix2.default.transpose(activation.input), activation.outputGradient);
        // quicker to add column wise then to dot product with inputs of all 1's
        var Jb = activation.outputGradient.reduce(function (acc, row) {
          return (0, _utils.arrayAdd)(acc, row);
        });
        activation.paramGrads = _Matrix2.default.flatten(_Matrix2.default.map(JW.concat([Jb]), function (el) {
          return el / activation.input.length;
        }));
      }

      /** @inheritdoc */

    }, {
      key: "toJSON",
      value: function toJSON() {
        return {
          w: this.w,
          b: this.b
        };
      }

      /** @inheritdoc */

    }], [{
      key: "fromJSON",
      value: function fromJSON(json) {
        var w = json.w,
            b = json.b;

        var layer = new this();
        layer.w = w;
        layer.b = b;
        return layer;
      }
    }]);

    return LinearLayer;
  }(_Layer3.default);

  exports.default = LinearLayer;

  /***/
},
/* 10 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  var _Layer2 = __webpack_require__(1);

  var _Layer3 = _interopRequireDefault(_Layer2);

  var _Matrix = __webpack_require__(0);

  var _Matrix2 = _interopRequireDefault(_Matrix);

  var _utils = __webpack_require__(2);

  var _invariant = __webpack_require__(3);

  var _invariant2 = _interopRequireDefault(_invariant);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  /**
   * Pooling layer
   * reduces the input size by taking the maximum value within the filterSize
   * sampling every stride steps
   * @extends Layer
   */
  var PoolingLayer = function (_Layer) {
    _inherits(PoolingLayer, _Layer);

    /**
     * @param  {Object} params
     * @param  {number} params.inW - width of input
     * @param  {number} params.inH - height of input
     * @param  {number} params.stride=2 - size of step
     * @param  {number} params.filterSize=2 - size of pooling filter
     */
    function PoolingLayer(_ref) {
      var inW = _ref.inW,
          inH = _ref.inH,
          inD = _ref.inD,
          _ref$stride = _ref.stride,
          stride = _ref$stride === undefined ? 2 : _ref$stride,
          strideX = _ref.strideX,
          strideY = _ref.strideY,
          _ref$filterSize = _ref.filterSize,
          filterSize = _ref$filterSize === undefined ? 2 : _ref$filterSize,
          filterW = _ref.filterW,
          filterH = _ref.filterH,
          _ref$zeroPadding = _ref.zeroPadding,
          zeroPadding = _ref$zeroPadding === undefined ? 0 : _ref$zeroPadding,
          zeroPaddingX = _ref.zeroPaddingX,
          zeroPaddingY = _ref.zeroPaddingY;

      _classCallCheck(this, PoolingLayer);

      var _this = _possibleConstructorReturn(this, (PoolingLayer.__proto__ || Object.getPrototypeOf(PoolingLayer)).call(this));

      _this.type = "pooling";

      (0, _invariant2.default)(inW !== undefined && inH !== undefined && inD !== undefined, "must specify inW, inH, and inD");
      _this.inW = inW;
      _this.inH = inH;
      _this.inD = inD;
      _this.strideX = strideX || stride;
      _this.strideY = strideY || stride;
      _this.filterW = filterW || filterSize;
      _this.filterH = filterH || filterSize;
      _this.zeroPaddingX = zeroPaddingX || zeroPadding;
      _this.zeroPaddingY = zeroPaddingY || zeroPadding;
      return _this;
    }

    _createClass(PoolingLayer, [{
      key: "volumize",
      value: function volumize(data) {
        var area = this.inW * this.inH;
        return Array(this.inD).fill(null).map(function (_, i) {
          return data.slice(i * area, (i + 1) * area);
        });
      }

      /** @inheritdoc */

    }, {
      key: "getOutput",
      value: function getOutput(activation) {
        var _this2 = this;

        var inW = this.inW,
            inH = this.inH,
            zeroPaddingX = this.zeroPaddingX,
            zeroPaddingY = this.zeroPaddingY,
            strideX = this.strideX,
            strideY = this.strideY,
            filterW = this.filterW,
            filterH = this.filterH;

        activation.maxIndices = [];

        activation.output = activation.input.map(function (singleInputArr, inputIdx) {
          var input = _this2.volumize(singleInputArr);
          var maxIndices = [];
          var layerMaxes = input.map(function (layer, layerIdx) {
            var values = [];

            for (var y = -zeroPaddingY; y <= inH + zeroPaddingY - filterH; y += strideY) {
              for (var x = -zeroPaddingX; x <= inW + zeroPaddingX - filterW; x += strideX) {
                var maxValue = -Infinity;
                var maxIndex = null;
                for (var oy = 0; oy < filterW; oy++) {
                  for (var ox = 0; ox < filterH; ox++) {
                    var ax = x + ox;
                    var ay = y + oy;

                    var val = void 0;
                    var idx = void 0;
                    var inZPadding = false;
                    if (ax < 0 || ax >= inW || ay < 0 || ay >= inH) {
                      inZPadding = true;
                      val = 0;
                    } else {
                      idx = ay * inW + ax;
                      val = layer[idx];
                    }

                    if (val > maxValue) {
                      maxValue = val;
                      maxIndex = inZPadding ? null : idx + layerIdx * inW * inH;
                    }
                  }
                }
                values.push(maxValue);
                if (maxIndex !== null) maxIndices.push(maxIndex);
              }
            }

            return values;
          });

          activation.maxIndices[inputIdx] = (0, _utils.flatten)(maxIndices);
          return (0, _utils.flatten)(layerMaxes);
        });
      }

      /** @inheritdoc */

    }, {
      key: "getInputGradient",
      value: function getInputGradient(activation) {
        var _this3 = this;

        activation.inputGradient = activation.outputGradient.map(function (og, wi) {
          var inpGrad = Array(_this3.inW * _this3.inH * _this3.inD).fill(0);
          activation.maxIndices[wi].forEach(function (maxIdx, i) {
            inpGrad[maxIdx] += og[i];
          });
          return inpGrad;
        });
      }

      /** @inheritdoc */

    }, {
      key: "toJSON",
      value: function toJSON() {
        return {
          inW: this.inW,
          inH: this.inH,
          stride: this.stride,
          filterSize: this.filterSize
        };
      }

      /** @inheritdoc */

    }], [{
      key: "fromJSON",
      value: function fromJSON(json) {
        var inW = json.inW,
            inH = json.inH,
            stride = json.stride,
            filterSize = json.filterSize;

        return new this({ inW: inW, inH: inH, stride: stride, filterSize: filterSize });
      }
    }]);

    return PoolingLayer;
  }(_Layer3.default);

  // const layer = new PoolingLayer({
  //   inW: 4,
  //   inH: 4,
  //   inD: 2,
  //   zeroPadding: 0,
  //   stride: 2,
  //   filterSize: 2,
  // })

  // const activ = {
  //   input: [
  //     [
  //       3,
  //       1,
  //       2,
  //       4,
  //       0,
  //       2,
  //       5,
  //       1,
  //       0,
  //       0,
  //       1,
  //       3,
  //       0,
  //       0,
  //       3,
  //       3,
  //       //l2
  //       1,
  //       2,
  //       1,
  //       2,
  //       1,
  //       3,
  //       3,
  //       2,
  //       4,
  //       1,
  //       4,
  //       5,
  //       0,
  //       0,
  //       0,
  //       0,
  //     ],
  //   ],
  // }

  // layer.getOutput(activ)

  // activ.outputGradient = [[1, 1, 1, 1, 1, 1, 1, 1]]
  // layer.getInputGradient(activ)
  // console.log(activ)

  // throw "pooling"


  exports.default = PoolingLayer;

  /***/
},
/* 11 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  var _Layer2 = __webpack_require__(1);

  var _Layer3 = _interopRequireDefault(_Layer2);

  var _invariant = __webpack_require__(3);

  var _invariant2 = _interopRequireDefault(_invariant);

  var _utils = __webpack_require__(2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function _objectWithoutProperties(obj, keys) {
    var target = {};for (var i in obj) {
      if (keys.indexOf(i) >= 0) continue;if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;target[i] = obj[i];
    }return target;
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function convolution(input, filter) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref$stride = _ref.stride,
        stride = _ref$stride === undefined ? 1 : _ref$stride,
        strideX = _ref.strideX,
        strideY = _ref.strideY,
        _ref$zeroPadding = _ref.zeroPadding,
        zeroPadding = _ref$zeroPadding === undefined ? 0 : _ref$zeroPadding,
        zeroPaddingX = _ref.zeroPaddingX,
        zeroPaddingY = _ref.zeroPaddingY;

    var inW = input.width;
    var inH = input.height;

    if (!zeroPaddingX) zeroPaddingX = zeroPadding;
    if (!zeroPaddingY) zeroPaddingY = zeroPadding;

    if (!strideX) strideX = stride;
    if (!strideY) strideY = stride;

    var filterW = filter.width;
    var filterH = filter.height;

    var out = [];

    function get(x, y) {
      if (x < 0 || x >= inW || y < 0 || y >= inH) return 0;
      return input.get(x, y);
    }

    for (var y = -zeroPaddingY; y <= inH + zeroPaddingY - filterH; y += strideY) {
      for (var x = -zeroPaddingX; x <= inW + zeroPaddingX - filterW; x += strideX) {
        var finalVal = 0;
        for (var fy = 0; fy < filterH; fy++) {
          for (var fx = 0; fx < filterW; fx++) {
            var fIdx = fy * filterW + fx;
            var fVal = filter.get(fx, fy);

            var ax = x + fx;
            var ay = y + fy;
            var val = get(ax, ay);

            finalVal += val * fVal;
          }
        }
        out.push(finalVal);
      }
    }

    return out;
  }

  var Matrix = function () {
    function Matrix(w, h, data) {
      var _this = this;

      _classCallCheck(this, Matrix);

      this.width = w;
      this.height = h;
      if (!data) data = new Array(w * h).fill(0);else if (typeof data === "function") {
        data = new Array(w * h).fill(0).map(function (_, i) {
          return data(_this.toCoords(i));
        });
      }
      this.data = data;
    }

    _createClass(Matrix, [{
      key: 'toIndex',
      value: function toIndex(x, y) {
        (0, _invariant2.default)(x >= 0 && x < this.width, "x out of bounds");
        (0, _invariant2.default)(y >= 0 && y < this.height, "y out of bounds");
        return y * this.width + x;
      }
    }, {
      key: 'toCoords',
      value: function toCoords(i) {
        var x = i % this.width;
        var y = (i - x) / this.width;
        return { x: x, y: y };
      }
    }, {
      key: 'get',
      value: function get(x, y) {
        var idx = this.toIndex(x, y);
        return this.data[idx];
      }
    }, {
      key: 'set',
      value: function set(x, y, val) {
        var idx = this.toIndex(x, y);
        this.data[idx] = val;
      }
    }, {
      key: 'forEach',
      value: function forEach(cb) {
        var _this2 = this;

        this.data.map(function (val, i) {
          var coords = _this2.toCoords(i);
          coords.index = i;
          return cb(val, coords, _this2);
        });
      }
    }, {
      key: 'map',
      value: function map(cb) {
        var _this3 = this;

        var newMatrix = new Matrix(this.width, this.height);
        newMatrix._data = this.data.map(function (val, i) {
          var coords = _this3.toCoords(i);
          coords.index = i;
          return cb(val, coords, _this3);
        });
        return newMatrix;
      }
    }, {
      key: 'spread',
      value: function spread(amountX) {
        var amountY = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : amountX;

        (0, _invariant2.default)(amountX > 0 && amountY > 0, "spread amount must tbe positive");
        var newWidth = amountX * (this.width - 1) + 1;
        var newHeight = amountY * (this.height - 1) + 1;
        var newMatrix = new Matrix(newWidth, newHeight);
        this.forEach(function (val, _ref2) {
          var x = _ref2.x,
              y = _ref2.y;

          var ax = x * amountX;
          var ay = y * amountY;
          newMatrix.set(ax, ay, val);
        });
        return newMatrix;
      }
    }, {
      key: 'rotate',
      value: function rotate() {
        var newMatrix = new Matrix(this.width, this.height);
        newMatrix.data = this.data.reverse();
        return newMatrix;
      }
    }, {
      key: 'flatten',
      value: function flatten() {
        return this.data;
      }
    }, {
      key: 'data',
      set: function set(val) {
        (0, _invariant2.default)(val.length === this.size, "data does not fit in matrix");
        this._data = val;
      },
      get: function get() {
        return this._data;
      }
    }, {
      key: 'size',
      get: function get() {
        return this.width * this.height;
      }
    }]);

    return Matrix;
  }();

  /**
   * Convolutional Layer
   * errrrr google it :/
   * @extends Layer
   */

  var ConvolutionalLayer = function (_Layer) {
    _inherits(ConvolutionalLayer, _Layer);

    /**
     * @param  {Object} params
     * @param  {number} params.inW - input width
     * @param  {number} params.inH - input height
     * @param  {number} params.inD - input depth
     * @param  {number} [params.stride=1] - stride length
     * @param  {number} [params.strideX] - stride length x
     * @param  {number} [params.strideY] - stride length y
     * @param  {number} [params.filterSize=2] - size of filter
     * @param  {number} [params.filterW] - size of filter w
     * @param  {number} [params.filterH] - size of filter
     * @param  {number} [filters=8] - number of filters to use
     * @param  {number} [zeroPadding=0] - padding to be applied before convolutions
     */
    function ConvolutionalLayer(_ref3) {
      var inW = _ref3.inW,
          inH = _ref3.inH,
          inD = _ref3.inD,
          _ref3$stride = _ref3.stride,
          stride = _ref3$stride === undefined ? 1 : _ref3$stride,
          strideX = _ref3.strideX,
          strideY = _ref3.strideY,
          _ref3$filterSize = _ref3.filterSize,
          filterSize = _ref3$filterSize === undefined ? 2 : _ref3$filterSize,
          filterW = _ref3.filterW,
          filterH = _ref3.filterH,
          _ref3$filters = _ref3.filters,
          filterCount = _ref3$filters === undefined ? 8 : _ref3$filters,
          _ref3$zeroPadding = _ref3.zeroPadding,
          zeroPadding = _ref3$zeroPadding === undefined ? 0 : _ref3$zeroPadding,
          zeroPaddingX = _ref3.zeroPaddingX,
          zeroPaddingY = _ref3.zeroPaddingY,
          unknownOptions = _objectWithoutProperties(_ref3, ['inW', 'inH', 'inD', 'stride', 'strideX', 'strideY', 'filterSize', 'filterW', 'filterH', 'filters', 'zeroPadding', 'zeroPaddingX', 'zeroPaddingY']);

      _classCallCheck(this, ConvolutionalLayer);

      var _this4 = _possibleConstructorReturn(this, (ConvolutionalLayer.__proto__ || Object.getPrototypeOf(ConvolutionalLayer)).call(this));

      _this4.type = "convolutional";

      (0, _invariant2.default)(inW !== undefined && inH !== undefined && inD !== undefined, "must specify inW, inH and inD");
      (0, _invariant2.default)(Object.keys(unknownOptions).length === 0, 'Unknown options: ' + Object.keys(unknownOptions));

      _this4.strideX = strideX || stride;
      _this4.strideY = strideY || stride;

      _this4.filterW = filterW || filterSize;
      _this4.filterH = filterH || filterSize;
      _this4.filterCount = filterCount;

      _this4.zeroPaddingX = zeroPaddingX || zeroPadding;
      _this4.zeroPaddingY = zeroPaddingY || zeroPadding;

      _this4.inW = inW;
      _this4.inH = inH;
      _this4.inD = inD;

      _this4.outW = (_this4.inW + 2 * _this4.zeroPaddingX - _this4.filterW) / _this4.strideX + 1;
      _this4.outH = (_this4.inH + 2 * _this4.zeroPaddingY - _this4.filterH) / _this4.strideY + 1;
      _this4.outD = filterCount;

      (0, _invariant2.default)(_this4.outW % 1 === 0 && _this4.outH % 1 === 0, "non integer output size");

      _this4.filters = Array(_this4.filterCount).fill(null).map(function () {
        //1 matrix per input layer
        return Array(_this4.inD).fill(null).map(function () {
          return new Matrix(_this4.filterW, _this4.filterH, function () {
            return Math.random() - 0.5;
          });
        });
      });

      return _this4;
    }

    // splits an array in n number of chunks
    // ([1,2,3,4], 2) => [[1,2], [3,4]]


    _createClass(ConvolutionalLayer, [{
      key: 'chunkInto',
      value: function chunkInto(arr, n) {
        (0, _invariant2.default)(arr.length % n === 0, "can't evenly chunk");
        var chunkSize = arr.length / n;
        var chunkedArr = [];
        for (var i = 0; i < arr.length; i += chunkSize) {
          chunkedArr.push(arr.slice(i, i + chunkSize));
        }
        return chunkedArr;
      }

      // converts an array into a volume
      // returns an array of matrices, each matrix is a layer and of size w, h

    }, {
      key: 'volumize',
      value: function volumize(w, h, d, arr) {
        (0, _invariant2.default)(w * h * d === arr.length, "invalid volume length");
        return this.chunkInto(arr, d).map(function (data) {
          return new Matrix(w, h, data);
        });
      }

      /** @inheritdoc */

    }, {
      key: 'getOutput',
      value: function getOutput(activation) {
        var _this5 = this;

        activation.output = activation.input.map(function (input) {
          // for each input split it into layers
          // each layer gets its own filter matrx
          var inputVolume = _this5.volumize(_this5.inW, _this5.inH, _this5.inD, input);

          // for each set of filters
          var eachFilterOutput = _this5.filters.map(function (filterVolume) {
            var convolvedLayers = inputVolume.map(function (layer, depth) {
              var filter = filterVolume[depth];
              return convolution(layer, filter, {
                strideX: _this5.strideX,
                strideY: _this5.strideY,
                zeroPaddingX: _this5.zeroPaddingX,
                zeroPaddingY: _this5.zeroPaddingY
              });
            });
            return convolvedLayers[0].map(function (_, i) {
              return convolvedLayers.reduce(function (acc, x) {
                return acc + x[i];
              }, 0);
            });
          });
          return (0, _utils.flatten)(eachFilterOutput);
        });
      }

      /** @inheritdoc */

    }, {
      key: 'getInputGradient',
      value: function getInputGradient(activation) {
        var _this6 = this;

        activation.inputGradient = activation.outputGradient.map(function (outputGradient) {
          (0, _invariant2.default)(_this6.outW * _this6.outH * _this6.outD === outputGradient.length, 'incorrect output gradient size');

          var outputGradientVolume = _this6.volumize(_this6.outW, _this6.outH, _this6.outD, outputGradient); // each layer is one filterSet

          var inputGradientVolume = outputGradientVolume.map(function (outputGradient, i) {
            var filterVolume = _this6.filters[i];

            var reverseZPaddingX = _this6.filterW - _this6.zeroPaddingX - 1;
            var reverseZPaddingY = _this6.filterH - _this6.zeroPaddingY - 1;
            var spreadOutGrad = outputGradient.spread(_this6.strideX, _this6.strideY);
            //may need to loop oer filter set

            var inputGradients = filterVolume.map(function (filter) {
              var rotatedFilter = filter.rotate();
              return convolution(spreadOutGrad, rotatedFilter, { zeroPaddingX: reverseZPaddingX, zeroPaddingY: reverseZPaddingY });
            });

            return (0, _utils.flatten)(inputGradients);
          });

          return (0, _utils.flatten)(inputGradientVolume);
        });
      }

      /** @inheritdoc */

    }, {
      key: 'getParamGrads',
      value: function getParamGrads(activation) {
        var _this7 = this;

        activation.paramGrads = activation.outputGradient.map(function (outputGradient, i) {
          var inputVolume = _this7.volumize(_this7.inW, _this7.inH, _this7.inD, activation.input[i]); //each input layer
          var outputGradientVolume = _this7.volumize(_this7.outW, _this7.outH, _this7.outD, outputGradient); // each layer is a filterVolume


          var filterGrads = outputGradientVolume.map(function (outputGradient, i) {
            // for each output layer map over all inputs to generate the filter grads
            var spreadOutGrad = outputGradient.spread(_this7.strideX, _this7.strideY);

            var x = inputVolume.map(function (input) {
              return convolution(input, spreadOutGrad, { zeroPaddingX: _this7.zeroPaddingX, zeroPaddingY: _this7.zeroPaddingY, stride: 1 });
            });

            // return x
            return (0, _utils.flatten)(x);
          });
          // return filterGrads;
          return (0, _utils.flatten)(filterGrads);
        });
      }

      /** @inheritdoc */

    }, {
      key: 'getParams',
      value: function getParams() {
        //TODO
        // console.log(flatten(flatten(this.filters)).map(mat => mat.flatten()))
        // debugger
        return (0, _utils.flatten)((0, _utils.flatten)((0, _utils.flatten)(this.filters)).map(function (mat) {
          return mat.flatten();
        }));
      }

      /** @inheritdoc */

    }, {
      key: 'setParams',
      value: function setParams(val) {
        var _this8 = this;

        this.filters = this.chunkInto(val, this.filterCount).map(function (arr) {
          return _this8.chunkInto(arr, _this8.inD).map(function (arr) {
            return new Matrix(_this8.filterW, _this8.filterH, arr);
          });
        });
      }

      /** @inheritdoc */

    }, {
      key: 'toJSON',
      value: function toJSON() {
        return {
          inW: this.inW,
          inH: this.inH,
          inD: this.inD,
          strideX: this.strideX,
          strideY: this.strideY,
          filterW: this.filterW,
          filterH: this.filterH,
          filterCount: this.filterCount,
          zeroPaddingX: this.zeroPaddingX,
          zeroPaddingY: this.zeroPaddingY,
          params: this.getParams()
        };
      }

      /** @inheritdoc */

    }], [{
      key: 'fromJSON',
      value: function fromJSON(json) {
        var params = json.params,
            args = _objectWithoutProperties(json, ['params']);

        var layer = new this(args);
        layer.setParams(params);
        return layer;
      }
    }]);

    return ConvolutionalLayer;
  }(_Layer3.default);

  // import Activation from '../Activation'


  // const conv = new ConvolutionalLayer({
  //   inW: 5,
  //   inH: 5,
  //   inD: 3,
  //   stride: 2,
  //   zeroPadding: 1,
  //   filters: 1,
  //   filterSize: 3
  // });

  // const activation = {
  //   input: [
  //     [
  //       1,0,0,0,2,
  //       0,0,0,2,2,
  //       2,0,0,2,1,
  //       2,2,2,1,2,
  //       1,1,1,0,1,

  //       0,2,2,2,2,
  //       1,0,1,2,0,
  //       1,0,0,1,2,
  //       0,0,0,2,2,
  //       0,1,0,2,1,

  //       0,0,1,0,0,
  //       2,0,2,1,2,
  //       1,2,2,1,2,
  //       2,1,2,2,0,
  //       0,2,2,2,2
  //     ]
  //   ],

  // };
  // conv.filters[0][0].data = [0,-1,-1,1,-1,1,-1,0,0]
  // conv.filters[0][1].data = [-1,-1,1,0,-1,1,1,1,0]
  // conv.filters[0][2].data = [1,0,-1,-1,-1,-1,1,-1,1]

  // // conv.filters[1][0].data = [1,-1,0,0,-1,-1,-1,-1,0]
  // // conv.filters[1][1].data = [0,0,1,-1,0,-1,1,0,0]
  // // conv.filters[1][2].data = [-1,1,-1,1,-1,0,-1,0,-1]


  // conv.getOutput(activation);

  // activation.outputGradient = [
  //   [1,0,2,-1,0,0,1,2,2],
  // ]

  // conv.getInputGradient(activation)
  // console.log(activation);


  // throw 'stop'


  exports.default = ConvolutionalLayer;

  /***/
},
/* 12 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  var _Layer2 = __webpack_require__(1);

  var _Layer3 = _interopRequireDefault(_Layer2);

  var _Matrix = __webpack_require__(0);

  var _Matrix2 = _interopRequireDefault(_Matrix);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  /**
   * Softmax activation layer
   * @extends Layer
   */
  var SigmoidLayer = function (_Layer) {
    _inherits(SigmoidLayer, _Layer);

    function SigmoidLayer() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck(this, SigmoidLayer);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = SigmoidLayer.__proto__ || Object.getPrototypeOf(SigmoidLayer)).call.apply(_ref, [this].concat(args))), _this), _this.type = "sigmoid", _this.f = function (x) {
        return 1 / (1 + Math.exp(-x));
      }, _this.fPrime = function (x) {
        return x * (1 - x);
      }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    /**
     * @param  {number} x
     * @returns {number} sigmoid of x
     */

    /**
     * @param  {number} x
     * @returns {number} differential sigmoid of x
     */

    _createClass(SigmoidLayer, [{
      key: "getOutput",

      /** @inheritdoc */
      value: function getOutput(activation) {
        activation.output = _Matrix2.default.map(activation.input, this.f);
      }

      /** @inheritdoc */

    }, {
      key: "getInputGradient",
      value: function getInputGradient(activation) {
        activation.inputGradient = _Matrix2.default.multiply(_Matrix2.default.map(activation.output, this.fPrime), activation.outputGradient);
      }
    }]);

    return SigmoidLayer;
  }(_Layer3.default);

  exports.default = SigmoidLayer;

  /***/
},
/* 13 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  var _Layer2 = __webpack_require__(1);

  var _Layer3 = _interopRequireDefault(_Layer2);

  var _Matrix = __webpack_require__(0);

  var _Matrix2 = _interopRequireDefault(_Matrix);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  /**
   * Relu activation layer
   * @extends Layer
   */
  var ReluLayer = function (_Layer) {
    _inherits(ReluLayer, _Layer);

    function ReluLayer() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck(this, ReluLayer);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = ReluLayer.__proto__ || Object.getPrototypeOf(ReluLayer)).call.apply(_ref, [this].concat(args))), _this), _this.type = "relu", _this.f = function (x) {
        return Math.max(0, x);
      }, _this.fPrime = function (x) {
        return x > 0 ? 1 : 0;
      }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    /**
     * @param  {number} x
     * @returns {number} max of [0, x]
     */

    /**
     * @param  {number} x
     * @returns {number} differential of relu?
     */

    _createClass(ReluLayer, [{
      key: "getOutput",

      /** @inheritdoc */
      value: function getOutput(activation) {
        activation.output = _Matrix2.default.map(activation.input, this.f);
      }

      /** @inheritdoc */

    }, {
      key: "getInputGradient",
      value: function getInputGradient(activation) {
        activation.inputGradient = _Matrix2.default.multiply(_Matrix2.default.map(activation.output, this.fPrime), activation.outputGradient);
      }
    }]);

    return ReluLayer;
  }(_Layer3.default);

  exports.default = ReluLayer;

  /***/
},
/* 14 */
/***/function (module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  var _Layer2 = __webpack_require__(1);

  var _Layer3 = _interopRequireDefault(_Layer2);

  var _Matrix = __webpack_require__(0);

  var _Matrix2 = _interopRequireDefault(_Matrix);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  /**
   * Softmax output layer
   * @extends Layer
   */
  var SoftmaxLayer = function (_Layer) {
    _inherits(SoftmaxLayer, _Layer);

    function SoftmaxLayer() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck(this, SoftmaxLayer);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = SoftmaxLayer.__proto__ || Object.getPrototypeOf(SoftmaxLayer)).call.apply(_ref, [this].concat(args))), _this), _this.type = "softmax", _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(SoftmaxLayer, [{
      key: "getOutput",

      /** @inheritdoc */
      value: function getOutput(activation) {
        var inpExp = _Matrix2.default.map(activation.input, function (x) {
          return Math.exp(x);
        });
        var sums = inpExp.map(function (row) {
          return row.reduce(function () {
            var a = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            return a + b;
          });
        });
        activation.output = _Matrix2.default.map(inpExp, function (inp, x, y) {
          return Math.round(1000 * inp / sums[y]) / 1000;
        });
      }

      /** @inheritdoc */

    }, {
      key: "getInputGradient",
      value: function getInputGradient(activation) {
        var outputGradient = activation.outputGradient,
            output = activation.output;

        activation.inputGradient = _Matrix2.default.map(outputGradient, function (grad) {
          return grad / output[0].length;
        });
      }
    }]);

    return SoftmaxLayer;
  }(_Layer3.default);

  exports.default = SoftmaxLayer;

  /***/
}]
/******/));

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var util = __webpack_require__(0);
var Stream = __webpack_require__(3);
var Parser = __webpack_require__(18);
var Packer = __webpack_require__(20);
var PNGSync = __webpack_require__(23);

var PNG = exports.PNG = function (options) {
  Stream.call(this);

  options = options || {}; // eslint-disable-line no-param-reassign

  // coerce pixel dimensions to integers (also coerces undefined -> 0):
  this.width = options.width | 0;
  this.height = options.height | 0;

  this.data = this.width > 0 && this.height > 0 ? new Buffer(4 * this.width * this.height) : null;

  if (options.fill && this.data) {
    this.data.fill(0);
  }

  this.gamma = 0;
  this.readable = this.writable = true;

  this._parser = new Parser(options);

  this._parser.on('error', this.emit.bind(this, 'error'));
  this._parser.on('close', this._handleClose.bind(this));
  this._parser.on('metadata', this._metadata.bind(this));
  this._parser.on('gamma', this._gamma.bind(this));
  this._parser.on('parsed', function (data) {
    this.data = data;
    this.emit('parsed', data);
  }.bind(this));

  this._packer = new Packer(options);
  this._packer.on('data', this.emit.bind(this, 'data'));
  this._packer.on('end', this.emit.bind(this, 'end'));
  this._parser.on('close', this._handleClose.bind(this));
  this._packer.on('error', this.emit.bind(this, 'error'));
};
util.inherits(PNG, Stream);

PNG.sync = PNGSync;

PNG.prototype.pack = function () {

  if (!this.data || !this.data.length) {
    this.emit('error', 'No data provided');
    return this;
  }

  process.nextTick(function () {
    this._packer.pack(this.data, this.width, this.height, this.gamma);
  }.bind(this));

  return this;
};

PNG.prototype.parse = function (data, callback) {

  if (callback) {
    var onParsed, onError;

    onParsed = function (parsedData) {
      this.removeListener('error', onError);

      this.data = parsedData;
      callback(null, this);
    }.bind(this);

    onError = function (err) {
      this.removeListener('parsed', onParsed);

      callback(err, null);
    }.bind(this);

    this.once('parsed', onParsed);
    this.once('error', onError);
  }

  this.end(data);
  return this;
};

PNG.prototype.write = function (data) {
  this._parser.write(data);
  return true;
};

PNG.prototype.end = function (data) {
  this._parser.end(data);
};

PNG.prototype._metadata = function (metadata) {
  this.width = metadata.width;
  this.height = metadata.height;

  this.emit('metadata', metadata);
};

PNG.prototype._gamma = function (gamma) {
  this.gamma = gamma;
};

PNG.prototype._handleClose = function () {
  if (!this._parser.writable && !this._packer.readable) {
    this.emit('close');
  }
};

PNG.bitblt = function (src, dst, srcX, srcY, width, height, deltaX, deltaY) {
  // eslint-disable-line max-params
  // coerce pixel dimensions to integers (also coerces undefined -> 0):
  /* eslint-disable no-param-reassign */
  srcX |= 0;
  srcY |= 0;
  width |= 0;
  height |= 0;
  deltaX |= 0;
  deltaY |= 0;
  /* eslint-enable no-param-reassign */

  if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) {
    throw new Error('bitblt reading outside image');
  }

  if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) {
    throw new Error('bitblt writing outside image');
  }

  for (var y = 0; y < height; y++) {
    src.data.copy(dst.data, (deltaY + y) * dst.width + deltaX << 2, (srcY + y) * src.width + srcX << 2, (srcY + y) * src.width + srcX + width << 2);
  }
};

PNG.prototype.bitblt = function (dst, srcX, srcY, width, height, deltaX, deltaY) {
  // eslint-disable-line max-params

  PNG.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
  return this;
};

PNG.adjustGamma = function (src) {
  if (src.gamma) {
    for (var y = 0; y < src.height; y++) {
      for (var x = 0; x < src.width; x++) {
        var idx = src.width * y + x << 2;

        for (var i = 0; i < 3; i++) {
          var sample = src.data[idx + i] / 255;
          sample = Math.pow(sample, 1 / 2.2 / src.gamma);
          src.data[idx + i] = Math.round(sample * 255);
        }
      }
    }
    src.gamma = 0;
  }
};

PNG.prototype.adjustGamma = function () {
  PNG.adjustGamma(this);
};

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var util = __webpack_require__(0);
var zlib = __webpack_require__(1);
var ChunkStream = __webpack_require__(5);
var FilterAsync = __webpack_require__(19);
var Parser = __webpack_require__(9);
var bitmapper = __webpack_require__(11);
var formatNormaliser = __webpack_require__(12);

var ParserAsync = module.exports = function (options) {
  ChunkStream.call(this);

  this._parser = new Parser(options, {
    read: this.read.bind(this),
    error: this._handleError.bind(this),
    metadata: this._handleMetaData.bind(this),
    gamma: this.emit.bind(this, 'gamma'),
    palette: this._handlePalette.bind(this),
    transColor: this._handleTransColor.bind(this),
    finished: this._finished.bind(this),
    inflateData: this._inflateData.bind(this)
  });
  this._options = options;
  this.writable = true;

  this._parser.start();
};
util.inherits(ParserAsync, ChunkStream);

ParserAsync.prototype._handleError = function (err) {

  this.emit('error', err);

  this.writable = false;

  this.destroy();

  if (this._inflate && this._inflate.destroy) {
    this._inflate.destroy();
  }

  this.errord = true;
};

ParserAsync.prototype._inflateData = function (data) {
  if (!this._inflate) {
    if (this._bitmapInfo.interlace) {
      this._inflate = zlib.createInflate();

      this._inflate.on('error', this.emit.bind(this, 'error'));
      this._filter.on('complete', this._complete.bind(this));

      this._inflate.pipe(this._filter);
    } else {
      var rowSize = (this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1;
      var imageSize = rowSize * this._bitmapInfo.height;
      var chunkSize = Math.max(imageSize, zlib.Z_MIN_CHUNK);

      this._inflate = zlib.createInflate({ chunkSize: chunkSize });
      var leftToInflate = imageSize;

      var emitError = this.emit.bind(this, 'error');
      this._inflate.on('error', function (err) {
        if (!leftToInflate) {
          return;
        }

        emitError(err);
      });
      this._filter.on('complete', this._complete.bind(this));

      var filterWrite = this._filter.write.bind(this._filter);
      this._inflate.on('data', function (chunk) {
        if (!leftToInflate) {
          return;
        }

        if (chunk.length > leftToInflate) {
          chunk = chunk.slice(0, leftToInflate);
        }

        leftToInflate -= chunk.length;

        filterWrite(chunk);
      });

      this._inflate.on('end', this._filter.end.bind(this._filter));
    }
  }
  this._inflate.write(data);
};

ParserAsync.prototype._handleMetaData = function (metaData) {

  this.emit('metadata', metaData);

  this._bitmapInfo = Object.create(metaData);

  this._filter = new FilterAsync(this._bitmapInfo);
};

ParserAsync.prototype._handleTransColor = function (transColor) {
  this._bitmapInfo.transColor = transColor;
};

ParserAsync.prototype._handlePalette = function (palette) {
  this._bitmapInfo.palette = palette;
};

ParserAsync.prototype._finished = function () {
  if (this.errord) {
    return;
  }

  if (!this._inflate) {
    this.emit('error', 'No Inflate block');
  } else {
    // no more data to inflate
    this._inflate.end();
  }
  this.destroySoon();
};

ParserAsync.prototype._complete = function (filteredData) {

  if (this.errord) {
    return;
  }

  try {
    var bitmapData = bitmapper.dataToBitMap(filteredData, this._bitmapInfo);

    var normalisedBitmapData = formatNormaliser(bitmapData, this._bitmapInfo);
    bitmapData = null;
  } catch (ex) {
    this._handleError(ex);
    return;
  }

  this.emit('parsed', normalisedBitmapData);
};

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var util = __webpack_require__(0);
var ChunkStream = __webpack_require__(5);
var Filter = __webpack_require__(6);

var FilterAsync = module.exports = function (bitmapInfo) {
  ChunkStream.call(this);

  var buffers = [];
  var that = this;
  this._filter = new Filter(bitmapInfo, {
    read: this.read.bind(this),
    write: function write(buffer) {
      buffers.push(buffer);
    },
    complete: function complete() {
      that.emit('complete', Buffer.concat(buffers));
    }
  });

  this._filter.start();
};
util.inherits(FilterAsync, ChunkStream);

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var util = __webpack_require__(0);
var Stream = __webpack_require__(3);
var constants = __webpack_require__(2);
var Packer = __webpack_require__(13);

var PackerAsync = module.exports = function (opt) {
  Stream.call(this);

  var options = opt || {};

  this._packer = new Packer(options);
  this._deflate = this._packer.createDeflate();

  this.readable = true;
};
util.inherits(PackerAsync, Stream);

PackerAsync.prototype.pack = function (data, width, height, gamma) {
  // Signature
  this.emit('data', new Buffer(constants.PNG_SIGNATURE));
  this.emit('data', this._packer.packIHDR(width, height));

  if (gamma) {
    this.emit('data', this._packer.packGAMA(gamma));
  }

  var filteredData = this._packer.filterData(data, width, height);

  // compress it
  this._deflate.on('error', this.emit.bind(this, 'error'));

  this._deflate.on('data', function (compressedData) {
    this.emit('data', this._packer.packIDAT(compressedData));
  }.bind(this));

  this._deflate.on('end', function () {
    this.emit('data', this._packer.packIEND());
    this.emit('end');
  }.bind(this));

  this._deflate.end(filteredData);
};

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var constants = __webpack_require__(2);

module.exports = function (dataIn, width, height, options) {
  var outHasAlpha = [constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(options.colorType) !== -1;
  if (options.colorType === options.inputColorType) {
    var bigEndian = function () {
      var buffer = new ArrayBuffer(2);
      new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
      // Int16Array uses the platform's endianness.
      return new Int16Array(buffer)[0] !== 256;
    }();
    // If no need to convert to grayscale and alpha is present/absent in both, take a fast route
    if (options.bitDepth === 8 || options.bitDepth === 16 && bigEndian) {
      return dataIn;
    }
  }

  // map to a UInt16 array if data is 16bit, fix endianness below
  var data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);

  var maxValue = 255;
  var inBpp = constants.COLORTYPE_TO_BPP_MAP[options.inputColorType];
  if (inBpp == 4 && !options.inputHasAlpha) inBpp = 3;
  var outBpp = constants.COLORTYPE_TO_BPP_MAP[options.colorType];
  if (options.bitDepth === 16) {
    maxValue = 65535;
    outBpp *= 2;
  }
  var outData = new Buffer(width * height * outBpp);

  var inIndex = 0;
  var outIndex = 0;

  var bgColor = options.bgColor || {};
  if (bgColor.red === undefined) {
    bgColor.red = maxValue;
  }
  if (bgColor.green === undefined) {
    bgColor.green = maxValue;
  }
  if (bgColor.blue === undefined) {
    bgColor.blue = maxValue;
  }

  function getRGBA(data, inIndex) {
    var red,
        green,
        blue,
        alpha = maxValue;
    switch (options.inputColorType) {
      case constants.COLORTYPE_COLOR_ALPHA:
        alpha = data[inIndex + 3];
        red = data[inIndex];
        green = data[inIndex + 1];
        blue = data[inIndex + 2];
        break;
      case constants.COLORTYPE_COLOR:
        red = data[inIndex];
        green = data[inIndex + 1];
        blue = data[inIndex + 2];
        break;
      case constants.COLORTYPE_ALPHA:
        alpha = data[inIndex + 1];
        red = data[inIndex];
        green = red;
        blue = red;
        break;
      case constants.COLORTYPE_GRAYSCALE:
        red = data[inIndex];
        green = red;
        blue = red;
        break;
      default:
        throw new Error('input color type:' + options.inputColorType + ' is not supported at present');
    }

    if (options.inputHasAlpha) {
      if (!outHasAlpha) {
        alpha /= maxValue;
        red = Math.min(Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0), maxValue);
        green = Math.min(Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0), maxValue);
        blue = Math.min(Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0), maxValue);
      }
    }
    return { red: red, green: green, blue: blue, alpha: alpha };
  }

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var rgba = getRGBA(data, inIndex);

      switch (options.colorType) {
        case constants.COLORTYPE_COLOR_ALPHA:
        case constants.COLORTYPE_COLOR:
          if (options.bitDepth === 8) {
            outData[outIndex] = rgba.red;
            outData[outIndex + 1] = rgba.green;
            outData[outIndex + 2] = rgba.blue;
            if (outHasAlpha) {
              outData[outIndex + 3] = rgba.alpha;
            }
          } else {
            outData.writeUInt16BE(rgba.red, outIndex);
            outData.writeUInt16BE(rgba.green, outIndex + 2);
            outData.writeUInt16BE(rgba.blue, outIndex + 4);
            if (outHasAlpha) {
              outData.writeUInt16BE(rgba.alpha, outIndex + 6);
            }
          }
          break;
        case constants.COLORTYPE_ALPHA:
        case constants.COLORTYPE_GRAYSCALE:
          // Convert to grayscale and alpha
          var grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
          if (options.bitDepth === 8) {
            outData[outIndex] = grayscale;
            if (outHasAlpha) {
              outData[outIndex + 1] = rgba.alpha;
            }
          } else {
            outData.writeUInt16BE(grayscale, outIndex);
            if (outHasAlpha) {
              outData.writeUInt16BE(rgba.alpha, outIndex + 2);
            }
          }
          break;
      }

      inIndex += inBpp;
      outIndex += outBpp;
    }
  }

  return outData;
};

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var paethPredictor = __webpack_require__(8);

function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
  pxData.copy(rawData, rawPos, pxPos, pxPos + byteWidth);
}

function filterSumNone(pxData, pxPos, byteWidth) {

  var sum = 0;
  var length = pxPos + byteWidth;

  for (var i = pxPos; i < length; i++) {
    sum += Math.abs(pxData[i]);
  }
  return sum;
}

function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var val = pxData[pxPos + x] - left;

    rawData[rawPos + x] = val;
  }
}

function filterSumSub(pxData, pxPos, byteWidth, bpp) {

  var sum = 0;
  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var val = pxData[pxPos + x] - left;

    sum += Math.abs(val);
  }

  return sum;
}

function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {

  for (var x = 0; x < byteWidth; x++) {

    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
    var val = pxData[pxPos + x] - up;

    rawData[rawPos + x] = val;
  }
}

function filterSumUp(pxData, pxPos, byteWidth) {

  var sum = 0;
  var length = pxPos + byteWidth;
  for (var x = pxPos; x < length; x++) {

    var up = pxPos > 0 ? pxData[x - byteWidth] : 0;
    var val = pxData[x] - up;

    sum += Math.abs(val);
  }

  return sum;
}

function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
    var val = pxData[pxPos + x] - (left + up >> 1);

    rawData[rawPos + x] = val;
  }
}

function filterSumAvg(pxData, pxPos, byteWidth, bpp) {

  var sum = 0;
  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
    var val = pxData[pxPos + x] - (left + up >> 1);

    sum += Math.abs(val);
  }

  return sum;
}

function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
    var upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
    var val = pxData[pxPos + x] - paethPredictor(left, up, upleft);

    rawData[rawPos + x] = val;
  }
}

function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
  var sum = 0;
  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
    var upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
    var val = pxData[pxPos + x] - paethPredictor(left, up, upleft);

    sum += Math.abs(val);
  }

  return sum;
}

var filters = {
  0: filterNone,
  1: filterSub,
  2: filterUp,
  3: filterAvg,
  4: filterPaeth
};

var filterSums = {
  0: filterSumNone,
  1: filterSumSub,
  2: filterSumUp,
  3: filterSumAvg,
  4: filterSumPaeth
};

module.exports = function (pxData, width, height, options, bpp) {

  var filterTypes;
  if (!('filterType' in options) || options.filterType === -1) {
    filterTypes = [0, 1, 2, 3, 4];
  } else if (typeof options.filterType === 'number') {
    filterTypes = [options.filterType];
  } else {
    throw new Error('unrecognised filter types');
  }

  if (options.bitDepth === 16) bpp *= 2;
  var byteWidth = width * bpp;
  var rawPos = 0;
  var pxPos = 0;
  var rawData = new Buffer((byteWidth + 1) * height);

  var sel = filterTypes[0];

  for (var y = 0; y < height; y++) {

    if (filterTypes.length > 1) {
      // find best filter for this line (with lowest sum of values)
      var min = Infinity;

      for (var i = 0; i < filterTypes.length; i++) {
        var sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
        if (sum < min) {
          sel = filterTypes[i];
          min = sum;
        }
      }
    }

    rawData[rawPos] = sel;
    rawPos++;
    filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
    rawPos += byteWidth;
    pxPos += byteWidth;
  }
  return rawData;
};

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var parse = __webpack_require__(24);
var pack = __webpack_require__(29);

exports.read = function (buffer, options) {

  return parse(buffer, options || {});
};

exports.write = function (png, options) {

  return pack(png, options);
};

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var hasSyncZlib = true;
var zlib = __webpack_require__(1);
var inflateSync = __webpack_require__(25);
if (!zlib.deflateSync) {
  hasSyncZlib = false;
}
var SyncReader = __webpack_require__(14);
var FilterSync = __webpack_require__(28);
var Parser = __webpack_require__(9);
var bitmapper = __webpack_require__(11);
var formatNormaliser = __webpack_require__(12);

module.exports = function (buffer, options) {

  if (!hasSyncZlib) {
    throw new Error('To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0');
  }

  var err;
  function handleError(_err_) {
    err = _err_;
  }

  var metaData;
  function handleMetaData(_metaData_) {
    metaData = _metaData_;
  }

  function handleTransColor(transColor) {
    metaData.transColor = transColor;
  }

  function handlePalette(palette) {
    metaData.palette = palette;
  }

  var gamma;
  function handleGamma(_gamma_) {
    gamma = _gamma_;
  }

  var inflateDataList = [];
  function handleInflateData(inflatedData) {
    inflateDataList.push(inflatedData);
  }

  var reader = new SyncReader(buffer);

  var parser = new Parser(options, {
    read: reader.read.bind(reader),
    error: handleError,
    metadata: handleMetaData,
    gamma: handleGamma,
    palette: handlePalette,
    transColor: handleTransColor,
    inflateData: handleInflateData
  });

  parser.start();
  reader.process();

  if (err) {
    throw err;
  }

  //join together the inflate datas
  var inflateData = Buffer.concat(inflateDataList);
  inflateDataList.length = 0;

  var inflatedData;
  if (metaData.interlace) {
    inflatedData = zlib.inflateSync(inflateData);
  } else {
    var rowSize = (metaData.width * metaData.bpp * metaData.depth + 7 >> 3) + 1;
    var imageSize = rowSize * metaData.height;
    inflatedData = inflateSync(inflateData, { chunkSize: imageSize, maxLength: imageSize });
  }
  inflateData = null;

  if (!inflatedData || !inflatedData.length) {
    throw new Error('bad png - invalid inflate data response');
  }

  var unfilteredData = FilterSync.process(inflatedData, metaData);
  inflateData = null;

  var bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
  unfilteredData = null;

  var normalisedBitmapData = formatNormaliser(bitmapData, metaData);

  metaData.data = normalisedBitmapData;
  metaData.gamma = gamma || 0;

  return metaData;
};

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var assert = __webpack_require__(26).ok;
var zlib = __webpack_require__(1);
var util = __webpack_require__(0);

var kMaxLength = __webpack_require__(27).kMaxLength;

function Inflate(opts) {
  if (!(this instanceof Inflate)) {
    return new Inflate(opts);
  }

  if (opts && opts.chunkSize < zlib.Z_MIN_CHUNK) {
    opts.chunkSize = zlib.Z_MIN_CHUNK;
  }

  zlib.Inflate.call(this, opts);

  if (opts && opts.maxLength != null) {
    this._maxLength = opts.maxLength;
  }
}

function createInflate(opts) {
  return new Inflate(opts);
}

function _close(engine, callback) {
  if (callback) {
    process.nextTick(callback);
  }

  // Caller may invoke .close after a zlib error (which will null _handle).
  if (!engine._handle) {
    return;
  }

  engine._handle.close();
  engine._handle = null;
}

Inflate.prototype._processChunk = function (chunk, flushFlag, asyncCb) {
  if (typeof asyncCb === 'function') {
    return zlib.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
  }

  var self = this;

  var availInBefore = chunk && chunk.length;
  var availOutBefore = this._chunkSize - this._offset;
  var leftToInflate = this._maxLength;
  var inOff = 0;

  var buffers = [];
  var nread = 0;

  var error;
  this.on('error', function (err) {
    error = err;
  });

  function handleChunk(availInAfter, availOutAfter) {
    if (self._hadError) {
      return;
    }

    var have = availOutBefore - availOutAfter;
    assert(have >= 0, 'have should not go down');

    if (have > 0) {
      var out = self._buffer.slice(self._offset, self._offset + have);
      self._offset += have;

      if (out.length > leftToInflate) {
        out = out.slice(0, leftToInflate);
      }

      buffers.push(out);
      nread += out.length;
      leftToInflate -= out.length;

      if (leftToInflate === 0) {
        return false;
      }
    }

    if (availOutAfter === 0 || self._offset >= self._chunkSize) {
      availOutBefore = self._chunkSize;
      self._offset = 0;
      self._buffer = Buffer.allocUnsafe(self._chunkSize);
    }

    if (availOutAfter === 0) {
      inOff += availInBefore - availInAfter;
      availInBefore = availInAfter;

      return true;
    }

    return false;
  }

  assert(this._handle, 'zlib binding closed');
  do {
    var res = this._handle.writeSync(flushFlag, chunk, // in
    inOff, // in_off
    availInBefore, // in_len
    this._buffer, // out
    this._offset, //out_off
    availOutBefore); // out_len
  } while (!this._hadError && handleChunk(res[0], res[1]));

  if (this._hadError) {
    throw error;
  }

  if (nread >= kMaxLength) {
    _close(this);
    throw new RangeError('Cannot create final Buffer. It would be larger than 0x' + kMaxLength.toString(16) + ' bytes');
  }

  var buf = Buffer.concat(buffers, nread);
  _close(this);

  return buf;
};

util.inherits(Inflate, zlib.Inflate);

function zlibBufferSync(engine, buffer) {
  if (typeof buffer === 'string') {
    buffer = Buffer.from(buffer);
  }
  if (!(buffer instanceof Buffer)) {
    throw new TypeError('Not a string or buffer');
  }

  var flushFlag = engine._finishFlushFlag;
  if (flushFlag == null) {
    flushFlag = zlib.Z_FINISH;
  }

  return engine._processChunk(buffer, flushFlag);
}

function inflateSync(buffer, opts) {
  return zlibBufferSync(new Inflate(opts), buffer);
}

module.exports = exports = inflateSync;
exports.Inflate = Inflate;
exports.createInflate = createInflate;
exports.inflateSync = inflateSync;

/***/ }),
/* 26 */
/***/ (function(module, exports) {

module.exports = require("assert");

/***/ }),
/* 27 */
/***/ (function(module, exports) {

module.exports = require("buffer");

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var SyncReader = __webpack_require__(14);
var Filter = __webpack_require__(6);

exports.process = function (inBuffer, bitmapInfo) {

  var outBuffers = [];
  var reader = new SyncReader(inBuffer);
  var filter = new Filter(bitmapInfo, {
    read: reader.read.bind(reader),
    write: function write(bufferPart) {
      outBuffers.push(bufferPart);
    },
    complete: function complete() {}
  });

  filter.start();
  reader.process();

  return Buffer.concat(outBuffers);
};

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var hasSyncZlib = true;
var zlib = __webpack_require__(1);
if (!zlib.deflateSync) {
  hasSyncZlib = false;
}
var constants = __webpack_require__(2);
var Packer = __webpack_require__(13);

module.exports = function (metaData, opt) {

  if (!hasSyncZlib) {
    throw new Error('To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0');
  }

  var options = opt || {};

  var packer = new Packer(options);

  var chunks = [];

  // Signature
  chunks.push(new Buffer(constants.PNG_SIGNATURE));

  // Header
  chunks.push(packer.packIHDR(metaData.width, metaData.height));

  if (metaData.gamma) {
    chunks.push(packer.packGAMA(metaData.gamma));
  }

  var filteredData = packer.filterData(metaData.data, metaData.width, metaData.height);

  // compress it
  var compressedData = zlib.deflateSync(filteredData, packer.getDeflateOptions());
  filteredData = null;

  if (!compressedData || !compressedData.length) {
    throw new Error('bad png - invalid compressed data response');
  }
  chunks.push(packer.packIDAT(compressedData));

  // End
  chunks.push(packer.packIEND());

  return Buffer.concat(chunks);
};

/***/ })
/******/ ])));