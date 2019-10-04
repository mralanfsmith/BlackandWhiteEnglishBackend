const aws = require('aws-sdk');
const request = require('request-promise')

// AWS configuration
aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || '',
    region: process.env.AWS_REGION || ''
});


// Set S3 endpoint to AWS
const s3 = new aws.S3();
let s3Bucket = process.env.S3_BUCKET_BLACKANDWHITE || 'womcdn';

module.exports = {
    uploadAudio : async (id, lang) => {
        
        const audioUrl ='https://audio.tatoeba.org/sentences/'+lang+'/'+ id +'.mp3';

        const options = {
            uri: audioUrl,
            encoding: null
        };

        try {
            const body = await request(options)
            const now = new Date()  
            const key = 'uploads/audio/tatoeba/' + now.getTime() + '.mp3'
    
            return await s3.upload({
                Bucket: s3Bucket,
                Key   : key,
                Body  : body,
                acl   : 'public-read',
            }).promise()
        } catch(err) {
            return err.statusCode
        }
    }
}