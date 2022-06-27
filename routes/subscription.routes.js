const express = require('express');
const webpush = require('web-push');
const router = express.Router();

const publicVapidKey = 'BLp3BGxSyYIv3rfy07KC-saKtiCVI073LWw5Eh24gHoRGV7hhT1kVwo6gnhjrUszZguRy8b9lGroKNRy9iCUcCI';
const privateVapidKey = '9HPDFyx8Xd3lu2ctDHGdf3TNSjDUU2nsAuwwLe2d_6A';
const pushSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/cZOypgW2mmM:APA91bGuq9U8jV9iK6iQT-nIx3baQNz_I68Kk07siPdL5dqLA4fiGEx1EA7dPRmxpX0Bp6vdBSiZughw6sJU_mRH5EXrDIV4NvEzf_9tdpAw6s011Y2og34yRtWjJJAhJl_7SrE3EKbh',
    keys: {
        auth: 's7NkHUqfuIL_uiRCzEV08Q',
        p256dh: 'BKMb3KV-ajWpAJQ8r2yVOI1A9KvfJhvGt-pRBTRQtap9if-GHyM77tSns2Qk-UXZ8HXicRCpOd1LIeRAneOIkhk',
    }
};

router.post('/', async(req, res) => {
    const subscription = req.body;
    console.log('subscription', subscription);
    res.status(201).json({ message: 'subscription received'});

    webpush.setVapidDetails('mailto:freiheit@htw-berlin.de', publicVapidKey, privateVapidKey);
});

module.exports = router;