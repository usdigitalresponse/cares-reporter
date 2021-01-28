import Vue from 'vue'
import VueRouter from 'vue-router'

import Agencies from '../views/Agencies.vue'
import Agency from '../views/Agency.vue'
import Documents from '../views/Documents.vue'
import Home from '../views/Home.vue'
import ImportFile from '../views/ImportFile.vue'
import Login from '../views/Login.vue'
import NewUpload from '../views/NewUpload.vue'
import Project from '../views/Project.vue'
import Projects from '../views/Projects.vue'
import ProjectUploads from '../views/ProjectUploads.vue'
import Upload from '../views/Upload.vue'
import FixSubrecipients from '../views/FixSubrecipients.vue'
import ReportingPeriods from '../views/ReportingPeriods.vue'
import Subrecipient from '../views/Subrecipient.vue'
import Subrecipients from '../views/Subrecipients.vue'
import User from '../views/User.vue'
import Users from '../views/Users.vue'
import UploadValidations from '../views/UploadValidations.vue'

import store from '../store'

Vue.use(VueRouter)

const routes = [
  { path: '/login', name: 'Login', component: Login },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresLogin: true }
  },
  {
    path: '/documents/:type',
    name: 'Documents',
    component: Documents,
    meta: { requiresLogin: true }
  },
  {
    path: '/new_upload',
    name: 'NewUpload',
    component: NewUpload,
    meta: { requiresLogin: true }
  },
  {
    path: '/uploads/:id',
    name: 'Upload',
    component: Upload,
    meta: { requiresLogin: true }
  },
  {
    path: '/imports/:id',
    name: 'ImportFile',
    component: ImportFile,
    meta: { requiresLogin: true }
  },
  {
    path: '/agencies',
    name: 'Agencies',
    component: Agencies,
    meta: { requiresLogin: true }
  },
  {
    path: '/new_agency',
    name: 'NewAgency',
    component: Agency,
    meta: { requiresLogin: true }
  },
  {
    path: '/agencies/:id',
    name: 'Agency',
    component: Agency,
    meta: { requiresLogin: true }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: Projects,
    meta: { requiresLogin: true }
  },
  {
    path: '/new_project',
    name: 'NewProject',
    component: Project,
    meta: { requiresLogin: true }
  },
  {
    path: '/projects/:id',
    name: 'Project',
    component: Project,
    meta: { requiresLogin: true }
  },
  {
    path: '/project_uploads/:id',
    name: 'ProjectUploads',
    component: ProjectUploads,
    meta: { requiresLogin: true }
  },
  {
    path: '/reporting_periods',
    name: 'ReportingPeriods',
    component: ReportingPeriods,
    meta: { requiresLogin: true }
  },
  {
    path: '/subrecipients',
    name: 'Subrecipients',
    component: Subrecipients,
    meta: { requiresLogin: true }
  },
  {
    path: '/subrecipients/:id',
    name: 'Subrecipient',
    component: Subrecipient,
    meta: { requiresLogin: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
    meta: { requiresLogin: true }
  },
  {
    path: '/new_user',
    name: 'NewUser',
    component: User,
    meta: { requiresLogin: true }
  },
  {
    path: '/users/:id',
    name: 'User',
    component: User,
    meta: { requiresLogin: true }
  },
  {
    path: '/fix-subrecipients',
    name: 'FixSubrecipients',
    component: FixSubrecipients,
    meta: { requiresLogin: true }
  },
  {
    path: '/upload-validations',
    name: 'UploadValidations',
    component: UploadValidations,
    meta: { requiresLogin: true }
  },
  {
    path: '/upload-validations/:id',
    name: 'UploadValidationsDetail',
    component: UploadValidations,
    meta: { requiresLogin: true }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

function loggedIn () {
  return store.state.user != null
}

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresLogin)) {
    if (!loggedIn()) {
      next({
        path: '/login'
      })
    } else {
      next()
    }
  } else {
    next() // make sure to always call next()!
  }
})

export default router
