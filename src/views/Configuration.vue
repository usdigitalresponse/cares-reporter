<template>
  <div class="configuration">
    <h1>Configuration</h1>
    <h2>Reporting Periods</h2>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Start Date</th>
          <th>End Date</th>
        </tr>
      </thead>
      <tbody>
        <tr :key="period.id" v-for="period in reportingPeriods">
          <td>{{ period.name }}</td>
          <td>{{ period.start_date }}</td>
          <td>{{ period.end_date }}</td>
        </tr>
      </tbody>
    </table>
    <h2>Users</h2>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Agency</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        <tr :key="user.email" v-for="user in users">
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td>{{ agencyName(user.agency_id) }}</td>
          <td>{{ user.created_at }}</td>
        </tr>
      </tbody>
    </table>
    <h2>Roles</h2>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Rules</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        <tr :key="role.name" v-for="role in roles">
          <td>{{ role.name }}</td>
          <td>{{ role.rules }}</td>
          <td>{{ role.created_at }}</td>
        </tr>
      </tbody>
    </table>
    <h2>Tables</h2>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Content</th>
        </tr>
      </thead>
      <tbody>
        <tr :key="table.name" v-for="table in tables">
          <td>{{ table.name }}</td>
          <td>{{ preview(table.content) }}</td>
        </tr>
      </tbody>
    </table>
    <h2>Templates</h2>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Content</th>
        </tr>
      </thead>
      <tbody>
        <tr :key="template.name" v-for="template in templates">
          <td>{{ template.name }}</td>
          <td>{{ preview(template.content) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "Configuration",
  computed: {
    users: function() {
      const { users } = this.$store.state.configuration;
      return users;
    },
    roles: function() {
      const { roles } = this.$store.state.configuration;
      return roles;
    },
    tables: function() {
      const { tables } = this.$store.state.configuration;
      return tables;
    },
    templates: function() {
      const { templates } = this.$store.state.configuration;
      return templates;
    },
    reportingPeriods: function() {
      return this.$store.state.reportingPeriods;
    }
  },
  methods: {
    preview(o) {
      if (!o) {
        return "";
      }
      const s = JSON.stringify(o);
      const maxLength = 80;
      if (s.length < maxLength) {
        return s;
      }
      return `${s.slice(0, maxLength)}...`;
    },
    agencyName(id) {
      return this.$store.getters.agencyName(id);
    }
  }
};
</script>

<style scoped>
.configuration {
  width: 90%;
  margin: 0 auto;
}
table {
  width: 100%;
  margin: 50px auto;
}
h2,
td {
  text-align: left;
}
</style>
