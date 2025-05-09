// src/app/pages/score/score-manager.ts
import Phaser from 'phaser';

// Defino un tipo para cada entrada del ranking
export interface RegistroPuntuacion {
  nombre: string;
  puntuacion: number;
}

export class ScoreManager {
  private escena: Phaser.Scene;
  private puntuacionActual: number = 0;
  private textoPuntuacion!: Phaser.GameObjects.Text;

  private claveUltima = 'puntuacionUltima';
  private claveNombre = 'nombreJugador';
  private claveRanking = 'rankingGlobal';

  constructor(escena: Phaser.Scene) {
    this.escena = escena;
  }

  init(): void {
    this.puntuacionActual = 0;

    this.textoPuntuacion = this.escena.add.text(10, 10, 'Puntos: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    });

    this.textoPuntuacion.setDepth(10);
  }

  add(puntos: number): void {
    this.puntuacionActual += puntos;
    this.textoPuntuacion.setText('Puntos: ' + this.puntuacionActual);
  }

  getPuntuacionActual(): number {
    return this.puntuacionActual;
  }

  guardarResultadoFinal(): void {
    const nombre = localStorage.getItem(this.claveNombre) ?? 'Jugador';

    // Guardo la última puntuación (da igual si es récord o no)
    localStorage.setItem(this.claveUltima + '_' + nombre, this.puntuacionActual.toString());

    // Recupero el récord de este jugador
    const puntuacionMaxima = ScoreManager.getMaximaPuntuacion(nombre);

    // Si esta puntuación es mejor que su anterior récord, la guardo
    if (this.puntuacionActual > puntuacionMaxima) {
      localStorage.setItem('puntuacionMaxima_' + nombre, this.puntuacionActual.toString());
    }

    // Actualizo el ranking, guardando solo la mejor puntuación por jugador
    const ranking = ScoreManager.getRanking();

    const index = ranking.findIndex(r => r.nombre === nombre);
    if (index >= 0) {
      if (this.puntuacionActual > ranking[index].puntuacion) {
        ranking[index].puntuacion = this.puntuacionActual;
      }
    } else {
      ranking.push({ nombre, puntuacion: this.puntuacionActual });
    }

    localStorage.setItem(this.claveRanking, JSON.stringify(ranking));
  }

  // Métodos estáticos para acceder desde la pantalla de puntuaciones

  static getUltimaPuntuacion(): number {
    const nombre = this.getNombreJugador();
    const valor = localStorage.getItem('puntuacionUltima_' + nombre);
    return valor ? parseInt(valor) : 0;
  }

  static getMaximaPuntuacion(nombre: string): number {
    const valor = localStorage.getItem('puntuacionMaxima_' + nombre);
    return valor ? parseInt(valor) : 0;
  }

  static getNombreJugador(): string {
    return localStorage.getItem('nombreJugador') ?? 'Jugador';
  }

  static getRanking(): RegistroPuntuacion[] {
    const data = localStorage.getItem('rankingGlobal');
    const lista: RegistroPuntuacion[] = data ? JSON.parse(data) : [];

    // Elimino duplicados (si existieran) y me quedo con el mejor
    const unicos: { [nombre: string]: RegistroPuntuacion } = {};
    lista.forEach((registro) => {
      if (!unicos[registro.nombre] || unicos[registro.nombre].puntuacion < registro.puntuacion) {
        unicos[registro.nombre] = registro;
      }
    });

    return Object.values(unicos).sort((a, b) => b.puntuacion - a.puntuacion);
  }
}
