// Modules to control application life and create native browser window
const {app, BrowserWindow, Tray, Menu} = require('electron')
const path = require('path')

function createWindow () {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 300,
        minWidth: 300,
        height: JSON.parse(require('fs').readFileSync('./storage/projects.json', 'utf8')).projects.length * 28 + 100,
        minHeight: 300,
        title: "Joe's Time Tracker",
        icon: './icons/clock-white.png',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.menuBarVisible = false;

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
        tray = new Tray(path.join(__dirname, './icons/clock-white.png'));

        tray.setContextMenu(Menu.buildFromTemplate([
            {
                label: 'Show App', click: function () {
                    window.show();
                }
            },
            {
                label: 'Quit', click: function () {
                    isQuiting = true;
                    app.quit();
                }
            }
        ]));

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
// require('./backend.js');
