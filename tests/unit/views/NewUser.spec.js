import { expect } from "chai";
import { mount, createLocalVue } from "@vue/test-utils";
import NewUser from "@/views/NewUser.vue";
import Vuex from "vuex";

const localVue = createLocalVue();
localVue.use(Vuex);

describe("NewUser.vue", () => {
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
    const wrapper = mount(NewUser, { store, localVue });
    const r = wrapper.find("button.btn-primary");
    expect(r.text()).to.include("Create New User");
  });
  it("requires a non blank email", async () => {
    const wrapper = mount(NewUser, { store, localVue });
    await wrapper.find("button").trigger("click");
    expect(wrapper.find(".alert").text()).to.equal("Email cannot be blank");
  });
});
