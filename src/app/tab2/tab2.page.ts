import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LicenseCatalogItem, ActiveLicense } from '../models/models';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false
})
export class Tab2Page implements OnInit {
  activeSegment: 'catalogo' | 'mis_licencias' = 'catalogo';
  catalog: LicenseCatalogItem[] = [];
  activeLicenses: ActiveLicense[] = [];
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

    this.apiService.getLicensesCatalog().subscribe((res) => {
      this.catalog = res.catalog;
    });

    this.apiService.getActiveLicenses(user?.empresaId).subscribe((res) => {
      this.activeLicenses = res.licenses;
      this.isLoading = false;
    });
  }

  async requestLicense(item: LicenseCatalogItem) {
    const alert = await this.alertCtrl.create({
      header: `Solicitar ${item.nombre}`,
      subHeader: `Precio: ${item.precioUnitario}`,
      inputs: [
        {
          name: 'cantidad',
          type: 'number',
          placeholder: 'Cantidad de usuarios / licencias',
          min: 1,
          value: '10'
        },
        {
          name: 'notas',
          type: 'textarea',
          placeholder: 'Notas o departamento solicitante...'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar Solicitud',
          handler: (data) => {
            const user = this.authService.currentUserValue;
            this.apiService.requestLicense({
              empresaId: user?.empresaId || 'emp_1',
              empresaNombre: user?.name || 'TechCorp Logistics',
              licenciaId: item.id,
              nombreLicencia: item.nombre,
              cantidad: parseInt(data.cantidad, 10) || 1,
              notas: data.notas
            }).subscribe(async () => {
              const toast = await this.toastCtrl.create({
                message: `Solicitud de ${item.nombre} enviada al departamento de soporte.`,
                duration: 3000,
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
