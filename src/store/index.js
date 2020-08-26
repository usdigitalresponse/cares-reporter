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
    documents: {},
    configuration: {},
    uploads: []
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
      state.uploads = [...state.uploads, upload];
    }
  },
  actions: {
    login({ commit }, user) {
      commit("setUser", user);
      fetch("/api/documents", { credentials: "include" })
        .then(r => r.json())
        .then(({ documents }) => {
          commit("setDocuments", documents);
        });
      fetch("/api/configuration", { credentials: "include" })
        .then(r => r.json())
        .then(configuration => {
          commit("setConfiguration", configuration);
        });
      fetch("/api/uploads", { credentials: "include" })
        .then(r => r.json())
        .then(({ uploads }) => {
          commit("setUploads", uploads);
        });
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
        .then(r => r.json())
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
    }
  }
});
