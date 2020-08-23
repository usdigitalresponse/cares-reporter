import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

Vue.config.productionTip = false;

fetch("/api/sessions")
  .then(r => r.json())
  .then(data => {
    if (data && data.user) {
      store.dispatch("login", data.user);
    }
    new Vue({
      router,
      store,
      render: h => h(App)
    }).$mount("#app");
  })
  .catch(e => {
    console.log(e);
  });
