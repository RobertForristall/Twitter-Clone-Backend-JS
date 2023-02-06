const jwt = require('jsonwebtoken')

const nodemailer = require('nodemailer')

const s3 = require('./bucket_connection')

function AuthenticateToken(req, res, next) {

    const authHeader = req.headers['authorization']

    if (authHeader == null) return res.status(403).json('Error: Token Required')

    if (authHeader.split(' ')[0] !== 'bearer' && authHeader.split(' ')[0] !== 'Bearer'){
        return res.status(403).json('Error: token is not of the correct format')
    } 

    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.status(403).json('Error: token string missing')

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json('Error: Token failed to verify' + err)

        req.user = user
        next()
    })
}

function generateValuesStr (object) {
    arr = []
    Object.keys(object).forEach(key => {
        if (typeof(object[key]) == typeof('')){
            if (key === "datePosted") arr.push(`"${object[key].substring(0, 10)}"`)
            else arr.push(`"${object[key]}"`)
        }
        else if (typeof(object[key]) == typeof(0)){
            arr.push(`${object[key]}`)
        }
    })
    return arr
}

function queryInsertGenerator (object, table_name) {
    keys = Object.keys(object)
    return `insert into ${table_name} (${keys.join()}) 
    values (${generateValuesStr(object).join()});`

}

function queryUpdateGenerator (object, table_name) {
    
}

async function getImages(data) {
    console.log('Checking for images')

    let rv = {
        image_arr: [],
        index_arr: []
    }

    data.map((tweet, index) => {
        if (tweet.sharedContent === 'Image' || tweet.sharedContent === 'GIF'){
            params = {
                Bucket: process.env.BUCKET_NAME,
                Key: tweet.fileKey
            }
            console.log(`Getting object with key: ${tweet.fileKey}`)
            rv.image_arr.push(s3.getObject(params).promise())
            rv.index_arr.push(index)
        }
    })

    await Promise.all(rv.image_arr)
        .then(res => {
            //console.log(new Buffer.from(res[0].Body).toString('base64'))
            rv.image_arr = res.map((image) => {
                return new Buffer.from(image.Body).toString('base64')
            })
        })
    
    return rv
}

module.exports = {
    AuthenticateToken: AuthenticateToken,
    queryInsertGenerator: queryInsertGenerator,
    getImages: getImages
}