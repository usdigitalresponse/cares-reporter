import { expect } from "chai";
import { shallowMount, createLocalVue } from "@vue/test-utils";
import UploadData from "@/components/UploadData.vue";
import Vuex from "vuex";

const localVue = createLocalVue();
localVue.use(Vuex);

describe("UploadData.vue", () => {
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      state: {
        configuration: { tables: [], templates: [] }
      },
      getters: {
        tableNames: () => ["Products", "Product Type"],
        template: () => () => ({ id: 1, name: "Template 1" })
      }
    });
  });
  it("renders form", () => {
    const wrapper = shallowMount(UploadData, {
      store,
      localVue,
      propsData: {
        id: "1",
        data: [
          {
            name: "Sheet 1",
            data: [
              ["id", "name"],
              ["1", "Widget"]
            ]
          }
        ],
        upload: { configuration_id: 1 }
      }
    });
    const f = wrapper.findAll("form");
    expect(f.length).to.equal(1); // has one form
  });
});
