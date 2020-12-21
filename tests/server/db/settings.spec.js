const { currentReportingPeriod } = requireSrc(__filename);

const expect = require("chai").expect;


describe("baseline success", () => {
  it("Returns the current reporting period", async () => {

    const result = await currentReportingPeriod();
    // console.dir(result);
    expect(
      result.current_reporting_period_id
    ).to.equal(2);
  });
});
