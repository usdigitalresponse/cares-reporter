<template>
  <div class="home">
    <div>
      <h2>Dashboard</h2>
    </div>
  </div>
</template>

<script>
export default {
  name: "SuperuserHome",
  components: {},
  data: function() {
    return {
      currentReportingPeriod: this.$store.getters.currentReportingPeriod
    };
  },
  computed: {},
  watch: {},
  methods: {}
};
</script>

<style scoped>
.home {
  width: 90%;
  margin: 0 auto;
}
</style>
