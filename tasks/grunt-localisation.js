/*
 * Grunt-localisation
 * https://github.com/oilart/grunt-localisation.git
 *
 * Copyright (c) 2014 Alex Khrapko
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var textReplace = require('grunt-text-replace/lib/grunt-text-replace');

module.exports = function(grunt) {
  // Please take a look at Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks
  grunt.registerMultiTask('localisation', 'A grunt for source files localisation', function() {
    var dest = this.files[0].dest;
    var LOCALE_PATH = /\{locale\}/;

    var localesFolder = this.options().locales;
    var pattern = this.options().pattern;

    var files = this.files;

    var localizedStrings = {};
    var locales = {};

    var currentLocaleCode;

    function readLocalisationData(){
      // Reading localisation data from JSON files
      grunt.file.recurse(localesFolder, function(path){
        var localeConfig = grunt.file.readJSON(path);
        // Checking whether locale data is not duplicated
        if(locales[localeConfig.locale]!==undefined){
          grunt.log.error('Locale "' + localeConfig.locale + '" is presended in multiple files.');
        }

        // Storing localisation data
        locales[localeConfig.locale] = localeConfig.data;
      });
    }

    function processLocale(localeCode){
      currentLocaleCode = localeCode;

      var localeReplacements = getLocaleReplacements(localeCode);

      if(localeReplacements.length === 0){
        grunt.log.warn('Locale "' + localeCode + '" doesnt have any localisation data.');
        return;
      }

      // Iterate over all specified file groups.
      files.forEach(function(f) {
        f.src.forEach(function(filepath) {

          var dirName = path.dirname(filepath);
          var fileDest = dirName!=='.'?getDestinationPath(dest, localeCode) + dirName:getDestinationPath(dest, localeCode);

          var settings = {
            src: [filepath],
            dest: fileDest + '/',

            replacements: localeReplacements
          };

          textReplace.replace(settings);
        });
      });

      grunt.log.writeln('Files are localized for "' + localeCode.cyan + '" language.');
    }

    function getDestinationPath(path, localeCode){
      if(LOCALE_PATH.test(path)){
        return path.replace(LOCALE_PATH, localeCode);
      }

      return path;
    }

    // Getting replacement string for specific locale
    function getLocaleReplacements(localeCode){
      var replacements = [];
      var localeData = locales[localeCode];
      for(var key in localeData){
        replacements.push({
          from: pattern,
          to: replaceMatch
        });
      }

      return replacements;
    }

    function replaceMatch(matchedWord, index, fullText, regexMatches){
      if(regexMatches.length === 1){
        // Match is found, searching for appropriate replacementю
        // TODO: check multiple matches
        var localizedValue = locales[currentLocaleCode][regexMatches[0]];

        if(localizedValue){
          return localizedValue;
        }

        grunt.log.warn('String "' + regexMatches[0] + '" doesnt exist for locale: "' + currentLocaleCode.cyan);
      }
    }

    readLocalisationData();

    // Iterating over all locales
    for(var localeCode in locales){
      processLocale(localeCode);
    }
  });
};
