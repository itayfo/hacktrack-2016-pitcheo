"use strict";

var express = require('express');
var app = express();

//Used to create randomised
var crypto = require('crypto');

//Used to transfer files to  different folders
var fs = require('fs');

//To decrypt he POST parameters
var bodyParser = require('body-parser');

//For file uploads
var multer  =   require('multer');
var thumbler = require('video-thumb');

//To send requests to RapidAPI
var request = require('request');

//To be able to access the URL
var ip = require('ip');
console.log("The ip: " + ip.address());
var port = 3000;

//Setting the destination for the uploading
var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
        var newPath = req.query.type;
        callback(null, './' + newPath);
    },
    filename: function (req, file, callback) {
        crypto.randomBytes(48, function(err, buffer) {
            var token = buffer.toString('hex');
            var format = file.originalname.split(".")[file.originalname.split.length - 1];
            callback(null, token + "." + format);
        });
    }
});
var upload = multer({ storage : storage}).single('file');

//To decrypt the post paramters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Allow downloading the files stored
app.use('/presentations', express.static(__dirname + '/presentations'));
app.use('/videos', express.static(__dirname + '/videos'));

//Rapid is requiring that
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

/**
 * Path that received the type(presentation/ videos) and the file itself
 * Moving the file to the desired folder(by req.query.type)
 */
app.post('/uploadFile', function (req, res) {

    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file." + err);
        }

        //Return the url of the file(directly)
        return res.json({
            "success"   :   true,
            "path"      :   "http://" + ip.address() + ":" + port + "/" + res.req.file.path
        });
    });


});

app.get('/facebook-login/:accessToken', function(req ,res){

    //Sending the accessToken to facebook, to get the id,name and email
    request('https://graph.facebook.com/v2.6/me?&format=json&method=get&pretty=0&suppress_http_code=1&fields=email,id,name&access_token='
        + req.params.accessToken, function(err, httpResponse, body){
        if(err)return res.json(err);

        try {
            var object = JSON.parse(body);
        } catch (e) {
            return res.json({
                "error" :   "Failed paring the request from facebook"
            });
        }

        object.accessToken = req.params.accessToken;
        console.log("Facebook login: " + JSON.stringify(object));

        request.post('https://hacktract-pitch-finder.rapidapi.io/facebook-login', {
            "form"  :   object
        }, function(err, httpResponse, body){
            if(err)return res.json(err);

            //Sometimes imrapid gives me an object, sometimes string.
            try {
                return res.json(JSON.parse(body));
            } catch (e) {
                return res.json(body);
            }

        });
    });
});

app.listen(port, function () {
    console.log('My super-duper is listening on port ' + port + " don't make her wait!");
});

