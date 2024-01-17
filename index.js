const net = require('net');
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const router = express.Router();
const IoTModel = require('./models/iotdetailsmodel');
let Status = false;
const db = require('./dbconfig/index');
const env = require('dotenv');

env.config()

const mongoose = require('mongoose');

/*mongoose.connect('mongodb+srv://narayanarajugv:jZ5hzXiTWzUhq3bc@cluster0.bt2cg2j.mongodb.net/GMR', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });*/

  mongoose.connect('mongodb+srv://narayanarajugv:jZ5hzXiTWzUhq3bc@cluster0.bt2cg2j.mongodb.net/GMR');

  mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error: ', err);
  });
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected');
  });

let FirstpowerValue=0;
let LastpowerValue=0;

var errorCount=0;
var charger = 0 ;

var powerConsumed = 0; 

const server = net.createServer(socket => {

  const remoteAddress = socket.remoteAddress;
  const remotePort = socket.remotePort

  console.log(`IoT device connected: ${remoteAddress}:${remotePort}`);

    setInterval(function() {
      console.log(Status)
      if (Status) {
        console.log('CHARGERON')
        socket.write('CHARGERON ');
      } else {
        console.log('CHARGEROFF')
        socket.write('CHARGEROFF ');
      }
    }, 1 * 3000);


  socket.write('REQ_IoTID:');

  let iotId;

  socket.on('data', data => {

    const input = data.toString().trim();
    console.log(input);
    //console.log(remoteAddress);
    //console.log(remotePort);


    const updateIOT = updateIOTStatus(data, remoteAddress, remotePort)

  });

  socket.on('end', () => {
    console.log(`IoT device ${iotId} disconnected`);
  });

  socket.on('error', err => {
    console.log(`Error with IoT device ${iotId}: ${err.message}`);
  });
});

server.listen(9001, () => {
  console.log('TCP server is listening on port 9001');
});

const cors = require('cors');
const app = express();
app.use(cors())
app.use(express.json());

let chargerStatus = 3;
let id = 0;

app.get('/api/startCharging/CHARGEON/:id', async (req, res, next) => {
  id = req.params;
  Status = true;
  console.log(Status)
  chargerStatus = 1;
  res.send("CHARGE ON")
});

app.get('/api/startCharging/CHARGEOFF/:id', async (req, res, next) => {
  id = req.params;
  Status = false;
  console.log(Status)
  chargerStatus = 2;
  res.send("CHARGE OFF")
});

app.get('/api/getIoTStatus', async (req, res, next) => {
  
  const iotStatus = await IoTModel.find().sort({_id: -1}).limit(2)
  if (!iotStatus) {
    return res.send(res, 'iotStatus not found', 404);
  } else {

    const dataArray = []
    for(i=0; i<2; i++) {
      const withoutFirstAndLast = iotStatus[i].data.slice(1, -1);
      const split_string = withoutFirstAndLast.split(",");
      dataArray.push(split_string)
    }
    //console.log(dataArray)
    if(dataArray[1].length == 24 && dataArray[0].length == 35)
    {
      const mergeResult = [...dataArray[1], ...dataArray[0]];
      return res.send(
        { 
            "statusCode": 200,
            "_id": iotStatus[0]._id,
            "IOTID": iotStatus[0].IOTID,
            "data": mergeResult,
            "remoteAddress": iotStatus[0].remoteAddress,
            "remotePort": iotStatus[0].remotePort,
            "createdAt": iotStatus[0].createdAt,
            "updatedAt": iotStatus[0].updatedAt
        }
      )
    } else {
      return res.send(
        { 
            "statusCode": 400,
            "message": 'Error While getting IOT Status',
            "_id": iotStatus[0]._id,
            "IOTID": iotStatus[0].IOTID,
            "data": [],
            "remoteAddress": iotStatus[0].remoteAddress,
            "remotePort": iotStatus[0].remotePort,
            "createdAt": iotStatus[0].createdAt,
            "updatedAt": iotStatus[0].updatedAt
        }
      )
    }
  }

});

app.get('/api/getAllIoT', async (req, res, next) => {
  
  const iotStatus = await IoTModel.find().sort({_id: -1}).limit(2)

  console.log(iotStatus)
  console.log(iotStatus.length)

  if (iotStatus.length == 0) {
    return res.send(
      { 
          "statusCode": 404,
          "message": "IoT not found"
      }
    )
  } else {
    
    if(iotStatus.length >= 2) {
      var data = [];
      var tempData = [];

      for(i= 0; i < iotStatus.length; i+=2) {
        tempData.push({"_id": iotStatus[i]._id, "IOTID": iotStatus[i].IOTID})
      }


      data = tempData;
      //console.log(data)
      
      return res.send(
      { 
          "StatusCode" : 200,
          data
      }
    )
    }
  }
});


app.get('/api/getIoTDetails/:id', async (req, res, next) => {
  
  const { id } = req.params;

  const iotStatus = await IoTModel.find({"IOTID" : id}).sort({_id: -1}).limit(2)

  //console.log(iotStatus)
  //console.log(iotStatus.length)

  if (iotStatus.length == 0) {
    return res.send(
      { 
          "statusCode": 404,
          "IOTID": id,
          "message": "IoT Details not found"
      }
    )
  } else {
    
    if(iotStatus.length >= 2) {

      for(i=0; i< iotStatus.length; i+2) {
        
        const dataArray = []
        for(k=0; k<2; k++) {
          const withoutFirstAndLast = iotStatus[k].data.slice(1, -1);
          const split_string = withoutFirstAndLast.split(",");
          dataArray.push(split_string)
        }
        //console.log(dataArray)
        const mergeResult = [...dataArray[1], ...dataArray[0]];

        return res.send(
          { 
              "statusCode": 200,
              "_id": iotStatus[i]._id,
              "IOTID": iotStatus[i].IOTID,
              "data": mergeResult
          }
        )
      }
      
    }
  }
});

app.get('/api/getAllIoTDetails', async (req, res, next) => {

  //console.log(new Date(Date.now()).toISOString())
  //console.log(new Date(Date.now() - 3 * 60 * 1000).toISOString())
  
  const iotStatus = await IoTModel.find({
    "updatedAt": { 
      $gte: new Date(Date.now() - 1 * 60 * 1000).toISOString()
    }
}).sort({_id: -1}).limit(2)

  //console.log(iotStatus)
  //console.log(iotStatus.length)

  if (iotStatus.length == 0) {
    return res.send(
      { 
          "statusCode": 200,
          "data": []
      }
    )
  } else {
    
    if(iotStatus.length >= 2) {
      var data = [];
      var tempData = [];

      for(i= 0; i < iotStatus.length; i+=2) {

        const dataArray = []
        for(k=0; k<2; k++) {
          const withoutFirstAndLast = iotStatus[k].data.slice(1, -1);
          const split_string = withoutFirstAndLast.split(",");
          dataArray.push(split_string)
        }
        //console.log(dataArray)
        if(dataArray[1].length == 24 && dataArray[0].length == 35)
        {
          const mergeResult = [...dataArray[1], ...dataArray[0]];
          
          tempData.push(
            {
              "IOTID": iotStatus[i].IOTID,
              "IOTData": mergeResult
            }
          )
        } else {
          tempData.push(
            {
              "message": 'Error While getting IOT Details',
              "IOTID": iotStatus[i].IOTID,
              "IOTData": []
            }
          )
        }
      }


      data = tempData;
      //console.log(data)
      
      return res.send(
      { 
          "StatusCode" : 200,
          data
      }
    )
    }
  }
});


app.listen(9002, () => {
  console.log('API server is listening on port 9002')
})

async function updateIOTStatus(input, remoteAddress, remotePort) {

try {
  
    console.log(`chargerStatus:${chargerStatus}`);

    //console.log(`BookingId:${id}`);
    const BookingIdArray = Object.values(id);
    //console.log(BookingIdArray[0]);
    const BookingId = BookingIdArray[0];
    //console.log(BookingId);

    let PreviousPowerConsumed = 0;
    if (BookingId && typeof BookingId !== "undefined") {
      const getPreviousPowerConsumed = await db.pool.query(`SELECT * from public."Bookings" WHERE "Id"='${BookingId}'`)
      PreviousPowerConsumed= parseInt(getPreviousPowerConsumed.rows[0].PowerConsumed);
    }

    const dataNew = String(input);
    const withoutFirstAndLast = dataNew.slice(1, -1);
    const split_string = withoutFirstAndLast.split(",");
    const IoTID = split_string[0];

    const data = new IoTModel({
      IOTID: IoTID,
      data: input,
      remoteAddress: remoteAddress,
      remotePort: remotePort
    })
  
    ///console.log(data)
  
    const dataToSave = await data.save();
    //console.log(dataToSave)
    //console.log('Success')

    //console.log(last6);
    //const powerConsumed = last6[0];
    //let powerConsumed;
    
    //console.log(`powerConsumed: ${powerConsumed}`)

    const iotDataCount = split_string.length;
    console.log(`iotDataCount: ${iotDataCount}`)

    if(iotDataCount == 35) {
      const last6 = split_string.slice(-6);
      powerConsumed = last6[0]
    }
    

    if(charger == 1) {
      console.log(`charger on : ${charger}`)

    if(iotDataCount == 24) {
      console.log(`First set Data: ${iotDataCount}`)
    
      const value1 = split_string[1];
      const value2 = split_string[2];
      const value4 = split_string[4];
      const value5 = split_string[5];
      const value19 = split_string[19];
      const value20 = split_string[20];
      const value9 = split_string[9]; // which is greater than 4
      
      console.log(`Getteing values from IOT 5th value: ${value5}`)

      if(value1 == '1' || value2 == '1' || value4 == '1' || value5 == '1' || value19 == '1' || value20== '1' || value9 > '4' || value19 == '1' || value20 == '1' ) {
        errorCount++;
        console.log(`errorCount : ${errorCount}`)
        if(errorCount > 2) {

          console.log("powerConsumed: " +powerConsumed)
          console.log("FirstpowerValue: " +FirstpowerValue)
          console.log("PreviousPowerConsumed: " +PreviousPowerConsumed)

          const finalValue = (powerConsumed -  FirstpowerValue ) + PreviousPowerConsumed
          console.log("Final Value: " +finalValue)

          charger = 0;
          chargerStatus = 3;
          console.log('Charger off')
          //socket.write('CHARGEROFF');
          
          const BookingsRef = await db.pool.query(`UPDATE public."Bookings" SET "PowerConsumed" = ${finalValue}, "ChargingStatus" = 'Incomplete' WHERE "Id" = ${BookingId}`)

          const SlotRef = await db.pool.query(`UPDATE public."Slots" SET "ChargingStatus" = 'Incomplete' WHERE "BookingId" = ${BookingId}`)

          Status = false;
          //server.write('CHARGEROFF')

        }
      } else {
        errorCount = 0;
        //charger = 0;
      }
    } 
  }

      if(chargerStatus == 1){
        charger = 1
        chargerStatus = 3;
        FirstpowerValue = powerConsumed;
        
        /*-----*/

        const finalValue = (powerConsumed - FirstpowerValue) + PreviousPowerConsumed;
        //console.log(`finalValue: ${finalValue}`)
        if(iotDataCount == 35) {
          const BookingsRef = await db.pool.query(`UPDATE public."Bookings" SET "PowerConsumed" = ${finalValue}, "ChargingStatus" = 'Charging' WHERE "Id" = ${BookingId}`)
          const SlotRef = await db.pool.query(`UPDATE public."Slots" SET "ChargingStatus" = 'Charging' WHERE "BookingId" = ${BookingId}`)
        }

        var CurrentTimeseconds = Math.round(new Date() / 1000);

        const getBookings = await db.pool.query(`SELECT * from public."Slots" WHERE "BookingId"='${BookingId}'`)
        const BookingEndDate = getBookings.rows[0].BookingEndDate;

        if(CurrentTimeseconds > BookingEndDate) {
          charger =0 ;
          console.log("Time's up")
          chargerStatus = 3;
          //socket.write('CHARGEROFF');
          const BookingsRef = await db.pool.query(`UPDATE public."Bookings" SET "PowerConsumed" = ${finalValue}, "ChargingStatus" = 'Completed' WHERE "Id" = ${BookingId}`)

          const SlotRef = await db.pool.query(`UPDATE public."Slots" SET "ChargingStatus" = 'Completed' WHERE "BookingId" = ${BookingId}`)

          Status = false;
          //server.write('CHARGEROFF')
        }
        
        /*-----*/

      } else if(chargerStatus == 2){
        charger = 0
        LastpowerValue = powerConsumed;
        //console.log(`LastpowerValue: ${LastpowerValue}`)
        chargerStatus = 3;
        const finalValue = (LastpowerValue -  FirstpowerValue ) + PreviousPowerConsumed
        //console.log(`Final Value: ${finalValue}`)
        if(finalValue > 0) {

           const BookingsRef = await db.pool.query(`UPDATE public."Bookings" SET "PowerConsumed" = ${finalValue}, "ChargingStatus" = 'Completed' WHERE "Id" = ${BookingId}`)

          const SlotRef = await db.pool.query(`UPDATE public."Slots" SET "ChargingStatus" = 'Completed' WHERE "BookingId" = ${BookingId}`)
          //socket.write('CHARGEROFF');
        }
      }
}
catch (error) {
    console.log(error)
}

}