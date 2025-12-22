//============================================
// PERFORMANCE OPTIMIZATION FUNCTIONS
//============================================

// Initialize object pools
function initObjectPools() {
    // Pre-create particle pool
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const geometry = new THREE.SphereGeometry(0.05, 4, 4);
        const material = new THREE.MeshBasicMaterial();
        const particle = new THREE.Mesh(geometry, material);
        particle.visible = false;
        particle.userData.active = false;
        scene.add(particle);
        particlePool.push(particle);
    }
}

// Get particle from pool
function getParticleFromPool() {
    for (let particle of particlePool) {
        if (!particle.userData.active) {
            particle.userData.active = true;
            particle.visible = true;
            return particle;
        }
    }
    return null;
}

// Return particle to pool
function returnParticleToPool(particle) {
    particle.userData.active = false;
    particle.visible = false;
}

// Initialize FPS monitor
function initPerformanceMonitor() {
    const fpsDisplay = document.createElement('div');
    fpsDisplay.id = 'fps-counter';
    fpsDisplay.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.7);
        color: #0f0;
        padding: 5px 10px;
        font-family: monospace;
        font-size: 14px;
        z-index: 1000;
        border-radius: 4px;
    `;
    document.body.appendChild(fpsDisplay);
    setInterval(updatePerformanceStats, 1000);
}

// Update performance stats
function updatePerformanceStats() {
    const fpsDisplay = document.getElementById('fps-counter');
    if (fpsDisplay) {
        performanceStats.zombieCount = zombies.length;
        fpsDisplay.innerHTML = `FPS: ${Math.round(performanceStats.fps)}<br>Zombies: ${performanceStats.zombieCount}<br>Particles: ${particles.length}`;
    }
}

// Get cached geometry
function getCachedGeometry(key, createFunc) {
    if (!geometryCache[key]) {
        geometryCache[key] = createFunc();
    }
    return geometryCache[key];
}

// Get cached material
function getCachedMaterial(key, createFunc) {
    if (!materialCache[key]) {
        materialCache[key] = createFunc();
    }
    return materialCache[key];
}
