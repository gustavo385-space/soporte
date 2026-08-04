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
  email: string = 'contacto@techcorp.com';
  activeTab: 'empresa' | 'admin' = 'empresa';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  selectRole(role: 'empresa' | 'admin') {
    this.activeTab = role;
    if (role === 'empresa') {
      this.email = 'contacto@techcorp.com';
    } else {
      this.email = 'admin@soporte.com';
    }
  }

  async login() {
    if (this.activeTab === 'empresa') {
      this.authService.loginAsEmpresa();
    } else {
      this.authService.loginAsAdmin();
    }

    const toast = await this.toastCtrl.create({
      message: `Sesión iniciada como ${this.authService.currentUserValue?.name}`,
      duration: 2500,
      color: 'success'
    });
    await toast.present();

    this.router.navigate(['/tabs/tab1']);
  }
}
