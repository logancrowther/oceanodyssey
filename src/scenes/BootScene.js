import Phaser from 'phaser';
import GameState from '../systems/GameState.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    GameState.load();
    this.scene.start('TitleScene');
  }
}
