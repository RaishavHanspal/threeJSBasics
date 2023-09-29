import { HP_WorldId, HavokPhysicsWithBindings } from "@babylonjs/havok";
import { Clock, Color, CylinderGeometry, DirectionalLight, DoubleSide, Euler, HemisphereLight, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PerspectiveCamera, PlaneGeometry, Quaternion, Scene, SphereGeometry, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";

export class LottoHavoc {
    private scene: Scene;
    private clock: Clock;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private world: HP_WorldId;
    private physicsArray: Array<Array<any>> = [];
    private inverseBody: any;
    constructor(private havok: HavokPhysicsWithBindings) {
        this.initialize();
    }

    private initialize() {
        this.world = this.havok.HP_World_Create()[1];
        this.havok.HP_World_SetGravity(this.world, [0, -9.82, 0]);
        this.scene = new Scene();
        this.scene.background = new Color(0x262626);
        this.clock = new Clock();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 20;
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.stats = new Stats()
        document.body.appendChild(this.stats.dom)
        this.startRender();
        this.addLight();
    }

    private stats: Stats;
    private addLight() {
        const light1 = new HemisphereLight();
        this.scene.add(light1);
        const light2 = new DirectionalLight();
        this.scene.add(light2);
    }

    private startRender() {
        this.renderer.setAnimationLoop(this.update.bind(this));
        this.addCylinder();
        const coords = this.getCoords(5, 50);
        // coords.forEach(this.addBall.bind(this));
        this.bodies.push(this.createBall(new Vector3(0, 0, 0), new Vector3(0, 0,0), new Vector3(1, 1, 1), ""));
        this.addControls();
    }

    private addControls() {
        new OrbitControls(this.camera, this.renderer.domElement);
    }

    private addCylinder() {
        const glassMat = new MeshPhysicalMaterial({
            transparent: true,
            opacity: 0.2, transmission: 0
        });
        utilsObj.loadFile(this.scene, "sphere.obj", "obj", (obj: any) => {
            const invSphere = obj.children.find((m: Mesh) => (m.name.startsWith("sphere")));
            invSphere.material = glassMat;
        });
    }

    private ballCount = 0;

    private update() {
        this.stats.update();
        const delta = Math.min(this.clock.getDelta(), 0.1);
        if (this.world) {
            this.havokStep(delta);
        }
        this.inverseBody?.angularVelocity.set(2, 0, 0)
        this.physicsArray.forEach((physicsEntry: Array<any>) => {
            const [mesh, body] = physicsEntry;
            mesh.position.set(body.position.x, body.position.y, body.position.z);
            mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
        })
        this.renderer.render(this.scene, this.camera);
    }

    private getCoords(bounds: number, total: number = 5): number[][] {
        const vertices: number[][] = [];
        const step = 1;
        for (let i: number = -bounds / 2; i < bounds / 2; i += step)
            for (let j: number = -bounds / 2; j < bounds / 2; j += step)
                for (let k: number = -bounds / 2; k < bounds / 2; k += step) {
                    vertices.push([i, j, k]);
                    if (vertices.length >= total) {
                        return vertices;
                    }
                }
        return vertices;
    }

    private bodies: any[] = [];
    private havokStep(delta: number): void {
        this.havok.HP_World_Step(this.world, delta);
        const bodyBuffer = this.havok.HP_World_GetBodyBuffer(this.world)[1];
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const transformBuffer = new Float32Array(this.havok.HEAPU8.buffer, bodyBuffer + body.offset, 16);
            for (let mi = 0; mi < 15; mi++) {
                if ((mi & 3) != 3) {
                    body.mesh.matrix.elements[mi] = transformBuffer[mi];
                }
            }
            body.mesh.matrix.elements[15] = 1.0;
        }
    }


    private createBall(position: Vector3, rotation: Vector3, scale: Vector3, motionType: string, mesh = true) {
        const quaternion = new Quaternion();
        quaternion.setFromEuler(new Euler(rotation.x, rotation.y, rotation.z));
        const boxBody = this.havok.HP_Body_Create()[1];
        this.havok.HP_Body_SetShape(
            boxBody,
            this.havok.HP_Shape_CreateSphere(
                [0, 0, 0], 0.5
            )[1]
        );
        this.havok.HP_Body_SetQTransform(
            boxBody, [
            [position.x, position.y, position.z],
            [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
        ]
        )
        this.havok.HP_World_AddBody(this.world, boxBody, false);
        this.havok.HP_Body_SetMotionType(boxBody, 2);
        if (!mesh) return { offset: this.havok.HP_Body_GetWorldTransformOffset(boxBody)[1], id: boxBody }
        const body = new Mesh(
            new SphereGeometry(0.5)
        )
        body.castShadow = true;
        body.receiveShadow = true;
        body.matrixAutoUpdate = false;
        this.scene.add(body);
        return {
            offset: this.havok.HP_Body_GetWorldTransformOffset(boxBody)[1],
            id: boxBody,
            mesh: body
        }
    }
}