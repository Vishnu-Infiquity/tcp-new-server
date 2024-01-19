const mongoose = require('mongoose');

const faultdetailsSchema = new mongoose.Schema({
    data: {
        required: true,
        type: String
    },
    IOTID: {
        required: true,
        type: String
    },
    Phase_Det_01: {
        required: true,
        type: String
    },
    Phase_Det_02: {
        required: true,
        type: String
    },
    Feedback_Contactor: {
        required: true,
        type: String
    },
    Feedback_Emerg_SW: {
        required: true,
        type: String
    },
    Feedback_Limit_SW: {
        required: true,
        type: String
    },
    Hooter_Feedback: {
        required: true,
        type: String
    },
    Aux_Feedback: {
        required: true,
        type: String
    },
    Pin_Reserved: {
        required: true,
        type: String
    },
    chargerStatus: {
        required: true,
        type: String
    },
    charger_error_Status: {
        required: true,
        type: String
    },
    chargingVoltage: {
        required: true,
        type: String
    },
    chargingCurrent: {
        required: true,
        type: String
    },
    chargingTime: {
        required: true,
        type: String
    },
    chargingAh: {
        required: true,
        type: String
    },
    Ambient_temp: {
        required: true,
        type: String
    },
    Panel_temp: {
        required: true,
        type: String
    },
    RSSI_strength: {
        required: true,
        type: String
    },
    signalFire_Alarm: {
        required: true,
        type: String
    },
    Alert_01_Modbus_failed: {
        required: true,
        type: String
    },

    Alert_02_Rs232_failed: {
        required: true,
        type: String
    },
    Alert_03_Reserved: {
        required: true,
        type: String
    },
    Alert_04_Reserved: {
        required: true,
        type: String
    },
    Alert_05_Reserved: {
        required: true,
        type: String
    }
}, { timestamps: true, versionKey: false })

module.exports = mongoose.model('FaultDetails', faultdetailsSchema)