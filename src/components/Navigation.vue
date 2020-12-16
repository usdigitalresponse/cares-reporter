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

      <div class="row">
        <div class="col-12">
          <div>
            Reporting Period:
            {{ dateFormat(currentReportingPeriod.start_date) }} to
            {{ dateFormat(currentReportingPeriod.end_date) }}
          </div>
        </div>
      </div>


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
    <div class="messages">
      <Messages />
    </div>
    <router-view />
  </div>
</template>

<script>
import Messages from "./Messages";
import { titleize } from "../helpers/form-helpers";
import moment from "moment";

export default {
  name: "Logout",
  components: {
    Messages
  },
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
    currentReportingPeriod: {
      set: p => {
        // setter is needed to avoid an error when the "watch" on
        // applicationSettings is triggered.
        // No current (20 12 15) need to do anything with it, so we could
        // just remove the watch instead of adding this setter.
        if (p) {
          // p is the current reporting period record
          // console.log(`Current reporting period is ${p.id}`);
        }
      },
      get: function () {
        const rp = this.$store.getters.currentReportingPeriod;
        if (rp){
          return this.$store.getters.currentReportingPeriod;

        }else {
          return {};
        }
      }
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
    },
    dateFormat: function(d) {
      return moment(d)
        .utc()
        .format("MM-DD-YYYY");
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
.messages,
.navigation {
  width: 90%;
  margin: 0 auto;
}
nav {
  margin: 10px auto;
  width: 90%;
}
</style>
