var gulp = require('gulp');
var plugins = require("gulp-load-plugins")({lazy: false});
var fs = require('fs');
var path = require('path');

//var NwBuilder = require('nw-builder');
//var pkg = require('./package');
require('shelljs/global');

var DIST = './dist';
//var VERSION = pkg.version;
var taskFns = {
  appJS: function () {
    console.log('--rebuilding app.js...');
    //combine all js files of the app
    gulp.src(['!./app/**/*_test.js', './app/**/*.js'])
      //.pipe(plugins.jshint())
      //.pipe(plugins.jshint.reporter('default'))
      .pipe(plugins.babel({
        presets: ['es2015','stage-3'],
        plugins: ['transform-runtime']
      }))
      .pipe(plugins.concat('app.js'))
      .pipe(gulp.dest(DIST))
      .on('end', function(){
        console.log('--done');
      });
  },
  templates: function () {
    console.log('--rebuilding templates.js...');
    //combine all template files of the app into a js file
    gulp.src(['!./app/index.html',
        './app/**/*.html'])
      .pipe(plugins.angularTemplatecache('templates.js', {standalone: true}))
      .pipe(gulp.dest(DIST))
      .on('end', function(){
        console.log('--done');
      });
  },
  appCSS: function () {
    console.log('--rebuilding lib.css...');
    gulp.src('./app/**/*.css')
      .pipe(plugins.concat('app.css'))
      .pipe(gulp.dest(DIST))
      .on('end', function(){
        console.log('--done');
      });
  }
};

gulp.task('js', taskFns.appJS);

gulp.task('templates', taskFns.templates);

gulp.task('css', taskFns.appCSS);

gulp.task('libJS', function () {
  //concatenate vendor JS files

  // var arr = ['cmake',
  //   'coffeescript','css','sass','javascript','jsx','htmlembedded','htmlmixed',
  //   'dart','erlang','go','groovy','lua','python','php','perl','ruby', 'swift',
  //   'java', 'xml',
  //   'vbscript',
  //   'r','rust',
  //   'dockerfile', 'markdown','yaml'
  // ];

  var arr=[

      './node_modules/jquery/dist/jquery.js',
      './node_modules/moment/min/moment-with-locales.js',
      './node_modules/bootstrap/dist/js/bootstrap.js',
      './node_modules/angular/angular.js',
      './node_modules/angular-sanitize/angular-sanitize.js',
      './node_modules/angular-ui-router/release/angular-ui-router.js',
      './node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
      './node_modules/showdown/dist/showdown.js',

      //code mirror
      './vendor/diff_match_patch.js',

      './node_modules/angular-ui-codemirror/src/ui-codemirror.js',
      './node_modules/codemirror/lib/codemirror.js',
      './node_modules/codemirror/addon/mode/simple.js',
      './node_modules/codemirror/addon/merge/merge.js',
      './node_modules/codemirror/mode/meta.js',

    ];

    // code mirror modes
    var modePath = './node_modules/codemirror/mode/';
    var modes = fs.readdirSync(modePath);
    modes.forEach(function(n){
      arr.push(modePath+n+'/*.js');
    });

    gulp.src(arr)
    .pipe(plugins.concat('lib.js'))
    .pipe(gulp.dest(DIST));
});

gulp.task('libCSS', function () {
  //concatenate vendor CSS files
  gulp.src([
      './node_modules/bootstrap/dist/css/bootstrap.css',
      './node_modules/font-awesome/css/font-awesome.css',
      './node_modules/codemirror/lib/codemirror.css',
      './node_modules/codemirror/addon/merge/merge.css',
    ])
    .pipe(plugins.concat('lib.css'))
    .pipe(gulp.dest(DIST + '/css'));
});

gulp.task('copy-fonts', function () {
  gulp.src([
      './node_modules/bootstrap/fonts/*',
      './node_modules/font-awesome/fonts/*'
    ])
    .pipe(gulp.dest(DIST + '/fonts'));
});

gulp.task('copy-icons', function () {
  gulp.src('./app/icons/**')
    .pipe(gulp.dest(DIST+'/icons'));
});
gulp.task('copy-node', function () {
  gulp.src('./node/**')
    .pipe(gulp.dest(DIST+'/node'));
});

gulp.task('copy-docs', function () {
  gulp.src(['./release-notes/**/*'])
    .pipe(gulp.dest(DIST+'/release-notes'));
});

gulp.task('copy-index', function () {
  gulp.src(['./app/index.html',
  './main.js',
  './vendor/*.js',
  './release-notes.md'])
    .pipe(gulp.dest(DIST));
});

gulp.task('gen-package', function () {
  gulp.src(['./package.json'])
  .on('end', function(){
    var info = require('./package');
    delete info.devDependencies;
    delete info.scripts;
    info.main="main.js";
    try{ fs.statSync(DIST); }catch(e){ fs.mkdirSync(DIST); }
    fs.writeFileSync(DIST+'/package.json', JSON.stringify(info,' ',2));
    exec('cd dist && cnpm i');
  });
});



gulp.task('watch', function () {
  gulp.watch([
    DIST + '/**/*.html',
    DIST + '/**/*.js',
    DIST + '/**/*.css'
  ], function (event) {
    return gulp.src(event.path)
      .pipe(plugins.connect.reload());
  });

  gulp.watch([
    'app/**/*'
  ], function (event) {
    console.log(Math.random(), event);
    if(event.path.endsWith('.js') && !event.path.endsWith('_test.js')) taskFns.appJS();
    if(event.path.endsWith('.html') && event.path!=path.join(__dirname, 'app/index.html')) taskFns.templates();
    if(event.path.endsWith('.css')) taskFns.appCSS();
  });


  // gulp.watch(['./app/**/*.js', '!./app/**/*test.js'], ['js']);
  // gulp.watch(['!./app/index.html', './app/**/*.html'], ['templates']);
  // gulp.watch('./app/**/*.css', ['css']);
  gulp.watch(['./app/index.html','./main.js'], ['copy-index']);

  gulp.watch('./node/**', ['copy-node']);

});

// gulp.task('connect', plugins.connect.server({
//   root: [DIST],
//   port: 9000,
//   livereload: true
// }));

gulp.task('build', ['js', 'templates', 'css', 'copy-index', 'libJS', 'libCSS', 'copy-fonts','copy-node','copy-docs','copy-icons','gen-package']);

gulp.task('default', [  'build', 'watch']);
