const lib = require("../helpers/lib");
const database = require("../../database");

module.exports = {
    checkSentence : async (text, lang) => {
        return await database.select('sentences.id').from('sentences').where('sentences.text', text).andWhere('sentences.lang',lang)
    },
    checkSentenceId : async (id) => {
      return await database.select('sentences.id').from('sentences').where('sentences.id', id)
    },
    getSentenceById : async (id) => {
      return await database
        .select('sentences.id', 'sentences.lang', 'sentences.text','sentences.difficulty','sentences.usercreated','audios.audioid','audios.status as audiostatus','audios.userid','audios.licence','audios.attribution', 'audios.audiourl', 'favorites.sentenceid as favorite')
        .from('sentences')
        .leftJoin('audios','sentences.id','audios.sentenceid')
        .leftJoin('favorites','sentences.id','favorites.sentenceid')
        .where('sentences.id', id);
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
        if(req.body.translatedAudioURL) {
          const audio = {
            sentenceid: transalationId,
            userid: userId,
            audiourl: req.body.translatedAudioURL,
            status : status,
            created : lib.getCurrentTime()
          }
          await database('audios').insert(audio)
        }
        if(req.body.translatedVideoURL) {
          const video = {
            sentenceid: transalationId,
            userid: userId,
            videourl: req.body.translatedVideoURL,
            status : status,
            created : lib.getCurrentTime()
          }
          await database('videos').insert(video)
        }
    },
    updateSentencesStatus : async (idList, status) => {
        return await  database('sentences').whereIn('id', idList).update({ status: status })
    },
    updateAudiosStatus : async (idList, status) => {
        return await  database('audios').whereIn('audioid', idList).update({ status: status })
    },
    insertAudio: async(sentenceid, userId, audioURL, status) => {
      const audio = {
        sentenceid: sentenceid,
        userid: userId,
        audiourl: audioURL,
        status : status,
        created : lib.getCurrentTime()
      }
      await database('audios').insert(audio).returning("audioid")
    },
    updateAudiosUrl : async (audioId, audioURL) => {
      return await  database('audios').where('audioid', audioId).update({ audiourl: audioURL, created: lib.getCurrentTime() })
    },
    updateAudiosDownloadCheck : async (audioId, status) => {
      return await  database('audios').where('audioid', audioId).update({ status: status, created: lib.getCurrentTime() })
    }
}

