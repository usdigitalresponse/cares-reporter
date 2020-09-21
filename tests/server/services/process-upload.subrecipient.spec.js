const { processUpload } = requireSrc(__filename);
const knex = requireSrc(`${__dirname}/../db/connection`);
const expect = require("chai").expect;
const { makeUploadArgs } = require("./helpers");

const dirRoot = `${__dirname}/../fixtures/`;

describe("process-upload", () => {
  describe("subrecipients", () => {
    const dir = `${dirRoot}data-subrecipients/`;
    it("fails when missing both project_id and duns", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-06302020-missing_id-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      console.log("result", result);
      const err = result.valog.getLog()[0] || {};
      expect(err.message).to.equal(
        `Each subrecipient must have either an "identification number" or a "duns number"`
      );
      expect(err.row).to.equal(3);
    });
  });
});
