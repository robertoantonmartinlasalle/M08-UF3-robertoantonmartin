// game.page.ts
// He adaptado esta versión para usar un fondo diferente en móvil vertical y otro en horizontal o navegador.
// Cargo ambos fondos al iniciar y cambio dinámicamente el que se muestra según la orientación.

import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import Phaser from 'phaser';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
})
export class GamePage implements AfterViewInit, OnDestroy {
  phaserGame!: Phaser.Game;

  constructor() {}

  ngAfterViewInit(): void {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'phaser-game',
      backgroundColor: '#000000',
      scene: {
        preload: function () {
          // Cargo los dos fondos al iniciar el juego
          this.load.image('background', 'assets/game/background.png'); // Horizontal y navegador
          this.load.image('background-vertical', 'assets/game/background-vertical.png'); // Móvil vertical
        },

        create: function () {
          const width = this.sys.game.config.width as number;
          const height = this.sys.game.config.height as number;

          // Detecto si es móvil y vertical
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          const isVertical = height > width;

          const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

          // Añado el fondo correspondiente y lo escalo
          const bg = this.add.image(0, 0, fondoKey).setOrigin(0, 0);
          bg.setDisplaySize(width, height);

          // Guardo el fondo para poder reemplazarlo si rota la pantalla
          this.registry.set('currentBackground', bg);
        },

        update: function () {
          // No necesito lógica de juego por ahora
        }
      },

      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    this.phaserGame = new Phaser.Game(config);

    window.addEventListener('resize', this.resizeGame);
  }

  resizeGame = () => {
    if (!this.phaserGame?.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.phaserGame.scale.resize(width, height);

    const scene = this.phaserGame.scene.scenes[0];

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;

    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    // Elimino el fondo actual
    const currentBg = scene.registry.get('currentBackground');
    if (currentBg) currentBg.destroy();

    // Añado el nuevo fondo adaptado a la nueva orientación
    const newBg = scene.add.image(0, 0, fondoKey).setOrigin(0, 0);
    newBg.setDisplaySize(width, height);

    // Guardo el nuevo fondo activo
    scene.registry.set('currentBackground', newBg);
  };

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeGame);
  }
}
