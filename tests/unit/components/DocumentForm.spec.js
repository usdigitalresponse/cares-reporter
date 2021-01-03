import { expect } from 'chai'
import { mount } from '@vue/test-utils'
import DocumentForm from '@/components/DocumentForm.vue'

describe('DocumentForm.vue', () => {
  it('renders a form for a new record', () => {
    const wrapper = mount(DocumentForm, {
      propsData: {
        type: 'products',
        columns: [{ name: 'name' }, { name: 'description' }],
        record: {},
        isNew: true
      }
    })
    const r = wrapper.findAll('input')
    expect(r.length).to.equal(2) // has two input fields
    const b = wrapper.findAll('button.btn-primary')
    expect(b.length).to.equal(1) // has submit button
  })
})
