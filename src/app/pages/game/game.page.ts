import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import Phaser from 'phaser';

// Esta clase GameScene contiene toda la lógica del juego
class GameScene extends Phaser.Scene {
  private misiles!: Phaser.Physics.Arcade.Group;

  constructor() {
    super({ key: 'game' }); // Asigno nombre identificador a la escena
  }

  preload(): void {
    // Carga de imágenes necesarias para el fondo, nave y misil
    this.load.image('background', 'assets/game/background.png');
    this.load.image('background-vertical', 'assets/game/background-vertical.png');
    this.load.image('nave', 'assets/game/nave.png');
    this.load.image('misil', 'assets/game/Misil.png');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Detecto si el dispositivo es móvil y está en vertical para adaptar el fondo
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;
    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    const bg = this.add.image(0, 0, fondoKey).setOrigin(0, 0);
    bg.setDisplaySize(width, height);
    this.registry.set('currentBackground', bg);

    // Creo la nave fuera de pantalla y la animo hacia su posición final
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

    // Capturo teclas: cursores, A y D y barra espaciadora
    const cursors = this.input.keyboard?.createCursorKeys();
    const keys = this.input.keyboard?.addKeys('A,D,SPACE');
    this.registry.set('keys', { cursors, keys });

    // Grupo de misiles con físicas
    this.misiles = this.physics.add.group();
    this.registry.set('misiles', this.misiles);

    // Botón táctil de disparo para Android y móviles
    const botonDisparo = document.getElementById('boton-disparo');
    botonDisparo?.addEventListener('click', () => {
      this.registry.set('touchShoot', true); // Marco que se ha pulsado el botón
    });

    // En móviles, detecto si se toca izquierda o derecha
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
    const shouldShoot = this.registry.get('touchShoot') === true;

    if (!nave || !keys || !misiles) return;

    const speed = 10;
    const width = this.scale.width;

    // Movimiento con teclado
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

    // Disparo con barra espaciadora (solo una vez por pulsación)
    if (Phaser.Input.Keyboard.JustDown(keys.keys.SPACE) || shouldShoot) {
      const misil = misiles.create(nave.x, nave.y - (nave.displayHeight / 2), 'misil');
      misil.setScale(0.15);
      misil.setVelocityY(-400); // El misil sube
      this.registry.set('touchShoot', false); // Reseteo si fue desde el botón táctil
    }

    // Elimino los misiles que salen de la pantalla por arriba
    misiles.getChildren().forEach((m: Phaser.GameObjects.GameObject) => {
      const sprite = m as Phaser.Physics.Arcade.Image;
      if (sprite.y < -50) {
        misiles.remove(sprite, true, true);
      }
    });
  }
}

// Componente de Angular que lanza el juego y gestiona el redimensionado
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
