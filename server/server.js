const PORT = 8000;
const express = require('express');
const cors = require('cors');
const {joinToInstances} = require('../controller/monitor');


class MyServer {
    constructor() {
        this.port = PORT;
        this.app = express();
        this.middleware();
        this.join();
        this.routes();
    }

    middleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    routes() {
        this.app.use('/launchNew', require('../routes/routes'));
        this.app.use('/', require('../routes/routes'));
    }

    listen() {
        this.app.listen(this.port);
        console.log(`Server on! PORT ${this.port}`);
    }

    join() {
        joinToInstances();
    }
}

module.exports = MyServer