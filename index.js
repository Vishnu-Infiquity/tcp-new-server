const net = require('net');
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const router = express.Router();
const IoTModel = require('./models/iotdetailsmodel');
const FaultModel = require('./models/faultdetailsmodel');
const FaultStatusModel = require('./models/faultstatusmodel');
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

var errorCountStatus=0;

var powerConsumed = 0; 

var firstTime = 1;
let PreviousPowerConsumed = 0;

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


/*app.post('/api/getChargerFaultDetails/', async (req, res, next) => {
  
  const { ChargerID, StartDate, EndDate } = req.body;

  const getChargerDetails = await db.pool.query(`SELECT * from public."Chargers" WHERE "ChargerId"='${ChargerID}'`)
  console.log('getChargerDetails count:')
  console.log(getChargerDetails.rowCount)

  if(getChargerDetails.rowCount > 0) {
    const chargerId = getChargerDetails.rows[0].Id;
    console.log('chargerId:')
    console.log(chargerId)

    const getIoTDetails = await db.pool.query(`SELECT * from public."IoT" WHERE "ChargerId"='${chargerId}'`)

    const IOTID = getIoTDetails.rows[0].IOTID;
    console.log('IOTID:')
    console.log(IOTID)

    const StartDateEpoc= new Date(StartDate)
    console.log(StartDateEpoc)

    const EndDateEpoc= new Date(EndDate)
    console.log(EndDateEpoc)

    //const iotDetails = await IoTModel.find({"IOTID" : IOTID}, {"createdAt" : '2023-12-12T16:36:47.995+00:00'}).sort({_id: -1})
    //const iotDetails = await IoTModel.find({"IOTID" : IOTID , "createdAt" : '2024-01-18T14:21:36.461+00:00'}).sort({_id: -1})

    const iotDetails = await FaultModel.find({ 
      "$or": [
        {
          "Phase_Det_01": '1'
        }, 
        {
          "Phase_Det_02": "1"
        },
        {
          "Feedback_Emerg_SW": "1"
        },
        {
          "Feedback_Limit_SW": "1"
        },
        {
          "Hooter_Feedback": "1"
        },
        {
          "Aux_Feedback": "1"
        },
        {
          "chargerStatus": "5"
        },
        {
          "Ambient_temp" : "70"
        },
        {
          "Panel_temp": "70"
        },
        {
          "Alert_01_Modbus_failed": "1"
        },
        {
          "Alert_02_Rs232_failed": "1"
        }
      ],
    "IOTID" : IOTID,  
    "createdAt" : { $gte: StartDateEpoc, $lt: EndDateEpoc } }, {"data" : 0}).sort({_id: -1})

    console.log('iotDetails count:')
    console.log(iotDetails.length)

    if (iotDetails.length == 0) {
      return res.send(
        { 
            "statusCode": 200,
            "chargerId": ChargerID,
            "IOTID": IOTID,
            "message": "IoT Details not found",
            "data" : []
        }
      )
    }
  else {
      return res.send(
        { 
            "statusCode": 200,
            "chargerId": ChargerID,
            "IOTID": IOTID,
            "data" : iotDetails
        }
      )
  }
} else {
    return res.send(
        { 
            "statusCode": 404,
            "message": "Charger not found"
        }
    )
  }
});
*/

app.post('/api/getChargerFaultStatus/', async (req, res, next) => {
  
  const { ChargerID, StartDate, EndDate } = req.body;

  const getChargerDetails = await db.pool.query(`SELECT * from public."Chargers" WHERE "ChargerId"='${ChargerID}'`)
  console.log('getChargerDetails count:')
  console.log(getChargerDetails.rowCount)

  if(getChargerDetails.rowCount > 0) {
    const chargerId = getChargerDetails.rows[0].Id;
    console.log('chargerId:')
    console.log(chargerId)

    const getIoTDetails = await db.pool.query(`SELECT * from public."IoT" WHERE "ChargerId"='${chargerId}'`)

    const IOTID = getIoTDetails.rows[0].IOTID;
    console.log('IOTID:')
    console.log(IOTID)

    /*const StartDateEpoc= new Date(StartDate)
    console.log(StartDateEpoc)

    const EndDateEpoc= new Date(EndDate)
    console.log(EndDateEpoc)*/

    var dateFrom = StartDate.split("-"); 
    console.log(dateFrom)

    var FinaldateFrom = `${parseInt(dateFrom[1])}-${parseInt(dateFrom[0])}-${parseInt(dateFrom[2])}`; 
    console.log(FinaldateFrom); 
    const startTimeupdate = `${FinaldateFrom} 00:00`
    const startTimeEpoc= new Date(startTimeupdate)
    const timestampStart = Date.parse(startTimeEpoc)
    const FaultStartDate = (timestampStart/1000)
    console.log(FaultStartDate)

    var dateTo = EndDate.split("-"); 
    console.log(dateTo)

    var FinaldateTo = `${parseInt(dateTo[1])}-${parseInt(dateTo[0])}-${parseInt(dateTo[2])}`; 
    console.log(FinaldateTo);
    const endTimeupdate = `${FinaldateTo} 23:59`
    const endTimeEpoc= new Date(endTimeupdate)
    const timestampEnd = Date.parse(endTimeEpoc)
    const FaultEndDate = (timestampEnd/1000)
    console.log(FaultEndDate)

    //const iotDetails = await IoTModel.find({"IOTID" : IOTID}, {"createdAt" : '2023-12-12T16:36:47.995+00:00'}).sort({_id: -1})
    //const iotDetails = await IoTModel.find({"IOTID" : IOTID , "createdAt" : '2024-01-18T14:21:36.461+00:00'}).sort({_id: -1})

    const iotDetails = await FaultStatusModel.find({ 
    "IOTID" : IOTID,  
    "CreatedAt" : { $gte: FaultStartDate },
    "UpdatedAt" : { $lte: FaultEndDate },
    }, {"data" : 0}).sort({_id: -1})

    console.log('iotDetails count:')
    console.log(iotDetails.length)
    //console.log(iotDetails)

    if (iotDetails.length == 0) {
      return res.send(
        { 
            "statusCode": 200,
            "chargerId": ChargerID,
            "IOTID": IOTID,
            "message": "IoT Details not found",
            "data" : []
        }
      )
    }
  else {

    var data = [];
    var tempData = [];

      for(i=0; i< iotDetails.length; i++) {

        //const CreatedAtTime = new Date(iotDetails[i].CreatedAt * 1000)
        //const UpdatedAtTime = new Date(iotDetails[i].UpdatedAt * 1000)

        //console.log(iotDetails[i].CreatedAt)
        //console.log(iotDetails[i].UpdatedAt)

        var CreatedAtdate = new Date(iotDetails[i].CreatedAt * 1000);
        console.log(CreatedAtdate);

        const CreatedAtdateFormat = `${CreatedAtdate.getDate()}-${CreatedAtdate.getMonth()+1}-${CreatedAtdate.getFullYear()} ${CreatedAtdate.getHours()}:${CreatedAtdate.getMinutes()}:${CreatedAtdate.getSeconds()}`
        console.log(CreatedAtdateFormat)

        var UpdatedAtdate = new Date(iotDetails[i].UpdatedAt * 1000);
        console.log(UpdatedAtdate);

        const UpdatedAtdateFormat = `${UpdatedAtdate.getDate()}-${UpdatedAtdate.getMonth()+1}-${UpdatedAtdate.getFullYear()} ${UpdatedAtdate.getHours()}:${UpdatedAtdate.getMinutes()}:${UpdatedAtdate.getSeconds()}`
        console.log(UpdatedAtdateFormat)


        tempData.push(
          {
              /*"_id" : iotDetails[i]._id,
              "IOTID" : iotDetails[i].IOTID,*/
              "Phase_Det_01" : iotDetails[i].Phase_Det_01,
              "Phase_Det_02" : iotDetails[i].Phase_Det_02,
              /*"Feedback_Contactor" : iotDetails[i].Feedback_Contactor,*/
              "Feedback_Emerg_SW" : iotDetails[i].Feedback_Emerg_SW,
              "Feedback_Limit_SW" : iotDetails[i].Feedback_Limit_SW,
              "Hooter_Feedback" : iotDetails[i].Hooter_Feedback,
              "Aux_Feedback" : iotDetails[i].Aux_Feedback,
              /*"Pin_Reserved" : iotDetails[i].Pin_Reserved,*/
              "chargerStatus" : iotDetails[i].chargerStatus,
              "charger_error_Status" : iotDetails[i].charger_error_Status,
              /*"chargingVoltage" : iotDetails[i].chargingVoltage,
              "chargingCurrent" : iotDetails[i].chargingCurrent,
              "chargingTime" : iotDetails[i].chargingTime,
              "chargingAh" : iotDetails[i].chargingAh,*/
              "Ambient_temp" : iotDetails[i].Ambient_temp,
              "Panel_temp" : iotDetails[i].Panel_temp,
              "RSSI_strength" : iotDetails[i].RSSI_strength,
              "signalFire_Alarm" : iotDetails[i].signalFire_Alarm,
              "Alert_01_Modbus_failed" : iotDetails[i].Alert_01_Modbus_failed,
              "Alert_02_Rs232_failed" : iotDetails[i].Alert_02_Rs232_failed,
              /*"Alert_03_Reserved" : iotDetails[i].Alert_03_Reserved,
              "Alert_04_Reserved" : iotDetails[i].Alert_04_Reserved,
              "Alert_05_Reserved" : iotDetails[i].Alert_05_Reserved,*/
              "Status" : iotDetails[i].Status,
              "CreatedAt" : CreatedAtdateFormat,
              "UpdatedAt" : UpdatedAtdateFormat
          })

      }

      data = tempData;
      return res.send(
        { 
            "StatusCode" : 200,
            "chargerId": ChargerID,
            "IOTID": IOTID,
            data
        }
      )
  }
} else {
    return res.send(
        { 
            "statusCode": 404,
            "message": "Charger not found"
        }
    )
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
    var contactorStatus;

    if(iotDataCount == 24) {

      const faultdata = new FaultModel({
        data: input,
        IOTID: split_string[0],
        Phase_Det_01: split_string[1],
        Phase_Det_02: split_string[2],
        Feedback_Contactor: split_string[3],
        Feedback_Emerg_SW: split_string[4],
        Feedback_Limit_SW: split_string[5],
        Hooter_Feedback: split_string[6],
        Aux_Feedback: split_string[7],
        Pin_Reserved: split_string[8],
        chargerStatus: split_string[9],
        charger_error_Status: split_string[10],
        chargingVoltage: split_string[11],
        chargingCurrent: split_string[12],
        chargingTime: split_string[13],
        chargingAh: split_string[14],
        Ambient_temp: split_string[15],
        Panel_temp: split_string[16],
        RSSI_strength: split_string[17],
        signalFire_Alarm: split_string[18],
        Alert_01_Modbus_failed: split_string[19],
        Alert_02_Rs232_failed: split_string[20],
        Alert_03_Reserved: split_string[21],
        Alert_04_Reserved: split_string[22],
        Alert_05_Reserved: split_string[23]
      })

      const faultDataToSave = await faultdata.save();

     /** Fault Status check*/
      const value1 = split_string[1];
      const value2 = split_string[2];
      const value4 = split_string[4];
      const value5 = split_string[5];
      const value19 = split_string[19];
      const value20 = split_string[20];
      const value9 = split_string[9]; // which is greater than 4
      contactorStatus = split_string[3]; /* 1-ON, 0-OFF*/
      

      const getiotFault = await FaultStatusModel.find({ IOTID: split_string[0], Status: 'OPEN'})
      console.log('getiotFault Length:')
      console.log(getiotFault.length)

      if(getiotFault.length == 0) 
      {
          if(value1 == '1' || value2 == '1' || value4 == '1' || value5 == '1' || value19 == '1' || value20== '1' || value9 > '4' || value19 == '1' || value20 == '1' ) 
          {
            const currentTime = Date.now()
            var timestamp = Math.round(currentTime/1000);

            const faultStatusData = new FaultStatusModel({
              data: input,
              IOTID: split_string[0],
              Phase_Det_01: split_string[1],
              Phase_Det_02: split_string[2],
              Feedback_Contactor: split_string[3],
              Feedback_Emerg_SW: split_string[4],
              Feedback_Limit_SW: split_string[5],
              Hooter_Feedback: split_string[6],
              Aux_Feedback: split_string[7],
              Pin_Reserved: split_string[8],
              chargerStatus: split_string[9],
              charger_error_Status: split_string[10],
              chargingVoltage: split_string[11],
              chargingCurrent: split_string[12],
              chargingTime: split_string[13],
              chargingAh: split_string[14],
              Ambient_temp: split_string[15],
              Panel_temp: split_string[16],
              RSSI_strength: split_string[17],
              signalFire_Alarm: split_string[18],
              Alert_01_Modbus_failed: split_string[19],
              Alert_02_Rs232_failed: split_string[20],
              Alert_03_Reserved: split_string[21],
              Alert_04_Reserved: split_string[22],
              Alert_05_Reserved: split_string[23],
              Status: 'OPEN',
              CreatedAt : timestamp,
              UpdatedAt : timestamp
            })

            const faultStatusDataToSave = await faultStatusData.save();
          }
      
      } else {

        if(value1 == '0' && value2 == '0' && value4 == '0' && value5 == '0' && value19 == '0' && value20 == '0' && value9 <= '4')
        {

          const currentTime = Date.now()
          var timestamp = Math.round(currentTime/1000);

          const valueDetails = await FaultStatusModel.findOneAndUpdate({IOTID: split_string[0], Status: 'OPEN'},
            {
              $set:
              {
                /*data: input,
                IOTID: split_string[0],
                Phase_Det_01: split_string[1],
                Phase_Det_02: split_string[2],
                Feedback_Contactor: split_string[3],
                Feedback_Emerg_SW: split_string[4],
                Feedback_Limit_SW: split_string[5],
                Hooter_Feedback: split_string[6],
                Aux_Feedback: split_string[7],
                Pin_Reserved: split_string[8],
                chargerStatus: split_string[9],
                charger_error_Status: split_string[10],
                chargingVoltage: split_string[11],
                chargingCurrent: split_string[12],
                chargingTime: split_string[13],
                chargingAh: split_string[14],
                Ambient_temp: split_string[15],
                Panel_temp: split_string[16],
                RSSI_strength: split_string[17],
                signalFire_Alarm: split_string[18],
                Alert_01_Modbus_failed: split_string[19],
                Alert_02_Rs232_failed: split_string[20],
                Alert_03_Reserved: split_string[21],
                Alert_04_Reserved: split_string[22],
                Alert_05_Reserved: split_string[23],*/
                Status : 'CLOSE',
                UpdatedAt : timestamp
              }
            });
        }

      }
      
      
      /** Fault Status check*/
    }

    if(iotDataCount == 35) {
      const last6 = split_string.slice(-6);
      powerConsumed = last6[0]
      console.log(`Power consumend data: ${powerConsumed}`)
    }
    
    if(iotDataCount == 24) {
      console.log(`First set Data: ${iotDataCount}`)
    
      const value1 = split_string[1];
      const value2 = split_string[2];
      const value4 = split_string[4];
      const value5 = split_string[5];
      const value19 = split_string[19];
      const value20 = split_string[20];
      const value9 = split_string[9]; // which is greater than 4
      contactorStatus = split_string[3];

      console.log(`Getteing values from IOT 5th value: ${value5}`)

      if(value1 == '1' || value2 == '1' || value4 == '1' || value5 == '1' || value19 == '1' || value20== '1' || value9 > '4' || value19 == '1' || value20 == '1' ) {
        errorCountStatus++;
        console.log(`errorCountStatus : ${errorCountStatus}`)
        if(errorCountStatus > 2) {
          firstTime = 1;
          PreviousPowerConsumed = 0;
          console.log(`powerConsumed: ${powerConsumed}`)
          console.log(`FirstpowerValue: ${FirstpowerValue}`)
          console.log(`PreviousPowerConsumed: ${PreviousPowerConsumed}`)

          /** When fault - set chargers status to FALSE* */
          const getRef = await db.pool.query(`SELECT * FROM public."IoT" WHERE "IOTID" = '${IoTID}'`)
          const ChargerId = getRef.rows[0].ChargerId;
          const ChargerRef = await db.pool.query(`UPDATE public."Chargers" SET "Status" = false WHERE "Id" = ${ChargerId}`)
          /*** */

        }
      } else {
        errorCountStatus = 0; 

        console.log(`powerConsumed: ${powerConsumed}`)
        console.log(`FirstpowerValue: ${FirstpowerValue}`)
        console.log(`PreviousPowerConsumed: ${PreviousPowerConsumed}`)

        /** When fault - set chargers status to FALSE* */
        const getRef = await db.pool.query(`SELECT * FROM public."IoT" WHERE "IOTID" = '${IoTID}'`)
        const ChargerId = getRef.rows[0].ChargerId;
        const ChargerRef = await db.pool.query(`UPDATE public."Chargers" SET "Status" = true WHERE "Id" = ${ChargerId}`)
        /*** */
      }
    } 

    if(charger == 1) {
      console.log(`charger on : ${charger}`)

      var CurrentTimeseconds = Math.round(new Date() / 1000);
      console.log(`CurrentTimeseconds - ${CurrentTimeseconds}`)

      const getBookings = await db.pool.query(`SELECT * from public."Slots" WHERE "BookingId"='${BookingId}'`)
      const BookingEndDate = getBookings.rows[0].BookingEndDate;
      console.log(`BookingEndDateTime - ${BookingEndDate}`)

      if(CurrentTimeseconds > BookingEndDate) {
        console.log("Time's up")
      } else {
        console.log("charger is running...")
      }

      if(CurrentTimeseconds > BookingEndDate) {
        charger =0 ;
        console.log("Time's up")
        chargerStatus = 3;
        //socket.write('CHARGEROFF');

        console.log(`powerConsumed: ${powerConsumed}`)
        console.log(`FirstpowerValue: ${FirstpowerValue}`)
        console.log(`PreviousPowerConsumed: ${PreviousPowerConsumed}`)

        const finalValue = (powerConsumed -  FirstpowerValue ) + PreviousPowerConsumed
        
        const BookingsRef = await db.pool.query(`UPDATE public."Bookings" SET "PowerConsumed" = ${finalValue}, "ChargingStatus" = 'Completed' WHERE "Id" = ${BookingId}`)

        const SlotRef = await db.pool.query(`UPDATE public."Slots" SET "ChargingStatus" = 'Completed' WHERE "BookingId" = ${BookingId}`)

        Status = false;
        //server.write('CHARGEROFF')
      }


      if(iotDataCount == 35) {
        console.log(`powerConsumed: ${powerConsumed}`)
        console.log(`FirstpowerValue: ${FirstpowerValue}`)
        console.log(`PreviousPowerConsumed: ${PreviousPowerConsumed}`)

        const finalValue = (powerConsumed -  FirstpowerValue ) + PreviousPowerConsumed
        const BookingsRef = await db.pool.query(`UPDATE public."Bookings" SET "PowerConsumed" = ${finalValue}, "ChargingStatus" = 'Charging' WHERE "Id" = ${BookingId}`)
        const SlotRef = await db.pool.query(`UPDATE public."Slots" SET "ChargingStatus" = 'Charging' WHERE "BookingId" = ${BookingId}`)
      }

    if(iotDataCount == 24) {
      console.log(`First set Data: ${iotDataCount}`)
    
      const value1 = split_string[1];
      const value2 = split_string[2];
      const value4 = split_string[4];
      const value5 = split_string[5];
      const value19 = split_string[19];
      const value20 = split_string[20];
      const value9 = split_string[9]; // which is greater than 4
      contactorStatus = split_string[3]; /* 1-ON, 0-OFF*/
      
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

          /** When fault - set chargers status to FALSE* */
          //const getRef = await db.pool.query(`SELECT * FROM public."IoT" WHERE "IOTID" = '${IoTID}'`)
          //const ChargerId = getRef.rows[0].ChargerId;
          //const ChargerRef = await db.pool.query(`UPDATE public."Chargers" SET "Status" = false WHERE "Id" = ${ChargerId}`)
          /*** */

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

        if (BookingId && typeof BookingId !== "undefined") {
          const getPreviousPowerConsumed = await db.pool.query(`SELECT * from public."Bookings" WHERE "Id"='${BookingId}'`)
          PreviousPowerConsumed= parseInt(getPreviousPowerConsumed.rows[0].PowerConsumed);
        } else {
          PreviousPowerConsumed= 0;
        }

        charger = 1
        chargerStatus = 3;
        FirstpowerValue = powerConsumed;
        
        /*-----*/
        console.log(`powerConsumed: ${powerConsumed}`)
        console.log(`FirstpowerValue: ${FirstpowerValue}`)
        console.log(`PreviousPowerConsumed: ${PreviousPowerConsumed}`)
        const finalValue = (powerConsumed - FirstpowerValue) + PreviousPowerConsumed;
        console.log(`finalValue: ${finalValue}`)
       
        /*-----*/

      } else if(chargerStatus == 2 && contactorStatus == 0){
        charger = 0
        
        LastpowerValue = powerConsumed;
        console.log(`FirstpowerValue: ${FirstpowerValue}`)

        console.log(`LastpowerValue: ${LastpowerValue}`)

        console.log(`PreviousPowerConsumed: ${PreviousPowerConsumed}`)


        chargerStatus = 3;
        const finalValue = (LastpowerValue -  FirstpowerValue ) + PreviousPowerConsumed
        console.log(`Final Value after calculation: ${finalValue}`)

        if(finalValue > 0) {

           const BookingsRef = await db.pool.query(`UPDATE public."Bookings" SET "PowerConsumed" = ${finalValue}, "ChargingStatus" = 'Completed' WHERE "Id" = ${BookingId}`)

          const SlotRef = await db.pool.query(`UPDATE public."Slots" SET "ChargingStatus" = 'Completed' WHERE "BookingId" = ${BookingId}`)
          //socket.write('CHARGEROFF');
        }

        firstTime = 1;
        PreviousPowerConsumed = 0;
      }
}
catch (error) {
    console.log(error)
}

}