import { Component, OnInit } from '@angular/core';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { User, UserRole } from '../../models/models';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  standalone: false
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  isLoading: boolean = true;
  activeFilter: string = 'todos';
  showCreateForm: boolean = false;

  // New user form model
  newUser: Partial<User> = {
    email: '',
    name: '',
    role: 'empresa',
    empresaId: 'emp_1',
    contacto: '',
    telefono: '',
    plan: 'Standard',
    especialidad: ''
  };

  constructor(
    private modalCtrl: ModalController,
    private apiService: ApiService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.apiService.getUsers().subscribe(
      (res) => {
        this.users = res.users;
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  get filteredUsers(): User[] {
    if (this.activeFilter === 'todos') return this.users;
    return this.users.filter(u => u.role === this.activeFilter);
  }

  close() {
    this.modalCtrl.dismiss();
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
  }

  createUser() {
    if (!this.newUser.email || !this.newUser.name) return;

    this.apiService.createUser(this.newUser).subscribe(async (res) => {
      if (res.success) {
        const toast = await this.toastCtrl.create({
          message: `Usuario ${res.user.name} registrado en la base de datos PostgreSQL.`,
          duration: 3000,
          color: 'success'
        });
        await toast.present();

        this.newUser = {
          email: '',
          name: '',
          role: 'empresa',
          empresaId: 'emp_1',
          contacto: '',
          telefono: '',
          plan: 'Standard',
          especialidad: ''
        };
        this.showCreateForm = false;
        this.loadUsers();
      }
    });
  }

  async editUser(user: User) {
    const alert = await this.alertCtrl.create({
      header: `Editar Usuario: ${user.name}`,
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre Completo', value: user.name },
        { name: 'email', type: 'email', placeholder: 'Correo Electrónico', value: user.email },
        { name: 'telefono', type: 'tel', placeholder: 'Teléfono', value: user.telefono || '' },
        { name: 'plan', type: 'text', placeholder: 'Plan (si es empresa)', value: user.plan || '' },
        { name: 'especialidad', type: 'text', placeholder: 'Especialidad (si es técnico/admin)', value: user.especialidad || '' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar Cambios',
          handler: (data) => {
            this.apiService.updateUser(user.id, data).subscribe(async () => {
              this.loadUsers();
              const toast = await this.toastCtrl.create({
                message: 'Usuario actualizado en PostgreSQL.',
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

  async deleteUser(user: User) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de eliminar permanentemente al usuario <strong>${user.name}</strong> (${user.email}) de la base de datos?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar de DB',
          role: 'destructive',
          handler: () => {
            this.apiService.deleteUser(user.id).subscribe(async () => {
              this.loadUsers();
              const toast = await this.toastCtrl.create({
                message: 'Usuario eliminado de la base de datos.',
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
}
