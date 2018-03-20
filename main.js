//110acfb97e3adb81d3319dfae6dfeb1aed413609
const electron = require('electron')

const log = require('electron-log');
const {
  autoUpdater
} = require("electron-updater");

// const autoUpdater = require('./auto-updater')


const menuTemplate = require('./menu.js');
const Menu = electron.Menu;

function createMenu() {
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

// Module to control application life.
const app = electron.app

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

const path = require('path')
const url = require('url')



// autoUpdater.logger = log;
// autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send('message', text);
}

function createWindow() {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 1000
  })
  const urlload = url.format({
    pathname: path.join(__dirname, 'app/index.html'),
    protocol: 'file:',
    slashes: true
  });

  // console.log(urlload)
  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}


/*ipc.on('window-close', function(event, arg) {
  // alert(111);
  console.log('1111');
  // console.log(win);
  // win.destroy();
  mainWindow.close();
  //event.sender.send('asynchronous-reply', BrowserWindow.getAllWindows())
  //console.log()
})*/

//导出
ipc.on('save-dialog', function(event) {
  const options = {
    title: '导出文件',
    filters: [{
      name: 'json',
      extensions: ['json']
    }]
  }
  dialog.showSaveDialog(options, function(filename) {
    event.sender.send('saved-file', filename)
  })
})


var state = '';
//更新菜单
const updateMenu = function () {
  if (process.mas) return

  var menu = Menu.getApplicationMenu()
  if (!menu) return

  menu.items.forEach(function (item) {
    if (item.submenu) {
      item.submenu.items.forEach(function (item) {
        switch (item.key) {
          case 'checkForUpdate':
            item.visible = state === 'no-update'
            break
          case 'checkingForUpdate':
            item.visible = state === 'checking'
            break
          case 'restartToUpdate':
            item.visible = state === 'installed'
            break
        }
      })
    }
  })
};


autoUpdater.on('checking-for-update', () => {
  state = 'checking'
  updateMenu();
  //sendStatusToWindow('Checking for update...');
})

autoUpdater.on('update-available', (info) => {
  state = 'checking'
  updateMenu();
  //sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  state = 'no-update'
  updateMenu();
  //sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  state = 'no-update'
  updateMenu();
  //sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  state = 'installed'
  updateMenu();
  //sendStatusToWindow('Update downloaded');
  //autoUpdater.quitAndInstall();

});



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
  // autoUpdater.initialize()
  createWindow();
  createMenu();
  // autoUpdater.updateMenu()
})

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();

  }
})





// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// app.on('ready', function()  {
//   autoUpdater.checkForUpdatesAndNotify();
// });