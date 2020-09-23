const { processUpload } = requireSrc(__filename);
const knex = requireSrc(`${__dirname}/../db/connection`);
const expect = require("chai").expect;
const { makeUploadArgs } = require("./helpers");

const dirRoot = `${__dirname}/../fixtures/`;

describe("process-upload", () => {
  describe("cover", () => {
    const dir = `${dirRoot}data-cover/`;
    it("fails when agency code does not match filename", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-06302020-bad-agency_code-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      const err = result.valog.getLog()[0] || {};
      expect(err.message).to.equal(
        `cover's "agency code" (EOH) must match file name's "agency code" (EOHHS)`
      );
      expect(err.row).to.equal(2);
    });
    it("fails when project id does not match filename", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-06302020-bad-proj_id-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      const err = result.valog.getLog()[0] || {};
      expect(err.message).to.equal(
        `cover's "project id" (74) must match file name's "project id" (75)`
      );
      expect(err.row).to.equal(2);
    });
  });
});
