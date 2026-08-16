import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Ticket, LicenseCatalogItem, ActiveLicense, EquipmentItem, DashboardStats, User } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  // Fallback Mocks
  private fallbackUsers: User[] = [
    {
      id: 'usr_admin_master',
      email: 'admin@soporte.com',
      name: 'Alex Rivera (Admin General)',
      role: 'admin',
      especialidad: 'Administración Global & DevOps',
      telefono: '+52 55 5555 0101'
    },
    {
      id: 'usr_empresa_1',
      email: 'contacto@techcorp.com',
      name: 'TechCorp Logistics S.A.',
      role: 'empresa',
      empresaId: 'emp_1',
      contacto: 'Ing. Carlos Mendoza',
      telefono: '+52 55 1234 5678',
      plan: 'Enterprise VIP'
    },
    {
      id: 'usr_tech_2',
      email: 'tecnico@soporte.com',
      name: 'Roberto Silva (Senior Field Tech)',
      role: 'tecnico',
      especialidad: 'Mantenimiento Hardware & Licencias',
      telefono: '+52 55 5555 0202'
    }
  ];

  private fallbackTickets: Ticket[] = [
    {
      id: 'TCK-8901',
      empresaId: 'emp_1',
      empresaNombre: 'TechCorp Logistics S.A.',
      titulo: 'Fallo crítico en servidor de base de datos principal',
      descripcion: 'El servidor SQL principal no responde a las peticiones del sistema ERP desde las 08:30 hrs.',
      categoria: 'Servidores',
      prioridad: 'critico',
      estado: 'en_proceso',
      tecnicoAsignado: 'Alex Rivera (Lead DevOps)',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      mensajes: [
        { autor: 'Ing. Carlos Mendoza', rol: 'empresa', mensaje: 'Requerimos asistencia urgente.', fecha: new Date().toISOString() },
        { autor: 'Alex Rivera', rol: 'admin', mensaje: 'Estamos diagnosticando el pool de memoria.', fecha: new Date().toISOString() }
      ]
    },
    {
      id: 'TCK-8902',
      empresaId: 'emp_1',
      empresaNombre: 'TechCorp Logistics S.A.',
      titulo: 'Solicitud de renovación de 25 licencias Microsoft 365 E5',
      descripcion: 'Se requiere renovar el lote anual de licencias Office 365.',
      categoria: 'Licencias',
      prioridad: 'media',
      estado: 'pendiente',
      tecnicoAsignado: 'Sin Asignar',
      fechaCreacion: new Date(Date.now() - 86400000).toISOString(),
      fechaActualizacion: new Date(Date.now() - 86400000).toISOString(),
      mensajes: [
        { autor: 'Ing. Carlos Mendoza', rol: 'empresa', mensaje: 'Adjunto requerimiento firmado.', fecha: new Date(Date.now() - 86400000).toISOString() }
      ]
    }
  ];

  private fallbackCatalog: LicenseCatalogItem[] = [
    {
      id: 'lic_1',
      nombre: 'Microsoft 365 Enterprise E5',
      tipo: 'Suscripción Anual',
      fabricante: 'Microsoft',
      precioUnitario: '$38.00 /usuario/mes',
      incluye: 'Word, Excel, Teams, Defender Endpoint, PowerBI Pro',
      icono: 'logo-microsoft'
    },
    {
      id: 'lic_2',
      nombre: 'Kaspersky Endpoint Security Cloud Plus',
      tipo: 'Antivirus & Firewall',
      fabricante: 'Kaspersky Lab',
      precioUnitario: '$24.50 /dispositivo/año',
      incluye: 'Protección Ransomware, Control Web, EDR',
      icono: 'shield-checkmark-outline'
    }
  ];

  private fallbackActiveLicenses: ActiveLicense[] = [
    {
      id: 'act_lic_101',
      empresaId: 'emp_1',
      nombre: 'Microsoft 365 Enterprise E5',
      cantidad: 25,
      claveLicencia: 'XXXXX-MW982-PL019-KJS88',
      fechaVencimiento: '2026-09-15',
      estado: 'Activa'
    }
  ];

  private fallbackEquipment: EquipmentItem[] = [
    {
      id: 'eq_01',
      empresaId: 'emp_1',
      codigoActivo: 'EQ-SRV-01',
      tipo: 'Servidor Rack 2U',
      marcaModelo: 'Dell PowerEdge R750',
      ubicacion: 'Rack A-04 (Data Center)',
      especificaciones: '2x Xeon Gold / 128GB RAM / 4x 1.92TB NVMe',
      ultimoMantenimiento: '2026-06-15',
      proximoMantenimiento: '2026-12-15',
      estado: 'Operativo'
    }
  ];

  constructor(private http: HttpClient) {}

  /* ==========================================
     USERS API
     ========================================== */
  getUsers(): Observable<{ success: boolean; users: User[] }> {
    return this.http.get<{ success: boolean; users: User[] }>(`${this.apiUrl}/users`).pipe(
      catchError(() => of({ success: true, users: this.fallbackUsers }))
    );
  }

  createUser(userData: Partial<User>): Observable<{ success: boolean; user: User }> {
    return this.http.post<{ success: boolean; user: User }>(`${this.apiUrl}/users`, userData).pipe(
      catchError(() => {
        const newU: User = {
          id: `usr_${userData.role || 'empresa'}_${Date.now()}`,
          email: userData.email || '',
          name: userData.name || '',
          role: userData.role || 'empresa',
          empresaId: userData.empresaId,
          contacto: userData.contacto,
          telefono: userData.telefono,
          plan: userData.plan,
          especialidad: userData.especialidad
        };
        this.fallbackUsers.unshift(newU);
        return of({ success: true, user: newU });
      })
    );
  }

  updateUser(id: string, userData: Partial<User>): Observable<{ success: boolean; user: User }> {
    return this.http.put<{ success: boolean; user: User }>(`${this.apiUrl}/users/${id}`, userData).pipe(
      catchError(() => {
        const index = this.fallbackUsers.findIndex(u => u.id === id);
        if (index !== -1) {
          this.fallbackUsers[index] = { ...this.fallbackUsers[index], ...userData };
        }
        return of({ success: true, user: this.fallbackUsers[index] });
      })
    );
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/users/${id}`).pipe(
      catchError(() => {
        this.fallbackUsers = this.fallbackUsers.filter(u => u.id !== id);
        return of({ success: true, message: 'Usuario eliminado' });
      })
    );
  }

  /* ==========================================
     TICKETS API
     ========================================== */
  getTickets(empresaId?: string, role?: string): Observable<{ success: boolean; tickets: Ticket[] }> {
    let url = `${this.apiUrl}/tickets`;
    if (empresaId || role) {
      url += `?empresaId=${empresaId || ''}&role=${role || ''}`;
    }
    return this.http.get<{ success: boolean; tickets: Ticket[] }>(url).pipe(
      catchError(() => {
        let filtered = this.fallbackTickets;
        if (role === 'empresa' && empresaId) {
          filtered = filtered.filter(t => t.empresaId === empresaId);
        }
        return of({ success: true, tickets: filtered });
      })
    );
  }

  getTicketById(id: string): Observable<{ success: boolean; ticket: Ticket }> {
    return this.http.get<{ success: boolean; ticket: Ticket }>(`${this.apiUrl}/tickets/${id}`).pipe(
      catchError(() => {
        const found = this.fallbackTickets.find(t => t.id === id) || this.fallbackTickets[0];
        return of({ success: true, ticket: found });
      })
    );
  }

  createTicket(ticketData: any): Observable<{ success: boolean; ticket: Ticket }> {
    return this.http.post<{ success: boolean; ticket: Ticket }>(`${this.apiUrl}/tickets`, ticketData).pipe(
      catchError(() => {
        const newTicket: Ticket = {
          id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
          empresaId: ticketData.empresaId || 'emp_1',
          empresaNombre: ticketData.empresaNombre || 'TechCorp Logistics S.A.',
          titulo: ticketData.titulo,
          descripcion: ticketData.descripcion,
          categoria: ticketData.categoria || 'General',
          prioridad: ticketData.prioridad || 'media',
          estado: 'pendiente',
          tecnicoAsignado: 'Sin Asignar',
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString(),
          mensajes: [
            { autor: ticketData.empresaNombre || 'Cliente', rol: 'empresa', mensaje: ticketData.descripcion, fecha: new Date().toISOString() }
          ]
        };
        this.fallbackTickets.unshift(newTicket);
        return of({ success: true, ticket: newTicket });
      })
    );
  }

  updateTicket(id: string, ticketData: Partial<Ticket>): Observable<{ success: boolean; ticket: Ticket }> {
    return this.http.put<{ success: boolean; ticket: Ticket }>(`${this.apiUrl}/tickets/${id}`, ticketData).pipe(
      catchError(() => {
        const target = this.fallbackTickets.find(t => t.id === id);
        if (target) {
          Object.assign(target, ticketData);
        }
        return of({ success: true, ticket: target! });
      })
    );
  }

  updateTicketState(id: string, estado: string, tecnicoAsignado?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/tickets/${id}/estado`, { estado, tecnicoAsignado }).pipe(
      catchError(() => {
        const target = this.fallbackTickets.find(t => t.id === id);
        if (target) {
          target.estado = estado as any;
          if (tecnicoAsignado) target.tecnicoAsignado = tecnicoAsignado;
        }
        return of({ success: true, ticket: target });
      })
    );
  }

  deleteTicket(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/tickets/${id}`).pipe(
      catchError(() => {
        this.fallbackTickets = this.fallbackTickets.filter(t => t.id !== id);
        return of({ success: true, message: 'Ticket eliminado' });
      })
    );
  }

  addTicketMessage(id: string, messageData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tickets/${id}/mensajes`, messageData).pipe(
      catchError(() => {
        const target = this.fallbackTickets.find(t => t.id === id);
        if (target) {
          target.mensajes.push({
            autor: messageData.autor,
            rol: messageData.rol,
            mensaje: messageData.mensaje,
            fecha: new Date().toISOString()
          });
        }
        return of({ success: true, ticket: target });
      })
    );
  }

  /* ==========================================
     LICENSES CATALOG API
     ========================================== */
  getLicensesCatalog(): Observable<{ success: boolean; catalog: LicenseCatalogItem[] }> {
    return this.http.get<{ success: boolean; catalog: LicenseCatalogItem[] }>(`${this.apiUrl}/licenses/catalog`).pipe(
      catchError(() => of({ success: true, catalog: this.fallbackCatalog }))
    );
  }

  createCatalogLicense(itemData: Partial<LicenseCatalogItem>): Observable<{ success: boolean; catalogItem: LicenseCatalogItem }> {
    return this.http.post<{ success: boolean; catalogItem: LicenseCatalogItem }>(`${this.apiUrl}/licenses/catalog`, itemData).pipe(
      catchError(() => {
        const item: LicenseCatalogItem = {
          id: `lic_${Date.now()}`,
          nombre: itemData.nombre || '',
          tipo: itemData.tipo || 'Suscripción',
          fabricante: itemData.fabricante || 'Genérico',
          precioUnitario: itemData.precioUnitario || '$0.00',
          incluye: itemData.incluye || '',
          icono: itemData.icono || 'key-outline'
        };
        this.fallbackCatalog.push(item);
        return of({ success: true, catalogItem: item });
      })
    );
  }

  updateCatalogLicense(id: string, itemData: Partial<LicenseCatalogItem>): Observable<{ success: boolean; catalogItem: LicenseCatalogItem }> {
    return this.http.put<{ success: boolean; catalogItem: LicenseCatalogItem }>(`${this.apiUrl}/licenses/catalog/${id}`, itemData).pipe(
      catchError(() => {
        const idx = this.fallbackCatalog.findIndex(c => c.id === id);
        if (idx !== -1) {
          this.fallbackCatalog[idx] = { ...this.fallbackCatalog[idx], ...itemData };
        }
        return of({ success: true, catalogItem: this.fallbackCatalog[idx] });
      })
    );
  }

  deleteCatalogLicense(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/licenses/catalog/${id}`).pipe(
      catchError(() => {
        this.fallbackCatalog = this.fallbackCatalog.filter(c => c.id !== id);
        return of({ success: true, message: 'Item eliminado' });
      })
    );
  }

  /* ==========================================
     ACTIVE LICENSES API
     ========================================== */
  getActiveLicenses(empresaId?: string): Observable<{ success: boolean; licenses: ActiveLicense[] }> {
    return this.http.get<{ success: boolean; licenses: ActiveLicense[] }>(`${this.apiUrl}/licenses/active?empresaId=${empresaId || ''}`).pipe(
      catchError(() => of({ success: true, licenses: this.fallbackActiveLicenses }))
    );
  }

  createActiveLicense(licenseData: Partial<ActiveLicense>): Observable<{ success: boolean; license: ActiveLicense }> {
    return this.http.post<{ success: boolean; license: ActiveLicense }>(`${this.apiUrl}/licenses/active`, licenseData).pipe(
      catchError(() => {
        const lic: ActiveLicense = {
          id: `act_lic_${Date.now()}`,
          empresaId: licenseData.empresaId || 'emp_1',
          nombre: licenseData.nombre || '',
          cantidad: licenseData.cantidad || 1,
          claveLicencia: licenseData.claveLicencia || 'XXXXX-XXXXX',
          fechaVencimiento: licenseData.fechaVencimiento || '2027-12-31',
          estado: licenseData.estado || 'Activa'
        };
        this.fallbackActiveLicenses.push(lic);
        return of({ success: true, license: lic });
      })
    );
  }

  updateActiveLicense(id: string, licenseData: Partial<ActiveLicense>): Observable<{ success: boolean; license: ActiveLicense }> {
    return this.http.put<{ success: boolean; license: ActiveLicense }>(`${this.apiUrl}/licenses/active/${id}`, licenseData).pipe(
      catchError(() => {
        const idx = this.fallbackActiveLicenses.findIndex(l => l.id === id);
        if (idx !== -1) {
          this.fallbackActiveLicenses[idx] = { ...this.fallbackActiveLicenses[idx], ...licenseData };
        }
        return of({ success: true, license: this.fallbackActiveLicenses[idx] });
      })
    );
  }

  deleteActiveLicense(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/licenses/active/${id}`).pipe(
      catchError(() => {
        this.fallbackActiveLicenses = this.fallbackActiveLicenses.filter(l => l.id !== id);
        return of({ success: true, message: 'Licencia activa eliminada' });
      })
    );
  }

  requestLicense(reqData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/licenses/request`, reqData).pipe(
      catchError(() => {
        this.createTicket({
          empresaId: reqData.empresaId,
          empresaNombre: reqData.empresaNombre,
          titulo: `Solicitud Licencia: ${reqData.nombreLicencia}`,
          descripcion: `Solicitud de ${reqData.cantidad} unidades. Notas: ${reqData.notas || 'N/A'}`,
          categoria: 'Licencias',
          prioridad: 'media'
        });
        return of({ success: true, message: 'Solicitud enviada con éxito' });
      })
    );
  }

  /* ==========================================
     EQUIPMENT API
     ========================================== */
  getEquipment(empresaId?: string): Observable<{ success: boolean; equipment: EquipmentItem[] }> {
    return this.http.get<{ success: boolean; equipment: EquipmentItem[] }>(`${this.apiUrl}/equipment?empresaId=${empresaId || ''}`).pipe(
      catchError(() => of({ success: true, equipment: this.fallbackEquipment }))
    );
  }

  createEquipment(equipData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/equipment`, equipData).pipe(
      catchError(() => {
        const newEq: EquipmentItem = {
          id: `eq_${Date.now()}`,
          empresaId: equipData.empresaId || 'emp_1',
          codigoActivo: equipData.codigoActivo || `EQ-HW-${Math.floor(100 + Math.random() * 900)}`,
          tipo: equipData.tipo,
          marcaModelo: equipData.marcaModelo,
          ubicacion: equipData.ubicacion,
          especificaciones: equipData.especificaciones,
          ultimoMantenimiento: new Date().toISOString().split('T')[0],
          proximoMantenimiento: '2026-12-31',
          estado: equipData.estado || 'Operativo'
        };
        this.fallbackEquipment.push(newEq);
        return of({ success: true, equipment: newEq });
      })
    );
  }

  updateEquipment(id: string, equipData: Partial<EquipmentItem>): Observable<{ success: boolean; equipment: EquipmentItem }> {
    return this.http.put<{ success: boolean; equipment: EquipmentItem }>(`${this.apiUrl}/equipment/${id}`, equipData).pipe(
      catchError(() => {
        const idx = this.fallbackEquipment.findIndex(e => e.id === id);
        if (idx !== -1) {
          this.fallbackEquipment[idx] = { ...this.fallbackEquipment[idx], ...equipData };
        }
        return of({ success: true, equipment: this.fallbackEquipment[idx] });
      })
    );
  }

  deleteEquipment(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/equipment/${id}`).pipe(
      catchError(() => {
        this.fallbackEquipment = this.fallbackEquipment.filter(e => e.id !== id);
        return of({ success: true, message: 'Equipo eliminado' });
      })
    );
  }

  /* ==========================================
     STATS API
     ========================================== */
  getStats(): Observable<{ success: boolean; stats: DashboardStats }> {
    return this.http.get<{ success: boolean; stats: DashboardStats }>(`${this.apiUrl}/stats`).pipe(
      catchError(() => {
        const stats: DashboardStats = {
          totalTickets: this.fallbackTickets.length,
          pendientes: this.fallbackTickets.filter(t => t.estado === 'pendiente').length,
          enProceso: this.fallbackTickets.filter(t => t.estado === 'en_proceso').length,
          resueltos: this.fallbackTickets.filter(t => t.estado === 'resuelto').length,
          criticos: this.fallbackTickets.filter(t => t.prioridad === 'critico').length,
          totalEquipos: this.fallbackEquipment.length,
          totalLicenciasActivas: 65
        };
        return of({ success: true, stats });
      })
    );
  }
}
