<template>
  <div class="subrecipient">
    <h1>Subrecipient</h1>
    <div v-if="loading">
      Loading..
    </div>
    <div v-else>
      <DocumentForm
        type="Subrecipients"
        :columns="fields"
        :record="editSubrecipient"
        :id="editSubrecipient.id"
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
import DocumentForm from '../components/DocumentForm'
import _ from 'lodash'
export default {
  name: 'Subrecipient',
  components: {
    DocumentForm
  },
  data: function () {
    let id = 0
    if (this.$route && this.$route.params && this.$route.params.id) {
      id = parseInt(this.$route.params.id)
    }
    return {
      id,
      isNew: !id,
      editSubrecipient: this.findSubrecipient(id),
      errorMessage: null
    }
  },
  computed: {
    loading: function () {
      return this.id !== 0 && _.isEmpty(this.editSubrecipient)
    },
    fields: function () {
      return [
        { name: 'identification_number', required: true },
        { name: 'legal_name', required: true },
        { name: 'duns_number' },
        { name: 'address_line_1' },
        { name: 'address_line_2' },
        { name: 'address_line_3' },
        { name: 'city_name' },
        { name: 'state_code' },
        { name: 'zip' },
        { name: 'country_name' },
        { name: 'organization_type' }
      ]
    }
  },
  watch: {
    '$store.state.subrecipients': function () {
      this.editSubrecipient = this.findSubrecipient(this.id)
    }
  },
  methods: {
    findSubrecipient (id) {
      return _.find(this.$store.state.subrecipients, { id }) || {}
    },
    onSave (subrecipient) {
      const updatedSubrecipient = {
        ...this.editSubrecipient,
        ...subrecipient
      }
      return this.$store
        .dispatch(
          this.isNew ? 'createSubrecipient' : 'updateSubrecipient',
          updatedSubrecipient
        )
        .then(() => this.onDone())
        .catch(e => (this.errorMessage = e.message))
    },
    onCancel () {
      this.onDone()
    },
    onDone () {
      this.$router.push('/subrecipients')
    }
  }
}
</script>

<style scoped>
.subrecipient {
  width: 90%;
  margin: 0 auto;
}
</style>
