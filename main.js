const electron = require('electron');
// Module to control application life.
const {
  app,
  Menu,
  ipcMain,
  BrowserWindow
} = electron;


const path = require('path');
const nativeImage = require('electron').nativeImage;

///*****************************************
//静态服务
const PORTS = [7123,7124,7125,7126];

for(var port of PORTS){
  try{
    //var subp = require('child_process').fork('./server.js',[port]);
    require('./server.js').listen(port);
    console.log('listening on port ' + port);
    break;
  }catch(e){
    console.log(e);
  }
}
//监听web page里发出的message
ipcMain.on('asynchronous-message', (event, arg) => {
  //在main process里向web page发出message
  event.sender.send('asynchronous-reply', port);
});
///*****************************************

//let logo = nativeImage.createFromPath('icons/logo.ico');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

if (process.platform == 'darwin') {
  app.dock.setIcon(path.join(__dirname, 'icons', 'icon.png'));
}

function createWindow() {
  var opt = {
    width: 1020,
    height: 700,
    minWidth: 1020,
    minHeight: 660,
    title: "OSS Browser",
    icon: path.join(__dirname, 'icons', 'icon.ico')
  };

  if(process.platform=='linux'){
    opt.icon = path.join(__dirname, 'icons', 'icon.png');
  }
  // Create the browser window.   http://electron.atom.io/docs/api/browser-window/
  win = new BrowserWindow(opt);

  win.setTitle("OSS Browser");

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`);

  win.setMenuBarVisibility(false);


  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });


  // drawin 就是 MacOS
  if(process.env.NODE_ENV=='development'){
    console.log('开发模式');
    // Open the DevTools.
    win.webContents.openDevTools();

  }else if (process.platform === 'darwin') {
    // Create the Application's main menu
    let template = getMenuTemplate();
    //注册菜单, 打包后可以复制, 但是不能打开 devTools
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }

}
ipcMain.on('asynchronous-message', (event, msg) => {
   if(msg=='openDevTools') win.webContents.openDevTools();
});

//singleton
const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

if (shouldQuit) {
  app.quit();
  process.exit(0);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function getMenuTemplate() {
  return [{
    label: "Application",
    submenu: [{
      label: "About Application",
      selector: "orderFrontStandardAboutPanel:"
    }, {
      type: "separator"
    }, {
      label: "Quit",
      accelerator: "Command+Q",
      click: function() {
        app.quit();
      }
    }]
  }, {
    label: "Edit",
    submenu: [{
      label: "Undo",
      accelerator: "CmdOrCtrl+Z",
      selector: "undo:"
    }, {
      label: "Redo",
      accelerator: "Shift+CmdOrCtrl+Z",
      selector: "redo:"
    }, {
      type: "separator"
    }, {
      label: "Cut",
      accelerator: "CmdOrCtrl+X",
      selector: "cut:"
    }, {
      label: "Copy",
      accelerator: "CmdOrCtrl+C",
      selector: "copy:"
    }, {
      label: "Paste",
      accelerator: "CmdOrCtrl+V",
      selector: "paste:"
    }, {
      label: "Select All",
      accelerator: "CmdOrCtrl+A",
      selector: "selectAll:"
    }]
  }];
}
