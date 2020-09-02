const { validateFilename } = requireSrc(__filename);
const expect = require("chai").expect;

describe("lib/validate_upload", () => {
  describe("validateFilename", () => {
    const goodFilename = "EOH-013-06302020-v1.xlsx";
    const badFilenames = [
      ["wrong extension", "EOH-013-06302020-v1.csv"],
      ["missing version", "EOH-013-06302020.xlsx"],
      ["wrong date", "EOH-013-06312020-v1.xlsx"]
    ];
    it("passes a good filename", () => {
      const result = validateFilename(goodFilename);
      expect(result).to.be.empty;
    });
    badFilenames.forEach(([message, badFilename]) => {
      it(`${message} fails`, () => {
        const result = validateFilename(badFilename);
        expect(result[result.length - 1].info.message).to.match(
          /^Uploaded file name must match pattern/
        );
      });
    });
  });
});
