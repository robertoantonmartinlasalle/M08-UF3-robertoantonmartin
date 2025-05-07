import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import Phaser from 'phaser';

// Esta clase contiene toda la lógica del juego: fondo, nave, misiles, enemigos y controles
class GameScene extends Phaser.Scene {
  private misiles!: Phaser.Physics.Arcade.Group;
  private enemigos!: Phaser.Physics.Arcade.Group;
  private tiempoUltimoEnemigo = 0;

  constructor() {
    super({ key: 'game' });
  }

  preload(): void {
    // Cargo todas las imágenes necesarias para el juego
    this.load.image('background', 'assets/game/background.png');
    this.load.image('background-vertical', 'assets/game/background-vertical.png');
    this.load.image('nave', 'assets/game/nave.png');
    this.load.image('misil', 'assets/game/Misil.png');
    this.load.image('meteorito1', 'assets/game/Meteorito_1.png');
    this.load.image('meteorito2', 'assets/game/Meteorito_2.png');
    this.load.image('bomba', 'assets/game/Bomba.png');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Detecto si es móvil en vertical para el fondo
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;
    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    // Añado el fondo
    const bg = this.add.image(0, 0, fondoKey).setOrigin(0, 0);
    bg.setDisplaySize(width, height);
    this.registry.set('currentBackground', bg);

    // Añado la nave y la animo desde fuera de pantalla
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

    // Capturo teclas de dirección y disparo
    const cursors = this.input.keyboard?.createCursorKeys();
    const keys = this.input.keyboard?.addKeys('A,D,SPACE');
    this.registry.set('keys', { cursors, keys });

    // Grupos de misiles y enemigos (bombas y meteoritos)
    this.misiles = this.physics.add.group();
    this.enemigos = this.physics.add.group();
    this.registry.set('misiles', this.misiles);
    this.registry.set('enemigos', this.enemigos);

    // Botón de disparo táctil para móviles
    const botonDisparo = document.getElementById('boton-disparo');
    botonDisparo?.addEventListener('click', () => {
      this.registry.set('touchShoot', true);
    });

    // Movimiento táctil en móviles
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const dir = pointer.x < width / 2 ? 'izq' : 'der';
      this.registry.set('touchDirection', dir);
    });

    this.input.on('pointerup', () => {
      this.registry.set('touchDirection', null);
    });
  }

  override update(time: number): void {
    const nave = this.registry.get('nave') as Phaser.GameObjects.Image;
    const keys = this.registry.get('keys') as any;
    const dir = this.registry.get('touchDirection');
    const misiles = this.registry.get('misiles') as Phaser.Physics.Arcade.Group;
    const enemigos = this.registry.get('enemigos') as Phaser.Physics.Arcade.Group;
    const shouldShoot = this.registry.get('touchShoot') === true;

    if (!nave || !keys || !misiles || !enemigos) return;

    const speed = 10;
    const width = this.scale.width;
    const height = this.scale.height;

    // Movimiento con teclado
    if (keys.cursors?.left?.isDown || keys.keys?.A?.isDown) {
      nave.x = Math.max(nave.x - speed, nave.width * nave.scaleX / 2);
    }
    if (keys.cursors?.right?.isDown || keys.keys?.D?.isDown) {
      nave.x = Math.min(nave.x + speed, width - nave.width * nave.scaleX / 2);
    }

    // Movimiento táctil
    if (dir === 'izq') {
      nave.x = Math.max(nave.x - speed, nave.width * nave.scaleX / 2);
    } else if (dir === 'der') {
      nave.x = Math.min(nave.x + speed, width - nave.width * nave.scaleX / 2);
    }

    // Disparo por teclado o táctil
    if (Phaser.Input.Keyboard.JustDown(keys.keys.SPACE) || shouldShoot) {
      const misil = misiles.create(nave.x, nave.y - (nave.displayHeight / 2), 'misil');
      misil.setScale(0.15);
      misil.setVelocityY(-400);
      this.registry.set('touchShoot', false);
    }

    // Elimino misiles fuera de pantalla
    misiles.getChildren().forEach((m: Phaser.GameObjects.GameObject) => {
      const sprite = m as Phaser.Physics.Arcade.Image;
      if (sprite.y < -50) {
        misiles.remove(sprite, true, true);
      }
    });

    // Cada 1.5 segundos creo un nuevo enemigo
    if (time > this.tiempoUltimoEnemigo + 1500) {
      this.tiempoUltimoEnemigo = time;

      // Aleatoriamente elijo meteorito 1, meteorito 2 o bomba
      const tipo = Phaser.Math.Between(0, 2);
      const spriteKey = tipo === 0 ? 'meteorito1' : tipo === 1 ? 'meteorito2' : 'bomba';
      const x = Phaser.Math.Between(30, width - 30);
      const enemigo = enemigos.create(x, -50, spriteKey);
      enemigo.setScale(0.25);
      enemigo.setVelocityY(Phaser.Math.Between(100, 200));
    }

    // Elimino enemigos que salen por debajo
    enemigos.getChildren().forEach((e: Phaser.GameObjects.GameObject) => {
      const sprite = e as Phaser.Physics.Arcade.Image;
      if (sprite.y > height + 50) {
        enemigos.remove(sprite, true, true);
      }
    });
  }
}

// Componente Angular que lanza el juego
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
