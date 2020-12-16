const {
  documentsForAgency,
  documentsWithProjectCode
} = requireSrc(__filename);
const { processUpload } = requireSrc(`${__dirname}/../services/process-upload`);

const { makeUploadArgs, resetUploadsAndDb } = require("../services/helpers");
const {
  currentReportingPeriod,
  setCurrentReportingPeriod } = requireSrc(`${__dirname}/../db/settings`);

const dirRoot = `${__dirname}/../fixtures/`;

const expect = require("chai").expect;


describe("documents.spec.js - baseline success", () => {
  const dir = `${dirRoot}file-success/`;
  it("Uploads a file in reporting period 1", async () => {
    const uploadArgs = makeUploadArgs(
      `${dir}OMB-1020-09302020-simple-v1.xlsx`
    );

    await setCurrentReportingPeriod(1);
    const result = await processUpload(uploadArgs);
    expect(
      result.valog.getLog(),
      JSON.stringify(result.valog.getLog(), null, 2)
    ).to.be.empty;
    return result;
  });

  it("Uploads a file in reporting period 2", async () => {

    const uploadArgs = makeUploadArgs(
      `${dir}GOV-075-09302020-simple-v1.xlsx`
    );

    await setCurrentReportingPeriod(2);
    const result = await processUpload(uploadArgs);
    expect(
      result.valog.getLog(),
      JSON.stringify(result.valog.getLog(), null, 2)
    ).to.be.empty;
    return result;
  });

  it("Returns documents from the current reporting period", async () => {

    await setCurrentReportingPeriod(1);
    const result = await documentsWithProjectCode();
    // console.dir(result.length);
    expect( result.length ).to.equal(35);
  });

  it("Returns no documents from another reporting period", async () => {
    // console.dir(await currentReportingPeriod()); // 2
    await setCurrentReportingPeriod(3);
    const result = await documentsWithProjectCode();
    // console.dir(result.length);
    expect( result.length ).to.equal(0);
  });

  it("Specified period overrides current reporting period", async () => {
    // console.dir(await currentReportingPeriod()); // 2
    await setCurrentReportingPeriod(2);
    const result = await documentsWithProjectCode(1);
    // console.dir(result.length);
    expect( result.length ).to.equal(35);
  });
});
