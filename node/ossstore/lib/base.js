"use strict";

function Base() {
  this._eventStack = {};
}

Base.prototype.on = function (evt, fn) {
  if (!this._eventStack[evt]) {
    this._eventStack[evt] = [];
  }
  this._eventStack[evt].push(fn);
  return this;
};

Base.prototype.off = function (evt, fn) {
  if (this._eventStack[evt]) {
    var arr = this._eventStack[evt];
    for (var i = 0; i < arr.length; i++) {
      if (fn === item) {
        arr.splice(i, 1);
        break;
      }
    }
  }
  return this;
};

Base.prototype.emit = function (evt, ...argv) {
  if (this._eventStack[evt]) {
    for (let fn of this._eventStack[evt]) {
      if (false === fn.apply(this, argv)) break;
    }
  }
  return this;
};

module.exports = Base;
