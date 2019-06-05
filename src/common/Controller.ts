import { Euler, Group, Vector3 } from "three";
import Space from "./Space";
import {
  resetCoordinate,
  copyCoordinate
} from "./base/utilities";
import {isNumber} from "lodash";

const THREE = (window as IWindow).THREE;

class Controller {
  lineObject3d: IGroup;
  name: string;
  object3d: Objects;
  originalPosition: Vector3;
  originalRotation: Euler;
  originalScale: Vector3;
  pipeObject3d:IGroup;
  position: Vector3;
  pointsObject3d: IGroup;
  rotation: Euler;
  userData: any;
  scale: Vector3;
  showingObject3d: Objects;
  showingModel: string;
  space: Space;

  constructor(space: Space, object3d: Objects, options?: any) {
    this .space = space;
    this .object3d = object3d;
    object3d.$controller = this ;
    this .init();
  }

  applyUserData(){
    if(!this .userData){
      return ;
    }
    // console.log(this .name, "applyUserData")

    Array.from(this .object3d.children).forEach((v:Objects)=>{
      if(v.$controller){
        v.$controller.applyUserData();
      }
    });

    const userData = this .userData
    if(userData.renderOrder){
      this .object3d.renderOrder =userData.renderOrder
    }

    if(userData.showingModel){
      this .changeShowingModel(userData.showingModel)
    }

    if(userData.bloom){
      this .bloom(true);
    }

  }

  bloom(on:boolean){
    if(on){
      this .showingObject3d.layers.enable(1);
    }
    else{
      this .showingObject3d.layers.disable(1);
    }
  }

  changeShowingModel(model: string): Controller {

    switch (model) {
      case "line":
        this .changeToLineModel();
        break;
      case "normal":
        this .changeToNormalModel();
        break;
      case "pipe":
        this .changeToPipeModel();
        break;
      case "points":
        this .changeToPointsModel();
        break;

      default:
        console.error("can't change to this model :", model);
        return this ;
    }
    this .showingModel = model;
    return this ;
  }

  changeToNormalModel(): Controller {
    if(this .showingModel === "normal"){
      return;
    }
    this .updateShowingObject3d(this .object3d);
    return this ;
  }

  changeToLineModel(options?:any): Controller {
    if(this .showingModel === "line"){
      return;
    }

    if (!this .lineObject3d) {
      this .initLineModel(options);
    }

    this .updateShowingObject3d(this .lineObject3d);
    return this ;
  }

  changeToPipeModel(options?:any): Controller {
    if(this .showingModel === "pipe"){
      return;
    }

    if (!this .pipeObject3d) {
      this .initPipeModel(options);
    }

    this .updateShowingObject3d(this .pipeObject3d);
    return this ;
  }

  changeToPointsModel(options?:any): Controller {
    if(this .showingModel === "points"){
      return;
    }

    if (!this .pointsObject3d) {
      this .initPointsModel(options);
    }

    this .updateShowingObject3d(this .pointsObject3d);
    return this ;
  }

  init(): Controller {
    const object3d = this .object3d;

    this .name = object3d.name;
    this .userData = object3d.userData;

    this .originalPosition = this .position = object3d.position.clone();
    this .originalRotation = this .rotation = object3d.rotation.clone();
    this .originalScale = this .scale = object3d.scale.clone();

    this .showingModel = "normal";
    this .showingObject3d = object3d;
    return this ;
  }

  initLineModel(options?:any): Controller {
    const opt = options || this .userData.showingModelOptions || {}
    const object3d = this .object3d;
    const group = this .lineObject3d = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({color: opt.color || 0x00FFFF});
    const boxMaterial = new THREE.LineBasicMaterial({
      opacity: opt.opacity || 0 ,
      side: THREE.BackSide,
      transparent: true
    });
    group.name = this .name + "_lineObject3d";
    group.$controller = this ;

    const children = Array.from(object3d.children);
    children.push(object3d);
    children.forEach((v: IMesh) => {
      if (this .hasGeometry(v)) {
        const geo = new THREE.EdgesGeometry(v.geometry);
        const line = new THREE.LineSegments( geo , lineMaterial);
        // add transparent box to avoid picking difficult by raycaster.
        const box = new THREE.Mesh(v.geometry, boxMaterial);
        // @ts-ignore
        if(object3d.geometry){
          resetCoordinate(line);
          resetCoordinate(box);
        }
        else{
          copyCoordinate(v, line);
          copyCoordinate(v, box);
        }

        group
        .add(line)
        .add(box);

      }
    });
    return this ;
  }

  initPipeModel(options?:any):Controller{
    const opt = options || this .userData.showingModelOptions || {}
    const object3d = this .object3d;
    const group = this .pipeObject3d = new THREE.Group();
    const degToRad = THREE.Math.degToRad
    group.name = this .name + "_pipeObject3d";
    group.$controller = this ;
    // make a texture with an arrow
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = 64;
    ctx.canvas.height = 64;

    ctx.translate(32, 32);
    ctx.rotate(isNumber(opt.flowRotation)? degToRad(opt.flowRotation) : degToRad(90));
    ctx.fillStyle = opt.flowColor || "#00ffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "48px sans-serif";
    ctx.fillText("➡︎", 0, 0);

    const texture = new THREE.CanvasTexture(ctx.canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.x = 1;
    texture.repeat.y = opt.flowNumber || 5;

    const material = new THREE.MeshBasicMaterial({
      color: opt.color || 0x4040FF,
      opacity: opt.opacity || 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      transparent: true,
    });

   const stripMat = new THREE.MeshBasicMaterial({
    map: texture,
    opacity: opt.flowOpacity || 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    transparent: true,
    });

    object3d.traverse((v:IMesh)=>{
      if(this .hasGeometry(v)){
        const mesh = new THREE.Mesh(v.geometry, material);
        const stripMesh = new THREE.Mesh(v.geometry, stripMat);

        group
        .add(mesh)
        .add(stripMesh)
      }
    })

    this .space.addAnimateAction(`${this .name}-pipe`,()=>{
      texture.offset.y += opt.flowSpeed || 0.01;
    })

    return this;
  }

  initPointsModel(options?:any): Controller {
    const opt = options || this .userData.showingModelOptions || {}
    const pointsMaterial = new THREE.PointsMaterial( { size: opt.size || 0.1, color: opt.color || 0xffffff } )
    const children = Array.from(this .object3d.children);
    const group = this .pointsObject3d = new THREE.Group();
    group.name = this .name + "_pointsObject3d";
    group.$controller = this ;
    children.push(this .object3d);
    children.forEach((v: IMesh) => {
      if (this .hasGeometry(v)) {
        const points = new THREE.Points( v.geometry, pointsMaterial );
        points.position.set(0, 0, 0);

        group
        .add(points)
      }
    });
    return this ;

  }

  hasGeometry(obj: Objects): boolean {
    // @ts-ignore
    return !!obj.geometry;
  }

  updateShowingObject3d(newShowingObject3d: Objects): Controller {
    // move children(group) to new showingObject3d(exclude other objects without geometry.)
    const showingObject3d = this .showingObject3d;
    const children = Array.from(showingObject3d.children);
    children.forEach((obj: Objects) => {
      if (!this .hasGeometry(obj)) {
        newShowingObject3d.add(obj);
      }
    });

    const parent = showingObject3d.parent;
    if (parent) {
      // append to parent
      // remove old showingObject3d from parent
      parent
      .add(newShowingObject3d)
      .remove(showingObject3d);
    }
    copyCoordinate(showingObject3d, newShowingObject3d);
    this .showingObject3d = newShowingObject3d;
    return this ;
  }

}

export default Controller;
