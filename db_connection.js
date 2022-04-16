const mysql = require('mysql')

const db = mysql.createConnection({
    host: process.env.DB_ENDPOINT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DB
})

db.connect(err => {
    if (err) throw err
    console.log("Database connection established Sucessfully!")
})

module.exports = db