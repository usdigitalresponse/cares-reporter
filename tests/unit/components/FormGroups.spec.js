import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import FormGroups from '@/components/FormGroups.vue'

describe('FormGroups.vue', () => {
  it('renders column names', () => {
    const wrapper = shallowMount(FormGroups, {
      propsData: {
        columns: [{ name: 'description' }],
        record: {}
      }
    })
    const text = wrapper.text()
    expect(text).to.include('Description')
  })
  it('renders existing value', () => {
    const wrapper = shallowMount(FormGroups, {
      propsData: {
        columns: [{ name: 'description' }],
        record: { description: 'Acme' }
      }
    })
    const i = wrapper.find('input')
    expect(i.element.value).to.equal('Acme')
  })
  it('renders foreign key values', () => {
    const values = ['None', 'Foo', 'Bar']
    const lookup = () => {
      return values.map((name, index) => {
        return { value: index, name }
      })
    }
    // const lookup =
    // _.chain(this.$store, `state.documents.${column.foreignKey.table}`, [])
    // return _.map(lookup, (e) => {
    //    return { value: e.id, name: e[column.foreignKey.show] }
    // })
    const wrapper = shallowMount(FormGroups, {
      propsData: {
        columns: [
          { name: 'name' },
          { name: 'type', foreignKey: { table: 'types', show: 'name' } }
        ],
        record: {},
        foreignKeyValues: lookup
      }
    })
    const s = wrapper.findAll('select')
    expect(s.length).to.equal(1)
    const os = wrapper.findAll('option')
    expect(os.length).to.equal(3)
    expect(os.at(0).text()).to.equal('None')
    expect(os.at(1).text()).to.equal('Foo')
    expect(os.at(2).text()).to.equal('Bar')
  })
})
