<template>
  <div class="users">
    <h2>Users</h2>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Email</th>
          <th>Name</th>
          <th>Role</th>
          <th>Agency</th>
          <th>Created At</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr :key="user.email" v-for="user in users">
          <td>{{ user.email }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.role }}</td>
          <td>{{ agencyName(user.agency_id) }}</td>
          <td>{{ user.created_at }}</td>
          <td><router-link :to="`/users/${user.id}`">Edit</router-link></td>
        </tr>
      </tbody>
    </table>
    <div class="mt-2">
      <router-link to="/new_user" class="btn btn-primary"
        >Create New User</router-link
      >
    </div>
  </div>
</template>

<script>
export default {
  name: "Users",
  computed: {
    users: function() {
      const { users } = this.$store.state.configuration;
      return users;
    }
  },
  methods: {
    agencyName(id) {
      return this.$store.getters.agencyName(id);
    }
  }
};
</script>

<style scoped>
.users {
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
