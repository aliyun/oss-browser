var gulp = require("gulp");
var plugins = require("gulp-load-plugins")({ lazy: false });
var fs = require("fs");
var del = require("del");
var path = require("path");
require("shelljs/global");

var DIST = "./dist";

//var VERSION = pkg.version;
var taskFns = {
  appJS: function () {
    console.log("--rebuilding app.js...");
    //combine all js files of the app
    return gulp
      .src(["!./app/**/*_test.js", "./app/**/*.js"])
      .pipe(
        plugins.babel({
          presets: [
            [
              "@babel/env",
              {
                targets: {
                  chrome: "83",
                },
              },
            ],
          ],
        })
      )
      .pipe(plugins.concat("app.js"))
      .pipe(gulp.dest(DIST))
      .on("end", function () {
        console.log("--done");
      });
  },
  templates: function () {
    console.log("--rebuilding templates.js...");
    //combine all template files of the app into a js file
    return gulp
      .src(["!./app/index.html", "./app/**/*.html"])
      .pipe(
        plugins.angularTemplatecache("templates.js", {
          base: path.join(__dirname, "app/"),
          standalone: true,
        })
      )
      .pipe(gulp.dest(DIST))
      .on("end", function () {
        console.log("--done");
      });
  },
  appCSS: function () {
    console.log("--rebuilding lib.css...");
    return gulp
      .src("./app/**/*.css")
      .pipe(plugins.concat("app.css"))
      .pipe(gulp.dest(DIST))
      .on("end", function () {
        console.log("--done");
      });
  },
  libJS: function () {
    var arr = [
      "./node_modules/jquery/dist/jquery.js",
      "./node_modules/jquery.qrcode/jquery.qrcode.min.js",

      "./node_modules/moment/min/moment-with-locales.js",
      "./node_modules/bootstrap/dist/js/bootstrap.js",
      "./node_modules/angular/angular.js",
      "./node_modules/angular-sanitize/angular-sanitize.js",
      "./node_modules/angular-ui-router/release/angular-ui-router.js",
      "./node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js",
      "./node_modules/showdown/dist/showdown.js",
      "./node_modules/clipboard/dist/clipboard.min.js",

      //code mirror
      "./vendor/diff_match_patch.js",
      // angular-translate
      "./vendor/angular-translate.min.js",

      "./node_modules/angular-ui-codemirror/src/ui-codemirror.js",
      "./node_modules/codemirror/lib/codemirror.js",
      "./node_modules/codemirror/addon/mode/simple.js",
      "./node_modules/codemirror/addon/merge/merge.js",
      "./node_modules/codemirror/mode/meta.js",

      "./node_modules/angular-bootstrap-contextmenu/contextMenu.js",
    ];

    // code mirror modes
    var modePath = "./node_modules/codemirror/mode/";
    var modes = fs.readdirSync(modePath);
    modes.forEach(function (n) {
      arr.push(modePath + n + "/*.js");
    });

    return gulp.src(arr).pipe(plugins.concat("lib.js")).pipe(gulp.dest(DIST));
  },
  libCSS: function () {
    //concatenate vendor CSS files
    return gulp
      .src([
        "./node_modules/bootstrap/dist/css/bootstrap.css",
        "./node_modules/font-awesome/css/font-awesome.css",
        "./node_modules/codemirror/lib/codemirror.css",
        "./node_modules/codemirror/addon/merge/merge.css",
      ])
      .pipe(plugins.concat("lib.css"))
      .pipe(gulp.dest(DIST + "/css"));
  },
  copyFonts: function () {
    return gulp
      .src([
        "./node_modules/bootstrap/fonts/*",
        "./node_modules/font-awesome/fonts/*",
      ])
      .pipe(gulp.dest(DIST + "/fonts"));
  },
  copyIcons: function () {
    return gulp.src("./app/icons/**").pipe(gulp.dest(DIST + "/icons"));
  },
  copyNode: function () {
    return gulp.src(["./node/**/*"]).pipe(gulp.dest(DIST + "/node"));
  },
  copyDocs: function () {
    return gulp
      .src(["./release-notes/**/*"])
      .pipe(gulp.dest(DIST + "/release-notes"));
  },
  copyStatic: function () {
    return gulp.src(["./static/**/*"]).pipe(gulp.dest(DIST + "/static"));
  },
  copyIndex: function () {
    return gulp
      .src([
        "./app/index.html",
        "./main.js",
        "./server.js",
        "./vendor/*.js",
        "./tools/.yarnclean",
      ])
      .pipe(gulp.dest(DIST));
  },
  genPackage: function () {
    return gulp.src(["./package.json"]).on("end", function (cb) {
      var info = require("./package");
      delete info.devDependencies;
      info.scripts = {
        start: "electron .",
      };
      info.main = "main.js";

      // var custom = {};
      // try{ custom = require('./custom') }catch(e){}
      // if(custom.appId){
      //   info.name= custom.appId;
      //   info.version = custom.version;
      // }

      try {
        fs.statSync(DIST);
      } catch (e) {
        fs.mkdirSync(DIST);
      }
      fs.writeFileSync(DIST + "/package.json", JSON.stringify(info, " ", 2));
      // eslint-disable-next-line no-undef
      exec("cd dist && yarn install --prod && yarn autoclean --force", cb);
    });
  },
  removeRedundant: function (cb) {
    del.sync([
      "dist/node_modules/protobufjs/dist",
      "dist/node_modules/aliyun-sdk/dist",
    ]);
    cb();
  },
};

exports.watch = function () {
  [
    DIST + "/**/*.html",
    DIST + "/!(node_modules)/*.js",
    DIST + "/**/*.css",
  ].forEach((p) => {
    gulp.watch(p, () => {
      gulp.src(p).pipe(plugins.connect.reload());
    });
  });

  gulp.watch(["./app/**/*.js", "!./app/**/*test.js"], taskFns.appJS);
  gulp.watch(["!./app/index.html", "./app/**/*.html"], taskFns.templates);
  gulp.watch("./app/**/*.css", taskFns.appCSS);
  gulp.watch(["./app/index.html", "./main.js"], taskFns.copyIndex);
  gulp.watch(["./static/**"], taskFns.copyStatic);
  gulp.watch(["./node/**"], taskFns.copyNode);
};

// gulp.task('connect', plugins.connect.server({
//   root: [DIST],
//   port: 9000,
//   livereload: true
// }));

const copyTasks = gulp.parallel(
  taskFns.copyFonts,
  taskFns.copyNode,
  taskFns.copyDocs,
  taskFns.copyIcons,
  taskFns.copyStatic,
  gulp.series(taskFns.copyIndex, taskFns.genPackage, taskFns.removeRedundant)
);

exports.build = gulp.parallel(
  taskFns.appJS,
  taskFns.appCSS,
  taskFns.templates,
  taskFns.libJS,
  taskFns.libCSS,
  copyTasks
);

exports.default = gulp.series(exports.build, exports.watch);
