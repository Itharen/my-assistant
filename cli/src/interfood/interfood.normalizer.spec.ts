import { normalizeInterfoodMenu } from './interfood.normalizer.js';
import { menuFixture } from './interfood.test-fixtures.js';

describe('normalizeInterfoodMenu', () => {
  it('keeps stable identifiers, category context and portion/per-100g nutrition', () => {
    const menu = normalizeInterfoodMenu(menuFixture(35173, '2026-09-02', 'Teszt étel'), 2026, 36);

    expect(menu.itemCount).toBe(1);
    expect(menu.dates).toEqual(['2026-09-02']);
    expect(menu.items[0]).toEqual(jasmine.objectContaining({
      menuItemId: 35173,
      foodId: 901,
      foodName: 'Teszt étel',
      categoryCode: 'A1',
      categoryGroupName: 'Főételek',
      portionClass: 'unspecified',
      priceHuf: 1990,
    }));
    expect(menu.items[0]?.components[0]).toEqual(jasmine.objectContaining({
      name: 'Teszt étel',
      weightG: 420,
      portion: jasmine.objectContaining({ energyKcal: 650, proteinG: 42 }),
      per100g: jasmine.objectContaining({ energyKcal: 154.76, proteinG: 10 }),
    }));
  });

  it('keeps small and linked full-portion menu occurrences separate', () => {
    const fixture = menuFixture(100, '2026-09-02', 'Gombapaprikás') as {
      data: Record<string, { categories: Array<Record<string, unknown>> }>;
    };
    const categories: Array<Record<string, unknown>> = fixture.data['1']?.categories ?? [];
    const fullCategory: Record<string, unknown> | undefined = categories[0];
    if (!fullCategory) throw new Error('Fixture category is missing.');
    fullCategory.id = 37;
    fullCategory.code = 'A';
    fullCategory.name = 'Főétel';
    fullCategory.items = [{ ...((fullCategory.items as Array<Record<string, unknown>>)[0]), menu_category_id: 37 }];
    categories.push({
      ...fullCategory,
      id: 38,
      code: 'AK',
      name: 'Kis adag',
      big_portion_category_id: 37,
      items: [{ ...((fullCategory.items as Array<Record<string, unknown>>)[0]), id: 101, menu_category_id: 38 }],
    });

    const menu = normalizeInterfoodMenu(fixture, 2026, 36);

    expect(menu.itemCount).toBe(2);
    expect(menu.items.map((item) => [item.menuItemId, item.portionClass])).toEqual([
      [100, 'full'],
      [101, 'small'],
    ]);
    expect(menu.items[1]?.relatedFullPortionCategoryId).toBe(37);
  });

  it('deduplicates a menu item repeated by the upstream grouping response', () => {
    const fixture = menuFixture(10, '2026-09-03', 'Duplikált étel');
    const data = (fixture as { data: Record<string, unknown> }).data;
    data['another-group'] = data['1'];

    const menu = normalizeInterfoodMenu(fixture, 2026, 36);

    expect(menu.itemCount).toBe(1);
  });
});
