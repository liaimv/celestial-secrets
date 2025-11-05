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
  function getClosestRing(point, snapThreshold = 2) {
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
          y: 0,
          z: Math.sin(angle) * ring.radius
        };
      }
    });
    
    return { ring: closestRing, position: snapPosition, distance: minDistance };
  }
  
  // Global drag state
  let currentDraggedElement = null;
  let isDragging = false;
  let isOrbiting = false;
  
  // Planet order data (correct radius for each planet)
  const planetOrder = {
    'mercury': 3,
    'venus': 4.5,
    'earth': 6,
    'mars': 7.5,
    'jupiter': 10,
    'saturn': 12.5,
    'uranus': 15,
    'neptune': 17
  };
  
  // Check if all planets are in correct order
  function checkPlanetOrder() {
    const planets = document.querySelectorAll('[data-planet]');
    let allCorrect = true;
    let planetsOnRings = 0;
    
    planets.forEach(planet => {
      const planetName = planet.getAttribute('data-planet');
      const correctRadius = planetOrder[planetName];
      const currentRing = planet.getAttribute('data-current-ring');
      
      if (!currentRing) {
        allCorrect = false;
        return;
      }
      
      const currentRadius = parseFloat(currentRing);
      const tolerance = 0.1; // Allow small tolerance for floating point comparison
      
      if (Math.abs(currentRadius - correctRadius) > tolerance) {
        allCorrect = false;
      } else {
        planetsOnRings++;
      }
    });
    
    // Need all 8 planets on rings and all in correct positions
    if (allCorrect && planetsOnRings === 8) {
      if (!isOrbiting) {
        startOrbitalAnimation();
      }
    } else {
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
      
      this.time += timeDelta * 0.001;
      const angle = this.data.angle + (this.time * this.data.speed);
      const x = Math.cos(angle) * this.data.radius;
      const z = Math.sin(angle) * this.data.radius;
      
      this.el.setAttribute('position', { x: x, y: 0, z: z });
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
      
      // Calculate initial angle from current position
      const pos = planet.getAttribute('position');
      const currentAngle = Math.atan2(pos.z, pos.x);
      
      // Add orbit animation component
      planet.setAttribute('orbit-animation', {
        radius: radius,
        speed: speed,
        angle: currentAngle
      });
      
      // Start the animation
      if (planet.components && planet.components['orbit-animation']) {
        planet.components['orbit-animation'].play();
      }
    });
    
    // Visual feedback - maybe show a message or change lighting
    const scene = document.querySelector('a-scene');
    if (scene) {
      // You could add a visual indicator here
      console.log('Orbital animation started!');
    }
  }
  
  // Stop orbital animation
  function stopOrbitalAnimation() {
    if (!isOrbiting) return;
    
    isOrbiting = false;
    console.log('Planets moved - stopping orbital animation');
    
    const planets = document.querySelectorAll('[data-planet]');
    planets.forEach(planet => {
      // Pause the animation but keep component
      if (planet.components && planet.components['orbit-animation']) {
        planet.components['orbit-animation'].pause();
      }
    });
  }
  
  // Draggable component
  AFRAME.registerComponent('draggable', {
    init: function() {
      // Get planet's target radius
      this.targetRadius = parseFloat(this.el.getAttribute('data-radius')) || 5;
      
      // Add a class to make it easier to find
      this.el.classList.add('draggable-planet');
      
      // Store reference for global drag handler
      this.el.draggableComponent = this;
      
      // Store the starting position (initial position from HTML)
      const startPos = this.el.getAttribute('position');
      this.startingPosition = {
        x: startPos.x,
        y: startPos.y,
        z: startPos.z
      };
      
      console.log('Draggable component initialized for:', this.el.getAttribute('data-planet') || 'unknown');
    },
    
    startDrag: function() {
      if (isDragging) return;
      isDragging = true;
      currentDraggedElement = this.el;
      
      // Stop orbital animation when dragging starts
      if (isOrbiting) {
        stopOrbitalAnimation();
      }
      
      // Pause this planet's orbit animation if it has one
      if (this.el.components && this.el.components['orbit-animation']) {
        this.el.components['orbit-animation'].pause();
      }
      
      // Visual feedback
      this.el.setAttribute('animation__scale', {
        property: 'scale',
        to: '1.2 1.2 1.2',
        dur: 200
      });
      
      // Store initial drag position
      const pos = this.el.getAttribute('position');
      this.dragStartPos = { x: pos.x, y: pos.y, z: pos.z };
    },
    
    updateDrag: function(intersectPoint) {
      if (!isDragging || currentDraggedElement !== this.el) return;
      
      // Check if we're close to any ring
      const closest = getClosestRing(intersectPoint, 3);
      
      if (closest.ring && closest.position) {
        // Constrain to ring
        this.el.setAttribute('position', closest.position);
      } else {
        // Free drag
        this.el.setAttribute('position', {
          x: intersectPoint.x,
          y: 0,
          z: intersectPoint.z
        });
      }
    },
    
    endDrag: function() {
      if (!isDragging || currentDraggedElement !== this.el) return;
      
      isDragging = false;
      
      // Visual feedback
      this.el.setAttribute('animation__scale', {
        property: 'scale',
        to: '1 1 1',
        dur: 200
      });
      
      // Get current position
      const pos = this.el.getAttribute('position');
      const currentPos = { x: pos.x, y: pos.y, z: pos.z };
      
      // Snap to closest ring if within threshold
      const closest = getClosestRing(currentPos, 2);
      
      // Check if planet is close enough to a ring
      const isOnRing = closest.ring && closest.position && closest.distance < 2;
      
      if (isOnRing) {
        // Snap to ring position
        this.el.setAttribute('animation__snap', {
          property: 'position',
          to: `${closest.position.x} ${closest.position.y} ${closest.position.z}`,
          dur: 300,
          easing: 'easeOutCubic'
        });
        
        // Update target radius
        this.targetRadius = closest.ring.radius;
        
        // Store which ring this planet is on
        this.el.setAttribute('data-current-ring', closest.ring.radius);
        
        // Check if all planets are in correct order after a short delay
        setTimeout(checkPlanetOrder, 350);
      } else {
        // Planet is not on a ring - pop back to starting position instantly
        this.el.removeAttribute('data-current-ring');
        
        // Instantly set position back to starting position (no animation)
        this.el.setAttribute('position', {
          x: this.startingPosition.x,
          y: this.startingPosition.y,
          z: this.startingPosition.z
        });
        
        // Remove any snap animations
        this.el.removeAttribute('animation__snap');
        
        // Remove orbit animation if it exists
        if (this.el.components && this.el.components['orbit-animation']) {
          this.el.components['orbit-animation'].pause();
          this.el.removeAttribute('orbit-animation');
        }
        
        // Stop orbital animation if it was running
        if (isOrbiting) {
          stopOrbitalAnimation();
        }
      }
      
      currentDraggedElement = null;
    }
  });
  
  // Global mouse/touch handlers
  function getCamera() {
    const scene = document.querySelector('a-scene');
    if (!scene) return null;
    
    // Try to get camera from A-Frame's camera system (most reliable)
    if (scene.systems && scene.systems.camera && scene.systems.camera.camera) {
      return scene.systems.camera.camera;
    }
    
    // Fallback: get from camera element
    const cameraEl = scene.querySelector('a-camera') || scene.camera;
    if (!cameraEl) return null;
    
    // A-Frame camera might be wrapped in a Group, find the actual camera inside
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) return null;
    
    let cameraObj = cameraEl.object3D;
    if (!cameraObj) return null;
    
    // If it's a Group, find the actual camera inside
    if (cameraObj.type === 'Group' || cameraObj.type === 'Object3D') {
      let foundCamera = null;
      cameraObj.traverse((child) => {
        if (child.type === 'PerspectiveCamera' || child.type === 'OrthographicCamera') {
          foundCamera = child;
        }
      });
      if (foundCamera) {
        return foundCamera;
      }
    }
    
    // If it's already a camera, return it
    if (cameraObj.type === 'PerspectiveCamera' || cameraObj.type === 'OrthographicCamera') {
      return cameraObj;
    }
    
    return null;
  }
  
  function getMousePosition(e) {
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) return null;
    
    const mouse = new THREE.Vector2();
    if (e.type === 'touchmove' || e.type === 'touchstart') {
      const touch = e.touches[0];
      if (!touch) return null;
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    } else {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    return mouse;
  }
  
  function getIntersectPoint(mouse) {
    const camera = getCamera();
    if (!camera) return null;
    
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) return null;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Create a plane at y=0 for dragging
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    
    return intersectPoint;
  }
  
  // Mouse down handler - detect which planet was clicked
  function handleMouseDown(e) {
    if (isDragging) return;
    
    // Don't prevent default on all clicks - only when we actually hit something
    const camera = getCamera();
    if (!camera) {
      return;
    }
    
    const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!THREE) {
      console.warn('THREE.js not available');
      return;
    }
    
    const mouse = getMousePosition(e);
    if (!mouse) {
      return;
    }
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Get all draggable planets
    const draggables = document.querySelectorAll('.draggable-planet, [data-planet]');
    const intersects = [];
    
    draggables.forEach(el => {
      // Make sure object3D is available
      if (!el.object3D || !el.object3D.visible) return;
      
      try {
        // Check intersection with the entire object (including nested children)
        const intersectResults = raycaster.intersectObject(el.object3D, true);
        
        if (intersectResults.length > 0) {
          // Find the closest intersection for this object
          const closestIntersect = intersectResults[0];
          intersects.push({ 
            el: el, 
            distance: closestIntersect.distance,
            point: closestIntersect.point
          });
        }
      } catch (err) {
        console.warn('Error checking intersection for planet:', err);
      }
    });
    
    if (intersects.length > 0) {
      // Prevent default only when we hit something
      e.preventDefault();
      e.stopPropagation();
      
      // Find closest intersection
      intersects.sort((a, b) => a.distance - b.distance);
      const closest = intersects[0];
      
      console.log('Planet clicked:', closest.el.getAttribute('data-planet'), closest.el);
      
      // Check if component exists, if not, wait a bit and try again
      if (closest.el.draggableComponent) {
        closest.el.draggableComponent.startDrag();
      } else {
        // Component might not be initialized yet, try to access it
        const component = closest.el.components && closest.el.components.draggable;
        if (component) {
          component.startDrag();
        } else {
          console.warn('Draggable component not found for element, attempting to attach...');
          // Try to attach component
          closest.el.setAttribute('draggable', '');
          // Wait a bit and try again
          setTimeout(() => {
            if (closest.el.components && closest.el.components.draggable) {
              closest.el.components.draggable.startDrag();
            }
          }, 50);
        }
      }
    }
  }
  
  // Mouse move handler
  function handleMouseMove(e) {
    if (!isDragging || !currentDraggedElement) return;
    
    e.preventDefault();
    
    const mouse = getMousePosition(e);
    if (!mouse) return;
    
    const intersectPoint = getIntersectPoint(mouse);
    
    if (intersectPoint && currentDraggedElement.draggableComponent) {
      currentDraggedElement.draggableComponent.updateDrag(intersectPoint);
    }
  }
  
  // Mouse up handler
  function handleMouseUp(e) {
    if (!isDragging || !currentDraggedElement) return;
    
    e.preventDefault();
    
    if (currentDraggedElement.draggableComponent) {
      currentDraggedElement.draggableComponent.endDrag();
    }
  }
  
  // Attach draggable component to all elements with draggable class
  function attachDraggableComponents() {
    const draggableElements = document.querySelectorAll('.draggable, [data-planet]');
    draggableElements.forEach(el => {
      // Only attach if not already attached
      if (!el.components || !el.components.draggable) {
        el.setAttribute('draggable', '');
        console.log('Attached draggable component to:', el.getAttribute('data-planet') || 'unknown');
      }
    });
  }
  
  // Attach global event listeners
  function attachEventListeners() {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    console.log('Event listeners attached');
  }
  
  if (scene) {
    // Function to initialize everything
    function initializeDrag() {
      attachDraggableComponents();
      attachEventListeners();
    }
    
    // Check if scene is already loaded
    if (scene.hasLoaded) {
      // Wait a bit for components to initialize
      setTimeout(initializeDrag, 100);
    } else {
      scene.addEventListener('loaded', function() {
        setTimeout(initializeDrag, 100);
      });
    }
  } else {
    // Fallback: attach after a short delay
    setTimeout(() => {
      attachDraggableComponents();
      attachEventListeners();
    }, 500);
  }
}
