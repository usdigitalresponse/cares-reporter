const fs = require("fs");
const { processUpload } = requireSrc(__filename);
const knex = requireSrc(`${__dirname}/../db/connection`);
const expect = require("chai").expect;
const util = require("util");
const setTimeoutPromise = util.promisify(setTimeout);
const { makeUploadArgs, resetUploadsAndDb } = require("./helpers");

const dirRoot = `${__dirname}/../fixtures/`;

describe("services/process_upload", () => {
  describe("baseline success", () => {
    const dir = `${dirRoot}file-success/`;
    it("processes without error", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}EOHHS-075-06302020-simple-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      expect(
        result.valog.getLog(),
        JSON.stringify(result.valog.getLog(), null, 2)
      ).to.be.empty;
      return result;
    });
  });

  describe("filename failures", () => {
    const dir = `${dirRoot}file-name/`;
    const filenameTests = [
      {
        label: "bad extension",
        file: "GOV-1020-06302020-badExtension-v1.csv",
        expects: /must have ".xlsx" extension/
      },
      {
        label: "version number",
        file: "GOV-1020-06302020-missingVersion.xlsx",
        expects: /Last part of filename must be a version number/
      },
      {
        label: "report date",
        file: "GOV-1020-07302020-incorrectReportDate-v1.xlsx",
        expects: /Third part of filename must match the reporting period end date/
      },
      {
        label: "project id",
        file: "GOV-InvalidProjectID-06302020-v1.xlsx",
        expects: /./
      },
      {
        label: "agency code",
        file: "InvalidAgencyCode-013-06302020-v1.xlsx",
        expects: /not a valid agency code/
      }
    ];
    filenameTests.forEach(ftest => {
      it(ftest.label, async () => {
        const uploadArgs = makeUploadArgs(dir + ftest.file);
        const result = await processUpload(uploadArgs);
        expect(result.valog.getLog()[0].message).to.match(ftest.expects);
      });
    });

    it("fails when a duplicate file is uploaded", async () => {
      await resetUploadsAndDb();
      const uploadArgs = makeUploadArgs(
        `${dirRoot}file-success/EOHHS-075-06302020-simple-v1.xlsx`
      );
      const successResult = await processUpload(uploadArgs);
      expect(successResult.valog.getLog()).to.be.empty;
      const dupUploadResult = await processUpload(uploadArgs);
      expect(dupUploadResult.valog.getLog()[0].message).to.match(
        /The file .* is already in the database/
      );
    });
  });

  describe("file structure failures", () => {
    const dir = `${dirRoot}file-structure/`;
    it("fails missing tab", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}EOHHS-075-06302020-missingContractsTab-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      expect(result.valog.getLog()[0].message).to.match(/Missing tab/);
    });

    it("fails missing column", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}EOHHS-075-06302020-missingColumn-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      expect(result.valog.getLog()[0].message).to.match(/Missing column/);
    });
  });

  describe("database checks", () => {
    beforeEach(resetUploadsAndDb);
    it("replaces upload record on re-upload when the file is lost", async () => {
      const dir = `${dirRoot}file-success/`;
      const testFile = "EOHHS-075-06302020-simple-v1.xlsx";
      const uploadArgs = makeUploadArgs(`${dir}${testFile}`);

      // first upload
      const result1 = await processUpload(uploadArgs);
      const originalDate = result1.upload.created_at;
      fs.unlinkSync(`${process.env.UPLOAD_DIRECTORY}/${testFile}`);

      // second upload
      await setTimeoutPromise(10);
      const result2 = await processUpload(uploadArgs);
      const replacedDate = result2.upload.created_at;
      expect(replacedDate).to.not.equal(originalDate);
      expect(result2.valog.getLog()).to.have.length(0);
    });

    it("deletes old documents when new version is uploaded", async () => {
      // Do two uploads
      const dir = `${dirRoot}file-success/`;
      const uploadArgs1 = makeUploadArgs(
        `${dir}EOHHS-075-06302020-simple-v1.xlsx`
      );
      const result1 = await processUpload(uploadArgs1);

      const afterFirstUpload = await knex("documents")
        .distinct("upload_id")
        .orderBy("upload_id");
      // Check the first upload
      expect(result1.valog.getLog()).to.have.length(0);
      expect(afterFirstUpload).to.deep.equal([{ upload_id: 1 }]);

      // For the second upload use a file with similar content
      // but a different cover page, rather than
      // a new version of the first report.
      const uploadArgs2 = makeUploadArgs(
        `${dir}GOV-075-06302020-simple-v1.xlsx`
      );
      const result2 = await processUpload(uploadArgs2);

      // Check the second upload
      expect(
        result2.valog.getLog(),
        JSON.stringify(result2.valog.getLog(), null, 2)
      ).to.have.length(0);
      const beforeReplace = await knex("documents")
        .distinct("upload_id")
        .orderBy("upload_id");
      expect(beforeReplace).to.deep.equal([{ upload_id: 1 }, { upload_id: 2 }]);

      // Do the replacement of upload of v1 by uploading a new version of that file
      // simulated here by changing the filename.
      const uploadArgs3 = makeUploadArgs(
        `${dir}EOHHS-075-06302020-simple-v1.xlsx`
      );
      uploadArgs3.filename = uploadArgs3.filename.replace(/-v1/, "-v2");
      const result3 = await processUpload(uploadArgs3);

      // Check that there are new docs for upload 3 and upload 1 docs are gone.
      expect(result3.valog.getLog()).to.have.length(0);
      const afterReplace = await knex("documents")
        .distinct("upload_id")
        .orderBy("upload_id");
      expect(afterReplace).to.deep.equal([{ upload_id: 2 }, { upload_id: 3 }]);
    });
  });
});
