import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import Agencies from '@/views/Agencies.vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Agencies.vue', () => {
  it('renders project list', () => {
    const store = new Vuex.Store({
      state: {
        agencies: [
          { id: 1, code: '001', name: 'Agency 1' },
          { id: 2, code: '002', name: 'Agency 2' }
        ]
      }
    })
    const wrapper = mount(Agencies, {
      store,
      localVue,
      stubs: ['router-link', 'router-view']
    })
    const r = wrapper.find('tbody')
    expect(r.text()).to.include('Agency 1')
    expect(r.text()).to.include('Agency 2')
  })
})
