var gulp = require("gulp");
var plugins = require("gulp-load-plugins")({ lazy: false });
var fs = require("fs");
var path = require("path");
var os = require("os");
var del = require("del");
var minimist = require("minimist");
//var NwBuilder = require('nw-builder');
//var pkg = require('./package');
require("shelljs/global");

var DIST = "./dist";

function getCustomPath() {
  var minimist = require("minimist");

  var knownOptions = {
    string: "custom",
    default: { custom: "./custom" },
  };

  var options = minimist(process.argv.slice(2), knownOptions);

  if (options && options.custom) {
    var customPath = path.join(options.custom, "**/*");

    if (customPath.indexOf("~") == 0) {
      customPath = path.join(os.homedir(), customPath, "**/*");
    } else if (customPath.indexOf(".") == 0) {
      customPath = path.join(__dirname, customPath, "**/*");
    }
  }
  return customPath || "custom/**/*";
}

//var VERSION = pkg.version;
var taskFns = {
  appJS: function () {
    console.log("--rebuilding app.js...");
    //combine all js files of the app
    gulp
      .src(["!./app/**/*_test.js", "./app/**/*.js"])
      //.pipe(plugins.jshint())
      //.pipe(plugins.jshint.reporter('default'))
      .pipe(
        plugins.babel({
          presets: ["es2015"],
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
    gulp
      .src(["!./app/index.html", "./app/**/*.html"])
      .pipe(plugins.angularTemplatecache("templates.js", { standalone: true }))
      .pipe(gulp.dest(DIST))
      .on("end", function () {
        console.log("--done");
      });
  },
  appCSS: function () {
    console.log("--rebuilding lib.css...");
    gulp
      .src("./app/**/*.css")
      .pipe(plugins.concat("app.css"))
      .pipe(gulp.dest(DIST))
      .on("end", function () {
        console.log("--done");
      });
  },
};

gulp.task("js", taskFns.appJS);

gulp.task("templates", taskFns.templates);

gulp.task("css", taskFns.appCSS);

gulp.task("libJS", function () {
  //concatenate vendor JS files

  // var arr = ['cmake',
  //   'coffeescript','css','sass','javascript','jsx','htmlembedded','htmlmixed',
  //   'dart','erlang','go','groovy','lua','python','php','perl','ruby', 'swift',
  //   'java', 'xml',
  //   'vbscript',
  //   'r','rust',
  //   'dockerfile', 'markdown','yaml'
  // ];

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

    "./node_modules/angular-ui-codemirror/src/ui-codemirror.js",
    "./node_modules/codemirror/lib/codemirror.js",
    "./node_modules/codemirror/addon/mode/simple.js",
    "./node_modules/codemirror/addon/merge/merge.js",
    "./node_modules/codemirror/mode/meta.js",

    "./node_modules/angular-translate/dist/angular-translate.min.js",

    "./node_modules/angular-bootstrap-contextmenu/contextMenu.js",
  ];

  // code mirror modes
  var modePath = "./node_modules/codemirror/mode/";
  var modes = fs.readdirSync(modePath);
  modes.forEach(function (n) {
    arr.push(modePath + n + "/*.js");
  });

  gulp.src(arr).pipe(plugins.concat("lib.js")).pipe(gulp.dest(DIST));
});

gulp.task("libCSS", function () {
  //concatenate vendor CSS files
  gulp
    .src([
      "./node_modules/bootstrap/dist/css/bootstrap.css",
      "./node_modules/font-awesome/css/font-awesome.css",
      "./node_modules/codemirror/lib/codemirror.css",
      "./node_modules/codemirror/addon/merge/merge.css",
    ])
    .pipe(plugins.concat("lib.css"))
    .pipe(gulp.dest(DIST + "/css"));
});

gulp.task("copy-fonts", function () {
  gulp
    .src([
      "./node_modules/bootstrap/fonts/*",
      "./node_modules/font-awesome/fonts/*",
    ])
    .pipe(gulp.dest(DIST + "/fonts"));
});

gulp.task("copy-icons", function () {
  gulp.src("./app/icons/**").pipe(gulp.dest(DIST + "/icons"));
});
gulp.task("copy-node", function () {
  gulp.src(["./node/**/*"]).pipe(gulp.dest(DIST + "/node"));
});

gulp.task("copy-docs", function () {
  gulp.src(["./release-notes/**/*"]).pipe(gulp.dest(DIST + "/release-notes"));
});
gulp.task("copy-static", function () {
  gulp.src(["./static/**/*"]).pipe(gulp.dest(DIST + "/static"));
});

// gulp.task('copy-custom', function () {
//
//   gulp.src([getCustomPath()])
//     .pipe(gulp.dest(DIST+'/custom'));
// });

gulp.task("copy-index", function () {
  return gulp
    .src([
      "./app/index.html",
      "./main.js",
      "./server.js",
      "./vendor/*.js",
      "./release-notes.md",
      "./tools/.yarnclean",
    ])
    .pipe(gulp.dest(DIST));
});

gulp.task("gen-package", ["copy-index"], function () {
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
    exec("cd dist && yarn install --prod && yarn autoclean --force", cb);
  });
});

gulp.task("remove-redundant", ["gen-package"], function (cb) {
  return del.sync([
    "dist/node_modules/protobufjs/dist",
    "dist/node_modules/aliyun-sdk/dist",
  ]);
});

gulp.task("watch", function () {
  gulp.watch(
    [
      // '!'+DIST+'/node_modules/**/*',
      DIST + "/**/*.html",
      DIST + "/!(node_modules)/*.js",
      DIST + "/**/*.css",
    ],
    function (event) {
      return gulp.src(event.path).pipe(plugins.connect.reload());
    }
  );

  gulp.watch(["app/**/*"], function (event) {
    console.log(Math.random(), event);
    if (event.path.endsWith(".js") && !event.path.endsWith("_test.js"))
      taskFns.appJS();
    if (
      event.path.endsWith(".html") &&
      event.path != path.join(__dirname, "app/index.html")
    )
      taskFns.templates();
    if (event.path.endsWith(".css")) taskFns.appCSS();
  });

  // gulp.watch(['./app/**/*.js', '!./app/**/*test.js'], ['js']);
  // gulp.watch(['!./app/index.html', './app/**/*.html'], ['templates']);
  // gulp.watch('./app/**/*.css', ['css']);
  gulp.watch(["./app/index.html", "./main.js"], ["copy-index"]);

  gulp.watch(["./static/**"], ["copy-static"]);

  //gulp.watch(['./custom/**'], ['copy-custom']);

  gulp.watch(["./node/**"], ["copy-node"]);
});

// gulp.task('connect', plugins.connect.server({
//   root: [DIST],
//   port: 9000,
//   livereload: true
// }));

gulp.task("build", [
  "js",
  "templates",
  "css",
  "copy-index",
  "libJS",
  "libCSS",
  "copy-fonts",
  "copy-node",
  "copy-docs",
  "copy-icons",
  "copy-static",
  "gen-package",
  "remove-redundant",
]);

gulp.task("default", ["build", "watch"]);
