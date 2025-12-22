// ============================================
// MINIMAP & UI ENHANCEMENTS
// ============================================

let minimapCanvas;
let minimapCtx;
const MINIMAP_SIZE = 150;
const MINIMAP_SCALE = 2; // Arena units per pixel

// Initialize minimap
function initMinimap() {
    minimapCanvas = document.createElement('canvas');
    minimapCanvas.id = 'minimap';
    minimapCanvas.width = MINIMAP_SIZE;
    minimapCanvas.height = MINIMAP_SIZE;
    minimapCanvas.style.cssText = `
        position: fixed;
        top: 80px;
        right: 10px;
        border: 3px solid rgba(0, 255, 0, 0.5);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.8);
        z-index: 1000;
    `;
    document.body.appendChild(minimapCanvas);
    minimapCtx = minimapCanvas.getContext('2d');
}

// Update minimap every frame
function updateMinimap() {
    if (!minimapCtx || !gameState.playing) return;

    // Clear canvas
    minimapCtx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Background
    minimapCtx.fillStyle = 'rgba(10, 10, 30, 0.9)';
    minimapCtx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Grid lines
    minimapCtx.strokeStyle = 'rgba(50, 50, 70, 0.5)';
    minimapCtx.lineWidth = 1;
    for (let i = 0; i < MINIMAP_SIZE; i += 30) {
        minimapCtx.beginPath();
        minimapCtx.moveTo(i, 0);
        minimapCtx.lineTo(i, MINIMAP_SIZE);
        minimapCtx.stroke();
        minimapCtx.beginPath();
        minimapCtx.moveTo(0, i);
        minimapCtx.lineTo(MINIMAP_SIZE, i);
        minimapCtx.stroke();
    }

    const center = MINIMAP_SIZE / 2;

    // Draw zombies as red dots
    minimapCtx.fillStyle = '#ff3333';
    zombies.forEach(zombie => {
        const dx = (zombie.position.x - player.position.x) / MINIMAP_SCALE;
        const dz = (zombie.position.z - player.position.z) / MINIMAP_SCALE;
        const x = center + dx;
        const y = center + dz;

        // Only draw if in minimap range
        if (x >= 0 && x <= MINIMAP_SIZE && y >= 0 && y <= MINIMAP_SIZE) {
            minimapCtx.beginPath();
            minimapCtx.arc(x, y, 3, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    });

    // Draw player as green triangle
    minimapCtx.save();
    minimapCtx.translate(center, center);
    minimapCtx.rotate(player.yaw);
    minimapCtx.fillStyle = '#00ff00';
    minimapCtx.beginPath();
    minimapCtx.moveTo(0, -6);
    minimapCtx.lineTo(-4, 4);
    minimapCtx.lineTo(4, 4);
    minimapCtx.closePath();
    minimapCtx.fill();
    minimapCtx.restore();
}

// Render health bar above zombie
function renderZombieHealthBar(zombie) {
    if (zombie.userData.health >= zombie.userData.maxHealth) return;

    const healthPercent = zombie.userData.health / zombie.userData.maxHealth;
    const barWidth = 0.8;
    const barHeight = 0.1;
    const yOffset = 2.5 * ZOMBIE_TYPES[zombie.userData.zombieType].scale;

    // Create health bar geometry if not exists
    if (!zombie.userData.healthBar) {
        const barGroup = new THREE.Group();

        // Background (red)
        const bgGeo = new THREE.PlaneGeometry(barWidth, barHeight);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        barGroup.add(bg);

        // Foreground (green - health)
        const fgGeo = new THREE.PlaneGeometry(barWidth, barHeight);
        const fgMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        const fg = new THREE.Mesh(fgGeo, fgMat);
        fg.position.x = -barWidth / 2;
        barGroup.add(fg);

        barGroup.position.y = yOffset;
        zombie.add(barGroup);
        zombie.userData.healthBar = { group: barGroup, fg: fg };
    }

    // Update health bar
    const { fg, group } = zombie.userData.healthBar;
    fg.scale.x = healthPercent;
    fg.position.x = -barWidth / 2 + (barWidth * healthPercent) / 2;

    // Color based on health
    if (healthPercent > 0.6) {
        fg.material.color.setHex(0x00ff00);
    } else if (healthPercent > 0.3) {
        fg.material.color.setHex(0xffff00);
    } else {
        fg.material.color.setHex(0xff8800);
    }

    // Billboard effect (always face camera)
    group.quaternion.copy(camera.quaternion);
}

// Clean up health bar when zombie dies
function removeZombieHealthBar(zombie) {
    if (zombie.userData.healthBar) {
        zombie.remove(zombie.userData.healthBar.group);
        delete zombie.userData.healthBar;
    }
}
