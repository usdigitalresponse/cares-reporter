const {
  currentReportingPeriodSettings,
  setCurrentReportingPeriod
} = requireSrc(__filename);

const expect = require("chai").expect;


describe("settings.spec.js - baseline success", () => {
  it("Returns the current reporting period", async () => {

    const result = await currentReportingPeriodSettings();
    // console.dir(result);
    expect(
      result.current_reporting_period_id
    ).to.equal(2);
  });
  it("Changes the current reporting period", async () => {
    await setCurrentReportingPeriod(1);
    const result = await currentReportingPeriodSettings();
    // console.dir(result);
    await setCurrentReportingPeriod(2); // restore it for later tests
    expect(
      result.current_reporting_period_id
    ).to.equal(1);
  });
});
