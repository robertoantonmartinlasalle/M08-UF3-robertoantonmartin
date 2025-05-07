import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import Phaser from 'phaser';

// Esta clase GameScene contiene toda la lógica del juego: fondo, nave, controles y disparos
class GameScene extends Phaser.Scene {
  private misiles!: Phaser.Physics.Arcade.Group;

  constructor() {
    super({ key: 'game' }); // Asigno una clave identificadora a la escena
  }

  preload(): void {
    // Cargo todas las imágenes necesarias para el juego
    this.load.image('background', 'assets/game/background.png');
    this.load.image('background-vertical', 'assets/game/background-vertical.png');
    this.load.image('nave', 'assets/game/nave.png');
    this.load.image('misil', 'assets/game/Misil.png');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Detecto si es móvil en vertical para poner el fondo vertical o normal
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;
    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    // Añado el fondo y lo ajusto al tamaño de pantalla
    const bg = this.add.image(0, 0, fondoKey).setOrigin(0, 0);
    bg.setDisplaySize(width, height);
    this.registry.set('currentBackground', bg);

    // Creo la nave, la posiciono fuera de la pantalla y la animo hacia arriba
    const nave = this.add.image(width / 2, height + 100, 'nave')
      .setOrigin(0.5)
      .setScale(0.18);

    this.tweens.add({
      targets: nave,
      y: height - 80,
      duration: 700,
      ease: 'Power2'
    });

    this.registry.set('nave', nave);

    // Capturo las teclas del teclado (flechas, A, D, espacio)
    const cursors = this.input.keyboard?.createCursorKeys();
    const keys = this.input.keyboard?.addKeys('A,D,SPACE');
    this.registry.set('keys', { cursors, keys });

    // Creo un grupo de misiles con físicas para poder moverlos
    this.misiles = this.physics.add.group();
    this.registry.set('misiles', this.misiles);

    // En móviles: detecto si se toca la izquierda o derecha de la pantalla
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const dir = pointer.x < width / 2 ? 'izq' : 'der';
      this.registry.set('touchDirection', dir);
    });

    this.input.on('pointerup', () => {
      this.registry.set('touchDirection', null);
    });
  }

  override update(): void {
    const nave = this.registry.get('nave') as Phaser.GameObjects.Image;
    const keys = this.registry.get('keys') as any;
    const dir = this.registry.get('touchDirection');
    const misiles = this.registry.get('misiles') as Phaser.Physics.Arcade.Group;

    if (!nave || !keys || !misiles) return;

    const speed = 10;
    const width = this.scale.width;

    // Movimiento por teclado
    if (keys.cursors?.left?.isDown || keys.keys?.A?.isDown) {
      nave.x = Math.max(nave.x - speed, nave.width * nave.scaleX / 2);
    }
    if (keys.cursors?.right?.isDown || keys.keys?.D?.isDown) {
      nave.x = Math.min(nave.x + speed, width - nave.width * nave.scaleX / 2);
    }

    // Movimiento táctil en móviles
    if (dir === 'izq') {
      nave.x = Math.max(nave.x - speed, nave.width * nave.scaleX / 2);
    } else if (dir === 'der') {
      nave.x = Math.min(nave.x + speed, width - nave.width * nave.scaleX / 2);
    }

    // Disparo si se pulsa espacio (solo una vez por pulsación)
    if (Phaser.Input.Keyboard.JustDown(keys.keys.SPACE)) {
      // Ahora posiciono el misil justo en la punta de la nave con displayHeight
      const misil = misiles.create(nave.x, nave.y - (nave.displayHeight / 2), 'misil');
      misil.setScale(0.15);
      misil.setVelocityY(-400); // El misil sube hacia arriba
    }

    // Elimino misiles que ya han salido fuera de la pantalla
    misiles.getChildren().forEach((m: Phaser.GameObjects.GameObject) => {
      const sprite = m as Phaser.Physics.Arcade.Image;
      if (sprite.y < -50) {
        misiles.remove(sprite, true, true);
      }
    });
  }
}

// Este componente es el que monta el juego dentro de Ionic y gestiona el redimensionado
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

  // Al cargar la vista, lanzo el juego de Phaser con su configuración
  ngAfterViewInit(): void {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'phaser-game',
      backgroundColor: '#000000',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scene: GameScene,
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    this.phaserGame = new Phaser.Game(config);
    window.addEventListener('resize', this.resizeGame);
  }

  // Cuando la pantalla cambia de tamaño (rotación, etc.), adapto el fondo y la nave
  resizeGame = () => {
    if (!this.phaserGame?.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.phaserGame.scale.resize(width, height);

    const scene = this.phaserGame.scene.scenes[0] as GameScene;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;
    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    const currentBg = scene.registry.get('currentBackground');
    if (currentBg) currentBg.destroy();

    const newBg = scene.add.image(0, 0, fondoKey).setOrigin(0, 0);
    newBg.setDisplaySize(width, height);
    scene.registry.set('currentBackground', newBg);

    const naveAnterior = scene.registry.get('nave');
    if (naveAnterior) naveAnterior.destroy();

    const nuevaNave = scene.add.image(width / 2, height - 80, 'nave')
      .setOrigin(0.5)
      .setScale(0.18);

    scene.registry.set('nave', nuevaNave);
  };

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeGame);
  }
}
