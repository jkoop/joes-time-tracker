const {app, ipcMain, BrowserWindow, Tray, Menu} = require('electron')
const path = require('path')
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db.sqlite');

function createWindow (projectCount) {
    const mainWindow = new BrowserWindow({
        width: 300,
        minWidth: 300,
        height: projectCount * 28 + 100,
        minHeight: 300,
        title: "Joe's Time Tracker",
        icon: './icons/clock-white.png',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    ipcMain.on('setSize', (event, arg) => {
        mainWindow.setSize(arg.width, arg.height);
    });
    ipcMain.on('setMinimumSize', (event, arg) => {
        mainWindow.setMinimumSize(arg.width, arg.height);
    });
    ipcMain.on('setMSize', (event, arg) => {
        mainWindow.setMinimumSize(arg.minWidth ?? arg.width, arg.minHeight ?? arg.height);
        mainWindow.setSize(arg.width, arg.height);
    });

    mainWindow.menuBarVisible = false;
    mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
    // tray = new Tray(path.join(__dirname, './icons/clock-white.png'));

    // tray.setContextMenu(Menu.buildFromTemplate([
    //     {
    //         label: 'Show App', click: function () {
    //             window.show();
    //         }
    //     },
    //     {
    //         label: 'Quit', click: function () {
    //             isQuiting = true;
    //             app.quit();
    //         }
    //     }
    // ]));

    db.get('SELECT count(projectId) AS count FROM project WHERE isTrashed=0', function(err, row){
        db.close();
        createWindow((row ?? []).count);
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})
