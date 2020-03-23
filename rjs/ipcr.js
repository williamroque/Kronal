const { ipcRenderer } = require('electron');

function getData() {
    return ipcRenderer.sendSync('get-data');
}

function update(data, timestamp) {
    ipcRenderer.sendSync('update', data, timestamp);
}