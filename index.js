const express = require('express');

const app = express();

const fs = require('fs');

const request = require('request');

const axios = require('axios');

const bodyParser = require('body-parser');

const { v4: uuidv4 } = require('uuid');

app.use(bodyParser.json({extended:true}), express.json());

let token;

fs.watchFile('./payload.json', async function(event, filename){
    console.log('event is ' + event);
    
    await axios.post('https://identity.fortellis.io/oauth2/aus1p1ixy7YL8cMq02p7/v1/token', 
        {
            'grant_type': 'client_credentials',
            scope: 'anonymous'
        },
        {
            headers: {
                Accept: 'application/json',
                Authorization: 'Basic {yourClientKey:yourClientSecret}', //Base 64 encode your Client Key and your Client secret here.
                'Cache-Control': 'no-cache'
            }
        } ) 
        .then(function (response){
            console.log(response.data.access_token);
            token = response.data.access_token;
        })
        .catch(function (error){
            console.log(error);
        })
    await console.log('This is the token: ' + token)
    if(filename){
        console.log('filename provided: ' + filename);
        fs.readFile('./payload.json', 'utf-8', function(err, data){
            const arrayOfObjects = JSON.parse(data);
            console.log(arrayOfObjects);
            const sendUpdatedData = () => {
                let requestId = uuidv4();
                const serverOptions = {
                    uri: 'https://event-relay.fortellis.io/v2/events/{yourChannel}',
                    body: JSON.stringify(arrayOfObjects),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept':'application/json',
                        'Authorization': 'Bearer ' + token,
                        'partitionKey': '{aUniqueUUIDForYourPartition}',
                        'Data-Owner-Id': '{subscribingOrganizationId}',
                        'X-Request-Id': requestId
                    }
                };
                request(serverOptions, function (error, response){
                    console.log(error, response.body);
                    return;
                });
            }
            sendUpdatedData();
        });
    }else {
        console.log('filename not provided');
    }
});

app.post("/updatePayload", (req, res)=>{
    console.log('This is the request', req.body);
    console.log('This is the response' + res);
    console.log(req.body);
    res.send("Updating payload");
    fs.writeFile('./payload.json', JSON.stringify(req.body, null, 2), function writeJSON(err) {
        if (err) return console.log(err);

    })
    

})

app.listen(5000, '127.0.0.1');

console.log("Node server running on port 3000");
