import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const SLOT_SYMBOLS = [
  { symbol: '⚽', name: 'Ball', value: 10, rarity: 'common' },
  { symbol: '🏆', name: 'Trophy', value: 50, rarity: 'rare' },
  { symbol: '👑', name: 'Crown', value: 100, rarity: 'epic' },
  { symbol: '💎', name: 'Diamond', value: 200, rarity: 'legendary' },
  { symbol: '🌟', name: 'Star', value: 25, rarity: 'uncommon' },
  { symbol: '🔥', name: 'Fire', value: 75, rarity: 'rare' },
  { symbol: '⚡', name: 'Lightning', value: 150, rarity: 'epic' },
];

const RARITY_WEIGHTS = {
  common: 40,
  uncommon: 25,
  rare: 20,
  epic: 10,
  legendary: 5,
};

const SlotMachine = ({ isOpen, onClose, accountBalance, onBalanceUpdate }) => {
  const { theme } = useTheme();
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState([null, null, null]);
  const [lastWin, setLastWin] = useState(null);
  const [spinHistory, setSpinHistory] = useState([]);
  const [jackpotValue, setJackpotValue] = useState(1000);
  const [spinCost] = useState(10);

  // Load spin history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('fifa-tracker-slot-history');
    if (savedHistory) {
      try {
        setSpinHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading spin history:', error);
      }
    }
  }, []);

  // Save spin history
  useEffect(() => {
    localStorage.setItem('fifa-tracker-slot-history', JSON.stringify(spinHistory));
  }, [spinHistory]);

  // Update jackpot periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotValue(prev => prev + Math.floor(Math.random() * 5) + 1);
    }, 10000); // Increase every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getRandomSymbol = () => {
    const random = Math.random() * 100;
    let currentWeight = 0;
    
    for (const symbol of SLOT_SYMBOLS) {
      currentWeight += RARITY_WEIGHTS[symbol.rarity];
      if (random <= currentWeight) {
        return symbol;
      }
    }
    
    return SLOT_SYMBOLS[0]; // Fallback
  };

  const calculateWinnings = (symbols) => {
    // Check for exact matches
    if (symbols[0]?.symbol === symbols[1]?.symbol && symbols[1]?.symbol === symbols[2]?.symbol) {
      const symbol = symbols[0];
      let winAmount = symbol.value * 10; // 10x for three of a kind
      
      // Jackpot for three diamonds
      if (symbol.symbol === '💎') {
        winAmount = jackpotValue;
        setJackpotValue(1000); // Reset jackpot
      }
      
      return { type: 'jackpot', amount: winAmount, symbol };
    }
    
    // Check for two matches
    const matchPairs = [
      [0, 1], [1, 2], [0, 2]
    ];
    
    for (const [i, j] of matchPairs) {
      if (symbols[i]?.symbol === symbols[j]?.symbol) {
        const winAmount = symbols[i].value * 2; // 2x for pair
        return { type: 'pair', amount: winAmount, symbol: symbols[i] };
      }
    }
    
    // Check for special combinations
    const symbolSet = new Set(symbols.map(s => s?.symbol));
    
    // All different rare symbols
    if (symbolSet.size === 3 && symbols.every(s => s.rarity === 'rare' || s.rarity === 'epic' || s.rarity === 'legendary')) {
      return { type: 'special', amount: 30, description: 'Rare Combo' };
    }
    
    return null; // No win
  };

  const performSpin = async () => {
    if (isSpinning || accountBalance < spinCost) return;
    
    setIsSpinning(true);
    setLastWin(null);
    
    // Update balance for spin cost
    onBalanceUpdate(accountBalance - spinCost);
    
    // Animate spinning
    const spinDuration = 2000 + Math.random() * 1000; // 2-3 seconds
    const animationInterval = 100;
    let elapsed = 0;
    
    const spinAnimation = setInterval(() => {
      setReels([getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
      elapsed += animationInterval;
      
      if (elapsed >= spinDuration) {
        clearInterval(spinAnimation);
        finalizeSpin();
      }
    }, animationInterval);
  };

  const finalizeSpin = () => {
    // Generate final result
    const finalReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
    setReels(finalReels);
    
    // Calculate winnings
    const winResult = calculateWinnings(finalReels);
    
    if (winResult) {
      setLastWin(winResult);
      onBalanceUpdate(accountBalance - spinCost + winResult.amount);
      
      // Show win notification
      const message = winResult.type === 'jackpot' 
        ? `🎉 JACKPOT! ${winResult.amount}€ gewonnen!`
        : `🎊 Gewinn! ${winResult.amount}€`;
        
      toast.success(message, {
        duration: 5000,
        style: {
          background: winResult.type === 'jackpot' ? '#FFD700' : '#10B981',
          color: winResult.type === 'jackpot' ? '#000' : '#FFF',
          fontWeight: 'bold',
        }
      });
    } else {
      toast('Kein Gewinn diesmal 😔', {
        icon: '🎰',
        duration: 2000,
      });
    }
    
    // Add to history
    const spinRecord = {
      id: Date.now(),
      timestamp: new Date(),
      symbols: finalReels,
      win: winResult,
      cost: spinCost,
    };
    
    setSpinHistory(prev => [spinRecord, ...prev.slice(0, 49)]); // Keep last 50 spins
    setIsSpinning(false);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#64748B';
      case 'uncommon': return '#10B981';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#64748B';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.surface }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: theme.text }}>
            🎰 Glücksrad
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-gray-500 text-xl">×</span>
          </button>
        </div>

        {/* Jackpot Display */}
        <div className="text-center mb-6 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-black">
          <div className="text-sm font-semibold">JACKPOT</div>
          <div className="text-2xl font-bold">{jackpotValue}€</div>
          <div className="text-xs">3x 💎 für Jackpot!</div>
        </div>

        {/* Account Balance */}
        <div className="text-center mb-6">
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Kontostand
          </div>
          <div className="text-xl font-bold" style={{ color: theme.text }}>
            {accountBalance}€
          </div>
        </div>

        {/* Slot Reels */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2 mb-4">
            {reels.map((symbol, index) => (
              <div
                key={index}
                className={`w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-3xl border-4 transition-all duration-300 ${
                  isSpinning ? 'animate-pulse border-yellow-400' : 'border-gray-300'
                }`}
                style={{
                  borderColor: symbol ? getRarityColor(symbol.rarity) : undefined,
                  boxShadow: symbol && lastWin ? '0 0 20px rgba(255, 215, 0, 0.5)' : undefined,
                }}
              >
                {symbol ? symbol.symbol : '?'}
              </div>
            ))}
          </div>
          
          {/* Symbol Values */}
          <div className="text-center text-xs" style={{ color: theme.textSecondary }}>
            Spin-Kosten: {spinCost}€
          </div>
        </div>

        {/* Last Win Display */}
        {lastWin && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 rounded-lg text-center">
            <div className="text-lg font-bold text-green-800 dark:text-green-200">
              {lastWin.type === 'jackpot' && '🎉 JACKPOT! 🎉'}
              {lastWin.type === 'pair' && '🎊 Paar! 🎊'}
              {lastWin.type === 'special' && '✨ Special! ✨'}
            </div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              +{lastWin.amount}€
            </div>
            {lastWin.description && (
              <div className="text-sm text-green-700 dark:text-green-300">
                {lastWin.description}
              </div>
            )}
          </div>
        )}

        {/* Spin Button */}
        <button
          onClick={performSpin}
          disabled={isSpinning || accountBalance < spinCost}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            isSpinning || accountBalance < spinCost
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transform hover:scale-105'
          }`}
        >
          {isSpinning ? '🎰 Spinning...' : `Spin für ${spinCost}€`}
        </button>

        {accountBalance < spinCost && (
          <div className="mt-2 text-center text-red-500 text-sm">
            Nicht genug Guthaben für einen Spin
          </div>
        )}

        {/* Symbol Legend */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3 text-sm" style={{ color: theme.text }}>
            Symbol-Werte (3x = 10x Wert, 2x = 2x Wert)
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {SLOT_SYMBOLS.map(symbol => (
              <div key={symbol.symbol} className="flex items-center space-x-2">
                <span className="text-lg">{symbol.symbol}</span>
                <span style={{ color: getRarityColor(symbol.rarity) }}>
                  {symbol.value}€
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Spins */}
        {spinHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3 text-sm" style={{ color: theme.text }}>
              Letzte Spins
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {spinHistory.slice(0, 5).map(spin => (
                <div key={spin.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex space-x-1">
                    {spin.symbols.map((symbol, i) => (
                      <span key={i}>{symbol.symbol}</span>
                    ))}
                  </div>
                  <div style={{ color: spin.win ? theme.success : theme.error }}>
                    {spin.win ? `+${spin.win.amount}€` : `-${spin.cost}€`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotMachine;