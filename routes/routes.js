const {Router} = require('express');
const { launchNewInstance } = require('../controller/monitor');
const router = Router();

router.get('/launchNew', launchNewInstance);

module.exports = router;
