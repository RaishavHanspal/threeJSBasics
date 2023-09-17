import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
// import { GUI } from "three"
import * as CANNON from 'cannon-es'
import CannonUtils from './cannonUtils'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

export class Lotto {
    constructor(){
    const scene = new THREE.Scene()
    const light1 = new THREE.SpotLight(0xffffff, 500)
light1.position.set(10, 10, 10)
light1.angle = Math.PI / 4
light1.penumbra = 0.15
light1.castShadow = true
light1.shadow.mapSize.width = 1024
light1.shadow.mapSize.height = 1024
light1.shadow.camera.near = 0.5
light1.shadow.camera.far = 50
scene.add(light1)
    const light2 = new THREE.SpotLight(0xffffff, 500)
light2.position.set(-10, 10, 10)
light2.angle = Math.PI / 4
light2.penumbra = 0.15
light2.castShadow = true
light2.shadow.mapSize.width = 1024
light2.shadow.mapSize.height = 1024
light2.shadow.camera.near = 0.5
light2.shadow.camera.far = 50
scene.add(light2)
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.x = 4
camera.position.y = 6
camera.position.z = 7
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)
const controls = new OrbitControls(camera, renderer.domElement)
controls.screenSpacePanning = true
controls.target.y = 5
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)
//world.broadphase = new CANNON.NaiveBroadphase() //
//world.solver.iterations = 10
//world.allowSleep = true
const basicMaterial = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
})
const normalMaterial = new THREE.MeshNormalMaterial({
    side: THREE.DoubleSide,
    wireframe: true,
})
const phongMaterial = new THREE.MeshPhongMaterial()
const railMaterial = new THREE.MeshPhysicalMaterial()
railMaterial.color = new THREE.Color('#ffffff')
railMaterial.reflectivity = 0
// railMaterial.refractionRatio = 0
railMaterial.roughness = 0.2
railMaterial.metalness = 1
railMaterial.clearcoat = 0.15
railMaterial.clearcoatRoughness = 0.5
railMaterial.side = THREE.DoubleSide
const inverseSphereMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.35,
    transmission: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.35,
    ior: 1.25,
})
inverseSphereMaterial.thickness = 10.0

const pmremGenerator = new THREE.PMREMGenerator(renderer)
const envTexture = new THREE.CubeTextureLoader().load(
    [
        'img/px_50.png',
        'img/nx_50.png',
        'img/py_50.png',
        'img/ny_50.png',
        'img/pz_50.png',
        'img/nz_50.png',
    ],
    () => {
        inverseSphereMaterial.envMap =
            pmremGenerator.fromCubemap(envTexture).texture
        pmremGenerator.dispose()
    }
)
const ballMaterial = []
ballMaterial.push(
    new THREE.MeshPhysicalMaterial({
        map: new THREE.TextureLoader().load('assets/1-ball.jpg'),
        roughness: 0.88,
        metalness: 1.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
    })
)
ballMaterial.push(
    new THREE.MeshPhysicalMaterial({
        map: new THREE.TextureLoader().load('assets/2-ball.jpg'),
        roughness: 0.88,
        metalness: 1.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
    })
)
ballMaterial.push(
    new THREE.MeshPhysicalMaterial({
        map: new THREE.TextureLoader().load('assets/3-ball.jpg'),
        roughness: 0.88,
        metalness: 1.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
    })
)
ballMaterial.push(
    new THREE.MeshPhysicalMaterial({
        map: new THREE.TextureLoader().load('assets/4-ball.jpg'),
        roughness: 0.88,
        metalness: 1.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
    })
)
ballMaterial.push(
    new THREE.MeshPhysicalMaterial({
        map: new THREE.TextureLoader().load('assets/5-ball.jpg'),
        roughness: 0.88,
        metalness: 1.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
    })
)
ballMaterial.push(
    new THREE.MeshPhysicalMaterial({
        map: new THREE.TextureLoader().load('assets/6-ball.jpg'),
        roughness: 0.88,
        metalness: 1.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
    })
)
ballMaterial.push(
    new THREE.MeshPhysicalMaterial({
        map: new THREE.TextureLoader().load('assets/7-ball.jpg'),
        roughness: 0.88,
        metalness: 1.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
    })
)
ballMaterial.push(
    new THREE.MeshPhysicalMaterial({
        map: new THREE.TextureLoader().load('assets/8-ball.jpg'),
        roughness: 0.88,
        metalness: 1.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
    })
)
ballMaterial.push(
    new THREE.MeshPhysicalMaterial({
        map: new THREE.TextureLoader().load('assets/9-ball.jpg'),
        roughness: 0.88,
        metalness: 1.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
    })
)
ballMaterial.push(
    new THREE.MeshPhysicalMaterial({
        map: new THREE.TextureLoader().load('assets/10-ball.jpg'),
        roughness: 0.88,
        metalness: 1.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
    })
)
const positions = [
    [-2, 3, 0],
    [0, 3, 0],
    [2, 3, 0],
    [0, 3, -2],
    [0, 3, 2],
    [-2, 6, 0],
    [0.5, 8, 0.5],
    [2, 6, 0],
    [0, 6, -2],
    [0, 6, 2],
]
const sphereMesh: THREE.Mesh[] = new Array()
const sphereBody: CANNON.Body[] = new Array()
for (let i = 0; i < 10; i++) {
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16)
    sphereMesh.push(new THREE.Mesh(sphereGeometry, ballMaterial[i]))
    sphereMesh[i].position.x = positions[i][0]
    sphereMesh[i].position.y = positions[i][1]
    sphereMesh[i].position.z = positions[i][2]
    sphereMesh[i].castShadow = true
    sphereMesh[i].receiveShadow = true
    scene.add(sphereMesh[i])
    const sphereShape = new CANNON.Sphere(1)
    sphereBody.push(new CANNON.Body({ mass: 1 }))
    sphereBody[i].addShape(sphereShape)
    sphereBody[i].position.x = sphereMesh[i].position.x
    sphereBody[i].position.y = sphereMesh[i].position.y
    sphereBody[i].position.z = sphereMesh[i].position.z
    world.addBody(sphereBody[i])
}
let inverseSphere: THREE.Object3D
let inverseSphereBody: CANNON.Body
let innerRail: THREE.Object3D
let innerRailBody: CANNON.Body
let outerRail: THREE.Object3D
let modelLoaded = false
const objLoader = new OBJLoader()
objLoader.load(
    'assets/inverseSphere4.obj',
    (object) => {
        object.traverse(function (child) {
            if ((child as THREE.Mesh).isMesh) {
                if (child.name.startsWith('sphere')) {
                    inverseSphere = child
                        ; (inverseSphere as THREE.Mesh).material =
                            inverseSphereMaterial
                    inverseSphere.position.x = 0
                    inverseSphere.position.y = 5
                    // var constraintBody = new CANNON.Body({ mass: 0 })
                    // constraintBody.addShape(new CANNON.Sphere(0.01))
                    // constraintBody.position.set(0, 5, 0)
                    // world.addBody(constraintBody)
                    const shape = CannonUtils.CreateTrimesh(
                        (inverseSphere as THREE.Mesh).geometry
                    )
                    inverseSphereBody = new CANNON.Body({ mass: 0 })
                    inverseSphereBody.addShape(shape)
                    inverseSphereBody.position.x = inverseSphere.position.x
                    inverseSphereBody.position.y = inverseSphere.position.y
                    inverseSphereBody.position.z = inverseSphere.position.z
                    world.addBody(inverseSphereBody)
                    // const c = new CANNON.PointToPointConstraint(
                    //     constraintBody,
                    //     new CANNON.Vec3(0, 0, 0),
                    //     inverseSphereBody,
                    //     new CANNON.Vec3(0, 0, 0)
                    // )
                    // worl d.addConstraint(c)
                } else if (child.name.startsWith('outerRail_')) {
                    // outerRail = child
                    //     ; (outerRail as THREE.Mesh).material = railMaterial
                    // outerRail.position.y = 5
                    // const outerRailShape = CannonUtils.CreateTrimesh(
                    //     (outerRail as THREE.Mesh).geometry
                    // )
                    // const outerRailBody = new CANNON.Body({ mass: 0 })
                    // outerRailBody.addShape(outerRailShape)
                    // outerRailBody.position.set(0, 5, 0)
                    // world.addBody(outerRailBody)
                } else if (child.name.startsWith('innerRail_')) {
                    console.log(child.name)
                    innerRail = child
                        ; (innerRail as THREE.Mesh).material = railMaterial
                    innerRail.position.y = 5
                    const innerRailShape = CannonUtils.CreateTrimesh(
                        (innerRail as THREE.Mesh).geometry
                    )
                    inverseSphereBody.addShape(innerRailShape)
                }
            }
        })
        scene.add(inverseSphere)
        scene.add(outerRail)
        scene.add(innerRail)
        modelLoaded = true
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)
const planeGeometry = new THREE.PlaneGeometry(25, 25)
const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial)
planeMesh.rotateX(-Math.PI / 2)
planeMesh.receiveShadow = true
scene.add(planeMesh)
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}
const stats = new Stats()
document.body.appendChild(stats.dom)
// const gui = new GUI()
// const physicsFolder = gui.addFolder('Physics')
// physicsFolder.add(world.gravity, 'x', -10.0, 10.0, 0.1)
// physicsFolder.add(world.gravity, 'y', -10.0, 10.0, 0.1)
// physicsFolder.add(world.gravity, 'z', -10.0, 10.0, 0.1)
// const materialFolder = gui.addFolder('THREE.Material')
// materialFolder.add(inverseSphereMaterial, 'transparent').onChange(() => inverseSphereMaterial.needsUpdate = true)
// materialFolder.add(inverseSphereMaterial, 'opacity', 0, 1, 0.01)
// const InverseSphereMaterialFolder = gui.addFolder('InverseSphereMaterial')
// InverseSphereMaterialFolder.add(inverseSphereMaterial, 'roughness', 0, 1, 0.01)
// InverseSphereMaterialFolder.add(inverseSphereMaterial, 'metalness', 0, 1, 0.01)
// InverseSphereMaterialFolder.add(inverseSphereMaterial, 'clearcoat', 0, 1, 0.01)
// InverseSphereMaterialFolder.add(
//     inverseSphereMaterial,
//     'clearcoatRoughness',
//     0,
//     1,
//     0.01
// )
// InverseSphereMaterialFolder.add(
//     inverseSphereMaterial,
//     'transmission',
//     0,
//     1,
//     0.01
// )
// InverseSphereMaterialFolder.add(inverseSphereMaterial, 'ior', 1, 2.4, 0.01)
// InverseSphereMaterialFolder.add(inverseSphereMaterial, 'thickness', 0, 10, 0.01)
// InverseSphereMaterialFolder.open()
// const railMaterialFolder = gui.addFolder('RailMaterial')
// railMaterialFolder.add(railMaterial, 'roughness', 0.0, 1.0, 0.01)
// railMaterialFolder.add(railMaterial, 'metalness', 0, 1, 0.01)
// railMaterialFolder.add(railMaterial, 'clearcoat', 0, 1, 0.01)
// railMaterialFolder.add(railMaterial, 'clearcoatRoughness', 0, 1, 0.01)
const clock = new THREE.Clock()
var animate = function () {
    requestAnimationFrame(animate)
    controls.update()
    let delta = clock.getDelta()
    if (delta > 0.1) delta = 0.1
    world.step(delta)
    for (let i = 0; i < 10; i++) {
        sphereMesh[i].position.set(
            sphereBody[i].position.x,
            sphereBody[i].position.y,
            sphereBody[i].position.z
        )
        sphereMesh[i].quaternion.set(
            sphereBody[i].quaternion.x,
            sphereBody[i].quaternion.y,
            sphereBody[i].quaternion.z,
            sphereBody[i].quaternion.w
        )
    }
    if (false) {
        inverseSphereBody.angularVelocity.set(0, 0, -0.5)
        inverseSphere.position.set(
            inverseSphereBody.position.x,
            inverseSphereBody.position.y,
            inverseSphereBody.position.z
        )
        inverseSphere.quaternion.set(
            inverseSphereBody.quaternion.x,
            inverseSphereBody.quaternion.y,
            inverseSphereBody.quaternion.z,
            inverseSphereBody.quaternion.w
        )
        innerRail.position.set(
            inverseSphereBody.position.x,
            inverseSphereBody.position.y,
            inverseSphereBody.position.z
        )
        innerRail.quaternion.set(
            inverseSphereBody.quaternion.x,
            inverseSphereBody.quaternion.y,
            inverseSphereBody.quaternion.z,
            inverseSphereBody.quaternion.w
        )
    }
    render()
    stats.update()
}
function render() {
    renderer.render(scene, camera)
}
animate()}}