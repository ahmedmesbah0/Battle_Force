/**
 * BATTLE FORCE - Professional Zombie Shooter
 * Three.js Web Game
 * 
 * Team: Ahmed Mesbah Ahmed & Ziad Ahmed Al-Junadi
 * Course: Computer Graphics Fall 2025/2026
 */

// Global variables
let camera, scene, renderer;
let player = {
    height: 1.7,
    speed: 0.15,
    yaw: 0,
    pitch: 0,
    health: 100,
    maxHealth: 100,
    position: new THREE.Vector3(0, 1.7, 0),
    damageBoost: 1.0,
    damageBoostExpiry: 0
};

// Weapon definitions
const WEAPONS = {
    PISTOL: {
        name: 'Pistol',
        damage: 25,
        fireRate: 200,
        magSize: 12,
        reserveAmmo: 36,
        pellets: 1,
        spread: 0,
        reloadTime: 1500,
        icon: '🔫'
    },
    RIFLE: {
        name: 'Rifle',
        damage: 35,
        fireRate: 80,
        magSize: 30,
        reserveAmmo: 120,
        pellets: 1,
        spread: 0.01,
        reloadTime: 2000,
        icon: '🔫'
    },
    SHOTGUN: {
        name: 'Shotgun',
        damage: 15,
        fireRate: 800,
        magSize: 6,
        reserveAmmo: 24,
        pellets: 8,
        spread: 0.15,
        reloadTime: 2500,
        icon: '💥'
    },
    SNIPER: {
        name: 'Sniper',
        damage: 100,
        fireRate: 1500,
        magSize: 5,
        reserveAmmo: 20,
        pellets: 1,
        spread: 0,
        reloadTime: 3000,
        icon: '🎯'
    }
};

let currentWeaponKey = 'PISTOL';
let weaponStates = {
    PISTOL: { currentAmmo: 12, reserveAmmo: 36, reloading: false, lastShot: 0 },
    RIFLE: { currentAmmo: 30, reserveAmmo: 120, reloading: false, lastShot: 0 },
    SHOTGUN: { currentAmmo: 6, reserveAmmo: 24, reloading: false, lastShot: 0 },
    SNIPER: { currentAmmo: 5, reserveAmmo: 20, reloading: false, lastShot: 0 }
};

// Zombie type definitions
const ZOMBIE_TYPES = {
    NORMAL: {
        name: 'Normal',
        health: 100,
        speed: 0.03,
        damage: 10,
        points: 100,
        color: 0x2ecc71,
        emissive: 0x00ff00,
        scale: 1.0,
        attackRate: 1000
    },
    FAST: {
        name: 'Fast',
        health: 50,
        speed: 0.08,
        damage: 5,
        points: 150,
        color: 0xf1c40f,
        emissive: 0xffff00,
        scale: 0.8,
        attackRate: 500
    },
    TANK: {
        name: 'Tank',
        health: 300,
        speed: 0.015,
        damage: 25,
        points: 300,
        color: 0xe74c3c,
        emissive: 0xff0000,
        scale: 1.5,
        attackRate: 1500
    },
    EXPLODER: {
        name: 'Exploder',
        health: 75,
        speed: 0.04,
        damage: 0,
        explosionDamage: 50,
        explosionRadius: 8,
        points: 200,
        color: 0xe67e22,
        emissive: 0xff6600,
        scale: 0.9,
        attackRate: 0
    }
};

let moveState = { forward: false, backward: false, left: false, right: false };
let mouseButtonDown = false; // Track mouse button state for auto-fire
let gameState = {
    playing: false,
    wave: 1,
    kills: 0,
    score: 0,
    points: 0,
    highScore: parseInt(localStorage.getItem('battleForceHighScore')) || 0,
    zombiesKilled: 0,
    zombiesThisWave: 10,
    startTime: 0,
    pointerLocked: false,
    lastKillTime: 0,
    comboMultiplier: 1.0,
    shopOpen: false,
    paused: false
};

let zombies = [];
let obstacles = [];
let particles = [];
let raycaster = new THREE.Raycaster();
let clock = new THREE.Clock();
let audioContext;

const ARENA_SIZE = 50;
const SPAWN_DISTANCE = 30;
const COMBO_WINDOW = 3000; // 3 seconds

// Initialize game
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a15);
    scene.fog = new THREE.Fog(0x0a0a15, 10, 80);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.copy(player.position);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Initialize audio
    initAudio();

    createArena();
    createLighting();
    setupControls();

    setTimeout(() => document.getElementById('loading').classList.add('hidden'), 500);
}

// Audio system
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Web Audio API not supported');
    }
}

function playSound(type) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'shoot':
            oscillator.frequency.value = currentWeaponKey === 'SHOTGUN' ? 100 :
                currentWeaponKey === 'SNIPER' ? 150 : 200;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'reload':
            oscillator.frequency.value = 300;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'explosion':
            oscillator.frequency.value = 50;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
        case 'zombie_death':
            oscillator.frequency.value = 150;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'hit':
            oscillator.frequency.value = 800;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
    }
}

// Create arena
function createArena() {
    // Ground with texture
    const groundGeometry = new THREE.PlaneGeometry(ARENA_SIZE * 2, ARENA_SIZE * 2);
    const groundTexture = createConcreteTexture();
    const groundMaterial = new THREE.MeshPhongMaterial({ map: groundTexture, shininess: 10 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.type = 'ground';
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(ARENA_SIZE * 2, 50, 0x444444, 0x222222);
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Walls
    createWalls();

    // Enhanced obstacles
    createEnhancedObstacles();
}

function createConcreteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 8000; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 0.15})`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
}

function createWalls() {
    const wallHeight = 5;
    const brickTexture = createBrickTexture();
    const wallMaterial = new THREE.MeshPhongMaterial({ map: brickTexture, shininess: 5 });

    const positions = [
        { x: 0, z: ARENA_SIZE, rx: 0 },
        { x: 0, z: -ARENA_SIZE, rx: 0 },
        { x: ARENA_SIZE, z: 0, rx: Math.PI / 2 },
        { x: -ARENA_SIZE, z: 0, rx: Math.PI / 2 }
    ];

    positions.forEach(pos => {
        const wallGeometry = new THREE.PlaneGeometry(ARENA_SIZE * 2, wallHeight);
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(pos.x, wallHeight / 2, pos.z);
        wall.rotation.y = pos.rx;
        wall.receiveShadow = true;
        wall.castShadow = true;
        wall.userData.type = 'wall';
        scene.add(wall);
    });
}

function createBrickTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#666666';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const brickWidth = 100, brickHeight = 40, mortarWidth = 8;

    for (let y = 0; y < canvas.height; y += brickHeight + mortarWidth) {
        for (let x = 0; x < canvas.width; x += brickWidth + mortarWidth) {
            const offsetX = (y / (brickHeight + mortarWidth)) % 2 === 0 ? 0 : (brickWidth + mortarWidth) / 2;
            const brickX = (x + offsetX) % canvas.width;

            const red = 140 + Math.random() * 30 - 15;
            ctx.fillStyle = `rgb(${red}, ${red * 0.3}, ${red * 0.2})`;
            ctx.fillRect(brickX, y, brickWidth, brickHeight);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    return texture;
}

function createEnhancedObstacles() {
    const obstacleConfigs = [
        // Wooden crates (destructible)
        { type: 'crate', x: 15, z: 15 },
        { type: 'crate', x: -15, z: 15 },
        { type: 'crate', x: 15, z: -15 },
        { type: 'crate', x: -15, z: -15 },
        { type: 'crate', x: 0, z: 20 },
        { type: 'crate', x: 0, z: -20 },

        // Metal barrels (cover)
        { type: 'barrel', x: 20, z: 0 },
        { type: 'barrel', x: -20, z: 0 },
        { type: 'barrel', x: 10, z: 10 },
        { type: 'barrel', x: -10, z: -10 },

        // Explosive barrels
        { type: 'explosive', x: 25, z: 25 },
        { type: 'explosive', x: -25, z: -25 },
        { type: 'explosive', x: 25, z: -25 },
        { type: 'explosive', x: -25, z: 25 },

        // Concrete barriers (moved away from spawn point)
        { type: 'barrier', x: 30, z: 15 },
        { type: 'barrier', x: -30, z: -15 },
        { type: 'barrier', x: 30, z: -15 }
    ];

    obstacleConfigs.forEach(config => {
        createObstacle(config.type, config.x, config.z);
    });
}

function createObstacle(type, x, z) {
    let obstacle;

    switch (type) {
        case 'crate':
            obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 2),
                new THREE.MeshPhongMaterial({ color: 0x8B4513, shininess: 5 })
            );
            obstacle.userData = { type: 'destructible', health: 100, maxHealth: 100 };
            break;

        case 'barrel':
            obstacle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 2, 16),
                new THREE.MeshPhongMaterial({ color: 0x708090, metalness: 0.5 })
            );
            obstacle.userData = { type: 'cover' };
            break;

        case 'explosive':
            obstacle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 2, 16),
                new THREE.MeshPhongMaterial({
                    color: 0xff0000,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.3
                })
            );
            obstacle.userData = { type: 'explosive', health: 50, maxHealth: 50 };
            break;

        case 'barrier':
            obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(4, 2, 1),
                new THREE.MeshPhongMaterial({ color: 0x555555 })
            );
            obstacle.userData = { type: 'cover' };
            break;
    }

    obstacle.position.set(x, type === 'barrier' ? 1 : 1, z);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Lighting
function createLighting() {
    const ambient = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x6666ff, 0.6);
    moonLight.position.set(20, 30, 10);
    moonLight.castShadow = true;
    moonLight.shadow.camera.left = -ARENA_SIZE;
    moonLight.shadow.camera.right = ARENA_SIZE;
    moonLight.shadow.camera.top = ARENA_SIZE;
    moonLight.shadow.camera.bottom = -ARENA_SIZE;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    scene.add(moonLight);

    // Corner lights
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const light = new THREE.PointLight(0x00ff00, 0.7, 35);
        light.position.set(Math.cos(angle) * 35, 4, Math.sin(angle) * 35);
        light.castShadow = true;
        scene.add(light);
    }
}

// Zombies
function createZombie(position, typeKey = null) {
    // Determine zombie type based on wave
    if (!typeKey) {
        const rand = Math.random();
        if (gameState.wave >= 5 && rand < 0.15) typeKey = 'TANK';
        else if (gameState.wave >= 3 && rand < 0.35) typeKey = 'EXPLODER';
        else if (gameState.wave >= 2 && rand < 0.55) typeKey = 'FAST';
        else typeKey = 'NORMAL';
    }

    const zombieType = ZOMBIE_TYPES[typeKey];
    const zombie = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4 * zombieType.scale, 0.3 * zombieType.scale, 1.5 * zombieType.scale, 8),
        new THREE.MeshPhongMaterial({
            color: zombieType.color,
            emissive: zombieType.emissive,
            emissiveIntensity: 0.2
        })
    );
    body.position.y = 0.75 * zombieType.scale;
    body.castShadow = true;
    zombie.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.35 * zombieType.scale, 8, 8),
        new THREE.MeshPhongMaterial({
            color: zombieType.color,
            emissive: zombieType.emissive,
            emissiveIntensity: 0.3
        })
    );
    head.position.y = 1.8 * zombieType.scale;
    head.castShadow = true;
    head.userData.isHead = true;
    zombie.add(head);

    const eyeColor = typeKey === 'EXPLODER' ? 0xff6600 : 0xff0000;
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: eyeColor, emissive: eyeColor });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08 * zombieType.scale, 6, 6), eyeMaterial);
    leftEye.position.set(-0.15 * zombieType.scale, 1.9 * zombieType.scale, 0.3 * zombieType.scale);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.08 * zombieType.scale, 6, 6), eyeMaterial);
    rightEye.position.set(0.15 * zombieType.scale, 1.9 * zombieType.scale, 0.3 * zombieType.scale);
    zombie.add(leftEye, rightEye);

    zombie.position.copy(position);
    zombie.userData = {
        health: zombieType.health,
        maxHealth: zombieType.health,
        speed: zombieType.speed + Math.random() * 0.01,
        damage: zombieType.damage,
        type: 'zombie',
        zombieType: typeKey,
        points: zombieType.points,
        attackRate: zombieType.attackRate,
        lastAttack: 0,
        movePattern: 0
    };

    scene.add(zombie);
    zombies.push(zombie);
}

function spawnWave() {
    const count = gameState.zombiesThisWave;
    const isBossWave = gameState.wave % 5 === 0;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = SPAWN_DISTANCE + Math.random() * 10;
        const spawnPos = new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);

        setTimeout(() => {
            let typeKey = null;
            if (isBossWave && i < 3) typeKey = 'TANK'; // Boss wave has guaranteed tanks
            createZombie(spawnPos, typeKey);
        }, i * 500);
    }

    updateWaveUI();
}

function updateZombies(delta) {
    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];
        const zombieType = ZOMBIE_TYPES[zombie.userData.zombieType];
        const direction = new THREE.Vector3().subVectors(player.position, zombie.position).normalize();
        direction.y = 0;

        // Type-specific movement
        if (zombie.userData.zombieType === 'FAST') {
            // Zigzag movement
            zombie.userData.movePattern += delta * 5;
            const zigzag = Math.sin(zombie.userData.movePattern) * 0.5;
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            direction.add(perpendicular.multiplyScalar(zigzag));
            direction.normalize();
        } else if (zombie.userData.zombieType === 'EXPLODER') {
            const distanceToPlayer = zombie.position.distanceTo(player.position);
            if (distanceToPlayer < 10) {
                // Speed up when close
                zombie.userData.speed = zombieType.speed * 2;
            }
        }

        // Move zombie (no obstacle collision - they pass through)
        const moveVector = direction.clone().multiplyScalar(zombie.userData.speed);
        zombie.position.add(moveVector);

        zombie.lookAt(player.position);
        zombie.position.y = Math.sin(Date.now() * 0.005 + i) * 0.1;

        // Exploder proximity check
        if (zombie.userData.zombieType === 'EXPLODER') {
            const distanceToPlayer = zombie.position.distanceTo(player.position);
            if (distanceToPlayer < zombieType.explosionRadius * 0.3) {
                explodeZombie(zombie);
                continue;
            }
            // Pulsing effect
            const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
            zombie.scale.setScalar(pulse);
        }

        const distance = zombie.position.distanceTo(player.position);
        if (distance < 2 && zombie.userData.zombieType !== 'EXPLODER') {
            attackPlayer(zombie);
        }

        if (zombie.userData.health <= 0) {
            if (zombie.userData.zombieType === 'EXPLODER') {
                explodeZombie(zombie);
            } else {
                killZombie(zombie, i);
            }
        }
    }
}

function killZombie(zombie, index) {
    scene.remove(zombie);
    zombies.splice(index, 1);

    playSound('zombie_death');

    // Award points with combo multiplier
    const now = Date.now();
    if (now - gameState.lastKillTime < COMBO_WINDOW) {
        gameState.comboMultiplier = Math.min(gameState.comboMultiplier + 0.5, 3.0);
    } else {
        gameState.comboMultiplier = 1.0;
    }
    gameState.lastKillTime = now;

    const pointsEarned = Math.floor(zombie.userData.points * gameState.comboMultiplier);
    gameState.score += pointsEarned;
    gameState.points += pointsEarned;
    gameState.kills++;
    gameState.zombiesKilled++;

    showFloatingText(zombie.position, `+${pointsEarned}`);
    updateUI();

    if (gameState.zombiesKilled >= gameState.zombiesThisWave) {
        completeWave();
    }
}

function explodeZombie(zombie) {
    playSound('explosion');
    createExplosion(zombie.position, ZOMBIE_TYPES.EXPLODER.explosionRadius);

    const index = zombies.indexOf(zombie);
    if (index !== -1) {
        scene.remove(zombie);
        zombies.splice(index, 1);
        gameState.zombiesKilled++;

        // Award points even for exploder
        gameState.score += zombie.userData.points;
        gameState.points += zombie.userData.points;
        gameState.kills++;

        updateUI();

        if (gameState.zombiesKilled >= gameState.zombiesThisWave) {
            completeWave();
        }
    }
}

function createExplosion(position, radius) {
    // Visual effect
    const explosionGeo = new THREE.SphereGeometry(radius, 16, 16);
    const explosionMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.7
    });
    const explosion = new THREE.Mesh(explosionGeo, explosionMat);
    explosion.position.copy(position);
    scene.add(explosion);

    // Damage everything in radius
    const explosionDamage = ZOMBIE_TYPES.EXPLODER.explosionDamage;

    // Damage player
    if (player.position.distanceTo(position) < radius) {
        damagePlayer(explosionDamage);
    }

    // Damage other zombies
    zombies.forEach(z => {
        if (z.position.distanceTo(position) < radius) {
            z.userData.health -= explosionDamage;
        }
    });

    // Damage obstacles
    obstacles.forEach(obs => {
        if (obs.position.distanceTo(position) < radius) {
            if (obs.userData.type === 'destructible' || obs.userData.type === 'explosive') {
                damageObstacle(obs, explosionDamage);
            }
        }
    });

    // Particles
    for (let i = 0; i < 20; i++) {
        createParticle(position, 0xff6600);
    }

    // Camera shake
    cameraShake(0.5);

    // Remove explosion visual
    setTimeout(() => {
        explosion.material.opacity -= 0.1;
        if (explosion.material.opacity <= 0) {
            scene.remove(explosion);
        } else {
            setTimeout(arguments.callee, 50);
        }
    }, 50);
}

function damageObstacle(obstacle, damage) {
    if (!obstacle.userData.health) return;

    obstacle.userData.health -= damage;

    if (obstacle.userData.health <= 0) {
        if (obstacle.userData.type === 'explosive') {
            createExplosion(obstacle.position, 6);
        }

        const index = obstacles.indexOf(obstacle);
        if (index !== -1) {
            obstacles.splice(index, 1);
        }
        scene.remove(obstacle);

        // Spawn debris particles
        for (let i = 0; i < 10; i++) {
            createParticle(obstacle.position, 0x8B4513);
        }
    }
}

function attackPlayer(zombie) {
    const now = Date.now();
    if (!zombie.userData.lastAttack || now - zombie.userData.lastAttack > zombie.userData.attackRate) {
        damagePlayer(zombie.userData.damage);
        zombie.userData.lastAttack = now;
    }
}

// Shooting
function shoot() {
    const weapon = WEAPONS[currentWeaponKey];
    const weaponState = weaponStates[currentWeaponKey];

    if (weaponState.reloading || weaponState.currentAmmo <= 0) {
        if (weaponState.currentAmmo <= 0) reload();
        return;
    }

    const now = Date.now();
    if (now - weaponState.lastShot < weapon.fireRate) return;

    weaponState.lastShot = now;
    weaponState.currentAmmo--;
    updateUI();

    playSound('shoot');
    createMuzzleFlash();
    cameraShake(0.05);

    // Shotgun fires multiple pellets
    for (let i = 0; i < weapon.pellets; i++) {
        const spreadX = (Math.random() - 0.5) * weapon.spread;
        const spreadY = (Math.random() - 0.5) * weapon.spread;

        raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (let j = 0; j < intersects.length; j++) {
            const object = intersects[j].object;
            const parent = object.parent;

            if (parent && parent.userData.type === 'zombie') {
                const isHeadshot = object.userData.isHead;
                const damageMultiplier = (isHeadshot ? 2.0 : 1.0) * player.damageBoost;
                const finalDamage = weapon.damage * damageMultiplier;

                parent.userData.health -= finalDamage;

                playSound('hit');
                createBloodSplatter(intersects[j].point, parent.userData.zombieType);

                if (isHeadshot) {
                    showFloatingText(parent.position, 'HEADSHOT!');
                }

                const knockback = new THREE.Vector3()
                    .subVectors(intersects[j].point, camera.position)
                    .normalize()
                    .multiplyScalar(0.3);
                parent.position.add(knockback);
                break;
            } else if (intersects[j].object.userData.type === 'destructible' ||
                intersects[j].object.userData.type === 'explosive') {
                damageObstacle(intersects[j].object, weapon.damage);
                break;
            } else if (intersects[j].object.userData.type === 'ground' ||
                intersects[j].object.userData.type === 'wall' ||
                intersects[j].object.userData.type === 'cover') {
                // Hit terrain/cover - create impact effect
                createImpactEffect(intersects[j].point);
                break;
            }
        }
    }
}

function reload() {
    const weapon = WEAPONS[currentWeaponKey];
    const weaponState = weaponStates[currentWeaponKey];

    if (weaponState.reloading || weaponState.currentAmmo === weapon.magSize || weaponState.reserveAmmo <= 0) return;

    weaponState.reloading = true;
    playSound('reload');

    setTimeout(() => {
        const ammoNeeded = weapon.magSize - weaponState.currentAmmo;
        const ammoToReload = Math.min(ammoNeeded, weaponState.reserveAmmo);

        weaponState.currentAmmo += ammoToReload;
        weaponState.reserveAmmo -= ammoToReload;
        weaponState.reloading = false;

        updateUI();
    }, weapon.reloadTime);
}

function switchWeapon(weaponKey) {
    if (WEAPONS[weaponKey] && weaponKey !== currentWeaponKey) {
        currentWeaponKey = weaponKey;
        updateUI();
    }
}

function createMuzzleFlash() {
    const flash = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );

    const flashPos = camera.position.clone();
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    flashPos.add(forward.multiplyScalar(0.5));

    flash.position.copy(flashPos);
    scene.add(flash);

    const light = new THREE.PointLight(0xffff00, 2, 10);
    light.position.copy(flashPos);
    scene.add(light);

    setTimeout(() => {
        scene.remove(flash);
        scene.remove(light);
    }, 50);
}

function createBloodSplatter(position, zombieType) {
    const color = ZOMBIE_TYPES[zombieType].emissive;

    const splatter = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7 })
    );
    splatter.position.copy(position);
    scene.add(splatter);

    // Particles
    for (let i = 0; i < 5; i++) {
        createParticle(position, color);
    }

    let opacity = 0.7;
    const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        splatter.material.opacity = opacity;

        if (opacity <= 0) {
            scene.remove(splatter);
            clearInterval(fadeInterval);
        }
    }, 50);
}

function createImpactEffect(position) {
    const impact = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.8 })
    );
    impact.position.copy(position);
    scene.add(impact);

    setTimeout(() => scene.remove(impact), 100);
}

function createParticle(position, color) {
    const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 4, 4),
        new THREE.MeshBasicMaterial({ color: color })
    );
    particle.position.copy(position);

    const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        Math.random() * 0.3,
        (Math.random() - 0.5) * 0.2
    );

    particle.userData = { velocity: velocity, life: 1.0 };
    scene.add(particle);
    particles.push(particle);
}

function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        particle.userData.velocity.y -= 0.01; // Gravity
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(delta * 60));
        particle.userData.life -= delta;

        if (particle.userData.life <= 0) {
            scene.remove(particle);
            particles.splice(i, 1);
        }
    }
}

let shakeOffset = new THREE.Vector3();
let shakeIntensity = 0;

function cameraShake(intensity) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
}

function updateCameraShake(delta) {
    if (shakeIntensity > 0) {
        shakeOffset.set(
            (Math.random() - 0.5) * shakeIntensity,
            (Math.random() - 0.5) * shakeIntensity,
            (Math.random() - 0.5) * shakeIntensity
        );
        shakeIntensity *= 0.9;
        if (shakeIntensity < 0.001) shakeIntensity = 0;
    } else {
        shakeOffset.set(0, 0, 0);
    }
}

function showFloatingText(position, text) {
    // This would be better with HTML overlay, but we'll skip for now
    console.log(`${text} at position`, position);
}

// Player damage
function damagePlayer(damage) {
    player.health -= damage;
    player.health = Math.max(0, player.health);

    const indicator = document.getElementById('damage-indicator');
    indicator.classList.add('active');
    setTimeout(() => indicator.classList.remove('active'), 200);

    updateUI();

    if (player.health <= 0) gameOver();
}

// Wave system
function completeWave() {
    if (!gameState.playing) return;

    document.getElementById('wave-complete').classList.remove('hidden');
    gameState.playing = false;

    // Show shop
    setTimeout(() => {
        showShop();
    }, 500);
}

function nextWave() {
    gameState.wave++;
    gameState.zombiesThisWave = 10 + (gameState.wave * 3);
    gameState.zombiesKilled = 0;

    updateUI();
    spawnWave();
    gameState.playing = true;
}

function showShop() {
    gameState.shopOpen = true;
    // Hide wave complete overlay when showing shop
    document.getElementById('wave-complete').classList.add('hidden');
    document.getElementById('shop-overlay').classList.remove('hidden');
    updateShopUI();
}

function hideShop() {
    gameState.shopOpen = false;
    document.getElementById('shop-overlay').classList.add('hidden');

    let countdown = 3;
    document.getElementById('wave-countdown').textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown--;
        document.getElementById('wave-countdown').textContent = countdown;

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            document.getElementById('wave-complete').classList.add('hidden');
            nextWave();
        }
    }, 1000);
}

function updateShopUI() {
    document.getElementById('shop-points').textContent = gameState.points;
}

function buyItem(item) {
    let cost = 0;
    let canBuy = false;

    switch (item) {
        case 'health_upgrade':
            cost = 100;
            if (gameState.points >= cost) {
                player.maxHealth += 25;
                player.health = Math.min(player.health + 25, player.maxHealth);
                canBuy = true;
            }
            break;
        case 'heal':
            cost = 50;
            if (gameState.points >= cost && player.health < player.maxHealth) {
                player.health = player.maxHealth;
                canBuy = true;
            }
            break;
        case 'ammo':
            cost = 75;
            if (gameState.points >= cost) {
                Object.keys(weaponStates).forEach(key => {
                    weaponStates[key].reserveAmmo += WEAPONS[key].magSize * 2;
                });
                canBuy = true;
            }
            break;
        case 'damage':
            cost = 150;
            if (gameState.points >= cost) {
                player.damageBoost = 1.5;
                player.damageBoostExpiry = Date.now() + 30000; // 30 seconds
                canBuy = true;
            }
            break;
    }

    if (canBuy) {
        gameState.points -= cost;
        updateShopUI();
        updateUI();
    }
}

// Game flow
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameState.playing = true;
    gameState.startTime = Date.now();

    renderer.domElement.requestPointerLock();
    spawnWave();
    updateUI();
}

function gameOver() {
    gameState.playing = false;

    const survivalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(survivalTime / 60);
    const seconds = survivalTime % 60;

    document.getElementById('final-wave').textContent = gameState.wave;
    document.getElementById('final-kills').textContent = gameState.kills;
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('survival-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('battleForceHighScore', gameState.highScore);
        document.getElementById('new-highscore').classList.remove('hidden');
    }

    document.getElementById('gameover-screen').classList.remove('hidden');

    if (document.pointerLockElement) document.exitPointerLock();
}

function restartGame() {
    gameState = {
        playing: false,
        wave: 1,
        kills: 0,
        score: 0,
        points: 0,
        highScore: gameState.highScore,
        zombiesKilled: 0,
        zombiesThisWave: 10,
        startTime: 0,
        pointerLocked: false,
        lastKillTime: 0,
        comboMultiplier: 1.0,
        shopOpen: false,
        paused: false
    };

    player.health = player.maxHealth;
    player.damageBoost = 1.0;

    // Reset weapons
    weaponStates = {
        PISTOL: { currentAmmo: 12, reserveAmmo: 36, reloading: false, lastShot: 0 },
        RIFLE: { currentAmmo: 30, reserveAmmo: 120, reloading: false, lastShot: 0 },
        SHOTGUN: { currentAmmo: 6, reserveAmmo: 24, reloading: false, lastShot: 0 },
        SNIPER: { currentAmmo: 5, reserveAmmo: 20, reloading: false, lastShot: 0 }
    };
    currentWeaponKey = 'PISTOL';

    zombies.forEach(z => scene.remove(z));
    zombies = [];

    particles.forEach(p => scene.remove(p));
    particles = [];

    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('new-highscore').classList.add('hidden');

    startGame();
}

function togglePause() {
    if (gameState.shopOpen) return;

    gameState.paused = !gameState.paused;

    if (gameState.paused) {
        document.getElementById('pause-menu').classList.remove('hidden');
        if (document.pointerLockElement) document.exitPointerLock();
    } else {
        document.getElementById('pause-menu').classList.add('hidden');
        renderer.domElement.requestPointerLock();
    }
}

function resumeGame() {
    gameState.paused = false;
    document.getElementById('pause-menu').classList.add('hidden');
    renderer.domElement.requestPointerLock();
}

// UI
function updateUI() {
    // Health
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('health-bar').style.width = healthPercent + '%';
    document.getElementById('health-text').textContent = Math.floor(player.health);

    // Current weapon ammo
    const weaponState = weaponStates[currentWeaponKey];
    document.getElementById('ammo-current').textContent = weaponState.currentAmmo;
    document.getElementById('ammo-reserve').textContent = weaponState.reserveAmmo;

    if (weaponState.currentAmmo <= 5) {
        document.getElementById('ammo-current').classList.add('low');
    } else {
        document.getElementById('ammo-current').classList.remove('low');
    }

    // Score and combo
    document.getElementById('score-value').textContent = gameState.score;
    document.getElementById('points-value').textContent = gameState.points;

    if (gameState.comboMultiplier > 1) {
        document.getElementById('combo-display').classList.remove('hidden');
        document.getElementById('combo-value').textContent = `x${gameState.comboMultiplier.toFixed(1)}`;
    } else {
        document.getElementById('combo-display').classList.add('hidden');
    }

    document.getElementById('kill-count').textContent = gameState.kills;
    document.getElementById('highscore-value').textContent = gameState.highScore;

    // Weapon selection
    document.querySelectorAll('.weapon-slot').forEach((slot, index) => {
        const keys = ['PISTOL', 'RIFLE', 'SHOTGUN', 'SNIPER'];
        if (keys[index] === currentWeaponKey) {
            slot.classList.add('active');
        } else {
            slot.classList.remove('active');
        }

        const state = weaponStates[keys[index]];
        slot.querySelector('.weapon-ammo').textContent = `${state.currentAmmo}/${state.reserveAmmo}`;
    });

    // Check damage boost expiry
    if (player.damageBoost > 1.0 && Date.now() > player.damageBoostExpiry) {
        player.damageBoost = 1.0;
    }
}

function updateWaveUI() {
    document.getElementById('wave-number').textContent = gameState.wave;
    const remaining = gameState.zombiesThisWave - gameState.zombiesKilled;
    document.getElementById('zombies-remaining').textContent = `Kill ${remaining} zombies`;
}

// Controls
function setupControls() {
    document.addEventListener('keydown', e => {
        if (e.code === 'KeyW') moveState.forward = true;
        if (e.code === 'KeyS') moveState.backward = true;
        if (e.code === 'KeyA') moveState.left = true;
        if (e.code === 'KeyD') moveState.right = true;
        if (e.code === 'KeyR') reload();
        if (e.code === 'Digit1') switchWeapon('PISTOL');
        if (e.code === 'Digit2') switchWeapon('RIFLE');
        if (e.code === 'Digit3') switchWeapon('SHOTGUN');
        if (e.code === 'Digit4') switchWeapon('SNIPER');
        if (e.code === 'Escape') togglePause();
    });

    document.addEventListener('keyup', e => {
        if (e.code === 'KeyW') moveState.forward = false;
        if (e.code === 'KeyS') moveState.backward = false;
        if (e.code === 'KeyA') moveState.left = false;
        if (e.code === 'KeyD') moveState.right = false;
    });

    document.addEventListener('mousedown', e => {
        if (gameState.playing && gameState.pointerLocked && !gameState.paused && e.button === 0) {
            mouseButtonDown = true;
            shoot(); // Fire immediately on first click
        }
    });

    document.addEventListener('mouseup', e => {
        if (e.button === 0) {
            mouseButtonDown = false;
        }
    });

    document.addEventListener('mousemove', e => {
        if (!gameState.pointerLocked) return;

        player.yaw -= e.movementX * 0.002;
        player.pitch -= e.movementY * 0.002;
        player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.pitch));

        camera.rotation.order = 'YXZ';
        camera.rotation.y = player.yaw;
        camera.rotation.x = player.pitch;
    });

    renderer.domElement.addEventListener('click', () => {
        if (gameState.playing && !document.pointerLockElement && !gameState.paused) {
            renderer.domElement.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        gameState.pointerLocked = !!document.pointerLockElement;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('continue-btn').addEventListener('click', hideShop);
    document.getElementById('resume-btn').addEventListener('click', resumeGame);
    document.getElementById('pause-restart-btn').addEventListener('click', () => {
        document.getElementById('pause-menu').classList.add('hidden');
        restartGame();
    });

    // Shop buttons
    document.getElementById('buy-health-upgrade').addEventListener('click', () => buyItem('health_upgrade'));
    document.getElementById('buy-heal').addEventListener('click', () => buyItem('heal'));
    document.getElementById('buy-ammo').addEventListener('click', () => buyItem('ammo'));
    document.getElementById('buy-damage').addEventListener('click', () => buyItem('damage'));
}

// Update loop
function updatePlayer(delta) {
    if (!gameState.playing || gameState.paused) return;

    const direction = new THREE.Vector3();

    if (moveState.forward) direction.z -= 1;
    if (moveState.backward) direction.z += 1;
    if (moveState.left) direction.x -= 1;
    if (moveState.right) direction.x += 1;

    if (direction.length() > 0) direction.normalize();

    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);

    const newPosition = player.position.clone();
    newPosition.x += direction.x * player.speed;
    newPosition.z += direction.z * player.speed;

    // Check collision with obstacles
    let collided = false;
    const playerRadius = 0.5; // Player collision radius

    for (const obstacle of obstacles) {
        const obstaclePos = obstacle.position;
        const dx = newPosition.x - obstaclePos.x;
        const dz = newPosition.z - obstaclePos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Collision radius based on obstacle type
        let obstacleRadius = 0.8; // Smaller default
        if (obstacle.userData.type === 'cover') {
            // Barrels are smaller
            if (obstacle.geometry.type === 'CylinderGeometry') {
                obstacleRadius = 0.6;
            } else {
                // Barriers are larger
                obstacleRadius = 1.8;
            }
        }

        if (distance < (playerRadius + obstacleRadius)) {
            collided = true;
            break;
        }
    }

    // Only apply movement if no collision
    if (!collided) {
        const bounds = ARENA_SIZE - 2;
        newPosition.x = Math.max(-bounds, Math.min(bounds, newPosition.x));
        newPosition.z = Math.max(-bounds, Math.min(bounds, newPosition.z));

        player.position.copy(newPosition);
    }

    camera.position.copy(player.position).add(shakeOffset);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    updatePlayer(delta);
    if (!gameState.paused) {
        updateZombies(delta);
        updateParticles(delta);
        updateCameraShake(delta);

        // Auto-fire for rifle when mouse is held down
        if (mouseButtonDown && gameState.playing && gameState.pointerLocked && currentWeaponKey === 'RIFLE') {
            shoot();
        }
    }

    renderer.render(scene, camera);
}

// Start
init();
animate();
