const path = require('path');
const Koa = require('koa');
const app = new Koa();
const convert = require('koa-convert');
const serve = require('koa-static-server');


var port = 7123;
if(process.argv.length>2){
  port = process.argv[2];
}

app.use(serve({ rootDir: path.join(__dirname, 'static') }));

app.listen(port);
console.log('listening on port ' + port);
