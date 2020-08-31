const { validateFilename } = requireSrc(__filename);
const expect = require("chai").expect;

describe("lib/validate_upload", () => {
  describe("validateFilename", () => {
    const goodFilename = "045-20200719-good-v3.xlsx";
    const badFilenames = [
      ["wrong extension", "045-20200719-bad-v3.csv"],
      ["missing version", "045-20200719-bad.xlsx"],
      ["bad date", "045-2020719-bad-v3.xlsx"]
    ];
    it("passes a good filename", () => {
      const result = validateFilename(goodFilename);
      expect(result).to.be.null;
    });
    badFilenames.forEach(([message, badFilename]) => {
      it(`${message} fails`, () => {
        const result = validateFilename(badFilename);
        expect(result.info.message).to.match(
          /^Uploaded file name must match pattern/
        );
      });
    });
  });
});
