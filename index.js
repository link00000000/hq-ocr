// Inorder for this to work, lonelyscreen (https://www.lonelyscreen.com/) must be in full screen on main monitor at a resolution of 1920x1080
// Exactly one iPhone 6s must be casting a live game of HQ to lonelycast (has not been tested with phones of other models)
// Tesseract OCR (https://github.com/tesseract-ocr/tesseract) must be installed and bin must be added to environmental variables
// Run `npm install` before running to acquire dependencies
//
// Other notes
// Node v8.9.4 installed and bin added to environmental variables
// NPM 5.6.0 installed
// Python 2.7 installed and bin added to environmental variables
// Only tested on windows
// Only tested with lonelyscreen
// Only tested on iPhone 6s
//
// Todo List
// Pretty electron interface
// Tesseract replaced by Google Visual API?
// Parsing google search results for answers provided and rating answers based on the frequency of appearance
// Simple one-click installer
// Support for different phone types
// Support for different montior sizes and resolutions
// Support for different screencasting software
// Support for emulation with automatic answer selection

// node_modules
var screenshot = require('screenshot-desktop');
var jimp = require('jimp');
var tesseract = require('node-tesseract');
var path = require('path');
var google = require('google'); google.resultsPerPage = 25;

// Keeps track of all async calls to wait for all to complete before continuing
var completedAsyncCalls = {
  question: false,
  ansOne: false,
  ansTwo: false,
  ansThree: false,
  googleSearch: false
}

// Global variables that house resultant text of OCR
var questionText,
    ansOneText,
    ansTwoText,
    ansThreeText,
    googleSearchResultText;

// Screenshot of main monitor taken
screenshot().then(function(img) {

  // If sample image is supplied via command line argument
  // override image buffer with sample image
  if(process.argv[2]) {
    img = process.argv[2];
  }

  // Image buffer casted to JIMP object
  jimp.read(img, function(err, image) {
    if (err) throw err;

    // JIMP object cloned to be split into 4 parts:
    // question, ansOne, ansTwo, ansThree
    var question = image.clone();
    var ansOne = image.clone();
    var ansTwo = image.clone();
    var ansThree = image.clone();
    
    // Question
    // Processed with JIMP
    // Text extracted with Tesseract OCR
    question
      .crop(710, 150, 500, 250)
      .contrast(.42)
      .brightness(-.27)
      .write('question.png', function() {

        tesseract.process(path.join(__dirname, 'question.png'), function(err, text) {
          if (err) throw err;

          // Concats multiple lines of text to single line with spaces
          text = text.replace(/\n/g, ' '); 
          questionText = text;
          console.log('Question: %s', text);

          completedAsyncCalls.question = true;
          // Call to completedOCR not required because google search must fall directly afterwards
          // and completedOCR will be called at the conclusion of google search results
          // completedOCR();

          google(text, function(err, res) {
            if (err) throw err;

            // Concats all Google Search results into single string able to be parsed
            res.links.shift();
            googleSearchResultText = res.links.map(obj => Object.values(obj).join(' ')).join(' ');
            console.log('Google Search results fetched successfully!');

            completedAsyncCalls.googleSearch = true;
            completedOCR();

          });

        });

      });

    // Answer One
    // Processed with JIMP
    // Text extracted with Tesseract OCR
    ansOne
      .crop(710, 400, 500, 100)
      .contrast(.42)
      .brightness(-.27)
      .write('ansOne.png', function() {

        tesseract.process(path.join(__dirname, 'ansOne.png'), function(err, text) {
          if (err) throw err;
          
          // Concats multiple lines of text to single line with spaces
          text = text.replace(/\n/g, ' '); 
          ansOneText = text;
          console.log('Answer One: %s', text);
          completedAsyncCalls.ansOne = true;
          completedOCR();

        });
      
      });

    // Answer Two
    // Processed with JIMP
    // Text extracted with Tesseract OCR
    ansTwo
      .crop(710, 500, 500, 100)
      .contrast(.42)
      .brightness(-.27)
      .write('ansTwo.png', function() {

        tesseract.process(path.join(__dirname, 'ansTwo.png'), function(err, text) {
          if (err) throw err;

          // Concats multiple lines of text to single line with spaces
          text = text.replace(/\n/g, ' ');
          ansTwoText = text;
          console.log('Answer Two: %s', text);
          completedAsyncCalls.ansTwo = true;
          completedOCR();

        });
      
      });

    // Answer Three
    // Processed with JIMP
    // Text extracted with Tesseract OCR
    ansThree
      .crop(710, 600, 500, 100)
      .contrast(.42)
      .brightness(-.27)
      .write('ansThree.png', function() {

        tesseract.process(path.join(__dirname, 'ansThree.png'), function(err, text) {
          if (err) throw err;
          
          // Concats multiple lines of text to single line with spaces
          text = text.replace(/\n/g, ' '); 
          ansThreeText = text;
          console.log('Answer Three: %s', text);
          completedAsyncCalls.ansThree = true;
          completedOCR();

        });
      
      });

  });

});

function completedOCR() {

  // Adds all values of completedAsyncCalls object
  // to be compared to length of object.
  // if length of object == added values then all async calls for OCR are complete
  var addedVals = Object.values(completedAsyncCalls).reduce((a, b) => a + b, 0);
  if(addedVals == Object.keys(completedAsyncCalls).length) {

    // Parses Google Search results for answers or parts of answers
    var answers = [
      {
        text: ansOneText.trim().split(' '),
        score: 0
      },
      {
        text: ansTwoText.trim().split(' '),
        score: 0
      },
      {
        text: ansThreeText.trim().split(' '),
        score: 0
      }
    ];
    var results = queryFrequencyScorer(googleSearchResultText, answers);
    
    // Sorts answers in order of score greatest to least
    results.sort((a, b) => b.score - a.score);
    
    // Displays the ordered answers with answer text and score
    // Format:
    // ${answerText} - score: ${score}
    console.log('\n===========\n  Answers\n===========');
    results.forEach((ans) => console.log('%s - score: %s', ans.text.join(' '), ans.score));

  }

}

function queryFrequencyScorer(results, query) {

  for(var i in query) {
    for(var j in query[i].text) {
      var occurrences = results.match(new RegExp(query[i].text[j], 'g'));
      if(occurrences) {
        // Adds number of occurences of each word to the score of the corresponding answer
        query[i].score += occurrences.length;
      }
    }
  }
  
  return query;

}