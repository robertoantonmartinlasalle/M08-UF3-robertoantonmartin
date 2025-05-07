// game.page.ts
// He adaptado esta versión para que la nave aparezca con animación solo la primera vez que se carga,
// y que en redimensionados simplemente se destruya y vuelva a crear sin perder su posición.
// Esto evita el fallo visual de que desaparezca, pero conservo la animación original de entrada.

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
          // Cargo las imágenes necesarias: fondos y nave
          this.load.image('background', 'assets/game/background.png');
          this.load.image('background-vertical', 'assets/game/background-vertical.png');
          this.load.image('nave', 'assets/game/nave.png');
        },

        create: function () {
          const width = this.sys.game.config.width as number;
          const height = this.sys.game.config.height as number;

          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          const isVertical = height > width;
          const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

          // Añado el fondo adecuado según orientación
          const bg = this.add.image(0, 0, fondoKey).setOrigin(0, 0);
          bg.setDisplaySize(width, height);
          this.registry.set('currentBackground', bg);

          // Añado la nave fuera de pantalla (parte baja) y la animo hacia su posición final
          const nave = this.add.image(width / 2, height + 100, 'nave')
            .setOrigin(0.5, 0.5)
            .setScale(0.18); // 🔽 Reduzco el tamaño visual de la nave

          this.tweens.add({
            targets: nave,
            y: height - 80,
            duration: 700,
            ease: 'Power2'
          });

          this.registry.set('nave', nave); // Guardo la nave para recolocarla si la pantalla cambia
        },

        update: function () {
          // No hay lógica continua por ahora
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

  // Esta función se ejecuta cuando cambia el tamaño de la pantalla
  resizeGame = () => {
    if (!this.phaserGame?.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.phaserGame.scale.resize(width, height);

    const scene = this.phaserGame.scene.scenes[0];
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;
    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    // 🔄 Elimino y recreo el fondo adaptado
    const currentBg = scene.registry.get('currentBackground');
    if (currentBg) currentBg.destroy();

    const newBg = scene.add.image(0, 0, fondoKey).setOrigin(0, 0);
    newBg.setDisplaySize(width, height);
    scene.registry.set('currentBackground', newBg);

    // 🔄 Elimino y vuelvo a crear la nave (sin animación esta vez)
    const naveAnterior = scene.registry.get('nave');
    if (naveAnterior) naveAnterior.destroy();

    const nuevaNave = scene.add.image(width / 2, height - 80, 'nave')
      .setOrigin(0.5, 0.5)
      .setScale(0.18); // 🔽 Mantengo tamaño reducido

    scene.registry.set('nave', nuevaNave);
  };

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeGame);
  }
}
