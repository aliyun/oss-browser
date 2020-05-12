import test from "ava";
import { Application } from "spectron";

const BUCKET = "diku-debug-shanghai";
const FOLDER = "folder123";

function getAppPath() {
  var key = process.platform + "-" + process.arch;
  switch (key) {
    case "darwin-x64":
      return "build/oss-browser-darwin-x64/oss-browser.app/Contents/MacOS/oss-browser";
    case "linux-x64":
      return "build/oss-browser-linux-x64/oss-browser";
    case "win32-x64":
      return "build/oss-browser-win32-x64/oss-browser.exe";
  }
}

function delay(ms) {
  return new Promise((a, b) => {
    var tid = setTimeout(() => {
      a(tid);
    }, ms);
  });
}

test.beforeEach(async (t) => {
  t.context.app = new Application({
    path: getAppPath(),
  });

  await t.context.app.start();
});

test.afterEach.always(async (t) => {
  //await t.context.app.stop();
});

test(async (t) => {
  const app = t.context.app;
  const browser = app.client;
  await browser.waitUntilWindowLoaded();

  const win = app.browserWindow;
  t.is(await browser.getWindowCount(), 1);
  t.false(await win.isMinimized());
  t.false(await win.isDevToolsOpened());
  t.true(await win.isVisible());
  t.true(await win.isFocused());

  const { width, height } = await win.getBounds();
  t.true(width > 0);
  t.true(height > 0);

  var text = await browser.getText(".navbar-brand");
  t.true(text == "OSS浏览器");

  //如果没退出，先退出
  console.log("如果没退出，先退出 ");

  var logoutBtnVisible = await browser.isVisible('[ng-click="logout()"]');
  if (logoutBtnVisible) {
    console.log("发现退出按钮，点击");
    await browser.click('[ng-click="logout()"]');
    await browser.click('button[ng-click="ok()"]');
  }

  console.log("切换为中文");
  browser.setValue('[ng-model="langSettings.lang"]', "string:zh-CN");

  console.log("登录");
  await browser.click('[type="submit"]');

  console.log("切换view->list");
  await browser
    .waitForExist('[ng-click="setListView(true)"]')
    .click('[ng-click="setListView(true)"]');

  console.log("搜索bucket");
  await browser
    .waitForExist('[placeholder="Bucket名称"]')
    .setValue('[placeholder="Bucket名称"]', BUCKET);

  console.log("进入bucket");
  await browser.waitForExist("span=" + BUCKET).click("span=" + BUCKET);

  console.log("上一级");

  await browser
    .waitForExist('[uib-tooltip="上一级"]')
    .click('[uib-tooltip="上一级"]');

  console.log("切换view->block");
  await browser
    .waitForExist('[ng-click="setListView(false)"]')
    .click('[ng-click="setListView(false)"]');

  console.log("双击进入bucket");
  await browser
    .waitForExist("div.item-block-name=" + BUCKET)
    .doubleClick("div.item-block-name=" + BUCKET);

  console.log("地址栏");
  await browser.addValue(".address-url", "abc123/\n");

  console.log("创建目录");
  await browser
    .click("button=创建目录")
    .waitForVisible("form[name=form1] #name1")
    .setValue("form[name=form1] #name1", FOLDER)
    .click("button=确定")
    .waitForVisible(".alert=创建目录成功");

  console.log("删除目录");
  await browser
    .waitForVisible("div.item-block=" + FOLDER)
    .rightClick("div.item-block=" + FOLDER)
    .waitForVisible("a.dropdown-item=删除")
    .click("a.dropdown-item=删除")
    .waitForVisible(".btn-danger=确定")
    .click(".btn-danger=确定")
    .waitForVisible(".btn=关闭")
    .click(".btn=关闭");

  console.log("上传文件");
  await browser.setValue('[ng-model="mock.uploads"]', __dirname + "/README.md");

  console.log("待续");
});
