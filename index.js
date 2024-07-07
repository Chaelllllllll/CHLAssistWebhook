
    const express = require('express');
    const bodyParser = require('body-parser');

    const app = express();
    const PORT = process.env.PORT || 3000;
    const VERIFY_TOKEN = 'chlai';
    const PAGE_ACCESS_TOKEN = 'your_page_access_token_here';

    app.use(bodyParser.json());

    // Webhook verification
    app.get('/webhook', (req, res) => {
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                res.sendStatus(403);
            }
        }
    });

    // Webhook to handle messages
    app.post('/webhook', (req, res) => {
        let body = req.body;

        if (body.object === 'page') {
            body.entry.forEach(entry => {
                let webhookEvent = entry.messaging[0];
                console.log(webhookEvent);

                let senderId = webhookEvent.sender.id;
                if (webhookEvent.message) {
                    handleMessage(senderId, webhookEvent.message);
                }
            });

            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.sendStatus(404);
        }});

    function handleMessage(senderId, receivedMessage) {
        let response;

        if (receivedMessage.text) {
            response = {
                "text": `You sent the message: "${receivedMessage.text}". Now send me an image!`
            };
        } else if (receivedMessage.attachments) {
            response = {
                "text": "Thanks for the attachment!"
            };
        }

        callSendAPI(senderId, response);
    }

    function callSendAPI(senderId, response) {
        const request = require('request');

        let requestBody = {
            "recipient": {
                "id": senderId
            },
            "message": response
        };

        request({
            "uri": "https://graph.facebook.com/v2.6/me/messages",
            "qs": { "access_token": PAGE_ACCESS_TOKEN },
            "method": "POST",
            "json": requestBody
        }, (err, res, body) => {
            if (!err) {
                console.log('Message sent!');
            } else {
                console.error('Unable to send message:' + err);
            }
        });
    }

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });