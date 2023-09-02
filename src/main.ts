import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { Scene } from "three/src/scenes/Scene";
import { AmbientLight, AnimationMixer, BoxGeometry, BufferGeometry, Color, DirectionalLight, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshPhongMaterial, Object3D, PerspectiveCamera, Vector3, WebGLRenderer } from "three/src/Three";
export class MainGame {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private cubeInstance: Mesh;
    private lineInstance: Line;
    private mixers: AnimationMixer[] = [];
    private previousTimeStamp: number;
    constructor() {
        console.log("Start setting up a scene");
        this.initialize();
        this.addElements();
        this.animate(Date.now());
    }

    private initialize() {
        this.scene = new Scene();
        this.scene.background = new Color(0x262626);
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const light = new DirectionalLight(0xffffff, 0.5);
        light.position.z = 200;
        light.castShadow = true;
        const ambientLight = new AmbientLight(0xffffff, 1)
        this.scene.add(ambientLight)
        this.scene.add(light);
        document.body.appendChild(this.renderer.domElement);
    }

    private addElements() {
        /** add a green cube */
        const boxGeometry = new BoxGeometry(100, 100, 100);
        const meshMaterial = new MeshBasicMaterial({ color: 0x00eeaa });
        this.cubeInstance = new Mesh(boxGeometry, meshMaterial);
        this.scene.add(this.cubeInstance);
        this.cubeInstance.position.y -= 100;
        this.camera.position.z = 500;
        /** add a blue line */
        const lineMaterial = new LineBasicMaterial({ color: 0x0000ff });
        const points = [];
        points.push(new Vector3(-250, 25, 0));
        points.push(new Vector3(250, 25, 0));
        const bufferGeometry = new BufferGeometry().setFromPoints(points);
        this.lineInstance = new Line(bufferGeometry, lineMaterial);
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
                new MeshPhongMaterial({
                    color: 0xffff00,
                    flatShading: true
                }), // front
                new MeshPhongMaterial({
                    color: 0xdd0000
                }) // side
            ];
            const textMesh = new Mesh(fontGeometry, textMeshMaterial);
            fontGeometry.computeBoundingBox()
            fontGeometry.computeVertexNormals()
            fontGeometry.boundingBox.getCenter(textMesh.position).multiplyScalar(-1)
            textMesh.position.y += 200;
            textMesh.position.x = -fontGeometry.boundingBox.max.x / 2
            const parent = new Object3D()
            parent.add(textMesh)
            this.scene.add(parent)
        });
        /** add fbx model - and play anim */
        utilsObj.loadFile(this.scene, "Rumba Dancing.fbx", "fbx", (obj: any) => {
          const { mixer } = utilsObj.registerFBX(obj, obj.animations[0], true);
          mixer && this.mixers.push(mixer);
        },  { position: { z: 100 }});
        utilsObj.loadFile(this.scene, "Samba Dancing.fbx", "fbx", (obj: any) => {
            const { mixer } = utilsObj.registerFBX(obj, obj.animations[0], true);
            mixer && this.mixers.push(mixer);
          },  { position: { z: 100 }});
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