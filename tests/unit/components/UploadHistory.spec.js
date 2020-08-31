import { expect } from "chai";
import { shallowMount } from "@vue/test-utils";
import UploadHistory from "@/components/UploadHistory.vue";

describe("UploadHistory.vue", () => {
  it("renders", () => {
    const wrapper = shallowMount(UploadHistory, {
      stubs: ["router-link"],
      propsData: {
        uploads: [{ filename: "one.xlsx" }, { filename: "two.xlsx" }]
      }
    });
    expect(wrapper.text()).to.include("Upload");
    const history = wrapper.findAll("table#upload-history tr");
    expect(history.length).to.equal(3);
    expect(history.at(1).text()).to.include("one.xlsx");
    expect(history.at(2).text()).to.include("two.xlsx");
  });
});
