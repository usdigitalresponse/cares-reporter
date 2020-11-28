<template>
  <div class="agency">
    <h1>Agency</h1>
    <div v-if="loading">
      Loading..
    </div>
    <div v-else>
      <DocumentForm
        type="Agency"
        :columns="fields"
        :record="editAgency"
        :id="editAgency.id"
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
  name: "Agency",
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
      editAgency: this.findAgency(id),
      errorMessage: null
    };
  },
  computed: {
    loading: function() {
      return this.id != 0 && !this.editAgency;
    },
    fields: function() {
      return [{ name: "code" }, { name: "name" }];
    }
  },
  watch: {
    "$store.state.agencies": function() {
      this.editAgency = this.findAgency(this.id);
    }
  },
  methods: {
    findAgency(id) {
      const agency = _.find(this.$store.state.agencies, { id }) || {};
      return { ...agency };
    },
    onSave(agency) {
      const updatedAgency = {
        ...this.editAgency,
        ...agency
      };
      return this.$store
        .dispatch(this.isNew ? "createAgency" : "updateAgency", updatedAgency)
        .then(() => this.onDone())
        .catch(e => (this.errorMessage = e.message));
    },
    onCancel() {
      this.onDone();
    },
    onDone() {
      this.$router.push("/agencies");
    }
  }
};
</script>

<style scoped>
.agency {
  width: 90%;
  margin: 0 auto;
}
</style>
