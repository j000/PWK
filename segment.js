import * as Config from './config.js';
import {ConvexBufferGeometry} from './ConvexGeometry.js';
import {ConvexGeometry} from './ConvexGeometry.js';
import * as THREE from './three.module.js';
import {getNormalInRange, getRandom, getRandomInt} from './utils.js'

export class Segment {
	constructor()
	{
		this.height
			= Math.floor(getNormalInRange(2, Config.MAX_FLOORS)) * Config.FLOOR;
		this.point_x = [];
		this.point_y = [];
		const n = getRandomInt(3, 8);
		for (var i = 0; i < n; ++i) {
			this.point_x.push(getRandom(0, Config.GRID));
			this.point_y.push(getRandom(0, Config.GRID));
		}

		const x = this.point_x;
		const y = this.point_y;
		var polygon = {inverted : false, regions : [ [] ]};
		var points = [];
		for (var i = 0; i < x.length; ++i) {
			points.push(new THREE.Vector3(x[i], 0, y[i]));
			points.push(new THREE.Vector3(x[i], this.height, y[i]));
		}
		const geometry = new ConvexGeometry(points);
		this.geometry = new THREE.BufferGeometry().fromGeometry(geometry);
		for (var i = 0; i < geometry.vertices.length; ++i) {
			if (geometry.vertices[i].y == 0)
				polygon.regions[0].push(
					[ geometry.vertices[i].x, geometry.vertices[i].z ]);
		}
		this.segment = new PolyBool.segments(polygon);
	}
}
