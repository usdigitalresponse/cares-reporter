import Vue from "vue";
import Vuex from "vuex";
import _ from "lodash";

Vue.use(Vuex);

export function get(url) {
  const options = {
    credentials: "include"
  };
  return fetch(url, options);
}

export function post(url, body) {
  const options = {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
  return fetch(url, options);
}

export function postForm(url, formData) {
  const options = {
    method: "POST",
    credentials: "include",
    body: formData
  };
  return fetch(url, options);
}

export default new Vuex.Store({
  state: {
    user: null,
    applicationSettings: {},
    documents: {},
    configuration: {},
    uploads: [],
    agencies: [],
    reportingPeriods: []
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setDocuments(state, documents) {
      state.documents = documents;
    },
    setConfiguration(state, configuration) {
      state.configuration = configuration;
    },
    setAgencies(state, agencies) {
      state.agencies = agencies;
    },
    setReportingPeriods(state, reportingPeriods) {
      state.reportingPeriods = reportingPeriods;
    },
    setApplicationSettings(state, applicationSettings) {
      state.applicationSettings = applicationSettings;
    },
    setUploads(state, uploads) {
      state.uploads = uploads;
    },
    addDocument(state, document) {
      state.documents = [...state.documents, document];
    },
    addDocuments(state, documents) {
      state.documents = [...state.documents, ...documents];
    },
    addUpload(state, upload) {
      state.uploads = [upload, ...state.uploads];
    }
  },
  actions: {
    login({ commit }, user) {
      commit("setUser", user);
      const doFetch = attr => {
        fetch(`/api/${attr}`, { credentials: "include" })
          .then(r => r.json())
          .then(data => {
            const mutation = _.camelCase(`set_${attr}`);
            commit(mutation, data[attr]);
          });
      };
      doFetch("application_settings");
      doFetch("documents");
      doFetch("configuration");
      doFetch("uploads");
      doFetch("agencies");
      doFetch("reporting_periods");
    },
    logout({ commit }) {
      fetch("/api/sessions/logout").then(() => commit("setUser", null));
    },
    createDocument({ commit }, { type, content }) {
      return post(`/api/documents/${type}`, content)
        .then(r => r.json())
        .then(({ document }) => {
          if (document) {
            commit("addDocument", document);
          }
        });
    },
    importDocuments({ commit }, { documents }) {
      commit("addDocuments", documents);
    },
    createUpload({ commit }, formData) {
      return postForm("/api/uploads", formData)
        .then(r => {
          if (!r.ok)
            throw new Error(`createUpload: ${r.statusText} (${r.status})`);
          return r.json();
        })
        .then(response => {
          if (response.upload) {
            commit("addUpload", response.upload);
          }
          return response;
        });
    }
  },
  modules: {},
  getters: {
    tableNames: state => {
      return _.map(state.configuration.tables, "name");
    },
    tables: state => {
      return _.map(state.configuration.tables, t => {
        const { content, ...rest } = t;
        return {
          ...rest,
          ...content
        };
      });
    },
    table: state => name => {
      return _.find(state.configuration.tables, t => t.name == name);
    },
    templates: state => {
      return state.configuration.templates;
    },
    template: state => id => {
      return _.find(state.configuration.templates, t => t.id == id);
    },
    documentGroups: state => {
      return _.groupBy(state.documents, "type");
    },
    foreignKeyValues: state => column => {
      const ds = _.filter(
        state.documents,
        d => d.type === column.foreignKey.table
      );
      return _.map(ds, e => {
        return { value: e.id, name: e.content[column.foreignKey.show] };
      });
    },
    documentByTypeAndId: state => (type, id) => {
      return _.find(state.documents, { type, id });
    },
    user: state => {
      return state.user || {};
    },
    agencyName: state => id => {
      const agency = _.find(state.agencies, { id });
      return agency ? agency.name : "";
    },
    applicationTitle: state => {
      const title = _.get(state, "applicationSettings.title", "");
      return _.isEmpty(title) ? "CARES Reporter" : `CARES Reporter: ${title}`;
    },
    currentReportingPeriod: state => {
      const id = state.applicationSettings.current_reporting_period_id;
      if (!id) {
        return null;
      }
      return _.find(state.reportingPeriods, { id });
    }
  }
});
