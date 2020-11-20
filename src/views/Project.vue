<template>
  <div class="project">
    <h1>Project</h1>
    <div v-if="!editProject">
      Loading..
    </div>
    <div v-else>
      <DocumentForm
        type="Projects"
        :columns="fields"
        :record="editProject"
        :id="editProject.id"
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
  name: "Project",
  components: {
    DocumentForm
  },
  data: function() {
    const id = parseInt(this.$route.params.id);
    return {
      id,
      editProject: this.findProject(id)
    };
  },
  computed: {
    fields: function() {
      return [
        { name: "code" },
        { name: "name" },
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
    "$store.state.projects": function() {
      this.editProject = this.findProject(this.id);
    }
  },
  methods: {
    findProject(id) {
      return _.find(this.$store.state.projects, { id });
    },
    onSave() {},
    onCancel() {
      this.$router.push("/projects");
    },
    onDone() {}
  }
};
</script>

<style scoped>
.project {
  width: 90%;
  margin: 0 auto;
}
</style>
