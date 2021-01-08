const { removeDuplicates } = requireSrc(__filename)
const expect = require('chai').expect

describe('services/removeDuplicates', () => {
  it('finds no duplicates', async () => {
    const documents = [
      { type: 'test', content: { id: '1001' } },
      { type: 'test', content: { id: '1002' } },
      { type: 'test', content: { id: '1003' } }
    ]
    const mockGetFn = () => Promise.resolve([])
    const results = await removeDuplicates(mockGetFn, 'test', 'id', documents)
    expect(results.length).to.equal(3)
  })
  it('finds all duplicates', async () => {
    const documents = [
      { type: 'test', content: { id: '1001' } },
      { type: 'test', content: { id: '1002' } },
      { type: 'test', content: { id: '1003' } }
    ]
    const mockGetFn = () => Promise.resolve(documents)
    const results = await removeDuplicates(mockGetFn, 'test', 'id', documents)
    expect(results.length).to.equal(0)
  })
  it('finds some duplicates', async () => {
    const documents = [
      { type: 'test', content: { id: '1001' } },
      { type: 'test', content: { id: '1002' } },
      { type: 'test', content: { id: '1003' } }
    ]
    const mockGetFn = () => Promise.resolve(documents.slice(1))
    const results = await removeDuplicates(mockGetFn, 'test', 'id', documents)
    expect(results.length).to.equal(1)
  })
})
