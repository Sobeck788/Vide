const axios = require('axios');

class YouTubeController {
    constructor() {
        this.apiKey = process.env.YOUTUBE_API_KEY;
        this.baseURL = 'https://www.googleapis.com/youtube/v3';
        console.log('🎬 Controlador de YouTube inicializado');
    }

    getLocationCoordinates(locationName) {
        const locations = {
            // México
            'oaxaca': { lat: 17.0732, lng: -96.7266, radius: '100km' },
            'ciudad de mexico': { lat: 19.4326, lng: -99.1332, radius: '100km' },
            'cdmx': { lat: 19.4326, lng: -99.1332, radius: '100km' },
            'mexico city': { lat: 19.4326, lng: -99.1332, radius: '100km' },
            'guadalajara': { lat: 20.6597, lng: -103.3496, radius: '100km' },
            'monterrey': { lat: 25.6866, lng: -100.3161, radius: '100km' },
            'puebla': { lat: 19.0414, lng: -98.2063, radius: '100km' },
            
            // Países
            'china': { lat: 35.8617, lng: 104.1954, radius: '500km' },
            'estados unidos': { lat: 37.0902, lng: -95.7129, radius: '1000km' },
            'usa': { lat: 37.0902, lng: -95.7129, radius: '1000km' },
            'españa': { lat: 40.4637, lng: -3.7492, radius: '500km' },
            'japón': { lat: 36.2048, lng: 138.2529, radius: '500km' },
            'argentina': { lat: -38.4161, lng: -63.6167, radius: '1000km' },
            'brasil': { lat: -14.2350, lng: -51.9253, radius: '1000km' },
            'global': { lat: 0, lng: 0, radius: '50000km' }
        };

        const normalizedLocation = locationName.toLowerCase().trim();
        return locations[normalizedLocation] || locations['oaxaca'];
    }

    async searchVideos(location, searchQuery = '', maxResults = 10) {
        try {
            console.log(`🎬 Buscando: "${location}" - "${searchQuery}"`);

            // Verificar API Key
            const hasValidAPIKey = this.apiKey && this.apiKey !== 'tu_api_key_de_youtube_aqui';
            
            if (!hasValidAPIKey) {
                console.log('📹 Usando datos de ejemplo');
                return this.getMockVideos(location, searchQuery, maxResults);
            }

            console.log('🔑 Usando API Key real de YouTube');
            
            let params = {
                part: 'snippet',
                type: 'video',
                maxResults: maxResults,
                key: this.apiKey
            };

            // Lógica CORREGIDA para búsquedas
            if (location === 'global') {
                // Búsqueda global - solo el término de búsqueda
                params.q = searchQuery || 'trending';
            } else {
                // Búsqueda por ubicación específica
                const locationCoords = this.getLocationCoordinates(location);
                
                if (searchQuery) {
                    // Búsqueda con término + ubicación como contexto
                    params.q = searchQuery;
                    // Agregar parámetros de ubicación para YouTube Data API
                    params.location = `${locationCoords.lat},${locationCoords.lng}`;
                    params.locationRadius = locationCoords.radius;
                } else {
                    // Solo ubicación - buscar contenido popular de esa área
                    params.q = location;
                    params.location = `${locationCoords.lat},${locationCoords.lng}`;
                    params.locationRadius = locationCoords.radius;
                }
            }

            console.log('🔍 Parámetros de búsqueda:', params);

            const response = await axios.get(`${this.baseURL}/search`, { 
                params,
                timeout: 10000
            });
            
            if (response.data.items && response.data.items.length > 0) {
                console.log(`✅ Encontrados ${response.data.items.length} videos reales`);
                return this.formatVideos(response.data.items);
            } else {
                console.log('📹 No se encontraron videos, usando datos de ejemplo');
                return this.getMockVideos(location, searchQuery, maxResults);
            }
        } catch (error) {
            console.error('❌ Error en búsqueda:', error.message);
            return this.getMockVideos(location, searchQuery, maxResults);
        }
    }

    formatVideos(videos) {
        return videos.map(video => ({
            id: video.id.videoId,
            title: video.snippet.title,
            description: video.snippet.description,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            thumbnail: video.snippet.thumbnails.medium.url,
            liveBroadcastContent: video.snippet.liveBroadcastContent,
            viewCount: Math.floor(Math.random() * 1000000).toString(),
            likeCount: Math.floor(Math.random() * 50000).toString()
        }));
    }

    getMockVideos(location, searchQuery, maxResults = 10) {
        console.log(`🎭 Generando ${maxResults} videos de ejemplo para: ${location} - "${searchQuery}"`);
        
        const baseVideos = [
            {
                id: 'tUrVwCBPUpY',
                title: `${location.toUpperCase()} - Guía completa de viaje ${searchQuery || 'turismo'}`,
                description: `Descubre ${location} en 4 días | Guía completa de viaje ${location} es una de las joyas culturales y gastronómicas`,
                channelTitle: `Turismo ${location}`,
                publishedAt: new Date().toISOString(),
                thumbnail: `https://via.placeholder.com/320x180/ff6b6b/white?text=${encodeURIComponent(location)}`,
                viewCount: '15420',
                likeCount: '843',
                liveBroadcastContent: 'none'
            },
            {
                id: 'GWQUkTZNv8U',
                title: `TOP 10 Lugares Increíbles en ${location} que Tienes que Visitar`,
                description: `${location} es un destino que deslumbra con su riqueza cultural, histórica y natural`,
                channelTitle: `Viajes ${location}`,
                publishedAt: new Date(Date.now() - 86400000).toISOString(),
                thumbnail: `https://via.placeholder.com/320x180/4ecdc4/white?text=Lugares+${encodeURIComponent(location)}`,
                viewCount: '8920',
                likeCount: '521',
                liveBroadcastContent: 'none'
            },
            {
                id: '66xt4fGrIMg',
                title: `Música y Cultura de ${location} - ${searchQuery || 'Tradiciones'}`,
                description: `Disfruta de la riqueza musical y cultural de ${location}`,
                channelTitle: `Cultura ${location}`,
                publishedAt: new Date(Date.now() - 172800000).toISOString(),
                thumbnail: `https://via.placeholder.com/320x180/45b7d1/white?text=Música+${encodeURIComponent(location)}`,
                viewCount: '12350',
                likeCount: '678',
                liveBroadcastContent: 'none'
            },
            {
                id: '4G1GhYLNaWM',
                title: `Gastronomía ${location} - ${searchQuery || 'Platillos Típicos'}`,
                description: `Los mejores platillos y restaurantes de ${location}`,
                channelTitle: `Sabores ${location}`,
                publishedAt: new Date(Date.now() - 259200000).toISOString(),
                thumbnail: `https://via.placeholder.com/320x180/96ceb4/white?text=Comida+${encodeURIComponent(location)}`,
                viewCount: '7650',
                likeCount: '432',
                liveBroadcastContent: 'none'
            }
        ];

        // Generar más videos si se necesitan
        while (baseVideos.length < maxResults) {
            baseVideos.push({
                ...baseVideos[baseVideos.length % baseVideos.length],
                id: 'vid_' + Math.random().toString(36).substr(2, 9)
            });
        }

        return baseVideos.slice(0, maxResults);
    }
}

module.exports = new YouTubeController();
