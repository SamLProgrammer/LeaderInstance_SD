const {Router} = require('express');
const { newJoin, leaderListenPing, stopPingingLeader, ecoSelector, newLeaderStablishment, notifyNodesGoneLeader } = require('../controller/monitor');
const router = Router();

router.get('/newJoin', newJoin);
router.get('/status', leaderListenPing);
router.post('/leaderIsGone', stopPingingLeader);
router.get('/selectorTransfer', ecoSelector);
router.post('/ecoSelector', ecoSelector);
router.post('/newLeader', newLeaderStablishment);
router.get('/disputeWinner', notifyNodesGoneLeader)

module.exports = router;
