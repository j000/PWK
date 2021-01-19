import './polybool.min.js';

import * as Config from './config.js';
import {Genotyp} from './genotyp.js';
import {OrbitControls} from './OrbitControls.js';
import Stats from './stats.module.js';
import * as THREE from './three.module.js';
import * as Utils from './utils.js';

'use strict';

const COLOR_BACKGROUND = new THREE.Color("hsl(242, 40%, 20%)");
const COLOR_MATERIAL = new THREE.Color("hsl(0, 0%, 75%)");
const COLOR_EDGES = COLOR_BACKGROUND;
const COLOR_EMISSIVE = new THREE.Color("hsl(180, 70%, 15%)");
const COLOR_LIGHT_MAIN = new THREE.Color("hsl(48, 85%, 84%)");
const COLOR_LIGHT_AMBIENT = new THREE.Color("hsl(242, 00%, 50%)");
const FOG = 1. / (128 + 64);

////////////////////////////////////////
const global_material = new THREE.MeshLambertMaterial({
	color : COLOR_MATERIAL,
	emissive : COLOR_EMISSIVE,
	emissiveIntensity : 1.0,
});
const edges_material = new THREE.LineBasicMaterial({
	color : COLOR_EDGES,
	opacity : 0.25,
	transparent : true,
});
const wire_material = new THREE.MeshBasicMaterial({
	wireframe : true,
	wireframeLinewidth : 0.25 * Config.METER,
});

////////////////////////////////////////
var camera, controls, scene, renderer, stats;
var mainlight;
////////////////////////////////////////

var genotypy = [];

////////////////////////////////////////

function init()
{
	scene = new THREE.Scene();
	scene.background = new THREE.Color(COLOR_BACKGROUND);
	scene.fog = new THREE.FogExp2(scene.background, FOG);

	renderer = new THREE.WebGLRenderer({antialias : true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	document.body.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(
		60, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.setFromSphericalCoords(
		Config.METER * 1500, Math.PI / 4, -3 * Math.PI / 4);
	camera.layers.enable(0);

	// controls

	controls = new OrbitControls(camera, renderer.domElement);
	controls.screenSpacePanning = false;

	controls.enableDamping = true; // an animation loop is required when either
								   // damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;
	controls.rotateSpeed = 0.25;

	controls.minDistance = 10 * Config.METER;
	controls.maxDistance = 3000 * Config.METER;

	controls.maxPolarAngle = Math.PI / 2 * 0.99;

	// lights

	{
		mainlight = new THREE.DirectionalLight(COLOR_LIGHT_MAIN, 0.9);
		mainlight.layers.enable(0);
		mainlight.layers.enable(1);
		mainlight.layers.enable(2);
		mainlight.position.set(0, 1000 * Config.METER, 1000 * Config.METER);
		mainlight.position.applyAxisAngle(
			new THREE.Vector3(0, 1, 0), Math.PI / 6);

		mainlight.castShadow = true;
		const shadow_range = 2
			* (Config.GRID + Config.SPACING
			   + Config.STREET
				   / Math.min(
					   Config.GRIDS_PER_BLOCK_X, Config.GRIDS_PER_BLOCK_Y))
			* Config.N * Math.SQRT2;
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

	{
		const ambient = new THREE.AmbientLight(COLOR_LIGHT_AMBIENT, 1.0);
		ambient.matrixAutoUpdate = false;
		ambient.updateMatrix();
		ambient.layers.enable(0);
		ambient.layers.enable(1);
		ambient.layers.enable(2);
		scene.add(ambient);
	}

	// world
	{
		var geo = new THREE.PlaneBufferGeometry(10000, 10000);
		geo.rotateX(Math.PI / -2);
		geo.translate(0, -1 * Config.METER, 0);
		geo = new THREE.Mesh(geo, global_material);
		geo.layers.enable(0);
		geo.layers.enable(1);
		geo.receiveShadow = true;
		geo.matrixAutoUpdate = false;
		geo.updateMatrix();
		scene.add(geo);
	}

	stats = new Stats();
	document.body.appendChild(stats.dom);

	window.addEventListener('resize', onWindowResize, false);
	document.addEventListener('keydown', onDocumentKeyDown, false);
	window.setInterval(onInterval, 500);

	for (var i = -Config.N; i <= Config.N; ++i) {
		genotypy[i] = [];
		for (var j = -Config.N; j <= Config.N; ++j) {
			genotypy[i][j] = new Genotyp();
			draw(i, j);
		}
	}
}

function draw(i, j)
{
	if (genotypy[i][j].fenotyp)
		return;
	const geometry = genotypy[i][j].build();
	genotypy[i][j].fenotyp = [];

	geometry.translate(
		Math.floor(i / Config.GRIDS_PER_BLOCK_X) * Config.STREET
			+ i
				* (Config.GRID + Config.SPACING
				   + Config.GRIDS_PER_BLOCK_X * Config.METER),
		0,
		Math.floor(j / Config.GRIDS_PER_BLOCK_Y) * Config.STREET
			+ j
				* (Config.GRID + Config.SPACING
				   + Config.GRIDS_PER_BLOCK_Y * Config.METER));

	const mesh = new THREE.Mesh(geometry, global_material);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.matrixAutoUpdate = false;
	mesh.updateMatrix();
	mesh.layers.set(0);
	scene.add(mesh);
	genotypy[i][j].fenotyp[0] = mesh;

	const edges = new THREE.EdgesGeometry(geometry);
	const line = new THREE.LineSegments(edges, edges_material);
	line.matrixAutoUpdate = false;
	line.updateMatrix();
	line.layers.set(1);
	scene.add(line);
	genotypy[i][j].fenotyp[1] = line;

	const wire = new THREE.Mesh(geometry, wire_material);
	scene.add(wire);
	wire.layers.set(2);
	genotypy[i][j].fenotyp[2] = wire;
}

function onWindowResize()
{
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate()
{
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
	stats.update();
}

function onDocumentKeyDown(event)
{
	const key = event.key;
	// space
	if (key == ' ') {
		generations = 1;
	} else if (key == 'Enter') {
		generations = Config.GENERATIONS;
	} else if (key == 'q' || key == 'Home') {
		renderer.shadowMap.enabled = !renderer.shadowMap.enabled;
		scene.traverse((child) => {
			if (child.material)
				child.material.needsUpdate = true;
		});
	} else if (key == 'End') {
		camera.layers.toggle(1);
	} else if (key >= '1' && key <= '9') {
		camera.layers.toggle(event.keyCode - 49);
	}
};

var generations = 0;
function onInterval()
{
	if (generations <= 0) {
		return;
	}
	--generations;
	pokolenie();
}

function pokolenie()
{
	// selekcja
	var list = [];
	for (var i = -Config.N; i <= Config.N; ++i)
		for (var j = -Config.N; j <= Config.N; ++j) {
			list.push([ genotypy[i][j].ocena, i, j ]);
		}
	list.sort((a, b) => (a[0] < b[0] ? -1 : 1));
	// krzyżowanie
	const limit_dol = Math.ceil(list.length * Config.SELECTION);
	const limit_gora = list.length - 1;
	console.log('Zostaje: ' + list[limit_dol][0]);
	for (var i = 0; i < limit_dol; ++i) {
		const x = list[i][1];
		const y = list[i][2];
		const old = genotypy[x][y];

		if (old.fenotyp[2]) {
			scene.remove(old.fenotyp[2]);
			delete old.fenotyp[2];
		}
		if (old.fenotyp[1]) {
			scene.remove(old.fenotyp[1]);
			old.fenotyp[1].geometry.dispose();
			delete old.fenotyp[1];
		}
		if (old.fenotyp[0]) {
			scene.remove(old.fenotyp[0]);
			old.fenotyp[0].geometry.dispose();
			delete old.fenotyp[0];
		}

		{
			const parent1_idx = Utils.getRandomInt(limit_dol, limit_gora);
			const parent2_idx = Utils.getRandomInt(limit_dol, limit_gora);
			const x1 = list[parent1_idx][1];
			const y1 = list[parent1_idx][2];
			const x2 = list[parent2_idx][1];
			const y2 = list[parent2_idx][2];
			const parent1 = genotypy[x1][y1];
			const parent2 = genotypy[x2][y2];
			genotypy[x][y] = parent1.krzyzuj(parent2);
		}
		genotypy[x][y].mutuj();
		// genotypy[x][y] = new Genotyp();
		draw(x, y);
	}

	renderer.renderLists.dispose();
}

////////////////////////////////////////
init();
animate();
