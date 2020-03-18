const { ipcRenderer } = require('electron');

function getData() {
    return ipcRenderer.sendSync('get-data');
}

function update(data) {
    ipcRenderer.sendSync('update', data);
}