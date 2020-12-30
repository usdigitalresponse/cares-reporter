const { processUpload } = requireSrc(__filename);
const expect = require("chai").expect;
const { makeUploadArgs } = require("./helpers");

const dirRoot = `${__dirname}/../fixtures/`;

describe("process-upload", () => {
  describe("cover", () => {
    const dir = `${dirRoot}data-cover/`;
    it("fails when agency code and project id are missing", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-09302020-missing-data-v1.xlsx`
      );
      let result;
      try{
        result = await processUpload(uploadArgs);

      } catch(err) {
        console.dir(err);
      }
      let valog = result.valog.getLog();
      // console.dir(valog);
      const err = valog[0] || {};
      expect(err.message).to.equal(
        'cover requires a row with "agency code" and "project id"'
      );
    });
    it("fails when agency code does not match filename", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-09302020-bad-agency_code-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      const err = result.valog.getLog()[0] || {};
      expect(err.message).to.equal(
        `The agency code "EOH" in the file name does not match the cover's agency code`
      );
      expect(err.row).to.equal(2);
    });
    it("fails when project id does not match filename", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}/EOHHS-075-09302020-bad-proj_id-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      const err = result.valog.getLog()[0] || {};
      expect(err.message).to.equal(
        'The project id "074" does not match the project id in the filename'
      );
      expect(err.row).to.equal(2);
    });
  });
});
