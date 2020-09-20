<template>
  <div class="data">
    <h2>{{ titleize(type) }}</h2>
    <DataTable v-if="table" :table="table" :rows="documents" :user="user" />
  </div>
</template>

<script>
import { titleize } from "../helpers/form-helpers";
import DataTable from "../components/DataTable";
import _ from "lodash";
export default {
  name: "Documents",
  components: {
    DataTable
  },
  data: function() {
    const { type } = this.$route.params;
    const table = this.getTable(type);
    const user = this.$store.state.user;
    return {
      type,
      table,
      user
    };
  },
  watch: {
    "$route.params.type": function(type) {
      this.type = type;
      this.table = this.getTable(type);
    },
    "$store.state.configuration.tables": function() {
      this.table = this.getTable(this.type);
    }
  },
  computed: {
    documents: function() {
      return _.chain(this.$store.state.documents)
        .filter(d => d.type === this.type)
        .map(d => {
          const { content, ...rest } = d;
          return {
            ...rest,
            ...content
          };
        })
        .value();
    }
  },
  methods: {
    titleize,
    getTable: function(name) {
      return _.find(this.$store.getters.tables, t => t.name === name);
    }
  }
};
</script>

<style scoped>
.data {
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
