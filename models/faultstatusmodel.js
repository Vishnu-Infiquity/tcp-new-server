const mongoose = require('mongoose');

const faultstatusSchema = new mongoose.Schema(
    {
        data: {
            type: String
        },
        IOTID: {
            type: String
        },
        Phase_Det_01: {
            type: String
        },
        Phase_Det_02: {
            type: String
        },
        Feedback_Contactor: {
            type: String
        },
        Feedback_Emerg_SW: {
            type: String
        },
        Feedback_Limit_SW: {
            type: String
        },
        Hooter_Feedback: {
            type: String
        },
        Aux_Feedback: {
            type: String
        },
        Pin_Reserved: {
            type: String
        },
        chargerStatus: {
            type: String
        },
        charger_error_Status: {
            type: String
        },
        chargingVoltage: {
            type: String
        },
        chargingCurrent: {
            type: String
        },
        chargingTime: {
            type: String
        },
        chargingAh: {
            type: String
        },
        Ambient_temp: {
            type: String
        },
        Panel_temp: {
            type: String
        },
        RSSI_strength: {
            type: String
        },
        signalFire_Alarm: {
            type: String
        },
        Alert_01_Modbus_failed: {
            type: String
        },

        Alert_02_Rs232_failed: {
            type: String
        },
        Alert_03_Reserved: {
            type: String
        },
        Alert_04_Reserved: {
            type: String
        },
        Alert_05_Reserved: {
            type: String
        },
        Status : {
            type: String
        },
        CreatedAt: {
            type: String
        },
        UpdatedAt: {
            type: String
        }
    })

module.exports = mongoose.model('FaultStatus', faultstatusSchema)