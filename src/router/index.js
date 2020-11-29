import Vue from "vue";
import VueRouter from "vue-router";

import Agencies from "../views/Agencies.vue";
import Agency from "../views/Agency.vue";
import Documents from "../views/Documents.vue";
import Home from "../views/Home.vue";
import ImportFile from "../views/ImportFile.vue";
import Login from "../views/Login.vue";
import NewUpload from "../views/NewUpload.vue";
import Project from "../views/Project.vue";
import Projects from "../views/Projects.vue";
import ProjectUploads from "../views/ProjectUploads.vue";
import Upload from "../views/Upload.vue";
import User from "../views/User.vue";
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
    path: "/new_upload",
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
    path: "/new_agency",
    name: "NewAgency",
    component: Agency,
    meta: { requiresLogin: true }
  },
  {
    path: "/agencies/:id",
    name: "Agency",
    component: Agency,
    meta: { requiresLogin: true }
  },
  {
    path: "/projects",
    name: "Projects",
    component: Projects,
    meta: { requiresLogin: true }
  },
  {
    path: "/new_project",
    name: "NewProject",
    component: Project,
    meta: { requiresLogin: true }
  },
  {
    path: "/projects/:id",
    name: "Project",
    component: Project,
    meta: { requiresLogin: true }
  },
  {
    path: "/project_uploads/:id",
    name: "ProjectUploads",
    component: ProjectUploads,
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
    component: User,
    meta: { requiresLogin: true }
  },
  {
    path: "/users/:id",
    name: "User",
    component: User,
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
