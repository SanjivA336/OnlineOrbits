import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

//#region Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color("rgb(10, 10, 15)")
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const composer = new EffectComposer( renderer );

const ambient = new THREE.AmbientLight( 0x404040);
scene.add( ambient );

const pickables = new Array();
let selectedObjects = [];

var animation;

//#endregion

//#region Celestial Bodies
//Sun
const SunGeo = new THREE.IcosahedronGeometry(2, 2);
const SunMat = new THREE.MeshLambertMaterial({color: 0xFFCC33});
SunMat.emissive = new THREE.Color(0xFFCC33);
SunMat.emissiveIntensity = 1;
const Sun = new THREE.Mesh(SunGeo, SunMat);
scene.add(Sun);

//Sun Light
const SunLight = new THREE.PointLight(0xFFE484, 1);
scene.add(SunLight)

//Planets
const P1Rad = 5;
const P1Speed = 0.05;
const P1 = createPlanet(.6, 0x952bff, P1Rad);
P1.material.userData.originalColor = new THREE.Color( 0x952bff );
scene.add(P1);
pickables.push(P1);

const M1_1 = createMoon(0.2, 0x2ba7ff);
scene.add(M1_1);

const P2Rad = 7.5;
const P2Speed = 0.025;
const P2 = createPlanet(.6, 0x952bff, P2Rad);
P2.material.userData.originalColor = new THREE.Color( 0x952bff );
scene.add(P2);
pickables.push(P2);

//#endregion

//#region Post-Processing
const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = Number( 4 );
outlinePass.edgeThickness = Number( 1 );
outlinePass.visibleEdgeColor.set( 0xfffffff );
outlinePass.pulsePeriod = Number( 3 );
composer.addPass( outlinePass );

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.1, 0);
composer.addPass( bloomPass );
//#endregion

//#region Animation
camera.position.z = 10;



function animate() {
	
    orbit(Sun, 0, 0, .5);
    orbit(P1, P1Rad, P1Speed, 2.5);
    orbitMoon(M1_1, P1, 1, 0.2, 2, 0.5);
    
    orbit(P2, P2Rad, P2Speed, 5);

    animation = window.requestAnimationFrame(animate);

    composer.render();
}
animate();
//#endregion

//#region Mouse Control
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener( 'pointermove', onPointerMove );
function onPointerMove( event ) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera( pointer, camera );
	const intersects = raycaster.intersectObjects( pickables );



    if ( intersects.length > 0 ) {
        const selectedObject = intersects[0].object;
        selectedObjects = [];
        selectedObjects.push( selectedObject );
        outlinePass.selectedObjects = selectedObjects;

    } else {

        outlinePass.selectedObjects = [];
        resetColors();

    }

}

//#endregion

//#region Event Listener Functions
document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
function onDocumentMouseWheel( event ) {

    var MAX = 50;
    var MIN = 5;

    camera.position.z -= event.wheelDeltaY * .01;
    camera.position.z = Math.max( Math.min( camera.position.z, MAX ), MIN );

}
window.addEventListener('resize', () => {onWindowResize();});
function onWindowResize() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );
    composer.setSize( width, height );

}
//#endregion

//#region Animator Functions
function hollowCirlce(radius, segments=100, z=0) {
    const material = new THREE.LineBasicMaterial( { color: 0x222222 } );
    const points = [];
    for (let i = 0; i < segments; i++) {
        points.push( new THREE.Vector3( radius * Math.cos(i * ((2*Math.PI)/segments)),
                                        radius * Math.sin(i * ((2*Math.PI)/segments)),
                                        z ));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    return new THREE.LineLoop( geometry, material );
}

function createPlanet(_size=1, _color=0xffffff, _orbitSize=10) {
    const geometry = new THREE.IcosahedronGeometry(_size, 1);
    const material = new THREE.MeshLambertMaterial({color: _color});
    material.flatShading = true;
    scene.add(hollowCirlce(_orbitSize));
    return new THREE.Mesh(geometry, material);
}
function createMoon(_size=1, _color=0xffffff) {
    const geometry = new THREE.IcosahedronGeometry(_size, 1);
    const material = new THREE.MeshLambertMaterial({color: _color});
    material.flatShading = true;
    return new THREE.Mesh(geometry, material);
}

function orbit(_object , _orbitSize=10, _orbitSpeed=0.1, _spinSpeed=2, orbitOffset=0){
    const AnimationSpeedMultiplier = .005;
    _object.position.x = Math.cos((renderer.info.render.frame * _orbitSpeed * AnimationSpeedMultiplier) + (orbitOffset * Math.PI)) * _orbitSize;
    _object.position.y = Math.sin((renderer.info.render.frame * _orbitSpeed * AnimationSpeedMultiplier) + (orbitOffset * Math.PI)) * _orbitSize;
    _object.rotation.z += _spinSpeed * AnimationSpeedMultiplier;
}

function orbitMoon(_object, _parent, _orbitSize=1, _orbitSpeed=0.1, _spinSpeed=2, orbitOffset=0){
    const AnimationSpeedMultiplier = .01;
    _object.position.x = _parent.position.x + Math.cos((renderer.info.render.frame * _orbitSpeed * AnimationSpeedMultiplier) + (orbitOffset * Math.PI)) * _orbitSize;
    _object.position.y = _parent.position.y + Math.sin((renderer.info.render.frame * _orbitSpeed * AnimationSpeedMultiplier) + (orbitOffset * Math.PI)) * _orbitSize;
    _object.rotation.z += _spinSpeed * AnimationSpeedMultiplier;
}
//#endregion

//#region Post-Processing Functions
function resetColors(){
    for ( let i = 0; i < pickables.length; i ++ ) {
        pickables[i].material.color.copy( pickables[i].material.userData.originalColor );
    } 
}
//#endregion
