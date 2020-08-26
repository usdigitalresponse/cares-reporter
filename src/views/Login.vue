<template>
  <div class="login">
    <h1>Login</h1>
    <form @submit="login">
      <div class="form-group">
        <input
          class="form-control"
          id="email"
          name="email"
          placeholder="Email address"
          v-model="email"
          autofocus
        />
      </div>
      <div class="form-group">
        <button class="btn btn-primary" type="Submit" @click="login">
          Send email with login link
        </button>
      </div>
    </form>
    <div :class="messageClass" v-if="message">{{ message }}</div>
  </div>
</template>

<script>
export default {
  name: "Login",
  data: function() {
    return {
      email: "",
      message: null,
      messageClass: ""
    };
  },
  methods: {
    login: function(e) {
      e.preventDefault();
      const body = JSON.stringify({
        email: this.email
      });
      const headers = {
        "Content-Type": "application/json"
      };
      fetch("/api/sessions", { method: "POST", headers, body })
        .then(r => {
          if (!r.ok) throw new Error(`login: ${r.statusText} (${r.status})`);
          return r;
        })
        .then(r => r.json())
        .then(r => {
          this.email = "";
          this.message = r.message;
          this.messageClass = r.success
            ? "alert alert-success"
            : "alert alert-danger";
        })
        .catch(e => {
          console.log("error:", e.message);
          this.message = e.message;
          this.messageClass = "alert alert-danger";
        });
    }
  }
};
</script>

<style scoped>
.login {
  margin: 100px auto;
  width: 90%;
}
</style>
