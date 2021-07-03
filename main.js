const {app, ipcMain, BrowserWindow, Tray, Menu} = require('electron');
const path = require('path');
let sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('db.sqlite');

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 300,
        minWidth: 300,
        height: 300,
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

    db.serialize(function() { //set up the database
        db.exec(`PRAGMA foreign_keys = ON; PRAGMA synchronous = OFF;`);
        db.exec(`CREATE TABLE IF NOT EXISTS project (
            projectId INTEGER PRIMARY KEY AUTOINCREMENT,
            colour TEXT NOT NULL,
            name TEXT NOT NULL,
            isTrashed INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS event (
            projectId INTEGER NOT NULL,
            startTime INTEGER NOT NULL,
            stopTime INTEGER
        );`);
        db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS eventStart ON event(startTime);
            CREATE UNIQUE INDEX IF NOT EXISTS eventStop ON event(stopTime);
            CREATE INDEX IF NOT EXISTS eventProjectId ON event(projectId);
            CREATE UNIQUE INDEX IF NOT EXISTS projectId ON project(projectId);`,
            function(){
                db.close();
                createWindow();
        });
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})
