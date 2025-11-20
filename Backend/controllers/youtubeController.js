const axios = require('axios');

class YouTubeController {
    constructor() {
        this.apiKey = process.env.YOUTUBE_API_KEY;
        this.baseURL = 'https://www.googleapis.com/youtube/v3';
        console.log('🎬 Controlador de YouTube inicializado');
    }

    // Función auxiliar para quitar acentos
    normalizeString(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    getLocationCoordinates(locationName) {
        // Base de datos de coordenadas
        const locations = {
            // México
            'oaxaca': { lat: 17.0732, lng: -96.7266, radius: '50km' },
            'ciudad de mexico': { lat: 19.4326, lng: -99.1332, radius: '50km' },
            'cdmx': { lat: 19.4326, lng: -99.1332, radius: '50km' },
            'puebla': { lat: 19.0414, lng: -98.2063, radius: '50km' },
            'monterrey': { lat: 25.6866, lng: -100.3161, radius: '50km' },
            'guadalajara': { lat: 20.6597, lng: -103.3496, radius: '50km' },
            
            // Internacional (con y sin acentos)
            'japon': { lat: 36.2048, lng: 138.2529, radius: '500km' },
            'tokio': { lat: 35.6762, lng: 139.6503, radius: '100km' },
            'españa': { lat: 40.4637, lng: -3.7492, radius: '500km' },
            'madrid': { lat: 40.4168, lng: -3.7038, radius: '100km' },
            'usa': { lat: 37.0902, lng: -95.7129, radius: '1000km' },
            'estados unidos': { lat: 37.0902, lng: -95.7129, radius: '1000km' },
            'china': { lat: 35.8617, lng: 104.1954, radius: '1000km' },
            'argentina': { lat: -38.4161, lng: -63.6167, radius: '1000km' },
            'brasil': { lat: -14.2350, lng: -51.9253, radius: '1000km' },
            'colombia': { lat: 4.5709, lng: -74.2973, radius: '500km' }
        };

        // Normalizamos la entrada (quitamos acentos y minúsculas)
        const cleanName = this.normalizeString(locationName);
        
        // Buscamos la coincidencia o devolvemos Oaxaca por defecto
        if (locations[cleanName]) {
            return locations[cleanName];
        } else {
            console.log(`⚠️ Ubicación '${locationName}' no encontrada, usando OAXACA por defecto.`);
            return locations['oaxaca'];
        }
    }

    async searchVideos(location, searchQuery = '', maxResults = 10) {
        try {
            const locationCoords = this.getLocationCoordinates(location);
            console.log(`📍 Buscando en: ${location} (Lat: ${locationCoords.lat}, Lng: ${locationCoords.lng})`);

            // Construcción inteligente de la query
            // Si hay búsqueda de texto, usamos eso. Si no, usamos "vlog" o "travel" para que salgan cosas interesantes
            let q = searchQuery;
            if (!q) q = "vlog travel daily"; 

            const params = {
                part: 'snippet',
                type: 'video',
                maxResults: maxResults,
                key: this.apiKey,
                q: q, // NO agregamos el nombre de la ubicación al texto, ya filtramos por GPS abajo
                location: `${locationCoords.lat},${locationCoords.lng}`,
                locationRadius: locationCoords.radius
            };

            // Si no hay API Key, lanzamos error para usar el Mock Data del frontend
            if (!this.apiKey || this.apiKey === 'tu_api_key_de_youtube_aqui') {
                throw new Error('No API Key configurada');
            }

            const response = await axios.get(`${this.baseURL}/search`, { params });
            
            if (response.data.items) {
                return this.formatVideos(response.data.items);
            }
            return [];

        } catch (error) {
            console.error('❌ Error backend:', error.message);
            // Retornamos array vacío para que el Frontend use sus datos Demo
            return []; 
        }
    }

    async getVideoDetails(videoId) {
         try {
            if (!this.apiKey) throw new Error('No API Key');

            const response = await axios.get(`${this.baseURL}/videos`, {
                params: {
                    part: 'snippet,statistics',
                    id: videoId,
                    key: this.apiKey
                }
            });

            if (response.data.items && response.data.items.length > 0) {
                const video = response.data.items[0];
                return {
                    id: video.id,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    channelTitle: video.snippet.channelTitle,
                    channelId: video.snippet.channelId, // Importante para suscripciones
                    publishedAt: video.snippet.publishedAt,
                    thumbnail: video.snippet.thumbnails.high ? video.snippet.thumbnails.high.url : video.snippet.thumbnails.medium.url,
                    viewCount: video.statistics.viewCount,
                    likeCount: video.statistics.likeCount,
                    subscriberCount: '1M' // YouTube API search no da esto fácil, lo simulamos
                };
            }
            return null;
         } catch (error) {
             console.error('Error detalles video:', error.message);
             return null;
         }
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
