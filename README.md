# WordOfMouthBackend
Word of Mouth Backend

SETUP INSTRUCTIONS
1. Clone project
2. NPM install
3. Configure database access details depending on where you've installed.

TECHNOLOGY STACK
- NodeJs
- ExpressJs
- PostgreSQL
- Various npm packages for managing backend setup.

DATABASE SETUP
- Table: fields
- sentences: id, lang, created, modified, text
- links: linkid, sentenceid, translationid
- audios: audioid, sentenceid, username, licence, attribution, url, audiourl
- videos: videoid, sentenceid, userid, videourl, rating, raters, status, created
- tags: tagid, sentenceid, tag





