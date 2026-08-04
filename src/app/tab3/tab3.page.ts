import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { EquipmentItem } from '../models/models';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false
})
export class Tab3Page implements OnInit {
  activeSegment: 'equipos' | 'perfil' = 'equipos';
  equipment: EquipmentItem[] = [];
  isLoading: boolean = true;

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    const user = this.authService.currentUserValue;

    this.apiService.getEquipment(user?.empresaId).subscribe((res) => {
      this.equipment = res.equipment;
      this.isLoading = false;
    });
  }

  async addEquipmentModal() {
    const alert = await this.alertCtrl.create({
      header: 'Registrar Nuevo Equipo',
      inputs: [
        { name: 'codigoActivo', type: 'text', placeholder: 'Código Activo (ej: EQ-SRV-05)' },
        { name: 'tipo', type: 'text', placeholder: 'Tipo (Servidor, Switch, Laptop, Router)' },
        { name: 'marcaModelo', type: 'text', placeholder: 'Marca y Modelo (ej: Dell R750)' },
        { name: 'ubicacion', type: 'text', placeholder: 'Ubicación física' },
        { name: 'especificaciones', type: 'textarea', placeholder: 'Especificaciones técnicas...' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar Equipo',
          handler: (data) => {
            if (!data.tipo || !data.marcaModelo) return;
            const user = this.authService.currentUserValue;
            this.apiService.createEquipment({
              empresaId: user?.empresaId || 'emp_1',
              codigoActivo: data.codigoActivo,
              tipo: data.tipo,
              marcaModelo: data.marcaModelo,
              ubicacion: data.ubicacion,
              especificaciones: data.especificaciones
            }).subscribe(async () => {
              this.loadData();
              const toast = await this.toastCtrl.create({
                message: 'Equipo registrado en el inventario de la empresa.',
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
}
