import { HP_BodyId, HP_ShapeId, HP_WorldId, HavokPhysicsWithBindings } from "@babylonjs/havok";
import { BoxGeometry, Clock, Color, CylinderGeometry, DirectionalLight, DoubleSide, Euler, HemisphereLight, Material, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshPhysicalMaterial, PerspectiveCamera, PlaneGeometry, Quaternion, SRGBColorSpace, Scene, SphereGeometry, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { MeshAccumulator } from "./meshAccumulator";

import WebGPURenderer from "three/examples/jsm/renderers/webgpu/WebGPURenderer";
import { MeshBasicNodeMaterial, MeshPhysicalNodeMaterial, color } from "three/examples/jsm/nodes/Nodes";
// import WebGPU from "three/examples/jsm/capabilities/WebGPU";
export class LottoHavoc {
    private scene: Scene;
    private clock: Clock;
    private renderer: WebGLRenderer | WebGPURenderer;
    private camera: PerspectiveCamera;
    private world: HP_WorldId;
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
        this.renderer = new WebGPURenderer();
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
        /** create ground */
        const groundDimensions: number[] = [15, 0.1, 15];
        const ground = new Mesh(
            new BoxGeometry(groundDimensions[0], groundDimensions[1], groundDimensions[2]),
            new MeshBasicNodeMaterial()
        )
        this.scene.add(ground);
        ground.position.y = -10;
        this.bodies.push(this.createBoxBody(ground, "STATIC", groundDimensions));
        this.renderer.setAnimationLoop(this.update.bind(this));
        this.addCylinder();
        const coords = this.getCoords(5, 50);
        // coords.forEach(this.addBall.bind(this));
        this.bodies.push(this.createBall(null, "DYNAMIC"));
        const mat = new MeshBasicMaterial({ color: new Color("#0f0")} );
        const sphere = new Mesh(new SphereGeometry(1), mat);
        sphere.position.set(0, 0, 3);
        this.scene.add(sphere);
        this.bodies.push(this.createMeshImposter(sphere, "DYNAMIC"));
        this.addControls();
    }

    private addControls() {
        new OrbitControls(this.camera, this.renderer.domElement);
    }

    private addCylinder() {
        const glassMat = new MeshBasicMaterial({
            transparent: true,
            opacity: 0.2,
            colorWrite: true,
        });
        utilsObj.loadFile(this.scene, "sphere.obj", "obj", (obj: any) => {
            const invSphere = obj.children.find((m: Mesh) => (m.name.startsWith("sphere")));
            obj.children.forEach((displayObject: Mesh) => {
                if(displayObject.isMesh){
                    if(displayObject.material instanceof MeshPhongMaterial){
                        const mat = new MeshBasicMaterial({color: new Color("#00f")});
                        displayObject.material = mat;
                    }
                }
            })
            invSphere.material = glassMat;
            invSphere.position.y = 0
            this.bodies.push(this.createMeshImposter(invSphere, "STATIC"));
        });
    }

    private ballCount = 0;

    private update() {
        this.stats.update();
        const delta = Math.min(this.clock.getDelta(), 0.1);
        if (this.world) {
            this.havokStep(delta);
        }
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

    private createBall(mesh: Mesh, motionType: string) {
        const shapeId: HP_ShapeId = this.havok.HP_Shape_CreateSphere(
            [0, 0, 0], 0.5
        )[1]
        if (mesh === null) {
            // const mat = new MeshPhysicalMaterial({ color: "#f00" });
            const mat = new MeshBasicNodeMaterial({});
            mat.colorNode = color("#f00");
            mesh = new Mesh(
                new SphereGeometry(0.5),
                mat
            )
            this.scene.add(mesh);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return this.physicsAggregate(mesh, shapeId, motionType);
    }

    private createBoxBody(mesh: Mesh, motionType: string, dimensions: any = [1, 1, 1]) {
        const shapeId: HP_ShapeId = this.havok.HP_Shape_CreateBox(
            [0, 0, 0], [0, 0, 0, 1], dimensions
        )[1];
        if (mesh === null) {
            mesh = new Mesh(
                new BoxGeometry(dimensions[0], dimensions[1], dimensions[2]),
            )
            this.scene.add(mesh);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return this.physicsAggregate(mesh, shapeId, motionType);
    }

    /** create a imposter based on mesh geometry */
    private createMeshImposter(mesh: Mesh, motionType: string) {
        const vertices = utilsObj.getVertices(mesh);
        const indices = Object.keys(vertices).slice(0, Math.floor(vertices.length / 3)).map(Number);
        const meshAccumulator = new MeshAccumulator(mesh, true, this.scene);
        meshAccumulator._addMesh(mesh, vertices, indices);
        const positions = meshAccumulator.getVertices(this.havok);
        const numVec3s = positions.numObjects / 3;
        const triangles = meshAccumulator.getTriangles(this.havok);
        const numTriangles = triangles.numObjects / 3;
        const shapeId = this.havok.HP_Shape_CreateMesh(positions.offset, numVec3s, triangles.offset, numTriangles)[1];
        meshAccumulator.freeBuffer(this.havok, triangles);
        meshAccumulator.freeBuffer(this.havok, positions)
        return this.physicsAggregate(mesh, shapeId, motionType);
    }

    public getTransforms(mesh?: Mesh): { quaternion: Quaternion, position: Vector3 } {
        const meshRotation: Vector3 | Euler = mesh ? mesh.rotation : new Vector3(0, 0, 0);
        const meshPosition: Vector3 = mesh ? mesh.position : new Vector3(0, 0, 0);
        const quaternion = new Quaternion();
        const rotation = new Vector3(meshRotation.x, meshRotation.y, meshRotation.z);
        const position = new Vector3(meshPosition.x, meshPosition.y, meshPosition.z);
        quaternion.setFromEuler(new Euler(rotation.x, rotation.y, rotation.z));
        return { quaternion, position };
    }

    private physicsAggregate(mesh: Mesh, shapeId: HP_ShapeId, motionType: string) {
        const { position, quaternion } = this.getTransforms(mesh);
        const boxBodyId = this.havok.HP_Body_Create()[1];
        this.havok.HP_World_AddBody(this.world, boxBodyId, false);
        this.havok.HP_Body_SetShape(
            boxBodyId,
            shapeId
        );
        this.havok.HP_Body_SetQTransform(
            boxBodyId, [
            [position.x, position.y, position.z],
            [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
        ]
        )
        this.havok.HP_Body_SetMotionType(boxBodyId, (this.havok as any).MotionType[motionType]);
        mesh.matrixAutoUpdate = false
        return {
            offset: this.havok.HP_Body_GetWorldTransformOffset(boxBodyId)[1],
            id: boxBodyId,
            mesh
        }
    }
}