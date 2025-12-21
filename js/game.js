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
    position: new THREE.Vector3(0, 1.7, 0)
};

let weapon = {
    damage: 25,
    fireRate: 100,
    lastShot: 0,
    magSize: 30,
    currentAmmo: 30,
    reserveAmmo: 120,
    reloading: false
};

let moveState = { forward: false, backward: false, left: false, right: false };
let gameState = { playing: false, wave: 1, kills: 0, zombiesKilled: 0, zombiesThisWave: 10, startTime: 0, pointerLocked: false };

let zombies = [];
let raycaster = new THREE.Raycaster();
let clock = new THREE.Clock();

const ARENA_SIZE = 50;
const SPAWN_DISTANCE = 30;

// Initialize game
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 80);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.copy(player.position);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    createArena();
    createLighting();
    setupControls();

    setTimeout(() => document.getElementById('loading').classList.add('hidden'), 500);
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
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(ARENA_SIZE * 2, 50, 0x444444, 0x222222);
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Walls
    createWalls();

    // Obstacles
    createObstacles();
}

function createConcreteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#3a3a3a';
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

function createObstacles() {
    const positions = [[15, 15], [-15, 15], [15, -15], [-15, -15], [0, 20], [0, -20], [20, 0], [-20, 0]];

    positions.forEach(([x, z]) => {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshPhongMaterial({ color: 0x7f8c8d })
        );
        box.position.set(x, 1, z);
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
    });
}

// Lighting
function createLighting() {
    const ambient = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x8888ff, 0.5);
    moonLight.position.set(20, 30, 10);
    moonLight.castShadow = true;
    moonLight.shadow.camera.left = -ARENA_SIZE;
    moonLight.shadow.camera.right = ARENA_SIZE;
    moonLight.shadow.camera.top = ARENA_SIZE;
    moonLight.shadow.camera.bottom = -ARENA_SIZE;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    scene.add(moonLight);

    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const light = new THREE.PointLight(0x00ff00, 0.5, 30);
        light.position.set(Math.cos(angle) * 35, 3, Math.sin(angle) * 35);
        scene.add(light);
    }
}

// Zombies
function createZombie(position) {
    const zombie = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.3, 1.5, 8),
        new THREE.MeshPhongMaterial({ color: 0x2ecc71, emissive: 0x00ff00, emissiveIntensity: 0.2 })
    );
    body.position.y = 0.75;
    body.castShadow = true;
    zombie.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0x27ae60, emissive: 0x00ff00, emissiveIntensity: 0.3 })
    );
    head.position.y = 1.8;
    head.castShadow = true;
    zombie.add(head);

    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMaterial);
    leftEye.position.set(-0.15, 1.9, 0.3);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMaterial);
    rightEye.position.set(0.15, 1.9, 0.3);
    zombie.add(leftEye, rightEye);

    zombie.position.copy(position);
    zombie.userData = { health: 100, speed: 0.03 + Math.random() * 0.02, damage: 10, type: 'zombie' };

    scene.add(zombie);
    zombies.push(zombie);
}

function spawnWave() {
    const count = gameState.zombiesThisWave;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = SPAWN_DISTANCE + Math.random() * 10;
        const spawnPos = new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);

        setTimeout(() => createZombie(spawnPos), i * 500);
    }

    updateWaveUI();
}

function updateZombies(delta) {
    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];
        const direction = new THREE.Vector3().subVectors(player.position, zombie.position).normalize();
        direction.y = 0;

        zombie.position.add(direction.multiplyScalar(zombie.userData.speed));
        zombie.lookAt(player.position);
        zombie.position.y = Math.sin(Date.now() * 0.005 + i) * 0.1;

        const distance = zombie.position.distanceTo(player.position);
        if (distance < 2) attackPlayer(zombie);

        if (zombie.userData.health <= 0) {
            scene.remove(zombie);
            zombies.splice(i, 1);
            gameState.kills++;
            gameState.zombiesKilled++;
            updateUI();

            if (gameState.zombiesKilled >= gameState.zombiesThisWave) completeWave();
        }
    }
}

function attackPlayer(zombie) {
    if (!zombie.userData.lastAttack || Date.now() - zombie.userData.lastAttack > 1000) {
        damagePlayer(zombie.userData.damage);
        zombie.userData.lastAttack = Date.now();
    }
}

// Shooting
function shoot() {
    if (weapon.reloading || weapon.currentAmmo <= 0) {
        if (weapon.currentAmmo <= 0) reload();
        return;
    }

    const now = Date.now();
    if (now - weapon.lastShot < weapon.fireRate) return;

    weapon.lastShot = now;
    weapon.currentAmmo--;
    updateUI();

    createMuzzleFlash();

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        const parent = object.parent;

        if (parent && parent.userData.type === 'zombie') {
            parent.userData.health -= weapon.damage;
            createBloodSplatter(intersects[i].point);

            const knockback = new THREE.Vector3().subVectors(intersects[i].point, camera.position).normalize().multiplyScalar(0.5);
            parent.position.add(knockback);
            break;
        }
    }
}

function reload() {
    if (weapon.reloading || weapon.currentAmmo === weapon.magSize || weapon.reserveAmmo <= 0) return;

    weapon.reloading = true;

    setTimeout(() => {
        const ammoNeeded = weapon.magSize - weapon.currentAmmo;
        const ammoToReload = Math.min(ammoNeeded, weapon.reserveAmmo);

        weapon.currentAmmo += ammoToReload;
        weapon.reserveAmmo -= ammoToReload;
        weapon.reloading = false;

        updateUI();
    }, 2000);
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

function createBloodSplatter(position) {
    const splatter = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 })
    );
    splatter.position.copy(position);
    scene.add(splatter);

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
    document.getElementById('wave-complete').classList.remove('hidden');
    gameState.playing = false;

    let countdown = 5;
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

function nextWave() {
    gameState.wave++;
    gameState.zombiesThisWave = 10 + (gameState.wave * 5);
    gameState.zombiesKilled = 0;
    weapon.reserveAmmo = weapon.magSize * 4;

    updateUI();
    spawnWave();
    gameState.playing = true;
}

// Game flow
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameState.playing = true;
    gameState.startTime = Date.now();

    renderer.domElement.requestPointerLock();
    spawnWave();
}

function gameOver() {
    gameState.playing = false;

    const survivalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(survivalTime / 60);
    const seconds = survivalTime % 60;

    document.getElementById('final-wave').textContent = gameState.wave;
    document.getElementById('final-kills').textContent = gameState.kills;
    document.getElementById('survival-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    document.getElementById('gameover-screen').classList.remove('hidden');

    if (document.pointerLockElement) document.exitPointerLock();
}

function restartGame() {
    gameState = { playing: false, wave: 1, kills: 0, zombiesKilled: 0, zombiesThisWave: 10, startTime: 0, pointerLocked: false };
    player.health = player.maxHealth;
    weapon.currentAmmo = weapon.magSize;
    weapon.reserveAmmo = 120;

    zombies.forEach(z => scene.remove(z));
    zombies = [];

    document.getElementById('gameover-screen').classList.add('hidden');

    startGame();
}

// UI
function updateUI() {
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('health-bar').style.width = healthPercent + '%';
    document.getElementById('health-text').textContent = Math.floor(player.health);

    document.getElementById('ammo-current').textContent = weapon.currentAmmo;
    document.getElementById('ammo-reserve').textContent = weapon.reserveAmmo;

    if (weapon.currentAmmo <= 5) {
        document.getElementById('ammo-current').classList.add('low');
    } else {
        document.getElementById('ammo-current').classList.remove('low');
    }

    document.getElementById('kill-count').textContent = gameState.kills;
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
    });

    document.addEventListener('keyup', e => {
        if (e.code === 'KeyW') moveState.forward = false;
        if (e.code === 'KeyS') moveState.backward = false;
        if (e.code === 'KeyA') moveState.left = false;
        if (e.code === 'KeyD') moveState.right = false;
    });

    document.addEventListener('mousedown', e => {
        if (gameState.playing && gameState.pointerLocked && e.button === 0) shoot();
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
        if (gameState.playing && !document.pointerLockElement) {
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
}

// Update loop
function updatePlayer(delta) {
    if (!gameState.playing) return;

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

    const bounds = ARENA_SIZE - 2;
    newPosition.x = Math.max(-bounds, Math.min(bounds, newPosition.x));
    newPosition.z = Math.max(-bounds, Math.min(bounds, newPosition.z));

    player.position.copy(newPosition);
    camera.position.copy(player.position);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    updatePlayer(delta);
    updateZombies(delta);

    renderer.render(scene, camera);
}

// Start
init();
animate();
