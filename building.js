import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { BufferGeometryUtils } from './BufferGeometryUtils.js';
import { ConvexBufferGeometry } from './ConvexGeometry.js';

'use strict';

const METER = 1. / 8; // skalowanie, bo inaczej mgła dziwnie wygląda
const MAX_STEPS = 8;
const MAX_FLOORS = 80;

const FLOOR = 3.25 * METER;
const GRID = 60 * METER;
const STREET = (3.5 * 4 + 1.75 * 2) * METER;
const SPACING = 3 * METER;
const GRIDS_PER_BLOCK_X = 3;
const GRIDS_PER_BLOCK_Y = 2;

const COLOR_BACKGROUND = new THREE.Color("hsl(242, 40%, 20%)");
const COLOR_MATERIAL = new THREE.Color("hsl(0, 0%, 75%)");
const COLOR_EDGES = COLOR_BACKGROUND;
const COLOR_EMISSIVE = new THREE.Color("hsl(180, 70%, 15%)");
const COLOR_LIGHT_MAIN =  new THREE.Color("hsl(48, 85%, 84%)");
const COLOR_LIGHT_AMBIENT = new THREE.Color("hsl(242, 00%, 50%)");
const FOG = 1. / (128 + 64);

const N = 30;

////////////////////////////////////////
const global_material = new THREE.MeshLambertMaterial({
	color: COLOR_MATERIAL,
	emissive: COLOR_EMISSIVE,
	emissiveIntensity: 1.0,
});
const edges_material = new THREE.LineBasicMaterial({
	color: COLOR_EDGES,
	opacity: 0.25,
	transparent: true,
});

////////////////////////////////////////
var camera, controls, scene, renderer;
var mainlight;

////////////////////////////////////////
var genotypy = [];

////////////////////////////////////////
// random int between min and max, inclusive
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandom(min = 0., max = 1.) {
	return Math.random() * (max - min) + min;
}

class Segment {
	constructor() {
		this.height = getRandomInt(2, MAX_FLOORS) * FLOOR;
		var N = getRandomInt(3, 8);
		this.point_x = [];
		this.point_y = [];
		for (var i = 0; i < N; ++i) {
			this.point_x.push(getRandom(0, GRID));
			this.point_y.push(getRandom(0, GRID));
		}
	}
}

class Genotyp {
	constructor() {
		this.levels = [];
		const limit = getRandomInt(1, MAX_STEPS);
		for (var i = 0; i < limit; ++i) {
			this.levels.push(new Segment());
		}
	}
}

function shape(height, x, y) {
	var points = [];
	for (var i = 0; i < x.length; ++i) {
		points.push(new THREE.Vector3(x[i], 0, y[i]));
		points.push(new THREE.Vector3(x[i], height, y[i]));
	}
	const geometry = new ConvexBufferGeometry(points);
	return geometry;
}

function building(genotyp) {
	const geometries = [];
	for (var i = 0; i < genotyp.levels.length; ++i) {
		const segment = genotyp.levels[i];
		const geometry = shape(
			segment.height,
			segment.point_x,
			segment.point_y
		);
		geometries.push(geometry);
	}

	const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
	return mergedGeometry;
}

function init() {
	scene = new THREE.Scene();
	scene.background = new THREE.Color(COLOR_BACKGROUND);
	scene.fog = new THREE.FogExp2(scene.background, FOG);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	document.body.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.setFromSphericalCoords(METER * 1500, Math.PI / 4, - 3 * Math.PI / 4);

	// controls

	controls = new OrbitControls(camera, renderer.domElement);
	controls.screenSpacePanning = false;

	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;
	controls.rotateSpeed = 0.25;

	controls.minDistance = 10 * METER;
	controls.maxDistance = 3000 * METER;

	controls.maxPolarAngle = Math.PI / 2 * 0.99;

	// lights

	{
		mainlight = new THREE.DirectionalLight(COLOR_LIGHT_MAIN, 0.9);
		mainlight.position.set(0, 1000 * METER, 1000 * METER);
		mainlight.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);

		mainlight.castShadow = true;
		const shadow_range = 2 * (GRID + SPACING + STREET / Math.min(GRIDS_PER_BLOCK_X, GRIDS_PER_BLOCK_Y)) * N * Math.SQRT2;
		mainlight.shadow.camera.near = -shadow_range;
		mainlight.shadow.camera.far = shadow_range;
		mainlight.shadow.camera.left = -shadow_range;
		mainlight.shadow.camera.right = shadow_range;
		mainlight.shadow.camera.bottom = -shadow_range;
		mainlight.shadow.camera.top = shadow_range;

		mainlight.shadow.mapSize.width = 8 * 1024;
		mainlight.shadow.mapSize.height = 8 * 1024;
		mainlight.matrixAutoUpdate = false;
		mainlight.updateMatrix();
		scene.add(mainlight);
	}

	scene.add(new THREE.AmbientLight(COLOR_LIGHT_AMBIENT, 1.0));

	// world
	{
		var geo = new THREE.PlaneBufferGeometry(10000, 10000);
		geo.rotateX(Math.PI / -2);
		geo.translate(0, -1 * METER, 0);
		geo = new THREE.Mesh(
			geo,
			global_material
		);
		geo.receiveShadow = true;
		geo.matrixAutoUpdate = false;
		geo.updateMatrix();
		scene.add(geo);
	}

	for (var i = -N; i <= N; ++i) {
		genotypy[i] = [];
		for (var j = -N; j <= N; ++j)
			genotypy[i][j] = new Genotyp();
	}

	for (var i = -N; i <= N; ++i)
		for (var j = -N; j <= N; ++j) {
			const geometry = building(genotypy[i][j]);
			geometry.translate(
				Math.floor(i / GRIDS_PER_BLOCK_X) * STREET + i * (GRID + SPACING + GRIDS_PER_BLOCK_X * METER),
				0,
				Math.floor(j / GRIDS_PER_BLOCK_Y) * STREET + j * (GRID + SPACING + GRIDS_PER_BLOCK_Y * METER)
			);

			const mesh = new THREE.Mesh(geometry, global_material);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			mesh.matrixAutoUpdate = false;
			mesh.updateMatrix();
			scene.add(mesh);

			const edges = new THREE.EdgesGeometry(geometry);
			const line = new THREE.LineSegments(edges, edges_material);
			line.matrixAutoUpdate = false;
			line.updateMatrix();
			scene.add(line);
		}

	window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();

	renderer.render(scene, camera);
}

////////////////////////////////////////
init();
animate();
