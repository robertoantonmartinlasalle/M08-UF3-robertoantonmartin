import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import Phaser from 'phaser';
import { ScoreManager } from './score-manager';

// Esta clase es la que contiene toda la lógica del juego que he desarrollado para esta práctica.
// Aquí defino lo que se ve en pantalla, cómo se mueve la nave, cómo disparo, cómo aparecen los enemigos
// y cómo se gestionan las colisiones y la puntuación.
class GameScene extends Phaser.Scene {
  private misiles!: Phaser.Physics.Arcade.Group;
  private enemigos!: Phaser.Physics.Arcade.Group;
  private scoreManager!: ScoreManager;
  private tiempoUltimoEnemigo = 0;

  constructor() {
    // Le doy un nombre a la escena que voy a utilizar
    super({ key: 'game' });
  }

  preload(): void {
    // En esta función cargo todas las imágenes necesarias para el juego (nave, fondo, misiles, enemigos, etc.)
    this.load.image('background', 'assets/game/background.png');
    this.load.image('background-vertical', 'assets/game/background-vertical.png');
    this.load.image('nave', 'assets/game/nave.png');
    this.load.image('misil', 'assets/game/Misil.png');
    this.load.image('meteorito1', 'assets/game/Meteorito_1.png');
    this.load.image('meteorito2', 'assets/game/Meteorito_2.png');
    this.load.image('bomba', 'assets/game/Bomba.png');
    this.load.image('explosion', 'assets/game/Explosion.png');
    this.load.image('bombaColision', 'assets/game/Bomba_colision.png');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Detecto si el dispositivo es móvil y está en vertical para adaptar el fondo del juego
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;
    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    // Añado el fondo al juego y lo ajusto al tamaño de pantalla
    const bg = this.add.image(0, 0, fondoKey).setOrigin(0, 0);
    bg.setDisplaySize(width, height);
    this.registry.set('currentBackground', bg);

    // Añado la nave del jugador en la parte inferior con una pequeña animación de entrada
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

    // Capturo las teclas que utilizaré para moverme (A y D) y disparar (barra espaciadora)
    const cursors = this.input.keyboard?.createCursorKeys();
    const keys = this.input.keyboard?.addKeys('A,D,SPACE');
    this.registry.set('keys', { cursors, keys });

    // Inicializo los grupos que contendrán los misiles y los enemigos
    this.misiles = this.physics.add.group();
    this.enemigos = this.physics.add.group();
    this.registry.set('misiles', this.misiles);
    this.registry.set('enemigos', this.enemigos);

    // Inicio el sistema de puntuación que he creado con una clase aparte
    this.scoreManager = new ScoreManager(this);
    this.scoreManager.init();

    // Añado soporte táctil para disparar desde móvil
    const botonDisparo = document.getElementById('boton-disparo');
    botonDisparo?.addEventListener('click', () => {
      this.registry.set('touchShoot', true);
    });

    // Añado control táctil para mover la nave con el dedo (izquierda o derecha)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const dir = pointer.x < width / 2 ? 'izq' : 'der';
      this.registry.set('touchDirection', dir);
    });

    this.input.on('pointerup', () => {
      this.registry.set('touchDirection', null);
    });

    // Configuro lo que pasa cuando un misil impacta a un enemigo
    this.physics.add.overlap(this.misiles, this.enemigos, (misil, enemigo) => {
      const enemigoSprite = enemigo as Phaser.Physics.Arcade.Image;
      const tipo = enemigoSprite.texture.key;

      enemigoSprite.setVelocityY(0);

      if (tipo === 'meteorito1' || tipo === 'meteorito2') {
        enemigoSprite.setTexture('explosion');
        enemigoSprite.setScale(0.2);
        this.scoreManager.add(1); // Sumo 1 punto si destruyo un meteorito
      } else if (tipo === 'bomba') {
        enemigoSprite.setTexture('bombaColision');
        enemigoSprite.setScale(0.9);
        this.scoreManager.add(1); // También sumo 1 punto por cada bomba destruida
      }

      misil.destroy(); // El misil desaparece al impactar

      this.time.delayedCall(300, () => {
        enemigoSprite.destroy(); // El enemigo también desaparece después de un tiempo
      });
    });
  }

  override update(time: number): void {
    // Recupero todos los elementos que necesito para actualizar el juego
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

    // Muevo la nave hacia la izquierda o la derecha con teclado o control táctil
    if (keys.cursors?.left?.isDown || keys.keys?.A?.isDown || dir === 'izq') {
      nave.x = Math.max(nave.x - speed, nave.width * nave.scaleX / 2);
    }
    if (keys.cursors?.right?.isDown || keys.keys?.D?.isDown || dir === 'der') {
      nave.x = Math.min(nave.x + speed, width - nave.width * nave.scaleX / 2);
    }

    // Si se pulsa espacio o el botón táctil, disparo un misil desde la nave
    if (Phaser.Input.Keyboard.JustDown(keys.keys.SPACE) || shouldShoot) {
      const misil = misiles.create(nave.x, nave.y - (nave.displayHeight / 2), 'misil');
      misil.setScale(0.15);
      misil.setVelocityY(-400);
      this.registry.set('touchShoot', false);
    }

    // Elimino los misiles que ya han salido fuera de la pantalla
    misiles.getChildren().forEach((m: Phaser.GameObjects.GameObject) => {
      const sprite = m as Phaser.Physics.Arcade.Image;
      if (sprite.y < -50) {
        misiles.remove(sprite, true, true);
      }
    });

    // Genero un nuevo enemigo aleatorio cada 1.5 segundos
    if (time > this.tiempoUltimoEnemigo + 1500) {
      this.tiempoUltimoEnemigo = time;

      const tipo = Phaser.Math.Between(0, 2);
      const spriteKey = tipo === 0 ? 'meteorito1' : tipo === 1 ? 'meteorito2' : 'bomba';
      const x = Phaser.Math.Between(30, width - 30);
      const enemigo = enemigos.create(x, -50, spriteKey);
      enemigo.setScale(0.25);
      enemigo.setVelocityY(Phaser.Math.Between(100, 200));
    }

    // Si un enemigo toca la nave, explota igual que si lo impactara un misil
    enemigos.getChildren().forEach((e: Phaser.GameObjects.GameObject) => {
      const sprite = e as Phaser.Physics.Arcade.Image;
      const distanciaX = Math.abs(sprite.x - nave.x);
      const distanciaY = Math.abs(sprite.y - nave.y);

      if (distanciaX < 40 && distanciaY < 40) {
        sprite.setVelocityY(0);
        if (sprite.texture.key === 'meteorito1' || sprite.texture.key === 'meteorito2') {
          sprite.setTexture('explosion');
          sprite.setScale(0.2);
        } else if (sprite.texture.key === 'bomba') {
          sprite.setTexture('bombaColision');
          sprite.setScale(0.9);
        }

        this.time.delayedCall(300, () => {
          sprite.destroy();
        });
      }

      // Elimino al enemigo si ya ha salido de la pantalla
      if (sprite.y > height + 50) {
        enemigos.remove(sprite, true, true);
      }
    });
  }
}

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
    // Aquí creo la configuración del juego con el tamaño de pantalla, fondo, físicas y la escena principal
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

  // Esta función se ejecuta al cambiar el tamaño de la pantalla para reajustar el fondo y la nave
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

  // Al salir de la pantalla elimino el listener de redimensionar
  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeGame);
  }
}
