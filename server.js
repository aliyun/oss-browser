const path = require("path");
const Koa = require("koa");
const app = new Koa();
const convert = require("koa-convert");
const serve = require("koa-static-server");

app.use(serve({ rootDir: path.join(__dirname, "static") }));

module.exports = app;
