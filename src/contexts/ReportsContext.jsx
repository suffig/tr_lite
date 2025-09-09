import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const ReportsContext = createContext();

export function ReportsProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [autoGeneration, setAutoGeneration] = useState(true);
  const [reportSettings, setReportSettings] = useState({
    weeklyEnabled: true,
    monthlyEnabled: true,
    includeStats: true,
    includeFinances: true,
    includePlayers: true,
    emailNotifications: false,
  });

  // Load reports from localStorage
  useEffect(() => {
    const savedReports = localStorage.getItem('fifa-tracker-reports');
    const savedSettings = localStorage.getItem('fifa-tracker-report-settings');
    
    if (savedReports) {
      try {
        setReports(JSON.parse(savedReports));
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    }

    if (savedSettings) {
      try {
        setReportSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading report settings:', error);
      }
    }
  }, []);

  // Save reports and settings
  useEffect(() => {
    localStorage.setItem('fifa-tracker-reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('fifa-tracker-report-settings', JSON.stringify(reportSettings));
  }, [reportSettings]);

  // Auto-generate reports (weekly on Sundays, monthly on 1st)
  useEffect(() => {
    if (!autoGeneration) return;

    const checkForAutoGeneration = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const dayOfMonth = now.getDate();
      
      // Weekly report on Sundays
      if (reportSettings.weeklyEnabled && dayOfWeek === 0) {
        const lastWeekly = reports.find(r => 
          r.type === 'weekly' && 
          isWithinLastDays(new Date(r.generatedAt), 7)
        );
        
        if (!lastWeekly) {
          generateWeeklyReport();
        }
      }

      // Monthly report on 1st of month
      if (reportSettings.monthlyEnabled && dayOfMonth === 1) {
        const lastMonthly = reports.find(r => 
          r.type === 'monthly' && 
          isWithinLastDays(new Date(r.generatedAt), 30)
        );
        
        if (!lastMonthly) {
          generateMonthlyReport();
        }
      }
    };

    // Check every hour
    const interval = setInterval(checkForAutoGeneration, 60 * 60 * 1000);
    
    // Check on mount
    checkForAutoGeneration();

    return () => clearInterval(interval);
  }, [autoGeneration, reportSettings, reports]);

  const isWithinLastDays = (date, days) => {
    const now = new Date();
    const daysDiff = (now - date) / (1000 * 60 * 60 * 24);
    return daysDiff < days;
  };

  const generateWeeklyReport = async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const reportData = await generateReportData(startDate, endDate);
    
    const report = {
      id: `weekly_${Date.now()}`,
      type: 'weekly',
      title: `Wochenbericht ${startDate.toLocaleDateString('de-DE')} - ${endDate.toLocaleDateString('de-DE')}`,
      period: { startDate, endDate },
      data: reportData,
      generatedAt: new Date(),
      insights: generateInsights(reportData, 'weekly'),
    };

    setReports(prev => [report, ...prev]);
    
    toast.success('📊 Wochenbericht erstellt!', {
      duration: 5000,
    });

    return report;
  };

  const generateMonthlyReport = async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
    
    const reportData = await generateReportData(startDate, endDate);
    
    const report = {
      id: `monthly_${Date.now()}`,
      type: 'monthly',
      title: `Monatsbericht ${startDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`,
      period: { startDate, endDate },
      data: reportData,
      generatedAt: new Date(),
      insights: generateInsights(reportData, 'monthly'),
    };

    setReports(prev => [report, ...prev]);
    
    toast.success('📈 Monatsbericht erstellt!', {
      duration: 5000,
    });

    return report;
  };

  const generateReportData = async (startDate, endDate) => {
    // Mock data generation - in a real app this would query the database
    const mockData = {
      matches: {
        total: Math.floor(Math.random() * 20) + 5,
        wins: Math.floor(Math.random() * 15) + 3,
        losses: Math.floor(Math.random() * 8) + 1,
        draws: Math.floor(Math.random() * 5),
        goalsFor: Math.floor(Math.random() * 30) + 10,
        goalsAgainst: Math.floor(Math.random() * 20) + 5,
      },
      players: {
        topScorer: { name: 'Max Mustermann', goals: Math.floor(Math.random() * 10) + 3 },
        topAssist: { name: 'Lisa Schmidt', assists: Math.floor(Math.random() * 8) + 2 },
        mostPlayed: { name: 'Tom Weber', matches: Math.floor(Math.random() * 15) + 5 },
      },
      finances: {
        income: Math.floor(Math.random() * 1000) + 500,
        expenses: Math.floor(Math.random() * 800) + 300,
        balance: 0, // Calculated below
      },
      stats: {
        averageGoalsPerMatch: 0, // Calculated below
        winRate: 0, // Calculated below
        formTrend: ['W', 'L', 'W', 'W', 'D'], // Last 5 matches
      }
    };

    // Calculate derived stats
    mockData.finances.balance = mockData.finances.income - mockData.finances.expenses;
    mockData.stats.averageGoalsPerMatch = mockData.matches.total > 0 
      ? (mockData.matches.goalsFor / mockData.matches.total).toFixed(2) 
      : 0;
    mockData.stats.winRate = mockData.matches.total > 0 
      ? ((mockData.matches.wins / mockData.matches.total) * 100).toFixed(1)
      : 0;

    return mockData;
  };

  const generateInsights = (data, type) => {
    const insights = [];
    
    // Performance insights
    if (data.stats.winRate > 70) {
      insights.push({
        type: 'positive',
        title: 'Starke Leistung',
        description: `Siegesquote von ${data.stats.winRate}% zeigt konsistente Stärke.`
      });
    } else if (data.stats.winRate < 40) {
      insights.push({
        type: 'negative',
        title: 'Verbesserungspotential',
        description: `Siegesquote von ${data.stats.winRate}% deutet auf Schwächen hin.`
      });
    }

    // Financial insights
    if (data.finances.balance > 0) {
      insights.push({
        type: 'positive',
        title: 'Positiver Saldo',
        description: `+${data.finances.balance}€ Gewinn in diesem Zeitraum.`
      });
    } else if (data.finances.balance < -200) {
      insights.push({
        type: 'warning',
        title: 'Hohe Ausgaben',
        description: `${data.finances.balance}€ Verlust - Ausgaben überprüfen.`
      });
    }

    // Goals insights
    if (data.stats.averageGoalsPerMatch > 2.5) {
      insights.push({
        type: 'positive',
        title: 'Starke Offensive',
        description: `${data.stats.averageGoalsPerMatch} Tore pro Spiel im Durchschnitt.`
      });
    }

    // Add period-specific insights
    if (type === 'weekly') {
      insights.push({
        type: 'info',
        title: 'Wochentrend',
        description: `Form der letzten 5 Spiele: ${data.stats.formTrend.join('-')}`
      });
    }

    return insights;
  };

  const deleteReport = (reportId) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    toast.success('Bericht gelöscht');
  };

  const exportReport = (report, format = 'json') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/\s+/g, '_')}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Bericht exportiert');
    }
  };

  const updateReportSettings = (newSettings) => {
    setReportSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value = {
    // State
    reports,
    autoGeneration,
    reportSettings,
    
    // Actions
    generateWeeklyReport,
    generateMonthlyReport,
    deleteReport,
    exportReport,
    setAutoGeneration,
    updateReportSettings,
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
}

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};

export default ReportsContext;