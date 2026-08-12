// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // Para probar en el navegador (ng serve / ionic serve): dejá localhost.
  // Para probar en un teléfono físico o emulador: cambiá esto por la IP
  // LAN de tu PC (ej: 'http://192.168.1.100:3000/api') o 'http://10.0.2.2:3000/api'
  // si usás el emulador de Android. Debe coincidir con lo que pusiste en
  // network_security_config.xml.
  apiUrl: 'http://localhost:3000'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
