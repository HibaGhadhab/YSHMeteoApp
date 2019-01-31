//libraries' call
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

// function to read from our data base and insert data
// this function will be called every 30 seconds
function readFromDB()
{
    console.log("read from DB");
    // get raspberry's files 
    var tphFile = JSON.parse(fs.readFileSync('/dev/shm/tph.log', 'utf8'));
    var sensorsFile = JSON.parse(fs.readFileSync('/dev/shm/sensors', 'utf8'));
    var gpsNmeaFile = fs.readFileSync('/dev/shm/gpsNmea', 'utf8');
    var rainCounterFile = fs.readFileSync('/dev/shm/rainCounter.log', 'utf8');

    console.log("creating the meteoObject...");
    // initialisation of our meteoObject to be inserted
    var meteoObject = {}; 
    meteoObject.id = sonde_id;
    meteoObject.name = sonde_name;
    // get measurements from tph.log file
    meteoObject.measurements = {};
    meteoObject.measurements.date =  sensorsFile.date; 
    meteoObject.measurements.temp = tphFile.temp; 
    meteoObject.measurements.hygro = tphFile.hygro; 
    meteoObject.measurements.press = tphFile.press; 
    // get measurements from sensors file
    meteoObject.measurements.lum = Number(sensorsFile.measure[3].value);
    meteoObject.measurements.wind_dir = Number(sensorsFile.measure[4].value);
    meteoObject.measurements.wind_mean = Number(sensorsFile.measure[5].value);
    meteoObject.measurements.wind_min = Number(sensorsFile.measure[6].value);
    meteoObject.measurements.wind_max = Number(sensorsFile.measure[7].value);
    // get locationfrom gpsNmeaFile
    var gpsTrame = gpsNmeaFile.split('\n')[1];
    var gps = new GPS;
    gps.on('data', function(parsed) {
        meteoObject.location = {};
        meteoObject.location.lat = parsed.lat;
        meteoObject.location.lng = parsed.lon;
        meteoObject.location.date = parsed.time.toISOString();
    });
    gps.update(gpsTrame);

    // get rain from rainCounterFile
    /* we get and save all the data from rainCounterFile, even when it's duplicated.
       Later in the web service, we find rain with distinct option.
    */
    meteoObject.rain  = rainCounterFile.split('\n')[0];
    console.log("meteoObject created and here it is:");
    console.log(meteoObject);

    // insert meteoObject.json to the collection of MongoDB with insertOne
    MongoClient.connect(url, function(err, client) 
    {
        console.log("Connected successfully to server");
        var dbo = client.db(dbName);
        // meteoCollection is the name of our collection in our data base
        dbo.collection("meteoCollection").insertOne(meteoObject, function(err,res)
            {
                if (err) throw err;
                console.log("Number of documents inserted: " + res.insertedCount);    
            }
        )
    }
    )
}
    
// run the readFromDB function every 30 sec 
setInterval(readFromDB,30000);

// show all data 
// http://piensg010:3001/
/*
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
*/


// show last data of a specific sensor of of all sensors
// http://piensg010:3001/last?capteur_type=[type]
router.get('/last', function(req, res, next) {
    MongoClient.connect(url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        var dbo = client.db(dbName);

        // get the parameter capteur_type from the URL request
        let capteur = req.query.capteur_type;

        // if capteur_type = all
        if (capteur === "all") 
        {
            dbo.collection("meteoCollection").find({}, {fields:{_id:0}}) // find in collection
               .sort({"measurements.date": -1}).limit(1) //sort by date and limit 1 to get the most recent data
               .toArray(function(err, result) {
                    if (err) throw err;
                    console.log("***** result (last/all) *******");
                    console.log(result);
                    if (result.length != 0)
                        res.json(result[0]);
                    client.close();
            });
        }
        // else if capteur_type is in ["press","temp","hygro","pluvio","lum","wind_mean","wind_dir"]
        else if (typesCapteurs.includes(capteur)) 
        {
            // create and add a projection to respect the format of output result 
            // 0 means that we dont want to show this attribut
            // 1 means that we want to show this attribut
            /* we used projection and not fields because we used mongodb version 2.4.14
               which is the latest version supported by Raspberry
            */
            var myProjection = {_id:0, id:1, name:1, 'measurements.date': 1};
            myProjection['measurements.' + capteur] = 1;

            // find in the collection and applying the previous projection
            dbo.collection("meteoCollection").find({}, {fields: myProjection})
            .sort({"measurements.date": -1}).limit(1) //sort and limit 1 to get the most recent data
            .toArray(function(err, result) {
                if (err) throw err;
                console.log("***** result (last/measurements) *******");
                console.log(result);
                if (result.length != 0)
                    res.json(result[0]);
                client.close();
            });
        }
        // if capteur_type = location
        else if (capteur === 'location') 
        {
            // create and add a projection to respect the format of output result 
            // 0 means that we dont want to show this attribut
            // 1 means that we want to show this attribut
            var myProjection = {_id:0, id:1, name:1, location: 1};

            // find in the collection and applying the previous projection
            dbo.collection("meteoCollection").find({}, {fields: myProjection})
            .sort({"measurements.date": -1}).limit(1) //sort and limit 1 to get the the most recent data
            .toArray(function(err, result) {
                if (err) throw err;
                console.log("***** result (last/location) *******");
                console.log(result);
                if (result.length != 0)
                    res.json(result[0]);
                client.close();
            });
        }
        // if capteur_type = rain
        else if (capteur === 'rain') 
        {
            // create and add a projection to respect the format of output result 
            // 0 means that we dont want to show this attribut
            // 1 means that we want to show this attribut
            var myProjection = {_id: 0, id: 1, name: 1, rain:1};

            // find in the collection and applying the previous projection
            dbo.collection("meteoCollection").find({},{fields: myProjection})
            .sort({"rain":-1}).limit(1) //sort and limit 1 to get the the most recent data
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


// http://piensg010:3001/period?capteur_type=[type]&dateStart=[date]&dateEnd=[date]
  router.get('/period', function(req, res, next) {
    MongoClient.connect(url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        var dbo = client.db(dbName);

        // get the parameter capteur_type from the URL request
        let capteur = req.query.capteur_type;
        // get the parameter dateStart from the URL request
        // convert dateStart from timestamp to type Date 
        // we multiplied by 1000 to get the value in ms 
        let datedeb = new Date(Number(req.query.dateStart)*1000);
        // get the parameter dateEnd from the URL request
        let datefin = new Date(Number(req.query.dateEnd)*1000);

        // if capteur_type = all
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

        // else if capteur_type is in ["press","temp","hygro","pluvio","lum","wind_mean","wind_dir"]
        else if (typesCapteurs.includes(capteur)) 
        {
            // create and add a projection to respect the format of output result 
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
                
        // if capteur_type = location
        else if (capteur === 'location') 
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

        // if capteur_type = rain
        else if( capteur === 'rain') 
        {
            let final_result = {};
            var myProjection = {_id:0, 'rain': 1};

            console.log("query for period rain...")
            console.log("date start")
            console.log(datedeb.toISOString())
            console.log("date end")
            console.log(datefin.toISOString())
             
            dbo.collection("meteoCollection").distinct("rain", 
            {
                "rain":
                {
                    "$gte": datedeb.toISOString(),
                    "$lt": datefin.toISOString()
                }
            },
            function (err, result) {
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

module.exports = router;



