# BATTLE FORCE - Three.js Zombie Shooter

**Professional Web-Based FPS Game**

Team: Ahmed Mesbah Ahmed & Ziad Ahmed Al-Junadi  
Course: Computer Graphics Fall 2025/2026

---

## Quick Start (10 Seconds!)

```bash
python3 -m http.server 8000
```

Open browser: `http://localhost:8000`

**That's it!** Click "START GAME" and play!

---

## Game Features

### Weapon Arsenal (4 Types)
- **Pistol** - Balanced starter weapon (25 damage, 12 rounds)
- **Rifle** - Fast automatic fire (35 damage, 30 rounds, 80ms fire rate)
- **Shotgun** - Close-range devastator (15×8 pellets, spread pattern)
- **Sniper** - High-damage precision (100 damage, slow fire rate)
- Switch weapons with **1-4 keys**
- Unique reload times and ammo pools per weapon

### Zombie Types (4 Variants)
- **Normal Zombie** - Baseline enemy (100 HP, 100 points)
- **Fast Zombie** - Quick & evasive (50 HP, 150 points, zigzag movement)
- **Tank Zombie** - Bullet sponge (300 HP, 300 points, destroys obstacles)
- **Exploder Zombie** - Suicide bomber (75 HP, 200 points, explodes on death/proximity)
- Visual differentiation with color-coded designs
- Type-specific AI behaviors and attacks

### Scoring & Progression
- **Points System** - Earn points for kills (varies by zombie type)
- **Combo Multiplier** - Up to 3× for rapid consecutive kills
- **Headshot Bonus** - 2× points and damage for precision shots
- **High Score Tracking** - Persistent leaderboard (localStorage)
- **Wave Progression** - Increasing difficulty with boss waves every 5 waves

### Upgrade Shop
Between waves, spend points on:
- **Health Upgrade** (100 pts) - Increase max health by 25
- **Full Heal** (50 pts) - Restore to maximum health
- **Extra Ammo** (75 pts) - Refill all weapons
- **Damage Boost** (150 pts) - 1.5× damage for 30 seconds

### Interactive Obstacles
- **Wooden Crates** - Destructible cover (100 HP)
- **Metal Barrels** - Solid indestructible cover
- **Explosive Barrels** - Shoot to detonate (75 damage radius)
- **Concrete Barriers** - Large permanent structures
- Strategic placement for tactical gameplay
- Zombie pathfinding navigates around obstacles

### Professional Polish
- **Procedural Sound Effects** - Weapon firing, explosions, zombie sounds
- **Particle Systems** - Blood splatters, explosions, impact effects
- **Camera Shake** - Dynamic feedback on shooting and explosions
- **Visual Effects** - Muzzle flashes, damage indicators, floating text
- **Complete HUD** - Health, ammo, score, points, wave info, weapon selection
- **Pause Menu** - ESC to pause with resume/restart options

---

## Controls

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move |
| **Shift** | Sprint |
| **Mouse** | Aim |
| **Left Click** | Shoot |
| **R** | Reload |
| **1-4** | Switch weapons |
| **ESC** | Pause |

---

## Why Three.js?

**Easy to Run** - Just open in browser  
**Cross-Platform** - Works everywhere  
**Easy to Share** - Send a link!  
**Professional Graphics** - Full 3D engine  
**Perfect for Course** - Shows all techniques  

---

**Enjoy your professional web game!**
