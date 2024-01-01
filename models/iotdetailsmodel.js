const mongoose = require('mongoose');

const iotdetailsSchema = new mongoose.Schema({
    IOTID: {
        required: true,
        type: String
    },
    data: {
        required: true,
        type: String
    },
    remoteAddress: {
        required: false,
        type: String
    },
    remotePort: {
        required: false,
        type: String
    }
}, { timestamps: true, versionKey: false })

module.exports = mongoose.model('IOTDetails', iotdetailsSchema)