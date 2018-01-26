import SpaceObject from './SpaceObject';
import SpaceObjectGenerator from './SpaceObjectGenerator';
import Util from '../common/Util';

const MAX_NUMBER_OF_CLOUDS = 100;

class CloudGenerator extends SpaceObjectGenerator {
  generate(density) {
    this.createClouds(density);
  }

  createClouds(density = 1) {
    const max = Math.floor(MAX_NUMBER_OF_CLOUDS * density);
    for (let i = 0; i < max; i += 1) {
      this.createRandomizedCloud();
    }
  }

  createRandomizedCloud() {
    const map = this.deepSpaceLayer.getMap();
    const NUMBER_OF_TYPES = 2;
    const NUMBER_OF_FRAMES = 4;
    const type = Util.rnd(1, NUMBER_OF_TYPES);
    const sprite = this.deepSpaceLayer.getSprite(`starfield.clouds.bg.type-${type}`);
    const z = Math.min(Math.random() + 0.1, Math.random() > 0.5 ? 0.25 : 0.6);
    const x = Math.floor(Util.rnd(0, map.getScreenWidth()) * z);
    const y = Math.floor(Util.rnd(0, map.getScreenHeight()) * z);
    const frame = Util.rnd(0, NUMBER_OF_FRAMES - 1);
    const scale = Util.rnd(75, 125) / 100;

    const cloud = new SpaceObject(sprite)
      .setX(x)
      .setY(y)
      .setZ(z)
      .setScale(scale)
      .setFrame(frame);

    this.addSpaceObject(cloud);
  }
}

export default CloudGenerator;
