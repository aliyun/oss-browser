const removeArrayItem = function (arrays, from, to) {
  from = parseInt(from);
  const rest = arrays.slice((to || from) + 1 || arrays.length);
  arrays.length = from < 0 ? arrays.length + from : from;
  return arrays.push.apply(arrays, rest);
};

const DataCache = function () {
  this.partNumbersArray = [];
  this.downloadCaches = new Map();
};

DataCache.prototype.push = function (partNumber, data) {
  if (!this.downloadCaches.has(partNumber)) {
    this.partNumbersArray.push(partNumber);
    const partCache = { buffers: [data], length: data.length };
    this.downloadCaches.set(partNumber, partCache);
  } else {
    const partCache = this.downloadCaches.get(partNumber);
    partCache["buffers"].push(data);
    partCache["length"] = partCache["length"] + data.length;
  }
};

DataCache.prototype.cleanPart = function (partNumber) {
  this.downloadCaches.delete(partNumber);
  var index = this.partNumbersArray.indexOf(partNumber);
  if (index >= 0) {
    removeArrayItem(this.partNumbersArray, index);
  }
};

DataCache.prototype.shift = function () {
  const partNumber = this.partNumbersArray.shift();
  if (!partNumber) {
    return undefined;
  }
  const result = this.downloadCaches.get(partNumber);
  this.downloadCaches.delete(partNumber);

  return {
    partNumber: partNumber,
    length: result.length,
    data: Buffer.concat(result["buffers"], result.length),
  };
};

DataCache.prototype.size = function () {
  return this.downloadCaches.size;
};

DataCache.prototype.isEmpty = function () {
  return this.partNumbersArray.length === 0 && this.downloadCaches.size === 0;
};

module.exports = DataCache;
