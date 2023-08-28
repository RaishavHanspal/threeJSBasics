import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Scene } from "three/src/scenes/Scene";
import { Camera, Color, PerspectiveCamera, WebGLRenderer } from "three/src/Three";
export class SceneLoader {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    constructor() {
        console.log("Start setting up a scene");
        this.initialize();
        this.addElements();
        this.animate();
    }

    private initialize() {
        this.scene = new Scene();
        this.scene.background = new Color(0x262626);
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 20;
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    private addElements() {
        // Create a loader
        const loader = new GLTFLoader();
        // Load the GLTF file
        loader.load("assets/scene.gltf", (gltf) => {
            this.scene.add(gltf.scene);
            // traverse all the elements
            gltf.scene.traverse((object: any) => {

            });
        });

    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
}