const axios = require('axios');

class YouTubeController {
    constructor() {
        this.apiKey = process.env.YOUTUBE_API_KEY;
        this.baseURL = 'https://www.googleapis.com/youtube/v3';
    }

    // Limpiar texto (quitar acentos)
    normalizeString(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    getLocationCoordinates(locationName) {
        const locations = {
            // México
            'oaxaca': { lat: 17.0732, lng: -96.7266, radius: '50km', lang: 'es', region: 'MX' },
            'ciudad de mexico': { lat: 19.4326, lng: -99.1332, radius: '50km', lang: 'es', region: 'MX' },
            'cdmx': { lat: 19.4326, lng: -99.1332, radius: '50km', lang: 'es', region: 'MX' },
            'puebla': { lat: 19.0414, lng: -98.2063, radius: '50km', lang: 'es', region: 'MX' },
            'monterrey': { lat: 25.6866, lng: -100.3161, radius: '50km', lang: 'es', region: 'MX' },
            'guadalajara': { lat: 20.6597, lng: -103.3496, radius: '50km', lang: 'es', region: 'MX' },
            
            // Mundo
            'japon': { lat: 36.2048, lng: 138.2529, radius: '500km', lang: 'ja', region: 'JP' },
            'tokio': { lat: 35.6762, lng: 139.6503, radius: '100km', lang: 'ja', region: 'JP' },
            'china': { lat: 35.8617, lng: 104.1954, radius: '1000km', lang: 'zh', region: 'CN' },
            'españa': { lat: 40.4637, lng: -3.7492, radius: '500km', lang: 'es', region: 'ES' },
            'usa': { lat: 37.0902, lng: -95.7129, radius: '1000km', lang: 'en', region: 'US' },
            'argentina': { lat: -38.4161, lng: -63.6167, radius: '1000km', lang: 'es', region: 'AR' },
            'brasil': { lat: -14.2350, lng: -51.9253, radius: '1000km', lang: 'pt', region: 'BR' }
        };

        const cleanName = this.normalizeString(locationName);
        // Si no encuentra la ciudad, usa Oaxaca por defecto
        return locations[cleanName] || locations['oaxaca'];
    }

    async searchVideos(location, searchQuery = '', maxResults = 10) {
        try {
            // Validación estricta de API Key
            if (!this.apiKey || this.apiKey === 'tu_api_key_de_youtube_aqui') {
                console.log("⚠️ Backend: Sin API Key, enviando respuesta vacía para activar Modo Demo.");
                return []; 
            }

            const locData = this.getLocationCoordinates(location);
            console.log(📍 Backend buscando en: ${location} [${locData.lat}, ${locData.lng}]);

            // Estrategia: Usamos la query solo para el tema, y forzamos la ubicación con GPS
            let q = searchQuery || "vlog travel"; 

            const params = {
                part: 'snippet',
                type: 'video',
                maxResults: maxResults,
                key: this.apiKey,
                q: q, 
                location: ${locData.lat},${locData.lng},
                locationRadius: locData.radius,
                relevanceLanguage: locData.lang // Ayuda a filtrar por idioma
            };

            const response = await axios.get(${this.baseURL}/search, { params });
            
            if (response.data.items) {
                return this.formatVideos(response.data.items);
            }
            return [];

        } catch (error) {
            console.error('❌ Error backend:', error.message);
            return []; 
        }
    }

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
            thumbnail: video.snippet.thumbnails.medium.url
        }));
    }
}

module.exports = new YouTubeController();
