import React, { useEffect, useState, useCallback } from 'react';
import ReactConfetti from 'react-confetti';
import confetti from 'canvas-confetti';

// Custom hook for window dimensions
const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
};

// Full screen confetti rain component
export const ConfettiRain = ({ active, duration = 5000, onComplete }) => {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(active);

  useEffect(() => {
    if (active) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration, onComplete]);

  if (!isActive) return null;

  return (
    <ReactConfetti
      width={width}
      height={height}
      numberOfPieces={300}
      recycle={false}
      colors={['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#ffd700', '#00f2fe']}
      gravity={0.3}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
    />
  );
};

// Burst confetti from a point (for badges, buttons, etc.)
export const triggerConfettiBurst = (options = {}) => {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#ffd700'],
  };
  
  confetti({
    ...defaults,
    ...options,
  });
};

// Side cannons effect (for level up, big achievements)
export const triggerSideCannons = () => {
  const end = Date.now() + 2000;
  const colors = ['#667eea', '#764ba2', '#ffd700', '#00f2fe'];

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: colors
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

// Stars effect (for perfect scores)
export const triggerStars = () => {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    shapes: ['star'],
    colors: ['#ffd700', '#ffec3d', '#ffe066', '#fff9c4']
  };

  confetti({
    ...defaults,
    particleCount: 50,
    scalar: 1.2,
    shapes: ['star']
  });

  confetti({
    ...defaults,
    particleCount: 30,
    scalar: 0.75,
    shapes: ['circle']
  });
};

// Fireworks effect (for certificates, major milestones)
export const triggerFireworks = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const interval = setInterval(() => {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    
    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2
      },
      colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#ffd700', '#00f2fe']
    });
  }, 250);
};

// School pride effect (for completing courses)
export const triggerSchoolPride = () => {
  const end = Date.now() + 3000;
  const colors = ['#667eea', '#764ba2'];

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

// Badge earned animation component
export const BadgeEarnedModal = ({ badge, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(true);
  
  useEffect(() => {
    // Trigger confetti when badge is shown
    if (badge) {
      triggerConfettiBurst({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.4 }
      });
      
      // Add side cannons for rare+ badges
      if (badge.rarity !== 'common') {
        setTimeout(() => triggerSideCannons(), 500);
      }
      
      // Add stars for legendary badges
      if (badge.rarity === 'legendary') {
        setTimeout(() => triggerStars(), 1000);
      }
    }
  }, [badge]);

  if (!badge) return null;

  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-500 to-pink-500',
    legendary: 'from-yellow-400 to-orange-500'
  };

  const rarityGlow = {
    common: '',
    rare: 'shadow-blue-400/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-yellow-400/50 animate-pulse'
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <ConfettiRain active={showConfetti} duration={3000} onComplete={() => setShowConfetti(false)} />
      
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center transform animate-bounce-in shadow-2xl">
        {/* Badge Icon with glow effect */}
        <div className={`relative inline-block mb-6`}>
          <div className={`absolute inset-0 bg-gradient-to-r ${rarityColors[badge.rarity]} blur-xl opacity-50 rounded-full scale-150`}></div>
          <div className={`relative text-8xl animate-bounce-badge ${rarityGlow[badge.rarity]}`}>
            {badge.icon}
          </div>
        </div>
        
        {/* Achievement Text */}
        <h2 className="text-3xl font-bold text-slate-800 mb-2 font-nunito">
          🎉 New Badge Unlocked!
        </h2>
        
        <h3 className={`text-2xl font-bold bg-gradient-to-r ${rarityColors[badge.rarity]} bg-clip-text text-transparent mb-2`}>
          {badge.name}
        </h3>
        
        <p className="text-slate-600 mb-4">{badge.description}</p>
        
        {/* Rarity tag */}
        <span className={`inline-block px-4 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${rarityColors[badge.rarity]} mb-4`}>
          {badge.rarity.toUpperCase()}
        </span>
        
        {/* Points earned */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-6">
          <p className="text-yellow-600 font-bold text-lg">
            +{badge.points_reward} Points Earned! ⭐
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold text-lg hover:shadow-lg transition-all transform hover:scale-105"
        >
          Awesome! 🚀
        </button>
      </div>
      
      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce-badge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        .animate-bounce-badge {
          animation: bounce-badge 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// Level up modal with special effects
export const LevelUpModal = ({ newLevel, onClose }) => {
  useEffect(() => {
    if (newLevel) {
      triggerFireworks();
      setTimeout(() => triggerSchoolPride(), 500);
    }
  }, [newLevel]);

  if (!newLevel) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 max-w-md w-full mx-4 text-center transform animate-bounce-in shadow-2xl text-white">
        {/* Level badge */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-50 rounded-full scale-150"></div>
          <div className="relative text-7xl">⚡</div>
        </div>
        
        <h2 className="text-4xl font-bold mb-2 font-nunito">
          LEVEL UP!
        </h2>
        
        <div className="text-8xl font-black text-yellow-400 mb-4 drop-shadow-lg">
          {newLevel}
        </div>
        
        <p className="text-purple-100 mb-6 text-lg">
          You've reached a new level! Keep learning to unlock more achievements!
        </p>
        
        <button
          onClick={onClose}
          className="w-full py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:shadow-lg transition-all transform hover:scale-105"
        >
          Let's Go! 🚀
        </button>
      </div>
    </div>
  );
};

// Quiz complete celebration
export const QuizCompleteCelebration = ({ passed, score, isPerfect }) => {
  useEffect(() => {
    if (isPerfect) {
      triggerStars();
      setTimeout(() => triggerFireworks(), 500);
    } else if (passed) {
      triggerConfettiBurst({ particleCount: 100, spread: 90 });
    }
  }, [passed, isPerfect]);

  return null;
};

// Certificate celebration
export const CertificateCelebration = ({ show }) => {
  useEffect(() => {
    if (show) {
      triggerFireworks();
      setTimeout(() => triggerSchoolPride(), 1000);
    }
  }, [show]);

  return null;
};

export default {
  ConfettiRain,
  triggerConfettiBurst,
  triggerSideCannons,
  triggerStars,
  triggerFireworks,
  triggerSchoolPride,
  BadgeEarnedModal,
  LevelUpModal,
  QuizCompleteCelebration,
  CertificateCelebration
};
