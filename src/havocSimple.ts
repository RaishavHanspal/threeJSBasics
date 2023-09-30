import { HP_WorldId, HavokPhysicsWithBindings } from '@babylonjs/havok';
import { Scene, PerspectiveCamera, WebGLRenderer, DirectionalLight, MeshStandardMaterial, DoubleSide, Color, Euler, Mesh, SphereGeometry, Vector3, Clock, Quaternion } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
export class GameHavok {
    private world: HP_WorldId;
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private bodies: any[] = [];
    private clock: Clock;
    constructor(private havok: HavokPhysicsWithBindings) {

        // Setup basic renderer, controls, and profiler
        const clientWidth = window.innerWidth;
        const clientHeight = window.innerHeight;
        const scene = new Scene();
        const camera = new PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);
        camera.position.set(50, 75, 50);
        const renderer = new WebGLRenderer();
        renderer.setSize(clientWidth, clientHeight);
        document.body.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 25, 0);
        // Setup scene
        const directionalLight = new DirectionalLight(0xffffff, 0.35);
        directionalLight.position.set(150, 200, 50);
        scene.add(directionalLight);
        console.log(havok);
        const world = havok.HP_World_Create()[1];
        havok.HP_World_SetGravity(world, [0, -9.81, 0]);
        const boxMat = new MeshStandardMaterial({ side: DoubleSide, color: new Color(1.0, 1.0, 1.0) });
        const createSphereBody = (position, rotation, scale, motionType, mesh = true) => {
            const q = new Quaternion();
            q.setFromEuler(new Euler(rotation.x, rotation.y, rotation.z));
            const boxBody = havok.HP_Body_Create()[1];
            havok.HP_Body_SetShape(
                boxBody,
                havok.HP_Shape_CreateSphere(
                    [0, 0, 0], 6.25
                )[1]
            );
            havok.HP_Body_SetQTransform(
                boxBody, [
                [position.x, position.y, position.z],
                [q.x, q.y, q.z, q.w]
            ]
            )
            havok.HP_World_AddBody(world, boxBody, false);
            havok.HP_Body_SetMotionType(boxBody, (havok as any).MotionType[motionType]);
            if (!mesh) return { offset: havok.HP_Body_GetWorldTransformOffset(boxBody)[1], id: boxBody }
            const body = new Mesh(
                new SphereGeometry(6.25),
                boxMat
            )
            body.castShadow = true;
            body.receiveShadow = true;
            body.matrixAutoUpdate = false;
            scene.add(body);
            return {
                offset: havok.HP_Body_GetWorldTransformOffset(boxBody)[1],
                id: boxBody,
                mesh: body
            }
        }
        let bodies = [];
        bodies.push(createSphereBody(new Vector3(10, 40, 0), new Vector3(0, 0, 0), new Vector3(2, 2, 2), "DYNAMIC"));
        bodies.push(createSphereBody(new Vector3(20, 40, 0), new Vector3(0, 0, 0), new Vector3(2, 2, 2), "DYNAMIC"));
        bodies.push(createSphereBody(new Vector3(30, 40, 0), new Vector3(0, 0, 0), new Vector3(2, 2, 2), "DYNAMIC"));
        bodies.push(createSphereBody(new Vector3(0, 40, 0), new Vector3(0, 0, 0), new Vector3(2, 2, 2), "DYNAMIC"));
        const clock = new Clock();

        function animate() {
            const delta = Math.min(clock.getDelta(), 0.1);
            havok.HP_World_Step(world, delta);
            const bodyBuffer = havok.HP_World_GetBodyBuffer(world)[1];
            for (let i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                const transformBuffer = new Float32Array(havok.HEAPU8.buffer, bodyBuffer + body.offset, 16);
                body.mesh.matrix.fromArray(transformBuffer);
                for (let mi = 0; mi < 15; mi++) {
                    if ((mi & 3) != 3) {
                        body.mesh.matrix.elements[mi] = transformBuffer[mi];
                    }
                }
                body.mesh.matrix.elements[15] = 1.0;
            }
            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate);

    }

    private init(): void {
        // Setup basic renderer, controls, and profiler
        const clientWidth = window.innerWidth;
        const clientHeight = window.innerHeight;
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);
        this.camera.position.set(50, 75, 50);
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(clientWidth, clientHeight);
        document.body.appendChild(this.renderer.domElement);
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.target.set(0, 25, 0);
        // Setup scene
        const directionalLight = new DirectionalLight(0xffffff, 0.35);
        directionalLight.position.set(150, 200, 50);
        this.scene.add(directionalLight);
        this.clock = new Clock();
        this.renderer.setAnimationLoop(this.animate.bind(this));
    }

    private initPhysics(): void {
        this.world = this.havok.HP_World_Create()[1];
        this.havok.HP_World_SetGravity(this.world, [0, -9.81, 0]);
    }

    private applyPhysics() {
        let bodies = [];
        bodies.push(this.createSphereBody(new Vector3(10, 40, 0), new Vector3(0, 0, 0), new Vector3(2, 2, 2), "DYNAMIC"));
        bodies.push(this.createSphereBody(new Vector3(20, 40, 0), new Vector3(0, 0, 0), new Vector3(2, 2, 2), "DYNAMIC"));
        bodies.push(this.createSphereBody(new Vector3(30, 40, 0), new Vector3(0, 0, 0), new Vector3(2, 2, 2), "DYNAMIC"));
        bodies.push(this.createSphereBody(new Vector3(0, 40, 0), new Vector3(0, 0, 0), new Vector3(2, 2, 2), "DYNAMIC"));
    }

    private createSphereBody(position, rotation, scale, motionType, mesh = true) {
        const q = new Quaternion();
        const boxMat = new MeshStandardMaterial({ side: DoubleSide, color: new Color(1.0, 1.0, 1.0) });
        q.setFromEuler(new Euler(rotation.x, rotation.y, rotation.z));
        const boxBody = this.havok.HP_Body_Create()[1];
        this.havok.HP_Body_SetShape(
            boxBody,
            this.havok.HP_Shape_CreateSphere(
                [0, 0, 0], 6.25
            )[1]
        );
        this.havok.HP_Body_SetQTransform(
            boxBody, [
            [position.x, position.y, position.z],
            [q.x, q.y, q.z, q.w]
        ]
        )
        this.havok.HP_World_AddBody(this.world, boxBody, false);
        this.havok.HP_Body_SetMotionType(boxBody, 2);
        if (!mesh) return { offset: this.havok.HP_Body_GetWorldTransformOffset(boxBody)[1], id: boxBody }
        const body = new Mesh(
            new SphereGeometry(6.25),
            boxMat
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

    public animate() {
        const delta = Math.min(this.clock.getDelta(), 0.1);
        this.havok.HP_World_Step(this.world, delta);
        const bodyBuffer = this.havok.HP_World_GetBodyBuffer(this.world)[1];
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const transformBuffer = new Float32Array(this.havok.HEAPU8.buffer, bodyBuffer + body.offset, 16);
            body.mesh.matrix.fromArray(transformBuffer);
            for (let mi = 0; mi < 15; mi++) {
                if ((mi & 3) != 3) {
                    body.mesh.matrix.elements[mi] = transformBuffer[mi];
                }
            }
            body.mesh.matrix.elements[15] = 1.0;
        }
        this.renderer.render(this.scene, this.camera);
    }
}