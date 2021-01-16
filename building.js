import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import './polybool.min.js';
import { Genotyp } from './genotyp.js';
import * as Utils from './utils.js';
import * as Config from './config.js';

'use strict';

const COLOR_BACKGROUND = new THREE.Color("hsl(242, 40%, 20%)");
const COLOR_MATERIAL = new THREE.Color("hsl(0, 0%, 75%)");
const COLOR_EDGES = COLOR_BACKGROUND;
const COLOR_EMISSIVE = new THREE.Color("hsl(180, 70%, 15%)");
const COLOR_LIGHT_MAIN =  new THREE.Color("hsl(48, 85%, 84%)");
const COLOR_LIGHT_AMBIENT = new THREE.Color("hsl(242, 00%, 50%)");
const FOG = 1. / (128 + 64);

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
	camera.position.setFromSphericalCoords(Config.METER * 1500, Math.PI / 4, - 3 * Math.PI / 4);

	// controls

	controls = new OrbitControls(camera, renderer.domElement);
	controls.screenSpacePanning = false;

	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;
	controls.rotateSpeed = 0.25;

	controls.minDistance = 10 * Config.METER;
	controls.maxDistance = 3000 * Config.METER;

	controls.maxPolarAngle = Math.PI / 2 * 0.99;

	// lights

	{
		mainlight = new THREE.DirectionalLight(COLOR_LIGHT_MAIN, 0.9);
		mainlight.position.set(0, 1000 * Config.METER, 1000 * Config.METER);
		mainlight.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);

		mainlight.castShadow = true;
		const shadow_range = 2 * (Config.GRID + Config.SPACING + Config.STREET / Math.min(Config.GRIDS_PER_BLOCK_X, Config.GRIDS_PER_BLOCK_Y)) * Config.N * Math.SQRT2;
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
		geo.translate(0, -1 * Config.METER, 0);
		geo = new THREE.Mesh(
			geo,
			global_material
		);
		geo.receiveShadow = true;
		geo.matrixAutoUpdate = false;
		geo.updateMatrix();
		scene.add(geo);
	}

	for (var i = -Config.N; i <= Config.N; ++i) {
		genotypy[i] = [];
		for (var j = -Config.N; j <= Config.N; ++j)
			genotypy[i][j] = new Genotyp();
	}

	for (var i = -Config.N; i <= Config.N; ++i)
		for (var j = -Config.N; j <= Config.N; ++j) {
			const geometry = genotypy[i][j].build();
			geometry.translate(
				Math.floor(i / Config.GRIDS_PER_BLOCK_X) * Config.STREET + i * (Config.GRID + Config.SPACING + Config.GRIDS_PER_BLOCK_X * Config.METER),
				0,
				Math.floor(j / Config.GRIDS_PER_BLOCK_Y) * Config.STREET + j * (Config.GRID + Config.SPACING + Config.GRIDS_PER_BLOCK_Y * Config.METER)
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
