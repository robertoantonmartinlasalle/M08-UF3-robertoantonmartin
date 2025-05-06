// game.page.ts

import { Component, AfterViewInit } from '@angular/core';
import Phaser from 'phaser';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
})
export class GamePage implements AfterViewInit {

  // Creo una propiedad para almacenar la instancia del juego
  phaserGame!: Phaser.Game;

  constructor() {}

  ngAfterViewInit(): void {
    // Configuración de la escena con un preload, create y update
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 360,
      height: 640,
      parent: 'phaser-game',  // ID del div en el HTML
      scene: {
        preload: function () {
          // Aquí cargaré el fondo como prueba
          this.load.image('background', 'assets/game/background.png');
        },
        create: function () {
          // Muestro el fondo centrado
          this.add.image(180, 320, 'background');
        },
        update: function () {
          // De momento no necesito lógica aquí
        }
      }
    };

    // Instancio el juego de Phaser
    this.phaserGame = new Phaser.Game(config);
  }
}
