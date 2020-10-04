const {
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate,
  isValidSubrecipient,
  matchesFilePart,
  validateFields,
  validateDocuments
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
    }
  };
  const testCases = [
    ["blank string", isNotBlank(""), false],
    ["non blank string", isNotBlank("Test"), true],
    ["number", isNumber(1), true],
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
    ]
  ];
  testCases.forEach(([name, b, expectedResult]) => {
    it(`${name} should return ${expectedResult}`, () => {
      expect(b).to.equal(expectedResult);
    });
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
    expect(r[1].info.message).to.equal('Description is required ""');
    expect(r[1].info.tab).to.equal("Test");
    expect(r[1].info.row).to.equal(5);
  });
});

describe("validateDocuments", () => {
  const documents = [
    { content: { name: "George" }},
    { content: { name: "John" }},
    { content: { name: "Thomas" }},
    { content: { name: "James" }},
    { content: { name: "" }}
  ];
  const requiredFields = [
    ["name", isNotBlank ]
  ];
  it('can validate a collection of documents', () => {
    const log = validateDocuments(documents, "test", requiredFields, {});
    expect(log).to.have.length(1);
  });
});
