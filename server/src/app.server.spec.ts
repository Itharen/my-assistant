// Sanity baseline spec — biztosítja hogy a jasmine + build chain működik.
// Real spec-ek a controllers / data-services mellé jönnek később.

describe('| my-assistant server — sanity baseline', () => {
  it('| jasmine + tsc build chain működik', () => {
    expect(1 + 1).toBe(2);
  });

  it('| Node globals elérhetők (process)', () => {
    expect(typeof process).toBe('object');
    expect(typeof process.version).toBe('string');
  });
});
