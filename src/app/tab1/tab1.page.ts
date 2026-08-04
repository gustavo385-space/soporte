import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Ticket, DashboardStats } from '../models/models';
import { NewTicketComponent } from '../components/new-ticket/new-ticket.component';

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

  openTicket(ticket: Ticket) {
    this.router.navigate(['/ticket-detail', ticket.id]);
  }
}
