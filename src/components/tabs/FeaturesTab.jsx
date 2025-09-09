import React from 'react';
import EnhancedFeaturesDashboard from '../EnhancedFeaturesDashboard';

export default function FeaturesTab({ onShowSlotMachine, onShowThemeSettings, accountBalance }) {
  return (
    <div className="min-h-screen pb-20">
      <EnhancedFeaturesDashboard 
        onShowSlotMachine={onShowSlotMachine} 
        onShowThemeSettings={onShowThemeSettings}
        accountBalance={accountBalance}
      />
    </div>
  );
}