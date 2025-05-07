import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import Phaser from 'phaser';

// Esta clase contiene toda la lógica principal del juego: carga de assets, creación de objetos,
// control de movimientos, generación de enemigos, disparos y colisiones.
class GameScene extends Phaser.Scene {
  private misiles!: Phaser.Physics.Arcade.Group;
  private enemigos!: Phaser.Physics.Arcade.Group;
  private tiempoUltimoEnemigo = 0; // Controla cada cuánto tiempo genero enemigos

  constructor() {
    super({ key: 'game' });
  }

  preload(): void {
    // En esta función cargo todas las imágenes necesarias para el juego (fondos, nave, misiles, enemigos y explosiones)
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

    // Aquí detecto si el dispositivo está en modo vertical (por ejemplo, móviles)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;
    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    // Coloco el fondo adaptado a la pantalla y lo guardo en el registro
    const bg = this.add.image(0, 0, fondoKey).setOrigin(0, 0);
    bg.setDisplaySize(width, height);
    this.registry.set('currentBackground', bg);

    // Creo la nave y le aplico una animación de entrada desde la parte inferior
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

    // Capturo las teclas necesarias para controlar la nave (flechas, A, D y espacio)
    const cursors = this.input.keyboard?.createCursorKeys();
    const keys = this.input.keyboard?.addKeys('A,D,SPACE');
    this.registry.set('keys', { cursors, keys });

    // Creo los grupos físicos de misiles y enemigos
    this.misiles = this.physics.add.group();
    this.enemigos = this.physics.add.group();
    this.registry.set('misiles', this.misiles);
    this.registry.set('enemigos', this.enemigos);

    // Si el jugador pulsa el botón táctil de disparo, lo marco en el registro
    const botonDisparo = document.getElementById('boton-disparo');
    botonDisparo?.addEventListener('click', () => {
      this.registry.set('touchShoot', true);
    });

    // Control táctil: muevo la nave a izquierda o derecha según la zona pulsada
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const dir = pointer.x < width / 2 ? 'izq' : 'der';
      this.registry.set('touchDirection', dir);
    });

    this.input.on('pointerup', () => {
      this.registry.set('touchDirection', null);
    });

    // Aquí gestiono las colisiones entre misiles y enemigos
    this.physics.add.overlap(this.misiles, this.enemigos, (misil, enemigo) => {
      const enemigoSprite = enemigo as Phaser.Physics.Arcade.Image;
      const tipo = enemigoSprite.texture.key;

      // Detengo el movimiento del enemigo cuando recibe impacto
      enemigoSprite.setVelocityY(0);

      // Cambiaré la textura según el tipo de enemigo, y ajustaré su escala para simular la explosión
      if (tipo === 'meteorito1' || tipo === 'meteorito2') {
        enemigoSprite.setTexture('explosion');
        enemigoSprite.setScale(0.2); // Escala reducida para explosión de meteorito
      } else if (tipo === 'bomba') {
        enemigoSprite.setTexture('bombaColision');
        enemigoSprite.setScale(0.9); // Escala grande para explosión de bomba (el doble)
      }

      // Elimino el misil tras impactar
      misil.destroy();

      // Espero 300 milisegundos para mostrar la explosión antes de destruir el enemigo
      this.time.delayedCall(300, () => {
        enemigoSprite.destroy();
      });
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

    // Movimiento con teclado: izquierda (flecha o A)
    if (keys.cursors?.left?.isDown || keys.keys?.A?.isDown) {
      nave.x = Math.max(nave.x - speed, nave.width * nave.scaleX / 2);
    }

    // Movimiento con teclado: derecha (flecha o D)
    if (keys.cursors?.right?.isDown || keys.keys?.D?.isDown) {
      nave.x = Math.min(nave.x + speed, width - nave.width * nave.scaleX / 2);
    }

    // Movimiento con pantalla táctil
    if (dir === 'izq') {
      nave.x = Math.max(nave.x - speed, nave.width * nave.scaleX / 2);
    } else if (dir === 'der') {
      nave.x = Math.min(nave.x + speed, width - nave.width * nave.scaleX / 2);
    }

    // Si se pulsa espacio o el botón táctil, disparo un misil
    if (Phaser.Input.Keyboard.JustDown(keys.keys.SPACE) || shouldShoot) {
      const misil = misiles.create(nave.x, nave.y - (nave.displayHeight / 2), 'misil');
      misil.setScale(0.15);
      misil.setVelocityY(-400); // El misil sube hacia arriba
      this.registry.set('touchShoot', false); // Reinicio el disparo táctil
    }

    // Recorro los misiles para eliminar los que salen de la pantalla
    misiles.getChildren().forEach((m: Phaser.GameObjects.GameObject) => {
      const sprite = m as Phaser.Physics.Arcade.Image;
      if (sprite.y < -50) {
        misiles.remove(sprite, true, true);
      }
    });

    // Cada 1.5 segundos genero un nuevo enemigo aleatorio
    if (time > this.tiempoUltimoEnemigo + 1500) {
      this.tiempoUltimoEnemigo = time;

      const tipo = Phaser.Math.Between(0, 2); // 0 = meteorito1, 1 = meteorito2, 2 = bomba
      const spriteKey = tipo === 0 ? 'meteorito1' : tipo === 1 ? 'meteorito2' : 'bomba';
      const x = Phaser.Math.Between(30, width - 30);
      const enemigo = enemigos.create(x, -50, spriteKey);
      enemigo.setScale(0.25);
      enemigo.setVelocityY(Phaser.Math.Between(100, 200)); // Caída aleatoria en velocidad
    }

    // Elimino enemigos que ya hayan salido por la parte inferior de la pantalla
    enemigos.getChildren().forEach((e: Phaser.GameObjects.GameObject) => {
      const sprite = e as Phaser.Physics.Arcade.Image;
      if (sprite.y > height + 50) {
        enemigos.remove(sprite, true, true);
      }
    });
  }
}

// Componente Angular que inicia el juego de Phaser y gestiona el redimensionado en móviles
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

  // Al iniciar la vista, configuro y lanzo el juego con Phaser
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

  // Si cambia el tamaño de pantalla, reajusto el fondo y la nave
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
    // Elimino el listener de redimensionado para evitar fugas de memoria
    window.removeEventListener('resize', this.resizeGame);
  }
}
