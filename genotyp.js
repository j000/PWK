import * as Config from './config.js';
import { Segment } from './segment.js';
import { getRandomInt } from './utils.js';
import { BufferGeometryUtils } from './BufferGeometryUtils.js';

export class Genotyp {
	constructor() {
		this.levels = [];
		const limit = getRandomInt(1, Config.MAX_SEGMENTS);
		for (var i = 0; i < limit; ++i) {
			this.levels.push(new Segment());
		}
	}

	build() {
		const geometries = [];
		for (var i = 0; i < this.levels.length; ++i) {
			geometries.push(this.levels[i].geometry);
		}

		const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
		return mergedGeometry;
	}
}
