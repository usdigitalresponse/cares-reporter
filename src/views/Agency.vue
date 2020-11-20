<template>
  <div class="agency">
    <h1>Agency</h1>
    <div v-if="!editAgency">
      Loading..
    </div>
    <div v-else>
      <DocumentForm
        type="Agency"
        :columns="fields"
        :record="editAgency"
        :id="editAgency.id"
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
  name: "Agency",
  components: {
    DocumentForm
  },
  data: function() {
    const id = parseInt(this.$route.params.id);
    return {
      id,
      fields: [{ name: "code" }, { name: "name" }],
      editAgency: this.findAgency(id)
    };
  },
  watch: {
    "$store.state.agencies": function() {
      this.editAgency = this.findAgency(this.id);
    }
  },
  methods: {
    findAgency(id) {
      return _.find(this.$store.state.agencies, { id });
    },
    onSave() {},
    onCancel() {
      this.$router.push("/agencies");
    },
    onDone() {}
  }
};
</script>

<style scoped>
.agency {
  width: 90%;
  margin: 0 auto;
}
</style>
