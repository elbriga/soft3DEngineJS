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

    camera.Position = new BABYLON.Vector3(0, 0, 200);
    camera.Target   = new BABYLON.Vector3(0, 0, 0);

    //device.LoadJSONFileAsync("monkey.babylon", loadJSONCompleted);
    var mdl = new QuakeMDL("data/models/enforcer.mdl");
    mdl.mesh.Rotation.x = 3.14 + (3.14 / 2);
    meshes.push(mdl.mesh);

    requestAnimationFrame(drawingLoop);
}

function loadJSONCompleted(meshesLoaded) {
    meshes = meshesLoaded;

    requestAnimationFrame(drawingLoop);
}

var delayCount = 2;
var animationDelay = 0, numFrame = 0;
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

        numFrame++;
        if (numFrame >= meshes[0].framesCount)
            numFrame = 0;

        meshes[0].setFrame(numFrame);
    }

    requestAnimationFrame(drawingLoop);
}
