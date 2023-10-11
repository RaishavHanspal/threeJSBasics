import { Scene } from "three/src/scenes/Scene";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { VRButton } from "three/examples/jsm/webxr/VRButton"
import { AnimationAction, AnimationClip, AnimationMixer, ArcCurve, Box3, BoxGeometry, Clock, Color, CylinderGeometry, DoubleSide, Group, LoopOnce, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhysicalMaterial, Object3D, PerspectiveCamera, Plane, PlaneGeometry, Quaternion, Raycaster, SphereGeometry, Vector2, Vector3, WebGLRenderer } from "three/src/Three";
import { reelpanel } from "./elements/reelpanel";
import TWEEN from "@tweenjs/tween.js";
import * as CANNON from "cannon-es"
import { CSG } from 'three-csg-ts';
import CannonUtils from "./cannonUtils";
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
    private raycaster: Raycaster;
    private viewInitialized: boolean = false;
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
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.68, 0);
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
        this.loadImageSymbols(this.createReels.bind(this));
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
        this.setupVR();
        this.createPhysicsElements();
        this.enablePhysics();
        window.addEventListener('resize', this.resize.bind(this), false);
        this.renderer.setAnimationLoop(this.animate.bind(this));
        this.resize();
    }

    private characterBody: CANNON.Body;
    // private characterMover: Object3D;
    private enablePhysics(): void {
        /** for character */
        this.characterBody = new CANNON.Body({ mass: 1 });
        this.character.position.set(0, 10, 0);
        // this.character.traverse((e: Mesh) => {
        //     if (e.isMesh) {
        //         const shape = CannonUtils.CreateTrimesh(e.geometry);
        //         this.characterBody.addShape(shape);
        //     }
        // });
        this.characterBody.addShape(new CANNON.Box(new CANNON.Vec3(1, 0.5, 1)));
        this.linkPhysics(this.character, this.characterBody);
        this.world.addBody(this.characterBody);

        /** for background */
        // This might not work - since collision algo is not written for a trimesh on trimesh
        const mapBody = new CANNON.Body({ mass: 0 });
        // this.map.traverse((e: Mesh) => {
        //     if(e.isMesh){
        //         const shape = CannonUtils.CreateTrimesh(e.geometry);    
        //         mapBody.addShape(shape);
        //     }
        // });
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
        this.scene.add(planeMesh);
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
        this.scene.add(ballMesh);
        const ballBody = new CANNON.Body({ mass: 1 });
        ballBody.addShape(greenBox);
        ballBody.position.set(ballMesh.position.x, ballMesh.position.y, ballMesh.position.z)
        this.world.addBody(ballBody);
        this.linkPhysics(ballMesh, ballBody);
    }

    /** use trimesh on CSG hollow cylinder */
    private hollowCylinder() {
        let smallCylinderGeom = new CylinderGeometry(30, 30, 80, 20, 4);
        let largeCylinderGeom = new CylinderGeometry(40, 40, 80, 20, 4);
        let redMaterial = new MeshLambertMaterial({ color: 0xff0000 });
        let blueMaterial = new MeshLambertMaterial({ color: 0x00ff00 });
        let smallCylinder = new Mesh(smallCylinderGeom, redMaterial);
        let largeCylinder = new Mesh(largeCylinderGeom, blueMaterial);
        smallCylinder.updateMatrix();
        largeCylinder.updateMatrix();
        const hollowCylinder = CSG.subtract(largeCylinder, smallCylinder);
        hollowCylinder.scale.set(0.05, 0.05, 0.05)
        this.scene.add(hollowCylinder);
    }

    private physicsArray: Array<Array<any>> = [];
    private linkPhysics(sceneMesh: any, physicsBody: CANNON.Body) {
        physicsBody.position.set(sceneMesh.position.x, sceneMesh.position.y, sceneMesh.position.z)
        this.physicsArray.push([sceneMesh, physicsBody]);
    }

    private tweenCharacterPosition(finalPosObj: any, keyPress: string, callback: () => any): void {
        new TWEEN.Tween(this.character.position).to(finalPosObj, 3000).onStart(() => {
            this.bindKeyInputHandlers({ code: keyPress, type: "keydown" });
        }).onComplete(() => {
            this.bindKeyInputHandlers({ code: keyPress, type: "keyup" });
            callback && callback();
        }).delay(1000).start();
    }

    private createReels(): void {
        this.reelPanel = new reelpanel(5, 3);
        this.reelPanel.position.z = 25;
        this.scene.add(this.reelPanel);
    }

    private setupVR(): void {
        this.renderer.xr.enabled = true;
        document.body.appendChild(VRButton.createButton(this.renderer));
        this.renderer.xr.addEventListener('sessionstart', (e) => {
            const baseReferenceSpace = this.renderer.xr.getReferenceSpace();
            const offsetPosition = this.camera.position;
            const offsetRotation = this.camera.quaternion;
            const transform = new XRRigidTransform(offsetPosition, { x: offsetRotation.x, y: -(offsetRotation.y), z: offsetRotation.z, w: offsetRotation.w });
            const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace(transform);
            this.renderer.xr.setReferenceSpace(teleportSpaceOffset);
        });
    }

    private updateRaycaster(event: any): void {
        const pos = new Vector2((event.clientX / this.renderer.domElement.clientWidth) * 2 - 1, -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1);
        this.raycaster.setFromCamera(pos, this.camera);
        const intersects = this.raycaster.intersectObjects(utilsObj.getSceneMeshes(), false);
        console.log(intersects);
        if (intersects.length) {
            for (let i = 0; i < intersects.length; i++) {
                if (intersects[i].object.name.includes("reel")) {
                    this.reelPanel.spin();
                    break;
                }
            }
        }
    }

    private addCharacterControls(mixer?: AnimationMixer): void {
        /** load other animation actions for the character */
        utilsObj.loadAndBindFBXAnimation(this.character, this.scene, "walking.fbx", mixer, () => {
            utilsObj.loadAndBindFBXAnimation(this.character, this.scene, "run.fbx", mixer, () => {
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
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
        this.renderer.render(this.scene, this.camera);
    }

    private startPlay() {
        /** basic movement to check tweening */
        // this.tweenCharacterPosition({ z: 3 }, "KeyW",
        //     this.tweenCharacterPosition.bind(this, { z: -10 }, "KeyS", () => {
        /** add handlers to key events to change animations */
        document.addEventListener("keydown", this.bindKeyInputHandlers.bind(this), false);
        document.addEventListener("keyup", this.bindKeyInputHandlers.bind(this), false);
        // }));
        this.raycaster = new Raycaster();
        window.addEventListener('mousedown', this.updateRaycaster.bind(this), false);
        new OrbitControls(this.camera, this.renderer.domElement);
    }

    private loadImageSymbols(endCallback?: () => void) {
        const lastSymId = 5;
        for (let i = 1; i <= lastSymId; i++) {
            /** load file name can be controlled from a json structure
             * @todo - just to check
             */
            const fileName: string = i + ".png";
            utilsObj.loadFile(this.scene, fileName, "image", endCallback, null, lastSymId)
        }
    }

    private collisionRaycaster: Raycaster;
    private isColliding: boolean = false;
    /** check if two bodies are colliding with each other */
    private checkIfColliding(body: any): void {
        if (!this.collisionRaycaster) {
            this.collisionRaycaster = new Raycaster()
        }
        // const pos = new Vector2(body.position.x, body.position.y);
        const intersects = this.collisionRaycaster.intersectObjects(utilsObj.getSceneMeshes(), false);
        if (intersects.length) {
            let leastDistance = 10;
            intersects.forEach(intersect => {
                if (intersect.distance < leastDistance) {
                    leastDistance = intersect.distance;
                }
            });
            this.isColliding = leastDistance !== 10;
        }
        else { this.isColliding = false; }
    }
}