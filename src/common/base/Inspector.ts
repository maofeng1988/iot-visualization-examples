// @ts-ignore
import Stats from "./Stats.js"; // can not import Stats from "THREE/examples/js/libs/stats.min.js"
import Space from "../Space.js";
import * as dat from "dat.gui";

// https://github.com/mrdoob/stats.js/blob/master/src/Stats.js
interface StatsInterface{
  dom:Element;
  new():any;
  update():any;
}

class Inspector{
  animateAction:Function;
  gui:any;
  raycasterEvent:any;
  space:Space;
  stats:StatsInterface;
  constructor(space:Space){
    this .space = space;
    this .gui = new dat.GUI();
    const stats = this .stats = new Stats();
    space.element.appendChild(stats.dom);
    this .animateAction = this ._animateAction()

    this .raycasterEvent={
      click:(intersects:any[])=>{
        if(intersects.length === 0){
          return ;
        }
        const obj = intersects[0].object;
        (< windowEx>window).selectedThing = obj;
        console.log(obj);
        space.setOutline([obj])

      }
    };
    return this ;
  }

  private _animateAction():Function{
    const stats = this .stats;
    return ()=>{
      stats.update();
    }
  }

}

export default Inspector;