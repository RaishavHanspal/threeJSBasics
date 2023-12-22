import { Scene } from "three/src/scenes/Scene";
import { VRButton } from "three/examples/jsm/webxr/VRButton"
import { AnimationAction, AnimationMixer, BoxGeometry, Clock, Color, DoubleSide, Matrix4, Mesh, MeshPhysicalMaterial, Object3D, PerspectiveCamera, Quaternion, Vector3, WebGLRenderer } from "three/src/Three";
import { reelpanel } from "./elements/reelpanel";
import TWEEN from "@tweenjs/tween.js";
import * as CANNON from "cannon-es"
import { Container, Renderer, Sprite } from "pixi.js";

import Stats from 'three/examples/jsm/libs/stats.module'
export class pixiWithThree {
    /** instance to run 2 things at the same time threeJS ans pixiJS */
    private threeScene: Scene;
    private camera: PerspectiveCamera;
    private threeRenderer: WebGLRenderer;
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
    private viewInitialized: boolean = false;
    /** true when all animation have been loaded */
    private characterReady: Boolean = false;
    private readonly moveFactor: number = 0.05;

    private pixiRenderer: Renderer;
    private pixiScene: Container;
    private stats: Stats;

    constructor() {
        console.log("Start setting up a scene");
        this.initializeThree();
        this.initializePixi();
        this.addElements();
    }

    private initializeThree() {
        this.threeScene = new Scene();
        this.threeScene.background = new Color(0x262626);
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.68, 0);
        this.clock = new Clock();
        this.targetQuaternion = new Quaternion();
        this.threeRenderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.threeRenderer.domElement);
        this.stats = new Stats()
        document.body.appendChild(this.stats.dom)
    }

    private initializePixi() {
        const options =
        {
            view: this.threeRenderer.domElement,
            clearBeforeRender: false
        };
        this.pixiRenderer = new Renderer(options);
        globalThis.__PIXI_RENDERER__ = this.pixiRenderer;
        this.pixiScene = new Container();
    }

    private addElements() {
        this.loadJsonScene();
        this.updatePixiElements();
        this.loadImageSymbols(this.createReels.bind(this));
    }

    private updatePixiElements() {
        const pixiSprite = Sprite.from('assets/abc.png');
        pixiSprite.anchor.set(0.5);
        pixiSprite.cursor = "pointer"
        pixiSprite.interactive = true;
        pixiSprite.onclick = () => {
            new TWEEN.Tween(pixiSprite.position).to({ y: 1000 }, 2000).onComplete(() => {
                pixiSprite.visible = false;
                this.reelPanel.spin();
            }).start();
        };
        this.pixiScene.addChild(pixiSprite);
    }

    /** better approach then GLTF - 
     * 1- no problem with similar names used for bones, animations 
     * 2- animations are linked directly to fbx reference
     **/
    private loadJsonScene(): void {
        // load scene.json - no problem with similar named bones
        utilsObj.loadFile(this.threeScene, "sceneCS.json", "scene", (obj) => {
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

    private startRender() {
        this.createPhysicsElements();
        this.enablePhysics();
        window.addEventListener('resize', this.resize.bind(this), false);
        this.threeRenderer.setAnimationLoop(this.animate.bind(this));
        this.resize();
        this.setupVR();
    }

    private characterBody: CANNON.Body;
    private enablePhysics(): void {
        /** for character */
        this.characterBody = new CANNON.Body({ mass: 1 });
        this.character.position.set(0, 10, 0);
        this.characterBody.addShape(new CANNON.Box(new CANNON.Vec3(1, 0.5, 1)));
        this.linkPhysics(this.character, this.characterBody);
        this.world.addBody(this.characterBody);

        /** for background */
        // This might not work - since collision algo is not written for a trimesh on trimesh
        const mapBody = new CANNON.Body({ mass: 0 });
        mapBody.addShape(new CANNON.Box(new CANNON.Vec3(10, 0.1, 20)));
        this.linkPhysics(this.map, mapBody);
        this.world.addBody(mapBody);
    }

    private world: CANNON.World;
    private createPhysicsElements(): void {
        /** purple plane - the character lands on */
        const plane = new CANNON.Box(new CANNON.Vec3(10, 1, 450));
        const planeGeometry = new BoxGeometry(plane.halfExtents.x * 2,
            plane.halfExtents.y * 2,
            plane.halfExtents.z * 2);
        const planeMaterial = new MeshPhysicalMaterial({
            side: DoubleSide,
            color: "#ff00ff"
        });
        const planeMesh = new Mesh(planeGeometry, planeMaterial);
        const planeBody = new CANNON.Body({ mass: 0 });
        planeBody.position.set(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z);
        planeBody.addShape(plane);
        this.threeScene.add(planeMesh);
        this.world.addBody(planeBody);
        this.linkPhysics(planeMesh, planeBody);

        /** greenBox also landing on same platform */
        const greenBox = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        const ballGeometry = new BoxGeometry(greenBox.halfExtents.x * 2, greenBox.halfExtents.y * 2, greenBox.halfExtents.z * 2);
        const sphereMaterial = new MeshPhysicalMaterial({
            side: DoubleSide,
            color: "#00ff00"
        })
        const ballMesh = new Mesh(ballGeometry, sphereMaterial);
        ballMesh.position.y = 5;
        this.threeScene.add(ballMesh);
        const ballBody = new CANNON.Body({ mass: 1 });
        ballBody.addShape(greenBox);
        ballBody.position.set(ballMesh.position.x, ballMesh.position.y, ballMesh.position.z)
        this.world.addBody(ballBody);
        this.linkPhysics(ballMesh, ballBody);
    }

    private physicsArray: Array<Array<any>> = [];
    private linkPhysics(sceneMesh: any, physicsBody: CANNON.Body) {
        physicsBody.position.set(sceneMesh.position.x, sceneMesh.position.y, sceneMesh.position.z)
        this.physicsArray.push([sceneMesh, physicsBody]);
    }

    private createReels(): void {
        this.reelPanel = new reelpanel(5, 3);
        this.reelPanel.position.z = 25;
        this.threeScene.add(this.reelPanel);
    }

    private setupVR(): void {
        /** position vr camera w.r.t. actual camera */
        this.threeRenderer.xr.addEventListener('sessionstart', (e) => {
            const baseReferenceSpace = this.threeRenderer.xr.getReferenceSpace();
            const offsetPosition = this.camera.position.clone();
            offsetPosition.y = -1 * offsetPosition.y;
            const offsetRotation = this.camera.quaternion;
            const transform = new XRRigidTransform(offsetPosition, { x: offsetRotation.x, y: -1 * offsetRotation.y, z: offsetRotation.z, w: offsetRotation.w });
            const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace(transform);
            this.threeRenderer.xr.setReferenceSpace(teleportSpaceOffset);
        });
        this.threeRenderer.xr.enabled = true;
        document.body.appendChild(VRButton.createButton(this.threeRenderer));
    }

    private addCharacterControls(mixer?: AnimationMixer): void {
        /** load other animation actions for the character */
        utilsObj.loadAndBindFBXAnimation(this.character, this.threeScene, "walking.fbx", mixer, () => {
            utilsObj.loadAndBindFBXAnimation(this.character, this.threeScene, "run.fbx", mixer, () => {
                this.characterReady = true;
            });
        })
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
            this.lastCharacterAction?.fadeOut(1)
            this.activeCharacterAction?.reset()
            this.activeCharacterAction?.fadeIn(1)
            this.activeCharacterAction?.play()
        }
    }

    private checkForCharacterMovement(delta: number): void {
        let { x, y, z } = this.character.position;
        const moveFactor = this.moveFactor * (this.runToggle ? 5 : 1);
        if (this.keyPressedMap["KeyW"]) {
            this.characterBody.position.z += (moveFactor);
            z++;
        }
        if (this.keyPressedMap["KeyS"]) {
            this.characterBody.position.z += (-moveFactor);
            z--;
        }
        if (this.keyPressedMap["KeyA"]) {
            this.characterBody.position.x += (moveFactor);
            x++;
        }
        if (this.keyPressedMap["KeyD"]) {
            this.characterBody.position.x += (-moveFactor);
            x--;
        }
        const rotationMatrix = new Matrix4()
        const target = new Vector3(x, y, z);
        rotationMatrix.lookAt(target, this.character.position, this.character.up)
        this.targetQuaternion.setFromRotationMatrix(rotationMatrix);
        this.camera.position.lerpVectors(this.camera.position,
            new Vector3(this.character.position.x, this.character.position.y + 5, this.character.position.z - 10), 0.1)
        if (!this.character.quaternion.equals(this.targetQuaternion)) {
            this.character.quaternion.rotateTowards(this.targetQuaternion, moveFactor)
        }
    }

    private resize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
        this.pixiScene.position.set(innerWidth / 2, innerHeight / 2)
        this.pixiRenderer.resize(innerWidth, innerHeight);
    }

    private animate() {
        // requestAnimationFrame(this.animate.bind(this));
        /** update instance of all fbx animations */
        const delta = Math.min(this.clock.getDelta(), 0.1);
        TWEEN.update();
        this.mixers.forEach((m, i) => {
            m.update(delta);
        });
        /** @todo - this is just a workaround, ideally there should be proper load states
         * update logic once added
         */
        if (!this.viewInitialized) {
            if (this.characterReady && this.reelPanel) {
                this.viewInitialized = true;
                this.startPlay();
            }
        }
        this.world && this.world.step(delta)
        this.physicsArray.length && this.physicsArray.forEach((physicsEntry: Array<any>) => {
            const [sceneMesh, physicsBody] = physicsEntry;
            sceneMesh.position.set(
                physicsBody.position.x,
                physicsBody.position.y,
                physicsBody.position.z,
            );
            sceneMesh.name !== "Mutant" && sceneMesh.quaternion.set(
                physicsBody.quaternion.x,
                physicsBody.quaternion.y,
                physicsBody.quaternion.z,
                physicsBody.quaternion.w,
            );
        })
        // this.viewInitialized && this.checkIfColliding(this.character);
        this.reelPanel && this.reelPanel.update(delta);
        this.characterReady && this.checkForCharacterMovement(delta);
        // this.threeRenderer.render(this.threeScene, this.camera);
        this.threeRenderer.state.reset();
        this.pixiRenderer.reset();

        this.threeRenderer.render(this.threeScene, this.camera);

        this.threeRenderer.state.reset();
        this.pixiRenderer.reset();

        this.pixiRenderer.render(this.pixiScene);
        this.stats.update()
    }

    private startPlay() {
        /** add handlers to key events to change animations */
        document.addEventListener("keydown", this.bindKeyInputHandlers.bind(this), false);
        document.addEventListener("keyup", this.bindKeyInputHandlers.bind(this), false);
    }

    private loadImageSymbols(endCallback?: () => void) {
        const lastSymId = 5;
        for (let i = 1; i <= lastSymId; i++) {
            /** load file name can be controlled from a json structure
             * @todo - just to check
             */
            const fileName: string = i + ".png";
            utilsObj.loadFile(this.threeScene, fileName, "image", endCallback, null, lastSymId)
        }
    }
}