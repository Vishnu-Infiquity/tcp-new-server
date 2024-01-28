const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
    host: '34.126.221.176',
    database: 'airport-iot-db',
    password: 'gmr-infiquity',
    port: '5432'
})

module.exports = {
    pool
}