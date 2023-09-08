import { Scene } from "three/src/scenes/Scene";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { VRButton } from "three/examples/jsm/webxr/VRButton"
import { AnimationAction, AnimationClip, AnimationMixer, Box3, BoxGeometry, Clock, Color, LoopOnce, Matrix4, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Plane, PlaneGeometry, Quaternion, Vector3, WebGLRenderer } from "three/src/Three";
import { reelpanel } from "./elements/reelpanel";
export class SceneLoader {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private mixers: AnimationMixer[] = [];
    private character: Object3D;
    private activeCharacterAction: AnimationAction;
    private lastCharacterAction: AnimationAction;
    private keyPressedMap: { [key: string]: boolean } = {};
    private map: Object3D;
    private clock: Clock;
    private toIdleTimeOut: NodeJS.Timeout;
    private targetQuaternion: Quaternion;
    private runToggle: boolean = false;
    private reelPanel: reelpanel;
    /** true when all animation have been loaded */
    private characterReady: Boolean = false;
    private readonly moveFactor: number = 0.05;
    constructor() {
        console.log("Start setting up a scene");
        this.initialize();
        this.addElements();
        // this.animate(Date.now());
    }

    private initialize() {
        this.scene = new Scene();
        this.scene.background = new Color(0x262626);
        this.clock = new Clock();
        this.targetQuaternion = new Quaternion();
        // this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // this.camera.position.z = 20;
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    private addElements() {
        this.loadJsonScene();
        this.loadImageSymbols();
    }

    /** better approach then GLTF - 
     * 1- no problem with similar names used for bones, animations 
     * 2- animations are linked directly to fbx reference
     **/
    private loadJsonScene(): void {
        // load scene.json - no problem with similar named bones
        utilsObj.loadFile(this.scene, "sceneCS.json", "scene", (obj) => {
            console.log(obj);
            obj.traverse((displayObject: any, i: number) => {
                let currentAction: AnimationAction;
                let currentMixer: AnimationMixer;
                if (displayObject.animations.length) {
                    const { mixer, action } = utilsObj.registerFBX(displayObject, displayObject.animations[0], true);
                    mixer && this.mixers.push(mixer);
                    currentMixer = mixer;
                    currentAction = action;
                }
                else if (displayObject.isCamera) {
                    this.camera = displayObject;
                }
                /** identify and assign character object */
                if (displayObject.name === "Mutant") {
                    this.character = displayObject;
                    this.character && this.addCharacterControls(currentMixer);
                    this.activeCharacterAction = currentAction;
                }
                /** identify and assign Map refernce */
                else if (displayObject.name === "Map") {
                    this.map = displayObject;
                }
            });
            this.startRender();
        });
    }

    private loadGltfScene(): void {
        // Load the GLTF file
        utilsObj.loadFile(this.scene, "scene.gltf", "gltf", (gltf) => {
            const animations: AnimationClip[] = gltf.animations;
            let animationIndex: number = 0;
            // traverse all the elements
            gltf.scene.children.forEach((displayObject: any, i: number) => {
                /** custom info can be added through threeJs Editor */
                if (displayObject?.userData?.type === "fbxAnim") {
                    const { mixer } = utilsObj.registerFBX(displayObject, animations[animationIndex], true);
                    mixer && this.mixers.push(mixer);
                    animationIndex++;
                }
            })
        });
    }

    private startRender() {
        // this.animate();
        this.setupVR();
        this.renderer.setAnimationLoop(this.animate.bind(this));
        this.resize();
        this.createReels();
        new OrbitControls(this.camera, this.renderer.domElement);
        window.addEventListener('resize', this.resize.bind(this), false);
    }

    private createReels(): void {
        this.reelPanel = new reelpanel(5, 3);
        this.scene.add(this.reelPanel);
        /** use delay to start spinning */
        setTimeout(() => {
            this.reelPanel.spin();
        }, 5000);
    }

    private setupVR(): void {
        this.renderer.xr.enabled = true;
        document.body.appendChild(VRButton.createButton(this.renderer));
    }

    private addCharacterControls(mixer?: AnimationMixer): void {
        /** load other animation actions for the character */
        utilsObj.loadAndBindFBXAnimation(this.character, this.scene, "walking.fbx", mixer, () => {
            utilsObj.loadAndBindFBXAnimation(this.character, this.scene, "run.fbx", mixer, () => {
                this.characterReady = true;
            });
        })
        /** add handlers to key events to change animations */
        document.addEventListener("keydown", this.bindKeyInputHandlers.bind(this), false);
        document.addEventListener("keyup", this.bindKeyInputHandlers.bind(this), false);
    }

    private bindKeyInputHandlers(evt: any): void {
        let keyCode = evt.code;
        this.toIdleTimeOut && clearTimeout(this.toIdleTimeOut);
        this.toIdleTimeOut = null;
        this.keyPressedMap[keyCode] = (evt.type === "keydown");
        if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(keyCode) && this.keyPressedMap[keyCode]) {
            /** walk animation - in action[1] */
            this.setCharacterAction((this.character as any).actions[this.runToggle ? 2 : 1]);
        }
        else if (["KeyQ"].includes(keyCode) && this.keyPressedMap[keyCode]) {
            /** running animation - in action2] */
            this.runToggle = !this.runToggle;
        }
        else if (!this.isCharacterMoving()) {
            this.toIdleTimeOut = setTimeout(() => {
                /** idle animation - in action[0] */
                this.setCharacterAction((this.character as any).actions[0]);
            }, 200);
        }
    }

    private isCharacterMoving(): boolean {
        return !!["KeyW", "KeyA", "KeyS", "KeyD"].find((key: string) => this.keyPressedMap[key]);
    }

    public setCharacterAction(toAction: AnimationAction): void {
        if (toAction != this.activeCharacterAction) {
            this.lastCharacterAction = this.activeCharacterAction
            this.activeCharacterAction = toAction
            this.lastCharacterAction.fadeOut(1)
            this.activeCharacterAction.reset()
            this.activeCharacterAction.fadeIn(1)
            this.activeCharacterAction.play()
        }
    }

    private checkForCharacterMovement(delta: number): void {
        let { x, y, z } = this.character.position;
        const moveFactor = this.moveFactor * (this.runToggle ? 5 : 1);
        if (this.keyPressedMap["KeyW"]) {
            this.map.translateZ(-moveFactor);
            this.reelPanel.translateZ(-moveFactor);
            z++;
        }
        if (this.keyPressedMap["KeyS"]) {
            this.map.translateZ(moveFactor);
            this.reelPanel.translateZ(moveFactor);
            z--;
        }
        if (this.keyPressedMap["KeyA"]) {
            this.map.translateX(-moveFactor);
            this.reelPanel.translateX(-moveFactor);
            x++;
        }
        if (this.keyPressedMap["KeyD"]) {
            this.map.translateX(moveFactor);
            this.reelPanel.translateX(moveFactor);
            x--;
        }
        const rotationMatrix = new Matrix4()
        const target = new Vector3(x, y, z);
        rotationMatrix.lookAt(target, this.character.position, this.character.up)
        this.targetQuaternion.setFromRotationMatrix(rotationMatrix)

        if (!this.character.quaternion.equals(this.targetQuaternion)) {
            this.character.quaternion.rotateTowards(this.targetQuaternion, moveFactor)
        }
    }

    private resize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
        // requestAnimationFrame(this.animate.bind(this));
        /** update instance of all fbx animations */
        this.mixers.forEach((m, i) => {
            m.update(this.clock.getDelta());
        });
        this.reelPanel && this.reelPanel.update();
        this.characterReady && this.checkForCharacterMovement(this.clock.getDelta());
        this.renderer.render(this.scene, this.camera);
    }

    private loadImageSymbols(){
        for(let i = 1; i <= 5; i++ ){
            /** load file name can be controlled from a json structure
             * @todo - just to check
             */
            const fileName: string = i + ".png";
            utilsObj.loadFile(this.scene, fileName, "image")
        }
    }
}