/*
Group6 - Alex Sabella, Dillon Uzar, Sara Vitkus
SSW 555 - Agile Methods for Software Development
GEDCOM Parser
*/

"use strict";

// Import node.js file system
const fs = require('fs');

// List of tags with level 0 that are formatted like the rest of tags
const ZEROTAGS = new Set(["HEAD", "TRLR", "NOTE"]);

// Dictionary lookup for tags and their meanings
const VALIDTAGDICTS = { "0":   {
                                "INDI":     "Individual record",
                                "FAM":      "Family record",
                                "HEAD":     "Header record at beginning of file",
                                "TRLR":     "Trailer record at end of file",
                                "NOTE":     "Comments, may be used to describe tests"
                                },
                        "1":    {
                                "NAME":     "Name of individual",
                                "SEX":      "Sex of individaul",
                                "BIRT":     "Birth date of individual",
                                "DEAT":     "Date of death of individual",
                                "FAMC":     "Family where individual is a child",
                                "FAMS":     "Family where individual is a spouse",
                                "MARR":     "Marriage event for family",
                                "HUSB":     "Husband in family",
                                "WIFE":     "Wife in family",
                                "CHIL":     "Child in family",
                                "DIV":      "Divorce event in family",
                                },
                        "2":    {
                                "DATE":     "Date that an event occured",
                                }
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
function getLevel(line) {
    const reLevel = /^(\d+)/;
    const level = reLevel.exec(line);
    if (!level) return "";
    return level[1];
}

/*
Input: line: string, level: string
Return: Success: tag as a string
        Failure: blank string
Description: Parses line to find the tag
*/
function getTag(line, level) {
    const tags = line.split(" ");
    const tagLength = tags.length;
    let tag = "";
    if (tagLength < 2) return "";
    if (level === "0" && !(ZEROTAGS.has(tags[1].toUpperCase()))) { // Check if it is an exception tag
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
function isTagValid(tag, level) {
    if (tag === "") return false;
    if (tag.toUpperCase() in VALIDTAGDICTS[level]) return true;
    return false;
}

/*
Input: tag: string, level: string
Return: Success: tag meaning as a string
        Failure: blank string
Description: Does a dictionary lookup for the tag to find its meaning
*/
function getTagMeaning(tag, level) {
    if (!(tag.toUpperCase() in VALIDTAGDICTS[level])) return "";
    return VALIDTAGDICTS[level][tag.toUpperCase()];
}

/*
Input: oFileName: string, lines: array of strings
Return: none
Description: Parse the lines one-by-one and find desired data. Then write to oFile.
*/
function ParseGedcomData(oFileName, lines) {
    console.log("Parsing Gedcom Data...");

    fs.writeFileSync(oFileName, ""); // If the result file already exists, erase all data in it

    let level = "";
    let tag = "";
    let tagMeaning = "";
    for (let line of lines) {

        line = trimSpace(line);

        // Write whole line
        if (line === "") continue;
        writeToFile(oFileName, "Line: " + line + "\r\n");

        // Find and write level
        level = getLevel(line);
        if (level === "") {
            writeToFile(oFileName, "Level: CANNOT FIND LEVEL\r\n");
        } writeToFile(oFileName, "Level: " + level + "\r\n");

        // Find and write tag and meaning
        tag = getTag(line, level);
        if (isTagValid(tag.toUpperCase(), level)) {
            tagMeaning = getTagMeaning(tag.toUpperCase(), level);
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

    try {
        var data = fs.readFileSync(iFileName, {encoding:'utf8'});
    }
    catch(e) {
        console.log("Error opening file! Make sure file exists and file name is correct");
        return false;
    }
    const lines = data.split("\n"); //make an array of lines to pull data from
    ParseGedcomData(oFileName, lines);
    return true;
}

// Main function to set up file to be parsed and where to put the data
const iFileName = "GEDCOM.txt";
const oFileName = "Results.txt";
const success = ParseGedcomFile(iFileName, oFileName);
if (success) console.log("All done!");