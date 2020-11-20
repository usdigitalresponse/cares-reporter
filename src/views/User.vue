<template>
  <div class="user">
    <h1>User</h1>
    <div v-if="!editUser">
      Loading..
    </div>
    <div v-else>
      <DocumentForm
        type="Users"
        :columns="fields"
        :record="editUser"
        :id="editUser.id"
        :isNew="false"
        :onSave="onSave"
        :onCancel="onCancel"
        :onDone="onDone"
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
    const id = parseInt(this.$route.params.id);
    return {
      id,
      editUser: this.findUser(id)
    };
  },
  computed: {
    fields: function() {
      return [
        { name: "email" },
        { name: "name" },
        { name: "role" },
        { name: "agency_id", allowedValues: this.agencies }
      ];
    },
    agencies: function() {
      return _.map(this.$store.state.agencies, a => {
        return { value: a.id, name: a.name };
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
      return _.find(this.$store.state.configuration.users, { id });
    },
    getAgencies() {
      this.agencyIds = [ { value: "None", name: "None" }, ..._.map(this.$store.state.agencies, "id") ];
    },
    onSave() {}, // remember to delete agency_id if "None"
    onCancel() {
      this.$router.push("/users");
    },
    onDone() {}
  }
};
</script>

<style scoped>
.user {
  width: 90%;
  margin: 0 auto;
}
</style>
