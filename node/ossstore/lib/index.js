
'use strict';
var ALYD = require('aliyun-sdk');
require('events').EventEmitter.prototype._maxListeners = 1000;
var TIMEOUT = 60000; //60秒
//fix
ALYD.util.isBrowser = function(){
  return false;
};


var UploadJob = require('./upload-job');
var DownloadJob = require('./download-job');


/**
 * OssStore
 *
 * @constructor OssStore
 *
 * @param config
 *    config.aliyunCredential
 *    config.stsToken
 *    config.endpoint
 */

function OssStore(config) {
  if (!config) {
    console.log('需要 config');
    return;
  }
  this._config = {};
  Object.assign(this._config, config);

  if (!this._config.aliyunCredential && !this._config.stsToken) {
    console.log('需要 stsToken');
    return;
  }

  if (!this._config.endpoint) {
    console.log('需要 endpoint');
    return;
  }



  if (this._config.stsToken) {
    this.oss = new ALYD.OSS({
      accessKeyId: this._config.stsToken.Credentials.AccessKeyId,
      secretAccessKey: this._config.stsToken.Credentials.AccessKeySecret,
      securityToken: this._config.stsToken.Credentials.SecurityToken,
      endpoint: this._config.endpoint,
      apiVersion: '2013-10-15',
      httpOptions: {
        timeout: TIMEOUT
      }
    });
  }
  else {
    this.oss = new ALYD.OSS({
      accessKeyId: this._config.aliyunCredential.accessKeyId,
      secretAccessKey: this._config.aliyunCredential.secretAccessKey,
      endpoint: this._config.endpoint,
      apiVersion: '2013-10-15',
      httpOptions: {
        timeout: TIMEOUT
      }
    });
  }

  var arr = this._config.endpoint.split('://');
  if (arr.length < 2) {
    console.log('endpoint 格式错误');
    return;
  }
  this._config.endpoint = {
    protocol: arr[0],
    host: arr[1]
  };
}

OssStore.prototype.setStsToken = function(stsToken){
  this._config.stsToken = stsToken;

  this.oss = new ALYD.OSS({
    accessKeyId: this._config.stsToken.Credentials.AccessKeyId,
    secretAccessKey: this._config.stsToken.Credentials.AccessKeySecret,
    securityToken: this._config.stsToken.Credentials.SecurityToken,
    endpoint: this._config.endpoint,
    apiVersion: '2013-10-15',
    httpOptions: {
      timeout: TIMEOUT
    }
  });
};


/**
 *
 * Usage:
 *
 *  new OssStore(cfg)
 *     .createUploadJob({from:'/home/a.jpg', to:'oss://a/b.jpg'})
 *
 * UploadJob class:

 class UploadJob{
    status: ''
    from: { name, size, path }
    to: { bucket, key }
    prog: {loaded, total}

 }

 *
 * @param options
 *    options.from  {object|string} local path, as object: {name:'a.jpg', path:'/home/admin/a.jpg'},  as string: '/home/admin/a.jpg'
 *    options.to    {object|string} oss path, as object: {bucket:'bucket',key:'pic/b.jpg'} as string: 'oss://bucket/pic/b.jpg'
 *
 *    options.checkPoints {object} saveCpt
 */
OssStore.prototype.createUploadJob = function createUploadJob(options) {

  var self = this;

  var job = new UploadJob(self.oss, options);

  //默认是 waiting 状态
  return job;
};


/**
 *
 * Usage:
 *
 *  new OssStore(cfg)
 *     .createDownloadJob({from:'/home/a.jpg', to:'oss://a/b.jpg'})
 *
 * DownloadJob class:

 class DownloadJob{
    status: ''
    from: { name, size, path }
    to: { bucket, key }
    prog: {loaded, total}

 }

 *
 * @param options
 *    options.from    {string} path string, under oss prefix, example: '/pic/b.jpg', it will be append to presetting osspath
 *                       as: 'oss://bucket/users/test_user/pic/b.jpg'
 *    options.to  {string} local path string,  example: '/home/admin/a.jpg'
 *
 *    options.checkpoint {object} saveCpt
 */
OssStore.prototype.createDownloadJob = function createDownloadJob(options) {

  var self = this;

  var job = new DownloadJob(self.oss, options);

  //默认是 waiting 状态

  return job;
};


module.exports = OssStore;
