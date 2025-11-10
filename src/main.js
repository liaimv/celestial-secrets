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

// Lock rotation component for top-down view
AFRAME.registerComponent('lock-rotation', {
  tick: function() {
    if (window.isTopDownView) {
      this.el.setAttribute('rotation', '-90 0 0');
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
  const PROXIMITY_THRESHOLD = 5; // Distance threshold to show UI
  
  // ESC UI state
  let escUI = null;
  
  // Camera view state
  let isTopDownView = false;
  let originalCameraPosition = null;
  let originalCameraRotation = null;
  
  // Drag and drop state
  let draggedPlanet = null;
  let planetOriginalPositions = new Map();
  let isDragging = false;
  let raycaster = null;
  let mouse = null;
  
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
  function switchToTopDownView() {
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl) return;
    
    // Get table and its first child (the long rectangle/table top)
    const table = document.querySelector('#table');
    if (!table) return;
    
    const tableTop = table.firstElementChild;
    if (!tableTop) return;
    
    // Get the table top's world position
    const tableTopPos = tableTop.getAttribute('position');
    const tablePos = table.getAttribute('position');
    
    // Calculate world position (table position + table top relative position)
    const worldX = tablePos.x + tableTopPos.x;
    const worldZ = tablePos.z + tableTopPos.z;
    
    // Position camera: x and z from table top, y fixed at 2.750, z fixed at -18.500
    const topDownPosition = {
      x: worldX,
      y: 2.750,
      z: -18.500
    };
    
    // Rotate to look down (90 degrees on X axis) - locked
    const topDownRotation = {
      x: 90,
      y: 0,
      z: 0
    };
    
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
    
    isTopDownView = true;
    window.isTopDownView = true;
    console.log('Switched to top-down view');
  }
  
  // Switch back to original view
  function switchToOriginalView() {
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl || !originalCameraPosition || !originalCameraRotation) return;
    
    // Cancel any ongoing drag
    if (isDragging && draggedPlanet) {
      const originalPos = planetOriginalPositions.get(draggedPlanet);
      if (originalPos) {
        draggedPlanet.setAttribute('position', {
          x: originalPos.x,
          y: originalPos.y,
          z: originalPos.z
        });
        draggedPlanet.removeAttribute('data-current-ring');
      }
      isDragging = false;
      draggedPlanet = null;
    }
    
    // Remove lock rotation component
    if (cameraEl.components && cameraEl.components['lock-rotation']) {
      cameraEl.removeAttribute('lock-rotation');
    }
    
    console.log('Restoring camera position:', originalCameraPosition);
    console.log('Restoring camera rotation:', originalCameraRotation);
    
    // Remove any existing animations first
    cameraEl.removeAttribute('animation__position');
    cameraEl.removeAttribute('animation__rotation');
    
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
      // Set position and rotation directly to ensure they're correct
      cameraEl.setAttribute('position', {
        x: originalCameraPosition.x,
        y: originalCameraPosition.y,
        z: originalCameraPosition.z
      });
      cameraEl.setAttribute('rotation', {
        x: originalCameraRotation.x,
        y: originalCameraRotation.y,
        z: originalCameraRotation.z
      });
      
      // Now re-enable camera controls after position is set
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
    window.isTopDownView = false;
    
    // Show proximity UI again if near solar system
    if (proximityUI && isNearSolarSystem) {
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
    
    console.log('Switched back to original view');
  }
  
  // Handle E key press and ESC key press
  function handleKeyPress(e) {
    // Check if E key is pressed
    if (e.key === 'e' || e.key === 'E') {
      console.log('E key pressed - isNearSolarSystem:', isNearSolarSystem, 'isTopDownView:', isTopDownView);
      // Only switch if near solar system
      if (isNearSolarSystem) {
        if (isTopDownView) {
          switchToOriginalView();
        } else {
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
          switchToTopDownView();
        }
      } else {
        console.log('E key pressed but not near solar system');
      }
    }
    // Check if CTRL key is pressed (alone, not with other keys)
    if (e.key === 'Control' && !e.shiftKey && !e.altKey && !e.metaKey) {
      console.log('CTRL key pressed - isTopDownView:', isTopDownView);
      // Only switch back if in top-down view
      if (isTopDownView) {
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
  
  // Check camera proximity to solar system
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
    
    const solarSystemPos = getSolarSystemWorldPosition();
    
    // Calculate 3D distance
    const dx = cameraWorldPos.x - solarSystemPos.x;
    const dy = cameraWorldPos.y - solarSystemPos.y;
    const dz = cameraWorldPos.z - solarSystemPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Show/hide UI based on proximity
    if (distance <= PROXIMITY_THRESHOLD && !isNearSolarSystem) {
      isNearSolarSystem = true;
      // Check if it's an A-Frame entity or HTML element
      if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
        // A-Frame entity
        proximityUI.setAttribute('visible', 'true');
        console.log('Proximity UI shown (distance:', distance.toFixed(2), ')');
      } else {
        // HTML element
        proximityUI.classList.remove('hidden');
        console.log('Proximity UI shown (distance:', distance.toFixed(2), ')');
      }
    } else if (distance > PROXIMITY_THRESHOLD && isNearSolarSystem) {
      isNearSolarSystem = false;
      // Check if it's an A-Frame entity or HTML element
      if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
        // A-Frame entity
        proximityUI.setAttribute('visible', 'false');
      } else {
        // HTML element
        proximityUI.classList.add('hidden');
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
  
  // Convert mouse coordinates to 3D world position (XZ plane at table height)
  function mouseToWorldPosition(event) {
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
    const table = document.querySelector('#table');
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
    
    // Don't allow dragging if all planets are correctly placed
    if (allPlanetsCorrect) {
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
    
    // Check for intersection with planets
    const planets = document.querySelectorAll('[data-planet]');
    const intersects = [];
    
    planets.forEach(planet => {
      if (planet.object3D) {
        // Check all meshes in the planet (including nested ones for entities like Saturn)
        const intersect = raycaster.intersectObject(planet.object3D, true);
        if (intersect.length > 0) {
          intersects.push({ planet: planet, distance: intersect[0].distance });
        }
      }
    });
    
    if (intersects.length > 0) {
      // Find closest planet
      intersects.sort((a, b) => a.distance - b.distance);
      draggedPlanet = intersects[0].planet;
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
    }
  }
  
  // Handle mouse move - update planet position
  function handleMouseMove(event) {
    if (!isDragging || !draggedPlanet || !isTopDownView) return;
    
    const worldPos = mouseToWorldPosition(event);
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
  
  // Handle mouse up - end dragging
  function handleMouseUp(event) {
    // Only handle left mouse button (if button property exists)
    if (event.button !== undefined && event.button !== 0) return;
    
    // If not dragging, nothing to do
    if (!isDragging || !draggedPlanet) {
      // Ensure state is cleared even if something went wrong
      isDragging = false;
      draggedPlanet = null;
      return;
    }
    
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
    
    if (event && event.preventDefault) {
      event.preventDefault();
    }
  }
  
  // Handle mouse leave - cancel dragging
  function handleMouseLeave(event) {
    if (!isDragging || !draggedPlanet) return;
    
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
    
    // Reset dragging state
    isDragging = false;
    draggedPlanet = null;
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
  
  if (scene) {
    // Function to initialize everything
    function initialize() {
      attachEventListeners();
      initProximityUI();
      initESCUI();
      initDragAndDrop();
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
      initDragAndDrop();
      // Don't start animation automatically - wait for all planets to be correctly placed
    }, 500);
  }
}
