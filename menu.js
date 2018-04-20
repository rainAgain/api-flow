const electron = require('electron');
const ipcM = require('electron').ipcMain;
const BrowserWindow = electron.BrowserWindow;
// const BrowserWindow = require('electron').remote.BrowserWindow
const app = electron.app
const autoUpdater = require("electron-updater").autoUpdater
const path = require('path');
const url = require('url');
const {dialog} = require('electron')

"use strict";
let win;

function createNewWin() {
    win = new electron.BrowserWindow({
        width: 400,
        height: 300,
        frame: true,
        autoHideMenuBar: true,
        show: false,
        frame: false
    })
    // console.log(win.id);
    win.on('closed', function() {
        win = null;
    })
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'app/feedback.html'),
        protocol: 'file:',
        slashes: false,
    }));
    // win.show();
}
app.on('ready', function() {
    createNewWin();
})

function showWin() {
    win.show();
}

function hideWin() {
    win.hide();
}
ipcM.on('window-close', function() {
    hideWin();
});

//打开导入文档
function loadFile() {
    console.log(global.sharedObject)
      dialog.showOpenDialog({
        filters: [
            {name:'JSON', extensions: ['json']}
        ],
        properties: ['openFile']
      }, function (files) {
        //console.log(files[0]);
        if(files && files[0]) {
            global.sharedObject.mainWindow.send('load', files[0]);
        }
      })
}

const version = electron.app.getVersion();
var template = [{
    label: '文件',
    submenu: [{
        label: '导入',
        // accelerator: 'CmdOrCtrl+B',
        click: loadFile
    }, {
        label: '刷新',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload();
        }
    }]
}, {
    label: '窗口',
    role: 'window',
    submenu: [{
            label: '最小化',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        }, {
            label: '关闭窗口',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
        }
        // {
        //     label: '调试模式',
        //     accelerator: 'Option+CmdOrCtrl+I',
        //     click: function () {
        //         if(remote.getCurrentWindow().webContents.isDevToolsOpened()){
        //             remote.getCurrentWindow().webContents.closeDevTools();
        //         }else{
        //             remote.getCurrentWindow().webContents.openDevTools({mode: 'undocked'});
        //         }
        //     }
        // }
    ]
}, {
    label: '关于',
    role: 'help',
    submenu: [{
        label: `Version ${version}`,
        enabled: false
    }, {
        label: '检查更新',
        key: 'checkForUpdate',
        click: function() {
            autoUpdater.checkForUpdates()
        }
    }, {
        label: '正在检查更新',
        visible: false,
        enabled: false,
        key: 'checkingForUpdate'
    }, {
        label: '重启并安装更新',
        enabled: true,
        visible: false,
        key: 'restartToUpdate',
        click: function() {
            autoUpdater.quitAndInstall()
        }
    }, {
        label: '建议 或 反馈…',
        click: showWin
    }]
}];

//mac 环境需要添加下面的复制粘贴等代码
if (process.platform === 'darwin') { 
    template.unshift({
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' }
        ]
      })
}
module.exports = template;
// var menu = Menu.buildFromTemplate(template);
// Menu.setApplicationMenu(menu);