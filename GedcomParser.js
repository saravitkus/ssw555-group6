/*
Group6 - Alex Sabella, Dillon Uzar, Sara Vitkus
SSW 555 - Agile Methods for Software Development
GEDCOM Parser
*/
"use strict";

// Imports:
const fs = require('fs'); // File system
const util = require('util');
const moment = require('moment');
require('console.table'); // Adds console.table()

// Setup console.debug:
(() => {
    let logFile = fs.createWriteStream('results.txt', { flags: 'w' });
    let logStdout = process.stdout;
    console.debug = console.log; // debug doesn't log to file!
    console.log = function() {
        // Logs to the file as well:
        logFile.write(util.format.apply(null, arguments).replace(/([^\r])\n/gm, "$1\r\n") + '\r\n');
        //logStdout.write(util.format.apply(null, arguments) + '\r\n');
        console.debug.apply(console, arguments);
    };
})();

// Set default toString for Date to be of local date format:
Date.prototype.toString = Date.prototype.toLocaleDateString;
moment.fn.toString = function() { return this.format("L"); };

// Current Date Object
const NOW = moment();

// List of tags with level 0 that are formatted like the rest of tags
const ZEROTAGS = new Set(["HEAD", "TRLR", "NOTE"]);

// List of tags with dates on the sequential line
const DATETAGS = new Set(["BIRT", "DEAT", "MARR", "DIV"]);

// Dictionary lookup for tags and their meanings
const VALIDTAGDICTS = {
    "0": {
        "INDI": "Individual record",
        "FAM": "Family record",
        "HEAD": "Header record at beginning of file",
        "TRLR": "Trailer record at end of file",
        "NOTE": "Comments, may be used to describe tests"
    },
    "1": {
        "NAME": "Name of individual",
        "SEX": "Sex of individual",
        "BIRT": "Birth date of individual",
        "DEAT": "Date of death of individual",
        "FAMC": "Family where individual is a child",
        "FAMS": "Family where individual is a spouse",
        "MARR": "Marriage event for family",
        "HUSB": "Husband in family",
        "WIFE": "Wife in family",
        "CHIL": "Child in family",
        "DIV": "Divorce event in family",
    },
    "2": {
        "DATE": "Date that an event occured",
    }
};

// Dictionaty of entities
let entityDict = {
    "INDI": {},
    "FAM": {}
};

/*
Input: str: string
Return: string
Description: Removes whitespace from beginning and end of string
*/
function trimSpace(str) {
    return str.replace(/^\s+|\s+$/g, "");
}

/*
Input: date: string
Return: Date object
Description: Converts the date string to a date object that can be compared to other date objects
*/
function formatDate(date) {
    return moment(date, "DD MMM YYYY");
}

/*
Input: firstDate, secondDate: string
Return: Integer
Description: Returns the number of years between two Date objects
*/
function getDiffInYears(firstDate, secondDate) {
    return secondDate.diff(firstDate, 'years');
}

/*
Input: firstDate, secondDate: string
Return: Integer
Description: Returns the number of days between two Date objects
*/
function getDiffInDays(firstDate, secondDate) {
    return secondDate.diff(firstDate, 'days');
}

/*
Input: date: string
Return: Integer
Description: Returns the number of days between two Date objects, excluding the year
*/
function getDaysUntilDate(date) {
    let dateClone = date.clone();
    dateClone.year(NOW.year());
    if (dateClone < NOW) dateClone.year(dateClone.year() + 1);
    return dateClone.diff(NOW, 'days');
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
function printEntities() {
    // TODO: console.table() will print a table
    console.log("");

    // Print out individuals in a table, sorted by order in GEDCOM, and remove '_LINE' fields:
    console.table("Individuals:", Object.keys(entityDict.INDI).map((key) => {
        const entity = entityDict.INDI[key];
        let clone = {};
        for (const field in entity) {
            if (!field.endsWith("_LINE")) clone[field] = entity[field];
        }
        return clone;
    }).sort((a, b) => {
        return (entityDict.INDI[a.ID].ID_LINE < entityDict.INDI[b.ID].ID_LINE ? -1 : 1);
    }));

    // Print out families in a table, sorted by order in GEDCOM, and remove '_LINE' fields:
    console.table("Families:", Object.keys(entityDict.FAM).map((key) => {
        const entity = entityDict.FAM[key];
        let clone = {};
        for (const field in entity) {
            if (!field.endsWith("_LINE")) clone[field] = entity[field];
        }
        return clone;
    }).sort((a, b) => {
        return (entityDict.FAM[a.ID].ID_LINE < entityDict.FAM[b.ID].ID_LINE ? -1 : 1);
    }));
}

/*
Input: lines: array of strings
Return: none
Description: Parse the lines one-by-one and find desired data. Then write to oFile.
*/
function ParseGedcomData(lines) {
    console.debug("Parsing Gedcom Data...");
    // TODO: Generate a new dictionary every time this function is called. Don't reuse the same dictionary.
    // TODO: Convert this parsing code to be a class.

    let line = "";
    let level = "";
    let tag = "";
    let tagMeaning = "";
    let fileLength = lines.length;
    let currentEntity = null;

    for (let lineIndex = 0; lineIndex < fileLength; ++lineIndex) {
        // Trim line:
        line = trimSpace(lines[lineIndex]);
        if (line === "") continue;

        // Find level:
        level = getLevel(line);
        if (level === "") continue;
        if (level === "0") currentEntity = null;

        // Find tag and meaning:
        tag = getTag(line, level);
        if (!isTagValid(tag, level)) continue;
        tagMeaning = getTagMeaning(tag, level);

        if (tag in entityDict) {
            const id = getID(line);
            currentEntity = entityDict[tag][id] = { ID: id };
            currentEntity.ID_LINE = lineIndex + 1;
        } else if (currentEntity) {
            if (tag === "CHIL") {
                if (!currentEntity.CHIL) {
                    currentEntity.CHIL = [];
                    currentEntity.CHIL_LINE = {};
                }
                const childID = getData(line, level, tag);
                currentEntity.CHIL.push(childID);
                currentEntity.CHIL_LINE[childID] = lineIndex + 1;
            } else if (DATETAGS.has(tag)) {
                const nextLine = trimSpace(lines[++lineIndex]);
                const nextLevel = (Number(level) + 1).toString();
                const nextTag = getTag(nextLine, nextLevel);
                currentEntity[tag] = formatDate(getData(nextLine, nextLevel, nextTag));
                currentEntity[tag + "_LINE"] = lineIndex + 1;
            } else {
                currentEntity[tag] = getData(line, level, tag);
                currentEntity[tag + "_LINE"] = lineIndex + 1;
            }
        }
    }
}

//////////////////////////////////////////////////////

// Additional Parsing Steps
//////////////////////////////////////////////////////

/*
Input: none
Return: none
Description: Calculates ages for all individuals and adds it to an "AGE" field
*/
function parseAges() {
    console.debug("US27: Parsing Individual Ages");
    for (const individualID in entityDict.INDI) {
        const individual = entityDict.INDI[individualID];
        individual.AGE = getDiffInYears(individual.BIRT, individual.DEAT || NOW);
    }
}

/*
Input: none
Return: none
Description: Sorts siblings so that oldest children appear first in family list
*/
function sortSiblings() {
    console.debug("US28: Sorting Siblings by Age");
    for (const familyID in entityDict.FAM) {
        /* jshint loopfunc:true */
        let sortedSiblings = entityDict.FAM[familyID].CHIL || [];
        sortedSiblings.sort((a, b) => {
            return entityDict.INDI[a].BIRT.diff(entityDict.INDI[b].BIRT);
        });
    }
}

//////////////////////////////////////////////////////

// Validity Checks
//////////////////////////////////////////////////////

/*
Input: none
Return: integer
Description: Checks all individuals for an age greater than 150 years old. Returns a count of the frequency of this occurence
*/
function lessThan150Years() {
    console.debug("Checking for individuals over the age of 150 years old...");
    console.log("US07: Less Than 150 Years Old");
    let errorCnt = 0;
    for (const individualID in entityDict.INDI) {
        const individual = entityDict.INDI[individualID];
        if (individual.AGE >= 150) {
            console.log("Line " + individual.BIRT_LINE + (individual.DEAT ? "&" + individual.DEAT_LINE : "") + ": " + individualID + " is over 150 years old!");
            ++errorCnt;
        }
    }
    return errorCnt;
}

/*
Input: none
Return: integer
Description: Checks all dates on individuals and families to make sure they are not newer than NOW. Returns a count of the frequency of this occurence
*/
function checkDatesAfterNOW() {
    console.debug("Checking for dates after NOW...");
    console.log("US01: Dates Before Current Date");
    let errorCnt = 0;

    // Check each individual:
    for (const individualID in entityDict.INDI) {
        const individual = entityDict.INDI[individualID];
        for (const tag of DATETAGS) {
            // Check if this tag on the entity is greater than NOW:
            if (individual[tag] && individual[tag] > NOW) {
                console.log("Line " + individual[tag + "_LINE"] + ": " + individualID + " " + tag + " is after NOW!");
                ++errorCnt;
            }
        }
    }

    // Check each family:
    for (const familyID in entityDict.FAM) {
        const family = entityDict.FAM[familyID];
        for (const tag of DATETAGS) {
            // Check if this tag on the entity is greater than NOW:
            if (family[tag] && family[tag] > NOW) {
                console.log("Line " + family[tag + "_LINE"] + ": " + familyID + " " + tag + " is after NOW!");
                ++errorCnt;
            }
        }
    }

    return errorCnt;
}

/*
Input: none
Return: integer
Description: Checks all families a verifies each spouse's role matches their gender. Returns a count of the frequency of this occurence
*/
function checkGenderAndRole() {
    console.debug("Checking for genders that don't match their spousal role...");
    console.log("US21: Correct Gender for Role");
    let errorCnt = 0;

    // Check each family:
    for (const familyID in entityDict.FAM) {
        const family = entityDict.FAM[familyID];
        // Check to make sure HUSB is of gender 'M':
        if (family.HUSB) {
            const HUSB = entityDict.INDI[family.HUSB];
            if (HUSB && HUSB.SEX !== "M") {
                console.log("Line " + family.HUSB_LINE + ": " + familyID + " HUSB is not of gender 'M'!");
                ++errorCnt;
            }
        }
        // Check to make sure WIFE is of gender 'F':
        if (family.WIFE) {
            const WIFE = entityDict.INDI[family.WIFE];
            if (WIFE && WIFE.SEX !== "F") {
                console.log("Line " + family.WIFE_LINE + ": " + familyID + " WIFE is not of gender 'F'!");
                ++errorCnt;
            }
        }
    }

    return errorCnt;
}

/*
Input: none
Return: integer
Description: Checks all families and verifies that no one got married before they were 12 years old
*/
function checkMarriageBefore14() {
    console.debug("Checking for husbands and/or wives that were younger than 14 when they got married...");
    console.log("US10: Marriage after 14");
    let errorCnt = 0;
    for (const familyID in entityDict.FAM) {
        const family = entityDict.FAM[familyID];
        const marriageDate = entityDict.FAM[familyID].MARR;
        if (!marriageDate) continue;
        if (getDiffInYears(entityDict.INDI[family.HUSB].BIRT, marriageDate) < 14) {
            let lines = [family.MARR_LINE, entityDict.INDI[family.HUSB].BIRT_LINE].sort().join("&");
            console.log("Line " + lines + ": " + familyID + " HUSB was not at least 14 when he got married!");
            ++errorCnt;
        }
        if (getDiffInYears(entityDict.INDI[family.WIFE].BIRT, marriageDate) < 14) {
            let lines = [family.MARR_LINE, entityDict.INDI[family.WIFE].BIRT_LINE].sort().join("&");
            console.log("Line " + lines + ": " + familyID + " WIFE was not at least 14 when he got married!");
            ++errorCnt;
        }
    }

    return errorCnt;
}

/*
Input: none
Return: integer
Description: Checks all dates on individuals and families to make sure they are invalid. Returns a count of the frequency of this occurence
*/
function checkInvalidDates() {
    console.debug("Checking for invalid dates...");
    console.log("US42: Reject Illegitimate Dates");
    let errorCnt = 0;

    // Check each individual:
    for (const individualID in entityDict.INDI) {
        const individual = entityDict.INDI[individualID];
        for (const tag of DATETAGS) {
            // Check if this tag on the entity is invalid:
            if (individual[tag] && !individual[tag].isValid()) {
                console.log("Line " + individual[tag + "_LINE"] + ": " + individualID + " " + tag + " is invalid!");
                ++errorCnt;
            }
        }
    }

    // Check each family:
    for (const familyID in entityDict.FAM) {
        const family = entityDict.FAM[familyID];
        for (const tag of DATETAGS) {
            // Check if this tag on the entity is invalid:
            if (family[tag] && !family[tag].isValid()) {
                console.log("Line " + family[tag + "_LINE"] + ": " + familyID + " " + tag + " is invalid!");
                ++errorCnt;
            }
        }
    }

    return errorCnt;
}

//////////////////////////////////////////////////////

// Lists Generated
//////////////////////////////////////////////////////

/*
Input: none
Return: none
Description: Outputs age of each individual to file
*/
function listAges() {
    console.log("US27: List Individual Ages");
    for (const individualID in entityDict.INDI) {
        console.log(individualID + ": " + entityDict.INDI[individualID].AGE);
    }
}

/*
Input: none
Return: none
Description: Outputs all deceased family members to the file
*/
function listDeceased() {
    console.log("US29: List Deceased");
    for (const individualID in entityDict.INDI) {
        if (entityDict.INDI[individualID].DEAT !== undefined) {
            console.log(individualID);
        }
    }
}

/*
Input: none
Return: none
Description: Outputs all family members born in the last 30 days to the file
*/
function listRecentBirths() {
    console.log("US35: List Recent Births");
    for (const individualID in entityDict.INDI) {
        let birthAgeDays = getDiffInDays(entityDict.INDI[individualID].BIRT, NOW);
        if (birthAgeDays < 30) {
            console.log(individualID);
        }
    }
}

/*
Input: none
Return: none
Description: Outputs all family members who died in the last 30 days to the file
*/
function listRecentDeaths() {
    console.log("US36: List Recent Deaths");
    for (const individualID in entityDict.INDI) {
        const individual = entityDict.INDI[individualID];
        if (individual.DEAT !== undefined) {
            let daysSinceDeath = getDiffInDays(individual.DEAT, NOW);
            if (daysSinceDeath < 30) {
                console.log(individualID);
            }
        }
    }
}

/*
Input: none
Return: none
Description: Outputs all family members who have a birthday in the next 30 days to the file
*/
function listUpcomingBirthdays() {
    console.log("US38: List Upcoming Birthdays");
    for (const individualID in entityDict.INDI) {
        const individual = entityDict.INDI[individualID];
        if (individual.DEAT === undefined) {
            let daysUntilBday = getDaysUntilDate(individual.BIRT);
            if (daysUntilBday < 30 && daysUntilBday > 0) {
                console.log(individualID + ": " + individual.BIRT.toString());
            }
        }
    }
}

/*
Input: none
Return: none
Description: Outputs all family children sorted by age
*/
function listChildrenSortedAge() {
    console.log("US28: Order Siblings by Age");
    for (const familyID in entityDict.FAM) {
        const family = entityDict.FAM[familyID];
        if (!family.CHIL) continue;
        console.log(familyID + ": " + family.CHIL);
    }
}


//////////////////////////////////////////////////////

/*
Input: iFileName: string
Return: Success: true
        Failure: false
Description: Loads iFileName into lines by splitting at newline and sets up parsing and error checks
*/
function ParseGedcomFile(iFileName) {
    console.debug("Parsing Gedcom File...");
    let lines;
    try {
        lines = fs.readFileSync(iFileName, { encoding: 'utf8' }).split(/\r?\n/); // Make an array of lines to pull data from
    } catch (e) {
        console.debug("Error opening file! Make sure file exists and file name is correct");
        return false;
    }

    ParseGedcomData(lines);

    // Additional parsing steps:
    console.debug("Additional Parsing:");
    parseAges();
    sortSiblings();

    printEntities();

    console.log("Lists:");
    console.log("");
    // Lists Generated
    listAges();
    console.log("");
    listDeceased();
    console.log("");
    listRecentBirths();
    console.log("");
    listRecentDeaths();
    console.log("");
    listUpcomingBirthdays();
    console.log("");
    listChildrenSortedAge();
    //

    console.log("");
    console.log("");
    console.log("Errors:");
    console.log("");

    // Validity Checks
    let errorCnt = 0;
    errorCnt += checkInvalidDates();
    console.log("");
    errorCnt += lessThan150Years();
    console.log("");
    errorCnt += checkDatesAfterNOW();
    console.log("");
    errorCnt += checkGenderAndRole();
    console.log("");
    errorCnt += checkMarriageBefore14();
    //

    console.log("");
    console.log("There were " + errorCnt + " errors in this Gedcom file!");
    if (errorCnt > 0) console.log("Check above for details on these errors!");

    return (errorCnt === 0);
}

// Main function to set up file to be parsed and where to put the data
const success = ParseGedcomFile("GEDCOM.txt");
if (success) console.debug("All done!");