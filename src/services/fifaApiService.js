// FIFA API Service for real player ratings and data
// Note: This is a mock implementation as EA Sports FIFA API access requires special authorization

class FIFAApiService {
  constructor() {
    this.baseUrl = 'https://api.ea.com/fifa'; // Mock URL
    this.apiKey = import.meta.env?.VITE_FIFA_API_KEY || 'mock-api-key';
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
  }

  // Mock player database for demonstration
  mockPlayerDatabase = [
    {
      id: 1,
      name: 'Lionel Messi',
      club: 'Paris Saint-Germain',
      nationality: 'Argentina',
      position: 'RW',
      overallRating: 93,
      pace: 85,
      shooting: 92,
      passing: 91,
      dribbling: 95,
      defending: 34,
      physical: 65,
      value: 50000000,
      wage: 320000,
      age: 36,
      height: 170,
      weight: 67,
      foot: 'Left',
      workRates: 'Medium/Low',
      skills: 4,
      weakFoot: 4,
      traits: ['Finesse Shot', 'Playmaker', 'Technical Dribbler'],
      specialties: ['FK', 'Dribbling', 'Finishing']
    },
    {
      id: 2,
      name: 'Erling Haaland',
      club: 'Manchester City',
      nationality: 'Norway',
      position: 'ST',
      overallRating: 91,
      pace: 89,
      shooting: 91,
      passing: 65,
      dribbling: 80,
      defending: 45,
      physical: 88,
      value: 180000000,
      wage: 375000,
      age: 23,
      height: 194,
      weight: 88,
      foot: 'Left',
      workRates: 'High/Medium',
      skills: 3,
      weakFoot: 3,
      traits: ['Power Header', 'Finesse Shot'],
      specialties: ['Acrobat', 'Clinical Finisher']
    },
    {
      id: 3,
      name: 'Kylian Mbappé',
      club: 'Paris Saint-Germain',
      nationality: 'France',
      position: 'ST',
      overallRating: 91,
      pace: 97,
      shooting: 89,
      passing: 80,
      dribbling: 92,
      defending: 36,
      physical: 77,
      value: 180000000,
      wage: 350000,
      age: 25,
      height: 178,
      weight: 73,
      foot: 'Right',
      workRates: 'High/Low',
      skills: 4,
      weakFoot: 4,
      traits: ['Speed Dribbler', 'Finesse Shot'],
      specialties: ['Speedster', 'Distance Shooter']
    },
    // Add more players as needed
  ];

  async searchPlayers(query, options = {}) {
    try {
      // In a real implementation, this would make an API call
      // For now, we'll simulate with mock data
      
      const cacheKey = `search_${query}_${JSON.stringify(options)}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Simulate API delay
      await this.delay(500);

      // Filter mock database
      const results = this.mockPlayerDatabase.filter(player => 
        player.name.toLowerCase().includes(query.toLowerCase()) ||
        player.club.toLowerCase().includes(query.toLowerCase()) ||
        player.nationality.toLowerCase().includes(query.toLowerCase())
      );

      // Apply filters
      let filteredResults = results;
      
      if (options.position) {
        filteredResults = filteredResults.filter(p => p.position === options.position);
      }
      
      if (options.club) {
        filteredResults = filteredResults.filter(p => 
          p.club.toLowerCase().includes(options.club.toLowerCase())
        );
      }

      if (options.minRating) {
        filteredResults = filteredResults.filter(p => p.overallRating >= options.minRating);
      }

      if (options.maxAge) {
        filteredResults = filteredResults.filter(p => p.age <= options.maxAge);
      }

      // Sort by rating (highest first)
      filteredResults.sort((a, b) => b.overallRating - a.overallRating);

      // Limit results
      if (options.limit) {
        filteredResults = filteredResults.slice(0, options.limit);
      }

      const response = {
        players: filteredResults,
        total: filteredResults.length,
        query,
        options
      };

      this.setCache(cacheKey, response);
      return response;

    } catch (error) {
      console.error('Error searching players:', error);
      throw new Error('Failed to search players');
    }
  }

  async getPlayerById(playerId) {
    try {
      const cacheKey = `player_${playerId}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Simulate API delay
      await this.delay(300);

      const player = this.mockPlayerDatabase.find(p => p.id === playerId);
      
      if (!player) {
        throw new Error('Player not found');
      }

      // Add additional detailed stats
      const detailedPlayer = {
        ...player,
        stats: {
          appearances: Math.floor(Math.random() * 30) + 10,
          goals: Math.floor(Math.random() * 20) + 5,
          assists: Math.floor(Math.random() * 15) + 3,
          yellowCards: Math.floor(Math.random() * 8),
          redCards: Math.floor(Math.random() * 2),
          minutesPlayed: Math.floor(Math.random() * 2000) + 800,
        },
        form: this.generateFormData(),
        marketValue: this.calculateMarketValue(player),
        potentialRating: Math.min(99, player.overallRating + Math.floor(Math.random() * 5)),
      };

      this.setCache(cacheKey, detailedPlayer);
      return detailedPlayer;

    } catch (error) {
      console.error('Error getting player:', error);
      throw error;
    }
  }

  async getTeamPlayers(teamName) {
    try {
      const cacheKey = `team_${teamName}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Simulate API delay
      await this.delay(700);

      const teamPlayers = this.mockPlayerDatabase.filter(player =>
        player.club.toLowerCase().includes(teamName.toLowerCase())
      );

      const response = {
        team: teamName,
        players: teamPlayers,
        totalValue: teamPlayers.reduce((sum, p) => sum + p.value, 0),
        averageRating: teamPlayers.reduce((sum, p) => sum + p.overallRating, 0) / teamPlayers.length || 0,
        averageAge: teamPlayers.reduce((sum, p) => sum + p.age, 0) / teamPlayers.length || 0,
      };

      this.setCache(cacheKey, response);
      return response;

    } catch (error) {
      console.error('Error getting team players:', error);
      throw new Error('Failed to get team players');
    }
  }

  async getPlayerComparison(playerIds) {
    try {
      const players = await Promise.all(
        playerIds.map(id => this.getPlayerById(id))
      );

      return {
        players,
        comparison: this.generateComparison(players),
      };

    } catch (error) {
      console.error('Error comparing players:', error);
      throw new Error('Failed to compare players');
    }
  }

  async getTopPlayers(options = {}) {
    try {
      const { position, league, limit = 10 } = options;
      
      let players = [...this.mockPlayerDatabase];

      if (position) {
        players = players.filter(p => p.position === position);
      }

      // Sort by rating
      players.sort((a, b) => b.overallRating - a.overallRating);

      return {
        players: players.slice(0, limit),
        criteria: options,
      };

    } catch (error) {
      console.error('Error getting top players:', error);
      throw new Error('Failed to get top players');
    }
  }

  // Helper methods
  generateFormData() {
    return Array.from({ length: 10 }, () => ({
      rating: Math.floor(Math.random() * 40) + 60, // 60-100
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    }));
  }

  calculateMarketValue(player) {
    // Simple market value calculation based on age and rating
    const ageFactor = Math.max(0.3, 1 - (player.age - 18) * 0.02);
    const ratingFactor = player.overallRating / 100;
    return Math.floor(player.value * ageFactor * ratingFactor);
  }

  generateComparison(players) {
    const stats = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
    const comparison = {};

    stats.forEach(stat => {
      comparison[stat] = {
        values: players.map(p => p[stat]),
        leader: players.reduce((leader, player) => 
          player[stat] > leader[stat] ? player : leader
        ),
      };
    });

    return comparison;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache() {
    this.cache.clear();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Connection test
  async testConnection() {
    try {
      await this.delay(1000);
      return {
        connected: true,
        message: 'Successfully connected to FIFA API (Mock)',
        version: '1.0.0',
      };
    } catch (error) {
      return {
        connected: false,
        message: 'Failed to connect to FIFA API',
        error: error.message,
      };
    }
  }
}

export default new FIFAApiService();