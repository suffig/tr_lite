import { useState, useEffect } from 'react';

const AlcoholProgressionGraph = ({ managers, beerConsumption, shotConsumption, drinkingStartTime }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);

  // Calculate blood alcohol content for a given time
  const calculateBACForTime = (beerCount, shots, playerData, startTime, currentTime) => {
    if (!playerData.weight || (beerCount === 0 && (!shots || (shots.shots20 === 0 && shots.shots40 === 0)))) return 0;
    
    // Beer alcohol calculation: 0.5L beer = 500ml * 0.05 (5%) = 25ml pure alcohol
    // Density of ethanol = 0.789g/ml, so 25ml = 19.725g pure alcohol per beer
    const beerAlcoholGrams = beerCount * 25 * 0.789;
    
    // Shot alcohol calculation: 2cl shot = 20ml
    let shotAlcoholGrams = 0;
    if (shots) {
      shotAlcoholGrams = (shots.shots20 * 20 * 0.20 * 0.789) + (shots.shots40 * 20 * 0.40 * 0.789);
    }
    
    const totalAlcoholGrams = beerAlcoholGrams + shotAlcoholGrams;
    
    // Widmark factors (standard clinical values)
    const r = playerData.gender === 'male' ? 0.70 : 0.60;
    
    // Widmark formula: BAC = A / (r × m) where A=alcohol in grams, r=distribution factor, m=weight in kg
    let bac = totalAlcoholGrams / (r * playerData.weight);
    
    // Time-based alcohol elimination (0.15 promille per hour)
    if (startTime && currentTime) {
      const startDate = new Date(startTime);
      const currentDate = new Date(currentTime);
      const hoursElapsed = (currentDate - startDate) / (1000 * 60 * 60);
      const eliminatedBac = hoursElapsed * 0.15;
      bac = Math.max(0, bac - eliminatedBac);
    }
    
    return bac;
  };

  // Generate historical data points
  useEffect(() => {
    if (!drinkingStartTime) {
      setHistoricalData([]);
      return;
    }

    const startTime = new Date(drinkingStartTime);
    const now = new Date();
    const data = [];
    
    // Generate data points every 15 minutes
    const intervalMinutes = 15;
    const totalMinutes = Math.ceil((now - startTime) / (1000 * 60));
    const dataPoints = Math.min(Math.ceil(totalMinutes / intervalMinutes), 48); // Max 48 points (12 hours)
    
    for (let i = 0; i <= dataPoints; i++) {
      const currentTime = new Date(startTime.getTime() + (i * intervalMinutes * 60 * 1000));
      
      const alexanderBAC = calculateBACForTime(
        beerConsumption.alexander,
        shotConsumption.alexander,
        { weight: managers.aek.weight, gender: 'male' },
        drinkingStartTime,
        currentTime.toISOString()
      );
      
      const philipBAC = calculateBACForTime(
        beerConsumption.philip,
        shotConsumption.philip,
        { weight: managers.real.weight, gender: 'male' },
        drinkingStartTime,
        currentTime.toISOString()
      );
      
      data.push({
        time: currentTime,
        timeLabel: currentTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        alexander: alexanderBAC,
        philip: philipBAC
      });
    }
    
    setHistoricalData(data);
  }, [drinkingStartTime, beerConsumption, shotConsumption, managers]);

  const maxBAC = Math.max(
    ...historicalData.map(d => Math.max(d.alexander, d.philip)),
    1.0 // Minimum scale of 1.0‰
  );

  const getColorForBAC = (bac) => {
    if (bac >= 1.0) return 'text-red-500';
    if (bac >= 0.5) return 'text-orange-500';
    if (bac >= 0.3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const SVGGraph = () => {
    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (historicalData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>Keine Daten zum Anzeigen</p>
            <p className="text-sm">Trinken starten, um den Verlauf zu sehen</p>
          </div>
        </div>
      );
    }

    // Calculate scales
    const xScale = (index) => (index / (historicalData.length - 1)) * chartWidth;
    const yScale = (bac) => chartHeight - (bac / maxBAC) * chartHeight;

    // Generate path data
    const alexanderPath = historicalData.map((d, i) => 
      `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.alexander)}`
    ).join(' ');

    const philipPath = historicalData.map((d, i) => 
      `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.philip)}`
    ).join(' ');

    // Generate grid lines
    const yGridLines = [];
    const yTicks = Math.ceil(maxBAC / 0.2); // Every 0.2‰
    for (let i = 0; i <= yTicks; i++) {
      const y = yScale(i * 0.2);
      yGridLines.push(
        <line key={i} x1={0} y1={y} x2={chartWidth} y2={y} stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid lines */}
            {yGridLines}
            
            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#374151" strokeWidth="2" />
            
            {/* X-axis */}
            <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#374151" strokeWidth="2" />
            
            {/* Y-axis labels */}
            {Array.from({ length: Math.ceil(maxBAC / 0.2) + 1 }, (_, i) => {
              const bac = i * 0.2;
              const y = yScale(bac);
              return (
                <g key={i}>
                  <text 
                    x={-10} 
                    y={y + 4} 
                    textAnchor="end" 
                    fontSize="12" 
                    fill="#6b7280"
                  >
                    {bac.toFixed(1)}‰
                  </text>
                </g>
              );
            })}
            
            {/* X-axis labels (show every 4th point to avoid crowding) */}
            {historicalData.map((d, i) => {
              if (i % 4 !== 0 && i !== historicalData.length - 1) return null;
              return (
                <text 
                  key={i}
                  x={xScale(i)} 
                  y={chartHeight + 20} 
                  textAnchor="middle" 
                  fontSize="12" 
                  fill="#6b7280"
                >
                  {d.timeLabel}
                </text>
              );
            })}
            
            {/* Alexander's line (blue) */}
            <path 
              d={alexanderPath} 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Philip's line (green) */}
            <path 
              d={philipPath} 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {historicalData.map((d, i) => (
              <g key={i}>
                {/* Alexander points */}
                <circle 
                  cx={xScale(i)} 
                  cy={yScale(d.alexander)} 
                  r="4" 
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Philip points */}
                <circle 
                  cx={xScale(i)} 
                  cy={yScale(d.philip)} 
                  r="4" 
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                />
              </g>
            ))}
            
            {/* BAC danger zones (background areas) */}
            <defs>
              <pattern id="dangerZone" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="#fee2e2"/>
                <path d="M 0,2 L 2,0 M 2,4 L 4,2" stroke="#fca5a5" strokeWidth="0.5"/>
              </pattern>
            </defs>
            
            {/* Red zone (>1.0‰) */}
            {maxBAC > 1.0 && (
              <rect 
                x={0} 
                y={0} 
                width={chartWidth} 
                height={yScale(1.0)} 
                fill="url(#dangerZone)" 
                opacity="0.3"
              />
            )}
          </g>
          
          {/* Legend */}
          <g transform={`translate(${width - margin.right + 10}, ${margin.top + 20})`}>
            <rect x={-5} y={-10} width={65} height={50} fill="white" stroke="#e5e7eb" rx="4"/>
            <line x1={0} y1={0} x2={15} y2={0} stroke="#3b82f6" strokeWidth="3"/>
            <text x={20} y={4} fontSize="12" fill="#374151">Alexander</text>
            <line x1={0} y1={20} x2={15} y2={20} stroke="#10b981" strokeWidth="3"/>
            <text x={20} y={24} fontSize="12" fill="#374151">Philip</text>
          </g>
        </svg>
      </div>
    );
  };

  if (!drinkingStartTime) {
    return null;
  }

  return (
    <div className="modern-card mt-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-bold text-lg text-text-primary">
          📈 Alkoholverlauf beider Manager
        </h3>
        <div className="flex items-center gap-2">
          {/* Current BAC indicators */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Alexander: </span>
              <span className={`font-bold ${getColorForBAC(historicalData[historicalData.length - 1]?.alexander || 0)}`}>
                {(historicalData[historicalData.length - 1]?.alexander || 0).toFixed(2)}‰
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Philip: </span>
              <span className={`font-bold ${getColorForBAC(historicalData[historicalData.length - 1]?.philip || 0)}`}>
                {(historicalData[historicalData.length - 1]?.philip || 0).toFixed(2)}‰
              </span>
            </div>
          </div>
          <button className="text-2xl transition-transform duration-200">
            {isExpanded ? '📉' : '📊'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="mb-4 text-sm text-text-muted">
            BAK-Verlauf seit Trinkbeginn ({new Date(drinkingStartTime).toLocaleTimeString('de-DE', { 
              hour: '2-digit', 
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit'
            })})
          </div>
          
          <SVGGraph />
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="font-medium text-yellow-800 mb-1">⚠️ Grenzwerte</div>
              <div className="text-yellow-700 space-y-1">
                <div>0,3‰: Reaktionszeit verlangsamt</div>
                <div>0,5‰: Fahruntüchtig</div>
                <div>1,0‰: Schwer betrunken</div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800 mb-1">🔵 Alexander aktuell</div>
              <div className="text-blue-700">
                <div>Gewicht: {managers.aek.weight}kg</div>
                <div>Biere: {beerConsumption.alexander}</div>
                <div>Shots: {shotConsumption.alexander.shots20 + shotConsumption.alexander.shots40}</div>
              </div>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-medium text-green-800 mb-1">🟢 Philip aktuell</div>
              <div className="text-green-700">
                <div>Gewicht: {managers.real.weight}kg</div>
                <div>Biere: {beerConsumption.philip}</div>
                <div>Shots: {shotConsumption.philip.shots20 + shotConsumption.philip.shots40}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlcoholProgressionGraph;