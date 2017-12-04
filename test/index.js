import test from 'ava';
import {Application} from 'spectron';

function getAppPath(){
  var key = process.platform+'-'+process.arch;
  switch(key){
    case 'darwin-x64': return 'build/oss-browser-darwin-x64/oss-browser.app/Contents/MacOS/oss-browser';
    case 'linux-x64': return 'build/oss-browser-linux-x64/oss-browser';
    case 'win32-x64': return 'build/oss-browser-win32-x64/oss-browser.exe';
  }
}

test.beforeEach(async t => {
  t.context.app = new Application({
    path:getAppPath()
  });

  await t.context.app.start();
});

test.afterEach.always(async t => {
   //await t.context.app.stop();
});



test(async t => {
  const app = t.context.app;
  const browser = app.client;
  await browser.waitUntilWindowLoaded();

  const win = app.browserWindow;
  t.is(await browser.getWindowCount(), 1);
  t.false(await win.isMinimized());
  t.false(await win.isDevToolsOpened());
  t.true(await win.isVisible());
  t.true(await win.isFocused());

  const {width, height} = await win.getBounds();
  t.true(width > 0);
  t.true(height > 0);


  var text = await browser.getText('.navbar-brand');
  t.true(text=='OSS浏览器')


  //如果没退出，先退出
  console.log('如果没退出，先退出 ');

  var logoutBtnVisible = await browser.isVisible('[ng-click="logout()"]');
  if(logoutBtnVisible){
    console.log('发现退出按钮，点击');
    await browser.click('[ng-click="logout()"]')
    await browser.click('button[ng-click="ok()"]')
  }

  //切换为中文
  browser.setValue('[ng-model="langSettings.lang"]','string:zh-CN')

  //登录
  



});
