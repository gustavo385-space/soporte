import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Ticket } from '../../models/models';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.page.html',
  styleUrls: ['./ticket-detail.page.scss'],
  standalone: false
})
export class TicketDetailPage implements OnInit {
  ticketId: string = '';
  ticket: Ticket | null = null;
  nuevoMensaje: string = '';
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    public authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.ticketId = this.route.snapshot.paramMap.get('id') || 'TCK-8901';
    this.loadTicket();
  }

  loadTicket() {
    this.isLoading = true;
    this.apiService.getTicketById(this.ticketId).subscribe(
      (res) => {
        this.ticket = res.ticket;
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  enviarRespuesta() {
    if (!this.nuevoMensaje.trim() || !this.ticket) return;

    const user = this.authService.currentUserValue;
    const payload = {
      autor: user?.name || 'Usuario',
      rol: user?.role || 'empresa',
      mensaje: this.nuevoMensaje
    };

    this.apiService.addTicketMessage(this.ticket.id, payload).subscribe(() => {
      this.nuevoMensaje = '';
      this.loadTicket();
    });
  }

  async cambiarEstado(nuevoEstado: 'pendiente' | 'en_proceso' | 'resuelto') {
    if (!this.ticket) return;

    const user = this.authService.currentUserValue;
    const tecnicoNombre = user?.name || 'Técnico Asignado';

    this.apiService.updateTicketState(this.ticket.id, nuevoEstado, tecnicoNombre).subscribe(
      async (res) => {
        this.ticket = res.ticket;
        const toast = await this.toastCtrl.create({
          message: `Estado actualizado a "${nuevoEstado.toUpperCase().replace('_', ' ')}" en PostgreSQL`,
          duration: 2500,
          color: 'success'
        });
        await toast.present();
      }
    );
  }

  async editarTicketAdmin() {
    if (!this.ticket) return;

    const alert = await this.alertCtrl.create({
      header: `Editar Ticket ${this.ticket.id}`,
      inputs: [
        { name: 'titulo', type: 'text', placeholder: 'Título', value: this.ticket.titulo },
        { name: 'descripcion', type: 'textarea', placeholder: 'Descripción', value: this.ticket.descripcion },
        { name: 'categoria', type: 'text', placeholder: 'Categoría', value: this.ticket.categoria },
        { name: 'tecnicoAsignado', type: 'text', placeholder: 'Técnico Asignado', value: this.ticket.tecnicoAsignado }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar en DB',
          handler: (data) => {
            this.apiService.updateTicket(this.ticket!.id, data).subscribe(async (res) => {
              this.ticket = res.ticket;
              const toast = await this.toastCtrl.create({
                message: 'Ticket actualizado en la base de datos.',
                duration: 2500,
                color: 'success'
              });
              await toast.present();
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarTicketAdmin() {
    if (!this.ticket) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar Ticket',
      message: `¿Estás seguro de eliminar el ticket <strong>${this.ticket.id}</strong> permanentemente de PostgreSQL?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar de DB',
          role: 'destructive',
          handler: () => {
            this.apiService.deleteTicket(this.ticket!.id).subscribe(async () => {
              const toast = await this.toastCtrl.create({
                message: 'Ticket eliminado de PostgreSQL.',
                duration: 2500,
                color: 'warning'
              });
              await toast.present();
              this.router.navigate(['/tabs/tab1']);
            });
          }
        }
      ]
    });

    await alert.present();
  }
}
