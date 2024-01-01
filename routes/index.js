const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.send("Server started at 9000")
})

  // start changing
  router.get('/startCharging/CHARGEON', async (req, res, next) => {
    try {
        console.log('CHARGEON')
        socket.write('CHARGERON');
        res.send("CHARGE ON")
    } catch (error) {
      sendError(res, error.message);
    }
  });

  router.get('/startCharging/CHARGEOFF', async (req, res, next) => {
    try {
        console.log('CHARGEOFF')
        socket.write('CHARGEROFF');
        res.send("CHARGE OFF")
    } catch (error) {
      sendError(res, error.message);
    }
  });
  module.exports = router;