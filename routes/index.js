var express = require('express');
var fs = require('fs'); 
var GPS = require('gps');
// connect to MongoDB
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

var router = express.Router();

// connection URL
const url = 'mongodb://localhost:27017';

// our constants
const dbName = 'tsiMeteoDB'; // Database Name
const sonde_id = "010";
const sonde_name = "sonde YSH";
const typesCapteurs = ["press","temp","hygro","pluvio","lum","wind_mean","wind_dir"];



var tphFile = JSON.parse(fs.readFileSync('/dev/shm/tph.log', 'utf8'));
var sensorsFile = JSON.parse(fs.readFileSync('/dev/shm/sensors', 'utf8'));
var gpsNmeaFile = fs.readFileSync('/dev/shm/gpsNmea', 'utf8');
var rainCounterFile = fs.readFileSync('/dev/shm/rainCounter.log', 'utf8');

var meteoObject = {}; // initialisation of our meteoObject to be inserted

meteoObject.id = sonde_id;
meteoObject.name = sonde_name;
// measurements from tph.log
meteoObject.measurements = {};
meteoObject.measurements.date =  sensorsFile.date; 
meteoObject.measurements.temp = tphFile.temp; 
meteoObject.measurements.hygro = tphFile.hygro; 
meteoObject.measurements.press = tphFile.press; 
// measurements from sensors
meteoObject.measurements.lum = Number(sensorsFile.measure[3].value);
meteoObject.measurements.wind_dir = Number(sensorsFile.measure[4].value);
meteoObject.measurements.wind_mean = Number(sensorsFile.measure[5].value);
meteoObject.measurements.wind_min = Number(sensorsFile.measure[6].value);
meteoObject.measurements.wind_max = Number(sensorsFile.measure[7].value);
// location
var gpsTrame = gpsNmeaFile.split('\n')[1];
var gps = new GPS;
gps.on('data', function(parsed) {
    meteoObject.location = {};
    meteoObject.location.lat = parsed.lat;
    meteoObject.location.lng = parsed.lon;
    meteoObject.location.date = parsed.time.toISOString();
    //console.log(meteoObject.location.date);
});
gps.update(gpsTrame);

// à voir si le format de la date est correct et comparable ou pas ! 
meteoObject.rain  = rainCounterFile.split('\n')[0];
    //console.log(meteoObject.rain);

//insert meteoObject.json  //Okay

/*
MongoClient.connect(url, function(err, client) 
    {
        console.log("Connected successfully to server");
        var dbo = client.db(dbName);
        dbo.collection("meteoCollection").insertOne(meteoObject, function(err,res)
            {
                if (err) throw err;
                console.log("Number of documents inserted: " + res.insertedCount);    
            }
        )
    }
)
*/


//show everything //Okay
router.get('/', function(req, res, next) {
    MongoClient.connect(url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        var dbo = client.db(dbName);
        //show collection (all)
        dbo.collection("meteoCollection").find()
        .toArray(function(err, result) {
        if (err) throw err;
        console.log("***** result (everything) *******");
        console.log(result);
        res.json(result);
        client.close();
        });
    });
  });


//show last //okay
// [IP]:80/last?capteur_type=[type]
router.get('/last', function(req, res, next) {
    MongoClient.connect(url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        var dbo = client.db(dbName);
        let capteur = req.query.capteur_type;
        if (capteur === "all") //Okay
        {
            //show collection (all)
            dbo.collection("meteoCollection").find({}, {fields:{_id:0}})
               .sort({"measurements.date": -1}).limit(1) //sort and limit 1 to get the latest
               .toArray(function(err, result) {
                    if (err) throw err;
                    console.log("***** result (last/all) *******");
                    console.log(result);
                    if (result.length != 0)
                        res.json(result[0]);
                    client.close();
            });
        }
        else if (typesCapteurs.includes(capteur)) //Okay
        {
            var myProjection = {_id:0, id:1, name:1, 'measurements.date': 1};
            myProjection['measurements.' + capteur] = 1;

            dbo.collection("meteoCollection").find({}, {fields: myProjection})
            .sort({"measurements.date": -1}).limit(1) //sort and limit 1 to get the latest
            .toArray(function(err, result) {
                if (err) throw err;
                console.log("***** result (last/measurements) *******");
                console.log(result);
                if (result.length != 0)
                    res.json(result[0]);
                client.close();
            });
        }
        else if (capteur === 'location') //Okay
        {
            var myProjection = {_id:0, id:1, name:1, location: 1};

            dbo.collection("meteoCollection").find({}, {fields: myProjection})
            .sort({"measurements.date": -1}).limit(1) //sort and limit 1 to get the latest
            .toArray(function(err, result) {
                if (err) throw err;
                console.log("***** result (last/location) *******");
                console.log(result);
                if (result.length != 0)
                    res.json(result[0]);
                client.close();
            });
        }
        else if (capteur === 'rain') //Okay
        {
            var myProjection = {_id: 0, id: 1, name: 1, rain:1};

            dbo.collection("meteoCollection").find({},{fields: myProjection})
            .sort({"rain":-1}).limit(1)
            .toArray(function(err,result){
                if (err) throw err;
                console.log("***** result (last/rain) *******");
                console.log(result);
                if (result.length != 0)
                    res.json(result[0]);
                client.close();
            });
        }
        else 
        {
            console.log("*********" + capteur + " est inexistant***********");
            res.json({});
            client.close();
        }
    });
  });


// [IP]:80/period?capteur_type=[type]&dateStart=[date]&dateEnd=[date]
  router.get('/period', function(req, res, next) {
    MongoClient.connect(url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        var dbo = client.db(dbName);
        
        let capteur = req.query.capteur_type;

        let datedeb = new Date(Number(req.query.dateStart)*1000);
        let datefin = new Date(Number(req.query.dateEnd)*1000);
        
        if (capteur === "all")
        {
            let final_result = {};
            var myProjection = {_id:0, id:0, name:0, rain:0 };

            console.log("query for period all...");
            console.log("date start");
            console.log(datedeb.toISOString());
            console.log("date end");
            console.log(datefin.toISOString());

            console.log("step1: find..");
            dbo.collection("meteoCollection").find({
                "measurements.date":
                {
                    "$gte": datedeb.toISOString(),
                    "$lt": datefin.toISOString()
                }
            },{fields: myProjection})
            .toArray(function(err, result) {
                if (err) throw err;
                console.log("***** result (period/all 1.without rain) *******");
                console.log(result);
                final_result.id = sonde_id;
                final_result.name = sonde_name;
                final_result.data = result;
                console.log("***** final_result (period/all 1.without rain) *******");
                console.log(final_result);
                //res.json(final_result);
                //client.close();

                //step2 
                //let distinct_result = {};
                //var myProjection = {_id:0, 'rain': 1};
                console.log("step2: distinct..");
                dbo.collection("meteoCollection").distinct("rain", function (err, result) {
                    if (err) throw err;
                    console.log("***** result (period/all 2.only rain) *******");
                    console.log(result);
                    final_result.rain = result;
                    console.log("***** final_result (period/all 2.only rain) *******");
                    console.log(final_result);
                    //final step: concatenation
                    console.log("***** ENFIN !!! *******");
                    res.json(final_result);
                    client.close();
                });
            });
        }
        else if (typesCapteurs.includes(capteur)) //Okay
        {
            let final_result = {};
            var myProjection = {_id:0, 'measurements.date': 1};
            myProjection['measurements.' + capteur] = 1;

            console.log("query for period measurement...");
            console.log("date start");
            console.log(datedeb.toISOString());
            console.log("date end");
            console.log(datefin.toISOString());

            dbo.collection("meteoCollection").find({
                "measurements.date":
                {
                    "$gte": datedeb.toISOString(),
                    "$lt": datefin.toISOString()
                }
            },{fields: myProjection})
            .toArray(function(err, result) {
                if (err) throw err;
                console.log(result);
                final_result.id = sonde_id;
                final_result.name = sonde_name;
                final_result.data = result;
                console.log("***** final_result (period/measurement) *******");
                console.log(final_result);
                res.json(final_result);
                client.close();
            });
        }
        else if (capteur === 'location') //Okay
        {
            let final_result = {};
            var myProjection = {_id:0, 'location.lat': 1, 'location.lng': 1,'location.date':1};
            
            console.log("query for period location...")
            console.log("date start")
            console.log(datedeb.toISOString())
            console.log("date end")
            console.log(datefin.toISOString())

            dbo.collection("meteoCollection").find({
                "location.date":
                {
                    "$gte": datedeb.toISOString(),
                    "$lt": datefin.toISOString()
                }
            },{fields: myProjection})
            .toArray(function(err, result) {
                if (err) throw err;
                console.log(result);
                final_result.id = sonde_id;
                final_result.name = sonde_name;
                final_result.data = result;
                console.log("***** final_result (period/location) *******");
                console.log(final_result);
                res.json(final_result);
                client.close();
            });
        }
        else if( capteur === 'rain') //Okay
        {
            let final_result = {};
            var myProjection = {_id:0, 'rain': 1};

            console.log("query for period rain...")
            console.log("date start")
            console.log(datedeb.toISOString())
            console.log("date end")
            console.log(datefin.toISOString())

            /* // paramètres de la fonction distinct à respecter
                mquery().distinct(match, field, function (err, result) {
                console.log(result);
              })
              */

            dbo.collection("meteoCollection").distinct("rain", function (err, result) {
                if (err) throw err;
                    console.log(result);
                    final_result.id = sonde_id;
                    final_result.name = sonde_name;
                    final_result.rain = result;
                    console.log("***** final_result (period/rain) *******");
                    console.log(final_result);
                    res.json(final_result);
                    client.close();
              });
        }
        else
        {
            console.log("*********" + capteur + " est inexistant***********");
            client.close();
        }
    });
  });


module.exports = router; // à la fin


