import { expect } from "chai";
import { mount, createLocalVue } from "@vue/test-utils";
import Home from "@/views/Home.vue";
import Vuex from "vuex";

const localVue = createLocalVue();
localVue.use(Vuex);

describe("Home.vue", () => {
  it("renders dashboard for user with admin role", () => {
    const store = new Vuex.Store({
      state: {
        configuration: {
          templates: [{ name: "Agency" }]
        }
      },
      getters: {
        user: () => ({ email: "admin@example.com", role: "admin" }),
        reportingTemplate: () => "template.xlsx"
      }
    });
    const wrapper = mount(Home, {
      store,
      localVue,
      stubs: ["router-link", "router-view"]
    });
    const r = wrapper.find("a.btn-primary");
    expect(r.text()).to.include("Download Treasury Report");
  });
  it("renders dashboard for user with reporter role", () => {
    const store = new Vuex.Store({
      state: {
        configuration: {
          templates: [{ name: "Agency" }]
        }
      },
      getters: {
        user: () => ({ email: "admin@example.com", role: "reporter" })
      }
    });
    const wrapper = mount(Home, {
      store,
      localVue,
      stubs: ["router-link", "router-view"]
    });
    const r = wrapper.find("button.btn-primary");
    expect(r.text()).to.include("Upload Spreadsheet");
  });
});
