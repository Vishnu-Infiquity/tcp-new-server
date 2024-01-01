const cors = require('cors');
const express = require('express');


const app = express();
app.use(cors())
app.use(express.json());

const routes = require('./routes/index');

app.use('/api', routes)

app.listen(9001, () => {
    console.log('TCP server is listening on port 9001')
})