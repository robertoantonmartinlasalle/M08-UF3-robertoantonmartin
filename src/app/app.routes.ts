// src/app/app.routes.ts
// Aquí configuro las rutas de la app y cambio la ruta por defecto para que abra directamente el juego

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'game',
    loadComponent: () =>
      import('./pages/game/game.page').then((m) => m.GamePage),
  },
  {
    path: '',
    redirectTo: 'game', // Cambio aquí para que arranque directamente en la pantalla del juego
    pathMatch: 'full',
  }
];
