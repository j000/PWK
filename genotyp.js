import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import * as Config from './config.js';
import {Segment} from './segment.js';
import {getRandomInt} from './utils.js';

// Map.prototype.getOrDefault = function(key, value) {
// 	var out = this.get(key);
// 	if (typeof out !== 'undefined')
// 		return out;
// 	return value;

export class Genotyp {
	constructor()
	{
		this.levels = [];
		const limit = getRandomInt(1, Config.MAX_SEGMENTS);
		for (var i = 0; i < limit; ++i) {
			this.levels.push(new Segment());
		}
	}

	build()
	{
		const geometries = [];
		for (var i = 0; i < this.levels.length; ++i) {
			geometries.push(this.levels[i].geometry);
		}

		const mergedGeometry
			= BufferGeometryUtils.mergeBufferGeometries(geometries, false);
		return mergedGeometry;
	}

	base_area()
	{
		// TODO
		var segments = this.levels[0].segment;
		for (var i = 1; i < this.levels.length; ++i) {
			var comb = PolyBool.combine(segments, this.levels[i].segment);
			segments = PolyBool.selectUnion(comb);
		}
		var poly = PolyBool.polygon(segments);
		var area = 0.;
		for (var idx in poly.regions) {
			const region = poly.regions[idx];
			for (var i = 1; i < region.length; ++i) {
				area += region[i - 1][0] * region[i][1];
				area -= region[i][0] * region[i - 1][1];
			}
			area += region[region.length - 1][0] * region[0][1];
			area -= region[0][0] * region[region.length - 1][1];
		}
		return Math.abs(area) / 2.;
	}
}
