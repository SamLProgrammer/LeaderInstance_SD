const { Router } = require('express');
const { launchNewInstance, newJoin, stopPing, status } = require('../controller/monitor');
const router = Router();

router.get('/newJoin', newJoin);
router.get('/stopPing', stopPing);
router.get('/status', status);

module.exports = router;
