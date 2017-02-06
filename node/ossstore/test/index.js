
var cm = require('./common');
var Store = require('../lib/');
var path = require('path');
var fs = require('fs');
var should = require('should');

var USERNAME = 'admin';
var PASSWORD= 'admin';

var token;
var file_id;
var oss_path;



describe('test', function () {

  this.timeout(3600*1000);

  before(function (done) {

    cm.login(USERNAME, PASSWORD).then(function(result){
      token = result.data.data.token;
      done();
    });
  });

  it('upload', function (done) {

    var project = {project_id: 6, project_name: 'demo'};

    var from = path.join(__dirname, 'resources/v.jpg')

    var size = fs.statSync(from).size;
    var name = path.basename(from);


    cm.create(token, project, '/' + name, size).then(function (result2) {

      file_id = result2.data.data.file_id;
      oss_path = result2.data.data.oss_path;


      cm.getStsToken(token, file_id).then(function (result3) {

        //开始上传
        var stsToken = result3.data.data;

        var obj = {
          from: from,
          to: oss_path
        };


        var store = new Store({
          stsToken: {
            Credentials: {
              AccessKeyId: stsToken.access_id,
              AccessKeySecret: stsToken.access_key,
              SecurityToken: stsToken.sts_token
            }
          },
          endpoint: 'http://oss-'+stsToken.region+'.aliyuncs.com'
        })
          .createUploadJob(obj, function (job) {

            job.on('statuschange', function (s) {
              console.log('status:', s)
            }).on('error', function (er) {
              'error'.should.equal('');
              console.log(er)
            }).on('partcomplete', function (prog, cpt) {
              console.log(prog, cpt)
            }).on('complete', function () {
              console.log('done');

              //complete
              console.log('final completing...');
              cm.completeFile(token, file_id).then(function () {
                console.log('complete')
                'complete'.should.equal('complete');
                done();
              }, function (err) {
                console.log(err);
              })

            });
            job.start()
          });


      });
    })

  });


  xit('download', function (done) {

    cm.getStsToken(token, file_id, 'write').then(function(result){
       var stsToken = result.data;

      var obj = {
        from: oss_path,
        to: path.join(__dirname, 'resources/tmp-v.jpg')
      };

      var store = new Store({
        stsToken: stsToken,
        endpoint: stsToken.OSS.endpoint
      }).createDownloadJob(obj, function(job){

        job.on('statuschange', function (s) {
          console.log('status:', s)
        }).on('error', function (er) {
          console.log(er);
          'err'.should.equal('err');
        }).on('partcomplete', function (prog, cpt) {
          console.log(prog, cpt)
        }).on('complete', function () {
          console.log('done');
          'done'.should.equal('done');
          done();
        });
        job.start()

      });

    })

  });

  after(function (done) {
    cm.logout(token).then(function () {
      console.log('logout')
      done();
    });
  });

});


