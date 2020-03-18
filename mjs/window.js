// BrowserWindow import
const { BrowserWindow } = require('electron');

// Get path
const path = require('path');

// Get URL
const url = require('url');

// Window class
class Window {
    constructor(winObject) {
        // Window
        this.window = new BrowserWindow(winObject);

        // Load URL for window
        this.loadURL();

        // Set window to null on close
        this.window.on('closed', e => this.window = null);
    }

    loadURL() {
        // Load URL for window
        this.window.loadURL(url.format({
            pathname: path.join(__dirname, '../html/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }
}

module.exports = Window;
