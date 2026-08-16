export type UserRole = 'empresa' | 'admin' | 'tecnico';
export type TicketState = 'pendiente' | 'en_proceso' | 'resuelto';
export type TicketPriority = 'baja' | 'media' | 'alta' | 'critico';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  empresaId?: string;
  contacto?: string;
  telefono?: string;
  plan?: string;
  especialidad?: string;
  createdAt?: string;
}

export interface TicketMessage {
  autor: string;
  rol: UserRole;
  mensaje: string;
  fecha: string;
}

export interface Ticket {
  id: string;
  empresaId: string;
  empresaNombre: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  prioridad: TicketPriority;
  estado: TicketState;
  tecnicoAsignado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  mensajes: TicketMessage[];
}

export interface LicenseCatalogItem {
  id: string;
  nombre: string;
  tipo: string;
  fabricante: string;
  precioUnitario: string;
  incluye: string;
  icono: string;
}

export interface ActiveLicense {
  id: string;
  empresaId: string;
  nombre: string;
  cantidad: number;
  claveLicencia: string;
  fechaVencimiento: string;
  estado: 'Activa' | 'Por Vencer' | 'Vencida';
}

export interface EquipmentItem {
  id: string;
  empresaId: string;
  codigoActivo: string;
  tipo: string;
  marcaModelo: string;
  ubicacion: string;
  especificaciones: string;
  ultimoMantenimiento: string;
  proximoMantenimiento: string;
  estado: 'Operativo' | 'En Mantenimiento' | 'Atención Requerida';
}

export interface DashboardStats {
  totalTickets: number;
  pendientes: number;
  enProceso: number;
  resueltos: number;
  criticos: number;
  totalEquipos: number;
  totalLicenciasActivas: number;
}
