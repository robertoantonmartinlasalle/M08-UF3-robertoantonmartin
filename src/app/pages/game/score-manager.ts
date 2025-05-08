import Phaser from 'phaser';

export class ScoreManager {
  private escena: Phaser.Scene;
  private puntuacionActual: number = 0;
  private textoPuntuacion!: Phaser.GameObjects.Text;
  private claveMaxima = 'puntuacionMaxima';

  constructor(escena: Phaser.Scene) {
    // Le paso la escena principal para poder añadir elementos visuales y acceder al contexto del juego
    this.escena = escena;
  }

  init(): void {
    // Inicializo la puntuación a 0 al comenzar la partida
    this.puntuacionActual = 0;

    // Creo el texto que muestra la puntuación en pantalla, en la esquina superior izquierda
    this.textoPuntuacion = this.escena.add.text(10, 10, 'Puntos: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    });

    this.textoPuntuacion.setDepth(10); // Lo pongo por encima de los demás elementos
  }

  add(puntos: number): void {
    // Cada vez que destruyo un enemigo, sumo puntos
    this.puntuacionActual += puntos;

    // Actualizo el texto en pantalla
    this.textoPuntuacion.setText('Puntos: ' + this.puntuacionActual);

    // Compruebo si esta nueva puntuación es la más alta hasta ahora
    const maxima = this.getMaxima();
    if (this.puntuacionActual > maxima) {
      this.setMaxima(this.puntuacionActual);
    }
  }

  getMaxima(): number {
    // Recupero del localStorage la puntuación más alta almacenada
    const valor = localStorage.getItem(this.claveMaxima);
    return valor ? parseInt(valor) : 0;
  }

  setMaxima(valor: number): void {
    // Guardo en localStorage la nueva puntuación más alta
    localStorage.setItem(this.claveMaxima, valor.toString());
  }

  getPuntuacionActual(): number {
    // Devuelvo la puntuación actual para poder usarla desde otras clases
    return this.puntuacionActual;
  }
}
