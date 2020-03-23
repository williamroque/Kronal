const {
    app,
} = require('electron');

const path = require('path');

const windowStateKeeper = require('electron-window-state');

const Window = require('./window');

const FileIO = require('./fileio');
fileio = new FileIO();
fileio.setup();

const { ipcMain } = require('electron');

const fixPath = require('fix-path');
fixPath();

const mainWinObject = {
    center: true,
    icon: '../assets/icon.png',
    titleBarStyle: 'hidden',
    minWidth: 1100,
    minHeight: 750,
    maxWidth: 1150,
    maxHeight: 770,
};

let mainWin;

const createWindow = () => {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1100,
        defaultHeight: 750
    });

    mainWinObject.width = mainWindowState.width;
    mainWinObject.height = mainWindowState.height;

    mainWin = new Window(mainWinObject);

    mainWindowState.manage(mainWin.window);
};

ipcMain.on('get-data', event => {
    event.returnValue = JSON.parse(fileio.readData(fileio.dataPath));
});

ipcMain.on('update', (event, data, timestamp) => {
    event.returnValue = fileio.writeData(JSON.stringify({
        timestamp: timestamp,
        timetable: data
    }), fileio.dataPath);
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.exit(0);
    }
});

app.on('activate', () => {
    if (!mainWin || mainWin.window === null) {
        mainWin = createWindow();
    }
});

