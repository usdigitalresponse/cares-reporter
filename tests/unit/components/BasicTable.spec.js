import { expect } from 'chai'
import Vue from 'vue'
import { mount } from '@vue/test-utils'
import BasicTable from '@/components/BasicTable.vue'

describe('BasicTable.vue', () => {
  it('renders column titles', () => {
    const wrapper = mount(BasicTable, {
      propsData: {
        name: 'records',
        columns: [{ name: 'name' }, { name: 'description' }],
        rows: []
      }
    })
    const text = wrapper.text()
    expect(text).to.include('Name')
    expect(text).to.include('Description')
  })
  it('renders row values', () => {
    const wrapper = mount(BasicTable, {
      propsData: {
        name: 'records',
        columns: [{ name: 'name' }],
        rows: [{ name: 'Moe' }, { name: 'Larry' }, { name: 'Curley' }]
      }
    })
    const text = wrapper.text()
    expect(text).to.include('Moe')
    expect(text).to.include('Larry')
    expect(text).to.include('Curley')
  })
  it('can lookup foreign key values', () => {
    const wrapper = mount(BasicTable, {
      stubs: ['router-link'],
      propsData: {
        name: 'records',
        columns: [
          { name: 'type_id', foreignKey: { tableName: 'type', show: 'name' } }
        ],
        rows: [{ type_id: 1 }, { type_id: 2 }],
        lookup: (column, row) => {
          return row.type_id === 1 ? 'Shirts' : 'Pants'
        }
      }
    })
    const text = wrapper.text()
    expect(text).to.include('Shirts')
    expect(text).to.include('Pants')
  })
  it('can render a component', () => {
    const CustomComponent = Vue.component('custom-component', {
      functional: true,
      render: createElement => createElement('span', 'A Custom Component')
    })
    const wrapper = mount(BasicTable, {
      propsData: {
        name: 'records',
        columns: [{ component: CustomComponent }],
        rows: [{ id: 1 }]
      }
    })
    const text = wrapper.text()
    expect(text).to.include('A Custom Component')
  })
})
