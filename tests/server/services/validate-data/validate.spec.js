const {
  dateIsInPeriodOfPerformance,
  dateIsInReportingPeriod,
  isNotBlank,
  isNumber,
  isNumberOrBlank,
  isPositiveNumber,
  isSum,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  matchesFilePart,
  messageValue,
  numberIsLessThanOrEqual,
  numberIsGreaterThanOrEqual,
  validateFields,
  validateDocuments,
  whenBlank,
  whenGreaterThanZero
} = requireSrc(__filename);
const expect = require("chai").expect;

describe("validation helpers", () => {
  const validateContext = {
    fileParts: {
      projectId: "DOH"
    },
    subrecipientsHash: {
      "1010": {
        name: "Payee"
      }
    },
    reportingPeriod: {
      startDate: "2020-03-01",
      endDate: "2020-12-30",
      periodOfPerformanceEndDate: "2020-12-30"
    }
  };
  const testCases = [
    ["blank string", isNotBlank(""), false],
    ["non blank string", isNotBlank("Test"), true],
    ["number", isNumber(1), true],
    ["number", isNumber(""), false],
    ["numberOrBlank", isNumberOrBlank(1), true],
    ["numberOrBlank", isNumberOrBlank(""), true],
    ["non number", isNumber("Test"), false],
    ["positive number", isPositiveNumber(100), true],
    ["non positive number", isPositiveNumber(-100), false],
    ["valid date", isValidDate("2020-10-03"), true],
    ["invalid date", isValidDate("2020-15-99"), false],
    [
      "file part matches",
      matchesFilePart("projectId")("DOH", {}, validateContext),
      true
    ],
    [
      "file part does not match",
      matchesFilePart("projectId")("OMB", {}, validateContext),
      false
    ],
    [
      "valid subrecipient",
      isValidSubrecipient("1010", {}, validateContext),
      true
    ],
    [
      "invalid subrecipient",
      isValidSubrecipient("1020", {}, validateContext),
      false
    ],
    [
      "sum is correct",
      isSum(["amount1", "amount2"])(
        100.0,
        { amount1: 40.0, amount2: 60.0 },
        validateContext
      ),
      true
    ],
    [
      "sum is not correct",
      isSum(["amount1", "amount2"])(
        90.0,
        { amount1: 40.0, amount2: 60.0 },
        validateContext
      ),
      false
    ],
    [
      "sum convert strings to float",
      isSum(["amount1", "amount2"])(
        "100.0",
        { amount1: "40.0", amount2: "60.0" },
        validateContext
      ),
      true
    ],
    [
      "number is less than or equal",
      numberIsLessThanOrEqual("total")(100, { total: 200 }, validateContext),
      true
    ],
    [
      "number is not less than or equal",
      numberIsLessThanOrEqual("total")(500, { total: 200 }, validateContext),
      false
    ],
    [
      "number is greater than or equal",
      numberIsGreaterThanOrEqual("total")(
        1000,
        { total: 200 },
        validateContext
      ),
      true
    ],
    [
      "number is not greater than or equal",
      numberIsGreaterThanOrEqual("total")(50, { total: 200 }, validateContext),
      false
    ],
    [
      "date is in reporting period",
      dateIsInReportingPeriod(43929, {}, validateContext),
      true
    ],
    [
      "date is before reporting period",
      dateIsInReportingPeriod(43800, {}, validateContext),
      false
    ],
    [
      "date is after reporting period",
      dateIsInReportingPeriod(44197, {}, validateContext),
      false
    ],
    [
      "date is in period or performance",
      dateIsInPeriodOfPerformance(44166, {}, validateContext),
      true
    ],
    [
      "whenBlank conditional validation passes",
      whenBlank("duns number", isNotBlank)(
        "123",
        { "duns number": "" },
        validateContext
      ),
      true
    ],
    [
      "whenBlank conditional validation fails",
      whenBlank("duns number", isNotBlank)(
        "",
        { "duns number": "" },
        validateContext
      ),
      false
    ],
    [
      "whenBlank conditional validation ignored",
      whenBlank("duns number", isNotBlank)(
        "",
        { "duns number": "123" },
        validateContext
      ),
      true
    ],
    [
      "whenGreaterThanZero conditional validation passes",
      whenGreaterThanZero(
        "total expenditure amount",
        dateIsInPeriodOfPerformance
      )(44166, { "total expenditure amount": 1000.0 }, validateContext),
      true
    ],
    [
      "whenGreaterThanZero conditional validation fails",
      whenGreaterThanZero(
        "total expenditure amount",
        dateIsInPeriodOfPerformance
      )(45000, { "total expenditure amount": 1000.0 }, validateContext),
      false
    ],
    [
      "whenGreaterThanZero conditional validation ignored",
      whenGreaterThanZero(
        "total expenditure amount",
        dateIsInPeriodOfPerformance
      )(45000, { "total expenditure amount": "" }, validateContext),
      true
    ]
  ];
  testCases.forEach(([name, b, expectedResult]) => {
    it(`${name} should return ${expectedResult}`, () => {
      expect(b).to.equal(expectedResult);
    });
  });
});

describe("address validations", () => {
  const us1 = { "primary place of performance country name": "usa" };
  const us2 = { "primary place of performance country name": "united states" };
  const hk = { "primary place of performance country name": "hong kong" };
  it("valid US state passes", () => {
    expect(isValidState("WA", us1)).to.equal(true);
  });
  it("valid United States state passes", () => {
    expect(isValidState("WA", us2)).to.equal(true);
  });
  it("invalid US state fails", () => {
    expect(isValidState("ZZ", us1)).to.equal(false);
  });
  it("invalid united states state fails", () => {
    expect(isValidState("ZZ", us2)).to.equal(false);
  });
  it("valid US zip passes", () => {
    expect(isValidZip(98101, us1)).to.equal(true);
  });
  it("valid United States zip passes", () => {
    expect(isValidZip(98101, us2)).to.equal(true);
  });
  it("invalid US zip fails", () => {
    expect(isValidZip(5, us1)).to.equal(false);
  });
  it("invalid united states zip fails", () => {
    expect(isValidZip(6, us2)).to.equal(false);
  });
  it("non united states zip passes", () => {
    expect(isValidZip(0, hk)).to.equal(true);
  });
});

describe("validateFields", () => {
  const requiredFields = [
    ["name", isNotBlank],
    ["date", isValidDate],
    ["description", isNotBlank, "Description is required"]
  ];
  it("can validate a document", () => {
    const content = {
      name: "George",
      date: "2020-10-02",
      description: "testing"
    };
    const r = validateFields(requiredFields, content, "Test", 1);
    expect(r).to.have.length(0);
  });
  it("can report multiple errors, with custom message", () => {
    const content = { name: "", date: "2020-10-02" };
    const r = validateFields(requiredFields, content, "Test", 5);
    expect(r).to.have.length(2);
    expect(r[0].info.message).to.equal('Empty or invalid entry for name: ""');
    expect(r[0].info.tab).to.equal("Test");
    expect(r[0].info.row).to.equal(5);
    expect(r[1].info.message).to.equal("Description is required");
    expect(r[1].info.tab).to.equal("Test");
    expect(r[1].info.row).to.equal(5);
  });
});

describe("custom message", () => {
  it("can include the invalid value in the message", () => {
    const validations = [
      ["type", v => v == "FOO" || v == "BAR", 'Type "{}" is not valid']
    ];
    const content = { type: "BAZ" };
    const r = validateFields(validations, content, "Test", 5);
    expect(r).to.have.length(1);
    expect(r[0].info.message).to.equal('Type "BAZ" is not valid');
  });
});

describe("validateDocuments", () => {
  const documents = {
    test: [
      { content: { name: "George" } },
      { content: { name: "John" } },
      { content: { name: "Thomas" } },
      { content: { name: "James" } },
      { content: { name: "" } }
    ]
  };
  const validations = [["name", isNotBlank]];
  it("can validate a collection of documents", () => {
    const log = validateDocuments("test", validations)(documents, {});
    expect(log).to.have.length(1);
  });
});

describe("date conversion for messages", () => {
  it("can convert spreadsheet dates", () => {
    expect(messageValue(44195, { isDateValue: true })).to.equal("12/30/2020");
  });
  it("only converts valid dates", () => {
    expect(messageValue("Friday", { isDateValue: true })).to.equal("Friday");
  });
  it("only converts dates", () => {
    expect(messageValue(44195)).to.equal(44195);
  });
});
