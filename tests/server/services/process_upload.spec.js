const fs = require("fs");
const { processUpload } = requireSrc(__filename);
const expect = require("chai").expect;

const xlsxData = fs.readFileSync(
  `${__dirname}/../fixtures/EOH_Covid-Supp-013_ppe_06302020_v1.xlsx`
);

describe("services/process_upload", () => {
  it("processes without error", async () => {
    const uploadArgs = {
      filename: "EOH_Covid-Supp-013_ppe_06302020_v1.xlsx",
      configuration_id: 1,
      user_id: 1,
      data: xlsxData
    };
    return await processUpload(uploadArgs);
  });

  it("fails a bad filename", async () => {
    const uploadArgs = {
      filename: "EOH_Covid-Supp-013_ppe_06302020_v1.csv",
      configuration_id: 1,
      user_id: 1,
      data: xlsxData
    };
    const result = await processUpload(uploadArgs);
    expect(result.valog.log).to.have.length(2);
  });
});
