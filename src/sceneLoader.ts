import { Scene } from "three/src/scenes/Scene";
import { AnimationAction, AnimationClip, AnimationMixer, Clock, Color, PerspectiveCamera, WebGLRenderer } from "three/src/Three";
export class SceneLoader {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private mixers: AnimationMixer[] = [];
    private character: any;
    private activeCharacterAction: AnimationAction;
    private lastCharacterAction: AnimationAction;
    private moving: "forward" | "backward" | "standing" = "standing";
    private map: any;
    private clock: Clock;
    private readonly moveFactor: number = 0.025;
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
        // this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // this.camera.position.z = 20;
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    private addElements() {
        this.loadJsonScene();
    }

    /** better approach then GLTF - 
     * 1- no problem with similar names used for bones, animations 
     * 2- animations are linked directly to fbx reference
     **/
    private loadJsonScene(): void {
        // load scene.json - no problem with similar named bones
        utilsObj.loadFile(this.scene, "sceneCS.json", "scene", (obj) => {
            console.log(obj);
            obj.children.forEach((displayObject: any, i: number) => {
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
        this.animate();
        this.resize();
        window.addEventListener('resize', this.resize.bind(this), false);
    }

    private addCharacterControls(mixer?: AnimationMixer): void {
        /** load other animation actions for the character */
        utilsObj.loadFile(this.scene, "walking.fbx", "fbx", (fbx) => {
            const animation = fbx.animations[0];
            const { mixer: newMixer } = utilsObj.registerFBX(this.character, animation, false, mixer);
            /** in case no active mixer available for the model - add new one */
            if (!mixer) {
                newMixer && this.mixers.push(newMixer);
            }
        });
        /** add handlers to key events to change animations */
        document.addEventListener("keydown", this.bindKeyInputHandlers.bind(this), false);
    }

    private bindKeyInputHandlers(evt: any): void {
        var keyCode = evt.which;
        if (keyCode == 87) {
            this.setCharacterAction(this.character.actions[1]);
            this.moving = "forward";
        }
        else {
            this.setCharacterAction(this.character.actions[0]);
            this.moving = "standing";
        }
    }

    public setCharacterAction(toAction: any): void {
        if (toAction != this.activeCharacterAction) {
            this.lastCharacterAction = this.activeCharacterAction
            this.activeCharacterAction = toAction
            this.lastCharacterAction.fadeOut(1)
            this.activeCharacterAction.reset()
            this.activeCharacterAction.fadeIn(1)
            this.activeCharacterAction.play()
        }
    }

    private checkForCharacterMovement(): void {
        if (this.moving === "standing" || !this.map) return;
        switch (this.moving) {
            case "forward": this.map.position.z -= this.moveFactor;
        }
    }

    private resize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        /** update instance of all fbx animations */
        this.mixers.forEach((m, i) => {
            m.update(this.clock.getDelta());
        });
        this.checkForCharacterMovement();
        this.renderer.render(this.scene, this.camera);
    }
}