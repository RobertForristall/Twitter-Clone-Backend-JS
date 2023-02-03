const AWS = require('aws-sdk')

credentials = AWS.Credentials(process.env.BUCKET_ACCESS_KEY, process.env.BUCKET_SECRET_KEY)

AWS.config.update({
    credentials
})

const s3 = new AWS.S3()
//s3.listBuckets({}, (err, data) => {
//    if (err) console.log(err.stack)
//    else console.log(data)
//})

module.exports = s3