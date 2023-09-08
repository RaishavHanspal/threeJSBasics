import { BoxGeometry, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshPhysicalMaterial, Object3D, PlaneGeometry, Vector3 } from "three";

export class reel extends Object3D {
    private spinning: boolean = false;
    private spinSpeed: number = 0.75;
    private symID: number = 0;
    constructor(private symCount: number, private reelDimensions: any, private reelId: number){
        super();
        this.init();
    }

    private init(){
        new Object3D();
        /** additional symbol on top for reelspin */
        for (let i = 0; i <= this.symCount; i++) {
            this.add(this.getPlane(((i + 0.5) * this.reelDimensions.y), this.getRandomColor()));
            this.symID++;
        }
    }

    public spin(): void{
        this.spinning = true;
    }

    public isSpinning(): boolean{
        return this.spinning;
    }

    public stop(): void{
        this.spinning = false;
    }

    private getRandomColor(): string {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * letters.length)];
        }
        return color;
    }

    private getPlane(posY: number, color: string): Mesh {
        /** this can be configurable - since we don't know what way the reel will be created 
         * can also use @PlaneGeometry
        */
        const geometry = new BoxGeometry(this.reelDimensions.x, this.reelDimensions.y, this.reelDimensions.z);
        const material = new MeshPhongMaterial({
            map: utilsObj.getTexture(utilsObj.getRandomNumber(1, 5) + ".png"),
            reflectivity: 1,
            flatShading: true,
            refractionRatio: 1,
            emissive: "#fff",
            emissiveIntensity: 0.005,
            shininess: 0.5,
            specular: "#B00",
            color: "#fff"
        });
        const mesh = new Mesh(geometry, material);
        mesh.name = `reel_${this.reelId}_${this.symID}`;
        utilsObj.addSceneMesh(mesh);
        /** @todo: have a look - added workaround for inverted mesh */
        mesh.scale.set(-1, -1, -1);
        mesh.position.y = posY;
        return mesh;
    }

    /** @todo - need to use delta to maintain correct time */
    public update(deltaTime: number): void {
        if (this.spinning) {
            const desiredFPS = 1000/ 60;
            const delta = deltaTime/ desiredFPS;
            let speed: number = this.spinSpeed;
            if(delta > 1){
                speed *= delta;
            }
            this.position.y -= this.spinSpeed;
            if (this.position.y < - this.reelDimensions.y) {
                this.position.y = 0;
                /** remove the bottom most symbol */
                const lastSym = this.children.shift();
                this.remove(lastSym);
                this.children.forEach((sym: Mesh, i) => (sym.position.y = ((i + 0.5) * this.reelDimensions.y)));
                /** add new sym */
                this.symID++;
                this.add(this.getPlane(((this.symCount + 0.5) * this.reelDimensions.y), this.getRandomColor()))
            }
        }
    }
}