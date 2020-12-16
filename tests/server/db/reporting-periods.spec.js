const {
  close,
  periodSummaries,
  reportingPeriods
} = requireSrc(__filename);

const expect = require("chai").expect;

describe("reporting-periods.spec.js - baseline success", () => {
  it("Returns a list of reporting periods", async () => {

    const result = await reportingPeriods();
    // console.dir(result);
    // expect(
    //   result.valog.getLog(),
    //   JSON.stringify(result.valog.getLog(), null, 2)
    // ).to.be.empty;
    return result;
  });
  it("Returns the period summaries", async () => {

    const result = await periodSummaries();
    // console.dir(result);
    // expect(
    //   result.valog.getLog(),
    //   JSON.stringify(result.valog.getLog(), null, 2)
    // ).to.be.empty;
    return result;
  });
  it("Closes the current reporting period", async () => {

    const result = await close();
    console.dir(result);
    // expect(
    //   result.valog.getLog(),
    //   JSON.stringify(result.valog.getLog(), null, 2)
    // ).to.be.empty;
    return result;
  });

});
