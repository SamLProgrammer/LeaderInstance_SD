const PORT = 5000;
const express = require('express');
const cors = require('cors');
const { joinToInstances, getIp, freeDockerResources } = require('../controller/monitor');

class MyServer {
	constructor() {
		this.port = PORT;
		this.app = express();
		this.middleware();
		this.routes();
		this.join();
		this.listen();
		this.NotifyLauncherFreeResources();
	}

	middleware() {
		this.app.use(cors());
		this.app.use(express.json());
		this.app.use(express.static('public'));
	}

	routes() {
		this.app.use('/newJoin', require('../routes/routes'));
		this.app.use('/stopPing', require('../routes/routes'));
		this.app.use('/status', require('../routes/routes'));
		this.app.use('/', require('../routes/routes'));
	}

	join() {
		joinToInstances(getIp);
	}

	listen() {
		this.app.listen(this.port);
		console.log(`Server on! PORT ${this.port}`);
	}

	NotifyLauncherFreeResources() {
		freeDockerResources();
	}
}

module.exports = MyServer;
