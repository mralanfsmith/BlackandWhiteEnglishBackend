module.exports = {
  getCurrentTime : () => {
    var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    var time = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
    return time.replace("T", " ");
  },
  getSentenceDifficulty: (sentence) => {
    let difficulty = 1;
    const numOfWords = sentence.split(' ').length;
    if(numOfWords <= 3) {
      difficulty = 1;
    } else if(numOfWords > 3 && numOfWords <= 6) {
      difficulty = 2;
    } else if(numOfWords > 6 && numOfWords <= 9) {
      difficulty = 3;
    } else if(numOfWords > 9 && numOfWords <= 12) {
      difficulty = 4;
    } else if(numOfWords > 12) {
      difficulty = 5;
    }
    return difficulty
  }
}

const Status = { 
  APPROVED: 'approved', 
  PENDING: 'pending', 
  REJECTED: 'rejected'
}

module.exports.Status = Status