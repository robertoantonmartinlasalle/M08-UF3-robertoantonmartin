// src/app/pages/score/score-manager.ts
import Phaser from 'phaser';

/*
  He reestructurado esta clase ScoreManager y la he movido a la carpeta /score
  porque anteriormente la tenía dentro de la carpeta /game solo como pruebas.
  Ahora que ya tengo implementado un sistema más completo con varias pantallas,
  tiene más sentido tener este archivo separado y reutilizable desde cualquier parte
  de la aplicación, especialmente desde la futura pantalla de puntuaciones.

  Esta clase se encarga de controlar la puntuación del jugador durante la partida,
  almacenar el récord en localStorage y guardar la última puntuación obtenida
  para poder mostrarla en la pantalla final (score).
*/

export class ScoreManager {
  private escena: Phaser.Scene; // Escena donde se mostrará la puntuación
  private puntuacionActual: number = 0; // Variable que uso para llevar el conteo actual
  private textoPuntuacion!: Phaser.GameObjects.Text; // Objeto visual que muestra los puntos
  private claveMaxima = 'puntuacionMaxima'; // Clave usada en localStorage para guardar el récord
  private claveNombre = 'nombreJugador';    // Clave donde se guarda el nombre del jugador
  private claveUltima = 'puntuacionUltima'; // Clave usada para guardar la última puntuación

  constructor(escena: Phaser.Scene) {
    // Guardo la escena que me pasan para poder añadir elementos en pantalla
    this.escena = escena;
  }

  // Esta función se ejecuta al iniciar la partida
  init(): void {
    // Reinicio la puntuación actual a 0 cada vez que comienza una nueva partida
    this.puntuacionActual = 0;

    // Creo un texto visible que muestre los puntos en la parte superior izquierda
    this.textoPuntuacion = this.escena.add.text(10, 10, 'Puntos: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    });

    // Me aseguro de que este texto esté por encima de todo lo demás
    this.textoPuntuacion.setDepth(10);
  }

  // Esta función la llamo cuando el jugador consigue puntos
  add(puntos: number): void {
    this.puntuacionActual += puntos;

    // Actualizo el texto mostrado en pantalla
    this.textoPuntuacion.setText('Puntos: ' + this.puntuacionActual);

    // Si el jugador supera su récord anterior, lo guardo como nuevo récord
    if (this.puntuacionActual > this.getMaxima()) {
      this.setMaxima(this.puntuacionActual);
    }
  }

  // Recupero la puntuación más alta guardada en localStorage
  getMaxima(): number {
    const valor = localStorage.getItem(this.claveMaxima);
    return valor ? parseInt(valor) : 0;
  }

  // Guardo una nueva puntuación máxima en localStorage
  setMaxima(valor: number): void {
    localStorage.setItem(this.claveMaxima, valor.toString());
  }

  // Devuelvo la puntuación actual en cualquier momento
  getPuntuacionActual(): number {
    return this.puntuacionActual;
  }

  // Esta función se llama al final de la partida para guardar el resultado final
  guardarResultadoFinal(): void {
    localStorage.setItem(this.claveUltima, this.puntuacionActual.toString());
  }

  // Función estática para que cualquier parte de la app pueda consultar la última puntuación
  static getUltimaPuntuacion(): number {
    const valor = localStorage.getItem('puntuacionUltima');
    return valor ? parseInt(valor) : 0;
  }

  // También recupero el nombre del jugador almacenado en localStorage
  static getNombreJugador(): string {
    return localStorage.getItem('nombreJugador') ?? 'Jugador';
  }
}
