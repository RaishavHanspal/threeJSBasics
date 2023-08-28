import * as THREE from "three";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
export class mainGame {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private cubeInstance: THREE.Mesh;
    private lineInstance: THREE.Line;
    private mixers: THREE.AnimationMixer[] = [];
    private previousTimeStamp: number;
    constructor() {
        console.log("Start setting up a scene");
        this.initialize();
        this.addElements();
        this.animate(Date.now());
    }

    private initialize() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x262626);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.z = 200;
        light.castShadow = true;
        const ambientLight = new THREE.AmbientLight(0xffffff, 1)
        this.scene.add(ambientLight)
        this.scene.add(light);
        document.body.appendChild(this.renderer.domElement);
    }

    private addElements() {
        /** add a green cube */
        const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
        const meshMaterial = new THREE.MeshBasicMaterial({ color: 0x00eeaa });
        this.cubeInstance = new THREE.Mesh(boxGeometry, meshMaterial);
        this.scene.add(this.cubeInstance);
        this.cubeInstance.position.y -= 100;
        this.camera.position.z = 500;
        /** add a blue line */
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        const points = [];
        points.push(new THREE.Vector3(-250, 25, 0));
        points.push(new THREE.Vector3(250, 25, 0));
        const bufferGeometry = new THREE.BufferGeometry().setFromPoints(points);
        this.lineInstance = new THREE.Line(bufferGeometry, lineMaterial);
        this.scene.add(this.lineInstance);
        /** add a text in the scene */
        const fontLoader = new FontLoader();
        fontLoader.load('assets/helvetiker_regular.typeface.json', (font) => {
            const fontGeometry = new TextGeometry('threeJSBasics', {
                font: font,
                size: 50,
                height: 25,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            const textMeshMaterial = [
                new THREE.MeshPhongMaterial({
                    color: 0xffff00,
                    flatShading: true
                }), // front
                new THREE.MeshPhongMaterial({
                    color: 0xdd0000
                }) // side
            ];
            const textMesh = new THREE.Mesh(fontGeometry, textMeshMaterial);
            fontGeometry.computeBoundingBox()
            fontGeometry.computeVertexNormals()
            fontGeometry.boundingBox.getCenter(textMesh.position).multiplyScalar(-1)
            textMesh.position.y += 200;
            textMesh.position.x = -fontGeometry.boundingBox.max.x / 2
            const parent = new THREE.Object3D()
            parent.add(textMesh)
            this.scene.add(parent)
        });
        /** add fbx model - and play anim */
        const fbxLoader = new FBXLoader();
        fbxLoader.load('assets/Rumba Dancing.fbx', (obj) => {
            this.scene.add(obj);
            obj.position.z = 100;
            const mixer = new THREE.AnimationMixer(obj);
            const anim = mixer.clipAction(obj.animations[0]);
            this.mixers.push(mixer);
            anim.play();
        })
    }

    private animate(currentTimeStamp: number) {
        const delta = currentTimeStamp - this.previousTimeStamp;
        this.previousTimeStamp = currentTimeStamp;
        requestAnimationFrame(this.animate.bind(this));
        this.cubeInstance.rotation.x += 0.01;
        this.cubeInstance.rotation.y += 0.01;
        /** update instance of all fbx animations */
        this.mixers.forEach((m, i) => {
           m.update(delta / 1000);
        });
        this.renderer.render(this.scene, this.camera);
    }
}