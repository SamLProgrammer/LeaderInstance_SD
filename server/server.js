const PORT = 8000;
const express = require('express');
const cors = require('cors');
const {joinToInstances} = require('../controller/monitor');


class MyServer {
    constructor() {
        this.port = PORT;
        this.app = express();
        this.middleware();
        this.routes();
        this.join();
        this.listen();
    }

    middleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    routes() {
        // this.app.use('/launchNew', require('../routes/routes'));
        this.app.use('/', require('../routes/routes'));
    }

    join() {
        console.log('join got called')
        joinToInstances();
    }

    listen() {
        console.log('ole prro')
        this.app.listen(this.port);
        console.log(`Server on! PORT ${this.port}`);
    }

}

module.exports = MyServer