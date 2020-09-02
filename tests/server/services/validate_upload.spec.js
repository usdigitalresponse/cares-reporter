const { validateFilename } = requireSrc(__filename);
const expect = require("chai").expect;

describe("lib/validate_upload", () => {
  describe("validateFilename", () => {
    const goodFilename = "EOH_Covid-Supp-013_ppe_06302020_v1.xlsx";
    const badFilenames = [
      ["wrong extension", "EOH_Covid-Supp-013_ppe_06302020_v1.csv"],
      ["missing version", "EOH_Covid-Supp-013_ppe_06302020.xlsx"],
      ["wrong date", "EOH_Covid-Supp-013_ppe_06312020.xlsx"]
    ];
    it("passes a good filename", () => {
      const result = validateFilename(goodFilename);
      expect(result).to.be.empty;
    });
    badFilenames.forEach(([message, badFilename]) => {
      it(`${message} fails`, () => {
        const result = validateFilename(badFilename);
        console.log("result", result);
        expect(result[result.length - 1].info.message).to.match(
          /^Uploaded file name must match pattern/
        );
      });
    });
  });
});
