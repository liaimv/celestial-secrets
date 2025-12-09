// A-Frame initialization
console.log('A-Frame VR Scene Initialized');

// Intro overlay sequence
function initIntroSequence() {
  const introOverlay = document.getElementById('intro-overlay');
  const introTitle = document.getElementById('intro-title');
  const introStory = document.getElementById('intro-story');
  const introStory2 = document.getElementById('intro-story-2');
  const startButton = document.getElementById('start-button');
  
  if (!introOverlay || !introTitle || !introStory || !introStory2 || !startButton) {
    console.error('Intro overlay elements not found');
    return;
  }
  
  let isFirstStory = true;
  let isButtonTransitioning = false;
  
  // After 2 seconds, fade out title and fade in first story
  setTimeout(() => {
    introTitle.classList.add('fade-out');
    
    // Show first story and fade it in after title starts fading
    setTimeout(() => {
      introStory.classList.remove('hidden');
      startButton.classList.remove('hidden');
      // Keep button disabled during fade-in
      startButton.style.pointerEvents = 'none';
      setTimeout(() => {
        introStory.classList.add('fade-in');
        startButton.classList.add('fade-in');
        // Enable button only after fade-in transition completes (1 second)
        setTimeout(() => {
          startButton.style.pointerEvents = 'auto';
          isButtonTransitioning = false;
        }, 1000);
      }, 100);
    }, 500);
  }, 2000);
  
  // Handle button click
  startButton.addEventListener('click', (e) => {
    // Prevent click if button is transitioning or not fully visible
    if (isButtonTransitioning || 
        !startButton.classList.contains('fade-in') || 
        startButton.classList.contains('fade-out') ||
        startButton.style.pointerEvents === 'none' ||
        window.getComputedStyle(startButton).opacity !== '1') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Set transitioning flag immediately
    isButtonTransitioning = true;
    startButton.style.pointerEvents = 'none';
    
    if (isFirstStory) {
      // Fade out first story and button together
      introStory.classList.remove('fade-in');
      introStory.classList.add('fade-out');
      startButton.classList.remove('fade-in');
      startButton.classList.add('fade-out');
      
      // After fade out completes, change button text and fade in second story
      setTimeout(() => {
        introStory.classList.add('hidden');
        startButton.textContent = 'START';
        startButton.classList.remove('fade-out');
        introStory2.classList.remove('hidden');
        // Keep button disabled during fade-in
        startButton.style.pointerEvents = 'none';
        setTimeout(() => {
          introStory2.classList.add('fade-in');
          startButton.classList.add('fade-in');
          // Enable button only after fade-in transition completes (1 second)
          setTimeout(() => {
            startButton.style.pointerEvents = 'auto';
            isButtonTransitioning = false;
          }, 1000);
        }, 100);
      }, 1000);
      
      isFirstStory = false;
    } else {
      // First fade out the text and button
      introStory2.classList.remove('fade-in');
      introStory2.classList.add('fade-out');
      startButton.classList.remove('fade-in');
      startButton.classList.add('fade-out');
      
      // After text fades out, fade out the black overlay
      setTimeout(() => {
        introOverlay.classList.add('fade-out');
        // Remove overlay from DOM after fade completes
        setTimeout(() => {
          introOverlay.style.display = 'none';
        }, 1000);
      }, 1000);
    }
  });
  
  // Handle controls overlay close button
  const controlsOverlay = document.getElementById('controls-overlay');
  const closeControlsButton = document.getElementById('close-controls');
  
  if (controlsOverlay && closeControlsButton) {
    closeControlsButton.addEventListener('click', () => {
      controlsOverlay.classList.add('hidden');
    });
  }
  
  // Function to enable/disable camera controls based on controls overlay visibility
  function updateCameraControls() {
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl) return;
    
    const controlsOverlay = document.getElementById('controls-overlay');
    if (!controlsOverlay) return;
    
    // Check if controls overlay is visible (doesn't have 'hidden' class)
    const isControlsVisible = !controlsOverlay.classList.contains('hidden');
    
    if (isControlsVisible) {
      // Freeze camera - disable controls
      if (cameraEl.components && cameraEl.components['look-controls']) {
        cameraEl.components['look-controls'].enabled = false;
      }
      if (cameraEl.components && cameraEl.components['wasd-controls']) {
        cameraEl.components['wasd-controls'].enabled = false;
      }
      cameraEl.setAttribute('look-controls', 'enabled', false);
      cameraEl.setAttribute('wasd-controls', 'enabled', false);
      console.log('Camera controls frozen - controls overlay visible');
    } else {
      // Unfreeze camera - enable controls (only if not in special views)
      // Check if we're in a special view that should keep controls disabled
      const isTopDownView = window.isTopDownView || false;
      const isBlackboardView = window.isBlackboardView || false;
      const isStarBackgroundView = window.isStarBackgroundView || false;
      
      // Only enable controls if not in a special view
      if (!isTopDownView && !isBlackboardView && !isStarBackgroundView) {
        if (cameraEl.components && cameraEl.components['look-controls']) {
          cameraEl.components['look-controls'].enabled = true;
        }
        if (cameraEl.components && cameraEl.components['wasd-controls']) {
          cameraEl.components['wasd-controls'].enabled = true;
        }
        cameraEl.setAttribute('look-controls', 'enabled', true);
        cameraEl.setAttribute('wasd-controls', 'enabled', true);
        console.log('Camera controls enabled - controls overlay hidden');
      }
    }
  }
  
  // Set up MutationObserver to watch for changes to controls overlay visibility
  if (controlsOverlay) {
    // Initial check - wait for A-Frame to be ready
    function doInitialCheck() {
      const scene = document.querySelector('a-scene');
      if (scene && scene.querySelector('a-camera')) {
        updateCameraControls();
      } else {
        setTimeout(doInitialCheck, 100);
      }
    }
    doInitialCheck();
    
    // Watch for class changes on controls overlay
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateCameraControls();
        }
      });
    });
    
    observer.observe(controlsOverlay, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

// Initialize intro sequence when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIntroSequence);
} else {
  initIntroSequence();
}

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

// Lock rotation component for top-down view, blackboard view, and star background view
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
    } else if (window.isStarBackgroundView) {
      // Lock rotation for star background view (use stored rotation or default to looking at star background)
      const rotation = window.starBackgroundViewRotation || { x: 0, y: 0, z: 0 };
      this.el.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);
    }
  }
});

// Component to update case animation mixer
AFRAME.registerComponent('case-animation-updater', {
  tick: function(time, timeDelta) {
    if (this.el.mixer && this.el.animationAction && !this.el.animationAction.paused) {
      const delta = timeDelta / 1000; // Convert to seconds
      this.el.mixer.update(delta);
      
      // Stop when we reach half duration
      if (this.el.mixer.time >= this.el.animationHalfDuration) {
        this.el.mixer.time = this.el.animationHalfDuration;
        this.el.animationAction.paused = true;
        // Update caseIsOpen via the update function
        if (window.updateCaseIsOpen) {
          window.updateCaseIsOpen(true);
        }
        console.log('Case animation stopped at halfway point, caseIsOpen set to true');
        // Remove component after stopping
        this.el.removeAttribute('case-animation-updater');
      }
    }
  }
});

// Component to clamp camera position within room bounds
AFRAME.registerComponent('camera-bounds', {
  schema: {
    minX: { type: 'number', default: -5.5 },
    maxX: { type: 'number', default: 5.5 },
    minZ: { type: 'number', default: -18.893 },
    maxZ: { type: 'number', default: -7.934 }
  },
  init: function() {
    // Define table bounds (world coordinates) with 0.5 unit buffer around tables
    // Table 1 (solar system table): entity at (0, 1.2, -15), table top at (0, 0.25, -3.5) relative
    // World position: (0, 1.45, -18.5), width: 16*0.27=4.32, depth: 6*0.5=3
    // Adding 0.5 unit buffer on all sides
    this.table1Bounds = {
      minX: -2.16 - 0.5,
      maxX: 2.16 + 0.5,
      minZ: -20 - 0.5,
      maxZ: -17 + 0.5
    };
    
    // Table 2 (zodiac table): entity at (0, 1.2, -4.915), table top at (0, 0.25, -3.5) relative
    // World position: (0, 1.45, -8.415), width: 16*0.27=4.32, depth: 6*0.5=3
    // Adding 0.5 unit buffer on all sides
    this.table2Bounds = {
      minX: -2.16 - 0.5,
      maxX: 2.16 + 0.5,
      minZ: -9.915 - 0.5,
      maxZ: -6.915 + 0.5
    };
  },
  // Check if a point is inside a table area
  isInsideTable: function(x, z, tableBounds) {
    return x >= tableBounds.minX && x <= tableBounds.maxX &&
           z >= tableBounds.minZ && z <= tableBounds.maxZ;
  },
  // Push position out of table area to nearest edge
  pushOutOfTable: function(x, z, tableBounds) {
    let newX = x;
    let newZ = z;
    
    // Calculate distances to each edge
    const distToLeft = Math.abs(x - tableBounds.minX);
    const distToRight = Math.abs(x - tableBounds.maxX);
    const distToFront = Math.abs(z - tableBounds.minZ);
    const distToBack = Math.abs(z - tableBounds.maxZ);
    
    // Find minimum distance
    const minDist = Math.min(distToLeft, distToRight, distToFront, distToBack);
    
    // Push to nearest edge
    if (minDist === distToLeft) {
      newX = tableBounds.minX;
    } else if (minDist === distToRight) {
      newX = tableBounds.maxX;
    } else if (minDist === distToFront) {
      newZ = tableBounds.minZ;
    } else {
      newZ = tableBounds.maxZ;
    }
    
    return { x: newX, z: newZ };
  },
  tick: function() {
    // Only apply bounds when not in special views (top-down, blackboard, star background)
    if (window.isTopDownView || window.isBlackboardView || window.isStarBackgroundView) {
      return;
    }
    
    const pos = this.el.getAttribute('position');
    if (!pos) return;
    
    let clampedX = Math.max(this.data.minX, Math.min(this.data.maxX, pos.x));
    let clampedZ = Math.max(this.data.minZ, Math.min(this.data.maxZ, pos.z));
    
    // Check if camera is trying to enter table areas and push it out
    if (this.isInsideTable(clampedX, clampedZ, this.table1Bounds)) {
      const pushed = this.pushOutOfTable(clampedX, clampedZ, this.table1Bounds);
      clampedX = pushed.x;
      clampedZ = pushed.z;
    }
    
    if (this.isInsideTable(clampedX, clampedZ, this.table2Bounds)) {
      const pushed = this.pushOutOfTable(clampedX, clampedZ, this.table2Bounds);
      clampedX = pushed.x;
      clampedZ = pushed.z;
    }
    
    // Ensure we're still within room bounds after pushing out of tables
    clampedX = Math.max(this.data.minX, Math.min(this.data.maxX, clampedX));
    clampedZ = Math.max(this.data.minZ, Math.min(this.data.maxZ, clampedZ));
    
    // Only update if position was changed
    if (clampedX !== pos.x || clampedZ !== pos.z) {
      this.el.setAttribute('position', {
        x: clampedX,
        y: pos.y,
        z: clampedZ
      });
    }
  }
});

// Randomize planet assignments while keeping positions the same
function randomizePlanetAssignments() {
  // Planet data: name, correct ring radius, visual radius, texture path, isSaturn
  const planetData = {
    'mercury': { correctRadius: 0.25, visualRadius: 0.015, texture: 'data/planet_textures/Mercury.jpg', isSaturn: false },
    'venus': { correctRadius: 0.35, visualRadius: 0.031, texture: 'data/planet_textures/Venus.jpg', isSaturn: false },
    'earth': { correctRadius: 0.45, visualRadius: 0.033, texture: 'data/planet_textures/Earth.jpg', isSaturn: false },
    'mars': { correctRadius: 0.55, visualRadius: 0.021, texture: 'data/planet_textures/Mars.jpg', isSaturn: false },
    'jupiter': { correctRadius: 0.7, visualRadius: 0.0814, texture: 'data/planet_textures/Jupiter.jpg', isSaturn: false },
    'saturn': { correctRadius: 0.85, visualRadius: 0.06, texture: 'data/planet_textures/Saturn.jpg', isSaturn: true },
    'uranus': { correctRadius: 1, visualRadius: 0.052, texture: 'data/planet_textures/Uranus.jpg', isSaturn: false },
    'neptune': { correctRadius: 1.15, visualRadius: 0.051, texture: 'data/planet_textures/Neptune.jpg', isSaturn: false }
  };
  
  // Get all planet elements (both spheres and entities)
  const planetElements = Array.from(document.querySelectorAll('[data-planet]'));
  
  if (planetElements.length !== 8) {
    console.warn('Expected 8 planets, found', planetElements.length);
    return;
  }
  
  // Create array of planet names and shuffle them
  const planetNames = Object.keys(planetData);
  const shuffledPlanets = [...planetNames].sort(() => Math.random() - 0.5);
  
  // Assign shuffled planets to each position
  planetElements.forEach((element, index) => {
    const assignedPlanet = shuffledPlanets[index];
    const planetInfo = planetData[assignedPlanet];
    
    // Update data-planet and data-radius attributes
    element.setAttribute('data-planet', assignedPlanet);
    element.setAttribute('data-radius', planetInfo.correctRadius);
    
    // Handle Saturn specially (it needs to be an entity with torus rings)
    if (planetInfo.isSaturn) {
      // If this element is not already an entity, we need to convert it
      if (element.tagName === 'A-SPHERE') {
        // Create new entity to replace the sphere
        const pos = element.getAttribute('position');
        const posStr = typeof pos === 'object' ? `${pos.x} ${pos.y} ${pos.z}` : pos;
        const newEntity = document.createElement('a-entity');
        newEntity.setAttribute('data-planet', assignedPlanet);
        newEntity.setAttribute('data-radius', planetInfo.correctRadius);
        newEntity.setAttribute('data-ring-index', element.getAttribute('data-ring-index'));
        newEntity.setAttribute('class', 'draggable');
        newEntity.setAttribute('position', posStr);
        
        // Create Saturn sphere
        const saturnSphere = document.createElement('a-sphere');
        saturnSphere.setAttribute('position', '0 0 0');
        saturnSphere.setAttribute('radius', planetInfo.visualRadius);
        saturnSphere.setAttribute('src', planetInfo.texture);
        const rotationAnim = document.createElement('a-animation');
        rotationAnim.setAttribute('attribute', 'rotation');
        rotationAnim.setAttribute('to', '0 360 0');
        rotationAnim.setAttribute('dur', '4000');
        rotationAnim.setAttribute('repeat', 'indefinite');
        saturnSphere.appendChild(rotationAnim);
        newEntity.appendChild(saturnSphere);
        
        // Add Saturn's rings (25 torus rings)
        const ringColors = ['#F5E6D3', '#E8D5C0', '#FFF8E7', '#D2B48C', '#FDF5E6', '#C9A882', '#EDE0D0', '#E3D0BB', '#B8956A', '#FAF0E6', '#DDC5B0', '#F0E6D2', '#C4A37A', '#D8C0A5', '#FFF8E7', '#BF9E72', '#E8D5C0', '#CDB48C', '#F5E6D3', '#B3905A', '#D2B48C', '#FFF8E7', '#E3D0BB', '#A0825D', '#FDF5E6'];
        const ringRadii = [0.082, 0.083, 0.085, 0.087, 0.088, 0.09, 0.092, 0.093, 0.095, 0.097, 0.099, 0.10, 0.102, 0.104, 0.105, 0.107, 0.109, 0.11, 0.112, 0.114, 0.116, 0.117, 0.119, 0.121, 0.122];
        ringRadii.forEach((radius, i) => {
          const torus = document.createElement('a-torus');
          torus.setAttribute('position', '0 0 0');
          torus.setAttribute('rotation', '-90 0 0');
          torus.setAttribute('radius', radius);
          torus.setAttribute('radius-tubular', '0.003');
          torus.setAttribute('scale', '1 1 0.1');
          torus.setAttribute('segments-tubular', '70');
          torus.setAttribute('color', ringColors[i]);
          torus.setAttribute('arc', '360');
          newEntity.appendChild(torus);
        });
        
        // Replace the sphere with the entity
        element.parentNode.replaceChild(newEntity, element);
      } else {
        // Already an entity, just update the sphere inside and keep rings
        const sphere = element.querySelector('a-sphere');
        if (sphere) {
          sphere.setAttribute('radius', planetInfo.visualRadius);
          sphere.setAttribute('src', planetInfo.texture);
        }
      }
    } else {
      // Not Saturn - should be a sphere
      if (element.tagName === 'A-ENTITY') {
        // Convert entity to sphere (remove Saturn rings)
        const pos = element.getAttribute('position');
        const posStr = typeof pos === 'object' ? `${pos.x} ${pos.y} ${pos.z}` : pos;
        const ringIndex = element.getAttribute('data-ring-index');
        const newSphere = document.createElement('a-sphere');
        newSphere.setAttribute('data-planet', assignedPlanet);
        newSphere.setAttribute('data-radius', planetInfo.correctRadius);
        newSphere.setAttribute('data-ring-index', ringIndex);
        newSphere.setAttribute('class', 'draggable');
        newSphere.setAttribute('position', posStr);
        newSphere.setAttribute('radius', planetInfo.visualRadius);
        newSphere.setAttribute('src', planetInfo.texture);
        const rotationAnim = document.createElement('a-animation');
        rotationAnim.setAttribute('attribute', 'rotation');
        rotationAnim.setAttribute('to', '0 360 0');
        rotationAnim.setAttribute('dur', '5000');
        rotationAnim.setAttribute('repeat', 'indefinite');
        newSphere.appendChild(rotationAnim);
        element.parentNode.replaceChild(newSphere, element);
      } else {
        // Already a sphere, just update attributes
        element.setAttribute('radius', planetInfo.visualRadius);
        element.setAttribute('src', planetInfo.texture);
        // Update animation duration (optional, for variety)
        const anim = element.querySelector('a-animation');
        if (anim) {
          anim.setAttribute('dur', (5000 + Math.random() * 5000).toString());
        }
      }
    }
  });
}

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
  
  // Check if a ring is occupied by another planet (not the one being dragged)
  function isRingOccupied(ringRadius, excludingPlanet = null) {
    const planets = document.querySelectorAll('[data-planet]');
    for (const planet of planets) {
      // Skip the planet being dragged
      if (planet === excludingPlanet) continue;
      
      // Check if this planet is on a ring
      const currentRing = planet.getAttribute('data-current-ring');
      if (currentRing !== null) {
        const currentRingRadius = parseFloat(currentRing);
        // Check if it's on the same ring (within small tolerance)
        if (Math.abs(currentRingRadius - ringRadius) < 0.05) {
          return true;
        }
      }
    }
    return false;
  }
  
  // Get closest ring and snap position
  function getClosestRing(point, snapThreshold = 0.2, excludingPlanet = null) {
    const rings = getAllRings();
    let closestRing = null;
    let minDistance = Infinity;
    let snapPosition = null;
    
    // Calculate distance from center
    const distanceFromCenter = Math.sqrt(point.x * point.x + point.z * point.z);
    
    rings.forEach(ring => {
      const distance = distanceToRing(point, ring.radius);
      if (distance < minDistance && distance < snapThreshold) {
        // Check if this ring is occupied by another planet
        if (isRingOccupied(ring.radius, excludingPlanet)) {
          return; // Skip this ring, it's occupied
        }
        
        minDistance = distance;
        closestRing = ring;
        
        // Calculate angle on the ring
        // If point is at center (0,0), use angle 0 to place planet at (ringRadius, 0, 0)
        let angle = 0;
        if (distanceFromCenter > 0.01) {
          angle = Math.atan2(point.z, point.x);
        }
        
        snapPosition = {
          x: Math.cos(angle) * ring.radius,
          y: point.y, // Keep the y position (table height)
          z: Math.sin(angle) * ring.radius
        };
        
        // Ensure snap position is not at the center (sun position)
        const snapDistanceFromCenter = Math.sqrt(snapPosition.x * snapPosition.x + snapPosition.z * snapPosition.z);
        if (snapDistanceFromCenter < 0.2) {
          // If somehow the snap position is too close to center, don't snap
          return;
        }
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
  
  // Puzzle progression state
  const puzzleOrder = ['solar-system', 'blackboard', 'table-2', 'star-background'];
  const puzzleState = {
    'solar-system': false,
    'blackboard': false,
    'table-2': false,
    'star-background': false
  };
  
  // Helper function to get the next available puzzle
  function getNextAvailablePuzzle() {
    for (const puzzleId of puzzleOrder) {
      if (!puzzleState[puzzleId]) {
        return puzzleId;
      }
    }
    return null; // All puzzles completed
  }
  
  // Star lamp management functions
  function animateCompletedStarLamp(lampId) {
    const lampEntity = document.getElementById(lampId);
    if (!lampEntity) {
      console.warn(`Star lamp ${lampId} not found`);
      return;
    }
    
    // Find the star_polyhedron model entity to animate
    // For star-lamp-6, it's the direct child model
    // For star-lamps 7-11, animate the currently visible model (unlit or lit)
    let modelEntity = null;
    
    if (lampId === 'star-lamp-6') {
      // For star-lamp-6, find the direct child model entity
      const children = Array.from(lampEntity.children);
      modelEntity = children.find(child => child.hasAttribute('gltf-model') && 
        child.getAttribute('gltf-model') === 'data/models/star_polyhedron.glb');
    } else {
      // For other lamps, find the currently visible model (should be lit model if puzzle is completed)
      // But if it's not lit yet, animate the unlit model
      const litModel = lampEntity.querySelector('.star-lamp-lit');
      const unlitModel = lampEntity.querySelector('.star-lamp-unlit');
      
      // Prefer lit model if it exists, otherwise use unlit model
      modelEntity = litModel || unlitModel;
    }
    
    if (!modelEntity) {
      console.warn(`Star polyhedron model not found for ${lampId}. Children:`, Array.from(lampEntity.children).map(c => c.tagName + ' ' + (c.getAttribute('class') || '')));
      return;
    }
    
    // Check if animation already exists
    if (modelEntity.querySelector('a-animation[attribute="rotation"]')) {
      console.log(`Animation already exists for ${lampId}`);
      return; // Already animated
    }
    
    // Get current rotation of the model entity
    // A-Frame rotation can be an object {x, y, z} or a string "x y z"
    let currentRot = modelEntity.getAttribute('rotation');
    let rotX = 0, rotY = 0, rotZ = 0;
    
    if (currentRot) {
      if (typeof currentRot === 'object') {
        rotX = currentRot.x || 0;
        rotY = currentRot.y || 0;
        rotZ = currentRot.z || 0;
      } else if (typeof currentRot === 'string') {
        const parts = currentRot.split(' ').map(parseFloat);
        rotX = parts[0] || 0;
        rotY = parts[1] || 0;
        rotZ = parts[2] || 0;
      }
    }
    
    // Ensure rotation is set on the model entity (A-Frame needs this)
    if (!currentRot) {
      modelEntity.setAttribute('rotation', `${rotX} ${rotY} ${rotZ}`);
    }
    
    // Determine rotation direction: positive for star-lamp-6, 9, 11; negative for others
    const positiveRotationLamps = ['star-lamp-6', 'star-lamp-9', 'star-lamp-11'];
    const isPositiveRotation = positiveRotationLamps.includes(lampId);
    const rotationDelta = isPositiveRotation ? 360 : -360;
    const rotationTo = `${rotX} ${rotY + rotationDelta} ${rotZ}`;
    
    // Try using the animation component directly via setAttribute
    // This is more reliable than creating a-animation elements
    try {
      modelEntity.setAttribute('animation__rotate', {
        property: 'rotation',
        to: rotationTo,
        dur: 15000,
        loop: true,
        easing: 'linear'
      });
      console.log(`Added ${isPositiveRotation ? 'positive' : 'negative'} rotation animation component to star_polyhedron model in ${lampId}`);
    } catch (e) {
      // Fallback to a-animation element if component doesn't work
      console.log(`Animation component failed, using a-animation element:`, e);
      const animation = document.createElement('a-animation');
      animation.setAttribute('attribute', 'rotation');
      animation.setAttribute('from', `${rotX} ${rotY} ${rotZ}`);
      animation.setAttribute('to', rotationTo);
      animation.setAttribute('dur', '15000');
      animation.setAttribute('repeat', 'indefinite');
      animation.setAttribute('easing', 'linear');
      modelEntity.appendChild(animation);
    }
    
    console.log(`Added ${isPositiveRotation ? 'positive' : 'negative'} rotation animation to star_polyhedron model in ${lampId} (from ${rotX} ${rotY} ${rotZ} to ${rotationTo})`);
  }
  
  function updateStarLampsForPuzzle(puzzleId) {
    const lampMapping = {
      'blackboard': ['star-lamp-10', 'star-lamp-11'], // Constellation drawing puzzle
      'table-2': ['star-lamp-7'], // Zodiac puzzle
      'star-background': ['star-lamp-8', 'star-lamp-9'] // Star background puzzle
    };
    
    const lampIds = lampMapping[puzzleId];
    if (!lampIds) {
      console.warn(`No lamp mapping for puzzle: ${puzzleId}`);
      return;
    }
    
    lampIds.forEach(lampId => {
      const lampEntity = document.getElementById(lampId);
      if (!lampEntity) {
        console.warn(`Star lamp ${lampId} not found`);
        return;
      }
      
      // Find unlit and lit models
      const unlitModel = lampEntity.querySelector('.star-lamp-unlit');
      const litModel = lampEntity.querySelector('.star-lamp-lit');
      
      if (!unlitModel || !litModel) {
        console.warn(`Star lamp ${lampId} missing unlit or lit model`);
        return;
      }
      
      // Transfer animation from unlit to lit model if it exists
      const unlitAnimation = unlitModel.querySelector('a-animation[attribute="rotation"]');
      if (unlitAnimation) {
        // Get animation properties
        const toValue = unlitAnimation.getAttribute('to');
        const dur = unlitAnimation.getAttribute('dur');
        // Remove animation from unlit model
        unlitAnimation.remove();
        // Add animation to lit model
        const litAnimation = document.createElement('a-animation');
        litAnimation.setAttribute('attribute', 'rotation');
        litAnimation.setAttribute('to', toValue);
        litAnimation.setAttribute('dur', dur);
        litAnimation.setAttribute('repeat', 'indefinite');
        litAnimation.setAttribute('easing', 'linear');
        litModel.appendChild(litAnimation);
      }
      
      // Hide unlit model, show lit model
      unlitModel.setAttribute('visible', 'false');
      litModel.setAttribute('visible', 'true');
      
      // Enable light on lit model
      const lightEntity = litModel.querySelector('a-light');
      if (lightEntity) {
        lightEntity.setAttribute('intensity', '10'); // Enable light
      }
      
      console.log(`Turned on star lamp ${lampId} for puzzle ${puzzleId}`);
    });
  }
  
  // Proximity UI state
  let proximityUI = null;
  let isNearSolarSystem = false;
  let isNearTable2 = false;
  let isNearBlackboard = false;
  let isNearStarBackground = false;
  let isNearDoor = false;
  let isNearCase = false;
  let currentTable = null; // Track which table we're near ('solar-system', 'table-2', 'blackboard', 'star-background', 'door', or 'case')
  const PROXIMITY_THRESHOLD = 4; // Distance threshold to show UI
  let isGameEnded = false; // Flag to prevent UI from showing after fade to black
  
  // Door/Key/Case state
  let hasKey = false;
  let caseIsOpen = false;
  let doorEntity = null;
  let caseEntity = null;
  let keyEntity = null;
  
  // Make caseIsOpen accessible to components via update function
  window.updateCaseIsOpen = function(value) {
    caseIsOpen = value;
    console.log('caseIsOpen updated to:', value);
    // Force proximity check update after case opens
    if (value === true) {
      setTimeout(() => {
        checkProximity();
      }, 100);
    }
  };
  
  // Completion message UI state
  let completionMessageUI = null;
  let completionText = null;
  let completionMessageTimeout = null;
  
  // Key message UI state (HTML UI)
  let keyMessageUI = null;
  let keyMessageTimeout = null;
  
  // Guide button UI state
  let guideButton = null;
  let guideOverlay = null;
  let guideText = null;
  let isGuideOverlayVisible = false;
  
  // Camera view state
  let isTopDownView = false;
  let isBlackboardView = false;
  let isStarBackgroundView = false;
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
    'air': false,
    'earth': false,
    'fire': false,
    'water': false
  }; // Track which spheres are correctly placed
  
  // Image data with isModelOn flag for each image
  const imageData = [
    { x: -1.5, z: -3.500, width: 0.8, height: 0.612, element: 'air', isModelOn: false },
    { x: -0.5, z: -3.500, width: 0.8, height: 0.612, element: 'earth', isModelOn: false },
    { x: 0.5, z: -3.500, width: 0.8, height: 0.612, element: 'fire', isModelOn: false },
    { x: 1.5, z: -3.500, width: 0.8, height: 0.612, element: 'water', isModelOn: false }
  ];
  
  // Track which image element each sphere is snapped to (sphere -> imageElement)
  let sphereToImageElement = new Map();
  
  let isDragging = false;
  let raycaster = null;
  let mouse = null;
  
  // Constellation game state
  let firstSelectedStar = null; // Track the first clicked star (null when none selected)
  let constellationConnections = new Set(); // Track all connections made (to prevent duplicates)
  let hoveredStar = null; // Track currently hovered star
  let hoveredLine = null; // Track currently hovered line
  
  // Constellation data structure
  const constellations = {
    centaurus: {
      name: 'Centaurus',
      stars: [
        { name: 'iota-centauri', position: '-0.4656 1.2579 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'd-centauri', position: '-0.5303 0.9496 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'menkent', position: '-1.2610 0.8656 0.01', radius: 0.02, emissive: 1.0 },
        { name: 'nu-centauri', position: '-0.7221 0.6371 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'mu-centauri', position: '-0.6768 0.5616 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'eta-centauri', position: '-1.3703 0.0723 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'kappa-centauri', position: '-1.6958 -0.1993 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'upsilon-centauri', position: '-0.6941 0.2620 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'zeta-centauri', position: '-0.5216 0.0658 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'gamma-centauri', position: '0.5907 0.4754 0.01', radius: 0.025, emissive: 1.0 },
        { name: 'sigma-centauri', position: '0.8300 0.4064 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'delta-centauri', position: '1.1260 0.4366 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'a-centauri', position: '1.6520 0.1089 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'lambda-centauri', position: '1.6951 -0.7361 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'epsilon-centauri', position: '-0.0316 -0.3093 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'hadar', position: '0.0503 -1.0357 0.01', radius: 0.02, emissive: 1.0 },
        { name: 'alpha-centauri', position: '-0.2558 -1.3289 0.01', radius: 0.02, emissive: 1.0 }
      ],
      connections: [
        ['menkent', 'nu-centauri'],
        ['d-centauri', 'nu-centauri'],
        ['d-centauri', 'iota-centauri'],
        ['mu-centauri', 'nu-centauri'],
        ['mu-centauri', 'upsilon-centauri'],
        ['eta-centauri', 'kappa-centauri'],
        ['upsilon-centauri', 'zeta-centauri'],
        ['gamma-centauri', 'sigma-centauri'],
        ['delta-centauri', 'sigma-centauri'],
        ['a-centauri', 'delta-centauri'],
        ['a-centauri', 'lambda-centauri'],
        ['epsilon-centauri', 'zeta-centauri'],
        ['epsilon-centauri', 'hadar'],
        ['alpha-centauri', 'hadar'],
        ['gamma-centauri', 'zeta-centauri'],
        ['eta-centauri', 'mu-centauri']
      ]
    },
    hydra: {
      name: 'Hydra',
      stars: [
        { name: 'gamma-hydrae', position: '-3.4472 -0.9362 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'psi-hydrae', position: '-3.2252 -0.8953 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'beta-hydrae', position: '-1.4423 -1.8330 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'xi-hydrae', position: '-1.0391 -1.6196 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'nu-hydrae', position: '-0.0431 -0.1516 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'mu-hydrae', position: '0.4872 -0.2421 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'lambda-hydrae', position: '0.8861 0.1373 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'upsilon-hydrae', position: '1.2914 -0.1365 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'alphard', position: '1.9295 0.3766 0.01', radius: 0.025, emissive: 1.0 },
        { name: 'tau-1-hydrae', position: '1.9511 0.9608 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'tau-2-hydrae', position: '1.9036 1.1246 0.01', radius: 0.02, emissive: 0.9 },
        { name: '22-hydrae', position: '2.3693 1.4272 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'zeta-hydrae', position: '2.8759 1.7450 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'rho-hydrae', position: '3.0441 1.7134 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'epsilon-hydrae', position: '3.1052 1.7835 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'delta-hydrae', position: '3.3362 1.6819 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'sigma-hydrae', position: '3.2834 1.4458 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'eta-hydrae', position: '3.1611 1.4587 0.01', radius: 0.02, emissive: 0.9 }
      ],
      connections: [
        ['gamma-hydrae', 'psi-hydrae'],
        ['beta-hydrae', 'psi-hydrae'],
        ['beta-hydrae', 'xi-hydrae'],
        ['nu-hydrae', 'xi-hydrae'],
        ['mu-hydrae', 'nu-hydrae'],
        ['lambda-hydrae', 'mu-hydrae'],
        ['lambda-hydrae', 'upsilon-hydrae'],
        ['alphard', 'upsilon-hydrae'],
        ['alphard', 'tau-1-hydrae'],
        ['tau-1-hydrae', 'tau-2-hydrae'],
        ['22-hydrae', 'tau-2-hydrae'],
        ['22-hydrae', 'zeta-hydrae'],
        ['delta-hydrae', 'epsilon-hydrae'],
        ['delta-hydrae', 'sigma-hydrae'],
        ['eta-hydrae', 'sigma-hydrae'],
        ['eta-hydrae', 'rho-hydrae'],
        ['rho-hydrae', 'zeta-hydrae'],
        ['epsilon-hydrae', 'rho-hydrae']
      ]
    },
    cetus: {
      name: 'Cetus',
      stars: [
        { name: 'xi-1-ceti', position: '0.494 1.286 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'xi-2-ceti', position: '0.197 1.495 0.01', radius: 0.02, emissive: 0.9 },
        { name: '87-ceti', position: '0 1.876 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'lambda-ceti', position: '-0.361 2.019 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'alpha-ceti', position: '-0.703 1.700 0.01', radius: 0.025, emissive: 1.0 },
        { name: 'gamma-ceti', position: '-0.404 1.344 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'nu-ceti', position: '-0.123 1.399 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'delta-ceti', position: '-0.513 1.064 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'omicron-ceti', position: '-0.361 0.510 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'epsilon-ceti', position: '-1.290 0.152 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'pi-ceti', position: '-1.450 0.070 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'sigma-ceti', position: '-1.320 -0.207 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'tau-ceti', position: '-0.490 -0.957 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'diphda', position: '0.390 -2.021 0.01', radius: 0.025, emissive: 1.0 },
        { name: 'iota-ceti', position: '1.440 -1.771 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'eta-ceti', position: '0.480 -1.075 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'theta-ceti', position: '0.330 -0.699 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'zeta-ceti', position: '-0.290 -0.437 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'rho-ceti', position: '-1.030 -0.072 0.01', radius: 0.02, emissive: 0.9 }
      ],
      connections: [
        ['xi-1-ceti', 'xi-2-ceti'],
        ['87-ceti', 'xi-2-ceti'],
        ['nu-ceti', 'xi-2-ceti'],
        ['gamma-ceti', 'nu-ceti'],
        ['alpha-ceti', 'gamma-ceti'],
        ['alpha-ceti', 'lambda-ceti'],
        ['87-ceti', 'lambda-ceti'],
        ['delta-ceti', 'gamma-ceti'],
        ['delta-ceti', 'omicron-ceti'],
        ['epsilon-ceti', 'omicron-ceti'],
        ['epsilon-ceti', 'pi-ceti'],
        ['pi-ceti', 'sigma-ceti'],
        ['sigma-ceti', 'tau-ceti'],
        ['diphda', 'tau-ceti'],
        ['diphda', 'iota-ceti'],
        ['epsilon-ceti', 'rho-ceti'],
        ['rho-ceti', 'zeta-ceti'],
        ['theta-ceti', 'zeta-ceti'],
        ['eta-ceti', 'theta-ceti'],
        ['diphda', 'eta-ceti']
      ]
    },
    canisMajor: {
      name: 'Canis Major',
      stars: [
        { name: 'theta-canis-majoris', position: '0.5497 0.7553 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'gamma-canis-majoris', position: '0.1502 0.6532 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'iota-canis-majoris', position: '0.1947 0.4348 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'alpha-canis-majoris', position: '0.4006 0.2932 0.01', radius: 0.025, emissive: 1.0 },
        { name: 'omicron-2-canis-majoris', position: '-0.3442 0.0683 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'delta-canis-majoris', position: '-0.5914 -0.0337 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'omega-canis-majoris', position: '-0.7179 0.0324 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'eta-canis-majoris', position: '-1.0240 -0.0366 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'sigma-canis-majoris', position: '-0.5771 -0.2205 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'epsilon-canis-majoris', position: '-0.5986 -0.3254 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'kappa-canis-majoris', position: '-0.6949 -0.7221 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'zeta-canis-majoris', position: '-0.1013 -1.0023 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'omicron-1-canis-majoris', position: '-0.2178 -0.0811 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'nu-2-canis-majoris', position: '0.3744 -0.0064 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'xi-2-canis-majoris', position: '0.1516 -0.2637 0.01', radius: 0.02, emissive: 0.9 },
        { name: 'beta-canis-majoris', position: '0.6820 -0.1300 0.01', radius: 0.025, emissive: 1.0 }
      ],
      connections: [
        ['gamma-canis-majoris', 'theta-canis-majoris'],
        ['gamma-canis-majoris', 'iota-canis-majoris'],
        ['iota-canis-majoris', 'theta-canis-majoris'],
        ['alpha-canis-majoris', 'iota-canis-majoris'],
        ['alpha-canis-majoris', 'omicron-2-canis-majoris'],
        ['delta-canis-majoris', 'omicron-2-canis-majoris'],
        ['delta-canis-majoris', 'omega-canis-majoris'],
        ['eta-canis-majoris', 'omega-canis-majoris'],
        ['delta-canis-majoris', 'sigma-canis-majoris'],
        ['nu-2-canis-majoris', 'omicron-1-canis-majoris'],
        ['nu-2-canis-majoris', 'xi-2-canis-majoris'],
        ['alpha-canis-majoris', 'nu-2-canis-majoris'],
        ['beta-canis-majoris', 'nu-2-canis-majoris'],
        ['epsilon-canis-majoris', 'kappa-canis-majoris'],
        ['epsilon-canis-majoris', 'zeta-canis-majoris'],
        ['epsilon-canis-majoris', 'sigma-canis-majoris'],
        ['omicron-1-canis-majoris', 'sigma-canis-majoris']
      ]
    }
  };
  
  // Selected constellation (will be set randomly on initialization)
  let selectedConstellation = null;
  let correctConnections = [];
  
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
  
  // Helper function to get star background world position (center of image)
  function getStarBackgroundWorldPosition() {
    const starImage = document.getElementById('star-background-image');
    if (!starImage) return { x: -6.53, y: 3.2, z: -13.455 };
    
    const starPos = starImage.getAttribute('position');
    return {
      x: starPos.x,
      y: starPos.y,
      z: starPos.z
    };
  }
  
  // Get image data for a given element
  function getImageDataForElement(element) {
    return imageData.find(img => img.element === element) || null;
  }

  // Check if a sphere position is over any image on table-2
  // Returns the element name if over an image, null otherwise
  function getImageAtPosition(spherePosition) {
    // Check if sphere is within bounds of any image
    // Images are rotated -90 on X and 180 on Y, so they're flat
    // We check X and Z bounds (Y doesn't matter since images are flat)
    for (const image of imageData) {
      const halfWidth = image.width / 2;
      const halfHeight = image.height / 2;
      
      // Check if sphere is within image bounds
      if (spherePosition.x >= image.x - halfWidth &&
          spherePosition.x <= image.x + halfWidth &&
          spherePosition.z >= image.z - halfHeight &&
          spherePosition.z <= image.z + halfHeight) {
        return image.element;
      }
    }
    
    return null;
  }
  
  // Sync isModelOn flags in imageData based on sphereToImageElement map
  function syncImageModelStates() {
    // First, reset all isModelOn flags to false
    for (const imgData of imageData) {
      imgData.isModelOn = false;
    }
    
    // Then, set isModelOn to true for images that have spheres snapped to them
    for (const [sphere, imageElement] of sphereToImageElement.entries()) {
      const imgData = getImageDataForElement(imageElement);
      if (imgData) {
        imgData.isModelOn = true;
      }
    }
  }
  
  // Check if all zodiac symbols are correctly placed
  function checkAllSpheresPlaced() {
    const allPlaced = Object.values(sphereCorrectPlacements).every(placed => placed === true);
    if (allPlaced) {
      console.log('All zodiac symbols are placed on their correct element images!');
      // Mark puzzle as solved
      puzzleState['table-2'] = true;
      // Animate completed star lamp
      animateCompletedStarLamp('star-lamp-7');
      // Turn on star lamps for next puzzle (star background)
      updateStarLampsForPuzzle('star-background');
      // Auto-exit puzzle mode immediately
      switchToOriginalView();
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
        // Mark puzzle as solved
        puzzleState['solar-system'] = true;
        // Animate completed star lamp
        animateCompletedStarLamp('star-lamp-6');
        // Turn on star lamps for next puzzle (constellation drawing)
        updateStarLampsForPuzzle('blackboard');
        // Auto-exit puzzle mode
        setTimeout(() => {
          switchToOriginalView();
        }, 500);
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
    let cameraY = 2.750; // Default y position
    if (tableId === 'table-2') {
      // For table-2, position camera above the table (same Z as table top center)
      cameraZ = worldZ;
      cameraY = 3.153; // Y position for zodiac symbols puzzle mode
    } else {
      // For solar system table, use fixed Z position
      cameraZ = -18.500;
      cameraY = 3.153; // Y position for solar system puzzle mode
    }
    
    const topDownPosition = {
      x: worldX,
      y: cameraY,
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
    
    // Hide completion message when switching views
    hideCompletionMessage();
    
    isTopDownView = true;
    topDownViewTableId = tableId; // Store which table we're viewing
    window.isTopDownView = true;
    
    // Show Guide button when entering puzzle mode
    showGuideButton();
    
    console.log('Switched to top-down view for table:', tableId);
  }
  
  // Switch to star background view
  function switchToStarBackgroundView() {
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl) return;
    
    // Get star background position
    const starPos = getStarBackgroundWorldPosition();
    
    // Position camera: x = -3, y = 2.5, same z as star background (looking from right side of room)
    const starBackgroundViewPosition = {
      x: -3, // Camera x position (to the right of the image, facing left)
      y: 2.5, // Camera y position (at wall height)
      z: -13.455 // Same z as star background
    };
    
    // Fixed rotation for star background view
    const starBackgroundViewRotation = { x: 0, y: 90, z: 0 };
    
    // Store rotation for lock-rotation component
    window.starBackgroundViewRotation = starBackgroundViewRotation;
    
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
    
    // Set rotation immediately (before animation) so camera looks at star background from the start
    cameraEl.setAttribute('rotation', `${starBackgroundViewRotation.x} ${starBackgroundViewRotation.y} ${starBackgroundViewRotation.z}`);
    
    // Animate camera to star background view position (rotation is already set)
    cameraEl.setAttribute('animation__position', {
      property: 'position',
      to: `${starBackgroundViewPosition.x} ${starBackgroundViewPosition.y} ${starBackgroundViewPosition.z}`,
      dur: 500,
      easing: 'easeInOutCubic'
    });
    
    // Also animate rotation to ensure smooth transition (though it's already set)
    cameraEl.setAttribute('animation__rotation', {
      property: 'rotation',
      to: `${starBackgroundViewRotation.x} ${starBackgroundViewRotation.y} ${starBackgroundViewRotation.z}`,
      dur: 500,
      easing: 'easeInOutCubic'
    });
    
    // After animation completes, ensure position and rotation are set correctly
    setTimeout(() => {
      cameraEl.setAttribute('position', {
        x: starBackgroundViewPosition.x,
        y: starBackgroundViewPosition.y,
        z: starBackgroundViewPosition.z
      });
      cameraEl.setAttribute('rotation', `${starBackgroundViewRotation.x} ${starBackgroundViewRotation.y} ${starBackgroundViewRotation.z}`);
    }, 500);
    
    // Add component to continuously lock rotation
    if (!cameraEl.hasAttribute('lock-rotation')) {
      cameraEl.setAttribute('lock-rotation', '');
    }
    
    // Hide proximity UI in star background view
    if (proximityUI) {
      if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
        proximityUI.setAttribute('visible', 'false');
      } else {
        proximityUI.classList.add('hidden');
      }
    }
    
    
    // Hide completion message when switching views
    hideCompletionMessage();
    
    isStarBackgroundView = true;
    window.isTopDownView = false; // Not top-down, but locked view
    window.isBlackboardView = false; // Not blackboard view
    window.isStarBackgroundView = true; // Set global flag for lock-rotation component
    
    // Show Guide button when entering puzzle mode
    showGuideButton();
    
    console.log('Switched to star background view');
  }
  
  // Switch to blackboard view
  function switchToBlackboardView() {
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl) return;
    
    // Get blackboard position
    const blackboardPos = getBlackboardWorldPosition();
    
    // Position camera: x = 4, same y and z as blackboard
    const blackboardViewPosition = {
      x: 4.4, // Camera x position
      y: 2.887, // Same y as blackboard
      z: -13.454 // Same z as blackboard
    };
    
    // Set fixed rotation for constellation puzzle mode
    const blackboardViewRotation = { x: 0, y: -90, z: 0 };
    
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
    
    // Hide completion message when switching views
    hideCompletionMessage();
    
    isBlackboardView = true;
    window.isTopDownView = false; // Not top-down, but locked view
    window.isBlackboardView = true; // Set global flag for lock-rotation component
    
    // Show Guide button when entering puzzle mode
    showGuideButton();
    
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
        // Check if sphere was snapped to an image and clear isModelOn flag
        const previousImageElement = sphereToImageElement.get(draggedSphere);
        if (previousImageElement) {
          const imgData = getImageDataForElement(previousImageElement);
          if (imgData) {
            imgData.isModelOn = false;
          }
          sphereToImageElement.delete(draggedSphere);
        }
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
    
    // Reset star background view state
    isStarBackgroundView = false;
    window.isStarBackgroundView = false;
    window.starBackgroundViewRotation = null;
    
    // Reset hovered arrow when leaving star background view
    if (hoveredArrow) {
      hoveredArrow.setAttribute('color', '#000000');
      hoveredArrow = null;
    }
    
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
    
    // Hide Guide button when exiting puzzle mode
    hideGuideButton();
    
    // Show proximity UI again if near a table, blackboard, or star background (only if it's the next available puzzle)
    const nextAvailablePuzzle = getNextAvailablePuzzle();
    const isCurrentPuzzleAvailable = currentTable === nextAvailablePuzzle && !puzzleState[currentTable];
    if (proximityUI && (isNearSolarSystem || isNearTable2 || isNearBlackboard || isNearStarBackground) && isCurrentPuzzleAvailable) {
      if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
        proximityUI.setAttribute('visible', 'true');
      } else {
        proximityUI.classList.remove('hidden');
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
      // Ignore E key when in puzzle solve mode - nothing should happen
      if (isTopDownView || isBlackboardView || isStarBackgroundView) {
        return;
      }
      
      console.log('E key pressed - isNearSolarSystem:', isNearSolarSystem, 'isNearTable2:', isNearTable2, 'isNearBlackboard:', isNearBlackboard, 'isNearStarBackground:', isNearStarBackground, 'isNearDoor:', isNearDoor, 'isNearCase:', isNearCase, 'hasKey:', hasKey, 'currentTable:', currentTable, 'isTopDownView:', isTopDownView, 'isBlackboardView:', isBlackboardView, 'isStarBackgroundView:', isStarBackgroundView);
      
      // Check for door/case interactions first (only when not in special views)
      if (!isTopDownView && !isBlackboardView && !isStarBackgroundView) {
        // Check if near door
        if (isNearDoor && currentTable === 'door') {
          if (hasKey) {
            // Player has key, unlock door and fade to black
            fadeToBlack();
          } else {
            // Player doesn't have key, show message
            showTemporaryMessage('Key needed to unlock door');
          }
          return;
        }
        
        // Check if near case and case is open
        if (isNearCase && currentTable === 'case' && caseIsOpen && !hasKey) {
          // Pick up key
          if (keyEntity) {
            keyEntity.setAttribute('visible', 'false');
            hasKey = true;
            console.log('Key picked up');
            // Hide proximity UI
            if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
              proximityUI.setAttribute('visible', 'false');
            } else {
              proximityUI.classList.add('hidden');
            }
            currentTable = null;
          }
          return;
        }
      }
      
      // Enter puzzle mode (only when not already in puzzle mode - checked at top of function)
      {
        // Get the next available puzzle
        const nextAvailablePuzzle = getNextAvailablePuzzle();
        const isCurrentPuzzleAvailable = currentTable === nextAvailablePuzzle && !puzzleState[currentTable];
        
        // Only allow entering puzzle mode if this is the next available puzzle
        if (!isCurrentPuzzleAvailable) {
          console.log('E key pressed but puzzle not available yet. Next available:', nextAvailablePuzzle);
          return;
        }
        
        // Check if near star background
        if (isNearStarBackground && currentTable === 'star-background') {
          // Save current camera position and rotation BEFORE switching to star background view
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
          switchToStarBackgroundView();
        }
        // Check if near blackboard
        else if (isNearBlackboard && currentTable === 'blackboard') {
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
          console.log('E key pressed but not near any table, blackboard, or star background');
        }
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
    // Use HTML-based proximity UI (screen overlay, not affected by lighting)
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
    
    // Ensure UI starts hidden (will be shown by checkProximity when needed)
    proximityUI.classList.add('hidden');
    
    // Start checking proximity
    checkProximity();
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
  
  // Initialize Key Message UI (HTML UI)
  function initKeyMessageUI() {
    keyMessageUI = document.getElementById('key-message-ui');
    if (keyMessageUI) {
      console.log('Key message UI initialized');
      // Initially hide
      keyMessageUI.classList.add('hidden');
      return;
    }
    
    console.warn('Key message UI element not found - will retry');
    // Retry after a short delay in case DOM isn't ready
    setTimeout(() => {
      initKeyMessageUI();
    }, 200);
  }
  
  // Initialize Guide Button UI
  function initGuideButtonUI() {
    guideButton = document.getElementById('guide-button');
    guideOverlay = document.getElementById('guide-overlay');
    guideText = document.getElementById('guide-text');
    
    if (!guideButton || !guideOverlay || !guideText) {
      console.warn('Guide button UI elements not found - will retry');
      // Retry after a short delay in case DOM isn't ready
      setTimeout(() => {
        initGuideButtonUI();
      }, 200);
      return;
    }
    
    // Add click event listener to Guide button
    guideButton.addEventListener('click', handleGuideButtonClick);
    
    // Initially hide Guide button and overlay
    guideButton.classList.add('hidden');
    guideOverlay.classList.add('hidden');
    
    console.log('Guide button UI initialized');
  }
  
  // Get guide text based on current puzzle type
  function getGuideTextForPuzzle() {
    if (isTopDownView) {
      // Determine which table we're viewing
      if (topDownViewTableId === 'table-2') {
        return 'Drag each zodiac sign object to its matching element.';
      } else {
        return 'Drag each planet onto its corresponding ring in the correct order from the Sun.';
      }
    } else if (isBlackboardView) {
      return 'Draw the correct southern hemisphere star constellation. Click two stars to connect them. Click a line to remove it.';
    } else if (isStarBackgroundView) {
      return 'Look at the blue star in the northern hemisphere star constellation and choose its correct Greek letter. Use the arrows to scroll through the alphabet.';
    }
    return '';
  }
  
  // Handle Guide button click
  function handleGuideButtonClick() {
    if (!guideButton || !guideOverlay || !guideText) return;
    
    if (isGuideOverlayVisible) {
      // Hide overlay with fade-out animation
      // Remove hidden class first to ensure overlay is visible
      guideOverlay.classList.remove('hidden');
      
      // Force reflow
      guideOverlay.offsetHeight;
      
      // Start fade-out by adding hidden class (CSS transition will handle the fade)
      guideOverlay.classList.add('hidden');
      
      guideButton.textContent = 'Guide';
      isGuideOverlayVisible = false;
    } else {
      // Show overlay with fade-in animation
      const puzzleGuideText = getGuideTextForPuzzle();
      guideText.textContent = puzzleGuideText;
      
      // Remove hidden class (CSS transition will handle the fade-in)
      guideOverlay.classList.remove('hidden');
      
      guideButton.textContent = 'EXIT';
      isGuideOverlayVisible = true;
    }
  }
  
  // Show Guide button (when entering puzzle mode)
  function showGuideButton() {
    if (guideButton) {
      guideButton.classList.remove('hidden');
    }
  }
  
  // Hide Guide button (when exiting puzzle mode)
  function hideGuideButton() {
    if (guideButton) {
      guideButton.classList.add('hidden');
    }
    // Also hide overlay if it's visible
    if (guideOverlay && isGuideOverlayVisible) {
      guideOverlay.classList.add('hidden');
      if (guideButton) {
        guideButton.textContent = 'Guide';
      }
      isGuideOverlayVisible = false;
    }
  }
  
  // Show completion message (now removed - puzzles auto-exit instead)
  function showCompletionMessage(puzzleName) {
    // Don't show completion messages - puzzles will auto-exit instead
    // This function is kept for compatibility but does nothing
    return;
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
    // Also hide key message UI if it's showing
    if (keyMessageUI) {
      keyMessageUI.classList.add('hidden');
    }
    if (keyMessageTimeout) {
      clearTimeout(keyMessageTimeout);
      keyMessageTimeout = null;
    }
  }
  
  // Show temporary message (similar to completion message but for general messages)
  function showTemporaryMessage(message) {
    // Use HTML UI for key message
    if (!keyMessageUI) {
      // Try to initialize if not already done
      initKeyMessageUI();
      if (!keyMessageUI) {
        console.warn('Key message UI not available');
        return;
      }
    }
    
    // Set the message text
    const keyMessageText = keyMessageUI.querySelector('.key-message-text');
    if (keyMessageText) {
      keyMessageText.textContent = message;
    }
    
    // Show the message
    keyMessageUI.classList.remove('hidden');
    
    // Hide after 2 seconds
    if (keyMessageTimeout) {
      clearTimeout(keyMessageTimeout);
    }
    keyMessageTimeout = setTimeout(() => {
      if (keyMessageUI) {
        keyMessageUI.classList.add('hidden');
      }
    }, 2000);
  }
  
  // End game button transition state (global scope)
  let isEndGameButtonTransitioning = false;
  
  // Fade screen to black using CSS overlay
  function fadeToBlack() {
    // Set game ended flag to prevent proximity UI from showing
    isGameEnded = true;
    
    // Hide proximity UI when unlocking door
    if (proximityUI) {
      if (proximityUI.tagName && proximityUI.tagName.toLowerCase() === 'a-entity') {
        proximityUI.setAttribute('visible', 'false');
      } else {
        proximityUI.classList.add('hidden');
      }
    }
    
    // Get or create fade overlay div
    let fadeOverlay = document.getElementById('fade-overlay');
    if (!fadeOverlay) {
      // Create fade overlay div
      fadeOverlay = document.createElement('div');
      fadeOverlay.setAttribute('id', 'fade-overlay');
      document.body.appendChild(fadeOverlay);
      
      // Create end game text elements
      const endGameText = document.createElement('div');
      endGameText.setAttribute('id', 'end-game-text');
      endGameText.className = 'end-game-text hidden';
      endGameText.innerHTML = '<p>The door clicks open, revealing the way out. You step forward, the legacy of your mentor now in your hands.</p>';
      fadeOverlay.appendChild(endGameText);
      
      // Create NEXT button
      const endGameButton = document.createElement('button');
      endGameButton.setAttribute('id', 'end-game-button');
      endGameButton.className = 'end-game-button hidden';
      endGameButton.textContent = 'NEXT';
      fadeOverlay.appendChild(endGameButton);
      
      // Create final text
      const endGameFinalText = document.createElement('div');
      endGameFinalText.setAttribute('id', 'end-game-final-text');
      endGameFinalText.className = 'end-game-final-text hidden';
      endGameFinalText.innerHTML = '<p>Thank you for playing!</p><p>Reload the page to play again!</p>';
      fadeOverlay.appendChild(endGameFinalText);
      
      // Handle NEXT button click (only add listener once)
      if (!endGameButton.hasAttribute('data-listener-added')) {
        endGameButton.setAttribute('data-listener-added', 'true');
        endGameButton.addEventListener('click', (e) => {
        // Prevent click if button is transitioning or not fully visible
        if (isEndGameButtonTransitioning || 
            !endGameButton.classList.contains('fade-in') || 
            endGameButton.classList.contains('fade-out') ||
            endGameButton.style.pointerEvents === 'none') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        // Set transitioning flag immediately
        isEndGameButtonTransitioning = true;
        endGameButton.style.pointerEvents = 'none';
        
        // Fade out first text and button
        endGameText.classList.remove('fade-in');
        endGameText.classList.add('fade-out');
        endGameButton.classList.remove('fade-in');
        endGameButton.classList.add('fade-out');
        
        // After fade out completes, fade in final text
        setTimeout(() => {
          endGameText.classList.add('hidden');
          endGameButton.classList.add('hidden');
          endGameFinalText.classList.remove('hidden');
          setTimeout(() => {
            endGameFinalText.classList.add('fade-in');
          }, 100);
        }, 1000);
        });
      }
    }
    
    // Get references to end game elements
    const endGameText = document.getElementById('end-game-text');
    const endGameButton = document.getElementById('end-game-button');
    const endGameFinalText = document.getElementById('end-game-final-text');
    
    // Reset all elements
    if (endGameText) {
      endGameText.classList.remove('fade-in', 'fade-out');
      endGameText.classList.add('hidden');
    }
    if (endGameButton) {
      endGameButton.classList.remove('fade-in', 'fade-out');
      endGameButton.classList.add('hidden');
      endGameButton.style.pointerEvents = 'none';
      isEndGameButtonTransitioning = false;
    }
    if (endGameFinalText) {
      endGameFinalText.classList.remove('fade-in', 'fade-out');
      endGameFinalText.classList.add('hidden');
    }
    
    // Remove fade-in class to reset overlay
    fadeOverlay.classList.remove('fade-in');
    
    // Use requestAnimationFrame to ensure the reset is applied first
    requestAnimationFrame(() => {
      // Add fade-in class to trigger the fade (CSS transition will handle the animation)
      fadeOverlay.classList.add('fade-in');
      
      // After fade completes (1 second), show first text and button
      setTimeout(() => {
        if (endGameText) {
          endGameText.classList.remove('hidden');
          setTimeout(() => {
            endGameText.classList.add('fade-in');
          }, 100);
        }
        if (endGameButton) {
          endGameButton.classList.remove('hidden');
          setTimeout(() => {
            endGameButton.classList.add('fade-in');
            // Enable button after fade-in completes
            setTimeout(() => {
              endGameButton.style.pointerEvents = 'auto';
            }, 1000);
          }, 100);
        }
      }, 1000);
    });
    
    console.log('Fading to black...');
  }
  
  // Update proximity UI text based on what player is near
  function updateProximityUIText() {
    if (!proximityUI) return;
    
    let textValue = 'Solve Puzzle'; // Default text
    
    if (isNearDoor) {
      textValue = 'Unlock Door';
    } else if (isNearCase) {
      textValue = 'Take Key';
    } else if (currentTable === 'solar-system' || currentTable === 'table-2' || currentTable === 'blackboard' || currentTable === 'star-background') {
      textValue = 'Solve Puzzle';
    }
    
    // Combine "E " with the action text
    const combinedText = 'E ' + textValue;
    
    // Update the HTML-based proximity UI text
    const textSpan = proximityUI.querySelector('.proximity-text');
    if (textSpan) {
      textSpan.textContent = combinedText;
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
    
    // Check distance to star background
    const starBackgroundPos = getStarBackgroundWorldPosition();
    const dx4 = cameraWorldPos.x - starBackgroundPos.x;
    const dy4 = cameraWorldPos.y - starBackgroundPos.y;
    const dz4 = cameraWorldPos.z - starBackgroundPos.z;
    const distanceToStarBackground = Math.sqrt(dx4 * dx4 + dy4 * dy4 + dz4 * dz4);
    
    // Check distance to door
    const doorPos = { x: 4.958, y: 2.065, z: -19.998 };
    const dx5 = cameraWorldPos.x - doorPos.x;
    const dy5 = cameraWorldPos.y - doorPos.y;
    const dz5 = cameraWorldPos.z - doorPos.z;
    const distanceToDoor = Math.sqrt(dx5 * dx5 + dy5 * dy5 + dz5 * dz5);
    
    // Check distance to key (for "Take Key" UI)
    const keyPos = { x: -5.983, y: 1.789, z: -13.445 };
    const dx6 = cameraWorldPos.x - keyPos.x;
    const dy6 = cameraWorldPos.y - keyPos.y;
    const dz6 = cameraWorldPos.z - keyPos.z;
    const distanceToKey = Math.sqrt(dx6 * dx6 + dy6 * dy6 + dz6 * dz6);
    
    // Determine which is closer and within threshold
    const nearSolarSystem = distanceToSolarSystem <= PROXIMITY_THRESHOLD;
    const nearTable2 = distanceToTable2 <= PROXIMITY_THRESHOLD;
    const nearBlackboard = distanceToBlackboard <= PROXIMITY_THRESHOLD;
    const nearStarBackground = distanceToStarBackground <= PROXIMITY_THRESHOLD;
    const nearDoor = distanceToDoor <= PROXIMITY_THRESHOLD;
    // Key proximity uses threshold of 0.2 and only shows if case is open and key not taken
    const KEY_PROXIMITY_THRESHOLD = 2;
    const nearCase = distanceToKey <= KEY_PROXIMITY_THRESHOLD && caseIsOpen && !hasKey; // Only show if case is open and key not taken
    
    // Update state - calculate wasNearAny BEFORE updating state variables
    const wasNearAny = isNearSolarSystem || isNearTable2 || isNearBlackboard || isNearStarBackground || isNearDoor || isNearCase;
    isNearSolarSystem = nearSolarSystem;
    isNearTable2 = nearTable2;
    isNearBlackboard = nearBlackboard;
    isNearStarBackground = nearStarBackground;
    isNearDoor = nearDoor;
    isNearCase = nearCase;
    
    // Determine current table/blackboard/star background/door/case (prioritize closest if multiple are near)
    const distances = [];
    if (nearSolarSystem) distances.push({ type: 'solar-system', distance: distanceToSolarSystem });
    if (nearTable2) distances.push({ type: 'table-2', distance: distanceToTable2 });
    if (nearBlackboard) distances.push({ type: 'blackboard', distance: distanceToBlackboard });
    if (nearStarBackground) distances.push({ type: 'star-background', distance: distanceToStarBackground });
    if (nearDoor) distances.push({ type: 'door', distance: distanceToDoor });
    if (nearCase) distances.push({ type: 'case', distance: distanceToKey });
    
    if (distances.length > 0) {
      distances.sort((a, b) => a.distance - b.distance);
      currentTable = distances[0].type;
    } else {
      currentTable = null;
    }
    
    // Show/hide UI based on proximity (but not in top-down view, blackboard view, or star background view)
    const isNearAny = isNearSolarSystem || isNearTable2 || isNearBlackboard || isNearStarBackground || isNearDoor || isNearCase;
    const nextAvailablePuzzle = getNextAvailablePuzzle();
    const isCurrentPuzzleAvailable = currentTable === nextAvailablePuzzle && !puzzleState[currentTable];
    
    // Update UI text based on what we're near
    updateProximityUIText();
    
    // Show UI for door always, case when open, and puzzles only if they're available
    // Note: isNearCase already includes caseIsOpen check, so we just need isNearCase
    const shouldShowUI = isNearDoor || isNearCase || ((isNearSolarSystem || isNearTable2 || isNearBlackboard || isNearStarBackground) && isCurrentPuzzleAvailable);
    
    // Show/hide UI based on current state (not just on entry/exit)
    // Only show when near interactables AND not in puzzle solve mode AND game hasn't ended
    if (shouldShowUI && !isTopDownView && !isBlackboardView && !isStarBackgroundView && !isGameEnded) {
      // Show UI if we should show it and not in puzzle solve mode
      proximityUI.classList.remove('hidden');
    } else {
      // Hide UI if we shouldn't show it or in puzzle solve mode or game has ended
      proximityUI.classList.add('hidden');
      if (!shouldShowUI) {
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
      // Skip if positions are already stored (e.g., for dynamically created zodiac symbols)
      if (sphereInitialPositions.has(sphere) && sphereOriginalPositions.has(sphere)) {
        return;
      }
      
      // Store their original positions from HTML
      const pos = sphere.getAttribute('position');
      // Handle both object format {x, y, z} and string format "x y z"
      let initialPos;
      if (typeof pos === 'object' && pos.x !== undefined) {
        initialPos = {
          x: pos.x,
          y: pos.y,
          z: pos.z
        };
      } else if (typeof pos === 'string') {
        const parts = pos.split(' ').map(parseFloat);
        initialPos = {
          x: parts[0],
          y: parts[1],
          z: parts[2]
        };
      } else {
        // Fallback: try to read as object
        initialPos = {
          x: pos.x || 0,
          y: pos.y || 0,
          z: pos.z || 0
        };
      }
      
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
  
  // Handle mouse down - start dragging or handle Greek input controls
  function handleMouseDown(event) {
    // Prevent all interactions when guide overlay is visible
    if (isGuideOverlayVisible) {
      return;
    }
    
    // Check for Greek input controls first (only in star background view and if puzzle not solved)
    if ((isStarBackgroundView || window.isStarBackgroundView) && !puzzleState['star-background']) {
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
      
      // Check for intersection with Greek input arrows
      const arrows = document.querySelectorAll('.greek-arrow-up, .greek-arrow-down');
      const arrowIntersects = [];
      
      arrows.forEach(arrow => {
        if (arrow.object3D) {
          const intersect = raycaster.intersectObject(arrow.object3D, true);
          if (intersect.length > 0) {
            arrowIntersects.push({ element: arrow, distance: intersect[0].distance });
          }
        }
      });
      
      if (arrowIntersects.length > 0) {
        // Find closest arrow
        arrowIntersects.sort((a, b) => a.distance - b.distance);
        const clickedArrow = arrowIntersects[0].element;
        const idx = parseInt(clickedArrow.getAttribute('data-index'));
        
        // Find the control container (parent element with class 'greek-input-control')
        let controlContainer = clickedArrow.parentElement;
        while (controlContainer && !controlContainer.classList.contains('greek-input-control')) {
          controlContainer = controlContainer.parentElement;
        }
        
        if (!controlContainer) {
          console.warn('Could not find Greek input control container');
          return;
        }
        
        if (clickedArrow.classList.contains('greek-arrow-up')) {
          // Up arrow clicked - increment
          greekInputIndices[idx] = (greekInputIndices[idx] + 1) % greekAlphabet.length;
        } else if (clickedArrow.classList.contains('greek-arrow-down')) {
          // Down arrow clicked - decrement
          greekInputIndices[idx] = (greekInputIndices[idx] - 1 + greekAlphabet.length) % greekAlphabet.length;
        }
        
        // Update the displayed letter image
        const letterImageEl = controlContainer.querySelector('.greek-letter-image');
        if (letterImageEl) {
          const letterName = greekAlphabet[greekInputIndices[idx]];
          const imagePath = getGreekLetterImagePath(letterName);
          
          // Load image to maintain aspect ratio
          const img = new Image();
          img.onload = function() {
            const aspectRatio = img.width / img.height;
            const baseWidth = 0.12; // Base width relative to the white box
            const imageHeight = baseWidth / aspectRatio;
            
            letterImageEl.setAttribute('width', baseWidth);
            letterImageEl.setAttribute('height', imageHeight);
            letterImageEl.setAttribute('src', imagePath);
          };
          img.onerror = function() {
            console.warn(`Failed to load Greek letter image: ${imagePath}`);
          };
          img.src = imagePath;
        }
        
        // Check if the Greek letter matches the expected one for this constellation
        checkGreekLetterMatch(idx);
        
        event.preventDefault();
        return;
      }
    }
    
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
    
    // Check for intersection with spheres (if viewing table-2 in top-down view and puzzle not solved)
    if ((topDownViewTableId === 'table-2' || (!topDownViewTableId && (currentTable === 'table-2' || !currentTable))) && !puzzleState['table-2']) {
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
        
        // If this sphere was snapped to an image, clear isModelOn for that image
        const previousImageElement = sphereToImageElement.get(draggedSphere);
        if (previousImageElement) {
          const imgData = getImageDataForElement(previousImageElement);
          if (imgData) {
            imgData.isModelOn = false;
          }
          // Clear tracking - we'll set it again if released back on an image
          sphereToImageElement.delete(draggedSphere);
        }
        
        // Store original position if not already stored
        if (!sphereOriginalPositions.has(draggedSphere)) {
          const pos = draggedSphere.getAttribute('position');
          // Handle both object and string formats
          let posObj;
          if (typeof pos === 'object' && pos.x !== undefined) {
            posObj = { x: pos.x, y: pos.y, z: pos.z };
          } else if (typeof pos === 'string') {
            const parts = pos.split(' ').map(parseFloat);
            posObj = { x: parts[0], y: parts[1], z: parts[2] };
          } else {
            posObj = { x: pos.x || 0, y: pos.y || 0, z: pos.z || 0 };
          }
          sphereOriginalPositions.set(draggedSphere, posObj);
          // Also update initial position if not set
          if (!sphereInitialPositions.has(draggedSphere)) {
            sphereInitialPositions.set(draggedSphere, posObj);
          }
        }
        
        event.preventDefault();
      }
    }
  }
  
  // Handle mouse move - update planet or sphere position or handle arrow hover
  function handleMouseMove(event) {
    // Prevent all interactions when guide overlay is visible
    if (isGuideOverlayVisible) {
      return;
    }
    
    // Handle arrow hover in star background view (even when not dragging)
    if (isStarBackgroundView || window.isStarBackgroundView) {
      const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
      if (THREE) {
        const cameraEl = scene.querySelector('a-camera');
        if (cameraEl && cameraEl.object3D) {
          const camera = cameraEl.getObject3D('camera');
          if (camera) {
            // Get renderer from scene
            const renderer = scene.renderer || (scene.systems && scene.systems.renderer && scene.systems.renderer.renderer);
            if (renderer && renderer.domElement) {
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
              
      // Only handle arrow hover if Greek alphabet puzzle is not solved
      if (!puzzleState['star-background']) {
        // Check for intersection with arrows
        const arrows = document.querySelectorAll('.greek-arrow-up, .greek-arrow-down');
        const arrowIntersects = [];
        
        arrows.forEach(arrow => {
          if (arrow.object3D) {
            const intersect = raycaster.intersectObject(arrow.object3D, true);
            if (intersect.length > 0) {
              arrowIntersects.push({ element: arrow, distance: intersect[0].distance });
            }
          }
        });
        
        // Reset previously hovered arrow to white
        if (hoveredArrow && hoveredArrow !== null) {
          hoveredArrow.setAttribute('material', 'side: double; color: #FFFFFF'); // White
          hoveredArrow = null;
        }
        
        // Highlight new hovered arrow
        if (arrowIntersects.length > 0) {
          arrowIntersects.sort((a, b) => a.distance - b.distance);
          const hoveredArrowElement = arrowIntersects[0].element;
          
          hoveredArrowElement.setAttribute('material', 'side: double; color: #FFFF00'); // Yellow
          hoveredArrow = hoveredArrowElement;
        }
      } else {
        // Reset hovered arrow if puzzle is solved
        if (hoveredArrow && hoveredArrow !== null) {
          hoveredArrow.setAttribute('material', 'side: double; color: #FFFFFF'); // White
          hoveredArrow = null;
        }
      }
            }
          }
        }
      }
    }
    
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
      const closestRing = getClosestRing(currentPos, 0.15, draggedPlanet); // Snap threshold
      
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
      
      // Check if sphere is over an image - if so, snap x to image x and z to -3.700
      // But only if the image doesn't already have a model on it
      const imageElement = getImageAtPosition({ x: localVector.x, y: originalPos.y, z: localVector.z });
      let finalX = localVector.x;
      let finalZ = localVector.z;
      
      if (imageElement) {
        const imgData = getImageDataForElement(imageElement);
        // Only snap if the image doesn't already have a model on it
        if (imgData && !imgData.isModelOn) {
          finalX = imgData.x; // Snap x to image x position
          finalZ = -3.700; // Snap z to -3.700
        }
      }
      
      // Update sphere position (only X and Z, Y stays the same)
      draggedSphere.setAttribute('position', {
        x: finalX,
        y: originalPos.y, // Fixed Y from original position
        z: finalZ
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
      const closestRing = getClosestRing(currentPos, 0.15, planetToRelease);
      
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
      const imageElement = getImageAtPosition(currentPos);
      const sphereElement = sphereToRelease.getAttribute('data-element');
      
      if (imageElement) {
        // Get image data to check if model can be placed
        const imgData = getImageDataForElement(imageElement);
        
        // Check if image already has a different model on it
        const existingSphereOnImage = Array.from(sphereToImageElement.entries()).find(
          ([sphere, element]) => element === imageElement && sphere !== sphereToRelease
        );
        
        if (imgData && existingSphereOnImage) {
          // Image already has a different model on it, don't allow snapping - return to original position
          const initialPos = sphereInitialPositions.get(sphereToRelease);
          if (initialPos) {
            sphereToRelease.setAttribute('position', {
              x: initialPos.x,
              y: initialPos.y,
              z: initialPos.z
            });
            sphereOriginalPositions.set(sphereToRelease, {
              x: initialPos.x,
              y: initialPos.y,
              z: initialPos.z
            });
          }
          // Mark as not correctly placed
          if (sphereElement) {
            sphereCorrectPlacements[sphereElement] = false;
          }
        } else if (imgData) {
          // Image is free (or this sphere was already on it), snap the sphere to the image position
          const snappedPos = {
            x: imgData.x, // Snap x to image x position
            y: currentPos.y, // Keep current y
            z: -3.700 // Snap z to -3.700
          };
          sphereToRelease.setAttribute('position', snappedPos);
          
          // Update the current position tracking
          sphereOriginalPositions.set(sphereToRelease, snappedPos);
          
          // Track which image this sphere is snapped to
          sphereToImageElement.set(sphereToRelease, imageElement);
          
          // Sync isModelOn flags
          syncImageModelStates();
          
          // Check if it's the correct image (zodiac symbol element matches image element)
          if (imageElement === sphereElement) {
            // Correct match! Zodiac symbol is on its corresponding element image
            sphereCorrectPlacements[sphereElement] = true;
            const elementName = sphereElement.charAt(0).toUpperCase() + sphereElement.slice(1);
            console.log(`Correct zodiac symbol placed on ${elementName} element image`);
            
            // Check if all zodiac symbols are correctly placed
            checkAllSpheresPlaced();
          } else {
            // Wrong image - mark this zodiac symbol's element as not correctly placed
            if (sphereElement) {
              sphereCorrectPlacements[sphereElement] = false;
              console.log(`Zodiac symbol for ${sphereElement} placed on wrong element image (${imageElement})`);
            }
          }
        }
      } else {
        // Sphere is not over any image - check if it was previously snapped to an image
        const previousImageElement = sphereToImageElement.get(sphereToRelease);
        if (previousImageElement) {
          // Remove from image tracking
          sphereToImageElement.delete(sphereToRelease);
          // Sync isModelOn flags
          syncImageModelStates();
        }
        
        // Sphere is not over any image, return to initial starting position
        if (sphereElement) {
          sphereCorrectPlacements[sphereElement] = false; // Mark as not correctly placed
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
      // Check if sphere was snapped to an image and clear tracking
      const previousImageElement = sphereToImageElement.get(draggedSphere);
      if (previousImageElement) {
        sphereToImageElement.delete(draggedSphere);
        // Sync isModelOn flags
        syncImageModelStates();
      }
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
    
    // Debug logging
    console.log('Checking puzzle completion:');
    console.log('Total connections made:', constellationConnections.size);
    console.log('All correct made:', allCorrectMade);
    console.log('Has incorrect connections:', hasIncorrectConnections);
    console.log('Current connections:', Array.from(constellationConnections));
    console.log('Expected connections:', correctConnections.map(conn => normalizeConnection(conn[0], conn[1])));
    
    // Only log if all correct connections are made AND no incorrect connections exist
    if (allCorrectMade && !hasIncorrectConnections) {
      const constellationName = selectedConstellation ? selectedConstellation.name : 'Constellation';
      console.log(`All stars are connected correctly! ${constellationName} constellation complete!`);
      // Mark puzzle as solved
      puzzleState['blackboard'] = true;
      
      // Change all dots (stars) to white
      const allStars = document.querySelectorAll('.constellation-star');
      allStars.forEach(star => {
        star.setAttribute('color', '#FFFF00');
        star.setAttribute('emissive', '#FFFF00');
      });
      
      // Change all lines to white
      const allLines = document.querySelectorAll('.constellation-line');
      allLines.forEach(line => {
        line.setAttribute('color', '#FFFF00');
      });
      
      // Clear selected star state
      if (firstSelectedStar) {
        firstSelectedStar = null;
      }
      
      // Clear hover states
      hoveredStar = null;
      hoveredLine = null;
      
      // Animate completed star lamps
      animateCompletedStarLamp('star-lamp-10');
      animateCompletedStarLamp('star-lamp-11');
      // Turn on star lamps for next puzzle (zodiac)
      updateStarLampsForPuzzle('table-2');
      // Auto-exit puzzle mode
      setTimeout(() => {
        switchToOriginalView();
      }, 500);
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
    
    // Create line element (visual)
    // Use width for the length (extends along x-axis), then rotate around z-axis
    const line = document.createElement('a-box');
    line.setAttribute('position', `${midX} ${midY} ${midZ - 0.005}`);
    line.setAttribute('rotation', `0 0 ${angle}`);
    line.setAttribute('width', distance); // Length of the line
    line.setAttribute('height', '0.006'); // Thickness (visual)
    line.setAttribute('depth', '0.006'); // Thickness
    line.setAttribute('color', '#FFFF00');
    line.setAttribute('opacity', '0.7');
    line.classList.add('constellation-line'); // Add class for easy selection
    line.setAttribute('data-connection', connectionKey); // Store connection key for removal
    
    // Create invisible hitbox for easier clicking (wider in height/y-axis)
    const hitbox = document.createElement('a-box');
    hitbox.setAttribute('position', `${midX} ${midY} ${midZ - 0.005}`);
    hitbox.setAttribute('rotation', `0 0 ${angle}`);
    hitbox.setAttribute('width', distance); // Same length as visual line
    hitbox.setAttribute('height', '0.1'); // Much wider for easier clicking
    hitbox.setAttribute('depth', '0.006'); // Same depth
    hitbox.setAttribute('visible', 'false'); // Invisible
    hitbox.classList.add('constellation-line-hitbox');
    hitbox.setAttribute('data-connection', connectionKey); // Store connection key
    
    // Store reference to hitbox on the line element
    line.hitbox = hitbox;
    
    // Add both to container
    linesContainer.appendChild(line);
    linesContainer.appendChild(hitbox);
    
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
      
      // Also remove the corresponding hitbox
      const hitbox = Array.from(document.querySelectorAll('.constellation-line-hitbox')).find(
        h => h.getAttribute('data-connection') === connectionKey
      );
      if (hitbox) {
        hitbox.remove();
      }
    }
    lineElement.remove();
  }
  
  // Clear constellation hover states
  function clearConstellationHover() {
    if (hoveredStar && hoveredStar !== firstSelectedStar) {
      hoveredStar.setAttribute('color', '#FFFF00');
      hoveredStar.setAttribute('emissive', '#FFFF00');
      hoveredStar = null;
    }
    if (hoveredLine) {
      hoveredLine.setAttribute('color', '#FFFF00');
      hoveredLine = null;
    }
  }
  
  // Handle constellation hover (for stars and lines)
  function handleConstellationHover(event) {
    // Only handle hover when in camera lock mode (blackboard view) and puzzle not solved
    if ((!isBlackboardView && !window.isBlackboardView) || puzzleState['blackboard']) {
      // Clear hover states when exiting blackboard view or puzzle is solved
      clearConstellationHover();
      return;
    }
    
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) {
      clearConstellationHover();
      return;
    }
    
    const cameraEl = scene.querySelector('a-camera');
    if (!cameraEl || !cameraEl.object3D) {
      clearConstellationHover();
      return;
    }
    
    const camera = cameraEl.getObject3D('camera');
    if (!camera) {
      clearConstellationHover();
      return;
    }
    
    // Get renderer from scene
    const renderer = scene.renderer || (scene.systems && scene.systems.renderer && scene.systems.renderer.renderer);
    if (!renderer || !renderer.domElement) {
      clearConstellationHover();
      return;
    }
    
    // Initialize mouse if needed
    if (!mouse) {
      mouse = new THREE.Vector2();
    }
    
    // Normalize mouse coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    // Check if mouse is outside canvas bounds
    if (event.clientX < rect.left || event.clientX > rect.right || 
        event.clientY < rect.top || event.clientY > rect.bottom) {
      clearConstellationHover();
      return;
    }
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create raycaster
    if (!raycaster) {
      raycaster = new THREE.Raycaster();
    }
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersection with constellation lines (hitboxes)
    const hitboxes = document.querySelectorAll('.constellation-line-hitbox');
    let currentHoveredLine = null;
    let closestLineDistance = Infinity;
    
    hitboxes.forEach(hitbox => {
      if (hitbox.object3D) {
        const intersect = raycaster.intersectObject(hitbox.object3D, true);
        if (intersect.length > 0 && intersect[0].distance < closestLineDistance) {
          const connectionKey = hitbox.getAttribute('data-connection');
          const line = Array.from(document.querySelectorAll('.constellation-line')).find(
            l => l.getAttribute('data-connection') === connectionKey
          );
          if (line) {
            currentHoveredLine = line;
            closestLineDistance = intersect[0].distance;
          }
        }
      }
    });
    
    // Check for intersection with constellation stars
    const stars = document.querySelectorAll('.constellation-star');
    let currentHoveredStar = null;
    let closestStarDistance = Infinity;
    
    stars.forEach(star => {
      if (star.object3D) {
        const intersect = raycaster.intersectObject(star.object3D, true);
        if (intersect.length > 0 && intersect[0].distance < closestStarDistance) {
          currentHoveredStar = star;
          closestStarDistance = intersect[0].distance;
        }
      }
    });
    
    // Prioritize stars over lines if both are hovered
    if (currentHoveredStar && currentHoveredLine) {
      if (closestStarDistance < closestLineDistance) {
        currentHoveredLine = null;
      } else {
        currentHoveredStar = null;
      }
    }
    
    // Update hovered star
    if (currentHoveredStar !== hoveredStar) {
      // Remove hover from previous star (unless it's selected)
      if (hoveredStar && hoveredStar !== firstSelectedStar) {
        hoveredStar.setAttribute('color', '#FFFF00');
        hoveredStar.setAttribute('emissive', '#FFFF00');
      }
      
      // Add hover to new star (unless it's selected)
      if (currentHoveredStar && currentHoveredStar !== firstSelectedStar) {
        currentHoveredStar.setAttribute('color', '#00FFFF'); // Cyan
        currentHoveredStar.setAttribute('emissive', '#00FFFF'); // Cyan
      }
      
      hoveredStar = currentHoveredStar;
    }
    
    // Update hovered line
    if (currentHoveredLine !== hoveredLine) {
      // Remove hover from previous line
      if (hoveredLine) {
        hoveredLine.setAttribute('color', '#FFFF00');
      }
      
      // Add hover to new line
      if (currentHoveredLine) {
        currentHoveredLine.setAttribute('color', '#00FFFF'); // Cyan
      }
      
      hoveredLine = currentHoveredLine;
    }
    
    // Clear hover states if nothing is hovered
    if (!currentHoveredStar && hoveredStar && hoveredStar !== firstSelectedStar) {
      hoveredStar.setAttribute('color', '#FFFF00');
      hoveredStar.setAttribute('emissive', '#FFFF00');
      hoveredStar = null;
    }
    if (!currentHoveredLine && hoveredLine) {
      hoveredLine.setAttribute('color', '#FFFF00');
      hoveredLine = null;
    }
  }
  
  // Handle constellation star click
  function handleConstellationStarClick(event) {
    // Prevent all interactions when guide overlay is visible
    if (isGuideOverlayVisible) {
      return;
    }
    
    // Only handle clicks when in camera lock mode (blackboard view) and puzzle not solved
    if ((!isBlackboardView && !window.isBlackboardView) || puzzleState['blackboard']) return;
    
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
    // Use hitboxes for easier clicking (wider hit area)
    const hitboxes = document.querySelectorAll('.constellation-line-hitbox');
    const lineIntersects = [];
    
    hitboxes.forEach(hitbox => {
      if (hitbox.object3D) {
        const intersect = raycaster.intersectObject(hitbox.object3D, true);
        if (intersect.length > 0) {
          // Find the corresponding visual line element
          const connectionKey = hitbox.getAttribute('data-connection');
          const line = Array.from(document.querySelectorAll('.constellation-line')).find(
            l => l.getAttribute('data-connection') === connectionKey
          );
          if (line) {
            lineIntersects.push({ 
              element: line, 
              distance: intersect[0].distance,
              point: intersect[0].point // Store the intersection point
            });
          }
        }
      }
    });
    
    // If a line is clicked, check if it's near an endpoint before removing
    if (lineIntersects.length > 0) {
      // Find closest line
      lineIntersects.sort((a, b) => a.distance - b.distance);
      const clickedLine = lineIntersects[0].element;
      const intersectionPoint = lineIntersects[0].point;
      
      // Get the connection key and parse star IDs
      const connectionKey = clickedLine.getAttribute('data-connection');
      if (connectionKey) {
        const [star1Id, star2Id] = connectionKey.split('-');
        
        // Find the star elements
        const allStars = document.querySelectorAll('.constellation-star');
        let star1 = null;
        let star2 = null;
        
        allStars.forEach(star => {
          const starId = star.getAttribute('data-star');
          if (starId === star1Id) star1 = star;
          if (starId === star2Id) star2 = star;
        });
        
        // If we found both stars, check if click is near endpoints
        if (star1 && star2) {
          // Get world positions of both stars
          const star1Pos = new THREE.Vector3();
          const star2Pos = new THREE.Vector3();
          star1.object3D.getWorldPosition(star1Pos);
          star2.object3D.getWorldPosition(star2Pos);
          
          // Calculate line length
          const lineLength = star1Pos.distanceTo(star2Pos);
          const threshold = lineLength * 0.1; // 10% of line length
          
          // Calculate distance from intersection point to each endpoint
          const distToStar1 = intersectionPoint.distanceTo(star1Pos);
          const distToStar2 = intersectionPoint.distanceTo(star2Pos);
          
          // If click is within 10% of either endpoint, don't remove
          if (distToStar1 <= threshold || distToStar2 <= threshold) {
            console.log('Click too close to endpoint, line not removed');
            // Continue to check for star clicks instead
          } else {
            // Click is not near endpoints, but only remove if line is hovered (cyan)
            if (hoveredLine === clickedLine) {
              // Clear hover state for clicked line
              hoveredLine = null;
              removeConstellationLine(clickedLine);
              console.log('Line removed');
              
              // If a star was selected, deselect it
              if (firstSelectedStar) {
                firstSelectedStar.setAttribute('color', '#FFFF00');
                firstSelectedStar.setAttribute('emissive', '#FFFF00');
                firstSelectedStar = null;
              }
              
              event.preventDefault();
              return;
            } else {
              // Line is not hovered, don't remove it
              console.log('Line not hovered, not removed');
              // Continue to check for star clicks instead
            }
          }
        } else {
          // Couldn't find stars, but only remove if line is hovered (cyan)
          if (hoveredLine === clickedLine) {
            // Clear hover state for clicked line
            hoveredLine = null;
            removeConstellationLine(clickedLine);
            console.log('Line removed (stars not found)');
            
            if (firstSelectedStar) {
              firstSelectedStar.setAttribute('color', '#FFFF00');
              firstSelectedStar.setAttribute('emissive', '#FFFF00');
              firstSelectedStar = null;
            }
            
            event.preventDefault();
            return;
          } else {
            // Line is not hovered, don't remove it
            console.log('Line not hovered, not removed');
            // Continue to check for star clicks instead
          }
        }
      } else {
        // No connection key, but only remove if line is hovered (cyan)
        if (hoveredLine === clickedLine) {
          // Clear hover state for clicked line
          hoveredLine = null;
          removeConstellationLine(clickedLine);
          console.log('Line removed (no connection key)');
          
          if (firstSelectedStar) {
            firstSelectedStar.setAttribute('color', '#FFFF00');
            firstSelectedStar.setAttribute('emissive', '#FFFF00');
            firstSelectedStar = null;
          }
          
          event.preventDefault();
          return;
        } else {
          // Line is not hovered, don't remove it
          console.log('Line not hovered, not removed');
          // Continue to check for star clicks instead
        }
      }
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
      
      // Clear hover state for clicked star
      if (hoveredStar === clickedStar) {
        hoveredStar = null;
      }
      
      if (!firstSelectedStar) {
        // First star clicked - store it and turn red
        firstSelectedStar = clickedStar;
        clickedStar.setAttribute('color', '#FF0000'); // Red
        clickedStar.setAttribute('emissive', '#FF0000'); // Red emissive
        console.log('First star selected:', starId);
      } else {
        // Second star clicked
        if (firstSelectedStar === clickedStar) {
          // Same star clicked - deselect and turn back to yellow
          firstSelectedStar.setAttribute('color', '#FFFF00'); // Reset to yellow
          firstSelectedStar.setAttribute('emissive', '#FFFF00'); // Reset emissive
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
          
          // Reset both stars back to yellow after connection is made
          firstSelectedStar.setAttribute('color', '#FFFF00'); // Reset to yellow
          firstSelectedStar.setAttribute('emissive', '#FFFF00'); // Reset emissive
          clickedStar.setAttribute('color', '#FFFF00'); // Ensure second star is yellow (not cyan)
          clickedStar.setAttribute('emissive', '#FFFF00'); // Reset emissive
          firstSelectedStar = null;
        }
      }
      
      event.preventDefault();
    }
  }
  
  // Randomly select a constellation
  function selectRandomConstellation() {
    const constellationKeys = Object.keys(constellations);
    const randomIndex = Math.floor(Math.random() * constellationKeys.length);
    const selectedKey = constellationKeys[randomIndex];
    selectedConstellation = constellations[selectedKey];
    correctConnections = selectedConstellation.connections;
    console.log(`Randomly selected constellation: ${selectedConstellation.name}`);
    return selectedConstellation;
  }
  
  // Create stars dynamically based on selected constellation
  function createConstellationStars() {
    const board = document.querySelector('#centaurus-board');
    if (!board) {
      console.error('Constellation board not found');
      return;
    }
    
    // Remove existing stars
    const existingStars = board.querySelectorAll('.constellation-star');
    existingStars.forEach(star => star.remove());
    
    // Create stars for selected constellation
    selectedConstellation.stars.forEach(starData => {
      const star = document.createElement('a-sphere');
      star.setAttribute('class', 'constellation-star');
      star.setAttribute('data-star', starData.name);
      star.setAttribute('position', starData.position);
      star.setAttribute('radius', starData.radius);
      star.setAttribute('color', '#FFFF00');
      star.setAttribute('emissive', '#FFFF00');
      star.setAttribute('emissive-intensity', starData.emissive);
      board.appendChild(star);
    });
    
    console.log(`Created ${selectedConstellation.stars.length} stars for ${selectedConstellation.name}`);
  }
  
  // Initialize constellation game
  function initConstellationGame() {
    // Randomly select a constellation
    selectRandomConstellation();
    
    // Create stars dynamically
    createConstellationStars();
    
    // Add click event listener for constellation stars
    window.addEventListener('mousedown', handleConstellationStarClick);
    // Add hover event listener for constellation stars and lines
    window.addEventListener('mousemove', handleConstellationHover);
    // Add mouseleave handler to clear hover states when mouse leaves window
    window.addEventListener('mouseleave', clearConstellationHover);
    console.log('Constellation game initialized');
  }
  
  // Set correct aspect ratio for star background image
  function setStarBackgroundAspectRatio() {
    const starImage = document.getElementById('star-background-image');
    if (!starImage) return;
    
    const img = new Image();
    img.onload = function() {
      const aspectRatio = img.width / img.height;
      const width = 4; // Keep width at 4
      const height = width / aspectRatio; // Calculate height based on aspect ratio
      
      starImage.setAttribute('height', height);
      console.log(`Star background image aspect ratio set: ${width} x ${height} (ratio: ${aspectRatio.toFixed(2)})`);
    };
    img.onerror = function() {
      console.warn('Failed to load star background image for aspect ratio calculation');
    };
    img.src = 'data/star_constellations/star_background.jpg';
  }
  
  // Set correct aspect ratio for constellation drawing puzzle background
  function setConstellationDrawingBackgroundAspectRatio() {
    const backgroundImage = document.getElementById('constellation-drawing-background');
    if (!backgroundImage) return;
    
    const img = new Image();
    img.onload = function() {
      const aspectRatio = img.width / img.height;
      const width = 4.5; // Keep width at 4.5 (same as original plane)
      const height = width / aspectRatio; // Calculate height based on aspect ratio
      
      backgroundImage.setAttribute('height', height);
      console.log(`Constellation drawing background aspect ratio set: ${width} x ${height} (ratio: ${aspectRatio.toFixed(2)})`);
    };
    img.onerror = function() {
      console.warn('Failed to load constellation drawing background image for aspect ratio calculation');
    };
    img.src = 'data/star_constellations/Southern Star Background.jpg';
  }
  
  // Constellation folder to star images mapping
  const constellationStars = {
    'Andromeda': ['alpha', 'beta', 'delta', 'gamma', 'mu', 'nu'],
    'Auriga': ['alpha', 'beta', 'gamma', 'iota', 'theta', 'zeta'],
    'Cassiopeia': ['alpha', 'beta', 'delta', 'epsilon', 'gamma'],
    'Cygnus': ['alpha', 'beta', 'delta', 'iota', 'zeta', 'epsilon', 'eta', 'gamma', 'kappa', 'mu'],
    'Pegasus': ['alpha', 'beta', 'delta', 'epsilon', 'eta', 'gamma', 'iota', 'kappa', 'lambda', 'mu', 'pi', 'theta', 'xi', 'zeta'],
    'Perseus': ['alpha', 'beta', 'delta', 'epsilon', 'eta', 'gamma', 'omicron', 'rho', 'xi', 'zeta'],
    'Ursa Major': ['alpha', 'beta', 'chi', 'delta', 'epsilon', 'eta', 'gamma', 'iota', 'kappa', 'lambda', 'mu', 'omicron', 'phi', 'psi', 'theta', 'upsilon', 'zeta'],
    'Ursa Minor': ['alpha', 'beta', 'delta', 'epsilon', 'eta', 'gamma', 'zeta']
  };
  
  // Randomly select 4 constellation folders and one star from each
  function selectRandomConstellations() {
    const constellationFolders = Object.keys(constellationStars);
    
    // Randomly shuffle and select 4 unique folders
    const shuffled = [...constellationFolders].sort(() => Math.random() - 0.5);
    const selectedFolders = shuffled.slice(0, 4);
    
    // For each selected folder, randomly select one star
    const selectedConstellations = selectedFolders.map(folder => {
      const availableStars = constellationStars[folder];
      const randomStar = availableStars[Math.floor(Math.random() * availableStars.length)];
      
      const starFileName = `${folder} - ${randomStar}.png`;
      
      return {
        folder: folder,
        star: randomStar,
        path: `data/star_constellations/${folder}/${starFileName}`
      };
    });
    
    console.log('Selected constellations:', selectedConstellations);
    return selectedConstellations;
  }
  
  // Greek alphabet lowercase letters
  const greekAlphabet = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];
  
  // Get image path for a Greek letter (capitalize first letter to match file names)
  function getGreekLetterImagePath(letterName) {
    const capitalizedName = letterName.charAt(0).toUpperCase() + letterName.slice(1);
    return `data/greek_alphabets/${capitalizedName}.png`;
  }
  
  // Store current letter index for each input control
  const greekInputIndices = {};
  
  // Store expected Greek letter for each constellation image (by index)
  const expectedGreekLetters = {};
  
  // Track currently hovered arrow for hover effects
  let hoveredArrow = null;
  
  // Check if Greek alphabet matches expected letter for a given index
  function checkGreekLetterMatch(index) {
    const currentLetterIndex = greekInputIndices[index];
    const currentLetter = greekAlphabet[currentLetterIndex];
    const expectedLetter = expectedGreekLetters[index];
    
    if (expectedLetter && currentLetter === expectedLetter) {
      console.log(`✓ Match! Constellation ${index + 1}: Greek alphabet "${currentLetter}" matches expected "${expectedLetter}"`);
      
      // Check if all match
      checkAllGreekLettersMatch();
      return true;
    } else if (expectedLetter) {
      console.log(`✗ No match. Constellation ${index + 1}: Current "${currentLetter}" does not match expected "${expectedLetter}"`);
      return false;
    }
    return false;
  }
  
  // Play case animation halfway and stop
  function playCaseAnimationHalfway() {
    if (!caseEntity) {
      console.warn('Case entity not found');
      // Try to find it
      const scene = document.querySelector('a-scene');
      const allEntities = scene.querySelectorAll('[gltf-model]');
      for (let entity of allEntities) {
        if (entity.getAttribute('gltf-model') === 'data/models/case.glb') {
          caseEntity = entity;
          console.log('Found case entity');
          break;
        }
      }
      if (!caseEntity) {
        console.warn('Case entity still not found after search');
        return;
      }
    }
    
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) {
      console.warn('THREE.js not available');
      return;
    }
    
    // Function to setup animation
    function setupCaseAnimation() {
      const object3D = caseEntity.object3D;
      if (!object3D) {
        console.warn('Case object3D not found');
        return;
      }
      
      // Find animations in the model - check both object3D and its children
      let animations = [];
      
      // Check if animations are directly on object3D
      if (object3D.animations && object3D.animations.length > 0) {
        animations = animations.concat(object3D.animations);
      }
      
      // Also traverse children to find animations
      object3D.traverse(function(child) {
        if (child.animations && child.animations.length > 0) {
          animations = animations.concat(child.animations);
        }
      });
      
      // Also check the gltf-model component's animations if available
      const gltfModel = caseEntity.components['gltf-model'];
      if (gltfModel && gltfModel.model && gltfModel.model.animations) {
        animations = animations.concat(gltfModel.model.animations);
      }
      
      if (animations.length === 0) {
        console.warn('No animations found in case model. Object3D:', object3D);
        console.warn('Checking gltf-model component...');
        // Try accessing via gltf-model component
        const gltfComponent = caseEntity.components['gltf-model'];
        if (gltfComponent) {
          console.log('gltf-model component found:', gltfComponent);
          if (gltfComponent.model) {
            console.log('Model found:', gltfComponent.model);
            if (gltfComponent.model.animations) {
              console.log('Animations found:', gltfComponent.model.animations);
              animations = gltfComponent.model.animations;
            }
          }
        }
        
        if (animations.length === 0) {
          console.warn('Still no animations found after checking gltf-model component');
          return;
        }
      }
      
      // Create animation mixer - use the root object3D
      const mixer = new THREE.AnimationMixer(object3D);
      
      // Get the first animation clip
      const animationClip = animations[0];
      const fullDuration = animationClip.duration;
      const halfDuration = fullDuration / 2;
      
      console.log(`Case animation duration: ${fullDuration}s, playing for ${halfDuration}s`);
      
      // Create action and play
      const action = mixer.clipAction(animationClip);
      action.play();
      
      // Store mixer and action on entity
      caseEntity.mixer = mixer;
      caseEntity.animationAction = action;
      caseEntity.animationHalfDuration = halfDuration;
      
      // Add component to case entity to update mixer on tick
      caseEntity.setAttribute('case-animation-updater', '');
    }
    
    // Wait for model to be loaded - use both model-loaded event and check periodically
    function trySetupAnimation() {
      const object3D = caseEntity.object3D;
      const gltfComponent = caseEntity.components['gltf-model'];
      
      // Check if model is loaded
      if (object3D && (object3D.animations || (gltfComponent && gltfComponent.model))) {
        setupCaseAnimation();
        return true;
      }
      return false;
    }
    
    // Try immediately
    if (!trySetupAnimation()) {
      // Wait for model to load
      caseEntity.addEventListener('model-loaded', function onCaseLoaded() {
        caseEntity.removeEventListener('model-loaded', onCaseLoaded);
        setTimeout(() => {
          if (!trySetupAnimation()) {
            console.warn('Model loaded but animations not found, retrying...');
            // Retry after a short delay
            setTimeout(trySetupAnimation, 500);
          }
        }, 100);
      });
      
      // Also try after a delay in case event already fired
      setTimeout(() => {
        if (!caseEntity.mixer) {
          trySetupAnimation();
        }
      }, 1000);
    }
  }
  
  // Check if all Greek letters match their expected values
  function checkAllGreekLettersMatch() {
    const totalControls = Object.keys(expectedGreekLetters).length;
    if (totalControls === 0) return;
    
    let matchCount = 0;
    for (let i = 0; i < totalControls; i++) {
      const currentLetterIndex = greekInputIndices[i];
      const currentLetter = greekAlphabet[currentLetterIndex];
      const expectedLetter = expectedGreekLetters[i];
      
      if (currentLetter === expectedLetter) {
        matchCount++;
      }
    }
    
    if (matchCount === totalControls) {
      console.log('🎉 ALL GREEK ALPHABETS MATCH! All constellation images have their corresponding Greek letters!');
      // Mark puzzle as solved
      puzzleState['star-background'] = true;
      // Animate completed star lamps
      animateCompletedStarLamp('star-lamp-8');
      animateCompletedStarLamp('star-lamp-9');
      // Play case animation halfway
      playCaseAnimationHalfway();
      // Auto-exit puzzle mode
      setTimeout(() => {
        switchToOriginalView();
      }, 500);
    }
  }
  
  // Create Greek alphabet input control below a constellation image
  function createGreekInputControl(index, imagePosition, imageHeight, bgRotation, bgScale, expectedStarName) {
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) return;
    
    // Store expected Greek letter for this constellation image
    if (expectedStarName) {
      expectedGreekLetters[index] = expectedStarName;
    }
    
    // Initialize index for this control (start at alpha = 0)
    greekInputIndices[index] = 0;
    
    // Calculate position below the image
    // Position the control below the image (lower Y value)
    // Image is at bgPosition.y, so control should be at bgPosition.y - imageHeight/2 - some offset
    const controlY = 1;
    const controlX = imagePosition.x;
    const controlZ = imagePosition.z;
    
    // Create container for the input control
    const controlContainer = document.createElement('a-entity');
    controlContainer.setAttribute('class', 'greek-input-control');
    controlContainer.setAttribute('data-index', index);
    controlContainer.setAttribute('position', `${controlX} ${controlY} ${controlZ}`);
    controlContainer.setAttribute('rotation', `${bgRotation.x} ${bgRotation.y} ${bgRotation.z}`);
    controlContainer.setAttribute('scale', '5 5 1');
    
    // Create white box for displaying the Greek letter
    const letterBox = document.createElement('a-box');
    letterBox.setAttribute('class', 'greek-letter-box');
    letterBox.setAttribute('data-index', index);
    letterBox.setAttribute('position', '0 0 0.01');
    letterBox.setAttribute('width', '0.15');
    letterBox.setAttribute('height', '0.15');
    letterBox.setAttribute('depth', '0.01');
    letterBox.setAttribute('color', '#FFFFFF');
    letterBox.setAttribute('material', 'side: double');
    
    // Create image element for the Greek letter
    // Create image in a separate entity that faces the camera properly
    const imageContainer = document.createElement('a-entity');
    imageContainer.setAttribute('class', 'greek-image-container');
    imageContainer.setAttribute('data-index', index);
    imageContainer.setAttribute('position', '0 0 0.02');
    imageContainer.setAttribute('rotation', '0 0 0'); // No rotation
    
    // Create image element for Greek letter
    const letterImage = document.createElement('a-image');
    letterImage.setAttribute('class', 'greek-letter-image');
    letterImage.setAttribute('data-index', index);
    letterImage.setAttribute('position', '0 0 0');
    letterImage.setAttribute('material', 'side: double');
    
    // Load image to get aspect ratio
    const img = new Image();
    img.onload = function() {
      const aspectRatio = img.width / img.height;
      const baseWidth = 0.12; // Base width relative to the white box
      const imageHeight = baseWidth / aspectRatio;
      
      letterImage.setAttribute('width', baseWidth);
      letterImage.setAttribute('height', imageHeight);
      letterImage.setAttribute('src', getGreekLetterImagePath(greekAlphabet[0])); // Start with alpha
      
      // Check initial match (will be false since we start at alpha, but good for consistency)
      setTimeout(() => checkGreekLetterMatch(index), 100);
    };
    img.onerror = function() {
      console.warn(`Failed to load Greek letter image: ${getGreekLetterImagePath(greekAlphabet[0])}`);
    };
    img.src = getGreekLetterImagePath(greekAlphabet[0]);
    
    imageContainer.appendChild(letterImage);
    
    // Create up arrow as triangle image (top)
    const upArrow = document.createElement('a-image');
    upArrow.setAttribute('class', 'greek-arrow-up');
    upArrow.setAttribute('data-index', index);
    upArrow.setAttribute('position', '0 0.1 0.01');
    upArrow.setAttribute('width', '0.08');
    upArrow.setAttribute('height', '0.08');
    upArrow.setAttribute('src', 'data/triangle-up.png');
    upArrow.setAttribute('material', 'side: double; color: #FFFFFF'); // White by default
    
    // Create down arrow as triangle image (bottom)
    const downArrow = document.createElement('a-image');
    downArrow.setAttribute('class', 'greek-arrow-down');
    downArrow.setAttribute('data-index', index);
    downArrow.setAttribute('position', '0 -0.1 0.01');
    downArrow.setAttribute('width', '0.08');
    downArrow.setAttribute('height', '0.08');
    downArrow.setAttribute('src', 'data/triangle-down.png');
    downArrow.setAttribute('material', 'side: double; color: #FFFFFF'); // White by default
    
    // Event handlers are handled by the raycaster system in handleMouseDown
    
    // Append all elements to container (boxes first for layering, then image on top)
    controlContainer.appendChild(letterBox);
    controlContainer.appendChild(imageContainer);
    controlContainer.appendChild(upArrow);
    controlContainer.appendChild(downArrow);
    
    return controlContainer;
  }
  
  // Zodiac symbols mapping by element
  const zodiacSymbols = {
    'air': ['Aquarius', 'Gemini', 'Libra'],
    'earth': ['Capricorn', 'Taurus', 'Virgo'],
    'fire': ['Aries', 'Leo', 'Sagittarius'],
    'water': ['Cancer', 'Pisces', 'Scorpio']
  };
  
  // Randomly select one zodiac symbol from each element folder
  function selectRandomZodiacSymbols() {
    const selected = {};
    Object.keys(zodiacSymbols).forEach(element => {
      const symbols = zodiacSymbols[element];
      const randomIndex = Math.floor(Math.random() * symbols.length);
      selected[element] = symbols[randomIndex];
    });
    console.log('Selected zodiac symbols:', selected);
    return selected;
  }
  
  // Replace spheres with zodiac symbols
  function replaceSpheresWithZodiacSymbols() {
    const selectedSymbols = selectRandomZodiacSymbols();
    const table2 = document.querySelector('#table-2');
    if (!table2) {
      console.warn('Table-2 not found');
      return;
    }
    
    // Sphere positions and elements
    const sphereData = [
      { element: 'air', position: '1 0.32 -4.5', sphereId: 'sphere-1' },
      { element: 'fire', position: '0.33 0.32 -4.5', sphereId: 'sphere-2' },
      { element: 'water', position: '-0.33 0.32 -4.5', sphereId: 'sphere-3' },
      { element: 'earth', position: '-1 0.32 -4.5', sphereId: 'sphere-4' }
    ];
    
    // Remove existing spheres
    const existingSpheres = table2.querySelectorAll('[data-sphere]');
    existingSpheres.forEach(sphere => sphere.remove());
    
    // Create zodiac symbol models for each element
    sphereData.forEach(({ element, position, sphereId }) => {
      const zodiacName = selectedSymbols[element];
      // Capitalize first letter of element for folder name (Air Zodiac, Earth Zodiac, etc.)
      const elementFolder = element.charAt(0).toUpperCase() + element.slice(1) + ' Zodiac';
      const objPath = `data/zodiac/zodiac symbols/${elementFolder}/${zodiacName}.obj`;
      
      // Parse position string to object
      const posParts = position.split(' ').map(parseFloat);
      const initialPos = {
        x: posParts[0],
        y: posParts[1],
        z: posParts[2]
      };
      
      // Create obj-model entity
      const zodiacModel = document.createElement('a-obj-model');
      zodiacModel.setAttribute('data-sphere', sphereId);
      zodiacModel.setAttribute('data-element', element);
      zodiacModel.setAttribute('class', 'draggable-sphere');
      // Set position as object to ensure correct parsing
      zodiacModel.setAttribute('position', initialPos);
      zodiacModel.setAttribute('src', objPath);
      zodiacModel.setAttribute('scale', '0.1 0.1 0.1'); // Scale down to fit on table
      zodiacModel.setAttribute('rotation', '90 0 0');
      zodiacModel.setAttribute('material', 'color: #000000'); // Black color
      
      table2.appendChild(zodiacModel);
      
      // Store positions immediately (before initializeSpherePositions runs)
      sphereInitialPositions.set(zodiacModel, initialPos);
      sphereOriginalPositions.set(zodiacModel, initialPos);
      
      console.log(`Created zodiac symbol for ${element}: ${zodiacName} at ${position}`);
    });
  }
  
  // Create and position constellation images in front of star background
  function createConstellationImages() {
    // Get star background position and properties
    const starBackground = document.getElementById('star-background-image');
    if (!starBackground) {
      console.warn('Star background image not found');
      return;
    }
    
    const bgPosition = starBackground.getAttribute('position');
    const bgRotation = starBackground.getAttribute('rotation');
    const bgWidth = starBackground.getAttribute('width') || 4;
    const bgScale = starBackground.getAttribute('scale') || { x: 1, y: 1, z: 1 };
    
    // Select random constellations
    const selectedConstellations = selectRandomConstellations();
    
    // Calculate positions for 4 images arranged horizontally
    // Background width is 4, so each image should be width 1 (1/4 of background)
    const imageWidth = bgWidth / 4; // 1 unit
    
    // Specific Z positions for the 4 constellation images
    const zPositions = [-9.725, -12.222, -14.722, -17.212];
    
    // Fixed X position for constellation images
    const imageX = -6.520;
    
    // Create container entity for constellation images (or use scene directly)
    let container = document.getElementById('constellation-images-container');
    if (!container) {
      container = document.createElement('a-entity');
      container.setAttribute('id', 'constellation-images-container');
      scene.appendChild(container);
    }
    
    // Remove any existing constellation images and input controls
    const existingImages = container.querySelectorAll('.constellation-image');
    existingImages.forEach(img => img.remove());
    const existingControls = container.querySelectorAll('.greek-input-control');
    existingControls.forEach(ctrl => ctrl.remove());
    
    // Create 4 constellation images with proper aspect ratio
    selectedConstellations.forEach((constellation, index) => {
      // Load image to get its natural aspect ratio
      const img = new Image();
      img.onload = function() {
        const aspectRatio = img.width / img.height;
        // Calculate height based on aspect ratio to maintain proportions
        const imageHeight = imageWidth / aspectRatio;
        
        const image = document.createElement('a-image');
        image.setAttribute('class', 'constellation-image');
        const imagePosition = {
          x: imageX,
          y: bgPosition.y,
          z: zPositions[index]
        };
        image.setAttribute('position', imagePosition);
        image.setAttribute('rotation', `${bgRotation.x} ${bgRotation.y} ${bgRotation.z}`);
        image.setAttribute('width', imageWidth);
        image.setAttribute('height', imageHeight);
        image.setAttribute('scale', `${bgScale.x} ${bgScale.y} ${bgScale.z}`);
        image.setAttribute('src', constellation.path);
        image.setAttribute('material', 'side: double');
        
        container.appendChild(image);
        
        // Create Greek alphabet input control below this image
        const inputControl = createGreekInputControl(index, imagePosition, imageHeight, bgRotation, bgScale, constellation.star);
        if (inputControl) {
          container.appendChild(inputControl);
        }
        
        console.log(`Created constellation image ${index + 1}: ${constellation.folder} - ${constellation.star} (${imageWidth.toFixed(2)} x ${imageHeight.toFixed(2)}, aspect ratio: ${aspectRatio.toFixed(2)})`);
      };
      img.onerror = function() {
        console.warn(`Failed to load constellation image: ${constellation.path}`);
      };
      img.src = constellation.path;
    });
  }
  
  if (scene) {
    // Function to initialize everything
    function initialize() {
      // Randomize planet assignments after scene loads
      randomizePlanetAssignments();
      
      attachEventListeners();
      initProximityUI();
      initCompletionMessageUI();
      initKeyMessageUI();
      initGuideButtonUI();
      replaceSpheresWithZodiacSymbols();
      initDragAndDrop();
      initConstellationGame();
      setStarBackgroundAspectRatio();
      setConstellationDrawingBackgroundAspectRatio();
      createConstellationImages();
      loadAllModels();
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
      initCompletionMessageUI();
      initKeyMessageUI();
      initGuideButtonUI();
      replaceSpheresWithZodiacSymbols();
      initDragAndDrop();
      initConstellationGame();
      setStarBackgroundAspectRatio();
      setConstellationDrawingBackgroundAspectRatio();
      createConstellationImages();
      loadAllModels();
      // Don't start animation automatically - wait for all planets to be correctly placed
    }, 500);
  }
  
  // Function to load all models from public/data/models folder
  function loadAllModels() {
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    
    // List of models with their specific configurations
    const models = [
      {
        path: 'data/models/door.glb',
        position: { x: 4.958, y: 2.065, z: -19.998 },
        scale: 0.02,
        rotation: { x: 0, y: 90, z: 0 }
      },
      {
        path: 'data/models/saturno_lightstar_pendant_chandelier.glb',
        position: { x: 0, y: 3.055, z: -13.445 },
        scale: 0.0015
      },
      // Wall lamps on back wall corners
      {
        path: 'data/models/wall_lamp.glb',
        position: { x: -6.232, y: 3.5, z: -20.007 },
        scale: 0.03,
        rotation: { x: 0, y: 180, z: 0 },
        hasLight: true
      },
      {
        path: 'data/models/wall_lamp.glb',
        position: { x: 6.232, y: 3.5, z: -20.007 },
        scale: 0.03,
        rotation: { x: 0, y: 180, z: 0 },
        hasLight: true
      },
      // Wall lamps on front wall corners
      {
        path: 'data/models/wall_lamp.glb',
        position: { x: -6.232, y: 3.5, z: -6.883 },
        scale: 0.03,
        rotation: { x: 0, y: 0, z: 0 },
        hasLight: true
      },
      {
        path: 'data/models/wall_lamp.glb',
        position: { x: 6.232, y: 3.5, z: -6.883 },
        scale: 0.03,
        rotation: { x: 0, y: 0, z: 0 },
        hasLight: true
      },
      {
        path: 'data/models/star_polyhedron.glb',
        position: { x: 0, y: 3.7, z: -18.529 },
        scale: 0.1,
        rotation: { x: 0, y: 35, z: 0 },
        hasLight: true,
        lightConfig: {
          position: '0 0 0',
          decay: 1,
          distance: 4,
          intensity: 10
        }
      },
      {
        path: 'data/models/star_polyhedron.glb',
        position: { x: 0, y: 3.7, z: -8.408 },
        scale: 0.1,
        rotation: { x: 0, y: 35, z: 0 },
        hasLight: true,
        lightConfig: {
          position: '0 0 0',
          decay: 1,
          distance: 4,
          intensity: 10
        }
      },
      {
        path: 'data/models/star_polyhedron.glb',
        position: { x: -5.974, y: 1.303, z: -11.268 },
        scale: 0.1,
        rotation: { x: 0, y: 125, z: 180 },
        hasLight: true,
        lightConfig: {
          position: '0 0 0',
          decay: 1,
          distance: 4,
          intensity: 10
        }
      },
      {
        path: 'data/models/star_polyhedron.glb',
        position: { x: -5.974, y: 1.303, z: -15.622 },
        scale: 0.1,
        rotation: { x: 0, y: 125, z: 180 },
        hasLight: true,
        lightConfig: {
          position: '0 0 0',
          decay: 1,
          distance: 4,
          intensity: 10
        }
      },
      {
        path: 'data/models/star_polyhedron.glb',
        position: { x: 5.974, y: 1.303, z: -11.268 },
        scale: 0.1,
        rotation: { x: 0, y: 125, z: 180 },
        hasLight: true,
        lightConfig: {
          position: '0 0 0',
          decay: 1,
          distance: 4,
          intensity: 10
        }
      },
      {
        path: 'data/models/star_polyhedron.glb',
        position: { x: 5.974, y: 1.303, z: -15.622 },
        scale: 0.1,
        rotation: { x: 0, y: 125, z: 180 },
        hasLight: true,
        lightConfig: {
          position: '0 0 0',
          decay: 1,
          distance: 4,
          intensity: 10
        }
      },
      {
        path: 'data/models/stand.glb',
        position: { x: -5.958, y: 0, z: -13.422 },
        scale: 1.464
      },
      {
        path: 'data/models/case.glb',
        position: { x: -5.974, y: 1.777, z: -13.445 },
        scale: 0.640,
        rotation: { x: 0, y: 90, z: 0 }
      },
      {
        path: 'data/models/key.glb',
        position: { x: -5.983, y: 1.789, z: -13.445 },
        scale: 0.0004,
        rotation: { x: 0, y: 50, z: 0 }
      }
    ];
    
    // Room center position (based on floor position) - for models without specific positions
    const centerX = 0;
    const centerY = 1.5; // Height above floor
    const centerZ = -13.455;
    
    // Spacing between models (for circular arrangement)
    const spacing = 2;
    
    // Track models that need circular positioning
    const modelsNeedingPositioning = models.filter(m => m.position === null);
    
    models.forEach((modelConfig, index) => {
      const modelPath = modelConfig.path;
      const isStarPolyhedron = modelPath === 'data/models/star_polyhedron.glb';
      const isStarLampToLight = isStarPolyhedron && index >= 7 && index <= 11; // Star lamps 7-11 need both models
      
      // For star polyhedrons, create a parent "star lamp" entity
      let parentEntity;
      if (isStarPolyhedron) {
        parentEntity = document.createElement('a-entity');
        parentEntity.setAttribute('id', `star-lamp-${index}`);
        parentEntity.setAttribute('class', 'star-lamp');
      }
      
      // Set position - use specific position if provided, otherwise use circular arrangement
      let x, y, z;
      if (modelConfig.position) {
        x = modelConfig.position.x;
        y = modelConfig.position.y;
        z = modelConfig.position.z;
      } else {
        // Position models in a circle around the center
        const circularIndex = modelsNeedingPositioning.indexOf(modelConfig);
        const angle = (circularIndex / modelsNeedingPositioning.length) * Math.PI * 2;
        const radius = spacing;
        x = centerX + Math.cos(angle) * radius;
        y = centerY;
        z = centerZ + Math.sin(angle) * radius;
      }
      
      if (isStarPolyhedron) {
        // Position parent at star location
        parentEntity.setAttribute('position', `${x} ${y} ${z}`);
      }
      
      // For star lamps 7-11, create both unlit and lit models
      if (isStarLampToLight) {
        // Set rotation on parent if specified
        if (modelConfig.rotation) {
          parentEntity.setAttribute('rotation', `${modelConfig.rotation.x} ${modelConfig.rotation.y} ${modelConfig.rotation.z}`);
        }
        
        // Create unlit model (visible initially)
        const unlitModelEntity = document.createElement('a-entity');
        unlitModelEntity.setAttribute('gltf-model', 'data/models/star_polyhedron (unlit).glb');
        unlitModelEntity.setAttribute('position', '0 -0.09 0');
        unlitModelEntity.setAttribute('scale', `${modelConfig.scale} ${modelConfig.scale} ${modelConfig.scale}`);
        unlitModelEntity.setAttribute('class', 'star-lamp-unlit');
        unlitModelEntity.setAttribute('visible', 'true');
        parentEntity.appendChild(unlitModelEntity);
        
        // Create lit model (invisible initially, with light disabled)
        const litModelEntity = document.createElement('a-entity');
        litModelEntity.setAttribute('gltf-model', modelPath);
        litModelEntity.setAttribute('position', '0 -0.09 0');
        litModelEntity.setAttribute('scale', `${modelConfig.scale} ${modelConfig.scale} ${modelConfig.scale}`);
        litModelEntity.setAttribute('class', 'star-lamp-lit');
        litModelEntity.setAttribute('visible', 'false');
        
        // Add light but disable it initially
        if (modelConfig.hasLight && modelConfig.lightConfig) {
          const lightEntity = document.createElement('a-light');
          lightEntity.setAttribute('type', 'point');
          lightEntity.setAttribute('position', modelConfig.lightConfig.position || '0 0 0');
          lightEntity.setAttribute('decay', modelConfig.lightConfig.decay !== undefined ? modelConfig.lightConfig.decay : 1);
          lightEntity.setAttribute('distance', modelConfig.lightConfig.distance !== undefined ? modelConfig.lightConfig.distance : 7);
          lightEntity.setAttribute('intensity', '0'); // Disabled initially
          if (modelConfig.lightConfig.color) {
            lightEntity.setAttribute('color', modelConfig.lightConfig.color);
          } else {
            lightEntity.setAttribute('color', '#ffce7a');
          }
          litModelEntity.appendChild(lightEntity);
        }
        
        parentEntity.appendChild(litModelEntity);
        scene.appendChild(parentEntity);
        
        // Store references for later use
        modelConfig.parentEntity = parentEntity;
        modelConfig.unlitModel = unlitModelEntity;
        modelConfig.litModel = litModelEntity;
      } else {
        // For star-lamp-6 and other models, use original logic
        const modelEntity = document.createElement('a-entity');
        
        // Determine file extension
        const fileExtension = modelPath.split('.').pop().toLowerCase();
        
        if (fileExtension === 'glb' || fileExtension === 'gltf') {
          // Use gltf-model component for GLB files
          modelEntity.setAttribute('gltf-model', modelPath);
          
          // Set emissive white material for key.glb
          if (modelPath === 'data/models/key.glb') {
            keyEntity = modelEntity; // Store reference
            modelEntity.addEventListener('model-loaded', function() {
              const THREE = AFRAME.THREE;
              const object3D = modelEntity.object3D;
              
              // Traverse the object3D tree to find and modify all materials
              object3D.traverse(function(child) {
                if (child.material) {
                  const materials = Array.isArray(child.material) ? child.material : [child.material];
                  materials.forEach(function(material) {
                    // Set emissive to white
                    material.emissive = new THREE.Color(0xffffff);
                    material.emissiveIntensity = 0.3;
                    material.needsUpdate = true;
                  });
                }
              });
              
              console.log('Key model loaded, emissive white material applied');
            });
          }
          
          // Store references to door and case entities
          if (modelPath === 'data/models/door.glb') {
            doorEntity = modelEntity;
          }
          if (modelPath === 'data/models/case.glb') {
            caseEntity = modelEntity;
          }
        } else if (fileExtension === 'fbx') {
          // Use fbx-model component from aframe-extras for FBX files
          modelEntity.setAttribute('fbx-model', modelPath);
        }
        
        if (isStarPolyhedron) {
          // Model is positioned relative to parent
          modelEntity.setAttribute('position', '0 -0.09 0');
        } else {
          // Regular model positioning
          modelEntity.setAttribute('position', `${x} ${y} ${z}`);
        }
        
        modelEntity.setAttribute('scale', `${modelConfig.scale} ${modelConfig.scale} ${modelConfig.scale}`);
        
        // Set rotation if specified
        if (modelConfig.rotation) {
          if (isStarPolyhedron) {
            // For star polyhedrons, apply rotation to parent so everything rotates together
            parentEntity.setAttribute('rotation', `${modelConfig.rotation.x} ${modelConfig.rotation.y} ${modelConfig.rotation.z}`);
          } else {
            // For other models, apply rotation to model entity
            modelEntity.setAttribute('rotation', `${modelConfig.rotation.x} ${modelConfig.rotation.y} ${modelConfig.rotation.z}`);
          }
        }
        
        // Add light if specified
        if (modelConfig.hasLight) {
          const lightEntity = document.createElement('a-light');
          lightEntity.setAttribute('type', 'point');
          
          // Use custom light config if provided, otherwise use defaults
          if (modelConfig.lightConfig) {
            lightEntity.setAttribute('position', modelConfig.lightConfig.position || '0 0 0');
            lightEntity.setAttribute('decay', modelConfig.lightConfig.decay !== undefined ? modelConfig.lightConfig.decay : 1);
            lightEntity.setAttribute('distance', modelConfig.lightConfig.distance !== undefined ? modelConfig.lightConfig.distance : 7);
            lightEntity.setAttribute('intensity', modelConfig.lightConfig.intensity !== undefined ? modelConfig.lightConfig.intensity : 10);
            if (modelConfig.lightConfig.color) {
              lightEntity.setAttribute('color', modelConfig.lightConfig.color);
            } else {
              lightEntity.setAttribute('color', '#ffce7a');
            }
          } else {
            // Default light settings for other models
            lightEntity.setAttribute('position', '0 20.785 -8.241'); // Relative to lamp position
            lightEntity.setAttribute('color', '#ffce7a');
            lightEntity.setAttribute('intensity', '10');
            lightEntity.setAttribute('distance', '7');
          }
          
          modelEntity.appendChild(lightEntity);
        }
        
        if (isStarPolyhedron) {
          // Add model to parent, then add parent to scene
          parentEntity.appendChild(modelEntity);
          scene.appendChild(parentEntity);
          
          // Store parent reference for cylinder creation
          modelConfig.parentEntity = parentEntity;
        } else {
          // Add to scene directly
          scene.appendChild(modelEntity);
        }
      }
      
      console.log(`Loaded model: ${modelPath} at position (${x}, ${y}, ${z}) with scale ${modelConfig.scale}`);
    });
    
    // Add gold metal cylinders from star polyhedrons (as children of star lamp)
    // Cylinders use fixed offsets relative to parent, so they rotate with the parent
    const starPolyhedronConfigs = models.filter(m => m.path === 'data/models/star_polyhedron.glb');
    starPolyhedronConfigs.forEach(starPolyhedronConfig => {
      if (starPolyhedronConfig && starPolyhedronConfig.position && starPolyhedronConfig.parentEntity) {
        // Fixed offsets relative to star model (which is at 0,0,0 relative to parent)
        // For original stars: star at y=3.7, thin cylinder center at y=4.5, wide at y=5.230
        // So offsets are: thin center = 0.8, wide = 1.53 relative to star
        const thinCylinderOffsetY = 0.8; // Fixed offset from star model
        const wideCylinderOffsetY = 1.53; // Fixed offset from star model
        const cylinderHeight = 1.3; // Fixed height
        
        // Thin cylinder (position relative to parent, extends from star)
        const cylinderEntity = document.createElement('a-cylinder');
        cylinderEntity.setAttribute('position', `0 ${thinCylinderOffsetY} 0`); // Fixed offset relative to parent
        cylinderEntity.setAttribute('height', cylinderHeight);
        cylinderEntity.setAttribute('radius', '0.02'); // Thin cylinder
        cylinderEntity.setAttribute('scale', '0.5 1 0.5');
        cylinderEntity.setAttribute('material', 'color: #B8860B; metalness: 1.0; roughness: 0.2'); // Darker gold
        
        starPolyhedronConfig.parentEntity.appendChild(cylinderEntity);
        
        // Wider cylinder (position relative to parent)
        const wideCylinderEntity = document.createElement('a-cylinder');
        wideCylinderEntity.setAttribute('position', `0 ${wideCylinderOffsetY} 0`); // Fixed offset relative to parent
        wideCylinderEntity.setAttribute('height', '0.3');
        wideCylinderEntity.setAttribute('radius', '0.08'); // Wider cylinder
        wideCylinderEntity.setAttribute('scale', '2 2 2');
        wideCylinderEntity.setAttribute('material', 'color: #B8860B; metalness: 1.0; roughness: 0.2'); // Darker gold
        
        starPolyhedronConfig.parentEntity.appendChild(wideCylinderEntity);
        
        console.log(`Added gold cylinders to star lamp at (y=${starPolyhedronConfig.position.y}, z=${starPolyhedronConfig.position.z})`);
      }
    });
  }
}

