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

// Dictionary of individuals
let individualDict = {};

// Dictionary of families
let familyDict = {};

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
Input: date: string
Return: Date object
Description: Converts the date string to a date object that can be compared to other date objects
*/
function formatDate(date) {
    return new Date(date);
}

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
    return tag.toUpperCase();
}

/*
Input: tag: string, level: string
Return: True if tag is valid
        False if tag is not valid
Description: Checks if the tag is valid, given the level
*/
function isTagValid(tag, level) {
    if (tag === "") return false;
    if (tag in VALIDTAGDICTS[level]) return true;
    return false;
}

/*
Input: tag: string, level: string
Return: Success: tag meaning as a string
        Failure: blank string
Description: Does a dictionary lookup for the tag to find its meaning
*/
function getTagMeaning(tag, level) {
    if (!(tag in VALIDTAGDICTS[level])) return "";
    return VALIDTAGDICTS[level][tag];
}

/*
Input: line: string
Return: string
Description: Gets ID from a line for INDI or FAM
*/
function getID(line) {
    const tags = line.split(" ");
    return tags[1];
}

/*
Input: line: string, level: string, tag: string
Return: string
Description: Gets data from a line
*/
function getData(line, level, tag) {
    let data = line.replace(level, "");
    data = data.replace(tag, "");
    data = trimSpace(data);
    return data;
}

/*
Input: id: string, attr: string
Return: string
Description: Looks up an attribute from an individual, given the individual id and the desired attribute
*/
function getIndividualAttr(id, attr) {
    return individualDict[id][attr];
}

/*
Input: id: string, role: string, attr: string
Return: string
Description: Looks up an attribute from an individual, given the family id, the role, and the desired attribute
*/
function getFamilyAttr(id, role, attr) {
    return individualDict[familyDict[id][role]][attr];
}

/*
Input: oFileName: string, lines: array of strings
Return: none
Description: Parse the lines one-by-one and find desired data. Then write to oFile.
*/
function ParseGedcomData(oFileName, lines) {
    console.log("Parsing Gedcom Data...");

    fs.writeFileSync(oFileName, ""); // If the result file already exists, erase all data in it

    let line = "";
    let level = "";
    let tag = "";
    let tagMeaning = "";
    let validTag = false;
    let fileLength = lines.length;
    let parsingIndividual = false;
    let parsingFamily = false;
    let currentIndividual = "";
    let currentFamily = "";
    

    for (let lineIndex = 0; lineIndex < fileLength; ++lineIndex) {

        line = trimSpace(lines[lineIndex]);

        // Write whole line
        if (line === "") continue;
        writeToFile(oFileName, "Line: " + line + "\r\n");

        // Find and write level
        level = getLevel(line);
        if (level === "") {
            writeToFile(oFileName, "Level: CANNOT FIND LEVEL\r\n");
        } writeToFile(oFileName, "Level: " + level + "\r\n");
        if (level === "0"){
            parsingIndividual = false;
            parsingFamily = false;
        }

        // Find and write tag and meaning
        tag = getTag(line, level);
        validTag = isTagValid(tag, level);
        if (validTag) {
            tagMeaning = getTagMeaning(tag, level);
            writeToFile(oFileName, "Tag: " + tag + ", Tag Meaning: " + tagMeaning + "\r\n");
        } else writeToFile(oFileName, "Tag: Invalid tag\r\n");

        if(tag === "INDI" && validTag){
            parsingIndividual = true;
            currentIndividual = getID(line);
            individualDict[currentIndividual] = {};
        }
        else if(tag === "FAM" && validTag){
            parsingFamily = true;
            currentFamily = getID(line);
            familyDict[currentFamily] = {};
        }
        else if(parsingIndividual && validTag){
            if(tag === "BIRT" || tag === "DEAT"){
                const nextLine = trimSpace(lines[++lineIndex]);
                const nextLevel = (Number(level) + 1).toString();
                const nextTag = getTag(nextLine, nextLevel);
                individualDict[currentIndividual][tag] = getData(nextLine, nextLevel, nextTag);
            } else{
                individualDict[currentIndividual][tag] = getData(line, level, tag);
            }
        }
        else if(parsingFamily && validTag){
            if(tag === "MARR" || tag === "DIV"){
                const nextLine = trimSpace(lines[++lineIndex]);
                const nextLevel = (Number(level) + 1).toString();;
                const nextTag = getTag(nextLine, nextLevel);
                familyDict[currentFamily][tag] = getData(nextLine, nextLevel, nextTag);
            } else{
                familyDict[currentFamily][tag] = getData(line, level, tag);
            }
        }

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
if (success){
    console.log("All done!\n");
    writeToFile(oFileName, "Individuals:\r\n");
    for (let individualID in individualDict){
        writeToFile(oFileName, individualID + ": " + getIndividualAttr(individualID, "NAME") + "\r\n");
    }
    writeToFile(oFileName, "\r\n");
    writeToFile(oFileName, "Families:\r\n");
    for (let familyID in familyDict){
        writeToFile(oFileName, familyID +":\r\nHusband: " + getFamilyAttr(familyID, "HUSB", "NAME") + "\r\nWife: " + getFamilyAttr(familyID, "WIFE", "NAME") + "\r\n");
    }
}