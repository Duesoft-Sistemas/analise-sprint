const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
	const win = new BrowserWindow({
		width: 1280,
		height: 800,
		webPreferences: {
			contextIsolation: true
		},
		title: `Análise de Sprint v${app.getVersion()}`
	});

	const devUrl = process.env.VITE_DEV_SERVER_URL;
	if (devUrl) {
		win.loadURL(devUrl);
	} else {
		win.loadFile(path.join(__dirname, '../dist/index.html'));
	}
}

app.whenReady().then(() => {
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});


