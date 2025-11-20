const axios = require('axios');

class YouTubeController {
    constructor() {
        this.apiKey = process.env.YOUTUBE_API_KEY;
        this.baseURL = 'https://www.googleapis.com/youtube/v3';
        console.log('🎬 Controlador de YouTube inicializado');
    }

    normalizeString(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    getLocationData(locationName) {
        const locations = {
            // México (Español - MX)
            'oaxaca': { lat: 17.0732, lng: -96.7266, radius: '50km', lang: 'es', region: 'MX' },
            'ciudad de mexico': { lat: 19.4326, lng: -99.1332, radius: '50km', lang: 'es', region: 'MX' },
            'cdmx': { lat: 19.4326, lng: -99.1332, radius: '50km', lang: 'es', region: 'MX' },
            'puebla': { lat: 19.0414, lng: -98.2063, radius: '50km', lang: 'es', region: 'MX' },
            'monterrey': { lat: 25.6866, lng: -100.3161, radius: '50km', lang: 'es', region: 'MX' },
            'guadalajara': { lat: 20.6597, lng: -103.3496, radius: '50km', lang: 'es', region: 'MX' },
            
            // Asia
            'japon': { lat: 36.2048, lng: 138.2529, radius: '500km', lang: 'ja', region: 'JP' },
            'tokio': { lat: 35.6762, lng: 139.6503, radius: '50km', lang: 'ja', region: 'JP' },
            'china': { lat: 35.8617, lng: 104.1954, radius: '1000km', lang: 'zh', region: 'CN' },

            // Europa / USA / Suramérica
            'españa': { lat: 40.4637, lng: -3.7492, radius: '500km', lang: 'es', region: 'ES' },
            'usa': { lat: 37.0902, lng: -95.7129, radius: '1000km', lang: 'en', region: 'US' },
            'argentina': { lat: -38.4161, lng: -63.6167, radius: '1000km', lang: 'es', region: 'AR' },
            'brasil': { lat: -14.2350, lng: -51.9253, radius: '1000km', lang: 'pt', region: 'BR' }
        };

        const cleanName = this.normalizeString(locationName);
        return locations[cleanName] || locations['oaxaca'];
    }

    async searchVideos(locationInput, searchQuery = '', maxResults = 10) {
        try {
            const locData = this.getLocationData(locationInput);
            console.log(`📍 Buscando en: ${locationInput} (Lang: ${locData.lang})`);

            // ESTRATEGIA HÍBRIDA:
            // 1. Si hay búsqueda ("Yoga"), buscamos "Yoga Oaxaca" para forzar relevancia textual.
            // 2. Si no hay búsqueda, buscamos "vlog Oaxaca" para ver contenido local general.
            let q = searchQuery 
                ? `${searchQuery} ${locationInput}` 
                : `vlog travel ${locationInput}`;

            const params = {
                part: 'snippet',
                type: 'video',
                maxResults: maxResults,
                key: this.apiKey,
                q: q,
                relevanceLanguage: locData.lang, // Prioriza el idioma local (ej: Japonés para Japón)
                regionCode: locData.region,      // Prioriza resultados de esa región
                // Opcional: Location filter (a veces es muy restrictivo, lo mantenemos por si acaso)
                location: `${locData.lat},${locData.lng}`,
                locationRadius: locData.radius
            };

            if (!this.apiKey || this.apiKey === 'tu_api_key_de_youtube_aqui') throw new Error('No API Key');

            const response = await axios.get(`${this.baseURL}/search`, { params });
            
            if (response.data.items) return this.formatVideos(response.data.items);
            return [];

        } catch (error) {
            console.error('❌ Error backend:', error.message);
            return []; 
        }
    }

    async getVideoDetails(videoId) {
         try {
            if (!this.apiKey) throw new Error('No API Key');
            const response = await axios.get(`${this.baseURL}/videos`, {
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
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            thumbnail: video.snippet.thumbnails.medium.url
        }));
    }
}

module.exports = new YouTubeController();
