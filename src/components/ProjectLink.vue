<template>
  <a :href="`/projects/${row.id}`">Edit</a>
</template>

<script>
export default {
  name: 'ProjectLink',
  props: {
    row: Object
  }
}
</script>
