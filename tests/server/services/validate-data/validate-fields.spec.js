const {
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate,
  validateFields
} = requireSrc(__filename);
const expect = require("chai").expect;

describe("validation helpers", () => {
  const testCases = [
    [isNotBlank(""), false],
    [isNotBlank("Test"), true],
    [isNumber(1), true],
    [isNumber("Test"), false],
    [isPositiveNumber(100), true],
    [isPositiveNumber(-100), false],
    [isValidDate("2020-10-03"), true],
    [isValidDate("2020-15-99"), false]
  ];
  testCases.forEach(([b, expectedResult]) => {
    it(`should return ${expectedResult}`, () => {
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
