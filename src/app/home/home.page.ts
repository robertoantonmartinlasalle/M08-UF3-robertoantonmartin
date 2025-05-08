// home.page.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  nombreJugador: string = ''; // Variable donde se almacena el nombre ingresado

  constructor(private router: Router) {}

  // Función que se ejecuta al pulsar el botón JUGAR
  comenzarPartida() {
    if (this.nombreJugador.trim() !== '') {
      localStorage.setItem('nombreJugador', this.nombreJugador);
      this.router.navigateByUrl('/game'); // Navegamos a la pantalla del juego
    } else {
      alert('Por favor, introduce tu nombre antes de comenzar.');
    }
  }
}
