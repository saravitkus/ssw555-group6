/*
Alex Sabella
SSW 555 - Agile Methods for Software Development
Project 2 - Gedcom Parser
*/

"use strict";

//import node.js file system
var fs = require('fs');

// List of tags with level 0 that are formatted like the rest of tags 
var ZeroTags = ["head", "trlr", "note"];

// Dictionary lookup for tags and their meanings
var ValidTagDict = { "indi":    "Individual record",
                "name":     "Name of individual",
                "sex":      "Sex of individaul",
                "birt":     "Birth date of individual",
                "deat":     "Date of death of individual", 
                "famc":     "Family where individual is a child",
                "fams":     "Family where individual is a spouse",
                "fam":      "Family record",
                "marr":     "Marriage event for family",
                "husb":     "Husband in family",
                "wife":     "Wife in family",
                "chil":     "Child in family",
                "div":      "Divorce event in family",
                "date":     "Date that an event occured",
                "head":     "Header record at beginning of file",
                "trlr":     "Trailer record at end of file",
                "note":     "Comments, may be used to describe tests"
};

/*
Input: str: string
Return: string
Description: Removes whitespace from beginning and end of string
*/
function trimSpace(str) {
    return str.replace(/^\s+|\s+$/g,"");
}

/*
Input: oFileName: string, data: string
Return: none
Description: Appends data to oFileName
*/
function writeToFile(oFileName, data) {
    fs.appendFileSync(oFileName, data);
    console.log(data.slice(0, -2) + " > " + oFileName); // Remove newline for outputting to console
};

/*
Input: line: string
Return: Success: level as a string
        Failure: blank string
Description: Parses line to find the level
*/
function getLevel(line){
    var reLevel = /^(\d+)/;
    var level = reLevel.exec(line);
    if (!level) return "";
    return level[1];
}

/*
Input: line: string, level: string
Return: Success: tag as a string
        Failure: blank string
Description: Parses line to find the tag
*/
function getTag(line, level){
    var tags = line.split(" ");
    var tagLength = tags.length;
    var tag = "";
    if (tagLength < 2) return "";
    if (level === "0" && !(ZeroTags.includes(tags[1].toLowerCase()))){ // Check if it is an exception tag
        if (tagLength < 3) return "";
        tag = tags[2];
    } else {
        tag = tags[1];
    }
    return tag;
}

/*
Input: tag: string, level: string
Return: True if tag is valid
        False if tag is not valid
Description: Checks if the tag is valid, given the level
*/
function isTagValid(tag, level){
    if (tag === "") return false;
    if (level === "1" && tag === "date") return false; // Check for data in level 1
    if (tag in ValidTagDict) return true;
    return false;
}

/*
Input: tag: string
Return: Success: tag meaning as a string
        Failure: blank string
Description: Does a dictionary lookup for the tag to find its meaning
*/
function getTagMeaning(tag){
    if (!(tag in ValidTagDict)) return "";
    return ValidTagDict[tag];
}

/*
Input: oFileName: string, lines: array of strings
Return: none
Description: Parse the lines one-by-one and find desired data. Then write to oFile.
*/
function ParseGedcomData(oFileName, lines){
    console.log("Parsing Gedcom Data...");
    
    fs.writeFileSync(oFileName, ""); // If the result file already exists, erase all data in it

    var line = "";
    var level = "";
    var tag = "";
    var tagMeaning = "";
    var fLength = lines.length;
    for (var index = 0; index < fLength; ++index){
        
        // Write whole line
        line = trimSpace(lines[index]);
        if (line === "") continue;
        writeToFile(oFileName, "Line: " + line + "\r\n");
        
        // Find and write level
        level = getLevel(line);
        if (level === ""){
            writeToFile(oFileName, "Level: CANNOT FIND LEVEL\r\n");
        } writeToFile(oFileName, "Level: " + level + "\r\n");
    
        // Find and write tag and meaning
        tag = getTag(line, level);
        if (isTagValid(tag.toLowerCase(), level)){
            tagMeaning = getTagMeaning(tag.toLowerCase());
            writeToFile(oFileName, "Tag: " + tag + ", Tag Meaning: " + tagMeaning + "\r\n");
        } else writeToFile(oFileName, "Tag: Invalid tag\r\n");

        writeToFile(oFileName,"\r\n"); // Newline to separate each line's data
    }
}

/*
Input: iFileName: string, oFileName: string
Return: Success: true
        Failure: false
Description: Loads iFileName into lines by splitting at newline and sets up parsing to write to oFileName
*/
function ParseGedcomFile(iFileName, oFileName) {
    console.log("Parsing Gedcom File...");

    var lines = [];
    try {
        var data = fs.readFileSync(iFileName, {encoding:'utf8'});
    }
    catch(e){
        console.log("Error opening file! Make sure file exists and file name is correct");
        return false;
    }
    lines = data.split("\n"); //make an array of lines to pull data from
    ParseGedcomData(oFileName, lines);
    return true;
}

// Main function to set up file to be parsed and where to put the data
var iFileName = "Alex Sabella - Project 2.ged";
var oFileName = "results.txt";
var success = ParseGedcomFile(iFileName, oFileName);
if (success) console.log("All done!");