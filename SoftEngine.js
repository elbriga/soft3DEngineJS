var backfaceCullingON = false;
var SoftEngine;
(function (SoftEngine) {
    var Vertex = (function () {
        function Vertex(coords, normal, texcoords) {
            this.Coordinates        = coords    || BABYLON.Vector3.Zero();
            this.Normal             = normal    || BABYLON.Vector3.Zero();
            this.TextureCoordinates = texcoords || BABYLON.Vector3.Zero();
        }
        Vertex.Copy = function (otherVertex) {
            return new Vertex(
                BABYLON.Vector3.Copy(otherVertex.Coordinates),
                BABYLON.Vector3.Copy(otherVertex.Normal),
                BABYLON.Vector3.Copy(otherVertex.TextureCoordinates));
        };
        return Vertex;
    })();
    SoftEngine.Vertex = Vertex;

    var Camera = (function () {
        function Camera() {
            this.Position = BABYLON.Vector3.Zero();
            this.Target = BABYLON.Vector3.Zero();
        }
        return Camera;
    })();
    SoftEngine.Camera = Camera;

    var Mesh = (function () {
        function Mesh(name, verticesCount, facesCount, framesCount, skinWidth) {
            this.name = name;
            this.frame = 0; // Current frame
            this.anim = 0;  // Current anim
            this.verticesCount = verticesCount;
            this.framesCount = framesCount || 1;
            this.Vertices = new Array(this.verticesCount * this.framesCount);
            this.Faces = new Array(facesCount);
            this.FrameNames = new Array(this.framesCount);
            this.FrameAnims = [];
            this.Rotation = new BABYLON.Vector3(0, 0, 0);
            this.Position = new BABYLON.Vector3(0, 0, 0);
            this.meiaSkinW = ((skinWidth || 512) / 2);
        }
        Mesh.prototype.getNameAnim = function () {
            return this.FrameAnims[this.anim].nome;
        }
        Mesh.prototype.setAnim = function (numAnim) {
            this.anim = numAnim % this.FrameAnims.length;
            this.frame = this.FrameAnims[this.anim].frameInicial;
            this.computeFacesNormals();
        }
        Mesh.prototype.incFrame = function () {
            this.frame++;
            if (this.frame > this.FrameAnims[this.anim].frameFinal) {
                this.frame = this.FrameAnims[this.anim].frameInicial;
            }
            this.computeFacesNormals();
        };
        Mesh.prototype.scale = function (scale) {
            for (var v=0; v < this.verticesCount * this.framesCount; v++) {
                this.Vertices[v].Coordinates = this.Vertices[v].Coordinates.scale(scale);
            }
        }
        Mesh.prototype.parseFramesNames = function () {
            var basenome = "", novonome, frameInicial, frameFinal, totAnims = 0;
            for (var nf=0; nf<this.FrameNames.length; nf++) {
                var nomeFrame = this.FrameNames[nf];

                if (basenome == "") {
                    // Achar a base do nome do frame, sem o numero
                    for (var n=0; n<16; n++) {
                        if (nomeFrame.charAt(n) >= '0' && nomeFrame.charAt(n) <= '9') {
                            basenome = nomeFrame.substring(0, n);
                            break;
                        }
                    }
        
                    frameInicial = nf;
                    totAnims++;
                } else {
                    novonome = nomeFrame;
                    for (var n=0; n<16; n++) {
                        if (nomeFrame.charAt(n) >= '0' && nomeFrame.charAt(n) <= '9') {
                            novonome = nomeFrame.substring(0, n);
                            break;
                        }
                    }

                    if (novonome == basenome) {
                        // Ainda estamos no mesmo basenome
                        frameFinal = nf;
                    } else {
                        this.FrameAnims.push({
                            nome: basenome,
                            frameInicial: frameInicial,
                            frameFinal: frameFinal
                        });
                        basenome = ""; // proximo
                        nf--;
                    }
                }
            }
            this.FrameAnims.push({
                nome: basenome,
                frameInicial: frameInicial,
                frameFinal: frameFinal
            });
        }
        Mesh.prototype.computeFacesNormals = function () {
            if (!backfaceCullingON)
                return;

            var vertexOffset = this.frame * this.verticesCount;
            for (var indexFaces = 0; indexFaces < this.Faces.length; indexFaces++) {
                var currentFace = this.Faces[indexFaces];

                var vertexA = this.Vertices[currentFace.A + vertexOffset];
                var vertexB = this.Vertices[currentFace.B + vertexOffset];
                var vertexC = this.Vertices[currentFace.C + vertexOffset];

                currentFace.Normal = (vertexA.Normal.add(vertexB.Normal.add(vertexC.Normal))).scale(1 / 3);
                // this.Faces[indexFaces].Normal.normalize();
            }
        };
        return Mesh;
    })();
    SoftEngine.Mesh = Mesh;

    var Texture = (function () {
        function Texture(filename, width, height) {
            this.width = width;
            this.height = height;

            if (filename.substring(filename.length - 4) == '.png') {
                this.load("data/textures/" + filename);
            }
        }
        Texture.prototype.set = function (bitmap) {
            this.internalBuffer = {};
            this.internalBuffer.data = [];

            for(y=0; y<this.height; y++) {
                for(x=0; x<this.width; x++) {
                    var offset3 = (x + y * this.width) * 3;
                    var offset4 = (x + y * this.width) * 4;

                    this.internalBuffer.data[offset4 + 0] = bitmap[offset3 + 0];
                    this.internalBuffer.data[offset4 + 1] = bitmap[offset3 + 1];
                    this.internalBuffer.data[offset4 + 2] = bitmap[offset3 + 2];
                    this.internalBuffer.data[offset4 + 3] = 255.0;
                }
            }
        }
        Texture.prototype.load = function (filename) {
            var _this = this;
            var imageTexture = new Image();
            imageTexture.height = this.height;
            imageTexture.width = this.width;
            imageTexture.onload = function () {
                var internalCanvas = document.createElement("canvas");
                internalCanvas.width = _this.width;
                internalCanvas.height = _this.height;
                var internalContext = internalCanvas.getContext("2d");
                internalContext.drawImage(imageTexture, 0, 0);
                _this.internalBuffer = internalContext.getImageData(0, 0, _this.width, _this.height);
            };
            imageTexture.src = filename;
        };

        Texture.prototype.map = function (tu, tv) {
            if (this.internalBuffer) {
                var u, v;
                if (tu < 1.0) {
                    u = Math.abs(((tu * this.width ) % this.width )) >> 0;
                    v = Math.abs(((tv * this.height) % this.height)) >> 0;
                } else {
                    u = Math.abs(((tu) % this.width )) >> 0;
                    v = Math.abs(((tv) % this.height)) >> 0;
                }

                var pos = (u + v * this.width) * 4;

                var r = this.internalBuffer.data[pos];
                var g = this.internalBuffer.data[pos + 1];
                var b = this.internalBuffer.data[pos + 2];
                var a = this.internalBuffer.data[pos + 3];

                return new BABYLON.Color4(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
            } else {
                return new BABYLON.Color4(1, 1, 1, 1);
            }
        };
        return Texture;
    })();
    SoftEngine.Texture = Texture;

    var Device = (function () {
        function Device(canvas) {
            this.workingCanvas = canvas;
            this.workingWidth = canvas.width;
            this.workingHeight = canvas.height;
            this.workingContext = this.workingCanvas.getContext("2d");
            this.depthbuffer = new Array(this.workingWidth * this.workingHeight);
        }
        Device.prototype.clear = function () {
            this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);

            this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);

            for (var i = 0; i < this.depthbuffer.length; i++) {
                this.depthbuffer[i] = 10000000;
            }
        };

        Device.prototype.putPixel = function (x, y, z, color) {
            this.backbufferdata = this.backbuffer.data;

            var index = ((x >> 0) + (y >> 0) * this.workingWidth);
            var index4 = index * 4;

            if (this.depthbuffer[index] < z) {
                return;
            }

            this.depthbuffer[index] = z;

            this.backbufferdata[index4] = color.r * 255;
            this.backbufferdata[index4 + 1] = color.g * 255;
            this.backbufferdata[index4 + 2] = color.b * 255;
            this.backbufferdata[index4 + 3] = color.a * 255;
        };

        Device.prototype.drawPoint = function (point, color) {
            if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight) {
                this.putPixel(point.x, point.y, point.z, color);
            }
        };

        Device.prototype.present = function () {
            this.workingContext.putImageData(this.backbuffer, 0, 0);
        };

        Device.prototype.clamp = function (value, min, max) {
            if (typeof min === "undefined") { min = 0; }
            if (typeof max === "undefined") { max = 1; }
            return Math.max(min, Math.min(value, max));
        };

        Device.prototype.interpolate = function (min, max, gradient) {
            return min + (max - min) * this.clamp(gradient);
        };

        Device.prototype.project = function (vertex, transMat, world) {
            var point2d = BABYLON.Vector3.TransformCoordinates(vertex.Coordinates, transMat);

            var point3DWorld = BABYLON.Vector3.TransformCoordinates(vertex.Coordinates, world);
            var normal3DWorld = BABYLON.Vector3.TransformCoordinates(vertex.Normal, world);

            var x = point2d.x * this.workingWidth + this.workingWidth / 2.0;
            var y = -point2d.y * this.workingHeight + this.workingHeight / 2.0;

            return ({
                Coordinates: new BABYLON.Vector3(x, y, point2d.z),
                Normal: normal3DWorld,
                WorldCoordinates: point3DWorld,
                TextureCoordinates: vertex.TextureCoordinates
            });
        };

        Device.prototype.computeNDotL = function (vertex, normal, lightPosition) {
            var lightDirection = lightPosition.subtract(vertex);

            normal.normalize();
            lightDirection.normalize();

            return Math.max(0, BABYLON.Vector3.Dot(normal, lightDirection));
        };

        Device.prototype.processScanLine = function (data, va, vb, vc, vd, color, texture) {
            var pa = va.Coordinates;
            var pb = vb.Coordinates;
            var pc = vc.Coordinates;
            var pd = vd.Coordinates;

            var gradient1 = pa.y != pb.y ? (data.currentY - pa.y) / (pb.y - pa.y) : 1;
            var gradient2 = pc.y != pd.y ? (data.currentY - pc.y) / (pd.y - pc.y) : 1;

            var sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
            var ex = this.interpolate(pc.x, pd.x, gradient2) >> 0;

            var z1 = this.interpolate(pa.z, pb.z, gradient1);
            var z2 = this.interpolate(pc.z, pd.z, gradient2);

            var snl = this.interpolate(data.ndotla, data.ndotlb, gradient1);
            var enl = this.interpolate(data.ndotlc, data.ndotld, gradient2);

            var su = this.interpolate(data.ua, data.ub, gradient1);
            var eu = this.interpolate(data.uc, data.ud, gradient2);

            var sv = this.interpolate(data.va, data.vb, gradient1);
            var ev = this.interpolate(data.vc, data.vd, gradient2);

            for (var x = sx; x < ex; x++) {
                var gradient = (x - sx) / (ex - sx);

                var z = this.interpolate(z1, z2, gradient);
                var ndotl = this.interpolate(snl, enl, gradient);

                var u = this.interpolate(su, eu, gradient);
                var v = this.interpolate(sv, ev, gradient);

                var textureColor = texture ?
                    texture.map(u, v) :
                    new BABYLON.Color4(1, 1, 1, 1);

                this.drawPoint(new BABYLON.Vector3(x, data.currentY, z),
                    new BABYLON.Color4(color.r * ndotl * textureColor.r, color.g * ndotl * textureColor.g, color.b * ndotl * textureColor.b, 1));
            }
        };

        Device.prototype.drawTriangle = function (v1, v2, v3, color, texture, lightPos) {
            if (v1.Coordinates.y > v2.Coordinates.y) {
                var temp = v2;
                v2 = v1;
                v1 = temp;
            }

            if (v2.Coordinates.y > v3.Coordinates.y) {
                var temp = v2;
                v2 = v3;
                v3 = temp;
            }

            if (v1.Coordinates.y > v2.Coordinates.y) {
                var temp = v2;
                v2 = v1;
                v1 = temp;
            }

            var p1 = v1.Coordinates;
            var p2 = v2.Coordinates;
            var p3 = v3.Coordinates;

            var nl1 = lightPos ? this.computeNDotL(v1.WorldCoordinates, v1.Normal, lightPos) : 1;
            var nl2 = lightPos ? this.computeNDotL(v2.WorldCoordinates, v2.Normal, lightPos) : 1;
            var nl3 = lightPos ? this.computeNDotL(v3.WorldCoordinates, v3.Normal, lightPos) : 1;

            var data = {};

            var dP1P2;
            var dP1P3;

            if (p2.y - p1.y > 0)
                dP1P2 = (p2.x - p1.x) / (p2.y - p1.y); else
                dP1P2 = 0;

            if (p3.y - p1.y > 0)
                dP1P3 = (p3.x - p1.x) / (p3.y - p1.y); else
                dP1P3 = 0;

            if (dP1P2 > dP1P3) {
                for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
                    data.currentY = y;

                    if (y < p2.y) {
                        data.ndotla = nl1;
                        data.ndotlb = nl3;
                        data.ndotlc = nl1;
                        data.ndotld = nl2;

                        data.ua = v1.TextureCoordinates.x;
                        data.ub = v3.TextureCoordinates.x;
                        data.uc = v1.TextureCoordinates.x;
                        data.ud = v2.TextureCoordinates.x;

                        data.va = v1.TextureCoordinates.y;
                        data.vb = v3.TextureCoordinates.y;
                        data.vc = v1.TextureCoordinates.y;
                        data.vd = v2.TextureCoordinates.y;

                        this.processScanLine(data, v1, v3, v1, v2, color, texture);
                    } else {
                        data.ndotla = nl1;
                        data.ndotlb = nl3;
                        data.ndotlc = nl2;
                        data.ndotld = nl3;

                        data.ua = v1.TextureCoordinates.x;
                        data.ub = v3.TextureCoordinates.x;
                        data.uc = v2.TextureCoordinates.x;
                        data.ud = v3.TextureCoordinates.x;

                        data.va = v1.TextureCoordinates.y;
                        data.vb = v3.TextureCoordinates.y;
                        data.vc = v2.TextureCoordinates.y;
                        data.vd = v3.TextureCoordinates.y;

                        this.processScanLine(data, v1, v3, v2, v3, color, texture);
                    }
                }
            } else {
                for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
                    data.currentY = y;

                    if (y < p2.y) {
                        data.ndotla = nl1;
                        data.ndotlb = nl2;
                        data.ndotlc = nl1;
                        data.ndotld = nl3;

                        data.ua = v1.TextureCoordinates.x;
                        data.ub = v2.TextureCoordinates.x;
                        data.uc = v1.TextureCoordinates.x;
                        data.ud = v3.TextureCoordinates.x;

                        data.va = v1.TextureCoordinates.y;
                        data.vb = v2.TextureCoordinates.y;
                        data.vc = v1.TextureCoordinates.y;
                        data.vd = v3.TextureCoordinates.y;

                        this.processScanLine(data, v1, v2, v1, v3, color, texture);
                    } else {
                        data.ndotla = nl2;
                        data.ndotlb = nl3;
                        data.ndotlc = nl1;
                        data.ndotld = nl3;

                        data.ua = v2.TextureCoordinates.x;
                        data.ub = v3.TextureCoordinates.x;
                        data.uc = v1.TextureCoordinates.x;
                        data.ud = v3.TextureCoordinates.x;

                        data.va = v2.TextureCoordinates.y;
                        data.vb = v3.TextureCoordinates.y;
                        data.vc = v1.TextureCoordinates.y;
                        data.vd = v3.TextureCoordinates.y;

                        this.processScanLine(data, v2, v3, v1, v3, color, texture);
                    }
                }
            }
        };

        Device.prototype.render = function (camera, meshes, lightPos) {
            var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
            var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, this.workingWidth / this.workingHeight, 0.01, 1.0);

            for (var index = 0; index < meshes.length; index++) {
                var cMesh = meshes[index];

                var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(cMesh.Rotation.y, cMesh.Rotation.x, cMesh.Rotation.z).multiply(BABYLON.Matrix.Translation(cMesh.Position.x, cMesh.Position.y, cMesh.Position.z));

                var worldView = worldMatrix.multiply(viewMatrix);
                var transformMatrix = worldView.multiply(projectionMatrix);

                var vertexOffset = cMesh.frame * cMesh.verticesCount;
                for (var indexFaces = 0; indexFaces < cMesh.Faces.length; indexFaces++) {
                    var currentFace = cMesh.Faces[indexFaces];

                    var transformedNormalZ = backfaceCullingON ?
                        BABYLON.Vector3.TransformNormal(currentFace.Normal, worldView).z :
                        -1;

                    if (transformedNormalZ < 0) {
                        var vertexA = Vertex.Copy(cMesh.Vertices[currentFace.A + vertexOffset]);
                        var vertexB = Vertex.Copy(cMesh.Vertices[currentFace.B + vertexOffset]);
                        var vertexC = Vertex.Copy(cMesh.Vertices[currentFace.C + vertexOffset]);

                        if (!currentFace.isFront) {
                            if (vertexA.TextureCoordinates.z) vertexA.TextureCoordinates.x += cMesh.meiaSkinW;
                            if (vertexB.TextureCoordinates.z) vertexB.TextureCoordinates.x += cMesh.meiaSkinW;
                            if (vertexC.TextureCoordinates.z) vertexC.TextureCoordinates.x += cMesh.meiaSkinW;
                        }

                        var pixelA = this.project(vertexA, transformMatrix, worldMatrix);
                        var pixelB = this.project(vertexB, transformMatrix, worldMatrix);
                        var pixelC = this.project(vertexC, transformMatrix, worldMatrix);

                        var color = 1.0;
                        this.drawTriangle(pixelA, pixelB, pixelC, new BABYLON.Color4(color, color, color, 1), cMesh.Texture, lightPos);
                    }
                }
            }
        };

        Device.prototype.LoadJSONFileAsync = function (fileName, callback) {
            var jsonObject = {};
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", fileName, true);
            var that = this;
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    jsonObject = JSON.parse(xmlhttp.responseText);
                    callback(that.CreateMeshesFromJSON(jsonObject));
                }
            };
            xmlhttp.send(null);
        };

        Device.prototype.CreateMeshesFromJSON = function (jsonObject) {
            var meshes = [];
            var materials = [];

            for (var materialIndex = 0; materialIndex < jsonObject.materials.length; materialIndex++) {
                var material = {};

                material.Name = jsonObject.materials[materialIndex].name;
                material.ID = jsonObject.materials[materialIndex].id;
                if (jsonObject.materials[materialIndex].diffuseTexture)
                    material.DiffuseTextureName = jsonObject.materials[materialIndex].diffuseTexture.name;

                materials[material.ID] = material;
            }

            for (var meshIndex = 0; meshIndex < jsonObject.meshes.length; meshIndex++) {
                var verticesArray = jsonObject.meshes[meshIndex].vertices;

                var indicesArray = jsonObject.meshes[meshIndex].indices;

                var uvCount = jsonObject.meshes[meshIndex].uvCount;
                var verticesStep = 1;

                switch (uvCount) {
                    case 0:
                        verticesStep = 6;
                        break;
                    case 1:
                        verticesStep = 8;
                        break;
                    case 2:
                        verticesStep = 10;
                        break;
                }

                var verticesCount = verticesArray.length / verticesStep;

                var facesCount = indicesArray.length / 3;
                var mesh = new SoftEngine.Mesh(jsonObject.meshes[meshIndex].name, verticesCount, facesCount);

                for (var index = 0; index < verticesCount; index++) {
                    var x = verticesArray[index * verticesStep];
                    var y = verticesArray[index * verticesStep + 1];
                    var z = verticesArray[index * verticesStep + 2];

                    var nx = verticesArray[index * verticesStep + 3];
                    var ny = verticesArray[index * verticesStep + 4];
                    var nz = verticesArray[index * verticesStep + 5];

                    mesh.Vertices[index] = {
                        Coordinates: new BABYLON.Vector3(x, y, z),
                        Normal: new BABYLON.Vector3(nx, ny, nz)
                    };

                    if (uvCount > 0) {
                        var u = verticesArray[index * verticesStep + 6];
                        var v = verticesArray[index * verticesStep + 7];
                        mesh.Vertices[index].TextureCoordinates = new BABYLON.Vector2(u, v);
                    } else {
                        mesh.Vertices[index].TextureCoordinates = new BABYLON.Vector2(0, 0);
                    }
                }

                for (var index = 0; index < facesCount; index++) {
                    var a = indicesArray[index * 3];
                    var b = indicesArray[index * 3 + 1];
                    var c = indicesArray[index * 3 + 2];
                    mesh.Faces[index] = {
                        A: a,
                        B: b,
                        C: c
                    };
                }

                var position = jsonObject.meshes[meshIndex].position;
                mesh.Position = new BABYLON.Vector3(position[0], position[1], position[2]);

                if (uvCount > 0) {
                    var meshTextureID = jsonObject.meshes[meshIndex].materialId;
                    var meshTextureName = materials[meshTextureID].DiffuseTextureName;
                    mesh.Texture = new Texture(meshTextureName, 512, 512);
                }

                mesh.computeFacesNormals();

                meshes.push(mesh);
            }
            return meshes;
        };
        return Device;
    })();
    SoftEngine.Device = Device;
})(SoftEngine || (SoftEngine = {}));
