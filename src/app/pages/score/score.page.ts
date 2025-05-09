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

  private audio: HTMLAudioElement; // Variable para almacenar la música de puntuación

  constructor(private router: Router) {
    // Recupero los datos del jugador y su rendimiento
    this.nombreJugador = ScoreManager.getNombreJugador();
    this.ultimaPuntuacion = ScoreManager.getUltimaPuntuacion();
    this.puntuacionMaxima = ScoreManager.getMaximaPuntuacion(this.nombreJugador);
    this.esNuevoRecord = this.ultimaPuntuacion >= this.puntuacionMaxima;

    // Cargo el ranking global ordenado por puntuación
    this.rankingGlobal = ScoreManager.getRanking();

    // Inicializo y reproduzco la música de fondo para la pantalla de puntuación
    this.audio = new Audio('assets/sounds/puntuacion.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.5;
    this.audio.play().catch(e => console.warn('No se pudo reproducir la música de puntuación:', e));
  }

  // Método que se ejecuta al pulsar el botón "Volver a jugar"
  volverAlInicio() {
    // Detengo la música antes de salir
    this.audio.pause();
    this.audio.currentTime = 0;

    // Redirijo a /home limpiando la ruta anterior para forzar recarga completa
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
