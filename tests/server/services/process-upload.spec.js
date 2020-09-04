const fs = require("fs");
const { processUpload } = requireSrc(__filename);
const expect = require("chai").expect;

const makeUploadArgs = fixtureFile => {
  return {
    filename: fixtureFile,
    configuration_id: 1,
    user_id: 1,
    data: fs.readFileSync(`${__dirname}/../fixtures/${fixtureFile}`)
  };
};

describe("services/process_upload", () => {
  it("processes without error", async () => {
    const uploadArgs = makeUploadArgs("EOH-013-06302020-v1.xlsx");
    const result = await processUpload(uploadArgs);
    return result;
  });

  it("fails a bad filename", async () => {
    const uploadArgs = makeUploadArgs("EOH-013-06302020-v1.xlsx");
    uploadArgs.filename = "EOH-013-06302020-v1.csv";
    const result = await processUpload(uploadArgs);
    expect(result.valog.log).to.have.length(2);
  });

  it("fails missing tab", async () => {
    const uploadArgs = makeUploadArgs(
      "OMB-000-06302020-missing_subrecipients-v1.xlsx"
    );
    const result = await processUpload(uploadArgs);
    expect(result.valog.getLog()[0].message).to.match(/Missing tab/);
  });

  it("fails missing column", async () => {
    const uploadArgs = makeUploadArgs(
      "OMB-000-06302020-missing_contract_desc-v1.xlsx"
    );
    const result = await processUpload(uploadArgs);
    expect(result.valog.getLog()[0].message).to.match(/Missing column/);
  });
});
