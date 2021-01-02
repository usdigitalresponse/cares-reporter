<template>
  <div>
    <GrantsOfficeHome v-if="role === 'admin'" />
    <AgencyHome v-if="role === 'reporter'" />
  </div>
</template>

<script>
import AgencyHome from '../components/AgencyHome.vue'
import GrantsOfficeHome from '../components/GrantsOfficeHome.vue'
export default {
  name: 'Home',
  components: {
    AgencyHome,
    GrantsOfficeHome
  },
  computed: {
    role: function () {
      return this.$store.getters.user.role
    }
  }
}
</script>
