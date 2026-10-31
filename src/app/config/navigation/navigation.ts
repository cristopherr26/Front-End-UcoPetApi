import { LoadChildrenCallback } from '@angular/router';

import { Role } from '../../models/session/session.model';

export interface ApiRoute {
  base: string;
  rule: string;
}

export interface NavModule {
  path: string;
  entity: string;
  label: string;
  icon: string;
  roles: Role[];
  description: string;
  api: ApiRoute[];
  loadChildren: LoadChildrenCallback;
  ready?: boolean;
}

export interface NavGroup {
  processor: string;
  label: string;
  modules: NavModule[];
}

const BOTH: Role[] = ['ADMIN', 'DOCTOR'];
const ADMIN: Role[] = ['ADMIN'];

export const NAVIGATION: NavGroup[] = [
  {
    processor: 'Usuarios',
    label: 'Personas',
    modules: [
      {
        path: 'usuarios',
        entity: 'person',
        label: 'Usuarios',
        loadChildren: () =>
          import('../../routes/person/person.routes').then((m) => m.PERSON_ROUTES),
        icon: 'bi-shield-lock',
        roles: ADMIN,
        description: 'Personas de la clínica, su acceso y su estado.',
        api: [
          { base: '/api/v1/persons', rule: 'reglas propias: ADMIN, y cada uno sobre sí mismo' },
        ],
      },
      {
        path: 'medicos',
        entity: 'doctor',
        label: 'Médicos',
        loadChildren: () =>
          import('../../routes/doctor/doctor.routes').then((m) => m.DOCTOR_ROUTES),
        icon: 'bi-person-badge',
        roles: BOTH,
        description: 'Médicos con su tarjeta profesional y especialidades.',
        api: [{ base: '/api/v1/doctor', rule: 'leer ADMIN y DOCTOR · escribir ADMIN' }],
      },
      {
        path: 'tutores',
        entity: 'tutor-pet',
        label: 'Tutores',
        loadChildren: () =>
          import('../../routes/tutor-pet/tutor-pet.routes').then((m) => m.TUTOR_PET_ROUTES),
        icon: 'bi-people',
        roles: BOTH,
        description: 'Responsables de las mascotas y su relación con cada paciente.',
        api: [{ base: '/api/v1/tutorPet', rule: 'leer ADMIN y DOCTOR · escribir ADMIN' }],
      },
      {
        path: 'mascotas',
        entity: 'pet',
        label: 'Pacientes',
        loadChildren: () => import('../../routes/pet/pet.routes').then((m) => m.PET_ROUTES),
        icon: 'bi-heart',
        roles: BOTH,
        description: 'Las mascotas atendidas en la clínica.',
        api: [{ base: '/api/v1/pets', rule: 'leer ADMIN y DOCTOR · escribir ADMIN' }],
      },
      {
        path: 'notificaciones',
        entity: 'notification',
        label: 'Notificaciones',
        loadChildren: () =>
          import('../../routes/notification/notification.routes').then(
            (m) => m.NOTIFICATION_ROUTES,
          ),
        icon: 'bi-bell',
        roles: BOTH,
        description: 'Avisos del sistema para cada persona.',
        api: [{ base: '/api/notifications', rule: 'cualquiera con rol' }],
      },
    ],
  },
  {
    processor: 'Salud',
    label: 'Atención',
    modules: [
      {
        path: 'agenda',
        entity: 'appointment',
        label: 'Agenda',
        loadChildren: () =>
          import('../../routes/appointment/appointment.routes').then((m) => m.APPOINTMENT_ROUTES),
        icon: 'bi-calendar3',
        roles: BOTH,
        description: 'Citas por médico, sede y espacio.',
        api: [{ base: '/api/v1/appointments', rule: 'ADMIN y DOCTOR' }],
      },
      {
        path: 'atenciones',
        entity: 'pet-care',
        label: 'Atenciones',
        loadChildren: () =>
          import('../../routes/pet-care/pet-care.routes').then((m) => m.PET_CARE_ROUTES),
        icon: 'bi-clipboard2-pulse',
        roles: BOTH,
        description: 'Atención del paciente, signos vitales, episodios y certificados.',
        api: [
          { base: '/api/v1/petcares', rule: 'ADMIN y DOCTOR' },
          { base: '/api/v1/vitalsigns', rule: 'ADMIN y DOCTOR' },
          { base: '/api/v1/episodes', rule: 'ADMIN y DOCTOR' },
          { base: '/api/v1/certificate', rule: 'ADMIN y DOCTOR' },
        ],
      },
      {
        path: 'procedimientos',
        entity: 'procedure',
        label: 'Procedimientos',
        loadChildren: () =>
          import('../../routes/procedure/procedure.routes').then((m) => m.PROCEDURE_ROUTES),
        icon: 'bi-bandaid',
        roles: BOTH,
        description: 'Procedimientos clínicos realizados a cada paciente.',
        api: [{ base: '/api/v1/procedures', rule: 'ADMIN y DOCTOR' }],
      },
      {
        path: 'ordenes',
        entity: 'order',
        label: 'Órdenes',
        loadChildren: () => import('../../routes/order/order.routes').then((m) => m.ORDER_ROUTES),
        icon: 'bi-file-medical',
        roles: BOTH,
        description: 'Órdenes médicas y de medicación.',
        api: [{ base: '/api/v1/orders', rule: 'ADMIN y DOCTOR' }],
      },
      {
        path: 'espacios',
        entity: 'space',
        label: 'Espacios',
        loadChildren: () => import('../../routes/space/space.routes').then((m) => m.SPACE_ROUTES),
        icon: 'bi-door-open',
        roles: BOTH,
        description: 'Consultorios, quirófanos y demás espacios por sede.',
        api: [{ base: '/api/v1/spaces', rule: 'ADMIN y DOCTOR' }],
      },
      {
        path: 'especialidades',
        entity: 'specialtie',
        label: 'Especialidades',
        loadChildren: () =>
          import('../../routes/specialtie/specialtie.routes').then((m) => m.SPECIALTIE_ROUTES),
        icon: 'bi-award',
        roles: BOTH,
        description: 'Especialidades y qué médico tiene cada una.',
        api: [
          { base: '/api/v1/specialtie', rule: 'ADMIN y DOCTOR' },
          { base: '/api/v1/specialtiedoctor', rule: 'ADMIN y DOCTOR' },
        ],
      },
    ],
  },
  {
    processor: 'Comercial',
    label: 'Comercial',
    modules: [
      {
        path: 'ventas',
        entity: 'sale',
        label: 'Ventas',
        loadChildren: () => import('../../routes/sale/sale.routes').then((m) => m.SALE_ROUTES),
        icon: 'bi-cart3',
        roles: ADMIN,
        description: 'Venta de productos y servicios del catálogo.',
        api: [{ base: 'SaleController', rule: 'ADMIN · el controller todavía no tiene rutas' }],
      },
      {
        path: 'compras',
        entity: 'purchases',
        label: 'Compras',
        loadChildren: () =>
          import('../../routes/purchases/purchases.routes').then((m) => m.PURCHASES_ROUTES),
        icon: 'bi-bag-check',
        roles: ADMIN,
        description: 'Compras a proveedores.',
        api: [{ base: '/api/v1/purchases', rule: 'ADMIN' }],
      },
      {
        path: 'proveedores',
        entity: 'provider',
        label: 'Proveedores',
        loadChildren: () =>
          import('../../routes/provider/provider.routes').then((m) => m.PROVIDER_ROUTES),
        icon: 'bi-truck',
        roles: ADMIN,
        description: 'Proveedores de productos y servicios.',
        api: [{ base: '/api/v1/providers', rule: 'ADMIN' }],
      },
      {
        path: 'polizas',
        entity: 'health-plan',
        label: 'Pólizas',
        loadChildren: () =>
          import('../../routes/health-plan/health-plan.routes').then((m) => m.HEALTH_PLAN_ROUTES),
        icon: 'bi-shield-plus',
        roles: ADMIN,
        description: 'Planes de salud y sus coberturas.',
        api: [
          { base: '/api/v1/healthplans', rule: 'ADMIN' },
          { base: '/api/v1/healthplans/{id}/coverages', rule: 'ADMIN' },
        ],
      },
    ],
  },
  {
    processor: 'Inventario',
    label: 'Inventario',
    modules: [
      {
        path: 'catalogo',
        entity: 'product',
        label: 'Catálogo',
        ready: true,
        loadChildren: () =>
          import('../../routes/product/product.routes').then((m) => m.PRODUCT_ROUTES),
        icon: 'bi-box-seam',
        roles: BOTH,
        description: 'Productos, servicios y stock por sede.',
        api: [
          { base: '/api/v1/catalog', rule: 'ADMIN y DOCTOR' },
          { base: '/api/v1/products', rule: 'leer ADMIN y DOCTOR · escribir ADMIN' },
          { base: '/api/v1/services', rule: 'leer ADMIN y DOCTOR · escribir ADMIN' },
          { base: '/api/v1/stock', rule: 'leer ADMIN y DOCTOR · escribir ADMIN' },
        ],
      },
      {
        path: 'sedes',
        entity: 'headquarter',
        label: 'Sedes',
        loadChildren: () =>
          import('../../routes/headquarter/headquarter.routes').then((m) => m.HEADQUARTER_ROUTES),
        icon: 'bi-buildings',
        roles: ADMIN,
        description: 'Las sedes de la clínica: crear, editar y dar de baja.',
        api: [{ base: '/api/v1/headquarter', rule: 'leer cualquiera · escribir ADMIN' }],
      },
      {
        path: 'traslados',
        entity: 'transfer',
        label: 'Traslados',
        loadChildren: () =>
          import('../../routes/transfer/transfer.routes').then((m) => m.TRANSFER_ROUTES),
        icon: 'bi-arrow-left-right',
        roles: ADMIN,
        description: 'Traslados de stock entre sedes.',
        api: [{ base: '/api/transfers', rule: 'ADMIN' }],
      },
    ],
  },
  {
    processor: 'Pagos',
    label: 'Pagos',
    modules: [
      {
        path: 'facturas',
        entity: 'invoice',
        label: 'Facturas',
        loadChildren: () =>
          import('../../routes/invoice/invoice.routes').then((m) => m.INVOICE_ROUTES),
        icon: 'bi-receipt',
        roles: ADMIN,
        description: 'Facturación, pagos y anulaciones.',
        api: [{ base: '/api/invoices', rule: 'ADMIN' }],
      },
      {
        path: 'recibos',
        entity: 'receipts',
        label: 'Recibos de caja',
        loadChildren: () =>
          import('../../routes/receipts/receipts.routes').then((m) => m.RECEIPTS_ROUTES),
        icon: 'bi-cash-coin',
        roles: ADMIN,
        description: 'Recibos de caja y métodos de pago.',
        api: [
          { base: '/api/v1/receipts', rule: 'ADMIN' },
          { base: '/api/v1/metodosDePago', rule: 'ADMIN' },
        ],
      },
      {
        path: 'egresos',
        entity: 'egress',
        label: 'Egresos',
        loadChildren: () =>
          import('../../routes/egress/egress.routes').then((m) => m.EGRESS_ROUTES),
        icon: 'bi-wallet2',
        roles: ADMIN,
        description: 'Salidas de dinero de la clínica.',
        api: [{ base: '/api/v1/Egresses', rule: 'ADMIN' }],
      },
    ],
  },
];

export function isReady(module: NavModule): boolean {
  return module.ready === true;
}

export function findModule(path: string): NavModule | undefined {
  return NAVIGATION.flatMap((group) => group.modules).find((module) => module.path === path);
}

export function processorOf(path: string): string | undefined {
  return NAVIGATION.find((group) => group.modules.some((module) => module.path === path))
    ?.processor;
}
