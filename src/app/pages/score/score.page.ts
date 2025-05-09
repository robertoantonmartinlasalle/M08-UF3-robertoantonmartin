// src/app/pages/score/score.page.ts
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ScoreManager, RegistroPuntuacion } from './score-manager';

@Component({
  selector: 'app-score',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './score.page.html',
  styleUrls: ['./score.page.scss'],
})
export class ScorePage {
  nombreJugador: string = '';
  ultimaPuntuacion: number = 0;
  puntuacionMaxima: number = 0;
  esNuevoRecord: boolean = false;
  rankingGlobal: RegistroPuntuacion[] = [];

  constructor(private router: Router) {
    // Recupero los datos del jugador y su rendimiento
    this.nombreJugador = ScoreManager.getNombreJugador();
    this.ultimaPuntuacion = ScoreManager.getUltimaPuntuacion();
    this.puntuacionMaxima = ScoreManager.getMaximaPuntuacion(this.nombreJugador);
    this.esNuevoRecord = this.ultimaPuntuacion >= this.puntuacionMaxima;

    // Cargo el ranking global ordenado por puntuación
    this.rankingGlobal = ScoreManager.getRanking();
  }

  // Método que se ejecuta al pulsar el botón "Volver a jugar"
  volverAlInicio() {
    // Redirijo a /home limpiando la ruta anterior para forzar recarga completa
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
