// Setting up 4 essential elements needed for Babylon.js
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
const camera = new BABYLON.ArcRotateCamera(
  "Camera",
  -Math.PI / 2,
  Math.PI / 2,
  5,
  BABYLON.Vector3.Zero(),
  scene
);
camera.attachControl(canvas, true);

// Custom Coloring
scene.clearColor = new BABYLON.Color4(0.5, 0.7, 0.5, 0.8);

// Adding a light
const light = new BABYLON.HemisphericLight(
  "light",
  new BABYLON.Vector3(0, 1, 0),
  scene
);
light.intensity = 0.8;

let drawingMode = false;
let currentShape = [];
let points = [];

let extrudedObject = null;

let movingMode = false;
let selectedMesh = null;
let startingPoint = null;
let highlightLayer = new BABYLON.HighlightLayer("highlightLayer", scene);

// Creating Base Plane
const ground = BABYLON.MeshBuilder.CreateGround(
  "ground",
  { width: 5, height: 5 },
  scene
);
ground.position.y = -1;
const groundMaterial = new BABYLON.StandardMaterial("Ground Material", scene);
groundMaterial.diffuseColor = BABYLON.Color3.Black();
ground.material = groundMaterial;

// Function to highlight the selected mesh
function highlightSelectedMesh() {
  highlightLayer.removeAllMeshes();
  if (selectedMesh) {
    highlightLayer.addMesh(selectedMesh, BABYLON.Color3.Green());
  }
}

// Function to highlight the extruded object
function highlightExtrudedObject() {
  highlightLayer.removeAllMeshes();
  if (extrudedObject) {
    highlightLayer.addMesh(extrudedObject, BABYLON.Color3.Blue());
  }
}

// Function to clear highlights
function clearHighlights() {
  highlightLayer.removeAllMeshes();
}

// Adding Button Styling for Active Mode
function updateUI(mode) {
  // Reset button colors
  drawButton.style.backgroundColor = "";
  extrudeButton.style.backgroundColor = "";
  moveButton.style.backgroundColor = "";
  deleteButton.style.backgroundColor = "";

  if (mode) {
    document.getElementById(
      mode.toLowerCase() + "Button"
    ).style.backgroundColor = "Blue";
  }
}

// Function to enter draw mode
function enterDrawMode() {
  drawingMode = !drawingMode;
  if (drawingMode) {
    updateUI("Draw");
    camera.detachControl(canvas);
  } else {
    updateUI("");
    camera.attachControl(canvas, true);
  }
  clearHighlights();
}

// Function to draw points in draw mode
function drawPoint(evt) {
  if (!drawingMode) return;
  console.log("Drawing point");
  const pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
    return mesh === ground;
  });
  const point = pickInfo.pickedPoint;
  if (point) {
    const drawnPoint = BABYLON.MeshBuilder.CreateSphere(
      "drawnPoint",
      { diameter: 0.2 },
      scene
    );
    drawnPoint.position = point.clone();
    drawnPoint.material = new BABYLON.StandardMaterial("drawnPointMat", scene);
    drawnPoint.material.diffuseColor = BABYLON.Color3.Red();
    drawnPoint.isPickable = false;
    points.push(drawnPoint);
    currentShape.push(point.clone());
  }
}

// Function to extrude shapes
function extrudeShape() {
  console.log("Extruding shape");
  if (currentShape.length >= 3) {
    extrudedObject = BABYLON.MeshBuilder.ExtrudePolygon(
      "extruded",
      { shape: currentShape, depth: 1 },
      scene
    );

    // Create a new material with the desired color
    const extrudedMaterial = new BABYLON.StandardMaterial(
      "extrudedMaterial",
      scene
    );
    extrudedMaterial.diffuseColor = new BABYLON.Color3.Red();

    extrudedObject.material = extrudedMaterial;

    // Move the extruded shape above the ground plane
    const groundHeight = ground.position.y;
    extrudedObject.position.y = groundHeight + 1;

    currentShape = [];
    points.forEach(function (point) {
      point.dispose();
    });
    points = [];

    // Exit drawing mode
    enterDrawMode();
  } else {
    alert("Please draw a closed shape with at least 3 points.");
  }
}

// Function to enter move mode
function enterMoveMode() {
  movingMode = !movingMode;
  if (movingMode) {
    updateUI("Move");
    camera.detachControl(canvas);
  } else {
    updateUI("");
    camera.attachControl(canvas, true);
    clearHighlights();
  }
  selectedMesh = null;
}

// Function to move the selected object
function moveObject(evt) {
  const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
  if (pickInfo.hit && selectedMesh) {
    const currentPoint = pickInfo.pickedPoint;
    if (currentPoint) {
      const delta = currentPoint.subtract(startingPoint);
      selectedMesh.position.addInPlace(delta);
      startingPoint = currentPoint;
    }
  }
}

// Function to select a mesh for moving
function selectMesh(evt) {
  const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
  if (pickInfo.hit && pickInfo.pickedMesh !== ground) {
    selectedMesh = pickInfo.pickedMesh;
    startingPoint = pickInfo.pickedPoint;
    highlightSelectedMesh();
  }
}

// Function to handle pointer down events
function onPointerDown(evt) {
  // Right click
  if (evt.button === 2) {
    extrudeShape();
    return;
  }
  // Left click
  if (movingMode && evt.button === 0) {
    selectMesh(evt);
  }
}

// Function to handle pointer move events
function onPointerMove(evt) {
  // Draw mode selection
  if (evt.buttons === 1 && drawingMode) {
    drawPoint(evt);
  }
  // Move mode selection
  if (movingMode && evt.buttons === 1 && selectedMesh) {
    moveObject(evt);
  }
}

// Function to delete the selected object
function deleteSelectedMesh() {
  if (selectedMesh) {
    selectedMesh.dispose();
    selectedMesh = null;
    clearHighlights();
  } else {
    alert("No mesh selected to delete.");
  }
}

// Listeners for changes
canvas.addEventListener("mousedown", onPointerDown, false);
canvas.addEventListener("mousemove", onPointerMove, false);

const drawButton = document.getElementById("drawButton");
drawButton.addEventListener("click", enterDrawMode);

const extrudeButton = document.getElementById("extrudeButton");
extrudeButton.addEventListener("click", extrudeShape);

const moveButton = document.getElementById("moveButton");
moveButton.addEventListener("click", enterMoveMode);

const deleteButton = document.getElementById("deleteButton");
deleteButton.addEventListener("click", deleteSelectedMesh);

// Render loop (from Babylon.js playground)
engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});

// const canvas = document.getElementById("renderCanvas");
// const engine = new BABYLON.Engine(canvas, true);
// const scene = new BABYLON.Scene(engine);
// const camera = new BABYLON.ArcRotateCamera(
//   "Camera",
//   -Math.PI / 2,
//   Math.PI / 2,
//   5,
//   BABYLON.Vector3.Zero(),
//   scene
// );
// camera.attachControl(canvas, true);
// scene.clearColor = new BABYLON.Color4(0.5, 0.7, 0.5, 0.8);

// // Add a light
// const light = new BABYLON.HemisphericLight(
//   "light",
//   new BABYLON.Vector3(0, 1, 0),
//   scene
// );
// light.intensity = 0.8;

// // Variables for drawing mode
// let drawingMode = false;
// let currentShape = [];
// let points = [];

// // Variables for extrusion mode
// let extrudedObject = null;

// // Variables for move mode
// let movingMode = false;
// let selectedMesh = null;
// let startingPoint = null;
// let highlightLayer = new BABYLON.HighlightLayer("highlightLayer", scene);

// // Variables for vertex edit mode
// let vertexEditMode = false;
// let selectedVertex = null;

// // Create ground plane
// // Create ground plane
// const ground = BABYLON.MeshBuilder.CreateGround(
//   "ground",
//   { width: 5, height: 5},
//   scene
// );
// ground.position.y = -1; // Move the ground slightly below the camera's view
// const groundMaterial = new BABYLON.StandardMaterial("Ground Material", scene);
// groundMaterial.diffuseColor = BABYLON.Color3.Black();
// ground.material = groundMaterial;

// // Function to highlight the selected mesh
// function highlightSelectedMesh() {
//   highlightLayer.removeAllMeshes();
//   if (selectedMesh) {
//     highlightLayer.addMesh(selectedMesh, BABYLON.Color3.Green());
//   }
// }

// // Function to highlight the extruded object in vertex edit mode
// function highlightExtrudedObject() {
//   highlightLayer.removeAllMeshes();
//   if (extrudedObject) {
//     highlightLayer.addMesh(extrudedObject, BABYLON.Color3.Green());
//   }
// }

// // Function to clear highlights
// function clearHighlights() {
//   highlightLayer.removeAllMeshes();
// }

// // Function to update UI elements based on mode
// function updateUI(mode) {
//   // Reset button colors
//   drawButton.style.backgroundColor = "";
//   extrudeButton.style.backgroundColor = "";
//   moveButton.style.backgroundColor = "";
//   vertexEditButton.style.backgroundColor = "";

//   // Highlight selected button
//   if (mode) {
//     document.getElementById(
//       mode.toLowerCase() + "Button"
//     ).style.backgroundColor = "Blue";
//   }
// }

// // Function to enter draw mode
// function enterDrawMode() {
//   drawingMode = !drawingMode; // Toggle draw mode
//   if (drawingMode) {
//     updateUI("Draw");
//     camera.detachControl(canvas);
//   } else {
//     updateUI("");
//     camera.attachControl(canvas, true);
//   }
//   clearHighlights();
// }

// // Function to draw points while in draw mode
// function drawPoint(evt) {
//   if (!drawingMode) return;
//   console.log("Drawing point");
//   const pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
//     // Filter only objects on the ground plane
//     return mesh === ground;
//   });
//   const point = pickInfo.pickedPoint;
//   if (point) {
//     const drawnPoint = BABYLON.MeshBuilder.CreateSphere(
//       "drawnPoint",
//       { diameter: 0.2 },
//       scene
//     );
//     drawnPoint.position = point.clone();
//     drawnPoint.material = new BABYLON.StandardMaterial("drawnPointMat", scene);
//     drawnPoint.material.diffuseColor = BABYLON.Color3.Red();
//     drawnPoint.isPickable = false; // Ensure the drawn point is not pickable
//     points.push(drawnPoint);
//     currentShape.push(point.clone());
//   }
// }

// // Function to extrude shapes
// function extrudeShape() {
//   console.log("Extruding shape");
//   if (currentShape.length >= 3) {
//     // Extrude the shape
//     extrudedObject = BABYLON.MeshBuilder.ExtrudePolygon(
//       "extruded",
//       { shape: currentShape, depth: 1 },
//       scene
//     );

//     // Create a new material with the desired color
//     const extrudedMaterial = new BABYLON.StandardMaterial(
//       "extrudedMaterial",
//       scene
//     );
//     extrudedMaterial.diffuseColor = new BABYLON.Color3.Red(); // Change the color here (e.g., red)

//     // Apply the material to the extruded shape
//     extrudedObject.material = extrudedMaterial;

//     // Move the extruded shape above the ground plane
//     const groundHeight = ground.position.y;
//     extrudedObject.position.y = groundHeight + 1; // Adjust the height as needed

//     // Clear the currentShape and points arrays
//     currentShape = [];
//     points.forEach(function (point) {
//       point.dispose();
//     });
//     points = [];

//     // Exit drawing mode
//     enterDrawMode(); // Toggle off drawing mode
//   } else {
//     alert("Please draw a closed shape with at least 3 points.");
//   }
// }

// // Function to enter move mode
// function enterMoveMode() {
//   movingMode = !movingMode; // Toggle move mode
//   if (movingMode) {
//     updateUI("Move");
//     camera.detachControl(canvas);
//   } else {
//     updateUI("");
//     camera.attachControl(canvas, true);
//     clearHighlights();
//   }
//   selectedMesh = null;
// }

// // Function to move the selected object
// function moveObject(evt) {
//   const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
//   if (pickInfo.hit && selectedMesh) {
//     const currentPoint = pickInfo.pickedPoint;
//     if (currentPoint) {
//       const delta = currentPoint.subtract(startingPoint);
//       selectedMesh.position.addInPlace(delta);
//       startingPoint = currentPoint;
//     }
//   }
// }

// // Function to select a mesh for moving
// function selectMesh(evt) {
//   const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
//   if (pickInfo.hit && pickInfo.pickedMesh !== ground) {
//     selectedMesh = pickInfo.pickedMesh;
//     startingPoint = pickInfo.pickedPoint;
//     highlightSelectedMesh();
//   }
// }

// // Function to enter
// // Function to enter vertex edit mode
// function enterVertexEditMode() {
//   vertexEditMode = !vertexEditMode; // Toggle vertex edit mode
//   if (vertexEditMode) {
//     updateUI("VertexEdit");
//     highlightExtrudedObject(); // Highlight extruded object in vertex edit mode
//     camera.detachControl(canvas); // Detach camera controls
//     scene.onPointerObservable.add(selectOrMoveVertex); // Add vertex selection/movement observable
//   } else {
//     updateUI("");
//     clearHighlights(); // Clear any highlights
//     camera.attachControl(canvas, true); // Reattach camera controls
//     scene.onPointerObservable.clear(); // Clear pointer observables
//   }
// }

// // Function to handle vertex selection or movement
// function selectOrMoveVertex(eventData) {
//   if (eventData.event.button === 0 && !movingMode) {
//     // Left mouse button pressed and not in move mode
//     const pickInfo = eventData.pickInfo;
//     if (pickInfo.hit && pickInfo.pickedMesh === extrudedObject) {
//       if (!selectedVertex) {
//         // No vertex selected, select the nearest one
//         selectedVertex = getClosestVertex(pickInfo.pickedPoint);
//         if (selectedVertex) {
//           highlightLayer.addMesh(selectedVertex, BABYLON.Color3.Green());
//         }
//       } else {
//         // Vertex selected, move it
//         moveVertex(eventData.event);
//       }
//     }
//   }
// }

// // Function to move a selected vertex
// function moveVertex(evt) {
//   if (evt.buttons === 1 && selectedVertex) { // Check if left mouse button is pressed and a vertex is selected
//     const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
//     if (pickInfo.hit && pickInfo.pickedMesh === ground) { // Ensure picking is on the ground
//       selectedVertex.position.x = pickInfo.pickedPoint.x;
//       selectedVertex.position.z = pickInfo.pickedPoint.z;
//     }
//   }
// }

// // Function to get the closest vertex to a point
// function getClosestVertex(point) {
//   let closestVertex = null;
//   let minDistance = Number.MAX_VALUE;
//   for (let vertex of extrudedObject.getVerticesData(BABYLON.VertexBuffer.PositionKind)) {
//     const vertexPos = BABYLON.Vector3.FromArray(vertex);
//     const distance = BABYLON.Vector3.Distance(vertexPos, point);
//     if (distance < minDistance) {
//       minDistance = distance;
//       closestVertex = BABYLON.MeshBuilder.CreateSphere("selectedVertex", { diameter: 0.1 }, scene);
//       closestVertex.position.copyFrom(vertexPos);
//     }
//   }
//   return closestVertex;
// }

// // Function to handle pointer down events
// function onPointerDown(evt) {
//   if (evt.button === 2) {
//     // Check if it's the right mouse button (button 2)
//     extrudeShape(); // Trigger extrusion
//     return;
//   }

//   if (movingMode && evt.button === 0) {
//     // Check if in move mode and it's the left mouse button (button 0)
//     selectMesh(evt);
//   }
// }

// // Function to handle pointer move events
// function onPointerMove(evt) {
//   if (evt.buttons === 1 && drawingMode) {
//     // Check if the left mouse button is pressed and in draw mode
//     drawPoint(evt);
//   }

//   if (movingMode && evt.buttons === 1 && selectedMesh) {
//     // Check if in move mode, the left mouse button is pressed, and a mesh is selected
//     moveObject(evt);
//   }
// }

// // Add event listeners
// canvas.addEventListener("mousedown", onPointerDown, false);
// canvas.addEventListener("mousemove", onPointerMove, false);

// // UI elements and event handlers
// const drawButton = document.getElementById("drawButton");
// drawButton.addEventListener("click", enterDrawMode);

// const extrudeButton = document.getElementById("extrudeButton");
// extrudeButton.addEventListener("click", extrudeShape);

// const moveButton = document.getElementById("moveButton");
// moveButton.addEventListener("click", enterMoveMode);

// const vertexEditButton = document.getElementById("vertexEditButton");
// vertexEditButton.addEventListener("click", enterVertexEditMode);

// // Render loop
// engine.runRenderLoop(function () {
//   scene.render();
// });

// // Resize the engine on window resize
// window.addEventListener("resize", function () {
//   engine.resize();
// });
