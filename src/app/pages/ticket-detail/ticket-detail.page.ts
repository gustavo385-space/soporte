import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Ticket } from '../../models/models';
import { ToastController } from '@ionic/angular';

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
    private apiService: ApiService,
    public authService: AuthService,
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
          message: `Estado actualizado a "${nuevoEstado.toUpperCase().replace('_', ' ')}"`,
          duration: 2500,
          color: 'success'
        });
        await toast.present();
      }
    );
  }
}
