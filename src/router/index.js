import Vue from "vue";
import VueRouter from "vue-router";

import Agencies from "../views/Agencies.vue";
import Configuration from "../views/Configuration.vue";
import CreateDocument from "../views/CreateDocument.vue";
import Document from "../views/Document.vue";
import Documents from "../views/Documents.vue";
import Home from "../views/Home.vue";
import ImportFile from "../views/ImportFile.vue";
import Login from "../views/Login.vue";
import NewUpload from "../views/NewUpload.vue";
import NewUser from "../views/NewUser.vue";
import Projects from "../views/Projects.vue";
import Upload from "../views/Upload.vue";
import Users from "../views/Users.vue";

import store from "../store";

Vue.use(VueRouter);

const routes = [
  { path: "/login", name: "Login", component: Login },
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { requiresLogin: true }
  },
  {
    path: "/documents/:type",
    name: "Documents",
    component: Documents,
    meta: { requiresLogin: true }
  },
  {
    path: "/documents/:type/:id",
    name: "Document",
    component: Document,
    meta: { requiresLogin: true }
  },
  {
    path: "/configuration",
    name: "Config",
    component: Configuration,
    meta: { requiresLogin: true }
  },
  {
    path: "/create/:type",
    name: "CreateDocument",
    component: CreateDocument,
    meta: { requiresLogin: true }
  },
  {
    path: "/new_upload/:id",
    name: "NewUpload",
    component: NewUpload,
    meta: { requiresLogin: true }
  },
  {
    path: "/uploads/:id",
    name: "Upload",
    component: Upload,
    meta: { requiresLogin: true }
  },
  {
    path: "/imports/:id",
    name: "ImportFile",
    component: ImportFile,
    meta: { requiresLogin: true }
  },
  {
    path: "/agencies",
    name: "Agencies",
    component: Agencies,
    meta: { requiresLogin: true }
  },
  {
    path: "/projects",
    name: "Projects",
    component: Projects,
    meta: { requiresLogin: true }
  },
  {
    path: "/users",
    name: "Users",
    component: Users,
    meta: { requiresLogin: true }
  },
  {
    path: "/new_user",
    name: "NewUser",
    component: NewUser,
    meta: { requiresLogin: true }
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

function loggedIn() {
  return store.state.user != null;
}

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresLogin)) {
    if (!loggedIn()) {
      next({
        path: "/login"
      });
    } else {
      next();
    }
  } else {
    next(); // make sure to always call next()!
  }
});

export default router;
