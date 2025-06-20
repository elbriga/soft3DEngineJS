// shim layer with setTimeout fallback
window.requestAnimationFrame = (function () {
   return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         function (callback) {
             window.setTimeout(callback, 1000 / 60);
         };
     })();

var device;
var camera;
var meshes = [];

function onKeyUp(event) {
    switch(event.code) {
        case "ArrowUp":
        case "ArrowDown":
            meshes[1].setAnim(0);
            break;
    }
}

function onKeyDown(event) {
    switch(event.code) {
        case "ArrowUp":
            meshes[1].setAnim(1);
            meshes[1].walk(3);
            break;
        case "ArrowDown":
            meshes[1].setAnim(1);
            meshes[1].walk(-2);
            break;
        case "ArrowLeft":
            meshes[1].Rotation.y -= 0.1;
            break;
        case "ArrowRight":
            meshes[1].Rotation.y += 0.1;
            break;
        case "ControlLeft":
            meshes[1].setAnim(10, 0);
            break;
    }
}

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    document.getElementById("body").addEventListener('keydown', onKeyDown);
    document.getElementById("body").addEventListener('keyup',   onKeyUp);
    
    camera = new SoftEngine.Camera();
    device = new SoftEngine.Device(document.getElementById("frontBuffer"));

    camera.Position = new BABYLON.Vector3(0, 80, 400);
    camera.Target   = new BABYLON.Vector3(0, 0, 0);

    var mdl = new QuakeMDL("data/models/ogre.mdl");
    mdl.mesh.Rotation.x = 3.14 + (3.14 / 2);
    mdl.mesh.Rotation.y = 3.14;
    mdl.mesh.Position.x = 50;
    meshes.push(mdl.mesh);
    
    var mdl2 = new QuakeMDL("data/models/hknight.mdl");
    mdl2.mesh.Rotation.x = 3.14 + (3.14 / 2);
    mdl2.mesh.Position.x = -50;
    meshes.push(mdl2.mesh);
    
    //device.LoadJSONFileAsync("data/models/car.babylon", loadJSONCompleted);

    requestAnimationFrame(drawingLoop);
}

function loadJSONCompleted(meshesLoaded) {
    for (var m=0; m < meshesLoaded.length; m++) {
        meshesLoaded[m].scale(20.0);
        meshes.push(meshesLoaded[m]);
    }

    requestAnimationFrame(drawingLoop);
}

var delayCount = 2, deltaLuz = 5;
var animationDelay = 0;
var lightPos = 0;//new BABYLON.Vector3(0, 20, 0);
function drawingLoop() {
    device.clear();

    var dist = meshes[1].Position.subtract(meshes[0].Position).length();

    // document.getElementById("debug").textContent = "lZ: " + lightPos.z;
    document.getElementById("debug").textContent = "anim: " + meshes[1].getNameAnim();
    // document.getElementById("debug").textContent = "d: " + dist;

    if (dist < 80) meshes[0].setAnim(3)
    else           meshes[0].setAnim(0)

    device.render(camera, meshes, lightPos);
    device.present();

    animationDelay++;
    if (animationDelay > delayCount) {
        animationDelay = 0;

        meshes[0].incFrame();
        meshes[1].incFrame();
    }

    if (lightPos) {
        lightPos.z += deltaLuz;
        if (lightPos.z > 100 || lightPos.z < -100) {
            deltaLuz = 0 - deltaLuz;
        }
    }

    requestAnimationFrame(drawingLoop);
}
