const { ipcRenderer } = require('electron');

function getData() {
    return ipcRenderer.sendSync('get-data');
}

function update(data, subjects, timestamp) {
    ipcRenderer.sendSync('update', data, subjects, timestamp);
}
