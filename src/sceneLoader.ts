import { Scene } from "three/src/scenes/Scene";
import { AnimationClip, AnimationMixer, Camera, Color, PerspectiveCamera, WebGLRenderer } from "three/src/Three";
export class SceneLoader {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
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
        this.camera.position.z = 20;
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    private addElements() {
        // Load the GLTF file
        utilsObj.loadFile(this.scene, "scene.gltf", "gltf", (gltf) => {
            const animations: AnimationClip[] = gltf.animations;
            let animationIndex: number = 0;
            // traverse all the elements
            gltf.scene.children.forEach((displayObject: any, i: number) => {
                /** custom info can be added through threeJs Editor */
                if (displayObject?.userData?.type === "fbxAnim") {
                    console.log("start " + displayObject?.userData?.name);
                    const mixer = utilsObj.playFBX(displayObject, animations[animationIndex]);
                    (mixer as any).userData = displayObject.userData;
                    mixer && this.mixers.push(mixer);
                    animationIndex++;
                }
            })
        });
    }

    private animate(currentTimeStamp: number) {
        const delta = currentTimeStamp - this.previousTimeStamp;
        this.previousTimeStamp = currentTimeStamp;
        requestAnimationFrame(this.animate.bind(this));
        /** update instance of all fbx animations */
        this.mixers.forEach((m, i) => {
            m.update(delta / 1000);
        });
        this.renderer.render(this.scene, this.camera);
    }
}