import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Space } from '../../models/space/space.model';
import { SpaceService } from './space.service';

describe('SpaceService', () => {
  let service: SpaceService;
  let backend: HttpTestingController;
  const space: Space = {
    id: 's1',
    code: 'CON-101',
    type: 'Consultorio',
    description: 'Consultorio de medicina general',
    active: true,
    headquarterId: 'h1',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SpaceService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists the spaces of the whole clinic when there is no active headquarter', () => {
    const seen: Space[][] = [];
    service.list().subscribe((spaces) => seen.push(spaces));
    backend.expectOne({ method: 'GET', url: '/api/v1/spaces' }).flush([space]);
    expect(seen).toEqual([[space]]);
  });

  it('lists only the spaces of the active headquarter', () => {
    service.list('h1').subscribe();
    backend.expectOne({ method: 'GET', url: '/api/v1/spaces/headquarter/h1' }).flush([space]);
  });

  it('asks for the detail of a space by its code', () => {
    const seen: Space[] = [];
    service.getByCode('CON-101').subscribe((found) => seen.push(found));
    backend.expectOne({ method: 'GET', url: '/api/v1/spaces/code/CON-101' }).flush(space);
    expect(seen).toEqual([space]);
  });

  it('creates a space with its headquarter', () => {
    const body: Space = {
      code: 'LAB-401',
      type: 'Laboratorio',
      description: 'Análisis clínicos',
      headquarterId: 'h1',
    };
    service.create(body).subscribe();
    const request = backend.expectOne({ method: 'POST', url: '/api/v1/spaces' });
    expect(request.request.body).toEqual(body);
    request.flush({ ...body, id: 's2', active: true }, { status: 202, statusText: 'Accepted' });
  });

  it('patches only the keys it is given', () => {
    service.patch('s1', { description: 'Nueva descripción larga' }).subscribe();
    const request = backend.expectOne({ method: 'PATCH', url: '/api/v1/spaces/s1' });
    expect(request.request.body).toEqual({ description: 'Nueva descripción larga' });
    request.flush(space, { status: 202, statusText: 'Accepted' });
  });

  it('deactivates and activates through the same PATCH', () => {
    service.deactivate('s1').subscribe();
    const off = backend.expectOne({ method: 'PATCH', url: '/api/v1/spaces/s1' });
    expect(off.request.body).toEqual({ active: false });
    off.flush(space, { status: 202, statusText: 'Accepted' });

    service.activate('s1').subscribe();
    const on = backend.expectOne({ method: 'PATCH', url: '/api/v1/spaces/s1' });
    expect(on.request.body).toEqual({ active: true });
    on.flush(space, { status: 202, statusText: 'Accepted' });
  });
});