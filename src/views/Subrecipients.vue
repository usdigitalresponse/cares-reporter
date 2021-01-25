<template>
  <div class="data">
    <h2>Sub Recipients</h2>
    <div>
      <FastTable v-if="subrecipients" :table="table" :rows="subrecipients" :user="user" />
    </div>
  </div>
</template>

<script>
import FastTable from '../components/FastTable'
export default {
  name: 'Subrecipients',
  components: {
    FastTable
  },
  data: function () {
    const user = this.$store.state.user
    return {
      user,
      table: {
        views: [],
        columns: [
          { name: 'identification_number', label: 'Identification Number' },
          { name: 'duns_number', label: 'Duns Number' },
          { name: 'legal_name', label: 'Legal Name' },
          { name: 'address_line_1', label: 'Address Line 1' },
          { name: 'address_line_2', label: 'Address Line 2' },
          { name: 'address_line_3', label: 'Address Line 3' },
          { name: 'city_name', label: 'City Name' },
          { name: 'state_code', label: 'State' },
          { name: 'zip', label: 'Zip' },
          { name: 'country_name', label: 'Country' },
          { name: 'organization_type', label: 'Organization Type' },
          { href: (row) => `/subrecipients/${row.id}`, label: 'Edit' }
        ]
      }
    }
  },
  computed: {
    subrecipients: {
      get: function () {
        return this.$store.state.subrecipients
      },
      set: function (subrecipients) {
      }
    }
  }
}
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
