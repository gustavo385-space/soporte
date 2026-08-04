import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-new-ticket',
  templateUrl: './new-ticket.component.html',
  styleUrls: ['./new-ticket.component.scss'],
  standalone: false
})
export class NewTicketComponent {
  titulo: string = '';
  categoria: string = 'Soporte Técnico';
  prioridad: string = 'media';
  descripcion: string = '';

  isSubmitting: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private apiService: ApiService,
    private authService: AuthService,
    private toastCtrl: ToastController
  ) {}

  closeModal() {
    this.modalCtrl.dismiss();
  }

  async submitTicket() {
    if (!this.titulo.trim() || !this.descripcion.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor complete el título y la descripción.',
        duration: 2500,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.isSubmitting = true;
    const user = this.authService.currentUserValue;

    const payload = {
      empresaId: user?.empresaId || 'emp_1',
      empresaNombre: user?.name || 'Empresa Cliente',
      titulo: this.titulo,
      categoria: this.categoria,
      prioridad: this.prioridad,
      descripcion: this.descripcion
    };

    this.apiService.createTicket(payload).subscribe(
      async (res) => {
        this.isSubmitting = false;
        const toast = await this.toastCtrl.create({
          message: 'Ticket de soporte creado exitosamente.',
          duration: 3000,
          color: 'success'
        });
        await toast.present();
        this.modalCtrl.dismiss({ created: true, ticket: res.ticket });
      },
      async (err) => {
        this.isSubmitting = false;
        const toast = await this.toastCtrl.create({
          message: 'Error al enviar la solicitud. Reintente.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    );
  }
}
