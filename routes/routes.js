const {Router} = require('express');
const { launchNewInstance, newJoin } = require('../controller/monitor');
const router = Router();

router.get('/newJoin', newJoin);

module.exports = router;
