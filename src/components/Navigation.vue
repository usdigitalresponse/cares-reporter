<template>
  <div>
    <nav v-if="loggedIn">
      <router-link to="/">Dashboard</router-link> |
      <router-link to="/agency">Agency Dashboard</router-link> |
      <template v-for="name in tableNames">
        <router-link :key="name" :to="`/documents/${name}`">{{
          titleize(name)
        }}</router-link>
        |
      </template>
      <router-link to="/configuration">Configuration</router-link>
      <span class="float-right">
        {{ email }}
        <a href="#" @click="logout">Logout</a>
      </span>
    </nav>
    <router-view />
  </div>
</template>

<script>
import { titleize } from "../helpers/form-helpers";

export default {
  name: "Logout",
  computed: {
    email: function() {
      return this.$store.state.user ? this.$store.state.user.email : "";
    },
    loggedIn: function() {
      return this.$store.state.user !== null;
    },
    tableNames: function() {
      return this.$store.getters.tableNames;
    }
  },
  methods: {
    titleize,
    logout(e) {
      e.preventDefault();
      this.$store
        .dispatch("logout")
        .then(() => this.$router.push({ path: "/login" }));
    }
  }
};
</script>

<style scoped>
nav {
  margin: 10px auto;
  width: 90%;
}
</style>
