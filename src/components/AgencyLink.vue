<template>
  <a :href="`/agencies/${row.id}`">Edit</a>
</template>

<script>
export default {
  name: 'EditLink',
  props: {
    row: Object
  }
}
</script>
