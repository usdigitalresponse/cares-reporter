import { expect } from "chai";
import { mount } from "@vue/test-utils";
import DataTable from "@/components/DataTable.vue";

describe("DataTable.vue", () => {
  it("renders table", () => {
    const wrapper = mount(DataTable, {
      stubs: ["router-link"],
      propsData: {
        user: {
          email: "user@example.com"
        },
        table: {
          name: "users",
          columns: [{ name: "id" }, { name: "email" }]
        },
        rows: [
          { id: 1, email: "user@example.com" },
          { id: 2, email: "admin@example.com" }
        ]
      }
    });
    const r = wrapper.findAll("tr");
    expect(r.length).to.equal(3);
    expect(r.at(0).text()).to.include("Email");
    expect(r.at(1).text()).to.include("user@example.com");
    expect(r.at(2).text()).to.include("admin@example.com");
  });
});
