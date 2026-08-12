import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Ticket, LicenseCatalogItem, ActiveLicense, EquipmentItem, DashboardStats } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  // Fallback Mock Data in case backend is offline
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
    },
    {
      id: 'TCK-8903',
      empresaId: 'emp_2',
      empresaNombre: 'InnovaTech Solutions',
      titulo: 'Mantenimiento preventivo para 15 Laptops Dell XPS',
      descripcion: 'Limpieza física de disipadores y actualización de firmware.',
      categoria: 'Mantenimiento',
      prioridad: 'baja',
      estado: 'resuelto',
      tecnicoAsignado: 'Roberto Silva',
      fechaCreacion: new Date(Date.now() - 172800000).toISOString(),
      fechaActualizacion: new Date(Date.now() - 86400000).toISOString(),
      mensajes: [
        { autor: 'Roberto Silva', rol: 'tecnico', mensaje: 'Mantenimiento completado.', fecha: new Date(Date.now() - 86400000).toISOString() }
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
    },
    {
      id: 'lic_3',
      nombre: 'Windows Server 2025 Datacenter',
      tipo: 'Licencia Perpetua',
      fabricante: 'Microsoft',
      precioUnitario: '$6,150.00 /16 Cores',
      incluye: 'Máquinas virtuales ilimitadas, Storage Spaces Direct',
      icono: 'server-outline'
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
    },
    {
      id: 'act_lic_102',
      empresaId: 'emp_1',
      nombre: 'Kaspersky Endpoint Security',
      cantidad: 40,
      claveLicencia: 'KASP-99201-EC911-PRO88',
      fechaVencimiento: '2026-12-01',
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
    },
    {
      id: 'eq_02',
      empresaId: 'emp_1',
      codigoActivo: 'EQ-SW-02',
      tipo: 'Switch Layer 3',
      marcaModelo: 'Cisco Catalyst 9300 48-Port',
      ubicacion: 'Rack B-01 (Piso 2)',
      especificaciones: '48P PoE+ / Stackwise',
      ultimoMantenimiento: '2026-05-10',
      proximoMantenimiento: '2026-11-10',
      estado: 'Operativo'
    }
  ];

  constructor(private http: HttpClient) {}

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

  getLicensesCatalog(): Observable<{ success: boolean; catalog: LicenseCatalogItem[] }> {
    return this.http.get<{ success: boolean; catalog: LicenseCatalogItem[] }>(`${this.apiUrl}/licenses/catalog`).pipe(
      catchError(() => of({ success: true, catalog: this.fallbackCatalog }))
    );
  }

  getActiveLicenses(empresaId?: string): Observable<{ success: boolean; licenses: ActiveLicense[] }> {
    return this.http.get<{ success: boolean; licenses: ActiveLicense[] }>(`${this.apiUrl}/licenses/active?empresaId=${empresaId || ''}`).pipe(
      catchError(() => of({ success: true, licenses: this.fallbackActiveLicenses }))
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
          estado: 'Operativo'
        };
        this.fallbackEquipment.push(newEq);
        return of({ success: true, equipment: newEq });
      })
    );
  }

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
