const electron = require('electron')

const log = require('electron-log');

const {
  autoUpdater
} = require("electron-updater");

const menuTemplate = require('./menu.js');

const Menu = electron.Menu;

const app = electron.app

const BrowserWindow = electron.BrowserWindow

const ipc = require('electron').ipcMain

const dialog = require('electron').dialog

const path = require('path')

const url = require('url')


log.info('App starting...');

let mainWindow

global.isEle = true;

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 1000,
    show: false
  })
  
  mainWindow.once('ready-to-show', () => {
      mainWindow.show()
  })

  mainWindow.isEle = true;

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function() {
    mainWindow = null
  })

  global.sharedObject = {
    mainWindow: mainWindow
  };

}

//防止多次打开同一个应用
const shouldQuit = app.makeSingleInstance((commandLine,workingDirectory) => {
  if(mainWindow) {
    if(mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
  }
})

if(shouldQuit) {
  app.quit();
}


//导出文件
ipc.on('save-dialog', function(event) {
  const options = {
    title: '导出文件',
    filters: [{
      name: 'json',
      extensions: ['json']
    }]
  }
  dialog.showSaveDialog(options, function(filename) {
    if(filename) {
      event.sender.send('saved-file', filename)
    }
    
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
})

autoUpdater.on('update-available', (info) => {
  state = 'checking'
  updateMenu();
})
autoUpdater.on('update-not-available', (info) => {
  state = 'no-update'
  updateMenu();
})
autoUpdater.on('error', (err) => {
  state = 'no-update'
  updateMenu();
})

autoUpdater.on('update-downloaded', (info) => {
  state = 'installed'
  updateMenu();

});


function createMenu() {
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}


app.on('ready', function(){
  createWindow();
  createMenu();
})

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();

  }
})