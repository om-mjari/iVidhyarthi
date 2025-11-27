/**
 * Coin Spinning Animation - Fallback for Razorpay
 * ================================================
 * Beautiful 3D coin spinning animation with particles
 */

let animationContainer = null;
let animationInterval = null;

/**
 * Create and inject coin animation styles
 */
const injectStyles = () => {
  if (document.getElementById('coin-animation-styles')) return;

  const style = document.createElement('style');
  style.id = 'coin-animation-styles';
  style.textContent = `
    .coin-animation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .coin-container {
      position: relative;
      width: 200px;
      height: 200px;
      perspective: 1000px;
    }

    .coin {
      width: 150px;
      height: 150px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform-style: preserve-3d;
      animation: spinCoin 2s linear infinite;
      transform-origin: center;
    }

    @keyframes spinCoin {
      0% { transform: translate(-50%, -50%) rotateY(0deg); }
      100% { transform: translate(-50%, -50%) rotateY(360deg); }
    }

    .coin-face {
      position: absolute;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
      box-shadow: 
        0 0 20px rgba(255, 215, 0, 0.6),
        inset 0 0 30px rgba(255, 255, 255, 0.3),
        inset 0 -5px 15px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: bold;
      color: #8B4513;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      border: 5px solid #DAA520;
    }

    .coin-face.front {
      transform: translateZ(10px);
    }

    .coin-face.back {
      transform: rotateY(180deg) translateZ(10px);
    }

    .coin-edge {
      position: absolute;
      width: 150px;
      height: 20px;
      background: linear-gradient(90deg, #B8860B 0%, #DAA520 50%, #B8860B 100%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotateX(90deg);
      border-radius: 75px;
      box-shadow: 0 0 10px rgba(218, 165, 32, 0.5);
    }

    .particles-container {
      position: absolute;
      width: 300px;
      height: 300px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .particle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #FFD700;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { 
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      50% { 
        transform: translate(var(--tx), var(--ty)) scale(1.5);
        opacity: 0.5;
      }
    }

    .payment-text {
      margin-top: 40px;
      color: white;
      font-size: 24px;
      font-weight: 600;
      text-align: center;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .payment-subtext {
      margin-top: 10px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      text-align: center;
    }

    .loading-dots {
      display: inline-block;
      animation: loadingDots 1.5s infinite;
    }

    @keyframes loadingDots {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60%, 100% { content: '...'; }
    }

    .shimmer {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.4) 50%,
        transparent 100%
      );
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
  `;
  document.head.appendChild(style);
};

/**
 * Create particle elements
 */
const createParticles = (container, count = 12) => {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const angle = (360 / count) * i;
    const radius = 100;
    const tx = Math.cos(angle * Math.PI / 180) * radius;
    const ty = Math.sin(angle * Math.PI / 180) * radius;
    
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.animationDelay = `${i * 0.1}s`;
    
    container.appendChild(particle);
  }
};

/**
 * Show coin spinning animation
 * @param {string} message - Optional custom message
 */
export const showCoinAnimation = (message = 'Processing Payment') => {
  // Prevent multiple instances
  if (animationContainer) {
    hideCoinAnimation();
  }

  injectStyles();

  // Create overlay
  animationContainer = document.createElement('div');
  animationContainer.className = 'coin-animation-overlay';

  // Create coin container
  const coinContainer = document.createElement('div');
  coinContainer.className = 'coin-container';

  // Create coin
  const coin = document.createElement('div');
  coin.className = 'coin';

  // Front face
  const frontFace = document.createElement('div');
  frontFace.className = 'coin-face front';
  frontFace.innerHTML = '₹';

  // Back face
  const backFace = document.createElement('div');
  backFace.className = 'coin-face back';
  backFace.innerHTML = '💳';

  // Edge
  const edge = document.createElement('div');
  edge.className = 'coin-edge';

  // Shimmer effect
  const shimmer = document.createElement('div');
  shimmer.className = 'shimmer';
  frontFace.appendChild(shimmer);

  const shimmer2 = document.createElement('div');
  shimmer2.className = 'shimmer';
  backFace.appendChild(shimmer2);

  // Assemble coin
  coin.appendChild(frontFace);
  coin.appendChild(backFace);
  coin.appendChild(edge);
  coinContainer.appendChild(coin);

  // Create particles
  const particlesContainer = document.createElement('div');
  particlesContainer.className = 'particles-container';
  createParticles(particlesContainer);
  coinContainer.appendChild(particlesContainer);

  // Create text
  const text = document.createElement('div');
  text.className = 'payment-text';
  text.innerHTML = message + '<span class="loading-dots">...</span>';

  const subtext = document.createElement('div');
  subtext.className = 'payment-subtext';
  subtext.textContent = 'Please wait';

  // Assemble everything
  animationContainer.appendChild(coinContainer);
  animationContainer.appendChild(text);
  animationContainer.appendChild(subtext);

  // Add to body
  document.body.appendChild(animationContainer);

  // Animate the dots
  let dotCount = 0;
  animationInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    const dots = '.'.repeat(dotCount);
    text.innerHTML = message + `<span class="loading-dots">${dots}</span>`;
  }, 500);

  console.log('🪙 Coin animation displayed');
};

/**
 * Hide coin spinning animation
 */
export const hideCoinAnimation = () => {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  if (animationContainer) {
    // Fade out animation
    animationContainer.style.animation = 'fadeOut 0.3s ease-out';
    
    setTimeout(() => {
      if (animationContainer && animationContainer.parentNode) {
        animationContainer.parentNode.removeChild(animationContainer);
      }
      animationContainer = null;
    }, 300);

    console.log('🪙 Coin animation hidden');
  }
};

// Add fadeOut animation
if (!document.getElementById('coin-animation-fadeout')) {
  const style = document.createElement('style');
  style.id = 'coin-animation-fadeout';
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export default { showCoinAnimation, hideCoinAnimation };
