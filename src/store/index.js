/* eslint camelcase: 0 */

import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'

Vue.use(Vuex)

export function get (url) {
  const options = {
    credentials: 'include'
  }
  return fetch(url, options)
}

export function post (url, body) {
  const options = {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  return fetch(url, options).then(r => {
    if (r.ok) {
      return r.json()
    }
    return r
      .text()
      .then(text => Promise.reject(new Error(text || r.statusText)))
  })
}

export function postForm (url, formData) {
  const options = {
    method: 'POST',
    credentials: 'include',
    body: formData
  }
  return fetch(url, options)
}

export function put (url, body) {
  const options = {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  return fetch(url, options).then(r => {
    if (r.ok) {
      return r.json()
    }
    return r
      .text()
      .then(text => Promise.reject(new Error(text || r.statusText)))
  })
}

export default new Vuex.Store({
  state: {
    user: null,
    applicationSettings: {},
    documents: {},
    configuration: {},
    uploads: [],
    agencies: [],
    projects: [],
    subrecipients: [],
    reportingPeriods: [],
    messages: [],
    viewPeriodID: null
  },
  mutations: {
    setUser (state, user) {
      state.user = user
    },
    setDocuments (state, documents) {
      state.documents = documents
    },
    setConfiguration (state, configuration) {
      state.configuration = configuration
    },
    setAgencies (state, agencies) {
      state.agencies = agencies
    },
    setProjects (state, projects) {
      state.projects = projects
    },
    setSubrecipients (state, subrecipients) {
      state.subrecipients = Object.freeze(subrecipients)
    },
    setReportingPeriods (state, reportingPeriods) {
      state.reportingPeriods = reportingPeriods
    },
    setApplicationSettings (state, applicationSettings) {
      state.applicationSettings = applicationSettings
      if (!state.viewPeriodID) {
        state.viewPeiodID = applicationSettings.current_reporting_period_id
      }
    },
    setUploads (state, uploads) {
      state.uploads = uploads
    },
    addDocument (state, document) {
      state.documents = [...state.documents, document]
    },
    addDocuments (state, documents) {
      state.documents = [...state.documents, ...documents]
    },
    addUpload (state, upload) {
      state.uploads = [upload, ...state.uploads]
    },
    addUser (state, user) {
      state.configuration.users = _.sortBy(
        [...state.configuration.users, user],
        'email'
      )
    },
    updateUser (state, user) {
      state.configuration.users = _.chain(state.configuration.users)
        .map(u => (user.id === u.id ? user : u))
        .sortBy('email')
        .value()
    },
    addProject (state, project) {
      state.projects = _.sortBy([...state.projects, project], 'name')
    },
    updateProject (state, project) {
      state.projects = _.chain(state.projects)
        .map(p => (project.id === p.id ? project : p))
        .sortBy('name')
        .value()
    },
    addSubrecipient (state, subrecipient) {
      state.subrecipients = _.sortBy([...state.subrecipients, subrecipient], 'name')
    },
    updateSubrecipient (state, subrecipient) {
      state.subrecipients = _.chain(state.subrecipients)
        .map(s => (subrecipient.id === s.id ? subrecipient : s))
        .sortBy('name')
        .value()
    },
    addAgency (state, agency) {
      state.agencies = _.sortBy([...state.agencies, agency], 'name')
    },
    updateAgency (state, agency) {
      state.agencies = _.chain(state.agencies)
        .map(a => (agency.id === a.id ? agency : a))
        .sortBy('name')
        .value()
    },
    addMessage (state, message) {
      state.messages = [...state.messages, message]
    },
    setViewPeriodID (state, period_id) {
      state.viewPeriodID = period_id
    }
  },
  actions: {
    login ({ commit }, user) {
      commit('setUser', user)
      const doFetch = attr => {
        fetch(`/api/${attr}`, { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            const mutation = _.camelCase(`set_${attr}`)
            commit(mutation, data[attr])
          })
      }
      doFetch('application_settings')
      doFetch('documents')
      doFetch('configuration')
      doFetch('uploads')
      doFetch('agencies')
      doFetch('projects')
      doFetch('reporting_periods')
      doFetch('subrecipients')
    },
    logout ({ commit }) {
      fetch('/api/sessions/logout').then(() => commit('setUser', null))
    },
    refreshDocuments ({ commit }) {
      return fetch('/api/documents', { credentials: 'include' })
        .then(r => r.json())
        .then(data => commit('setDocuments', data.documents))
    },
    loadApplicationSettings ({ commit }) {
      fetch('/api/application_settings')
        .then(r => r.json())
        .then(data =>
          commit('setApplicationSettings', data.application_settings)
        )
    },
    createDocument ({ commit }, { type, content }) {
      return post(`/api/documents/${type}`, content).then(({ document }) => {
        if (document) {
          commit('addDocument', document)
        }
      })
    },
    importDocuments ({ commit }, { documents }) {
      commit('addDocuments', documents)
    },
    createUser ({ commit }, user) {
      return post('/api/users', user).then(response => {
        commit('addUser', response.user)
      })
    },
    updateUser ({ commit }, user) {
      return put(`/api/users/${user.id}`, user).then(() => {
        commit('updateUser', user)
      })
    },
    createUpload ({ commit }, formData) {
      return postForm('/api/uploads', formData)
        .then(r => {
          if (!r.ok) { throw new Error(`createUpload: ${r.statusText} (${r.status})`) }
          return r.json()
        })
        .then(response => {
          if (response.success && response.upload) {
            commit('addUpload', response.upload)
            commit(
              'addMessage',
              `File "${response.upload.filename}" uploaded successfully`
            )
          }
          return response
        })
    },
    createProject ({ commit }, project) {
      return post('/api/projects', project).then(response => {
        const p = {
          ...project,
          ...response.project
        }
        commit('addProject', p)
      })
    },
    updateProject ({ commit }, project) {
      return put(`/api/projects/${project.id}`, project).then(() => {
        commit('updateProject', project)
      })
    },
    createSubrecipient ({ commit }, subrecipient) {
      return post('/api/subrecipients', subrecipient).then(response => {
        const s = {
          ...subrecipient,
          ...response.subrecipient
        }
        commit('addSubrecipient', s)
      })
    },
    updateSubrecipient ({ commit }, subrecipient) {
      return put(`/api/subrecipients/${subrecipient.id}`, subrecipient).then(() => {
        commit('updateSubrecipient', subrecipient)
      })
    },
    createAgency ({ commit }, agency) {
      return post('/api/agencies', agency).then(response => {
        commit('addAgency', response.agency)
      })
    },
    updateAgency ({ commit }, agency) {
      return put(`/api/agencies/${agency.id}`, agency).then(() => {
        commit('updateAgency', agency)
      })
    },
    viewPeriodID ({ commit }, period_id) {
      commit('setViewPeriodID', period_id)
      const doFetch = (attr, query) => {
        const url = `/api/${attr}${query}`
        fetch(url, { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            const mutation = _.camelCase(`set_${attr}`)
            commit(mutation, data[attr])
          })
      }
      doFetch('documents', `?period_id=${period_id}`)
      doFetch('uploads', `?period_id=${period_id}`)
    }
  },
  modules: {},
  getters: {
    tableNames: state => {
      return _.map(state.configuration.tables, 'name')
    },
    periodNames: state => {
      return _.map(state.reportingPeriods, 'name')
    },
    tables: state => {
      return _.map(state.configuration.tables, t => {
        const { content, ...rest } = t
        return {
          ...rest,
          ...content
        }
      })
    },
    table: state => name => {
      return _.find(state.configuration.tables, t => t.name === name)
    },
    templates: state => {
      return state.configuration.templates
    },
    template: state => {
      return state.configuration.templates
        ? state.configuration.templates[0]
        : {}
    },
    documentGroups: state => {
      return _.groupBy(state.documents, 'type')
    },
    // subrecipients: state => {
    //   return 43
    // },
    foreignKeyValues: state => column => {
      const ds = _.filter(
        state.documents,
        d => d.type === column.foreignKey.table
      )
      return _.map(ds, e => {
        return { value: e.id, name: e.content[column.foreignKey.show] }
      })
    },
    documentByTypeAndId: state => (type, id) => {
      return _.find(state.documents, { type, id })
    },
    user: state => {
      return state.user || {}
    },
    agencyName: state => id => {
      const agency = _.find(state.agencies, { id })
      return agency ? agency.name : ''
    },
    applicationTitle: state => {
      const title = _.get(state, 'applicationSettings.title', '')
      return title || 'CARES Reporter'
    },
    currentReportingPeriod: state => {
      const id = state.applicationSettings.current_reporting_period_id
      if (!id) {
        return null
      }
      return _.find(state.reportingPeriods, { id })
    },
    viewPeriod: state => {
      const id = Number(state.viewPeriodID ||
      state.applicationSettings.current_reporting_period_id
      )

      return _.find(state.reportingPeriods, { id }) || { id: 0, name: '' }
    },
    currentPeriodID: state => {
      return Number(state.applicationSettings.current_reporting_period_id)
    },
    viewPeriodID: state => {
      return Number(state.viewPeriodID)
    },
    reportingTemplate: state => {
      return (
        state.applicationSettings.reporting_template || 'empty-template.xlsx'
      )
    },
    viewPeriodIsCurrent: state => {
      // period zero is an alias to the current reporting period.
      if (!state.viewPeriodID) {
        return true
      }
      return Number(state.viewPeriodID) ===
        Number(state.applicationSettings.current_reporting_period_id)
    }
  }
})
