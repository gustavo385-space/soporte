import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  email: string = 'admin@soporte.com';
  password: string = 'admin123';
  activeTab: 'empresa' | 'admin' = 'admin';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  selectRole(role: 'empresa' | 'admin') {
    this.activeTab = role;
    if (role === 'empresa') {
      this.email = 'usuario@soporte.com';
      this.password = 'user123';
    } else {
      this.email = 'admin@soporte.com';
      this.password = 'admin123';
    }
  }

  async login() {
    this.isLoading = true;
    this.authService.loginWithEmail(this.email, this.password, this.activeTab).subscribe({
      next: async (res) => {
        this.isLoading = false;
        const user = res.user;

        const toast = await this.toastCtrl.create({
          message: `Sesión iniciada como ${user?.name} (${user?.role.toUpperCase()})`,
          duration: 2500,
          color: 'success'
        });
        await toast.present();

        this.router.navigate(['/tabs/tab1']);
      },
      error: async (errMessage) => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({
          message: typeof errMessage === 'string' ? errMessage : 'Credenciales incorrectas.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }
}
