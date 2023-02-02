const express = require('express')
const cors = require('cors')

require('dotenv').config()

app = express()
app.use(cors())
app.use(express.json())

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