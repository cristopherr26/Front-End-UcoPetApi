import { NAVIGATION, findModule, isReady, processorOf } from './navigation';

describe('NAVIGATION', () => {
  const modules = NAVIGATION.flatMap((group) => group.modules);

  it('has the five processors', () => {
    expect(NAVIGATION.map((group) => group.processor)).toEqual([
      'Usuarios',
      'Salud',
      'Comercial',
      'Inventario',
      'Pagos',
    ]);
  });

  it('uses each path and each entity once', () => {
    const paths = modules.map((module) => module.path);
    const entities = modules.map((module) => module.entity);
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(entities).size).toBe(entities.length);
  });

  it('loads every module from its own routes file', async () => {
    for (const module of modules) {
      const routes = await module.loadChildren();
      expect(Array.isArray(routes)).toBe(true);
    }
  });

  it('gives every module a role and an API route', () => {
    modules.forEach((module) => {
      expect(module.roles.length).toBeGreaterThan(0);
      expect(module.api.length).toBeGreaterThan(0);
    });
  });

  it('finds a module and its processor by path', () => {
    const catalog = findModule('catalogo');
    expect(catalog?.entity).toBe('product');
    expect(catalog && isReady(catalog)).toBe(true);
    expect(isReady(findModule('agenda')!)).toBe(false);
    expect(processorOf('agenda')).toBe('Salud');
    expect(findModule('no-existe')).toBeUndefined();
  });
});
