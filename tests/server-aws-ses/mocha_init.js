// this is invoked by mocha_wrapper.sh

module.exports.mochaHooks = {

  beforeAll: async function () {
    //
  },
  afterAll: done => {
    done()
  }
}
