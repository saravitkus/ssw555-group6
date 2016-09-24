/*
Group6 - Alex Sabella, Dillon Uzar, Sara Vitkus
SSW 555 - Agile Methods for Software Development
GEDCOM Parser
*/

"use strict";

// Import node.js file system
const fs = require('fs');

// Current Date Object
const NOW = new Date();

// List of tags with level 0 that are formatted like the rest of tags
const ZEROTAGS = new Set(["HEAD", "TRLR", "NOTE"]);

// List of tags with dates on the sequential line
const DATETAGS = new Set(["BIRT", "DEAT", "MARR", "DIV"]);

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

// Dictionaty of entities
let entityDict = {
                    "INDI": {},
                    "FAM":  {}
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
}

/*
Input: date: string
Return: Date object
Description: Converts the date string to a date object that can be compared to other date objects
*/
function formatDate(date) {
    return new Date(date);
}

/*
Input: firstDate, secondDate: string
Return: Integer
Description: Returns the number of years between two Date objects
*/
function getDiffInYears(firstDate, secondDate) {
    let years = secondDate.getFullYear() - firstDate.getFullYear();
    firstDate.setFullYear(secondDate.getFullYear());
    if (firstDate > secondDate) --years;
    return years;
}

/*
Input: firstDate, secondDate: string
Return: Integer
Description: Returns the number of days between two Date objects
*/
function getDiffInDays(firstDate, secondDate) {
    let days = Math.round((secondDate - firstDate)/86400000); //1000*60*60*24;
    return days;
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
    return (tag in VALIDTAGDICTS[level]);
}

/*
Input: tag: string, level: string
Return: Success: tag meaning as a string
        Failure: blank string
Description: Does a dictionary lookup for the tag to find its meaning
*/
function getTagMeaning(tag, level) {
    return VALIDTAGDICTS[level][tag] || "";
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
    return entityDict.INDI[id][attr];
}

/*
Input: id: string, role: string, attr: string
Return: string
Description: Looks up an attribute from an individual, given the family id, the role, and the desired attribute
*/
function getFamilyAttr(id, role, attr) {
    return entityDict.INDI[entityDict.FAM[id][role]][attr];
}

/*
Input: none
Return: none
Description: Prints out all individuals and families
*/
function printEntities(oFileName) {
    writeToFile(oFileName, "Individuals:\r\n");
    for (let individualID in entityDict.INDI){
        writeToFile(oFileName, individualID + ": " + getIndividualAttr(individualID, "NAME") + "\r\n");
    }
    writeToFile(oFileName, "\r\n");
    writeToFile(oFileName, "Families:\r\n");
    for (let familyID in entityDict.FAM){
        writeToFile(oFileName, familyID +":\r\nHusband: " + getFamilyAttr(familyID, "HUSB", "NAME") + "\r\nWife: " + getFamilyAttr(familyID, "WIFE", "NAME") + "\r\n\r\n");
    }
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
    let currentEntity = null;
    

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
        if (level === "0") currentEntity = null;

        // Find and write tag and meaning
        tag = getTag(line, level);
        validTag = isTagValid(tag, level);
        if (validTag) {
            tagMeaning = getTagMeaning(tag, level);
            writeToFile(oFileName, "Tag: " + tag + ", Tag Meaning: " + tagMeaning + "\r\n");
        } else {
            writeToFile(oFileName, "Tag: Invalid tag\r\n\r\n");
            continue;
        }

        if(tag in entityDict) {
            currentEntity = entityDict[tag][getID(line)] = {};
        } else if(currentEntity) {
            if(DATETAGS.has(tag)) {
                const nextLine = trimSpace(lines[++lineIndex]);
                const nextLevel = (Number(level) + 1).toString();
                const nextTag = getTag(nextLine, nextLevel);
                currentEntity[tag] = formatDate(getData(nextLine, nextLevel, nextTag));
            } else {
                currentEntity[tag] = getData(line, level, tag);
            }
        }

        writeToFile(oFileName,"\r\n"); // Newline to separate each line's data
    }
}

// Validity Checks
//////////////////////////////////////////////////////

/*
Input: none
Return: none
Description: Calculates ages for all individuals and adds it to an "AGE" field
*/
function getAges(oFileName) {
    console.log("Calculating ages...")
    for (const individualID in entityDict.INDI) {
        const currentEntity = entityDict.INDI[individualID];
        currentEntity.AGE = getDiffInYears(currentEntity.BIRT, currentEntity.DEAT || NOW);
    }
    console.log("Done calculating ages!\r\n");
}

/*
Input: none
Return: integer
Description: Checks all individuals for an age greater than 150 years old. Returns a count of the frequency of this occurence
*/
function lessThan150Years(oFileName) {
    console.log("Checking for individuals over the age of 150 years old...");
    let errorCnt = 0;
    for (const individualID in entityDict.INDI) {
        const currentEntity = entityDict.INDI[individualID];
        if(currentEntity.AGE >= 150) {
            writeToFile(oFileName, individualID + ": Over 150 years old!");
            ++errorCnt;
        }
    }
    return errorCnt;
}

//////////////////////////////////////////////////////

/*
Input: iFileName: string, oFileName: string
Return: Success: true
        Failure: false
Description: Loads iFileName into lines by splitting at newline and sets up parsing to write to oFileName
*/
function ParseGedcomFile(iFileName, oFileName) {
    console.log("Parsing Gedcom File...");
    let errorCnt = 0;
    let data;
    try {
        data = fs.readFileSync(iFileName, {encoding:'utf8'});
    }
    catch(e) {
        console.log("Error opening file! Make sure file exists and file name is correct");
        return false;
    }
    const lines = data.split("\n"); //make an array of lines to pull data from
    ParseGedcomData(oFileName, lines);

    // Validity Checks
    getAges(oFileName);
    errorCnt += lessThan150Years(oFileName);
    //

    printEntities(oFileName);

    writeToFile(oFileName, "There were " + errorCnt + " errors in this Gedcom file!\r\n");
    if (errorCnt > 0) writeToFile(oFileName, "Check above for details on these errors!");

    return true;
}

// Main function to set up file to be parsed and where to put the data
const iFileName = "GEDCOM.txt";
const oFileName = "Results.txt";

const success = ParseGedcomFile(iFileName, oFileName);
if (success){
    console.log("All done!\r\n");
}