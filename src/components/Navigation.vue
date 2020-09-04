<template>
  <div>
    <div class="title">{{ applicationTitle }}</div>
    <nav v-if="loggedIn">
      <router-link to="/">Dashboard</router-link> |
      <template v-for="(name, i) in tableNames">
        <span :key="i" v-if="i > 0"> | </span>
        <router-link :key="name" :to="`/documents/${name}`">{{
          titleize(name)
        }}</router-link>
      </template>
      <span v-if="role === 'admin'">
        | <router-link to="/agencies">Agencies</router-link> |
        <router-link to="/users">Users</router-link> |
        <router-link to="/configuration">Configuration</router-link>
      </span>
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
      return this.$store.getters.user.email;
    },
    role: function() {
      return this.$store.getters.user.role;
    },
    loggedIn: function() {
      return this.$store.state.user !== null;
    },
    tableNames: function() {
      return this.$store.getters.tableNames;
    },
    applicationTitle: function() {
      return this.$store.getters.applicationTitle;
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
.title {
  font-size: 24px;
  text-align: center;
  margin-top: 10px;
}
nav {
  margin: 10px auto;
  width: 90%;
}
</style>
