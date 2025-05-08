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
  nombreJugador: string = ''; // Aquí se guarda el nombre introducido por el jugador

  constructor(private router: Router) {}

  // Al pulsar el botón "JUGAR" validamos que haya escrito algo y lo guardamos
  comenzarPartida() {
    if (this.nombreJugador.trim() !== '') {
      localStorage.setItem('nombreJugador', this.nombreJugador); // Guardamos nombre
      this.router.navigateByUrl('/game'); // Navegamos al juego
    } else {
      alert('Por favor, introduce tu nombre antes de empezar.');
    }
  }
}
