// A-Frame initialization
console.log('A-Frame VR Scene Initialized');

// Wait for A-Frame to be ready
if (typeof AFRAME !== 'undefined') {
  initSolarSystem();
} else {
  window.addEventListener('load', function() {
    if (typeof AFRAME !== 'undefined') {
      initSolarSystem();
    }
  });
}

// Lock rotation component for top-down view and blackboard view
AFRAME.registerComponent('lock-rotation', {
  tick: function() {
    if (window.isTopDownView) {
      // Use stored Y rotation (180 for table-2, 0 for solar system table)
      const yRotation = window.topDownYRotation || 0;
      this.el.setAttribute('rotation', `-90 ${yRotation} 0`);
    } else if (window.isBlackboardView) {
      // Lock rotation for blackboard view (use stored rotation or default to looking at blackboard)
      const rotation = window.blackboardViewRotation || { x: 0, y: 0, z: 0 };
      this.el.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);
    }
  }
});

function initSolarSystem() {
  const scene = document.querySelector('a-scene');
  
  // Get all rings data
  function getAllRings() {
    const rings = document.querySelectorAll('[data-ring]');
    return Array.from(rings).map(ring => ({
      element: ring,
      radius: parseFloat(ring.getAttribute('data-ring-radius'))
    }));
  }
  
  // Calculate distance from point to ring (in XZ plane)
  function distanceToRing(point, ringRadius) {
    const distanceFromCenter = Math.sqrt(point.x * point.x + point.z * point.z);
    return Math.abs(distanceFromCenter - ringRadius);
  }
  
  // Get closest ring and snap position
  function getClosestRing(point, snapThreshold = 0.2) {
    const rings = getAllRings();
    let closestRing = null;
    let minDistance = Infinity;
    let snapPosition = null;
    
    rings.forEach(ring => {
      const distance = distanceToRing(point, ring.radius);
      if (distance < minDistance && distance < snapThreshold) {
        minDistance = distance;
        closestRing = ring;
        
        // Calculate angle on the ring
        const angle = Math.atan2(point.z, point.x);
        snapPosition = {
          x: Math.cos(angle) * ring.radius,
          y: point.y, // Keep the y position (table height)
          z: Math.sin(angle) * ring.radius
        };
      }
    });
    
    return { ring: closestRing, position: snapPosition, distance: minDistance };
  }
  
  // Global state
  let isOrbiting = false;
  let allPlanetsCorrect = false; // Track if all planets are correctly placed
  
  // Individual planet correctness tracking
  const planetCorrect = {
    'mercury': false,
    'venus': false,
    'earth': false,
    'mars': false,
    'jupiter': false,
    'saturn': false,
    'uranus': false,
    'neptune': false
  };
  
  // Proximity UI state
  let proximityUI = null;
  let isNearSolarSystem = false;
  let isNearTable2 = false;
  let isNearBlackboard = false;
  let currentTable = null; // Track which table we're near ('solar-system', 'table-2', or 'blackboard')
  const PROXIMITY_THRESHOLD = 5; // Distance threshold to show UI
  
  // ESC UI state
  let escUI = null;
  
  // Completion message UI state
  let completionMessageUI = null;
  let completionText = null;
  let completionMessageTimeout = null;
  
  // Camera view state
  let isTopDownView = false;
  let isBlackboardView = false;
  let topDownViewTableId = null; // Track which table we're viewing in top-down view
  let originalCameraPosition = null;
  let originalCameraRotation = null;
  
  // Drag and drop state
  let draggedPlanet = null;
  let draggedSphere = null;
  let planetOriginalPositions = new Map();
  let sphereOriginalPositions = new Map();
  let sphereInitialPositions = new Map(); // Never changes - stores very initial starting positions
  let sphereCorrectPlacements = {
    'pisces': false,
    'cancer': false,
    'libra': false,
    'sagittarius': false
  }; // Track which spheres are correctly placed
  let isDragging = false;
  let raycaster = null;
  let mouse = null;
  
  // Constellation game state
  let firstSelectedStar = null; // Track the first clicked star (null when none selected)
  let constellationConnections = new Set(); // Track all connections made (to prevent duplicates)
  const correctConnections = [
    ['dubhe', 'merak'], ['merak', 'phecda'], ['phecda', 'megrez'],
    ['megrez', 'dubhe'], ['megrez', 'alioth'], ['alioth', 'mizar'],
    ['mizar', 'alkaid']
  ];
  
  // Helper function to get solar system world position
  function getSolarSystemWorldPosition() {
    const solarSystem = document.querySelector('#solar-system');
    const table = document.querySelector('#table');
    const tablePos = table ? table.getAttribute('position') : { x: 0, y: 0.75, z: -15 };
    const solarSystemRelPos = solarSystem ? solarSystem.getAttribute('position') : { x: 0.5, y: 0.5, z: -3.5 };
    return {
      x: tablePos.x + solarSystemRelPos.x,
      y: tablePos.y + solarSystemRelPos.y,
      z: tablePos.z + solarSystemRelPos.z
    };
  }
  
  // Helper function to get table-2 world position (center of table top)
  function getTable2WorldPosition() {
    const table2 = document.querySelector('#table-2');
    if (!table2) return { x: 0.1, y: 1.0, z: -8.415 };
    
    const table2Pos = table2.getAttribute('position');
    const tableTop = table2.firstElementChild;
    const tableTopPos = tableTop ? tableTop.getAttribute('position') : { x: 0, y: 0.25, z: -3.5 };
    
    return {
      x: table2Pos.x + tableTopPos.x,
      y: table2Pos.y + tableTopPos.y,
      z: table2Pos.z + tableTopPos.z
    };
  }
  
  // Helper function to get blackboard world position (center of blackboard)
  function getBlackboardWorldPosition() {
    const blackboard = document.querySelector('#centaurus-board');
    if (!blackboard) return { x: 6.53, y: 2.5, z: -13.455 };
    
    const blackboardPos = blackboard.getAttribute('position');
    // The blackboard plane is at position 0 0 0 relative to the entity
    return {
      x: blackboardPos.x,
      y: blackboardPos.y,
      z: blackboardPos.z
    };
  }
  
  // Check if a sphere position is over any image on table-2
  // Returns the zodiac name if over an image, null otherwise
  function getImageAtPosition(spherePosition) {
    // Image positions relative to table-2 (from HTML)
    // Images are at: -1.5 (Pisces), -0.5 (Sagittarius), 0.5 (Cancer), 1.5 (Libra) on X axis
    // Z position: -3.500
    // Width: 0.4 * 2 (scale) = 0.8
    // Height: 0.306 * 2 (scale) = 0.612
    const images = [
      { x: -1.5, z: -3.500, width: 0.8, height: 0.612, zodiac: 'pisces' },
      { x: -0.5, z: -3.500, width: 0.8, height: 0.612, zodiac: 'sagittarius' },
      { x: 0.5, z: -3.500, width: 0.8, height: 0.612, zodiac: 'cancer' },
      { x: 1.5, z: -3.500, width: 0.8, height: 0.612, zodiac: 'libra' }
    ];
    
    // Check if sphere is within bounds of any image
    // Images are rotated -90 on X and 180 on Y, so they're flat
    // We check X and Z bounds (Y doesn't matter since images are flat)
    for (const image of images) {
      const halfWidth = image.width / 2;
      const halfHeight = image.height / 2;
      
      // Check if sphere is within image bounds
      if (spherePosition.x >= image.x - halfWidth &&
          spherePosition.x <= image.x + halfWidth &&
          spherePosition.z >= image.z - halfHeight &&
          spherePosition.z <= image.z + halfHeight) {
        return image.zodiac;
      }
    }
    
    return null;
  }
  
  // Check if all spheres are correctly placed
  function checkAllSpheresPlaced() {
    const allPlaced = Object.values(sphereCorrectPlacements).every(placed => placed === true);
    if (allPlaced) {
      console.log('All spheres are placed on the correct images');
      // Show completion message
      showCompletionMessage('Zodiac');
    }
    return allPlaced;
  }
  
  // Planet order data (correct radius for each planet - scaled for smaller table solar system)
  const planetOrder = {
    'mercury': 0.25,
    'venus': 0.35,
    'earth': 0.45,
    'mars': 0.55,
    'jupiter': 0.7,
    'saturn': 0.85,
    'uranus': 1,
    'neptune': 1.15
  };
  
  // Check if all planets are in correct order by checking their boolean flags
  function checkPlanetOrder() {
    // Check if all planet booleans are true
    const allPlanetsCorrectlyPlaced = Object.values(planetCorrect).every(correct => correct === true);
    
    // Need all 8 planets on their correct rings
    if (allPlanetsCorrectlyPlaced) {
      allPlanetsCorrect = true;
      // Start animation only when all planets are correctly placed
      if (!isOrbiting) {
        console.warn('complete');
        console.log('All planets correctly placed! Starting orbital animation...');
        console.log('DEBUG: All 8 planets are on their correct rings');
        startOrbitalAnimation();
        // Show completion message
        showCompletionMessage('Solar System');
      }
    } else {
      allPlanetsCorrect = false;
      // Stop animation if planets are moved incorrectly
      if (isOrbiting) {
        stopOrbitalAnimation();
      }
    }
  }
  
  // Orbital animation component
  AFRAME.registerComponent('orbit-animation', {
    schema: {
      radius: { type: 'number', default: 5 },
      speed: { type: 'number', default: 1 },
      angle: { type: 'number', default: 0 }
    },
    
    init: function() {
      this.time = 0;
      this.isActive = false;
    },
    
    play: function() {
      this.isActive = true;
    },
    
    pause: function() {
      this.isActive = false;
    },
    
    tick: function(time, timeDelta) {
      if (!this.isActive) return;
      
      // Store the planet's Y position (ring height) - only on first tick
      if (this.initialY === undefined) {
        const currentPos = this.el.getAttribute('position');
        this.initialY = currentPos.y;
      }
      
      this.time += timeDelta * 0.001;
      const angle = this.data.angle + (this.time * this.data.speed);
      const x = Math.cos(angle) * this.data.radius;
      const z = Math.sin(angle) * this.data.radius;
      
      // Position relative to solar-system entity (sun is at 0,0,0 relative to solar-system)
      // Keep Y at ring height
      this.el.setAttribute('position', { 
        x: x, // X relative to sun (0,0,0 in solar-system)
        y: this.initialY, // Keep planet at ring height
        z: z  // Z relative to sun (0,0,0 in solar-system)
      });
    }
  });
  
  // Start orbital animation
  function startOrbitalAnimation() {
    if (isOrbiting) return;
    
    isOrbiting = true;
    console.log('All planets in correct order! Starting orbital animation...');
    
    const planets = document.querySelectorAll('[data-planet]');
    const speeds = {
      'mercury': 0.5,
      'venus': 0.4,
      'earth': 0.3,
      'mars': 0.25,
      'jupiter': 0.15,
      'saturn': 0.12,
      'uranus': 0.1,
      'neptune': 0.08
    };
    
    planets.forEach((planet, index) => {
      const planetName = planet.getAttribute('data-planet');
      const radius = planetOrder[planetName];
      const speed = speeds[planetName] || 0.2;
      
      // Calculate initial angle from current position (relative to solar-system, sun is at 0,0,0)
      const pos = planet.getAttribute('position');
      const currentAngle = Math.atan2(pos.z, pos.x);
      
      // Remove any existing orbit animation first
      if (planet.components && planet.components['orbit-animation']) {
        planet.components['orbit-animation'].pause();
        planet.removeAttribute('orbit-animation');
      }
      
      // Add orbit animation component
      planet.setAttribute('orbit-animation', {
        radius: radius,
        speed: speed,
        angle: currentAngle
      });
      
      // Wait a bit for component to initialize, then start
      setTimeout(() => {
        if (planet.components && planet.components['orbit-animation']) {
          planet.components['orbit-animation'].play();
          console.log(`Started orbit animation for ${planetName}`);
        } else {
          console.warn(`Failed to start orbit animation for ${planetName}`);
        }
      }, 50);
    });
    
    // Visual feedback
    const scene = document.querySelector('a-scene');
    if (scene) {
      console.log('Orbital animation started for all planets!');
    }
  }
  
  // Stop orbital animation
  function stopOrbitalAnimation() {
    if (!isOrbiting) return;
    
    isOrbiting = false;
    console.log('Planets moved - stopping orbital animation');
    
    const planets = document.querySelectorAll('[data-planet]');
    planets.forEach(planet => {
      // Remove the orbit animation component completely
      if (planet.components && planet.components['orbit-animation']) {
        planet.components['orbit-animation'].pause();
        planet.removeAttribute('orbit-animation');
      }
    });
  }
  
  // Switch to top-down view
  function switchToTopDownView(tableId = 'table') {
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl) return;
    
    // Get table and its first child (the long rectangle/table top)
    const table = document.querySelector(`#${tableId}`);
    if (!table) return;
    
    const tableTop = table.firstElementChild;
    if (!tableTop) return;
    
    // Get the table top's world position
    const tableTopPos = tableTop.getAttribute('position');
    const tablePos = table.getAttribute('position');
    
    // Calculate world position (table position + table top relative position)
    const worldX = tablePos.x + tableTopPos.x;
    const worldZ = tablePos.z + tableTopPos.z;
    
    // Position camera: x and z from table top, y fixed at 2.750
    // Z position depends on which table
    let cameraZ = worldZ;
    if (tableId === 'table-2') {
      // For table-2, position camera above the table (same Z as table top center)
      cameraZ = worldZ;
    } else {
      // For solar system table, use fixed Z position
      cameraZ = -18.500;
    }
    
    const topDownPosition = {
      x: worldX,
      y: 2.750,
      z: cameraZ
    };
    
    // Rotate to look down (-90 degrees on X axis) - locked
    // For table-2, rotate -180 degrees on Y to face the correct direction (images are rotated 180)
    const yRotation = tableId === 'table-2' ? -180 : 0;
    const topDownRotation = {
      x: -90,
      y: yRotation,
      z: 0
    };
    
    // Store Y rotation for lock-rotation component
    window.topDownYRotation = yRotation;
    
    // Disable camera controls to prevent movement
    if (cameraEl.components && cameraEl.components['look-controls']) {
      cameraEl.components['look-controls'].enabled = false;
    }
    if (cameraEl.components && cameraEl.components['wasd-controls']) {
      cameraEl.components['wasd-controls'].enabled = false;
    }
    // Also disable via attributes
    cameraEl.setAttribute('look-controls', 'enabled', false);
    cameraEl.setAttribute('wasd-controls', 'enabled', false);
    
    // Animate camera to top-down position
    cameraEl.setAttribute('animation__position', {
      property: 'position',
      to: `${topDownPosition.x} ${topDownPosition.y} ${topDownPosition.z}`,
      dur: 500,
      easing: 'easeInOutCubic'
    });
    
    cameraEl.setAttribute('animation__rotation', {
      property: 'rotation',
      to: `${topDownRotation.x} ${topDownRotation.y} ${topDownRotation.z}`,
      dur: 500,
      easing: 'easeInOutCubic'
    });
    
    // Lock rotation after animation completes
    setTimeout(() => {
      cameraEl.setAttribute('rotation', `${topDownRotation.x} ${topDownRotation.y} ${topDownRotation.z}`);
    }, 500);
    
    // Add component to continuously lock rotation
    if (!cameraEl.hasAttribute('lock-rotation')) {
      cameraEl.setAttribute('lock-rotation', '');
    }
    
    // Hide proximity UI in top-down view
    if (proximityUI) {
      if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
        proximityUI.setAttribute('visible', 'false');
      } else {
        proximityUI.classList.add('hidden');
      }
    }
    
    // Show ESC UI in top-down view
    if (escUI) {
      if (escUI.tagName && escUI.tagName.toLowerCase() === 'a-entity') {
        escUI.setAttribute('visible', 'true');
      } else {
        escUI.classList.remove('hidden');
      }
    }
    
    // Hide completion message when switching views
    hideCompletionMessage();
    
    isTopDownView = true;
    topDownViewTableId = tableId; // Store which table we're viewing
    window.isTopDownView = true;
    console.log('Switched to top-down view for table:', tableId);
  }
  
  // Switch to blackboard view
  function switchToBlackboardView() {
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl) return;
    
    // Get blackboard position
    const blackboardPos = getBlackboardWorldPosition();
    
    // Position camera: x = 4, same y and z as blackboard
    const blackboardViewPosition = {
      x: 4, // Camera x position
      y: 2.5, // Same y as blackboard
      z: -13.455 // Same z as blackboard
    };
    
    // Get blackboard entity to calculate rotation immediately
    const blackboard = document.querySelector('#centaurus-board');
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    
    // Calculate rotation to look at blackboard BEFORE animating
    let blackboardViewRotation = { x: 0, y: 90, z: 0 }; // Default fallback
    
    if (blackboard && blackboard.object3D && THREE) {
      // Update the blackboard's world matrix to ensure it's current
      blackboard.object3D.updateMatrixWorld(true);
      
      // Calculate a point on the blackboard plane (offset in the blackboard's local space)
      // The blackboard plane is at (0, 0, 0) in local space
      // We'll look at a point slightly forward from the blackboard center in its local Z direction
      // Since blackboard is rotated -90 on Y, local Z points in negative X world direction
      const blackboardLocalPoint = new THREE.Vector3(0, 0, -1); // 1 unit forward in local Z (toward front of blackboard)
      const blackboardWorldPoint = blackboardLocalPoint.clone();
      blackboardWorldPoint.applyMatrix4(blackboard.object3D.matrixWorld);
      
      // Now calculate rotation to look at this point from camera position
      const cameraPos = new THREE.Vector3(blackboardViewPosition.x, blackboardViewPosition.y, blackboardViewPosition.z);
      const lookDirection = new THREE.Vector3().subVectors(blackboardWorldPoint, cameraPos).normalize();
      
      // Calculate rotation from camera's default forward (0, 0, -1) to look direction
      const cameraForward = new THREE.Vector3(0, 0, -1);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(cameraForward, lookDirection);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);
      
      // Convert to degrees
      blackboardViewRotation = {
        x: THREE.MathUtils.radToDeg(euler.x),
        y: THREE.MathUtils.radToDeg(euler.y),
        z: THREE.MathUtils.radToDeg(euler.z)
      };
    }
    
    // Store rotation for lock-rotation component
    window.blackboardViewRotation = blackboardViewRotation;
    
    // Disable camera controls to prevent movement
    if (cameraEl.components && cameraEl.components['look-controls']) {
      cameraEl.components['look-controls'].enabled = false;
    }
    if (cameraEl.components && cameraEl.components['wasd-controls']) {
      cameraEl.components['wasd-controls'].enabled = false;
    }
    // Also disable via attributes
    cameraEl.setAttribute('look-controls', 'enabled', false);
    cameraEl.setAttribute('wasd-controls', 'enabled', false);
    
    // Set rotation immediately (before animation) so camera looks at blackboard from the start
    cameraEl.setAttribute('rotation', `${blackboardViewRotation.x} ${blackboardViewRotation.y} ${blackboardViewRotation.z}`);
    
    // Animate camera to blackboard view position (rotation is already set)
    cameraEl.setAttribute('animation__position', {
      property: 'position',
      to: `${blackboardViewPosition.x} ${blackboardViewPosition.y} ${blackboardViewPosition.z}`,
      dur: 500,
      easing: 'easeInOutCubic'
    });
    
    // Also animate rotation to ensure smooth transition (though it's already set)
    cameraEl.setAttribute('animation__rotation', {
      property: 'rotation',
      to: `${blackboardViewRotation.x} ${blackboardViewRotation.y} ${blackboardViewRotation.z}`,
      dur: 500,
      easing: 'easeInOutCubic'
    });
    
    // After animation completes, ensure position and rotation are set correctly
    setTimeout(() => {
      cameraEl.setAttribute('position', {
        x: blackboardViewPosition.x,
        y: blackboardViewPosition.y,
        z: blackboardViewPosition.z
      });
      cameraEl.setAttribute('rotation', `${blackboardViewRotation.x} ${blackboardViewRotation.y} ${blackboardViewRotation.z}`);
    }, 500);
    
    // Add component to continuously lock rotation
    if (!cameraEl.hasAttribute('lock-rotation')) {
      cameraEl.setAttribute('lock-rotation', '');
    }
    
    // Hide proximity UI in blackboard view
    if (proximityUI) {
      if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
        proximityUI.setAttribute('visible', 'false');
      } else {
        proximityUI.classList.add('hidden');
      }
    }
    
    // Show ESC UI in blackboard view
    if (escUI) {
      if (escUI.tagName && escUI.tagName.toLowerCase() === 'a-entity') {
        escUI.setAttribute('visible', 'true');
      } else {
        escUI.classList.remove('hidden');
      }
    }
    
    // Hide completion message when switching views
    hideCompletionMessage();
    
    isBlackboardView = true;
    window.isTopDownView = false; // Not top-down, but locked view
    window.isBlackboardView = true; // Set global flag for lock-rotation component
    console.log('Switched to blackboard view');
  }
  
  // Switch back to original view
  function switchToOriginalView() {
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl || !originalCameraPosition || !originalCameraRotation) return;
    
    // Cancel any ongoing drag
    if (isDragging) {
      if (draggedPlanet) {
        const originalPos = planetOriginalPositions.get(draggedPlanet);
        if (originalPos) {
          draggedPlanet.setAttribute('position', {
            x: originalPos.x,
            y: originalPos.y,
            z: originalPos.z
          });
          draggedPlanet.removeAttribute('data-current-ring');
        }
        draggedPlanet = null;
      }
      if (draggedSphere) {
        // Return to initial starting position
        const initialPos = sphereInitialPositions.get(draggedSphere);
        if (initialPos) {
          draggedSphere.setAttribute('position', {
            x: initialPos.x,
            y: initialPos.y,
            z: initialPos.z
          });
          // Reset the original position tracking to initial position
          sphereOriginalPositions.set(draggedSphere, {
            x: initialPos.x,
            y: initialPos.y,
            z: initialPos.z
          });
        }
        draggedSphere = null;
      }
      isDragging = false;
    }
    
    // Remove lock rotation component
    if (cameraEl.components && cameraEl.components['lock-rotation']) {
      cameraEl.removeAttribute('lock-rotation');
    }
    
    // Reset blackboard view state
    isBlackboardView = false;
    window.isBlackboardView = false;
    window.blackboardViewRotation = null;
    
    console.log('Restoring camera position:', originalCameraPosition);
    console.log('Restoring camera rotation:', originalCameraRotation);
    
    // Remove any existing animations first
    cameraEl.removeAttribute('animation__position');
    cameraEl.removeAttribute('animation__rotation');
    
    // Get THREE.js for rotation conversion
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    
    // Completely reset look-controls internal state before restoring
    // This is critical to prevent rotation accumulation
    if (cameraEl.components && cameraEl.components['look-controls'] && THREE) {
      const lookControls = cameraEl.components['look-controls'];
      // Convert saved rotation to radians
      const pitchRad = THREE.MathUtils.degToRad(originalCameraRotation.x);
      const yawRad = THREE.MathUtils.degToRad(originalCameraRotation.y);
      
      // Reset the internal pitch and yaw objects directly
      if (lookControls.pitchObject) {
        lookControls.pitchObject.rotation.x = pitchRad;
      }
      if (lookControls.yawObject) {
        lookControls.yawObject.rotation.y = yawRad;
      }
      
      // Also update the camera's object3D rotation directly
      if (cameraEl.object3D) {
        cameraEl.object3D.rotation.set(
          pitchRad,
          yawRad,
          THREE.MathUtils.degToRad(originalCameraRotation.z)
        );
      }
    }
    
    // Animate camera back to original position (keep controls disabled during animation)
    cameraEl.setAttribute('animation__position', {
      property: 'position',
      to: `${originalCameraPosition.x} ${originalCameraPosition.y} ${originalCameraPosition.z}`,
      dur: 500,
      easing: 'easeInOutCubic'
    });
    
    cameraEl.setAttribute('animation__rotation', {
      property: 'rotation',
      to: `${originalCameraRotation.x} ${originalCameraRotation.y} ${originalCameraRotation.z}`,
      dur: 500,
      easing: 'easeInOutCubic'
    });
    
    // Set position directly and re-enable controls after animation completes
    setTimeout(() => {
      // Set position directly
      cameraEl.setAttribute('position', {
        x: originalCameraPosition.x,
        y: originalCameraPosition.y,
        z: originalCameraPosition.z
      });
      
      // Set rotation attribute (look-controls is still disabled at this point)
      cameraEl.setAttribute('rotation', {
        x: originalCameraRotation.x,
        y: originalCameraRotation.y,
        z: originalCameraRotation.z
      });
      
      // Also set camera object3D rotation directly to ensure it's correct
      if (cameraEl.object3D && THREE) {
        const pitchRad = THREE.MathUtils.degToRad(originalCameraRotation.x);
        const yawRad = THREE.MathUtils.degToRad(originalCameraRotation.y);
        const rollRad = THREE.MathUtils.degToRad(originalCameraRotation.z);
        cameraEl.object3D.rotation.set(pitchRad, yawRad, rollRad);
      }
      
      // Now sync look-controls internal state BEFORE re-enabling it
      // This is critical - we must set the internal state while it's disabled
      if (cameraEl.components && cameraEl.components['look-controls'] && THREE) {
        const lookControls = cameraEl.components['look-controls'];
        const pitchRad = THREE.MathUtils.degToRad(originalCameraRotation.x);
        const yawRad = THREE.MathUtils.degToRad(originalCameraRotation.y);
        
        // Reset internal state to match restored rotation
        if (lookControls.pitchObject) {
          lookControls.pitchObject.rotation.x = pitchRad;
        }
        if (lookControls.yawObject) {
          lookControls.yawObject.rotation.y = yawRad;
        }
      }
      
      // Now re-enable camera controls after internal state is synced
      if (cameraEl.components && cameraEl.components['look-controls']) {
        cameraEl.components['look-controls'].enabled = true;
      }
      if (cameraEl.components && cameraEl.components['wasd-controls']) {
        cameraEl.components['wasd-controls'].enabled = true;
      }
      // Also enable via attributes
      cameraEl.setAttribute('look-controls', 'enabled', true);
      cameraEl.setAttribute('wasd-controls', 'enabled', true);
      
      console.log('Camera position and rotation restored, controls re-enabled');
    }, 550);
    
    isTopDownView = false;
    topDownViewTableId = null; // Clear table tracking
    window.isTopDownView = false;
    window.topDownYRotation = 0; // Clear stored Y rotation
    
    // Show proximity UI again if near a table or blackboard
    if (proximityUI && (isNearSolarSystem || isNearTable2 || isNearBlackboard)) {
      if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
        proximityUI.setAttribute('visible', 'true');
      } else {
        proximityUI.classList.remove('hidden');
      }
    }
    
    // Hide ESC UI when switching back to original view
    if (escUI) {
      if (escUI.tagName && escUI.tagName.toLowerCase() === 'a-entity') {
        escUI.setAttribute('visible', 'false');
      } else {
        escUI.classList.add('hidden');
      }
    }
    
    // Hide completion message when switching back to original view
    hideCompletionMessage();
    
    console.log('Switched back to original view');
  }
  
  // Handle E key press and ESC key press
  function handleKeyPress(e) {
    // Check if E key is pressed
    if (e.key === 'e' || e.key === 'E') {
      console.log('E key pressed - isNearSolarSystem:', isNearSolarSystem, 'isNearTable2:', isNearTable2, 'isNearBlackboard:', isNearBlackboard, 'currentTable:', currentTable, 'isTopDownView:', isTopDownView, 'isBlackboardView:', isBlackboardView);
      // Check if in any special view (top-down or blackboard)
      if (isTopDownView || isBlackboardView) {
        switchToOriginalView();
      } else {
        // Check if near blackboard
        if (isNearBlackboard && currentTable === 'blackboard') {
          // Save current camera position and rotation BEFORE switching to blackboard view
          const cameraEl = scene.querySelector('a-camera');
          if (cameraEl) {
            const pos = cameraEl.getAttribute('position');
            const rot = cameraEl.getAttribute('rotation');
            // Create a copy of the position and rotation objects
            originalCameraPosition = {
              x: pos.x,
              y: pos.y,
              z: pos.z
            };
            originalCameraRotation = {
              x: rot.x,
              y: rot.y,
              z: rot.z
            };
            console.log('Saved camera position:', originalCameraPosition);
            console.log('Saved camera rotation:', originalCameraRotation);
          }
          switchToBlackboardView();
        }
        // Check if near a table
        else if (isNearSolarSystem || isNearTable2) {
          // Save current camera position and rotation BEFORE switching to top-down view
          const cameraEl = scene.querySelector('a-camera');
          if (cameraEl) {
            const pos = cameraEl.getAttribute('position');
            const rot = cameraEl.getAttribute('rotation');
            // Create a copy of the position and rotation objects
            originalCameraPosition = {
              x: pos.x,
              y: pos.y,
              z: pos.z
            };
            originalCameraRotation = {
              x: rot.x,
              y: rot.y,
              z: rot.z
            };
            console.log('Saved camera position:', originalCameraPosition);
            console.log('Saved camera rotation:', originalCameraRotation);
          }
          // Determine which table to use for top-down view
          const tableId = currentTable === 'table-2' ? 'table-2' : 'table';
          switchToTopDownView(tableId);
        } else {
          console.log('E key pressed but not near any table or blackboard');
        }
      }
    }
    // Check if Q key is pressed (alone, not with other keys)
    if (e.key === 'q' || e.key === 'Q') {
      console.log('Q key pressed - isTopDownView:', isTopDownView, 'isBlackboardView:', isBlackboardView);
      // Only switch back if in top-down view or blackboard view
      if (isTopDownView || isBlackboardView) {
        switchToOriginalView();
        e.preventDefault(); // Prevent default browser behavior
      }
    }
  }
  
  // Attach global event listeners
  function attachEventListeners() {
    window.addEventListener('keydown', handleKeyPress);
    console.log('Event listeners attached - E key handler ready');
  }
  
  // Initialize proximity UI
  function initProximityUI() {
    // Try A-Frame entity first (works in fullscreen)
    proximityUI = document.getElementById('proximity-ui-entity');
    if (proximityUI) {
      console.log('Using A-Frame entity for proximity UI');
      // Start checking proximity
      checkProximity();
      return;
    }
    
    // Fallback to HTML element
    proximityUI = document.getElementById('proximity-ui');
    if (!proximityUI) {
      console.warn('Proximity UI element not found - will retry');
      // Retry after a short delay in case DOM isn't ready
      setTimeout(() => {
        initProximityUI();
      }, 200);
      return;
    }
    
    // Ensure UI is always on top - move to end of body if needed
    if (proximityUI.parentNode !== document.body) {
      document.body.appendChild(proximityUI);
    }
    
    // Force display style to ensure it's visible
    proximityUI.style.display = 'block';
    proximityUI.style.visibility = 'visible';
    
    // Start checking proximity
    checkProximity();
  }
  
  // Initialize ESC UI
  function initESCUI() {
    // Try A-Frame entity first (works in fullscreen)
    escUI = document.getElementById('esc-ui-entity');
    if (escUI) {
      console.log('Using A-Frame entity for ESC UI');
      return;
    }
    
    // Fallback to HTML element
    escUI = document.getElementById('esc-ui');
    if (!escUI) {
      console.warn('ESC UI element not found - will retry');
      // Retry after a short delay in case DOM isn't ready
      setTimeout(() => {
        initESCUI();
      }, 200);
      return;
    }
    
    // Ensure UI is always on top - move to end of body if needed
    if (escUI.parentNode !== document.body) {
      document.body.appendChild(escUI);
    }
    
    // Force display style to ensure it's visible
    escUI.style.display = 'block';
    escUI.style.visibility = 'visible';
    
    // Initially hide the ESC UI (only show in top-down view)
    if (escUI.tagName && escUI.tagName.toLowerCase() === 'a-entity') {
      escUI.setAttribute('visible', 'false');
    } else {
      escUI.classList.add('hidden');
    }
  }
  
  // Initialize Completion Message UI
  function initCompletionMessageUI() {
    // Try A-Frame entity first (works in fullscreen)
    completionMessageUI = document.getElementById('completion-message-entity');
    completionText = document.getElementById('completion-text');
    if (completionMessageUI && completionText) {
      console.log('Using A-Frame entity for completion message UI');
      // Initially hide
      completionMessageUI.setAttribute('visible', 'false');
      return;
    }
    
    console.warn('Completion message UI element not found - will retry');
    // Retry after a short delay in case DOM isn't ready
    setTimeout(() => {
      initCompletionMessageUI();
    }, 200);
  }
  
  // Show completion message
  function showCompletionMessage(puzzleName) {
    // Only show in camera lock mode (top-down view or blackboard view)
    if (!isTopDownView && !isBlackboardView) {
      return;
    }
    
    if (!completionMessageUI || !completionText) {
      // Try to initialize if not already done
      initCompletionMessageUI();
      if (!completionMessageUI || !completionText) {
        console.warn('Completion message UI not available');
        return;
      }
    }
    
    // Set the message text
    const message = `${puzzleName} complete!`;
    completionText.setAttribute('value', message);
    
    // Show the message
    completionMessageUI.setAttribute('visible', 'true');
    
    // Hide after 3 seconds
    if (completionMessageTimeout) {
      clearTimeout(completionMessageTimeout);
    }
    completionMessageTimeout = setTimeout(() => {
      if (completionMessageUI) {
        completionMessageUI.setAttribute('visible', 'false');
      }
    }, 3000);
  }
  
  // Hide completion message
  function hideCompletionMessage() {
    if (completionMessageUI) {
      completionMessageUI.setAttribute('visible', 'false');
    }
    if (completionMessageTimeout) {
      clearTimeout(completionMessageTimeout);
      completionMessageTimeout = null;
    }
  }
  
  // Check camera proximity to solar system, table-2, and blackboard
  function checkProximity() {
    if (!proximityUI) {
      // Try to reinitialize if UI wasn't found
      initProximityUI();
      requestAnimationFrame(checkProximity);
      return;
    }
    
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl || !cameraEl.object3D) {
      requestAnimationFrame(checkProximity);
      return;
    }
    
    // Get camera world position
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) {
      requestAnimationFrame(checkProximity);
      return;
    }
    
    const cameraWorldPos = new THREE.Vector3();
    cameraEl.object3D.getWorldPosition(cameraWorldPos);
    
    // Check distance to solar system
    const solarSystemPos = getSolarSystemWorldPosition();
    const dx1 = cameraWorldPos.x - solarSystemPos.x;
    const dy1 = cameraWorldPos.y - solarSystemPos.y;
    const dz1 = cameraWorldPos.z - solarSystemPos.z;
    const distanceToSolarSystem = Math.sqrt(dx1 * dx1 + dy1 * dy1 + dz1 * dz1);
    
    // Check distance to table-2
    const table2Pos = getTable2WorldPosition();
    const dx2 = cameraWorldPos.x - table2Pos.x;
    const dy2 = cameraWorldPos.y - table2Pos.y;
    const dz2 = cameraWorldPos.z - table2Pos.z;
    const distanceToTable2 = Math.sqrt(dx2 * dx2 + dy2 * dy2 + dz2 * dz2);
    
    // Check distance to blackboard
    const blackboardPos = getBlackboardWorldPosition();
    const dx3 = cameraWorldPos.x - blackboardPos.x;
    const dy3 = cameraWorldPos.y - blackboardPos.y;
    const dz3 = cameraWorldPos.z - blackboardPos.z;
    const distanceToBlackboard = Math.sqrt(dx3 * dx3 + dy3 * dy3 + dz3 * dz3);
    
    // Determine which is closer and within threshold
    const nearSolarSystem = distanceToSolarSystem <= PROXIMITY_THRESHOLD;
    const nearTable2 = distanceToTable2 <= PROXIMITY_THRESHOLD;
    const nearBlackboard = distanceToBlackboard <= PROXIMITY_THRESHOLD;
    
    // Update state
    const wasNearAny = isNearSolarSystem || isNearTable2 || isNearBlackboard;
    isNearSolarSystem = nearSolarSystem;
    isNearTable2 = nearTable2;
    isNearBlackboard = nearBlackboard;
    
    // Determine current table/blackboard (prioritize closest if multiple are near)
    const distances = [];
    if (nearSolarSystem) distances.push({ type: 'solar-system', distance: distanceToSolarSystem });
    if (nearTable2) distances.push({ type: 'table-2', distance: distanceToTable2 });
    if (nearBlackboard) distances.push({ type: 'blackboard', distance: distanceToBlackboard });
    
    if (distances.length > 0) {
      distances.sort((a, b) => a.distance - b.distance);
      currentTable = distances[0].type;
    } else {
      currentTable = null;
    }
    
    // Show/hide UI based on proximity (but not in top-down view or blackboard view)
    const isNearAny = isNearSolarSystem || isNearTable2 || isNearBlackboard;
    if (isNearAny && !wasNearAny && !isTopDownView && !isBlackboardView) {
      // Just entered proximity (only show if not in top-down view)
      if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
        proximityUI.setAttribute('visible', 'true');
        console.log('Proximity UI shown (near:', currentTable, ')');
      } else {
        proximityUI.classList.remove('hidden');
        console.log('Proximity UI shown (near:', currentTable, ')');
      }
    } else if ((!isNearAny && wasNearAny) || isTopDownView || isBlackboardView) {
      // Just left proximity, or in top-down view or blackboard view - hide proximity UI
      if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
        proximityUI.setAttribute('visible', 'false');
      } else {
        proximityUI.classList.add('hidden');
      }
      if (!isNearAny) {
        currentTable = null;
      }
    }
    
    // Continue checking
    requestAnimationFrame(checkProximity);
  }
  
  // Initialize planet original positions
  function initializePlanetPositions() {
    const planets = document.querySelectorAll('[data-planet]');
    planets.forEach(planet => {
      // Keep planets in their original line positions (from HTML)
      // They are already positioned in the HTML, just store their positions
      const pos = planet.getAttribute('position');
      planetOriginalPositions.set(planet, {
        x: pos.x,
        y: pos.y,
        z: pos.z
      });
    });
  }
  
  // Initialize sphere original positions
  function initializeSpherePositions() {
    const spheres = document.querySelectorAll('[data-sphere]');
    spheres.forEach(sphere => {
      // Store their original positions from HTML
      const pos = sphere.getAttribute('position');
      const initialPos = {
        x: pos.x,
        y: pos.y,
        z: pos.z
      };
      // Store in both maps - initial never changes, original can be updated
      sphereInitialPositions.set(sphere, initialPos);
      sphereOriginalPositions.set(sphere, initialPos);
    });
  }
  
  // Convert mouse coordinates to 3D world position (XZ plane at table height)
  function mouseToWorldPosition(event, tableId = 'table') {
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) return null;
    
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl || !cameraEl.object3D) return null;
    
    // Get camera and renderer
    const camera = cameraEl.getObject3D('camera');
    if (!camera) return null;
    
    // Get renderer from scene
    const renderer = scene.renderer || (scene.systems && scene.systems.renderer && scene.systems.renderer.renderer);
    if (!renderer || !renderer.domElement) return null;
    
    // Initialize mouse if needed
    if (!mouse) {
      mouse = new THREE.Vector2();
    }
    
    // Normalize mouse coordinates to -1 to 1
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create raycaster
    if (!raycaster) {
      raycaster = new THREE.Raycaster();
    }
    raycaster.setFromCamera(mouse, camera);
    
    // Get table world position (Y coordinate for the plane)
    const table = document.querySelector(`#${tableId}`);
    const tableTop = table ? table.firstElementChild : null;
    if (!tableTop) return null;
    
    const tableTopPos = tableTop.getAttribute('position');
    const tablePos = table.getAttribute('position');
    const tableY = tablePos.y + tableTopPos.y;
    
    // Create a plane at table height (Y = tableY)
    const planeNormal = new THREE.Vector3(0, 1, 0);
    const planePoint = new THREE.Vector3(0, tableY, 0);
    const plane = new THREE.Plane(planeNormal, -planePoint.dot(planeNormal));
    
    // Find intersection with plane
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectionPoint);
    
    return intersectionPoint;
  }
  
  // Handle mouse down - start dragging
  function handleMouseDown(event) {
    // Only allow dragging in top-down view
    if (!isTopDownView) return;
    
    // Don't allow dragging planets if all planets are correctly placed
    if (allPlanetsCorrect && currentTable === 'solar-system') {
      console.log('All planets correctly placed - dragging disabled');
      return;
    }
    
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) return;
    
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl || !cameraEl.object3D) return;
    
    const camera = cameraEl.getObject3D('camera');
    if (!camera) return;
    
    // Get renderer from scene
    const renderer = scene.renderer || (scene.systems && scene.systems.renderer && scene.systems.renderer.renderer);
    if (!renderer || !renderer.domElement) return;
    
    // Initialize mouse if needed
    if (!mouse) {
      mouse = new THREE.Vector2();
    }
    
    // Normalize mouse coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create raycaster
    if (!raycaster) {
      raycaster = new THREE.Raycaster();
    }
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersection with planets (if viewing solar system table in top-down view)
    if (topDownViewTableId === 'table' || (!topDownViewTableId && (currentTable === 'solar-system' || !currentTable))) {
      const planets = document.querySelectorAll('[data-planet]');
      const intersects = [];
      
      planets.forEach(planet => {
        if (planet.object3D) {
          // Check all meshes in the planet (including nested ones for entities like Saturn)
          const intersect = raycaster.intersectObject(planet.object3D, true);
          if (intersect.length > 0) {
            intersects.push({ element: planet, distance: intersect[0].distance, type: 'planet' });
          }
        }
      });
      
      if (intersects.length > 0) {
        // Find closest planet
        intersects.sort((a, b) => a.distance - b.distance);
        draggedPlanet = intersects[0].element;
        draggedSphere = null;
        isDragging = true;
        
        // Stop orbital animation if active (only if not all planets are correct)
        if (isOrbiting && !allPlanetsCorrect) {
          stopOrbitalAnimation();
        }
        
        // Store original position if not already stored
        if (!planetOriginalPositions.has(draggedPlanet)) {
          const pos = draggedPlanet.getAttribute('position');
          planetOriginalPositions.set(draggedPlanet, {
            x: pos.x,
            y: pos.y,
            z: pos.z
          });
        }
        
        event.preventDefault();
        return;
      }
    }
    
    // Check for intersection with spheres (if viewing table-2 in top-down view)
    if (topDownViewTableId === 'table-2' || (!topDownViewTableId && (currentTable === 'table-2' || !currentTable))) {
      const spheres = document.querySelectorAll('[data-sphere]');
      const intersects = [];
      
      spheres.forEach(sphere => {
        if (sphere.object3D) {
          const intersect = raycaster.intersectObject(sphere.object3D, true);
          if (intersect.length > 0) {
            intersects.push({ element: sphere, distance: intersect[0].distance, type: 'sphere' });
          }
        }
      });
      
      if (intersects.length > 0) {
        // Find closest sphere
        intersects.sort((a, b) => a.distance - b.distance);
        draggedSphere = intersects[0].element;
        draggedPlanet = null;
        isDragging = true;
        
        // Store original position if not already stored
        if (!sphereOriginalPositions.has(draggedSphere)) {
          const pos = draggedSphere.getAttribute('position');
          sphereOriginalPositions.set(draggedSphere, {
            x: pos.x,
            y: pos.y,
            z: pos.z
          });
        }
        
        event.preventDefault();
      }
    }
  }
  
  // Handle mouse move - update planet or sphere position
  function handleMouseMove(event) {
    if (!isDragging || !isTopDownView) return;
    
    // Handle planet dragging
    if (draggedPlanet) {
      const worldPos = mouseToWorldPosition(event, 'table');
      if (!worldPos) return;
      
      // Get solar system world position
      const solarSystemPos = getSolarSystemWorldPosition();
      
      // Calculate position relative to solar system (only X and Z, keep Y)
      const originalPos = planetOriginalPositions.get(draggedPlanet);
      const relativeX = worldPos.x - solarSystemPos.x;
      const relativeZ = worldPos.z - solarSystemPos.z;
      const relativeY = originalPos ? originalPos.y : draggedPlanet.getAttribute('position').y;
      
      // Update planet position (only X and Z, Y stays the same)
      draggedPlanet.setAttribute('position', {
        x: relativeX,
        y: relativeY,
        z: relativeZ
      });
      
      // Check for ring proximity and snap
      const currentPos = { x: relativeX, y: relativeY, z: relativeZ };
      const closestRing = getClosestRing(currentPos, 0.15); // Snap threshold
      
      if (closestRing.ring && closestRing.position) {
        // Snap to ring
        draggedPlanet.setAttribute('position', {
          x: closestRing.position.x,
          y: closestRing.position.y,
          z: closestRing.position.z
        });
        
        // Update data-current-ring attribute (use radius from the ring object)
        const ringRadius = closestRing.ring.radius;
        draggedPlanet.setAttribute('data-current-ring', ringRadius);
      } else {
        // Not on a ring, clear the attribute
        draggedPlanet.removeAttribute('data-current-ring');
      }
      
      event.preventDefault();
    }
    // Handle sphere dragging
    else if (draggedSphere) {
      const worldPos = mouseToWorldPosition(event, 'table-2');
      if (!worldPos) return;
      
      // Get table-2 entity to convert world position to local space
      const table2 = document.querySelector('#table-2');
      if (!table2 || !table2.object3D) return;
      
      const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
      if (!THREE) return;
      
      // Convert world position to table-2's local coordinate space
      const worldVector = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
      const localVector = worldVector.clone();
      
      // Get table-2's world matrix and invert it to convert world to local
      table2.object3D.updateMatrixWorld();
      const inverseMatrix = new THREE.Matrix4().copy(table2.object3D.matrixWorld).invert();
      localVector.applyMatrix4(inverseMatrix);
      
      // Get original position for Y (use current stored position, or initial if not set)
      const originalPos = sphereOriginalPositions.get(draggedSphere);
      if (!originalPos) return; // Safety check
      
      // Update sphere position (only X and Z, Y stays the same)
      draggedSphere.setAttribute('position', {
        x: localVector.x,
        y: originalPos.y, // Fixed Y from original position
        z: localVector.z
      });
      
      event.preventDefault();
    }
  }
  
  // Handle mouse up - end dragging
  function handleMouseUp(event) {
    // Only handle left mouse button (if button property exists)
    if (event.button !== undefined && event.button !== 0) return;
    
    // If not dragging, nothing to do
    if (!isDragging) {
      // Ensure state is cleared even if something went wrong
      isDragging = false;
      draggedPlanet = null;
      draggedSphere = null;
      return;
    }
    
    // Handle planet release
    if (draggedPlanet) {
      // Store the planet reference before clearing state
      const planetToRelease = draggedPlanet;
      
      // IMMEDIATELY clear dragging state to stop mousemove from interfering
      isDragging = false;
      draggedPlanet = null;
      
      // Get current position
      const currentPos = planetToRelease.getAttribute('position');
      const closestRing = getClosestRing(currentPos, 0.15);
      
      if (closestRing.ring && closestRing.position) {
        // Snap to ring and lock position
        planetToRelease.setAttribute('position', {
          x: closestRing.position.x,
          y: closestRing.position.y,
          z: closestRing.position.z
        });
        
        // Update data-current-ring attribute (use radius from the ring object)
        const ringRadius = closestRing.ring.radius;
        planetToRelease.setAttribute('data-current-ring', ringRadius);
        
        // Check if this planet is on its correct ring
        const planetName = planetToRelease.getAttribute('data-planet');
        const correctRadius = planetOrder[planetName];
        if (Math.abs(ringRadius - correctRadius) < 0.05) {
          // Set planet boolean to true
          if (planetCorrect.hasOwnProperty(planetName)) {
            planetCorrect[planetName] = true;
          }
          console.log(`Planet ${planetName} placed on correct ring (radius: ${ringRadius})`);
        } else {
          // Set planet boolean to false if on wrong ring
          if (planetCorrect.hasOwnProperty(planetName)) {
            planetCorrect[planetName] = false;
          }
        }
        
        // Update the original position to the new ring position
        // So if moved again, this becomes the new starting position
        planetOriginalPositions.set(planetToRelease, {
          x: closestRing.position.x,
          y: closestRing.position.y,
          z: closestRing.position.z
        });
        
        // Check planet order (this will start animation if all planets are correct)
        checkPlanetOrder();
      } else {
        // Not on a ring, return to original position
        const originalPos = planetOriginalPositions.get(planetToRelease);
        if (originalPos) {
          planetToRelease.setAttribute('position', {
            x: originalPos.x,
            y: originalPos.y,
            z: originalPos.z
          });
          planetToRelease.removeAttribute('data-current-ring');
          
          // Set planet boolean to false when removed from ring
          const planetName = planetToRelease.getAttribute('data-planet');
          if (planetCorrect.hasOwnProperty(planetName)) {
            planetCorrect[planetName] = false;
          }
          
          // Check if all planets are correctly placed (in case this removal affects the state)
          checkPlanetOrder();
        }
      }
    }
    // Handle sphere release
    else if (draggedSphere) {
      // Store the sphere reference before clearing state
      const sphereToRelease = draggedSphere;
      
      // IMMEDIATELY clear dragging state
      isDragging = false;
      draggedSphere = null;
      
      // Get current position
      const currentPos = sphereToRelease.getAttribute('position');
      
      // Check if sphere is over an image and which one
      const imageZodiac = getImageAtPosition(currentPos);
      const sphereZodiac = sphereToRelease.getAttribute('data-zodiac');
      
      if (imageZodiac) {
        // Sphere is over an image (correct or wrong) - allow it to stay
        // Update the current position tracking (but keep initial position unchanged)
        sphereOriginalPositions.set(sphereToRelease, {
          x: currentPos.x,
          y: currentPos.y,
          z: currentPos.z
        });
        
        // Check if it's the correct image
        if (imageZodiac === sphereZodiac) {
          // Correct match!
          sphereCorrectPlacements[sphereZodiac] = true;
          const zodiacName = sphereZodiac.charAt(0).toUpperCase() + sphereZodiac.slice(1);
          console.log(`Correct sphere placed on ${zodiacName}`);
          
          // Check if all spheres are correctly placed
          checkAllSpheresPlaced();
        } else {
          // Wrong image - mark as not correctly placed
          if (sphereZodiac) {
            sphereCorrectPlacements[sphereZodiac] = false;
          }
        }
      } else {
        // Sphere is not over any image, return to initial starting position
        if (sphereZodiac) {
          sphereCorrectPlacements[sphereZodiac] = false; // Mark as not correctly placed
        }
        const initialPos = sphereInitialPositions.get(sphereToRelease);
        if (initialPos) {
          sphereToRelease.setAttribute('position', {
            x: initialPos.x,
            y: initialPos.y,
            z: initialPos.z
          });
          // Reset the original position tracking to initial position
          sphereOriginalPositions.set(sphereToRelease, {
            x: initialPos.x,
            y: initialPos.y,
            z: initialPos.z
          });
        }
      }
    }
    
    if (event && event.preventDefault) {
      event.preventDefault();
    }
  }
  
  // Handle mouse leave - cancel dragging
  function handleMouseLeave(event) {
    if (!isDragging) return;
    
    // Handle planet
    if (draggedPlanet) {
      // Return to original position
      const originalPos = planetOriginalPositions.get(draggedPlanet);
      if (originalPos) {
        draggedPlanet.setAttribute('position', {
          x: originalPos.x,
          y: originalPos.y,
          z: originalPos.z
        });
        draggedPlanet.removeAttribute('data-current-ring');
      }
    }
    // Handle sphere
    else if (draggedSphere) {
      // Return to initial starting position
      const initialPos = sphereInitialPositions.get(draggedSphere);
      if (initialPos) {
        draggedSphere.setAttribute('position', {
          x: initialPos.x,
          y: initialPos.y,
          z: initialPos.z
        });
        // Reset the original position tracking to initial position
        sphereOriginalPositions.set(draggedSphere, {
          x: initialPos.x,
          y: initialPos.y,
          z: initialPos.z
        });
      }
    }
    
    // Reset dragging state
    isDragging = false;
    draggedPlanet = null;
    draggedSphere = null;
  }
  
  // Handle pointer up (for modern browsers)
  function handlePointerUp(event) {
    // Only handle left mouse button (if button property exists)
    if (event.button !== undefined && event.button !== 0) return;
    handleMouseUp(event);
  }
  
  // Initialize drag and drop
  function initDragAndDrop() {
    // Initialize planet positions
    initializePlanetPositions();
    // Initialize sphere positions
    initializeSpherePositions();
    
    // Add event listeners - use document for mouseup to ensure it's caught
    // Use capture phase for mouseup to catch it before other handlers
    window.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    window.addEventListener('mouseup', handleMouseUp, true); // Also on window as backup
    // Add pointerup as backup for modern browsers
    document.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    console.log('Drag and drop initialized');
  }
  
  // Normalize connection pair (sort alphabetically for bidirectional matching)
  function normalizeConnection(star1, star2) {
    return [star1, star2].sort().join('-');
  }
  
  // Check if connection is correct
  function isCorrectConnection(star1, star2) {
    const normalized = normalizeConnection(star1, star2);
    return correctConnections.some(conn => {
      const connNormalized = normalizeConnection(conn[0], conn[1]);
      return normalized === connNormalized;
    });
  }
  
  // Check if all correct connections are made and no incorrect ones exist
  function checkAllConnectionsComplete() {
    // Check if all correct connections exist in constellationConnections
    const allCorrectMade = correctConnections.every(conn => {
      const connNormalized = normalizeConnection(conn[0], conn[1]);
      return constellationConnections.has(connNormalized);
    });
    
    // Check if there are any incorrect connections
    const hasIncorrectConnections = Array.from(constellationConnections).some(connectionKey => {
      // Check if this connection is NOT in the correct connections list
      return !correctConnections.some(conn => {
        const connNormalized = normalizeConnection(conn[0], conn[1]);
        return connectionKey === connNormalized;
      });
    });
    
    // Only log if all correct connections are made AND no incorrect connections exist
    if (allCorrectMade && !hasIncorrectConnections) {
      console.log('All stars are connected correctly! Big Dipper constellation complete!');
      // Show completion message
      showCompletionMessage('Big Dipper');
      return true;
    }
    return false;
  }
  
  // Create a line between two stars
  function createConstellationLine(star1, star2, connectionKey) {
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) return;
    
    // Get positions of both stars (relative to blackboard entity)
    const pos1 = star1.getAttribute('position');
    const pos2 = star2.getAttribute('position');
    
    // Calculate midpoint
    const midX = (pos1.x + pos2.x) / 2;
    const midY = (pos1.y + pos2.y) / 2;
    const midZ = (pos1.z + pos2.z) / 2;
    
    // Calculate distance
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate rotation angle (in degrees)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Get the container for lines
    const linesContainer = document.querySelector('#constellation-lines');
    if (!linesContainer) return;
    
    // Create line element
    // Use width for the length (extends along x-axis), then rotate around z-axis
    const line = document.createElement('a-box');
    line.setAttribute('position', `${midX} ${midY} ${midZ - 0.005}`);
    line.setAttribute('rotation', `0 0 ${angle}`);
    line.setAttribute('width', distance); // Length of the line
    line.setAttribute('height', '0.006'); // Thickness
    line.setAttribute('depth', '0.006'); // Thickness
    line.setAttribute('color', '#FFFFFF');
    line.setAttribute('opacity', '0.7');
    line.classList.add('constellation-line'); // Add class for easy selection
    line.setAttribute('data-connection', connectionKey); // Store connection key for removal
    
    // Add to container
    linesContainer.appendChild(line);
    
    return line;
  }
  
  // Remove a constellation line
  function removeConstellationLine(lineElement) {
    const connectionKey = lineElement.getAttribute('data-connection');
    if (connectionKey) {
      constellationConnections.delete(connectionKey);
      // Check if constellation is now complete after removing a line
      // (in case removing an incorrect line made it perfect)
      checkAllConnectionsComplete();
    }
    lineElement.remove();
  }
  
  // Handle constellation star click
  function handleConstellationStarClick(event) {
    // Only handle clicks when in camera lock mode (blackboard view)
    if (!isBlackboardView && !window.isBlackboardView) return;
    
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    // Don't interfere with drag and drop if currently dragging
    if (isDragging) return;
    
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) return;
    
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl || !cameraEl.object3D) return;
    
    const camera = cameraEl.getObject3D('camera');
    if (!camera) return;
    
    // Get renderer from scene
    const renderer = scene.renderer || (scene.systems && scene.systems.renderer && scene.systems.renderer.renderer);
    if (!renderer || !renderer.domElement) return;
    
    // Initialize mouse if needed
    if (!mouse) {
      mouse = new THREE.Vector2();
    }
    
    // Normalize mouse coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create raycaster
    if (!raycaster) {
      raycaster = new THREE.Raycaster();
    }
    raycaster.setFromCamera(mouse, camera);
    
    // First check for intersection with constellation lines (to remove them)
    const lines = document.querySelectorAll('.constellation-line');
    const lineIntersects = [];
    
    lines.forEach(line => {
      if (line.object3D) {
        const intersect = raycaster.intersectObject(line.object3D, true);
        if (intersect.length > 0) {
          lineIntersects.push({ element: line, distance: intersect[0].distance });
        }
      }
    });
    
    // If a line is clicked, remove it
    if (lineIntersects.length > 0) {
      // Find closest line
      lineIntersects.sort((a, b) => a.distance - b.distance);
      const clickedLine = lineIntersects[0].element;
      removeConstellationLine(clickedLine);
      console.log('Line removed');
      
      // If a star was selected, deselect it
      if (firstSelectedStar) {
        firstSelectedStar.setAttribute('color', '#FFFFFF');
        firstSelectedStar.setAttribute('emissive', '#FFFFFF');
        firstSelectedStar = null;
      }
      
      event.preventDefault();
      return;
    }
    
    // Check for intersection with constellation stars
    const stars = document.querySelectorAll('.constellation-star');
    const intersects = [];
    
    stars.forEach(star => {
      if (star.object3D) {
        const intersect = raycaster.intersectObject(star.object3D, true);
        if (intersect.length > 0) {
          intersects.push({ element: star, distance: intersect[0].distance });
        }
      }
    });
    
    if (intersects.length > 0) {
      // Find closest star
      intersects.sort((a, b) => a.distance - b.distance);
      const clickedStar = intersects[0].element;
      const starId = clickedStar.getAttribute('data-star');
      
      if (!firstSelectedStar) {
        // First star clicked - store it and turn yellow
        firstSelectedStar = clickedStar;
        clickedStar.setAttribute('color', '#FFFF00'); // Yellow highlight
        clickedStar.setAttribute('emissive', '#FFFF00'); // Yellow emissive
        console.log('First star selected:', starId);
      } else {
        // Second star clicked
        if (firstSelectedStar === clickedStar) {
          // Same star clicked - deselect and turn back to white
          firstSelectedStar.setAttribute('color', '#FFFFFF'); // Reset to white
          firstSelectedStar.setAttribute('emissive', '#FFFFFF'); // Reset emissive
          firstSelectedStar = null;
          console.log('Star deselected');
        } else {
          // Different star clicked - create connection
          const firstStarId = firstSelectedStar.getAttribute('data-star');
          const secondStarId = starId;
          
          // Normalize connection (alphabetical order)
          const connectionKey = normalizeConnection(firstStarId, secondStarId);
          
          // Check if connection already exists
          if (!constellationConnections.has(connectionKey)) {
            // Create line (pass connectionKey to store it)
            createConstellationLine(firstSelectedStar, clickedStar, connectionKey);
            constellationConnections.add(connectionKey);
            
            // Check if connection is correct
            if (isCorrectConnection(firstStarId, secondStarId)) {
              console.log(`Correct connection: ${firstStarId} to ${secondStarId}`);
              // Check if all correct connections are now complete
              checkAllConnectionsComplete();
            }
          } else {
            console.log('Connection already exists');
          }
          
          // Reset first star back to white after connection is made
          firstSelectedStar.setAttribute('color', '#FFFFFF'); // Reset to white
          firstSelectedStar.setAttribute('emissive', '#FFFFFF'); // Reset emissive
          firstSelectedStar = null;
        }
      }
      
      event.preventDefault();
    }
  }
  
  // Initialize constellation game
  function initConstellationGame() {
    // Add click event listener for constellation stars
    window.addEventListener('mousedown', handleConstellationStarClick);
    console.log('Constellation game initialized');
  }
  
  if (scene) {
    // Function to initialize everything
    function initialize() {
      attachEventListeners();
      initProximityUI();
      initESCUI();
      initCompletionMessageUI();
      initDragAndDrop();
      initConstellationGame();
      // Don't start animation automatically - wait for all planets to be correctly placed
    }
    
    // Check if scene is already loaded
    if (scene.hasLoaded) {
      // Wait a bit for components to initialize
      setTimeout(initialize, 100);
    } else {
      scene.addEventListener('loaded', function() {
        setTimeout(initialize, 100);
      });
    }
  } else {
    // Fallback: attach after a short delay
    setTimeout(() => {
      attachEventListeners();
      initProximityUI();
      initESCUI();
      initCompletionMessageUI();
      initDragAndDrop();
      initConstellationGame();
      // Don't start animation automatically - wait for all planets to be correctly placed
    }, 500);
  }
}

