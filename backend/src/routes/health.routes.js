const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    service: 'EMPFREITAS OS Backend',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
