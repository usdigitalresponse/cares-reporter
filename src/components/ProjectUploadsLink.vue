<template>
  <a :href="`/project_uploads/${row.id}`">{{row.code}}</a>
</template>

<script>
export default {
  name: 'ProjectUploadsLink',
  props: {
    row: Object
  }
}
</script>
