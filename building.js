// import * as THREE from 'https://unpkg.com/three/build/three.module.js';
// import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { BufferGeometryUtils } from './BufferGeometryUtils.js';
// import { OutlineEffect } from './OutlineEffect.js';

'use strict';

const METER = 0.1; // skalowanie, bo inaczej mgła dziwnie wygląda
const MAX_STEPS = 5;
const MAX_FLOORS = 70;

const FLOOR = 3.5 * METER;
const GRID = 40 * METER;
const STREET = (3.5 * 4 + 1.75 * 2) * METER;

const COLOR_BACKGROUND = 0x03004b;
const COLOR_MATERIAL = 0xffffff;
const COLOR_LIGHT_MAIN =  0xfa73f4;// 0xffffff;
const COLOR_LIGHT_AMBIENT = new THREE.Color("hsl(294, 40%, 40%)").getHex();
// const COLOR_LIGHT_SECONDARY = new THREE.Color("hsl(169, 60%, 40%)").getHex();
const COLOR_LIGHT_SECONDARY = 0xde4ae0;
const COLOR_EMISSIVE = 0x167f7d; // 0x2aefee;

const N = 30;

////////////////////////////////////////
var camera, controls, scene, renderer, global_material;

////////////////////////////////////////
// random int between min and max, inclusive
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandom(min, max) {
	return Math.random() * (max - min) + min;
}

function polygon(x) {
	const out = new THREE.Shape();
	const angle = Math.PI * 2 / x;
	out.moveTo(
		Math.sin(0),
		Math.cos(0)
	);
	for (var i = 1; i <= x; ++i) {
		out.lineTo(
			Math.sin(i * angle),
			Math.cos(i * angle)
		);
	}
	return out;
}

class Segment {
	constructor() {
		// TODO: zmien nazwe
		this.N = getRandomInt(3, 8);
		this.height = getRandomInt(5, MAX_FLOORS);
		this.angle = getRandom(0, Math.PI * 2);
		this.scale_x = getRandom(0.1, 1.0);
		this.scale_y = getRandom(0.1, 1.0);
		this.offset_x = getRandom(0.0, 1.0 - this.scale_x);
		this.offset_y = getRandom(0.0, 1.0 - this.scale_y);
	}
}

class Genotyp {
	constructor() {
		this.levels = [];
		const limit = getRandomInt(1, MAX_STEPS);
		for (var i = 0; i < limit; ++i) {
			// TODO center
			var segment = new Segment();
			this.levels.push(segment);
		}
	}
}

function building(genotyp) {
	const extrudeSettings = {depth: 2, bevelEnabled: false};
	const geometries = [];
	for (var i = 0; i < genotyp.levels.length; ++i) {
		const segment = genotyp.levels[i];
		const shape = polygon(segment.N);
		const geometry = new THREE.ExtrudeBufferGeometry(
			shape,
			extrudeSettings
		);
		geometry.rotateX(Math.PI / 2);
		geometry.translate(0, 2, 0);
		geometry.scale(0.5, 0.5, 0.5);

		// const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
		// geometry.translate(0, 0.5, 0);
		// geometry.scale(1./Math.SQRT2, 1., 1./Math.SQRT2);

		geometry.scale(
			segment.scale_x * GRID,
			FLOOR * segment.height,
			segment.scale_y * GRID
		);
		// geometry.translate(
		// 	GRID / 2, //(0.5 + segment.offset_x) * GRID,
		// 	0,
		// 	GRID / 2 //(0.5 + segment.offset_y) * GRID
		// );
		geometry.rotateY(segment.angle);
		geometries.push(geometry);
	}

	const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
	// mergedGeometry.translate(GRID / 2, 0, GRID / 2);
	var mesh = new THREE.Mesh(mergedGeometry, global_material);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.matrixAutoUpdate = false;
	mesh.updateMatrix();

	return mesh;
}

function init() {
	// global_material = new THREE.MeshPhongMaterial({ color: COLOR_MATERIAL });
	// global_material = new THREE.MeshToonMaterial({ color: COLOR_MATERIAL });
	global_material = new THREE.MeshLambertMaterial({
		color: COLOR_MATERIAL,
		emissive: COLOR_EMISSIVE,
		emissiveIntensity: 0.66
	});


	scene = new THREE.Scene();
	scene.background = new THREE.Color(COLOR_BACKGROUND);
	scene.fog = new THREE.FogExp2(scene.background, 1. / 256);

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
		var light = new THREE.DirectionalLight(COLOR_LIGHT_MAIN, 0.9);
		light.position.set(0, 1000, 1000);
		light.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);

		light.castShadow = true;
		light.shadow.camera.near = 1 * METER;
		light.shadow.camera.far = 10000 * METER;
		light.shadow.camera.left = -1000 * METER;
		light.shadow.camera.right = 1000 * METER;
		light.shadow.camera.bottom = -1000 * METER;
		light.shadow.camera.top = 1000 * METER;

		light.shadow.mapSize.width = 4096;
		light.shadow.mapSize.height = 4096;
		light.matrixAutoUpdate = false;
		light.updateMatrix();
		scene.add(light);
	}

	{
		// var light = new THREE.DirectionalLight(COLOR_LIGHT_SECONDARY, 0.8);
		var light = new THREE.DirectionalLight(COLOR_LIGHT_SECONDARY, 0.8);
		light.position.set(0, -1, -1);
		light.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);
		light.matrixAutoUpdate = false;
		light.updateMatrix();
		scene.add(light);
	}

	scene.add(new THREE.AmbientLight(COLOR_LIGHT_AMBIENT, 0.6));

	// world

	var geo = new THREE.PlaneBufferGeometry(10000, 10000);
	geo.translate(0, -1./1024, 0);
	geo.rotateX(Math.PI / -2);
	geo = new THREE.Mesh(
		geo,
		global_material
	);
	geo.receiveShadow = true;
	geo.matrixAutoUpdate = false;
	geo.updateMatrix();
	// scene.add(geo);

	for (var i = -N; i <= N; ++i)
		for (var j = -N; j <= N; ++j) {
			var mesh = building(new Genotyp());
			mesh.position.x = Math.floor(i / 2) * STREET + i * GRID;
			mesh.position.z = Math.floor(j / 2) * STREET + j * GRID;
			mesh.updateMatrix();
			scene.add(mesh);

			// const axesHelper = new THREE.AxesHelper(GRID);
			// axesHelper.position.x = mesh.position.x + GRID / 2;
			// axesHelper.position.z = mesh.position.z + GRID / 2;
			// scene.add(axesHelper);
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
