const express = require('express')
const cors = require('cors')
const multer = require('multer')
const upload = multer()

require('dotenv').config()

app = express()
app.use(cors())
app.use(express.json())
app.use(upload.array('file'))
app.use(express.static('public'))

port = process.env.PORT || 5000

// Create Routes
const users = require('./routes/users')
const tweets = require('./routes/tweets')

// Use Routes
app.use('/users', users)
app.use('/tweets', tweets)

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

module.exports = upload