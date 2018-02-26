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

var screenshot = require('screenshot-desktop');
var jimp = require('jimp');
var tesseract = require('node-tesseract');
var path = require('path');
var google = require('google'); google.resultsPerPage = 25;

// Screenshot of main monitor taken
screenshot().then(function(img) {

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
          console.log("Question: %s", text);

          google(text, function(err, res) {
            if (err) throw err;
            for(var i = 0; i < res.links.length; i++) {

              // Displays first 25 google results
              console.log('%s - %s\n\n%s\n\n', res.links[i].title, res.links[i].href, res.links[i].description);

            }
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
          console.log("Answer One: %s", text);
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
          console.log("Answer Two: %s", text);
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
          console.log("Answer Three: %s", text);
        });
      
      });

  });

});