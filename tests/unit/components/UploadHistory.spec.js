import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import UploadHistory from '@/components/UploadHistory.vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('UploadHistory.vue', () => {
  it('renders', () => {
    let store = new Vuex.Store({
      getters: {
        periodNames: () => ['September, 2020', 'December, 2020'],
        agencyName: () => () => 'Test Agency'
      }
    })
    const wrapper = mount(UploadHistory, {
      store,
      localVue,
      stubs: ['router-link'],
      propsData: {
        uploads: [{ filename: 'one.xlsx' }, { filename: 'two.xlsx' }]
      }
    })
    expect(wrapper.text()).to.include('Upload')
    const history = wrapper.findAll('table tr')
    expect(history.length).to.equal(3)
    expect(history.at(1).text()).to.include('one.xlsx')
    expect(history.at(2).text()).to.include('two.xlsx')
  })
})
