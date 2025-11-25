
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
            'oaxaca': { lat: 17.0732, lng: -96.7266, radius: '50km' },
            'ciudad de mexico': { lat: 19.4326, lng: -99.1332, radius: '50km' },
            'cdmx': { lat: 19.4326, lng: -99.1332, radius: '50km' },
            'mexico city': { lat: 19.4326, lng: -99.1332, radius: '50km' },
            'guadalajara': { lat: 20.6597, lng: -103.3496, radius: '50km' },
            'monterrey': { lat: 25.6866, lng: -100.3161, radius: '50km' },
            'puebla': { lat: 19.0414, lng: -98.2063, radius: '50km' },
            
            // Países
            'china': { lat: 35.8617, lng: 104.1954, radius: '1000km' },
            'estados unidos': { lat: 37.0902, lng: -95.7129, radius: '1000km' },
            'usa': { lat: 37.0902, lng: -95.7129, radius: '1000km' },
            'españa': { lat: 40.4637, lng: -3.7492, radius: '500km' },
            'japón': { lat: 36.2048, lng: 138.2529, radius: '500km' },
            'japon': { lat: 36.2048, lng: 138.2529, radius: '500km' }, // Sin acento
            'argentina': { lat: -38.4161, lng: -63.6167, radius: '1000km' },
            'brasil': { lat: -14.2350, lng: -51.9253, radius: '1000km' }
        };

        const normalizedLocation = locationName.toLowerCase().trim();
        return locations[normalizedLocation] || locations['oaxaca'];
    }

    async searchVideos(location, searchQuery = '', maxResults = 10) {
        try {
            console.log(🎬 Buscando: "${location}" - "${searchQuery}");

            const hasValidAPIKey = this.apiKey && this.apiKey !== 'tu_api_key_de_youtube_aqui';
            
            if (!hasValidAPIKey) {
                console.log('📹 Usando datos de ejemplo (Falta API Key)');
                return this.getMockVideos(location, searchQuery, maxResults);
            }

            console.log('🔑 Usando API Key real de YouTube');
            const locationCoords = this.getLocationCoordinates(location);
            
            // === AQUÍ ESTÁ EL CAMBIO CLAVE PARA LA BÚSQUEDA ===
            // Si hay algo escrito, buscamos SOLO eso (ej: "Yoga"). 
            // Si no hay nada escrito, buscamos algo genérico ("vlog") + el lugar para rellenar.
            // NO concatenamos el lugar si ya hay búsqueda, porque eso ensucia los resultados.
            let q = searchQuery ? searchQuery : vlog ${location};

            const params = {
                part: 'snippet',
                type: 'video',
                maxResults: maxResults,
                key: this.apiKey,
                q: q,
                // El filtro real lo hacen estas coordenadas:
                location: ${locationCoords.lat},${locationCoords.lng},
                locationRadius: locationCoords.radius
            };

            const response = await axios.get(${this.baseURL}/search, { 
                params,
                timeout: 10000
            });
            
            if (response.data.items && response.data.items.length > 0) {
                console.log(✅ Encontrados ${response.data.items.length} videos reales);
                return this.formatVideos(response.data.items);
            } else {
                return this.getMockVideos(location, searchQuery, maxResults);
            }
        } catch (error) {
            console.error('❌ Error en búsqueda:', error.message);
            return this.getMockVideos(location, searchQuery, maxResults);
        }
    }

    // Agregué este método porque Reproduccion.html lo necesita para cargar un solo video
    async getVideoDetails(videoId) {
         try {
            if (!this.apiKey) return null;
            const response = await axios.get(${this.baseURL}/videos, {
                params: { part: 'snippet,statistics', id: videoId, key: this.apiKey }
            });
            if (response.data.items && response.data.items.length > 0) {
                const video = response.data.items[0];
                return {
                    id: video.id,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    channelTitle: video.snippet.channelTitle,
                    channelId: video.snippet.channelId,
                    publishedAt: video.snippet.publishedAt,
                    thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium.url,
                    viewCount: video.statistics.viewCount,
                    likeCount: video.statistics.likeCount
                };
            }
            return null;
         } catch (error) { return null; }
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
        console.log(🎭 Generando ${maxResults} videos de ejemplo);
        const baseVideos = [
            {
                id: 'tUrVwCBPUpY',
                title: Video Demo en ${location}: ${searchQuery || 'General'},
                description: Descripción de prueba para ${location},
                channelTitle: Canal ${location},
                publishedAt: new Date().toISOString(),
                thumbnail: https://via.placeholder.com/320x180/ff6b6b/white?text=${encodeURIComponent(location)},
                viewCount: '15420', likeCount: '843'
            }
        ];
        // Rellenar hasta maxResults
        while (baseVideos.length < maxResults) {
            baseVideos.push({
                ...baseVideos[0],
                id: 'demo_' + Math.random().toString(36).substr(2, 9),
                title: Video Demo #${baseVideos.length + 1}
            });
        }
        return baseVideos.slice(0, maxResults);
    }
}

module.exports = new YouTubeController();
