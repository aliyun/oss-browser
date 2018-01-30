angular.module('web')
  .factory('autoUpgradeSvs', ['settingsSvs',function(settingsSvs) {

    var util = require('./node/ossstore/lib/util')
    var NAME = 'oss-browser';

    var release_notes_url = Global.release_notes_url;
    var upgrade_url = Global.upgrade_url;
    var gVersion = Global.app.version;
    //var config_path = Global.config_path;

    var upgradeOpt = {
      currentVersion: gVersion,
      isLastVersion: false,
      lastVersion: gVersion,
      fileName: '',
      link: '',
      // fileName: fileName,
      // link: linkPre + '/'+ fileName,
      upgradeJob: {
        pkgLink: '',
        progress: 0,
        status: 'waiting'
      }
    }


    return {
      load: load,
      start: start,

      compareVersion: compareVersion,
      getReleaseNote: getReleaseNote,
      getLastestReleaseNote: getLastestReleaseNote
    };


    var job;

    function start(){
      if(job)job.start()
    }



    function getReleaseNote(version, lang, fn) {
      if(compareVersion(version, '1.5.1')<=0)
         $.get('../release-notes/' + version + '.md', fn);
      else
         $.get('../release-notes/' + version +'.'+lang+ '.md', fn);
    }

    //获取最新releaseNote
    function getLastestReleaseNote(version, lang, fn) {
      if(compareVersion(version, '1.5.1')<=0)
         $.get(release_notes_url + version + '.md', fn);
      else
         $.get(release_notes_url + version +'.'+lang+ '.md', fn);
    }


    function FlatDownloadJob(name, from, to){
      console.log('FlatDownloadJob:', from, to);
      this.total=0;
      this.progress=0;
      this.name = name;
      this.from = from;
      this.to = to;

      var _statusChangeFn;
      var _progressChangeFn;

      this.update = function (){
        //copy
        console.log('copy:',__dirname)
        fs.renameSync(to+'.download', to);
        this._changeStatus('finished');
      };
      this.check = function(crc, md5,fn){
        //crc
        console.log('crc64 check')
        return util.checkFileHash(to+'.download', crc, md5, fn);
      };

      this.precheck = function(){
        this.progress = 0;
        this.total = 0;

        if(fs.existsSync(to)){
          console.log('exists, done')
          this.progress=100;
          this._changeStatus('finished');
        }
      };

      this.start = function(){
        this.progress = 0;
        this.total = 0;
        var that = this;


        if(fs.existsSync(to)){
          console.log('exists, done')
          this.progress=100;
          this._changeStatus('finished');
          return
        }

        if(fs.existsSync(to+'.download')){
          fs.unlinkSync(to+'.download');
        }

        console.log('start download ...')
        that._changeStatus('running');

        request
          .head(from)
          .on('error', function(err) {
            console.log(err)
            this._changeStatus('failed', err);
          })
          .on('response', function(response) {
            console.log(response.statusCode) // 200
            console.log(response.headers) // 'image/png'

            if(response.statusCode==200){
              that.total = response.headers['content-length'];
              var current = 0;
              that.progress = Math.round(current*10000/that.total)/100;
              console.log(that.total)

              var ws = fs.createWriteStream(to+'.download',{flags:'a+'});

              request(from)
                .on('error', function(err) {
                  console.log(err)
                  that._changeStatus('failed', err);
                })
                .on('data', function(chunk){
                    current += chunk.length;
                    that.progress = Math.round(current*10000/that.total)/100;
                    //console.log(that.progress)
                    that._changeProgress(that.progress);
                    // fs.appendFile(to+'.download', chunk, function(err){
                    //    if(err)console.log(err)
                    // });
                    return chunk;
                })
                .pipe(ws)
                .on('finish', function(){
                  that._changeStatus('verifying');

                  that.check(
                  response.headers['x-oss-hash-crc64ecma'],
                  response.headers['content-md5'],
                  function(err){
                    console.log('check error:',err)
                    if(err) that._changeStatus('failed',err)
                    else{
                      that.update()
                    }
                  });
                })
            }else{
              console.log(response)
              that._changeStatus('failed', response);
            }
          })
      };
      this.onProgressChange = function(fn){
        _progressChangeFn = fn;
      }
      this.onStatusChange = function(fn){
        _statusChangeFn= fn;
      }
      this._changeStatus = function(status,err){
        //console.log(status, err)
        this.status=status;
        this.message = err;
        if(_statusChangeFn)_statusChangeFn(status);
      }
      this._changeProgress= function(prog){
        if(_progressChangeFn)_progressChangeFn(prog)
      }
    };

    function load(fn) {


      $.getJSON(upgrade_url, function(data) {

        var isLastVersion = compareVersion(gVersion, data.version) >= 0;
        var lastVersion = data.version;

        upgradeOpt.isLastVersion = isLastVersion;
        upgradeOpt.lastVersion = lastVersion;

        var fileName = NAME + '-' + process.platform + '-' + process.arch +
          '.zip';

        if(isLastVersion){
          //无需更新

          var link = data['package_url'].replace(/(\/*$)/g, '') +
            '/' + data['version'] + '/' + fileName;

          console.log("download url:", link);

          fn({
            currentVersion: gVersion,
            isLastVersion: isLastVersion,
            lastVersion: lastVersion,
            fileName: fileName,
            link: link
          });

          return;
        }

        getFasterUrl(data['package_urls'], lastVersion, function(linkPre){

          if(data.files){

            //暂时只支持1个文件更新
            data.file = data.files.length>0?data.files[0]:null;

            var jobs = [];

            //var fileName = NAME + '-' + process.platform + '-' + process.arch + '.zip';

            var pkgLink = linkPre+'/'+ process.platform+'-' + process.arch+'/'+data.file;

            upgradeOpt.fileName = fileName;
            upgradeOpt.link = linkPre+'/'+fileName;
            upgradeOpt.upgradeJob.status = 'waiting';
            upgradeOpt.upgradeJob.progress = 0;
            upgradeOpt.upgradeJob.pkgLink = pkgLink;

            var jobsFinishedCount = 0;

            var to = path.join(__dirname, '..', lastVersion+'-'+data.file);

            job = new FlatDownloadJob(data.file,
              pkgLink,
              to
            );

            job.onStatusChange(function(status){
              upgradeOpt.upgradeJob.status = status
            });
            job.onProgressChange(function(progress){
              upgradeOpt.upgradeJob.progress = progress;
            });
            job.precheck();

            //增量更新
            fn(upgradeOpt);
            return;
          }

          //全量更新
          // var fileName = NAME + '-' + process.platform + '-' + process.arch + '.zip';
          // var link = data['package_url'].replace(/(\/*$)/g, '') + '/' + lastVersion + '/' + fileName;

          var link = linkPre+'/'+fileName;
          console.log("download url:", link);

          fn({
            currentVersion: gVersion,
            isLastVersion: isLastVersion,
            lastVersion: lastVersion,
            fileName: fileName,
            link: link
          });


        })// end getFasterUrl

      });
    }

    function getFasterUrl(arr, lastVersion, fn){

      var fileName = NAME + '-' + process.platform + '-' + process.arch + '.zip';
      var c=0;
      var t=[];
      _dig();
      function _dig(){
        var t1=Date.now();
        var linkPre = arr[c].replace(/(\/*$)/g, '') + '/' + lastVersion;
        $.ajax({
          timeout: 5000,
          url: linkPre+'/'+fileName,
          headers: {
            Range: 'bytes=30-210'
          }
        }).then(function(data){
          var t2=Date.now();
          t.push({time: t2-t1, linkPre: linkPre});

          c++;
          if(c>=arr.length)callback()
          else  _dig()

        },function(err){
          var t2=Date.now();
          t.push({time: t2, linkPre: linkPre});
          console.log(arr[c], err)

          c++;
          if(c>=arr.length)callback()
          else _dig()


        });
      }
      function callback(){
        t.sort(function(a,b){
          return a.time > b.time ? 1 : -1
        });
        console.log('getFasterUrl:',JSON.stringify(t,' ',2));
        fn(t[0].linkPre);
      }

    }

    function compareVersion(curV, lastV) {
      var arr = curV.split('.');
      var arr2 = lastV.split('.');

      var len = Math.max(arr.length, arr2.length);

      for (var i = 0; i < len; i++) {
        var a = parseInt(arr[i]);
        var b = parseInt(arr2[i]);

        if (a > b) {
          return 1;
        } else if (a < b) {
          return -1;
        }
      }
      return 0;
    }


  }]);
