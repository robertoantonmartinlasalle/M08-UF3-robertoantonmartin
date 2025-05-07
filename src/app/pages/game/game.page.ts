import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import Phaser from 'phaser';

// He creado esta clase GameScene que extiende Phaser.Scene para poder gestionar toda la lógica del juego (fondo, nave, controles, etc.)
class GameScene extends Phaser.Scene {
  constructor() {
    // Aquí le asigno un identificador a la escena para poder referenciarla
    super({ key: 'game' });
  }

  // Este método preload se ejecuta antes de crear la escena y sirve para cargar todos los recursos del juego
  preload(): void {
    this.load.image('background', 'assets/game/background.png');
    this.load.image('background-vertical', 'assets/game/background-vertical.png');
    this.load.image('nave', 'assets/game/nave.png');
  }

  // En este método creo todos los elementos visuales y los añado a la escena
  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Detecto si estoy en un móvil y en vertical para decidir qué imagen usar de fondo
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;
    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    // Añado el fondo y lo escalo al tamaño completo de la pantalla
    const bg = this.add.image(0, 0, fondoKey).setOrigin(0, 0);
    bg.setDisplaySize(width, height);
    this.registry.set('currentBackground', bg); // Guardo una referencia para redimensionar después

    // Creo la nave fuera de la pantalla (parte inferior) y luego la animo hacia su posición final
    const nave = this.add.image(width / 2, height + 100, 'nave')
      .setOrigin(0.5)
      .setScale(0.18); // Escalo la nave para que no ocupe demasiado

    this.tweens.add({
      targets: nave,
      y: height - 80,
      duration: 700,
      ease: 'Power2'
    });

    this.registry.set('nave', nave); // Guardo la nave en el registro para accederla en update

    // Capturo las teclas del cursor y también A y D por si se juega en teclado
    const cursors = this.input.keyboard?.createCursorKeys();
    const keys = this.input.keyboard?.addKeys('A,D');
    this.registry.set('keys', { cursors, keys });

    // Para móviles: detecto si se ha tocado la izquierda o derecha de la pantalla
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const dir = pointer.x < width / 2 ? 'izq' : 'der';
      this.registry.set('touchDirection', dir);
    });

    // Cuando se levanta el dedo, dejo de mover la nave
    this.input.on('pointerup', () => {
      this.registry.set('touchDirection', null);
    });
  }

  // Este método se ejecuta en cada frame del juego, y es donde controlo el movimiento de la nave
  override update(): void {
    const nave = this.registry.get('nave') as Phaser.GameObjects.Image;
    const keys = this.registry.get('keys') as any;
    const dir = this.registry.get('touchDirection');

    // Si no tengo nave o teclas capturadas, salgo
    if (!nave || !keys) return;

    // He aumentado la velocidad de la nave para que se mueva más rápido
    const speed = 10;

    // Uso el ancho actualizado de pantalla, por si ha rotado o redimensionado
    const width = this.scale.width;

    // Movimiento por teclado hacia la izquierda
    if (keys.cursors?.left?.isDown || keys.keys?.A?.isDown) {
      nave.x = Math.max(nave.x - speed, nave.width * nave.scaleX / 2);
    }

    // Movimiento por teclado hacia la derecha
    if (keys.cursors?.right?.isDown || keys.keys?.D?.isDown) {
      nave.x = Math.min(nave.x + speed, width - nave.width * nave.scaleX / 2);
    }

    // Movimiento táctil en móviles hacia la izquierda o derecha
    if (dir === 'izq') {
      nave.x = Math.max(nave.x - speed, nave.width * nave.scaleX / 2);
    } else if (dir === 'der') {
      nave.x = Math.min(nave.x + speed, width - nave.width * nave.scaleX / 2);
    }
  }
}

// Este componente Angular lanza el juego al cargar la vista y gestiona los redimensionados de pantalla
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

  // Al iniciar la vista, configuro el juego con Phaser y lo lanzo
  ngAfterViewInit(): void {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'phaser-game',
      backgroundColor: '#000000',
      scene: GameScene,
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    this.phaserGame = new Phaser.Game(config);
    window.addEventListener('resize', this.resizeGame); // Escucho cambios de tamaño
  }

  // Si el usuario rota la pantalla o cambia de tamaño, ajusto todo el contenido
  resizeGame = () => {
    if (!this.phaserGame?.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.phaserGame.scale.resize(width, height);

    const scene = this.phaserGame.scene.scenes[0] as GameScene;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isVertical = height > width;
    const fondoKey = (isMobile && isVertical) ? 'background-vertical' : 'background';

    // Elimino el fondo anterior y creo uno nuevo adaptado al tamaño actual
    const currentBg = scene.registry.get('currentBackground');
    if (currentBg) currentBg.destroy();

    const newBg = scene.add.image(0, 0, fondoKey).setOrigin(0, 0);
    newBg.setDisplaySize(width, height);
    scene.registry.set('currentBackground', newBg);

    // Elimino la nave anterior y la recreo en la nueva posición
    const naveAnterior = scene.registry.get('nave');
    if (naveAnterior) naveAnterior.destroy();

    const nuevaNave = scene.add.image(width / 2, height - 80, 'nave')
      .setOrigin(0.5)
      .setScale(0.18);

    scene.registry.set('nave', nuevaNave);
  };

  // Cuando se destruye el componente (al salir de la vista), elimino el listener de resize
  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeGame);
  }
}
