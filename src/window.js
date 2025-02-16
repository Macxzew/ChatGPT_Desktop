const { BrowserWindow, session, globalShortcut, shell } = require('electron');
const path = require('path');
const CONFIG = require('./config');

function createMainWindow() {
    const win = new BrowserWindow({
        width: 1270,
        height: 890,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            plugins: true,
            webSecurity: true,
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, '../assets/app-icon.ico')
    });

    configureSession(win);
    setupShortcuts(win);
    setupExternalLinks(win);

    win.loadURL(CONFIG.APP_URL);

    win.once('ready-to-show', () => {
        win.show();
    });

    return win;
}

function configureSession(win) {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = CONFIG.USER_AGENT;
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        if (details.responseHeaders['widevine']) {
            console.log('✅ Widevine détecté');
        }
        callback({ cancel: false, responseHeaders: details.responseHeaders });
    });
}

function setupShortcuts(win) {
    globalShortcut.register('F5', () => {
        console.log('🔄 F5 pressé → Simulation de Ctrl+R');
        win.webContents.reload();
    });
}

function setupExternalLinks(win) {
    const allowedDomains = [
        CONFIG.APP_URL,
        'https://auth.openai.com/',
        'https://auth0.openai.com/',
        'https://chatgpt.com/',
    ];

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (!allowedDomains.some(domain => url.startsWith(domain))) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    win.webContents.on('will-navigate', (event, url) => {
        if (!allowedDomains.some(domain => url.startsWith(domain))) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
}

module.exports = { createMainWindow };