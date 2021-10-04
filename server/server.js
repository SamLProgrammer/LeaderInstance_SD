const PORT = 5000;
const express = require('express');
const cors = require('cors');
const { joinToInstances, getIp, freeDockerResources, setIO, turnOnSocket } = require('../controller/monitor');


class MyServer {
    constructor() {
        this.port = PORT;
        this.app = express();
        this.server = require("http").createServer(this.app);
        this.io = require("./sockets/sockets").initialize(this.server);
        require('./consumer/consumer');
        this.middleware();
        this.routes();
        this.join();
        this.exportIO();
        this.listen();
        this.initSocket();
        this.NotifyLauncherFreeResources();
    }

    middleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    routes() {
        this.app.use('/newJoin', require('../routes/routes'));
        this.app.use('/status', require('../routes/routes'));
        this.app.use('/leaderIsGone', require('../routes/routes'));
        this.app.use('/', require('../routes/routes'));
    }

    join() {
        joinToInstances(getIp);
    }

    exportIO() {
        setIO(this.io);
    }

    initSocket() {
        turnOnSocket();
    }

    listen() {
        this.server.listen(this.port);
        console.log(`Server on! PORT ${this.port}`);
    }

    NotifyLauncherFreeResources() {
        freeDockerResources();
    }
}

module.exports = MyServer