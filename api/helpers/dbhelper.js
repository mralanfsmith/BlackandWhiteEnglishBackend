const lib = require("../helpers/lib");
const database = require("../../database");

module.exports = {
    checkSentence : async (text, lang) => {
        return await database.select('sentences.id').from('sentences').where('sentences.text', text).andWhere('sentences.lang',lang)
    },
    createSentence : async (sentenceData) => {
        sentenceData.difficulty = lib.getSentenceDifficulty(sentenceData.text);
        sentenceData.created = lib.getCurrentTime();
        sentenceData.modified =  sentenceData.created;
        sentenceData.usercreated = true;
        return await database('sentences').insert(sentenceData).returning("id")
    },
    updateCard : async (req , sentenceId, userId, status) => {
        let transalationId = sentenceId;
        if(req.body.translatedText && req.body.translatedLang) {
            const transSentenceData = {};
            transSentenceData.lang = req.body.translatedLang
            transSentenceData.text = req.body.translatedText
            transSentenceData.status = status
            transSentenceData.difficulty = lib.getSentenceDifficulty(transSentenceData.text);
            transSentenceData.created = lib.getCurrentTime();
            transSentenceData.modified =  transSentenceData.created;
            transSentenceData.usercreated = true;
            const newId = await database('sentences').insert(transSentenceData).returning("id")
            transalationId = newId[0]
            const linksSourceLang = {
                sentenceid: sentenceId,
                translationid: newId[0]
            }
            const linksTransaltionLang = {
                sentenceid: newId[0],
                translationid: sentenceId
            }
            await database('links').insert([linksSourceLang, linksTransaltionLang])
        }
        if(req.body.audioURL) {
          const audio = {
            sentenceid: sentenceId,
            userid: userId,
            audiourl: req.body.audioURL,
            status : status,
            created : lib.getCurrentTime()
          }
          await database('audios').insert(audio)
        }
        if(req.body.videoURL) {
          const video = {
            sentenceid: sentenceId,
            userid: userId,
            videourl: req.body.videoURL,
            status : status,
            created : lib.getCurrentTime()
          }
          await database('videos').insert(video)
        }
        if(req.body.transalatedAudioURL) {
          const audio = {
            sentenceid: transalationId,
            userid: userId,
            audiourl: req.body.transalatedAudioURL,
            status : status,
            created : lib.getCurrentTime()
          }
          await database('audios').insert(audio)
        }
        if(req.body.transalatedVedioURL) {
          const video = {
            sentenceid: transalationId,
            userid: userId,
            videourl: req.body.transalatedVedioURL,
            status : status,
            created : lib.getCurrentTime()
          }
          await database('videos').insert(video)
        }
    }
}

