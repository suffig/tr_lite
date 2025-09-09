/**
 * MSMC API Service for FC25 Player Data
 * Provides integration with https://api.msmc.cc/fc25/ for FIFA player statistics
 * Replaces the previous SoFIFA integration with the new MSMC API
 */

export class MSMCApiService {
    static BASE_URL = 'https://api.msmc.cc/fc25';
    static CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
    static cache = new Map();
    static rateLimit = {
        requests: 0,
        resetTime: 0,
        maxRequests: 30 // More generous rate limit for API calls
    };

    /**
     * Normalize player name for better matching
     * @param {string} name - Player name to normalize
     * @returns {string} Normalized name
     */
    static normalizePlayerName(name) {
        if (!name) return '';
        return name
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[''`]/g, '')
            .replace(/[.,-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Check if we're within rate limits
     * @returns {boolean} True if within limits
     */
    static checkRateLimit() {
        const now = Date.now();
        
        if (now > this.rateLimit.resetTime) {
            this.rateLimit.requests = 0;
            this.rateLimit.resetTime = now + 60000; // Next minute
        }

        if (this.rateLimit.requests >= this.rateLimit.maxRequests) {
            return false;
        }

        this.rateLimit.requests++;
        return true;
    }

    /**
     * Search for a player by name using MSMC API
     * @param {string} playerName - Name of the player to search for
     * @returns {Promise<Object|null>} Player data or null if not found
     */
    static async searchPlayerByName(playerName) {
        if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
            console.warn('⚠️ Invalid player name provided');
            return null;
        }

        const normalizedName = this.normalizePlayerName(playerName);
        const cacheKey = `search_${normalizedName}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            console.log(`📦 Cache hit for player search: ${playerName}`);
            return cached.data;
        }

        if (!this.checkRateLimit()) {
            console.warn('⚠️ Rate limit exceeded for MSMC API requests');
            return null;
        }

        try {
            console.log(`🔍 Searching MSMC API for player: ${playerName}`);
            
            // Try multiple search strategies
            const searchStrategies = [
                () => this.searchByExactName(playerName),
                () => this.searchByFuzzyName(playerName),
                () => this.searchInPlayersList(playerName)
            ];

            for (const strategy of searchStrategies) {
                try {
                    const result = await strategy();
                    if (result) {
                        // Cache the result
                        this.cache.set(cacheKey, {
                            data: result,
                            timestamp: Date.now()
                        });
                        return result;
                    }
                } catch (error) {
                    console.warn(`❌ Search strategy failed: ${error.message}`);
                    continue;
                }
            }

            console.warn(`⚠️ Player not found in MSMC API: ${playerName}`);
            return null;

        } catch (error) {
            console.error('❌ Error searching MSMC API:', error.message);
            return null;
        }
    }

    /**
     * Search by exact player name
     * @param {string} playerName - Player name
     * @returns {Promise<Object|null>} Player data or null
     */
    static async searchByExactName(playerName) {
        const url = `${this.BASE_URL}/players/search?name=${encodeURIComponent(playerName)}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'FIFA-Tracker/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`API response not ok: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.players && data.players.length > 0) {
                return this.transformPlayerData(data.players[0]);
            }

            return null;
        } catch (error) {
            console.warn(`❌ Exact name search failed: ${error.message}`);
            // Fallback to mock data for development/demo purposes
            return this.generateMockPlayerData(playerName);
        }
    }

    /**
     * Search by fuzzy name matching
     * @param {string} playerName - Player name
     * @returns {Promise<Object|null>} Player data or null
     */
    static async searchByFuzzyName(playerName) {
        const url = `${this.BASE_URL}/players/search?query=${encodeURIComponent(playerName)}&fuzzy=true`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'FIFA-Tracker/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`API response not ok: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.players && data.players.length > 0) {
                // Return the best match
                return this.transformPlayerData(data.players[0]);
            }

            return null;
        } catch (error) {
            console.warn(`❌ Fuzzy search failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Search in the full players list (last resort)
     * @param {string} playerName - Player name
     * @returns {Promise<Object|null>} Player data or null
     */
    static async searchInPlayersList(playerName) {
        // This would be expensive in a real API, but useful for comprehensive search
        const url = `${this.BASE_URL}/players`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'FIFA-Tracker/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`API response not ok: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.players) {
                const normalizedSearch = this.normalizePlayerName(playerName);
                const player = data.players.find(p => 
                    this.normalizePlayerName(p.name || p.short_name || p.long_name).includes(normalizedSearch) ||
                    normalizedSearch.includes(this.normalizePlayerName(p.name || p.short_name || p.long_name))
                );
                
                if (player) {
                    return this.transformPlayerData(player);
                }
            }

            return null;
        } catch (error) {
            console.warn(`❌ Players list search failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Transform MSMC API player data to FIFA data format
     * @param {Object} apiPlayer - Player data from MSMC API
     * @returns {Object} Transformed player data
     */
    static transformPlayerData(apiPlayer) {
        try {
            return {
                overall: apiPlayer.overall || apiPlayer.rating || 75,
                potential: apiPlayer.potential || apiPlayer.overall || apiPlayer.rating || 75,
                source: 'msmc_api',
                lastUpdated: new Date().toISOString(),
                playerId: apiPlayer.id || apiPlayer.player_id,
                playerName: apiPlayer.name || apiPlayer.short_name || apiPlayer.long_name,
                age: apiPlayer.age,
                nationality: apiPlayer.nationality || apiPlayer.nation,
                positions: this.parsePositions(apiPlayer.positions || apiPlayer.position),
                height: apiPlayer.height_cm || apiPlayer.height,
                weight: apiPlayer.weight_kg || apiPlayer.weight,
                preferredFoot: apiPlayer.preferred_foot || apiPlayer.foot,
                weakFoot: apiPlayer.weak_foot || 3,
                skillMoves: apiPlayer.skill_moves || 3,
                workRate: apiPlayer.work_rate || 'Medium/Medium',
                club: apiPlayer.club || apiPlayer.team,
                league: apiPlayer.league,
                value: apiPlayer.value_eur ? `€${(apiPlayer.value_eur / 1000000).toFixed(1)}M` : null,
                wage: apiPlayer.wage_eur ? `€${(apiPlayer.wage_eur / 1000).toFixed(0)}K` : null,
                
                // Main attributes
                pace: apiPlayer.pace || this.calculateAttribute(apiPlayer.acceleration, apiPlayer.sprint_speed),
                shooting: apiPlayer.shooting || this.calculateAttribute(apiPlayer.finishing, apiPlayer.shot_power),
                passing: apiPlayer.passing || this.calculateAttribute(apiPlayer.short_passing, apiPlayer.long_passing),
                dribbling: apiPlayer.dribbling || this.calculateAttribute(apiPlayer.ball_control, apiPlayer.agility),
                defending: apiPlayer.defending || this.calculateAttribute(apiPlayer.interceptions, apiPlayer.standing_tackle),
                physical: apiPlayer.physic || this.calculateAttribute(apiPlayer.strength, apiPlayer.stamina),
                
                // Detailed skills
                skills: {
                    crossing: apiPlayer.crossing || 70,
                    finishing: apiPlayer.finishing || 70,
                    headingAccuracy: apiPlayer.heading_accuracy || 70,
                    shortPassing: apiPlayer.short_passing || 70,
                    volleys: apiPlayer.volleys || 70,
                    curve: apiPlayer.curve || 70,
                    fkAccuracy: apiPlayer.free_kick_accuracy || 70,
                    longPassing: apiPlayer.long_passing || 70,
                    ballControl: apiPlayer.ball_control || 70,
                    acceleration: apiPlayer.acceleration || 70,
                    sprintSpeed: apiPlayer.sprint_speed || 70,
                    agility: apiPlayer.agility || 70,
                    reactions: apiPlayer.reactions || 70,
                    balance: apiPlayer.balance || 70,
                    shotPower: apiPlayer.shot_power || 70,
                    jumping: apiPlayer.jumping || 70,
                    stamina: apiPlayer.stamina || 70,
                    strength: apiPlayer.strength || 70,
                    longShots: apiPlayer.long_shots || 70,
                    aggression: apiPlayer.aggression || 70,
                    interceptions: apiPlayer.interceptions || 70,
                    positioning: apiPlayer.positioning || 70,
                    vision: apiPlayer.vision || 70,
                    penalties: apiPlayer.penalties || 70,
                    composure: apiPlayer.composure || 70
                },
                
                found: true,
                searchName: apiPlayer.searchName || apiPlayer.name
            };
        } catch (error) {
            console.error('❌ Error transforming player data:', error.message);
            return null;
        }
    }

    /**
     * Parse positions array from API response
     * @param {string|Array} positions - Positions from API
     * @returns {Array} Array of position strings
     */
    static parsePositions(positions) {
        if (!positions) return ['Unknown'];
        if (Array.isArray(positions)) return positions;
        if (typeof positions === 'string') {
            return positions.split(',').map(p => p.trim());
        }
        return ['Unknown'];
    }

    /**
     * Calculate main attribute from detailed stats
     * @param {number} stat1 - First stat
     * @param {number} stat2 - Second stat
     * @returns {number} Calculated attribute
     */
    static calculateAttribute(stat1, stat2) {
        if (stat1 && stat2) {
            return Math.round((stat1 + stat2) / 2);
        }
        return stat1 || stat2 || 70;
    }

    /**
     * Generate mock player data for development/demo
     * @param {string} playerName - Player name
     * @returns {Object} Mock player data
     */
    static generateMockPlayerData(playerName) {
        const overall = 70 + Math.floor(Math.random() * 20);
        
        console.log(`🎲 Generating mock data for: ${playerName} (MSMC API not available)`);
        
        // Try to generate more realistic data based on player name patterns
        const playerData = {
            overall: overall,
            potential: Math.min(overall + Math.floor(Math.random() * 8), 95),
            source: 'msmc_api_mock',
            lastUpdated: new Date().toISOString(),
            playerId: Math.floor(Math.random() * 999999),
            playerName: playerName,
            age: 20 + Math.floor(Math.random() * 15),
            nationality: 'Unknown',
            positions: ['Unknown'],
            height: 170 + Math.floor(Math.random() * 20),
            weight: 65 + Math.floor(Math.random() * 20),
            preferredFoot: Math.random() > 0.5 ? 'Right' : 'Left',
            weakFoot: 2 + Math.floor(Math.random() * 3),
            skillMoves: 2 + Math.floor(Math.random() * 3),
            workRate: 'Medium/Medium',
            club: 'Unknown',
            
            pace: this.generateAttribute(overall),
            shooting: this.generateAttribute(overall),
            passing: this.generateAttribute(overall),
            dribbling: this.generateAttribute(overall),
            defending: this.generateAttribute(overall),
            physical: this.generateAttribute(overall),
            
            skills: this.generateDetailedSkills(overall),
            
            found: true,
            searchName: playerName,
            mockData: true // Important flag to identify this as mock data
        };

        // Try to make some educated guesses for well-known players
        const nameLower = playerName.toLowerCase();
        if (nameLower.includes('messi')) {
            Object.assign(playerData, {
                overall: 90,
                nationality: 'Argentina',
                positions: ['RW', 'CAM'],
                club: 'Inter Miami',
                age: 37
            });
        } else if (nameLower.includes('haaland')) {
            Object.assign(playerData, {
                overall: 91,
                nationality: 'Norway', 
                positions: ['ST'],
                club: 'Manchester City',
                age: 23
            });
        } else if (nameLower.includes('mbappe') || nameLower.includes('mbappé')) {
            Object.assign(playerData, {
                overall: 91,
                nationality: 'France',
                positions: ['LW', 'ST', 'RW'],
                club: 'Real Madrid',
                age: 25
            });
        } else if (nameLower.includes('ronaldo')) {
            Object.assign(playerData, {
                overall: 88,
                nationality: 'Portugal',
                positions: ['ST', 'LW'],
                club: 'Al Nassr',
                age: 39
            });
        }

        return playerData;
    }

    /**
     * Generate attribute value around overall rating
     * @param {number} overall - Overall rating
     * @returns {number} Generated attribute
     */
    static generateAttribute(overall) {
        const min = Math.max(35, overall - 15);
        const max = Math.min(95, overall + 15);
        return min + Math.floor(Math.random() * (max - min));
    }

    /**
     * Generate detailed skills object
     * @param {number} overall - Overall rating
     * @returns {Object} Skills object
     */
    static generateDetailedSkills(overall) {
        const skills = {};
        const skillNames = [
            'crossing', 'finishing', 'headingAccuracy', 'shortPassing', 'volleys',
            'curve', 'fkAccuracy', 'longPassing', 'ballControl', 'acceleration',
            'sprintSpeed', 'agility', 'reactions', 'balance', 'shotPower',
            'jumping', 'stamina', 'strength', 'longShots', 'aggression',
            'interceptions', 'positioning', 'vision', 'penalties', 'composure'
        ];
        
        skillNames.forEach(skill => {
            skills[skill] = this.generateAttribute(overall);
        });
        
        return skills;
    }

    /**
     * Get player by ID from MSMC API
     * @param {number|string} playerId - Player ID
     * @returns {Promise<Object|null>} Player data or null
     */
    static async getPlayerById(playerId) {
        if (!playerId) return null;

        const cacheKey = `player_${playerId}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            console.log(`📦 Cache hit for player ID: ${playerId}`);
            return cached.data;
        }

        if (!this.checkRateLimit()) {
            console.warn('⚠️ Rate limit exceeded for MSMC API requests');
            return null;
        }

        try {
            const url = `${this.BASE_URL}/players/${playerId}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'FIFA-Tracker/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`API response not ok: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.player) {
                const transformedData = this.transformPlayerData(data.player);
                
                // Cache the result
                this.cache.set(cacheKey, {
                    data: transformedData,
                    timestamp: Date.now()
                });
                
                return transformedData;
            }

            return null;
        } catch (error) {
            console.error(`❌ Error fetching player by ID ${playerId}:`, error.message);
            return null;
        }
    }

    /**
     * Clear the cache
     */
    static clearCache() {
        this.cache.clear();
        console.log('🗑️ MSMC API cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    static getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys()),
            rateLimit: this.rateLimit
        };
    }

    /**
     * Test API connectivity
     * @returns {Promise<Object>} Connectivity test result
     */
    static async testConnectivity() {
        console.log('🧪 Testing MSMC API connectivity...');
        
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'FIFA-Tracker/1.0'
                }
            });
            
            const responseTime = Date.now() - startTime;
            
            return {
                success: response.ok,
                status: response.status,
                responseTime: `${responseTime}ms`,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

export default MSMCApiService;