<template>
  <div>
    <div class="header">
      <span class="title"
        >{{ applicationTitle }}
        <span v-if="agencyName"> : {{ agencyName }}</span>
      </span>
      <span class="float-right">
        {{ email }}
        <a href="#" @click="logout">Logout</a>
      </span>
    </div>
    <div class="navigation">
      <ul class="nav nav-tabs mb-4" v-if="loggedIn">
        <li class="nav-item">
          <router-link :class="navLinkClass('/')" to="/">Dashboard</router-link>
        </li>
        <li class="nav-item dropdown">
          <a
            :class="dropdownClass('/documents/')"
            data-toggle="dropdown"
            href="#"
            role="button"
            aria-haspopup="true"
            aria-expanded="false"
          >
            Spreadsheet Data
          </a>
          <div class="dropdown-menu">
            <router-link
              class="dropdown-item"
              :key="name"
              :to="`/documents/${name}`"
              v-for="name in tableNames"
              >{{ titleize(name) }}</router-link
            >
          </div>
        </li>
        <li class="nav-item" v-if="role === 'admin'">
          <router-link :class="navLinkClass('/agencies')" to="/agencies"
            >Agencies</router-link
          >
        </li>
        <li class="nav-item" v-if="role === 'admin'">
          <router-link :class="navLinkClass('/projects')" to="/projects"
            >Projects</router-link
          >
        </li>
        <li class="nav-item" v-if="role === 'admin'">
          <router-link :class="navLinkClass('/users')" to="/users"
            >Users</router-link
          >
        </li>
      </ul>
    </div>
    <router-view />
  </div>
</template>

<script>
import { titleize } from "../helpers/form-helpers";

export default {
  name: "Logout",
  computed: {
    user: function() {
      return this.$store.getters.user;
    },
    email: function() {
      return this.user.email;
    },
    agencyName: function() {
      return this.$store.getters.agencyName(this.user.agency_id);
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
    },
    navLinkClass(to) {
      if (document.location.pathname === to) {
        return "nav-link active";
      }
      return "nav-link";
    },
    dropdownClass(prefix) {
      if (document.location.pathname.startsWith(prefix)) {
        return "nav-link dropdown-toggle active";
      }
      return "nav-link dropdown-toggle";
    }
  }
};
</script>

<style scoped>
.header {
  width: 90%;
  margin: 10px auto;
}
.title {
  font-size: 24px;
}
.navigation {
  width: 90%;
  margin: 0 auto;
}
nav {
  margin: 10px auto;
  width: 90%;
}
</style>
