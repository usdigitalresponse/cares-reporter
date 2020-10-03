const { 
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isValidDate
} = requireSrc(__filename);
const expect = require("chai").expect;

describe("validation helpers", () => {
  const testCases = [
    [ isNotBlank(""), false ],
    [ isNotBlank("Test"), true ],
    [ isNumber(1), true ],
    [ isNumber("Test"), false ],
    [ isPositiveNumber(100), true ],
    [ isPositiveNumber(-100), false ],
    [ isValidDate("2020-10-03"), true ],
    [ isValidDate("2020-15-99"), false ],
  ]
  testCases.forEach(([b, expectedResult]) => {
    it(`should return ${expectedResult}`, () => {
      expect(b).to.equal(expectedResult);
    })
  });
});
