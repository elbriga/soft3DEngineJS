// shim layer with setTimeout fallback
window.requestAnimationFrame = (function () {
   return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         function (callback) {
             window.setTimeout(callback, 1000 / 60);
         };
     })();

var canvas;
var device;
var camera;
var meshes = [];

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.getElementById("frontBuffer");
    camera = new SoftEngine.Camera();
    device = new SoftEngine.Device(canvas);

    camera.Position = new BABYLON.Vector3(0, 0, 400);
    camera.Target   = new BABYLON.Vector3(0, 0, 0);

    var mdl = new QuakeMDL("data/models/ogre.mdl");
    mdl.mesh.Rotation.x = 3.14 + (3.14 / 2);
    mdl.mesh.Position.x = 50;
    meshes.push(mdl.mesh);
    
    var mdl2 = new QuakeMDL("data/models/hknight.mdl");
    mdl2.mesh.Rotation.x = 3.14 + (3.14 / 2);
    mdl2.mesh.Position.x = -50;
    meshes.push(mdl2.mesh);
    
    device.LoadJSONFileAsync("data/models/car.babylon", loadJSONCompleted);

    //requestAnimationFrame(drawingLoop);
}

function loadJSONCompleted(meshesLoaded) {
    for (var m=0; m < meshesLoaded.length; m++) {
        meshesLoaded[m].scale(20.0);
        meshes.push(meshesLoaded[m]);
    }

    requestAnimationFrame(drawingLoop);
}

var delayCount = 2;
var animationDelay = 0, numFrame = 0, numFrame2 = 0;
function drawingLoop() {
    device.clear();

    for (var i = 0; i < meshes.length; i++) {
        // meshes[i].Rotation.x += 0.01;
        meshes[i].Rotation.y += 0.01;
        // meshes[i].Rotation.z += 0.01;
    }

    document.getElementById("debug").textContent = "X: " + meshes[0].Rotation.x;

    device.render(camera, meshes);
    device.present();

    animationDelay++;
    if (animationDelay > delayCount) {
        animationDelay = 0;

        numFrame = (numFrame + 1) % meshes[0].framesCount;
        meshes[0].setFrame(numFrame);

        numFrame2 = (numFrame2 + 1) % 9;
        meshes[1].setFrame(numFrame2);
    }

    requestAnimationFrame(drawingLoop);
}
