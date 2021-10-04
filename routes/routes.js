const {Router} = require('express');
const { newJoin, leaderListenPing, stopPingingLeader } = require('../controller/monitor');
const router = Router();

router.get('/newJoin', newJoin);
router.get('/status', leaderListenPing);
router.post('/leaderIsGone', stopPingingLeader);

module.exports = router;
