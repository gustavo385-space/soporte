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

  /* ====================================================
     ADMIN ACTIONS - ACTIVE LICENSES
     ==================================================== */
  async addActiveLicenseModal() {
    const alert = await this.alertCtrl.create({
      header: 'Agregar Licencia Activa en DB',
      inputs: [
        { name: 'empresaId', type: 'text', placeholder: 'ID Empresa (ej: emp_1)', value: 'emp_1' },
        { name: 'nombre', type: 'text', placeholder: 'Nombre Licencia (ej. Microsoft 365 E5)' },
        { name: 'cantidad', type: 'number', placeholder: 'Cantidad', value: '10' },
        { name: 'claveLicencia', type: 'text', placeholder: 'Clave de Licencia' },
        { name: 'fechaVencimiento', type: 'date', placeholder: 'Fecha Vencimiento' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar en DB',
          handler: (data) => {
            if (!data.nombre) return;
            this.apiService.createActiveLicense({
              empresaId: data.empresaId,
              nombre: data.nombre,
              cantidad: parseInt(data.cantidad, 10) || 1,
              claveLicencia: data.claveLicencia || 'XXXXX-XXXXX',
              fechaVencimiento: data.fechaVencimiento || '2027-12-31',
              estado: 'Activa'
            }).subscribe(async () => {
              this.loadData();
              const toast = await this.toastCtrl.create({
                message: 'Licencia activa agregada en la base de datos PostgreSQL.',
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

  async editActiveLicenseModal(lic: ActiveLicense) {
    const alert = await this.alertCtrl.create({
      header: `Editar Licencia ${lic.nombre}`,
      inputs: [
        { name: 'nombre', type: 'text', placeholder: 'Nombre', value: lic.nombre },
        { name: 'cantidad', type: 'number', placeholder: 'Cantidad', value: lic.cantidad.toString() },
        { name: 'claveLicencia', type: 'text', placeholder: 'Clave Licencia', value: lic.claveLicencia },
        { name: 'fechaVencimiento', type: 'date', placeholder: 'Vencimiento', value: lic.fechaVencimiento },
        { name: 'estado', type: 'text', placeholder: 'Estado (Activa / Por Vencer / Vencida)', value: lic.estado }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar Cambios',
          handler: (data) => {
            this.apiService.updateActiveLicense(lic.id, {
              nombre: data.nombre,
              cantidad: parseInt(data.cantidad, 10) || 1,
              claveLicencia: data.claveLicencia,
              fechaVencimiento: data.fechaVencimiento,
              estado: data.estado
            }).subscribe(async () => {
              this.loadData();
              const toast = await this.toastCtrl.create({
                message: 'Licencia actualizada en PostgreSQL.',
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

  async deleteActiveLicense(lic: ActiveLicense) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Licencia Activa',
      message: `¿Estás seguro de eliminar <strong>${lic.nombre}</strong> de PostgreSQL?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar de DB',
          role: 'destructive',
          handler: () => {
            this.apiService.deleteActiveLicense(lic.id).subscribe(async () => {
              this.loadData();
              const toast = await this.toastCtrl.create({
                message: 'Licencia eliminada de PostgreSQL.',
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

  /* ====================================================
     ADMIN ACTIONS - CATALOG ITEMS
     ==================================================== */
  async addCatalogItemModal() {
    const alert = await this.alertCtrl.create({
      header: 'Agregar Software al Catálogo',
      inputs: [
        { name: 'nombre', type: 'text', placeholder: 'Nombre del Producto' },
        { name: 'fabricante', type: 'text', placeholder: 'Fabricante (ej. Microsoft, Kaspersky)' },
        { name: 'tipo', type: 'text', placeholder: 'Tipo (Suscripción Anual / Perpetua)' },
        { name: 'precioUnitario', type: 'text', placeholder: 'Precio (ej. $35.00 /mes)' },
        { name: 'incluye', type: 'textarea', placeholder: 'Características incluidas...' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar al Catálogo',
          handler: (data) => {
            if (!data.nombre) return;
            this.apiService.createCatalogLicense(data).subscribe(async () => {
              this.loadData();
              const toast = await this.toastCtrl.create({
                message: 'Nuevo producto registrado en el catálogo de PostgreSQL.',
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

  async editCatalogItemModal(item: LicenseCatalogItem) {
    const alert = await this.alertCtrl.create({
      header: `Editar ${item.nombre}`,
      inputs: [
        { name: 'nombre', type: 'text', placeholder: 'Nombre', value: item.nombre },
        { name: 'fabricante', type: 'text', placeholder: 'Fabricante', value: item.fabricante },
        { name: 'tipo', type: 'text', placeholder: 'Tipo', value: item.tipo },
        { name: 'precioUnitario', type: 'text', placeholder: 'Precio Unitario', value: item.precioUnitario },
        { name: 'incluye', type: 'textarea', placeholder: 'Incluye', value: item.incluye }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar Cambios',
          handler: (data) => {
            this.apiService.updateCatalogLicense(item.id, data).subscribe(async () => {
              this.loadData();
              const toast = await this.toastCtrl.create({
                message: 'Catálogo actualizado en PostgreSQL.',
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

  async deleteCatalogItem(item: LicenseCatalogItem) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar del Catálogo',
      message: `¿Estás seguro de eliminar <strong>${item.nombre}</strong> del catálogo en PostgreSQL?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar de DB',
          role: 'destructive',
          handler: () => {
            this.apiService.deleteCatalogLicense(item.id).subscribe(async () => {
              this.loadData();
              const toast = await this.toastCtrl.create({
                message: 'Producto eliminado del catálogo.',
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
