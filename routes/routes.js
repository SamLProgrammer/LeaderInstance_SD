const { Router } = require('express');
const { launchNewInstance, newJoin, stopPing, status, assignNewLead } = require('../controller/monitor');
const router = Router();

router.get('/newJoin', newJoin);
router.post('/stopPing', stopPing);
router.get('/status', status);
router.get('/assignNewLead', assignNewLead);
router.post('/leaderChosen', leaderChosen);

module.exports = router;
