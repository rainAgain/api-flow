const {ipcRenderer} = require('electron');

//监听主进程，设置环境变量
ipcRenderer.on('set-env', (event, msg) => {
  for (const key in msg) {
    window[key] = msg[key];
  }
});