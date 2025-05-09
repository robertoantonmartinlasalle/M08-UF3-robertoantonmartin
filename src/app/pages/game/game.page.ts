// src/app/pages/game/game.page.ts
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import Phaser from 'phaser';
import { ScoreManager } from '../score/score-manager';

// Esta clase representa toda la lógica del juego. Aquí defino lo que se ve en pantalla,
// cómo se mueve la nave, cómo se dispara, cómo aparecen los enemigos, y cómo se controlan
// las colisiones y el sistema de puntuación.
class GameScene extends Phaser.Scene {
  private misiles!: Phaser.Physics.Arcade.Group;
  private enemigos!: Phaser.Physics.Arcade.Group;
  private scoreManager!: ScoreManager;
  private tiempoUltimoEnemigo = 0;
  private sonidoDisparo!: Phaser.Sound.BaseSound; // Variable para almacenar el sonido de disparo
  private sonidoExplosion!: Phaser.Sound.BaseSound; // Variable para almacenar el sonido de explosión

  constructor() {
    // Asigno un nombre a la escena
    super({ key: 'game' });
  }

  preload(): void {
    // Aquí cargo todos los recursos gráficos necesarios para que el juego funcione
    this.load.image('background', 'assets/game/background.png');
    this.load.image('background-vertical', 'assets/game/background-vertical.png');
    this.load.image('nave', 'assets/game/nave.png');
    this.load.image('misil', 'assets/game/Misil.png');
    this.load.image('meteorito1', 'assets/game/Meteorito_1.png');
    this.load.image('meteorito2', 'assets/game/Meteorito_2.png');
    this.load.image('bomba', 'assets/game/Bomba.png');
    this.load.image('explosion', 'assets/game/Explosion.png');
    this.load.image('bombaColision', 'assets/game/Bomba_colision.png');

    // Cargamos el sonido de disparo que se reproducirá al lanzar un misil
    this.load.audio('sonidoDisparo', 'assets/sounds/disparo.mp3');

    // Cargamos el sonido de explosión que se reproducirá al destruir enemigos
    this.load.audio('sonidoExplosion', 'assets/sounds/explosion.mp3');

    // Cargamos la música de fondo que se reproducirá durante toda la partida en bucle
    this.load.audio('musicaFondo', 'assets/sounds/Attack of the Glyphids.mp3');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Detecto si el dispositivo es móvil y está en vertical para adaptar el fondo
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;
    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    // Coloco el fondo ajustado al tamaño de pantalla
    const bg = this.add.image(0, 0, fondoKey).setOrigin(0, 0);
    bg.setDisplaySize(width, height);
    this.registry.set('currentBackground', bg);

    // Añado la nave del jugador con una animación para que entre desde abajo
    const nave = this.add.image(width / 2, height + 100, 'nave')
      .setOrigin(0.5)
      .setScale(0.18);
    this.tweens.add({ targets: nave, y: height - 80, duration: 700, ease: 'Power2' });
    this.registry.set('nave', nave);

    // Capturo teclas para moverme (A y D) y disparar (barra espaciadora)
    const cursors = this.input.keyboard?.createCursorKeys();
    const keys = this.input.keyboard?.addKeys('A,D,SPACE');
    this.registry.set('keys', { cursors, keys });

    // Inicializo los grupos de misiles y enemigos
    this.misiles = this.physics.add.group();
    this.enemigos = this.physics.add.group();
    this.registry.set('misiles', this.misiles);
    this.registry.set('enemigos', this.enemigos);

    // Inicio el sistema de puntuación
    this.scoreManager = new ScoreManager(this);
    this.scoreManager.init();

    // Inicializo el sonido de disparo para usarlo más adelante
    this.sonidoDisparo = this.sound.add('sonidoDisparo');

    // Inicializo el sonido de explosión para usarlo cuando se destruye un enemigo
    this.sonidoExplosion = this.sound.add('sonidoExplosion');

    // Reproduzco la música de fondo en bucle durante toda la partida
    const musicaFondo = this.sound.add('musicaFondo', { loop: true, volume: 0.5 });
    musicaFondo.play();

    // Disparo táctil desde botón en móvil
    const botonDisparo = document.getElementById('boton-disparo');
    botonDisparo?.addEventListener('click', () => {
      this.registry.set('touchShoot', true);
    });

    // Movimiento táctil: izquierda o derecha dependiendo de donde se pulse
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const dir = pointer.x < width / 2 ? 'izq' : 'der';
      this.registry.set('touchDirection', dir);
    });
    this.input.on('pointerup', () => {
      this.registry.set('touchDirection', null);
    });

    // Defino lo que ocurre cuando un misil impacta con un enemigo
    this.physics.add.overlap(this.misiles, this.enemigos, (misil, enemigo) => {
      const enemigoSprite = enemigo as Phaser.Physics.Arcade.Image;
      const tipo = enemigoSprite.texture.key;
      enemigoSprite.setVelocityY(0);

      if (tipo === 'meteorito1' || tipo === 'meteorito2') {
        enemigoSprite.setTexture('explosion');
        enemigoSprite.setScale(0.2);
        enemigoSprite.setData('esExplosion', true);
        this.scoreManager.add(1);

        // Reproduzco el sonido de explosión al destruir el enemigo
        this.sonidoExplosion?.play();
      } else if (tipo === 'bomba') {
        enemigoSprite.setTexture('bombaColision');
        enemigoSprite.setScale(0.9);
        enemigoSprite.setData('esExplosion', true);
        this.scoreManager.add(1);

        // Reproduzco el sonido de explosión al destruir la bomba
        this.sonidoExplosion?.play();
      }

      misil.destroy();
      this.time.delayedCall(300, () => enemigoSprite.destroy());
    });

    // Controles de menú: pausa, reanudar y reinicio
    const btnMenu = document.getElementById('btn-menu');
    const menuPanel = document.getElementById('menu-panel');
    const btnReanudar = document.getElementById('btn-reanudar');
    const btnReiniciar = document.getElementById('btn-reiniciar');

    btnMenu?.addEventListener('click', () => {
      this.scene.pause();
      if (menuPanel) {
        menuPanel.classList.add('mostrar');
        (menuPanel as HTMLElement).style.display = 'flex';
      }
    });

    btnReanudar?.addEventListener('click', () => {
      this.scene.resume();
      if (menuPanel) (menuPanel as HTMLElement).style.display = 'none';
    });

    btnReiniciar?.addEventListener('click', () => {
      this.scene.restart();
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

    // Movimiento lateral con teclado o pantalla táctil
    if (keys.cursors?.left?.isDown || keys.keys?.A?.isDown || dir === 'izq') {
      nave.x = Math.max(nave.x - speed, nave.width * nave.scaleX / 2);
    }
    if (keys.cursors?.right?.isDown || keys.keys?.D?.isDown || dir === 'der') {
      nave.x = Math.min(nave.x + speed, width - nave.width * nave.scaleX / 2);
    }

    // Disparo con barra espaciadora o botón táctil
    if (Phaser.Input.Keyboard.JustDown(keys.keys.SPACE) || shouldShoot) {
      const misil = misiles.create(nave.x, nave.y - (nave.displayHeight / 2), 'misil');
      misil.setScale(0.15);
      misil.setVelocityY(-400);

      // Reproduzco el sonido al disparar
      this.sonidoDisparo?.play();

      this.registry.set('touchShoot', false);
    }

    // Elimino los misiles que salen fuera de la pantalla
    misiles.getChildren().forEach((m: Phaser.GameObjects.GameObject) => {
      const sprite = m as Phaser.Physics.Arcade.Image;
      if (sprite.y < -50) {
        misiles.remove(sprite, true, true);
      }
    });

    // Genero enemigos nuevos 
    if (time > this.tiempoUltimoEnemigo + 500) {
      this.tiempoUltimoEnemigo = time;
      const tipo = Phaser.Math.Between(0, 2);
      const spriteKey = tipo === 0 ? 'meteorito1' : tipo === 1 ? 'meteorito2' : 'bomba';
      const x = Phaser.Math.Between(30, width - 30);
      const enemigo = enemigos.create(x, -50, spriteKey);
      enemigo.setScale(0.25);
      enemigo.setVelocityY(Phaser.Math.Between(300, 600));
    }

    // Compruebo colisiones entre enemigos y la nave
    enemigos.getChildren().forEach((e: Phaser.GameObjects.GameObject) => {
      const sprite = e as Phaser.Physics.Arcade.Image;
      const distanciaX = Math.abs(sprite.x - nave.x);
      const distanciaY = Math.abs(sprite.y - nave.y);
      const radioColision = sprite.getData('esExplosion') ? 120 : 40;

      if (distanciaX < radioColision && distanciaY < radioColision) {
        // Si un enemigo impacta la nave, termina la partida
        sprite.setVelocityY(0);
        const key = sprite.texture.key;

        if (key === 'meteorito1' || key === 'meteorito2') {
          sprite.setTexture('explosion');
          sprite.setScale(0.2);
        } else if (key === 'bomba') {
          sprite.setTexture('bombaColision');
          sprite.setScale(0.9);
        }

        sprite.setData('esExplosion', true);
        this.scoreManager.guardarResultadoFinal();

        // Redirijo a la pantalla de puntuación tras 1 segundo
        this.time.delayedCall(500, () => {
          window.location.href = '/score';
        });
      }

      // Elimino enemigos que han salido por la parte inferior
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
    // Configuro el juego al iniciar la vista con tamaño completo y sin bordes
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

  // Ajusto el fondo y nave cuando cambia el tamaño de la pantalla
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

  // Elimino el listener cuando se destruye el componente
  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeGame);
  }
}
