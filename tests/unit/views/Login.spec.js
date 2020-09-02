import { expect } from "chai";
import { mount } from "@vue/test-utils";
import Login from "@/views/Login.vue";

describe("Login.vue", () => {
  it("renders login form", () => {
    const wrapper = mount(Login, {});
    const r = wrapper.find("button.btn-primary");
    expect(r.text()).to.include("Send email with login link");
  });
  it("requires a non blank email", async () => {
    const wrapper = mount(Login, {});
    await wrapper.find("button").trigger("click");
    expect(wrapper.find(".alert").text()).to.equal("Email cannot be blank");
  });
  it("requires a valid email", async () => {
    const wrapper = mount(Login, {});
    await wrapper.find("input").setValue("foo");
    await wrapper.find("button").trigger("click");
    expect(wrapper.find(".alert").text()).to.equal(
      "'foo' is not a valid email address"
    );
  });
});
