<template>
  <div class="project">
    <h1>Project</h1>
    <div v-if="loading">
      Loading..
    </div>
    <div v-else>
      <DocumentForm
        type="Projects"
        :columns="fields"
        :record="editProject"
        :id="editProject.id"
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
  name: "Project",
  components: {
    DocumentForm
  },
  data: function() {
    let id = 0;
    if (this.$route && this.$route.params && this.$route.params.id) {
      id = parseInt(this.$route.params.id);
    }
    return {
      id,
      isNew: !id,
      editProject: this.findProject(id),
      errorMessage: null
    };
  },
  computed: {
    loading: function() {
      return this.id != 0 && !this.editProject;
    },
    fields: function() {
      return [
        { name: "code", required: true },
        { name: "name", required: true },
        { name: "description", rows: 6 },
        {
          name: "status",
          allowedValues: [
            "Not started",
            "Less than 50% completed",
            "Completed 50% or more",
            "Fully completed"
          ]
        },
        { name: "agency_id", required: true, allowedValues: this.agencies }
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
    },
    "$store.state.agencies": function() {
      this.editProject = this.findProject(this.id);
    }
  },
  methods: {
    findProject(id) {
      const p = _.find(this.$store.state.projects, { id }) || {};
      const a =
        _.find(this.$store.state.agencies, { code: p.agency_code }) || {};
      return {
        ...p,
        agency_id: a.id
      };
    },
    onSave(project) {
      const a =
        _.find(this.$store.state.agencies, { id: project.agency_id }) || {};
      const updatedProject = {
        ...this.editProject,
        ...project,
        agency_code: a.code,
        agency_name: a.name
      };
      return this.$store
        .dispatch(
          this.isNew ? "createProject" : "updateProject",
          updatedProject
        )
        .then(() => this.onDone())
        .catch(e => (this.errorMessage = e.message));
    },
    onCancel() {
      this.onDone();
    },
    onDone() {
      this.$router.push("/projects");
    }
  }
};
</script>

<style scoped>
.project {
  width: 90%;
  margin: 0 auto;
}
</style>
