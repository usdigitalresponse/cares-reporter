const { removeEmptyDocuments } = requireSrc(__filename);
const expect = require("chai").expect;

describe("services/removeEmptyDocuments", () => {
  it("removes undefined values", async () => {
    const documents = [
      { type: "test", content: { id: "1001", name: "", quantity: 1 } },
      { type: "test", content: { id: undefined, name: undefined, quantity: undefined } }
    ]
    expect(removeEmptyDocuments(documents).length).to.equal(1);
  });
  it("removes empty string values", async () => {
    const documents = [
      { type: "test", content: { id: "1001", name: "", quantity: 1 } },
      { type: "test", content: { id: "", name: "", quantity: "" } }
    ]
    expect(removeEmptyDocuments(documents).length).to.equal(1);
  });
  it("removes empty string values", async () => {
    const documents = [
      { type: "test", content: { id: "1001", name: "", quantity: 1 } },
      { type: "test", content: { id: 0, name: 0, quantity: 0 } }
    ]
    expect(removeEmptyDocuments(documents).length).to.equal(1);
  });
});
