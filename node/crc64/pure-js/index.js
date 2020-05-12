/**
 * Kaidi ZHU <zhukaidi@souche.com> created at 2017-09-07 16:02:19 with ❤
 *
 * Copyright (c) 2017 Souche.com, all rights reserved.
 */
"use strict";

const fs = require("fs");

const binding = require("./crc");

const raw = {
  crc64: binding.cwrap("crc64", "null", ["number", "number", "number"]),
  crc64Init: binding.cwrap("crc64_init", "null", []),
  strToUint64Ptr: binding.cwrap("str_to_uint64", "null", ["number", "number"]),
  uint64PtrToStr: binding.cwrap("uint64_to_str", "null", ["number", "number"]),
};

raw.crc64Init();

function strToUint64Ptr(str) {
  const strPtr = binding._malloc(str.length + 1);
  binding.stringToUTF8(str, strPtr, str.length + 1);

  const uint64Ptr = binding._malloc(8);
  raw.strToUint64Ptr(strPtr, uint64Ptr);
  binding._free(strPtr);

  return uint64Ptr;
}

function uint64PtrToStr(uint64Ptr) {
  const strPtr = binding._malloc(32);
  raw.uint64PtrToStr(strPtr, uint64Ptr);
  const str = binding.UTF8ToString(strPtr);
  binding._free(strPtr);
  return str;
}

function buffToPtr(buff) {
  if (typeof buff === "string") {
    buff = new Buffer(buff);
  } else if (!Buffer.isBuffer(buff)) {
    throw new Error("Invalid buffer type.");
  }

  const buffPtr = binding._malloc(buff.length);
  binding.writeArrayToMemory(buff, buffPtr);

  return buffPtr;
}

module.exports.crc64 = function (buff, prev) {
  if (!prev) prev = "0";
  if (typeof prev !== "string" || !/\d+/.test(prev)) {
    throw new Error("Invlid previous value.");
  }

  const prevPtr = strToUint64Ptr(prev);
  const buffPtr = buffToPtr(buff);

  raw.crc64(prevPtr, buffPtr, buff.length);
  const ret = uint64PtrToStr(prevPtr);

  binding._free(prevPtr);
  binding._free(buffPtr);

  return ret;
};

module.exports.crc64File = function (filename, callback) {
  let errored = false;
  const stream = fs.createReadStream(filename);
  const crcPtr = strToUint64Ptr("0");
  let crcPtrFreed = false;
  stream.on("error", function (err) {
    errored = true;
    stream.destroy();
    if (!crcPtrFreed) {
      binding._free(crcPtr);
      crcPtrFreed = true;
    }
    return callback(err);
  });

  stream.on("data", function (chunk) {
    const buffPtr = buffToPtr(chunk);
    raw.crc64(crcPtr, buffPtr, chunk.length);
    binding._free(buffPtr);
  });
  stream.on("end", function () {
    if (errored) return;

    const ret = uint64PtrToStr(crcPtr);
    if (!crcPtrFreed) {
      binding._free(crcPtr);
      crcPtrFreed = true;
    }

    return callback(undefined, ret);
  });
};
