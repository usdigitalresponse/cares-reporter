import { expect } from "chai";
import { shallowMount, createLocalVue } from "@vue/test-utils";
import Navigation from "@/components/Navigation.vue";
import Vuex from "vuex";

const localVue = createLocalVue();
localVue.use(Vuex);

describe("Navigation.vue", () => {
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      getters: {
        tableNames: () => ["Products", "Product Type"],
        user: () => ({ email: "user@example.com", role: "admin" }),
        applicationTitle: () => "CARES Reporter"
      }
    });
  });

  it("renders a nav element", () => {
    const wrapper = shallowMount(Navigation, {
      store,
      localVue,
      stubs: ["router-link", "router-view"]
    });
    const r = wrapper.findAll("nav");
    expect(r.length).to.equal(1); // has one nav bar
  });

  it("include title", () => {
    const wrapper = shallowMount(Navigation, {
      store,
      localVue,
      stubs: ["router-link", "router-view"]
    });
    const r = wrapper.find(".title");
    expect(r.text()).to.include("CARES Reporter");
  });
});
