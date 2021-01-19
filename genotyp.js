import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import * as Config from './config.js';
import {Segment} from './segment.js';
import * as Utils from './utils.js';
import {getRandomInt} from './utils.js';

// Map.prototype.getOrDefault = function(key, value) {
// 	var out = this.get(key);
// 	if (typeof out !== 'undefined')
// 		return out;
// 	return value;

export class Genotyp {
	constructor(copy)
	{
		if (copy instanceof Genotyp) {
			this.segments = [...copy.segments ];
			this.ocena = copy.ocena;
			return;
		}
		this.segments = [];
		const limit = getRandomInt(1, Config.MAX_SEGMENTS);
		for (var i = 0; i < limit; ++i) {
			this.segments.push(new Segment());
		}
		this.ocen()
	}

	build()
	{
		const geometries = [];
		for (var i = 0; i < this.segments.length; ++i) {
			geometries.push(this.segments[i].geometry);
		}

		const mergedGeometry
			= BufferGeometryUtils.mergeBufferGeometries(geometries, false);
		return mergedGeometry;
	}

	////////////////////////////////////////
	base_area()
	{
		var segments = this.segments[0].segment;
		for (var i = 1; i < this.segments.length; ++i) {
			try {
				var comb = PolyBool.combine(segments, this.segments[i].segment);
			} catch (e) {
				continue;
			}
			segments = PolyBool.selectUnion(comb);
		}
		var poly = PolyBool.polygon(segments);
		var area = 0.;
		for (var idx in poly.regions) {
			const region = poly.regions[idx];
			if (!region.length)
				continue;
			for (var i = 1; i < region.length; ++i) {
				area += region[i - 1][0] * region[i][1];
				area -= region[i][0] * region[i - 1][1];
			}
			area += region[region.length - 1][0] * region[0][1];
			area -= region[0][0] * region[region.length - 1][1];
		}
		return Math.abs(area) / 2. / (Config.GRID * Config.GRID);
	}

	segment_count()
	{
		// 0 segment -> ocena 0
		// MAX_SEGMENTS -> 1
		return Utils.linear(this.segments.length, 0, 0, Config.MAX_SEGMENTS, 1);
	}

	height()
	{
		// wysokość 0 -> 0
		// maksymalna wysokość -> 1
		const max_height
			= Math.max.apply(Math, this.segments.map((o) => o.height));
		return Utils.linear(
			max_height, 0, 0, Config.MAX_FLOORS * Config.FLOOR, 1);
	}

	ocen()
	{
		this.ocena = (1 - this.base_area()) * this.segment_count() * this.height();
	}

	////////////////////////////////////////
	krzyzuj(other)
	{
		var out = new Genotyp(this);
		out.segments = [];
		var all_segments = this.segments.concat(other.segments);
		const limit = getRandomInt(
			1, Math.min(Config.MAX_SEGMENTS, all_segments.length));
		for (var i = 0; i < limit; ++i) {
			const which = Utils.getRandomInt(0, all_segments.length - 1);
			out.segments.push(all_segments.splice(which, 1)[0]);
		}
		out.ocen();
		return out;
	}

	mutuj()
	{
		if (Utils.getRandom() >= Config.MUTATION) {
			return;
		}
		const which = Utils.getRandomInt(0, this.segments.length - 1);
		this.segments[which] = new Segment();
		this.ocen();
	}
}
