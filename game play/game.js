const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

canvas.width = 1200;
canvas.height = 800;

// Game state
let gameOver = false;
let score = 0;
let highScore = 0;
let playerHealth = 10;
let combo = 0;
let comboTimer = 0;
let isPaused = false;
let screenShake = 0;
let maxPlayerHealth = 10;
let redBoxCount = 0;
let orangeBoxCount = 0;
let autoFireTimer = 0;
let autoFireInterval = 30; // Fire every 30 frames (2 times per second at 60fps)
let playerFireMode = 1; // 1 = single, 2 = double, 3 = triple, 4 = diagonal spread, 5 = wide spread
let powerUpTimer = 0; // Timer for current power-up
let powerUpDuration = 600; // 10 seconds at 60fps
let lastPowerUpSpawn = 0;
let playerDamage = 1; // Base damage
let isImmune = false; // Immunity power-up
let timeSlowActive = false; // Time slow power-up
let doubleAttackSpeed = false; // Double attack speed power-up
let activeWeaponPowerUp = null; // Track weapon power-up
let activeUtilityPowerUp = null; // Track utility power-up

// Particles for explosions
let particles = [];

// Health pickups
let healthPickups = [];

// Power-ups
let powerUps = [];

// Audio system
let sounds = {
    shoot: null,
    explosion: null,
    powerUp: null,
    damage: null,
    gameOver: null,
    bossHit: null,
    bgMusic: null
};

let audioEnabled = true;

// Load high score from localStorage
function loadHighScore() {
    const saved = localStorage.getItem('spaceShooterHighScore');
    if (saved) {
        highScore = parseInt(saved);
        console.log('High score loaded:', highScore);
    }
}

// Save high score to localStorage
function saveHighScore() {
    localStorage.setItem('spaceShooterHighScore', highScore.toString());
    console.log('High score saved:', highScore);
}

// Update high score if current score is higher
function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        saveHighScore();
        return true; // New high score!
    }
    return false;
}

// Initialize high score on load
loadHighScore();

function addCombo() {
    combo++;
    comboTimer = 0;
}

function resetCombo() {
    combo = 0;
}

function updateCombo() {
    if (combo > 0) {
        comboTimer++;
        if (comboTimer >= 180) resetCombo();
    }
}

// Initialize audio with free sound effects
function initAudio() {
    try {
        // Create audio context for sound generation
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Generate shoot sound
        sounds.shoot = createShootSound(audioContext);
        
        // Generate explosion sound
        sounds.explosion = createExplosionSound(audioContext);
        
        // Generate power-up sound
        sounds.powerUp = createPowerUpSound(audioContext);
        
        // Generate damage sound
        sounds.damage = createDamageSound(audioContext);
        
        // Generate game over sound
        sounds.gameOver = createGameOverSound(audioContext);
        
        // Generate boss hit sound
        sounds.bossHit = createBossHitSound(audioContext);
        
        console.log('Audio initialized successfully');
    } catch (e) {
        console.log('Audio initialization failed:', e);
        audioEnabled = false;
    }
}

// Create shoot sound effect
function createShootSound(audioContext) {
    return () => {
        if (!audioEnabled) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };
}

// Create explosion sound effect
function createExplosionSound(audioContext) {
    return () => {
        if (!audioEnabled) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };
}

// Create power-up sound effect
function createPowerUpSound(audioContext) {
    return () => {
        if (!audioEnabled) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    };
}

// Create damage sound effect
function createDamageSound(audioContext) {
    return () => {
        if (!audioEnabled) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    };
}

// Create game over sound effect
function createGameOverSound(audioContext) {
    return () => {
        if (!audioEnabled) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    };
}

// Create boss hit sound effect
function createBossHitSound(audioContext) {
    return () => {
        if (!audioEnabled) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    };
}

// Play sound helper
function playSound(soundName) {
    if (audioEnabled && sounds[soundName]) {
        try {
            sounds[soundName]();
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }
}

// Background stars with different layers
let stars = [];
for (let i = 0; i < 150; i++) {
    stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        size: Math.random() * 2.5,
        speed: Math.random() * 0.8 + 0.2,
        brightness: Math.random()
    });
}

// Distant planets/nebulas for atmosphere
let planets = [];
for (let i = 0; i < 3; i++) {
    planets.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        size: Math.random() * 80 + 40,
        color: ['#1a0a3a', '#2a1a4a', '#0a1a3a'][i],
        speed: Math.random() * 0.1 + 0.05
    });
}

function drawBackground() {
    // Deep space background with gradient
    const bgGradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
    bgGradient.addColorStop(0, '#0a0a2a');
    bgGradient.addColorStop(0.5, '#050515');
    bgGradient.addColorStop(1, '#000000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant planets/nebulas
    planets.forEach(planet => {
        ctx.globalAlpha = 0.3;
        const planetGradient = ctx.createRadialGradient(planet.x, planet.y, 0, planet.x, planet.y, planet.size);
        planetGradient.addColorStop(0, planet.color);
        planetGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = planetGradient;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
        ctx.fill();
        
        planet.y += planet.speed;
        if (planet.y > canvas.height + planet.size) {
            planet.y = -planet.size;
            planet.x = Math.random() * canvas.width;
        }
    });
    ctx.globalAlpha = 1;
    
    // Draw stars with twinkling effect
    stars.forEach(star => {
        star.brightness += (Math.random() - 0.5) * 0.1;
        star.brightness = Math.max(0.3, Math.min(1, star.brightness));
        
        ctx.globalAlpha = star.brightness;
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = star.size * 2;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Move stars down
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    // Draw boss zone boundary line
    ctx.strokeStyle = 'rgba(170, 0, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Particle class for explosions
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.size = Math.random() * 3 + 1;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        this.color = color;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    draw() {
        ctx.globalAlpha = this.life;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// Health pickup class
class HealthPickup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.speed = 2;
        this.rotation = 0;
        this.pulse = 0;
    }
    
    update() {
        const slowFactor = timeSlowActive ? 0.5 : 1;
        this.y += this.speed * slowFactor;
        this.rotation += 0.05;
        this.pulse += 0.1;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        // Pulsing glow effect
        const pulseSize = Math.sin(this.pulse) * 3;
        ctx.shadowBlur = 20 + pulseSize;
        ctx.shadowColor = '#00ff00';
        
        // Draw cross (health symbol)
        ctx.fillStyle = '#00ff00';
        // Vertical bar
        ctx.fillRect(-5, -12, 10, 24);
        // Horizontal bar
        ctx.fillRect(-12, -5, 24, 10);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-5, -12, 10, 24);
        ctx.strokeRect(-12, -5, 24, 10);
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// Power-up class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 28;
        this.speed = 2;
        this.rotation = 0;
        this.pulse = 0;
        this.type = type; // 'double', 'triple', 'diagonalSpread', 'wideSpread', 'doubleSpeed', 'immunity', 'timeSlow'
    }
    
    update() {
        this.y += this.speed;
        this.rotation += 0.08;
        this.pulse += 0.12;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        // Pulsing glow effect
        const pulseSize = Math.sin(this.pulse) * 4;
        
        if (this.type === 'double') {
            ctx.shadowBlur = 25 + pulseSize;
            ctx.shadowColor = '#ffaa00';
            
            // Draw double arrow symbol
            ctx.fillStyle = '#ffaa00';
            
            // Left arrow
            ctx.beginPath();
            ctx.moveTo(-10, 8);
            ctx.lineTo(-10, -8);
            ctx.lineTo(-4, -2);
            ctx.lineTo(-4, 2);
            ctx.closePath();
            ctx.fill();
            
            // Right arrow
            ctx.beginPath();
            ctx.moveTo(-2, 8);
            ctx.lineTo(-2, -8);
            ctx.lineTo(4, -2);
            ctx.lineTo(4, 2);
            ctx.closePath();
            ctx.fill();
            
            // Border circle
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (this.type === 'triple') {
            ctx.shadowBlur = 25 + pulseSize;
            ctx.shadowColor = '#ff00ff';
            ctx.fillStyle = '#ff00ff';
            
            // Draw triple arrow symbol
            ctx.beginPath();
            ctx.moveTo(-12, 8);
            ctx.lineTo(-12, -8);
            ctx.lineTo(-8, -4);
            ctx.lineTo(-8, 4);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(-4, 8);
            ctx.lineTo(-4, -8);
            ctx.lineTo(0, -4);
            ctx.lineTo(0, 4);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(4, 8);
            ctx.lineTo(4, -8);
            ctx.lineTo(8, -4);
            ctx.lineTo(8, 4);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (this.type === 'doubleDamage') {
            ctx.shadowBlur = 25 + pulseSize;
            ctx.shadowColor = '#ff0000';
            ctx.fillStyle = '#ff0000';
            
            // Draw 2x symbol
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('2X', 0, 0);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (this.type === 'doubleSpeed') {
            ctx.shadowBlur = 25 + pulseSize;
            ctx.shadowColor = '#ff3333';
            ctx.fillStyle = '#ff3333';
            
            // Draw lightning bolt for speed
            ctx.beginPath();
            ctx.moveTo(-4, -10);
            ctx.lineTo(2, -2);
            ctx.lineTo(-2, -2);
            ctx.lineTo(4, 10);
            ctx.lineTo(-2, 2);
            ctx.lineTo(2, 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (this.type === 'immunity') {
            ctx.shadowBlur = 25 + pulseSize;
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#00ffff';
            
            // Draw shield symbol
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(8, -6);
            ctx.lineTo(8, 4);
            ctx.lineTo(0, 10);
            ctx.lineTo(-8, 4);
            ctx.lineTo(-8, -6);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
        } else if (this.type === 'diagonalSpread') {
            ctx.shadowBlur = 25 + pulseSize;
            ctx.shadowColor = '#00ff88';
            ctx.fillStyle = '#00ff88';
            
            // Draw 3 diagonal arrows
            ctx.beginPath();
            ctx.moveTo(-10, 6);
            ctx.lineTo(-10, -6);
            ctx.lineTo(-6, -2);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(0, 8);
            ctx.lineTo(0, -8);
            ctx.lineTo(4, -4);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(10, 6);
            ctx.lineTo(10, -6);
            ctx.lineTo(6, -2);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (this.type === 'wideSpread') {
            ctx.shadowBlur = 25 + pulseSize;
            ctx.shadowColor = '#ff00aa';
            ctx.fillStyle = '#ff00aa';
            
            // Draw 5 spread arrows
            for (let i = 0; i < 5; i++) {
                const xPos = -8 + i * 4;
                ctx.beginPath();
                ctx.moveTo(xPos, 6);
                ctx.lineTo(xPos, -6);
                ctx.lineTo(xPos + 2, -3);
                ctx.closePath();
                ctx.fill();
            }
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (this.type === 'timeSlow') {
            ctx.shadowBlur = 25 + pulseSize;
            ctx.shadowColor = '#ffff00';
            ctx.fillStyle = '#ffff00';
            
            // Draw clock symbol
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.stroke();
            
            // Clock hands
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -6);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(4, 0);
            ctx.stroke();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class Player {
    constructor() {
        this.width = 35;
        this.height = 35;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 10;
        this.speed = 6;
    }

    draw() {
        ctx.save();
        
        // Engine glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(this.x + 5, this.y + this.height - 5, 8, 8);
        ctx.fillRect(this.x + this.width - 13, this.y + this.height - 5, 8, 8);
        ctx.globalAlpha = 1;
        
        // Wings (triangles on sides)
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ff00';
        const wingGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        wingGradient.addColorStop(0, '#00ff00');
        wingGradient.addColorStop(1, '#008800');
        ctx.fillStyle = wingGradient;
        
        // Left wing
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 10);
        ctx.lineTo(this.x - 8, this.y + 20);
        ctx.lineTo(this.x, this.y + 25);
        ctx.closePath();
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + 10);
        ctx.lineTo(this.x + this.width + 8, this.y + 20);
        ctx.lineTo(this.x + this.width, this.y + 25);
        ctx.closePath();
        ctx.fill();
        
        // Main body (spaceship)
        const bodyGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        bodyGradient.addColorStop(0, '#00ff00');
        bodyGradient.addColorStop(0.5, '#00dd00');
        bodyGradient.addColorStop(1, '#00aa00');
        ctx.fillStyle = bodyGradient;
        
        // Draw spaceship body as a pentagon
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y); // Top point
        ctx.lineTo(this.x + this.width, this.y + 10);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x, this.y + 10);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit window
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 12, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width, this.y + 10);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x, this.y + 10);
        ctx.closePath();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Draw health bar with style
        const healthBarWidth = 200;
        const healthBarHeight = 25;
        const healthPercent = playerHealth / maxPlayerHealth;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, healthBarWidth + 4, healthBarHeight + 4);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(12, 12, healthBarWidth, healthBarHeight);
        
        const healthGradient = ctx.createLinearGradient(12, 12, 12 + healthBarWidth * healthPercent, 12);
        if (healthPercent > 0.5) {
            healthGradient.addColorStop(0, '#00ff00');
            healthGradient.addColorStop(1, '#00cc00');
        } else if (healthPercent > 0.25) {
            healthGradient.addColorStop(0, '#ffaa00');
            healthGradient.addColorStop(1, '#ff8800');
        } else {
            healthGradient.addColorStop(0, '#ff0000');
            healthGradient.addColorStop(1, '#cc0000');
        }
        ctx.fillStyle = healthGradient;
        ctx.fillRect(12, 12, healthBarWidth * healthPercent, healthBarHeight);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, healthBarWidth, healthBarHeight);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`HP: ${playerHealth}/${maxPlayerHealth}`, 20, 30);
    }
}

class Bullet {
    constructor(x, y, isEnemy = false, velocityX = 0, velocityY = 1) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 12;
        this.speed = isEnemy ? 3 : 8;
        this.isEnemy = isEnemy;
        this.velocityX = velocityX; // Horizontal velocity multiplier
        this.velocityY = velocityY; // Vertical velocity multiplier
    }

    draw() {
        if (this.isEnemy) {
            // Enemy laser with glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffff00';
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(1, '#ff8800');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else {
            // Player laser with glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#00ffff');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.shadowBlur = 0;
    }

    update() {
        const slowFactor = timeSlowActive ? 0.5 : 1;
        if (this.isEnemy) {
            this.y += this.speed * this.velocityY * slowFactor;
            this.x += this.speed * this.velocityX * slowFactor;
        } else {
            // Player bullets can also have diagonal movement
            this.y -= this.speed * this.velocityY;
            this.x += this.speed * this.velocityX;
        }
    }
}

class Enemy {
    constructor(type = 'red') {
        this.type = type;
        this.shootTimer = 0;
        
        // Different shoot intervals for different enemies
        if (type === 'purple') {
            this.shootInterval = 90; // Boss shoots faster - every 1.5 seconds
        } else {
            this.shootInterval = 120; // Normal - every 2 seconds
        }
        this.horizontalSpeed = 0;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.pulse = 0;
        
        // Set properties based on type
        if (type === 'red') {
            this.width = 30;
            this.height = 30;
            this.health = 1;
            this.maxHealth = 1;
            this.scoreValue = 1;
            this.color = '#ff0000';
            this.color2 = '#cc0000';
            this.laserCount = 1;
            this.horizontalSpeed = 0;
            this.speed = 1.5;
        } else if (type === 'orange') {
            this.width = 60; // 2x bigger
            this.height = 60;
            this.health = 25;
            this.maxHealth = 25;
            this.scoreValue = 10;
            this.color = '#ff8800';
            this.color2 = '#ff6600';
            this.laserCount = 3;
            this.horizontalSpeed = 1.3;
            this.speed = 1.0;
        } else if (type === 'purple') {
            this.width = 90; // 3x bigger
            this.height = 90;
            this.health = 50;
            this.maxHealth = 50;
            this.scoreValue = 20;
            this.color = '#aa00ff';
            this.color2 = '#8800cc';
            this.laserCount = 5;
            this.horizontalSpeed = 1.6;
            this.speed = 0.9;
            this.verticalDirection = 1; // For boss movement
            this.moveTimer = 0;
            this.isBoss = true;
        }
        
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
    }

    draw() {
        ctx.save();
        
        // Pulsing effect
        this.pulse += 0.05;
        const pulseSize = Math.sin(this.pulse) * 2;
        
        // Shadow and glow
        ctx.shadowBlur = 15 + pulseSize;
        ctx.shadowColor = this.color;
        
        // Enemy body with gradient
        const gradient = ctx.createRadialGradient(
            this.x + this.width/2, this.y + this.height/2, 0,
            this.x + this.width/2, this.y + this.height/2, this.width/2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, this.color2);
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        
        // Draw as hexagon for more alien look
        ctx.beginPath();
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        const radius = this.width/2;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Border
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Draw health bar for orange and purple
        if (this.type !== 'red') {
            const healthBarWidth = this.width;
            const healthBarHeight = 6;
            const healthPercent = this.health / this.maxHealth;
            const barY = this.y - 12;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(this.x - 2, barY - 2, healthBarWidth + 4, healthBarHeight + 4);
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, barY, healthBarWidth, healthBarHeight);
            
            const hpGradient = ctx.createLinearGradient(this.x, barY, this.x + healthBarWidth * healthPercent, barY);
            hpGradient.addColorStop(0, '#00ff00');
            hpGradient.addColorStop(1, '#00aa00');
            ctx.fillStyle = hpGradient;
            ctx.fillRect(this.x, barY, healthBarWidth * healthPercent, healthBarHeight);
            
            // Health text for bigger enemies
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.floor(this.width / 6)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`${this.health}/${this.maxHealth}`, this.x + this.width/2, this.y + this.height/2 + 5);
            ctx.textAlign = 'left';
        }
    }

    update() {
        const slowFactor = timeSlowActive ? 0.5 : 1;
        
        // Special boss behavior for purple
        if (this.isBoss) {
            // Move down until reaching top half
            if (this.y < canvas.height / 2 - this.height) {
                this.y += this.speed * slowFactor;
            } else {
                // Once in position, move in all directions
                this.y = Math.min(this.y, canvas.height / 2 - this.height);
                
                // Omnidirectional movement
                this.x += this.horizontalSpeed * this.direction * slowFactor;
                this.y += this.speed * 0.5 * this.verticalDirection * slowFactor;
                
                // Bounce off walls
                if (this.x <= 0 || this.x >= canvas.width - this.width) {
                    this.direction *= -1;
                    this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
                }
                
                // Bounce off top and middle boundaries
                if (this.y <= 0 || this.y >= canvas.height / 2 - this.height) {
                    this.verticalDirection *= -1;
                    this.y = Math.max(0, Math.min(this.y, canvas.height / 2 - this.height));
                }
                
                // Change direction randomly
                this.moveTimer++;
                if (this.moveTimer > 120) {
                    if (Math.random() < 0.3) {
                        this.direction *= -1;
                    }
                    if (Math.random() < 0.3) {
                        this.verticalDirection *= -1;
                    }
                    this.moveTimer = 0;
                }
            }
        } else {
            // Normal enemy movement
            this.y += this.speed * slowFactor;
            
            // Horizontal movement for orange
            if (this.horizontalSpeed > 0) {
                this.x += this.horizontalSpeed * this.direction * slowFactor;
                
                // Bounce off walls
                if (this.x <= 0 || this.x >= canvas.width - this.width) {
                    this.direction *= -1;
                    this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
                }
            }
        }
        
        // Shooting logic (also affected by time slow)
        this.shootTimer += slowFactor;
        if (this.shootTimer >= this.shootInterval) {
            this.shoot();
            this.shootTimer = 0;
        }
    }

    shoot() {
        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;
        
        if (this.laserCount === 1) {
            // Red enemy - single straight shot
            enemyBullets.push(new Bullet(centerX - 2, bottomY, true, 0, 1));
        } else if (this.laserCount === 3 && this.type === 'orange') {
            // Orange mini-boss - 3 bullets: left diagonal, straight, right diagonal
            enemyBullets.push(new Bullet(centerX - 2, bottomY, true, -0.5, 1)); // Left diagonal
            enemyBullets.push(new Bullet(centerX - 2, bottomY, true, 0, 1));    // Straight
            enemyBullets.push(new Bullet(centerX - 2, bottomY, true, 0.5, 1));  // Right diagonal
        } else if (this.laserCount === 5 && this.type === 'purple') {
            // Purple boss - 5 bullets in spread pattern
            enemyBullets.push(new Bullet(centerX - 2, bottomY, true, -1, 1));   // Far left diagonal
            enemyBullets.push(new Bullet(centerX - 2, bottomY, true, -0.5, 1)); // Left diagonal
            enemyBullets.push(new Bullet(centerX - 2, bottomY, true, 0, 1));    // Straight
            enemyBullets.push(new Bullet(centerX - 2, bottomY, true, 0.5, 1));  // Right diagonal
            enemyBullets.push(new Bullet(centerX - 2, bottomY, true, 1, 1));    // Far right diagonal
        }
    }

    takeDamage(damage = 1) {
        this.health -= damage;
        return this.health <= 0;
    }
}

const player = new Player();
let bullets = [];
let enemyBullets = [];
let enemies = [];
let gameLoop;
let keys = {};
let spawnTimer = 0;
let powerUpSpawnTimer = 0;

window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Map WASD to arrow keys
    if (e.key === 'a' || e.key === 'A') keys['ArrowLeft'] = true;
    if (e.key === 'd' || e.key === 'D') keys['ArrowRight'] = true;
    if (e.key === 'w' || e.key === 'W') keys['ArrowUp'] = true;
    if (e.key === 's' || e.key === 'S') keys['ArrowDown'] = true;
});
window.addEventListener('keyup', e => {
    keys[e.key] = false;
    // Map WASD to arrow keys
    if (e.key === 'a' || e.key === 'A') keys['ArrowLeft'] = false;
    if (e.key === 'd' || e.key === 'D') keys['ArrowRight'] = false;
    if (e.key === 'w' || e.key === 'W') keys['ArrowUp'] = false;
    if (e.key === 's' || e.key === 'S') keys['ArrowDown'] = false;
});

function handlePlayerMovement() {
    // Smooth movement with acceleration
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] && player.y > canvas.height / 2) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height - 10) {
        player.y += player.speed;
    }
    
    // Auto-fire with speed modifier
    const fireInterval = doubleAttackSpeed ? autoFireInterval / 2 : autoFireInterval;
    autoFireTimer++;
    if (autoFireTimer >= fireInterval) {
        const centerX = player.x + player.width / 2 - 2;
        
        if (playerFireMode === 1) {
            // Single shot
            bullets.push(new Bullet(centerX, player.y));
        } else if (playerFireMode === 2) {
            // Double shot
            bullets.push(new Bullet(player.x + 8, player.y));
            bullets.push(new Bullet(player.x + player.width - 12, player.y));
        } else if (playerFireMode === 3) {
            // Triple shot
            bullets.push(new Bullet(player.x + 5, player.y));
            bullets.push(new Bullet(centerX, player.y));
            bullets.push(new Bullet(player.x + player.width - 9, player.y));
        } else if (playerFireMode === 4) {
            // Diagonal spread (3 bullets)
            bullets.push(new Bullet(centerX, player.y, false, -0.5, 1)); // Left diagonal
            bullets.push(new Bullet(centerX, player.y, false, 0, 1));    // Straight
            bullets.push(new Bullet(centerX, player.y, false, 0.5, 1));  // Right diagonal
        } else if (playerFireMode === 5) {
            // Wide spread (5 bullets)
            bullets.push(new Bullet(centerX, player.y, false, -1, 1));   // Far left
            bullets.push(new Bullet(centerX, player.y, false, -0.5, 1)); // Left
            bullets.push(new Bullet(centerX, player.y, false, 0, 1));    // Center
            bullets.push(new Bullet(centerX, player.y, false, 0.5, 1));  // Right
            bullets.push(new Bullet(centerX, player.y, false, 1, 1));    // Far right
        }
        playSound('shoot');
        autoFireTimer = 0;
    }
}

function spawnEnemy() {
    spawnTimer++;
    powerUpSpawnTimer++;
    
    // Spawn every 120 frames (2 seconds at 60fps)
    if (spawnTimer >= 120) {
        spawnTimer = 0;
        
        // Check if we should spawn purple (every 5 orange boxes)
        if (orangeBoxCount > 0 && orangeBoxCount % 5 === 0 && orangeBoxCount !== lastPurpleSpawn) {
            enemies.push(new Enemy('purple'));
            lastPurpleSpawn = orangeBoxCount;
        }
        // Check if we should spawn orange (every 15 red boxes)
        else if (redBoxCount > 0 && redBoxCount % 15 === 0 && redBoxCount !== lastOrangeSpawn) {
            enemies.push(new Enemy('orange'));
            orangeBoxCount++;
            lastOrangeSpawn = redBoxCount;
        }
        // Otherwise spawn red
        else {
            enemies.push(new Enemy('red'));
            redBoxCount++;
        }
    }
    
    // Spawn health pickups randomly (4% chance every second)
    if (Math.random() < 0.04 && spawnTimer % 60 === 0) {
        healthPickups.push(new HealthPickup(Math.random() * (canvas.width - 25), -25));
    }
        
    // Spawn power-ups every 15 seconds using separate timer
    if (powerUpSpawnTimer >= 900) { // 900 frames = 15 seconds
        powerUpSpawnTimer = 0;
        
        const rand = Math.random();
        let powerUpType;
            
        if (rand < 0.18) powerUpType = 'double';
        else if (rand < 0.36) powerUpType = 'triple';
        else if (rand < 0.52) powerUpType = 'diagonalSpread';
        else if (rand < 0.68) powerUpType = 'wideSpread';
        else if (rand < 0.82) powerUpType = 'doubleSpeed';
        else if (rand < 0.91) powerUpType = 'immunity';
        else powerUpType = 'timeSlow';
            
        powerUps.push(new PowerUp(Math.random() * (canvas.width - 28), -28, powerUpType));
    }
}

let lastOrangeSpawn = 0;
let lastPurpleSpawn = 0;

function createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function checkCollisions() {
    // Player bullets hitting enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                    
                bullets.splice(i, 1);
                
                // Create small hit particles
                createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 5);
                
                if (enemy.takeDamage(1)) {
                    addCombo();
                    const multiplier = Math.min(Math.floor(combo / 10) + 1, 5);
                    score += enemy.scoreValue * multiplier;
                    scoreElement.textContent = `Score: ${score}`;
                        
                    // Create explosion
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 30);
                    
                    // Play appropriate sound
                    if (enemy.type === 'orange' || enemy.type === 'purple') {
                        playSound('bossHit');
                    } else {
                        playSound('explosion');
                    }
                        
                    enemies.splice(j, 1);
                } else {
                    // Hit but not destroyed
                    if (enemy.type === 'orange' || enemy.type === 'purple') {
                        playSound('bossHit');
                    }
                }
                break;
            }
        }
    }
        
    // Enemy bullets hitting player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
                
            enemyBullets.splice(i, 1);
                
            if (!isImmune) {
                playerHealth--;
                resetCombo();
                createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000', 10);
                playSound('damage');
            } else {
                // Immune - create shield effect
                createExplosion(player.x + player.width/2, player.y + player.height/2, '#00ffff', 8);
            }
                
            if (playerHealth <= 0) {
                gameOver = true;
                updateHighScore();
                playSound('gameOver');
            }
        }
    }
        
    // Enemy collision with player
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y) {
                
            if (!isImmune) {
                // Check if it's a mini-boss (orange or purple)
                if (enemy.type === 'orange' || enemy.type === 'purple') {
                    // Instant death for mini-boss collision
                    playerHealth = 0;
                    gameOver = true;
                    // Massive explosion
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 50);
                    createExplosion(player.x + player.width/2, player.y + player.height/2, '#00ff00', 40);
                    playSound('gameOver');
                } else {
                    // Normal enemy - 1 damage
                    playerHealth--;
                    resetCombo();
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 25);
                    createExplosion(player.x + player.width/2, player.y + player.height/2, '#00ff00', 15);
                    playSound('damage');
                        
                    if (playerHealth <= 0) {
                        gameOver = true;
                        updateHighScore();
                        playSound('gameOver');
                    }
                }
            } else {
                // Immune - create shield effect
                createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#00ffff', 20);
            }
                
            // Remove enemy
            enemies.splice(i, 1);
        }
    }
        
    // Player collecting health pickups
    for (let i = healthPickups.length - 1; i >= 0; i--) {
        const pickup = healthPickups[i];
        if (pickup.x < player.x + player.width &&
            pickup.x + pickup.width > player.x &&
            pickup.y < player.y + player.height &&
            pickup.y + pickup.height > player.y) {
            
            healthPickups.splice(i, 1);
            
            // Heal player (max 10 health)
            if (playerHealth < maxPlayerHealth) {
                playerHealth = Math.min(playerHealth + 2, maxPlayerHealth);
                
                // Create healing effect
                createExplosion(pickup.x + pickup.width/2, pickup.y + pickup.height/2, '#00ff00', 15);
            }
        }
    }
    
    // Player collecting power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (powerUp.x < player.x + player.width &&
            powerUp.x + powerUp.width > player.x &&
            powerUp.y < player.y + player.height &&
            powerUp.y + powerUp.height > player.y) {
            
            powerUps.splice(i, 1);
            playSound('powerUp');
            
            // Apply power-up effects
            if (powerUp.type === 'double') {
                playerFireMode = Math.max(playerFireMode, 2);
                activeWeaponPowerUp = 'double';
                powerUpTimer = 0;
                createExplosion(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#ffaa00', 20);
            } else if (powerUp.type === 'triple') {
                playerFireMode = 3;
                activeWeaponPowerUp = 'triple';
                powerUpTimer = 0;
                createExplosion(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#ff00ff', 20);
            } else if (powerUp.type === 'diagonalSpread') {
                playerFireMode = 4;
                activeWeaponPowerUp = 'diagonalSpread';
                powerUpTimer = 0;
                createExplosion(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#00ff88', 20);
            } else if (powerUp.type === 'wideSpread') {
                playerFireMode = 5;
                activeWeaponPowerUp = 'wideSpread';
                powerUpTimer = 0;
                createExplosion(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#ff00aa', 20);
            } else if (powerUp.type === 'doubleSpeed') {
                doubleAttackSpeed = true;
                activeUtilityPowerUp = 'doubleSpeed';
                powerUpTimer = 0;
                createExplosion(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#ff3333', 20);
            } else if (powerUp.type === 'immunity') {
                isImmune = true;
                activeUtilityPowerUp = 'immunity';
                powerUpTimer = 0;
                createExplosion(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#00ffff', 20);
            } else if (powerUp.type === 'timeSlow') {
                timeSlowActive = true;
                activeUtilityPowerUp = 'timeSlow';
                powerUpTimer = 0;
                createExplosion(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#ffff00', 20);
            }
        }
    }
}

function drawGameOver() {
    // Update high score
    const isNewHighScore = updateHighScore();
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game Over text with glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 120);
    
    // Final score
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff00';
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 30);
    
    // High score display
    if (isNewHighScore) {
        // New high score - special animation
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffff00';
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 42px Arial';
        ctx.fillText('🏆 NEW HIGH SCORE! 🏆', canvas.width / 2, canvas.height / 2 + 30);
    } else {
        // Show current high score
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 30);
    }
    
    // Restart instruction
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 100);
    
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
}

function restartGame() {
    if (!sounds.shoot) initAudio();
    
    gameOver = false;
    isPaused = false;
    score = 0;
    combo = 0;
    comboTimer = 0;
    playerHealth = 10;
    redBoxCount = 0;
    orangeBoxCount = 0;
    lastOrangeSpawn = 0;
    lastPurpleSpawn = 0;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    healthPickups = [];
    powerUps = [];
    particles = [];
    spawnTimer = 0;
    powerUpSpawnTimer = 0;
    autoFireTimer = 0;
    playerFireMode = 1;
    powerUpTimer = 0;
    playerDamage = 1;
    isImmune = false;
    timeSlowActive = false;
    doubleAttackSpeed = false;
    activeWeaponPowerUp = null;
    activeUtilityPowerUp = null;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 10;
    scoreElement.textContent = `Score: ${score}`;
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (gameOver) {
            restartGame();
        }
    }
    if ((e.key === 'Escape' || e.key === 'p') && !gameOver) {
        isPaused = !isPaused;
    }
});

function drawScore() {
    // Score display with fancy styling
    const scoreText = `Score: ${score}`;
    const highScoreText = `High: ${highScore}`;
    const scoreX = canvas.width - 250;
    const scoreY = 15;
    
    // Current score
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(scoreX - 10, scoreY - 5, 240, 35);
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffff00';
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(scoreText, scoreX, scoreY + 20);
    ctx.shadowBlur = 0;
    
    // High Score display
    const highScoreY = scoreY + 40;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(scoreX - 10, highScoreY - 5, 240, 30);
    
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(highScoreText, scoreX, highScoreY + 15);
    ctx.shadowBlur = 0;
    
    // Combo display
    if (combo > 0) {
        const comboY = highScoreY + 40;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(scoreX - 10, comboY - 5, 240, 30);
        
        const multiplier = Math.min(Math.floor(combo / 10) + 1, 5);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`${combo}x COMBO (${multiplier}x)`, scoreX, comboY + 15);
        ctx.shadowBlur = 0;
    }
    
    // Active power-ups display
    let yOffset = 55;
    const timeLeft = Math.ceil((powerUpDuration - powerUpTimer) / 60);
    
    // Weapon power-up
    if (activeWeaponPowerUp) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(scoreX - 10, yOffset - 5, 240, 30);
        
        let weaponText = '';
        let weaponColor = '';
        if (activeWeaponPowerUp === 'double') {
            weaponText = `Double Shot ⬆⬆ (${timeLeft}s)`;
            weaponColor = '#ffaa00';
        } else if (activeWeaponPowerUp === 'triple') {
            weaponText = `Triple Shot ⬆⬆⬆ (${timeLeft}s)`;
            weaponColor = '#ff00ff';
        } else if (activeWeaponPowerUp === 'diagonalSpread') {
            weaponText = `Diagonal Spread ⬈⬆⬉ (${timeLeft}s)`;
            weaponColor = '#00ff88';
        } else if (activeWeaponPowerUp === 'wideSpread') {
            weaponText = `Wide Spread ⬅⬆➡ (${timeLeft}s)`;
            weaponColor = '#ff00aa';
        }
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = weaponColor;
        ctx.fillStyle = weaponColor;
        ctx.font = 'bold 16px Arial';
        ctx.fillText(weaponText, scoreX, yOffset + 12);
        ctx.shadowBlur = 0;
        yOffset += 35;
    }
    
    // Utility power-up
    if (activeUtilityPowerUp) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(scoreX - 10, yOffset - 5, 240, 30);
        
        let utilityText = '';
        let utilityColor = '';
        if (activeUtilityPowerUp === 'doubleSpeed') {
            utilityText = `Double Speed ⚡ (${timeLeft}s)`;
            utilityColor = '#ff3333';
        } else if (activeUtilityPowerUp === 'immunity') {
            utilityText = `Immunity 🛡️ (${timeLeft}s)`;
            utilityColor = '#00ffff';
        } else if (activeUtilityPowerUp === 'timeSlow') {
            utilityText = `Time Slow ⏰ (${timeLeft}s)`;
            utilityColor = '#ffff00';
        }
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = utilityColor;
        ctx.fillStyle = utilityColor;
        ctx.font = 'bold 16px Arial';
        ctx.fillText(utilityText, scoreX, yOffset + 12);
        ctx.shadowBlur = 0;
    }
}

function gameUpdate() {
    drawBackground();
    
    if (gameOver) {
        drawGameOver();
        return;
    }
    
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Press ESC or P to Resume', canvas.width / 2, canvas.height / 2 + 50);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        return;
    }
    
    updateCombo();
    
    // Power-up timer management
    if (activeWeaponPowerUp || activeUtilityPowerUp) {
        powerUpTimer++;
        if (powerUpTimer >= powerUpDuration) {
            // Revert all power-ups
            if (activeWeaponPowerUp) {
                playerFireMode = 1;
                activeWeaponPowerUp = null;
            }
            if (activeUtilityPowerUp) {
                isImmune = false;
                timeSlowActive = false;
                doubleAttackSpeed = false;
                activeUtilityPowerUp = null;
            }
            powerUpTimer = 0;
            // Visual feedback
            createExplosion(player.x + player.width/2, player.y + player.height/2, '#ffffff', 15);
        }
    }
    
    handlePlayerMovement();
    
    // Update and draw particles
    particles = particles.filter(particle => {
        particle.update();
        particle.draw();
        return particle.life > 0;
    });
    
    player.draw();
    drawScore();
    
    spawnEnemy();

    // Update and draw player bullets
    bullets = bullets.filter(bullet => {
        bullet.update();
        bullet.draw();
        return bullet.y > 0;
    });
    
    // Update and draw enemy bullets
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.update();
        bullet.draw();
        return bullet.y < canvas.height;
    });

    // Update and draw enemies
    enemies = enemies.filter(enemy => {
        enemy.update();
        enemy.draw();
        return enemy.y < canvas.height;
    });
    
    // Update and draw health pickups
    healthPickups = healthPickups.filter(pickup => {
        pickup.update();
        pickup.draw();
        return pickup.y < canvas.height;
    });
    
    // Update and draw power-ups
    powerUps = powerUps.filter(powerUp => {
        powerUp.update();
        powerUp.draw();
        return powerUp.y < canvas.height;
    });

    checkCollisions();
}

gameLoop = setInterval(gameUpdate, 1000/60);
