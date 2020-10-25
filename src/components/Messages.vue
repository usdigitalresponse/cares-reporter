<template>
  <div>
    <div
      :key="message"
      v-for="message in messages"
      class="alert alert-success alert-dismissable"
    >
      {{ message }}
      <button
        type="button"
        class="close"
        data-dismiss="alert"
        aria-label="Close"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "Messages",
  computed: {
    messages() {
      return this.$store.state.messages;
    }
  }
};
</script>
