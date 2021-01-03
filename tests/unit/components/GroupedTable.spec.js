import { expect } from 'chai'
import { mount } from '@vue/test-utils'
import GroupedTable from '@/components/GroupedTable.vue'

describe('GroupedTable.vue', () => {
  it('renders column titles', () => {
    const wrapper = mount(GroupedTable, {
      propsData: {
        name: 'records',
        columns: [{ name: 'category' }, { name: 'name' }],
        rows: [],
        groupBy: 'category'
      }
    })
    const text = wrapper.text()
    expect(text).to.include('Category')
    expect(text).to.include('Name')
  })
  it('renders row values', () => {
    const wrapper = mount(GroupedTable, {
      propsData: {
        name: 'records',
        columns: [{ name: 'category' }, { name: 'name' }],
        rows: [
          { category: 'Red Giant', name: 'Betelgeuse' },
          { category: 'Red Giant', name: 'Aldebaran' },
          { category: 'Yellow Dwarf', name: 'Sun' }
        ],
        groupBy: 'category'
      }
    })
    const text = wrapper.text()
    expect(text).to.include('Category: Red Giant')
    expect(text).to.include('Category: Yellow Dwarf')
  })
})
