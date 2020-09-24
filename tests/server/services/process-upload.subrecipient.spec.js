const { processUpload } = requireSrc(__filename);
const expect = require("chai").expect;
const { makeUploadArgs } = require("./helpers");

const dirRoot = `${__dirname}/../fixtures/`;

describe("services/process-upload", () => {
  describe("subrecipients", () => {
    const dir = `${dirRoot}data-subrecipients/`;
    it("fails when missing both project_id and duns", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-06302020-missing_id-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      const err = result.valog.getLog()[0] || {};
      expect(err.message).to.equal(
        `Each subrecipient must have either an "identification number" or a "duns number"`
      );
      expect(err.row).to.equal(3);
    });
    it(`fails when there is no duns number and "city name" is missing.`, async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-06302020-missing_sub_city_name-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      const log = result.valog.getLog();
      expect(
        log.length,
        JSON.stringify(result.valog.getLog(), null, 2)
      ).to.equal(1);
      expect(log[0].message).to.match(/Empty or invalid entry for city name/);
      expect(log[0].row).to.equal(4);
    });
  });
});
