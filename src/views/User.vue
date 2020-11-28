<template>
  <div class="user">
    <h1>User</h1>
    <div v-if="loading">
      Loading..
    </div>
    <div v-else>
      <DocumentForm
        type="Users"
        :columns="fields"
        :record="editUser"
        :id="editUser.id"
        :isNew="isNew"
        :onSave="onSave"
        :onCancel="onCancel"
        :onDone="onDone"
        :errorMessage="errorMessage"
      />
    </div>
  </div>
</template>

<script>
import DocumentForm from "../components/DocumentForm";
import _ from "lodash";
export default {
  name: "User",
  components: {
    DocumentForm
  },
  data() {
    let id = 0;
    if (this.$route && this.$route.params && this.$route.params.id) {
      id = parseInt(this.$route.params.id);
    }
    return {
      id,
      isNew: !id,
      editUser: this.findUser(id),
      errorMessage: null
    };
  },
  computed: {
    loading: function() {
      return this.id != 0 && !this.editUser;
    },
    fields: function() {
      return [
        { name: "email", required: true },
        { name: "name" },
        { name: "role", allowedValues: this.roles },
        { name: "agency_id", allowedValues: this.agencies }
      ];
    },
    agencies: function() {
      return [{ value: 0, name: "None" }].concat(
        _.map(this.$store.state.agencies, a => {
          return { value: a.id, name: a.name };
        })
      );
    },
    roles: function() {
      return _.map(this.$store.state.configuration.roles, r => {
        return { value: r.name, name: r.name };
      });
    }
  },
  watch: {
    "$store.state.configuration.users": function() {
      this.editUser = this.findUser(this.id);
    }
  },
  methods: {
    findUser(id) {
      return _.find(this.$store.state.configuration.users, { id }) || {};
    },
    getAgencies() {
      this.agencyIds = [
        { value: "None", name: "None" },
        ..._.map(this.$store.state.agencies, "id")
      ];
    },
    onSave(user) {
      let updatedUser = {
        ...this.editUser,
        ...user
      };
      if (!updatedUser.agency_id) {
        delete updatedUser.agency_id;
      }
      return this.$store
        .dispatch(this.isNew ? "createUser" : "updateUser", updatedUser)
        .then(() => this.onDone())
        .catch(e => (this.errorMessage = e.message));
    },
    onCancel() {
      return this.onDone();
    },
    onDone() {
      return this.$router.push("/users");
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
