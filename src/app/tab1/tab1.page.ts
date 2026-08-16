import { Component, OnInit } from '@angular/core';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Ticket, DashboardStats } from '../models/models';
import { NewTicketComponent } from '../components/new-ticket/new-ticket.component';
import { UserManagementComponent } from '../components/user-management/user-management.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false
})
export class Tab1Page implements OnInit {
  tickets: Ticket[] = [];
  stats: DashboardStats | null = null;
  selectedFilter: string = 'todos';
  isLoading: boolean = true;

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(() => {
      this.loadData();
    });
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    const user = this.authService.currentUserValue;

    this.apiService.getTickets(user?.empresaId, user?.role).subscribe(
      (res) => {
        this.tickets = res.tickets;
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );

    this.apiService.getStats().subscribe((res) => {
      this.stats = res.stats;
    });
  }

  get filteredTickets(): Ticket[] {
    if (this.selectedFilter === 'todos') return this.tickets;
    return this.tickets.filter(t => t.estado === this.selectedFilter);
  }

  async openNewTicketModal() {
    const modal = await this.modalCtrl.create({
      component: NewTicketComponent,
      breakpoints: [0, 0.85, 1],
      initialBreakpoint: 0.85
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.created) {
      this.loadData();
    }
  }

  async openUserManagementModal() {
    const modal = await this.modalCtrl.create({
      component: UserManagementComponent
    });
    await modal.present();
    await modal.onDidDismiss();
    this.loadData();
  }

  openTicket(ticket: Ticket) {
    this.router.navigate(['/ticket-detail', ticket.id]);
  }

  async deleteTicket(event: Event, ticket: Ticket) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Ticket',
      message: `¿Deseas eliminar permanentemente el ticket <strong>${ticket.id}</strong> de la base de datos?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar de DB',
          role: 'destructive',
          handler: () => {
            this.apiService.deleteTicket(ticket.id).subscribe(async () => {
              this.loadData();
              const toast = await this.toastCtrl.create({
                message: 'Ticket eliminado de la base de datos.',
                duration: 2500,
                color: 'warning'
              });
              await toast.present();
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async quickChangeStatus(event: Event, ticket: Ticket, nuevoEstado: string) {
    event.stopPropagation();
    const user = this.authService.currentUserValue;
    this.apiService.updateTicketState(ticket.id, nuevoEstado, user?.name).subscribe(async () => {
      this.loadData();
      const toast = await this.toastCtrl.create({
        message: `Estado de ${ticket.id} actualizado a "${nuevoEstado.toUpperCase().replace('_', ' ')}" en DB.`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    });
  }
}
