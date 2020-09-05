import { expect } from "chai";
import { mount, createLocalVue } from "@vue/test-utils";
import Projects from "@/views/Projects.vue";
import Vuex from "vuex";

const localVue = createLocalVue();
localVue.use(Vuex);

describe("Projects.vue", () => {
  it("renders project list", () => {
    const store = new Vuex.Store({
      state: {
        projects: [
          { id: 1, code: "001", name: "Project 1" },
          { id: 2, code: "002", name: "Project 2" }
        ]
      }
    });
    const wrapper = mount(Projects, {
      store,
      localVue,
      stubs: ["router-link", "router-view"]
    });
    const r = wrapper.find("tbody");
    expect(r.text()).to.include("Project 1");
    expect(r.text()).to.include("Project 2");
  });
});
