<template>
  <div class="user">
    <h1>New User</h1>
    <form @submit="createUser">
      <div class="form-group">
        <label>Email</label>
        <input class="form-control" v-model="user.email" />
      </div>
      <div class="form-group">
        <label>Role</label>
        <select class="form-control" v-model="user.role">
          <option :key="role.name" v-for="role in roles">{{
            role.name
          }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Agency</label>
        <select class="form-control" v-model="user.agency_id">
          <option value="None">None</option>
          <option
            :key="agency.name"
            v-for="agency in agencies"
            :value="agency.id"
            >{{ agency.name }}</option
          >
        </select>
      </div>
      <div class="form-group">
        <button
          class="btn btn-primary"
          type="submit"
          @click="createUser"
          :disabled="creating"
        >
          {{ creating ? "Creating New User..." : "Create New User" }}
        </button>
        <a class="ml-3" href="#" @click="cancelCreate">Cancel</a>
      </div>
    </form>
    <div
      class="mt-3 alert alert-danger"
      :key="message"
      v-for="message in validationMessages"
    >
      {{ message }}
    </div>
  </div>
</template>

<script>
import _ from "lodash-checkit";
export default {
  name: "NewUser",
  data: function() {
    return {
      validationMessages: [],
      user: {
        role: "reporter",
        agency_id: "None"
      },
      creating: false
    };
  },
  computed: {
    roles: function() {
      return this.$store.state.configuration.roles;
    },
    agencies: function() {
      return this.$store.state.agencies;
    }
  },
  methods: {
    createUser: async function(e) {
      e.preventDefault();
      this.validate();
      if (this.validationMessages.length === 0) {
        this.creating = true;
        const newUser = { ...this.user };
        if (this.user.agency_id === "None") {
          delete newUser.agency_id;
        }
        this.$store
          .dispatch("createUser", newUser)
          .then(() => {
            this.$router.push("/users");
          })
          .catch(e => {
            this.validationMessages = [e.message];
            this.creating = false;
          });
      }
    },
    validate() {
      this.validationMessages = [];
      if (!this.user.email) {
        this.validationMessages.push("Email cannot be blank");
      } else if (!_.isEmail(this.user.email)) {
        this.validationMessages.push(
          `'${this.user.email}' is not a valid email address`
        );
      }
      if (!this.user.role) {
        this.validationMessages.push("Role is required");
      }
      if (this.user.role === "reporter" && this.user.agency_id === "None") {
        this.validationMessages.push("Agency is required for reporter role");
      }
    },
    cancelCreate(e) {
      e.preventDefault();
      this.$router.push({ path: "/users" });
    }
  }
};
</script>

<style scoped>
.user {
  width: 90%;
  margin: 0 auto;
}
</style>
