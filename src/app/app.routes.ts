// src/app/app.routes.ts
// En este archivo configuro todas las rutas de navegación de la aplicación.
// Uso Angular Router para moverme entre pantallas sin recargar la aplicación.

// Importo el tipo Routes para definir las rutas
import { Routes } from '@angular/router';

// Defino el array de rutas de la app
export const routes: Routes = [
  {
    path: 'home', // Ruta para la pantalla de inicio
    loadComponent: () =>
      import('./home/home.page').then((m) => m.HomePage), // Cargo el componente HomePage de forma perezosa (lazy)
  },
  {
    path: 'game', // Ruta para la pantalla del juego
    loadComponent: () =>
      import('./pages/game/game.page').then((m) => m.GamePage), // Cargo el componente GamePage también de forma perezosa
  },
  {
    path: '', // Ruta raíz
    redirectTo: 'home', // Redirijo automáticamente a 'home' al iniciar la app
    pathMatch: 'full', // Aseguro que coincida exactamente la ruta vacía
  }
];
