const fs = require("fs");
const { processUpload } = requireSrc(__filename);
const expect = require("chai").expect;

const makeUploadArgs = fixtureFile => {
  const filename = fixtureFile.match(/[^/]+$/)[0];
  return {
    filename: filename,
    configuration_id: 1,
    user_id: 1,
    data: fs.readFileSync(fixtureFile)
  };
};

const dirRoot = `${__dirname}/../fixtures/`;

describe("services/process_upload", () => {
  describe("baseline success", () => {
    const dir = `${dirRoot}file-success/`;
    it("processes without error", async () => {
      const uploadArgs = makeUploadArgs(`${dir}DOH-013-06302020-v1.xlsx`);
      const result = await processUpload(uploadArgs);
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
  });

  describe("file structure failures", () => {
    const dir = `${dirRoot}file-structure/`;
    it("fails missing tab", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}OMB-000-06302020-missing_subrecipients-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      expect(result.valog.getLog()[0].message).to.match(/Missing tab/);
    });

    it("fails missing column", async () => {
      const uploadArgs = makeUploadArgs(
        `${dir}OMB-000-06302020-missing_contract_desc-v1.xlsx`
      );
      const result = await processUpload(uploadArgs);
      expect(result.valog.getLog()[0].message).to.match(/Missing column/);
    });
  });
});
