import { Clock, Color, CylinderGeometry, DirectionalLight, DoubleSide, HemisphereLight, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PerspectiveCamera, PlaneGeometry, Scene, SphereGeometry, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import CannonUtils from "./cannonUtils";
import * as CANNON from 'cannon-es'

export class LottoProto {
    private scene: Scene;
    private clock: Clock;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private world: CANNON.World;
    private physicsArray: Array<Array<any>> = [];
    private inverseBody : any;
    constructor() {
        this.initialize();
    }

    private initialize() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.scene = new Scene();
        this.scene.background = new Color(0x262626);
        this.clock = new Clock();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 20;
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.startRender();
        this.addLight();
    }

    private addLight() {
        const light1 = new HemisphereLight();
        this.scene.add(light1);
        const light2 = new DirectionalLight();
        this.scene.add(light2);
    }

    private cylinderMat: CANNON.Material;
    private ballMat: CANNON.Material;
    private startRender() {
        this.renderer.setAnimationLoop(this.update.bind(this));
        // this.addPlane();
        this.cylinderMat = new CANNON.Material();
        this.ballMat = new CANNON.Material();
        this.addCylinder();
        // setTimeout(() => {
            this.addBall(3, 0, 0);
            this.addBall(6, 2, 2);

        // }, 3000)
        // const matground = new CANNON.ContactMaterial(this.cylinderMat, this.ballMat, { friction: 0.5, restitution: 1 });
        // this.world.addContactMaterial(matground);
        this.addControls();
    }

    private addControls() {
        new OrbitControls(this.camera, this.renderer.domElement);
    }
    private addPlane() {
        const plane = new Mesh(new PlaneGeometry(25, 25, 4, 4), new MeshBasicMaterial({ color: "#ffffff", side: DoubleSide }));
        plane.rotateX(- Math.PI / 2);
        plane.position.y = -10
        this.scene.add(plane);
    }

    private addCylinder() {
        const cylinder = new Mesh(new CylinderGeometry(10, 10, 15), new MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0,
            transmission: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0,
             thickness: 3
        }));
        // cylinder.rotateX(- Math.PI / 2);
        this.scene.add(cylinder);
        this.inverseBody = this.linkPhysics(cylinder, 10, this.cylinderMat);
        let constraintBody = new CANNON.Body({ mass: 0 })
        constraintBody.addShape(new CANNON.Sphere(1))
        constraintBody.position.set(0, 0, 0)
        this.world.addBody(constraintBody)
        const c = new CANNON.PointToPointConstraint(
            constraintBody,
            new CANNON.Vec3(0, 0, 0),
            this.inverseBody,
            new CANNON.Vec3(0, 0, 0)
        )
        this.world.addConstraint(c)
    }

    private addBall(x: number = 0, y: number = 0, z: number = 0) {
        const sphere = new Mesh(new SphereGeometry(2), new MeshPhysicalMaterial({
            color: 0xff0000,
            roughness: 0.88,
            metalness: 1.0,
            clearcoat: 0.3,
            clearcoatRoughness: 0.15
        }));
        sphere.position.set(x, y, z);
        this.scene.add(sphere);
        this.linkBallPhysics(sphere, 200000, this.ballMat);
    }

    private linkPhysics(mesh: Mesh, mass: number, material: CANNON.Material): CANNON.Body {
        const shape = CannonUtils.CreateTrimesh(mesh.geometry);
        const body = new CANNON.Body({ mass, material });
        body.addShape(shape);
        this.world.addBody(body);
        body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
        this.physicsArray.push([mesh, body]);
        return body;
    }

    private linkBallPhysics(mesh: Mesh, mass: number, material: CANNON.Material): CANNON.Body {
        const shape = new CANNON.Sphere(2);
        const body = new CANNON.Body({ mass: 10 });
        body.addShape(shape);
        this.world.addBody(body);
        // mesh.position.y = 0;
        body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
        this.physicsArray.push([mesh, body]);
        return body;
    }

    private update() {
        const delta = this.clock.getDelta();
        this.world && this.world.step(delta);
        this.inverseBody.angularVelocity.set(-0.75, 0, 0)
        this.physicsArray.forEach((physicsEntry: Array<any>) => {
            const [mesh, body] = physicsEntry;
            mesh.position.set(body.position.x, body.position.y, body.position.z);
            mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
        })
        this.renderer.render(this.scene, this.camera);
    }
}