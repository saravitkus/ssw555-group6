const assert = require("chai").assert;
const moment = require('moment');
const gedcomParser = require("./GedcomParser");

describe("GEDCOM Parser", function () {
    describe("US04", function () {
        // Check errors and abnormal conditions:
        it("error on divorce before marriage", function () {
            assert.equal(gedcomParser.checkDivorceBeforeMarriage({
                FAM: {
                    "@F1@": {
                        MARR: gedcomParser.formatDate("16 MAR 1999"), MARR_LINE: 0,
                        DIV: gedcomParser.formatDate("12 MAR 1999"), DIV_LINE: 1
                    }
                }
            }), 1);
        });
        it("no error no marriage", function () {
            assert.equal(gedcomParser.checkDivorceBeforeMarriage({
                FAM: {
                    "@F1@": { DIV: gedcomParser.formatDate("16 MAR 1999"), DIV_LINE: 0 }
                }
            }), 0);
        });

        // Check normal conditions:
        it("no error on marriage before divorce", function () {
            assert.equal(gedcomParser.checkDivorceBeforeMarriage({
                FAM: {
                    "@F1@": {
                        MARR: gedcomParser.formatDate("10 MAR 1999"), MARR_LINE: 0,
                        DIV: gedcomParser.formatDate("12 MAR 1999"), DIV_LINE: 1
                    }
                }
            }), 0);
        });
        it("no error on no divorce", function () {
            assert.equal(gedcomParser.checkDivorceBeforeMarriage({
                FAM: {
                    "@F1@": { MARR: gedcomParser.formatDate("10 MAR 1999"), MARR_LINE: 0, }
                }
            }), 0);
        });
    });

    describe("US06", function () {
        // Check errors and abnormal conditions:
        it("error on one death before divorce", function () {
            assert.equal(gedcomParser.checkDeathBeforeDivorce({
                INDI: {
                    "@I1@": { DEAT: gedcomParser.formatDate("10 MAR 1999"), DEAT_LINE: 0 },
                    "@I2@": { }
                },
                FAM: {
                    "@F1@": {
                        HUSB: "@I1@", WIFE: "@I2@",
                        DIV: gedcomParser.formatDate("12 MAR 1999"), DIV_LINE: 1
                    }
                }
            }), 1);
        });
        it("errors on two deaths before divorce", function () {
            assert.equal(gedcomParser.checkDeathBeforeDivorce({
                INDI: {
                    "@I1@": { DEAT: gedcomParser.formatDate("10 MAR 1999"), DEAT_LINE: 0 },
                    "@I2@": { DEAT: gedcomParser.formatDate("11 MAR 1999"), DEAT_LINE: 1 }
                },
                FAM: {
                    "@F1@": {
                        HUSB: "@I1@", WIFE: "@I2@",
                        DIV: gedcomParser.formatDate("12 MAR 1999"), DIV_LINE: 2
                    }
                }
            }), 2);
        });
        it("no error on no death", function () {
            assert.equal(gedcomParser.checkDeathBeforeDivorce({
                INDI: {
                    "@I1@": { }, "@I2@": { }
                },
                FAM: {
                    "@F1@": {
                        HUSB: "@I1@", WIFE: "@I2@",
                        DIV: gedcomParser.formatDate("12 MAR 1999"), DIV_LINE: 2
                    }
                }
            }), 0);
        });
        it("no error on no divorce", function () {
            assert.equal(gedcomParser.checkDeathBeforeDivorce({
                INDI: {
                    "@I1@": { DEAT: gedcomParser.formatDate("10 MAR 1999"), DEAT_LINE: 0 },
                    "@I2@": { DEAT: gedcomParser.formatDate("11 MAR 1999"), DEAT_LINE: 1 }
                },
                FAM: {
                    "@F1@": { HUSB: "@I1@", WIFE: "@I2@" }
                }
            }), 0);
        });

        // Check normal conditions:
        it("no error on divorce before death", function () {
            assert.equal(gedcomParser.checkDeathBeforeDivorce({
                INDI: {
                    "@I1@": { DEAT: gedcomParser.formatDate("14 MAR 1999"), DEAT_LINE: 0 },
                    "@I2@": { DEAT: gedcomParser.formatDate("15 MAR 1999"), DEAT_LINE: 1 }
                },
                FAM: {
                    "@F1@": {
                        HUSB: "@I1@", WIFE: "@I2@",
                        DIV: gedcomParser.formatDate("12 MAR 1999"), DIV_LINE: 2
                    }
                }
            }), 0);
        });
    });

    describe("US22", function () {
        // Check errors and abnormal conditions:
        it("error on shared INDI ID", function () {
            assert.equal(gedcomParser.checkUniqueIDs({
                INDI: {
                    "@I1@": { ID: "@I1@", ID_ORIG: "@I1@", ID_LINE: 1 },
                    "@I1@1": { ID: "@I1@1", ID_ORIG: "@I1@", ID_LINE: 2 },
                },
                FAM: { }
            }), 1);
        });
        it("error on shared FAM ID", function () {
            assert.equal(gedcomParser.checkUniqueIDs({
                INDI: { },
                FAM: {
                    "@F1@": { ID: "@F1@", ID_ORIG: "@F1@", ID_LINE: 1 },
                    "@F1@1": { ID: "@F1@1", ID_ORIG: "@F1@", ID_LINE: 2 },
                }
            }), 1);
        });
        it("no error on shared FAM&INDI ID", function () {
            assert.equal(gedcomParser.checkUniqueIDs({
                INDI: {
                    "@1@": { ID: "@1@", ID_ORIG: "@1@", ID_LINE: 1 },
                },
                FAM: {
                    "@1@1": { ID: "@1@1", ID_ORIG: "@1@", ID_LINE: 2 },
                }
            }), 0);
        });

        // Check normal conditions:
        it("no error on unique IDs", function () {
            assert.equal(gedcomParser.checkUniqueIDs({
                INDI: {
                    "@I1@": { ID: "@I1@", ID_ORIG: "@I1@", ID_LINE: 1 },
                    "@I2@": { ID: "@I2@", ID_ORIG: "@I2@", ID_LINE: 2 },
                },
                FAM: {
                    "@F1@": { ID: "@F1@", ID_ORIG: "@F1@", ID_LINE: 3 },
                    "@F2@": { ID: "@F2@", ID_ORIG: "@F2@", ID_LINE: 4 },
                }
            }), 0);
        });
    });

    describe("US23", function () {
        // Check errors and abnormal conditions:
        it("error on shared NAME and BIRT", function () {
            assert.equal(gedcomParser.checkUniqueNameAndBirths({
                INDI: {
                    "@I1@": {
                        ID_LINE: 1,
                        NAME: "John Smith",
                        BIRT: gedcomParser.formatDate("16 MAR 1999")
                    },
                    "@I2@": {
                        ID_LINE: 2,
                        NAME: "John Smith",
                        BIRT: gedcomParser.formatDate("16 MAR 1999")
                    },
                },
                FAM: { }
            }), 1);
        });

        // Check normal conditions:
        it("no error on unique NAME, same BIRT", function () {
            assert.equal(gedcomParser.checkUniqueNameAndBirths({
                INDI: {
                    "@I1@": {
                        ID_LINE: 1,
                        NAME: "Joe Smith",
                        BIRT: gedcomParser.formatDate("16 MAR 1999")
                    },
                    "@I2@": {
                        ID_LINE: 2,
                        NAME: "John Smith",
                        BIRT: gedcomParser.formatDate("16 MAR 1999")
                    },
                },
                FAM: { }
            }), 0);
        });
        it("no error on unique BIRT, same NAME", function () {
            assert.equal(gedcomParser.checkUniqueNameAndBirths({
                INDI: {
                    "@I1@": {
                        ID_LINE: 1,
                        NAME: "John Smith",
                        BIRT: gedcomParser.formatDate("15 MAR 1999")
                    },
                    "@I2@": {
                        ID_LINE: 2,
                        NAME: "John Smith",
                        BIRT: gedcomParser.formatDate("16 MAR 1999")
                    },
                },
                FAM: { }
            }), 0);
        });
        it("no error on unique BIRT and NAME", function () {
            assert.equal(gedcomParser.checkUniqueNameAndBirths({
                INDI: {
                    "@I1@": {
                        ID_LINE: 1,
                        NAME: "Joe Smith",
                        BIRT: gedcomParser.formatDate("15 MAR 1999")
                    },
                    "@I2@": {
                        ID_LINE: 2,
                        NAME: "John Smith",
                        BIRT: gedcomParser.formatDate("16 MAR 1999")
                    },
                },
                FAM: { }
            }), 0);
        });
    });
});