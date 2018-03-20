const electron = require('electron');
const ipcM = require('electron').ipcMain;
const BrowserWindow = electron.BrowserWindow;

// const remote = electron.remote;

const path = require('path');
const url = require('url');
// const Menu = remote.Menu;

// "use strict";
let win;

function createNewWin() {
   win = new electron.BrowserWindow({
        width: 400,
        height: 300,
        frame: true,
        autoHideMenuBar: true
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

    win.show();
}



/*// console.log(win);
   //关闭建议反馈窗口
ipcM.on('window-close', function(event, arg) {
  // alert(111);
  console.log('1111');
  console.log(win);
  // win.destroy();
  win.close();
  //event.sender.send('asynchronous-reply', BrowserWindow.getAllWindows())
  //console.log()
})*/


const version = electron.app.getVersion();

var template = [{
    label: '文件',
    submenu: [{
        label: '导入',
        // accelerator: 'CmdOrCtrl+B',
        click: function(item, focusedWindow) {
            //focusedWindow.loadURL('file://'+ path.join(__dirname, './build/index.html/#/config'));
            // focusedWindow.loadURL(url.format({
            //   pathname: path.join(__dirname, './build/index.html/#/config'),
            //   protocol: 'file:',
            //   slashes: true
            // }));

            //focusedWindow.loadURL('http://localhost:5010/#/config');
        }
    }, {
        label: '刷新',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
            if (focusedWindow)
                focusedWindow.reload();
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
    },  {
        label: '检查更新',
        key: 'checkForUpdate',
        click: function () {
          require('electron').autoUpdater.checkForUpdates()
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
        click: function () {
          require('electron').autoUpdater.quitAndInstall()
        }
    }, {
        label: '建议 或 反馈…',
        click: createNewWin
    }]
}];











module.exports = template;

// var menu = Menu.buildFromTemplate(template);
// Menu.setApplicationMenu(menu);