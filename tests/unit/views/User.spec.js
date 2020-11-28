import { expect } from "chai";
import { mount, createLocalVue } from "@vue/test-utils";
import User from "@/views/User.vue";
import Vuex from "vuex";

const localVue = createLocalVue();
localVue.use(Vuex);

describe("User.vue", () => {
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      state: {
        configuration: {
          roles: [{ name: "admin" }, { name: "reporter" }]
        }
      },
      getters: {
        agencies: () => [{ name: "A1" }, { name: "A2" }]
      }
    });
  });
  it("renders new user form", () => {
    const wrapper = mount(User, { store, localVue });
    const r = wrapper.find("button.btn-primary");
    expect(r.text()).to.include("Create User");
  });
  it("requires a non blank email", async () => {
    const wrapper = mount(User, { store, localVue });
    await wrapper.find("button").trigger("click");
    setTimeout(() => {
      expect(wrapper.find(".alert").text()).to.equal("Email is required");
    }, 0); // not sure why this is necessary
  });
});
