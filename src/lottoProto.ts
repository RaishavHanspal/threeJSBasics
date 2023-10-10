import { Clock, Color, CylinderGeometry, DirectionalLight, DoubleSide, HemisphereLight, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshPhysicalMaterial, PerspectiveCamera, PlaneGeometry, PointLight, Scene, SphereGeometry, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import CannonUtils from "./cannonUtils";
import * as CANNON from 'cannon-es'
import WebGPURenderer from "three/examples/jsm/renderers/webgpu/WebGPURenderer";
import { GUI } from 'dat.gui'
import { MeshBasicNodeMaterial, MeshPhysicalNodeMaterial, color, lightingContext } from "three/examples/jsm/nodes/Nodes";
import MeshPhongNodeMaterial from "three/examples/jsm/nodes/materials/MeshPhongNodeMaterial";

export class LottoProto {
    private scene: Scene;
    private clock: Clock;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private world: CANNON.World;
    private physicsArray: Array<Array<any>> = [];
    private inverseBody: any;
    constructor() {
        this.initialize();
    }

    private gui: GUI;
    private selectedOptions: any = {
        renderer: "WebGPURenderer"
    } 
    private initialize() {
        const renderType = localStorage.getItem("renderer") || "WebGPURenderer";
        if(renderType && ["WebGLRenderer", "WebGPURenderer"].includes(renderType)){
            this.selectedOptions.renderer = renderType;
        }
        const physical = new MeshPhysicalNodeMaterial({});
        physical.colorNode = color(0xffffff);
        const phong = new MeshPhongNodeMaterial();
        new MeshBasicNodeMaterial();
        phong.colorNode = color(0xffffff);
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.scene = new Scene();
        this.scene.background = new Color(0x262626);
        this.clock = new Clock();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 20;
        this.gui = new GUI()
        const webGL = new WebGLRenderer();
        const webGPU = new WebGPURenderer({antialias: true});
        const options = {
            side:{
                WebGLRenderer: webGL,
                WebGPURenderer: webGPU
            }
        }
        this.gui.add(this.selectedOptions, "renderer", ["WebGLRenderer", "WebGPURenderer"])
        .onChange((v) => {
            this.renderer = options.side[v];
            localStorage.setItem("renderer", v);
            location.reload();
        });
        this.renderer = this.selectedOptions.renderer === "WebGPURenderer" ? webGPU: webGL;
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

    private cylinderMat: CANNON.Material;
    private ballMat: CANNON.Material;
    private startRender() {
        this.renderer.setAnimationLoop(this.update.bind(this));
        // this.addPlane();
        this.cylinderMat = new CANNON.Material();
        this.ballMat = new CANNON.Material();
        this.addCylinder();
        const coords = this.getCoords(5, 50);
        coords.forEach(this.addBall.bind(this));
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
        const glassMat = new MeshPhysicalMaterial({
            transparent: true,
            opacity: 0.2, transmission: 0
        });
        utilsObj.loadFile(this.scene, "sphere.obj", "obj", (obj: any) => {
            const invSphere = obj.children.find((m: Mesh) => (m.name.startsWith("sphere")));
                        invSphere.material = glassMat;
            this.inverseBody = this.linkPhysics(invSphere, 10, this.cylinderMat);
            let constraintBody = new CANNON.Body({ mass: 0 });
            constraintBody.addShape(new CANNON.Sphere(1));
            constraintBody.position.set(0, 0, 0);
            this.world.addBody(constraintBody);
            const c = new CANNON.PointToPointConstraint(
                constraintBody,
                new CANNON.Vec3(0, 0, 0),
                this.inverseBody,
                new CANNON.Vec3(0, 0, 0)
            )
            this.world.addConstraint(c)
        });
    }

    private ballCount = 0;
    private addBall(pos: any) {
        const [x, y, z] = pos;
        const radius = 0.5;
        const sphere = new Mesh(new SphereGeometry(radius), new MeshPhysicalMaterial({
            color: 0xff0000,
            roughness: 0.88,
            metalness: 1.0,
            clearcoat: 0.3,
            clearcoatRoughness: 0.15
        }));
        sphere.name = "sphere" + this.ballCount;
        this.ballCount++;
        sphere.position.set(x, y, z);
        this.scene.add(sphere);
        this.linkBallPhysics(sphere, 1, this.ballMat, radius);
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

    private linkBallPhysics(mesh: Mesh, mass: number, material: CANNON.Material, radius: number = 0.125): CANNON.Body {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({ mass });
        body.addShape(shape);
        this.world.addBody(body);
        // mesh.position.y = 0;
        body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
        this.physicsArray.push([mesh, body]);
        return body;
    }

    private update() {
        this.stats.update();
        const delta = Math.min(this.clock.getDelta(), 0.1);
        this.world && this.world.step(delta);
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
}