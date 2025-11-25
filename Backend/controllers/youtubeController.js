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

    getLocationCoordinates(locationName) {
        const locations = {
            // México
            'oaxaca': { lat: 17.0732, lng: -96.7266, radius: '50km' },
            'ciudad de mexico': { lat: 19.4326, lng: -99.1332, radius: '50km' },
            'cdmx': { lat: 19.4326, lng: -99.1332, radius: '50km' },
            'puebla': { lat: 19.0414, lng: -98.2063, radius: '50km' },
            'monterrey': { lat: 25.6866, lng: -100.3161, radius: '50km' },
            'guadalajara': { lat: 20.6597, lng: -103.3496, radius: '50km' },
            
            // Internacional
            'japon': { lat: 36.2048, lng: 138.2529, radius: '500km' },
            'tokio': { lat: 35.6762, lng: 139.6503, radius: '100km' },
            'china': { lat: 35.8617, lng: 104.1954, radius: '1000km' },
            'españa': { lat: 40.4637, lng: -3.7492, radius: '500km' },
            'usa': { lat: 37.0902, lng: -95.7129, radius: '1000km' },
            'argentina': { lat: -38.4161, lng: -63.6167, radius: '1000km' },
            'brasil': { lat: -14.2350, lng: -51.9253, radius: '1000km' }
        };

        const cleanName = this.normalizeString(locationName);
        return locations[cleanName] || locations['oaxaca'];
    }

    async searchVideos(location, searchQuery = '', maxResults = 10) {
        try {
            // Si no hay API Key, usamos Mock Data (esto es normal si no la has puesto en Render)
            if (!this.apiKey || this.apiKey.includes('tu_api_key')) {
                console.log("⚠️ Backend: Sin API Key, usando datos falsos.");
                return this.getMockVideos(location, searchQuery, maxResults);
            }

            const locData = this.getLocationCoordinates(location);
            console.log(📍 Buscando GPS: ${location} [${locData.lat}, ${locData.lng}]);

            // CORRECCIÓN: NO mezclamos el nombre del lugar en el texto 'q'.
            // Usamos solo el tema buscado o "vlog" si está vacío.
            let q = searchQuery || "vlog daily life"; 

            const params = {
                part: 'snippet',
                type: 'video',
                maxResults: maxResults,
                key: this.apiKey,
                q: q, 
                location: ${locData.lat},${locData.lng},
                locationRadius: locData.radius
            };

            const response = await axios.get(${this.baseURL}/search, { params });
            
            if (response.data.items && response.data.items.length > 0) {
                return this.formatVideos(response.data.items);
            }
            // Si YouTube no encuentra nada real, mandamos mocks para que no salga vacío
            return this.getMockVideos(location, searchQuery, maxResults);

        } catch (error) {
            console.error('❌ Error backend:', error.message);
            return this.getMockVideos(location, searchQuery, maxResults);
        }
    }

    async getVideoDetails(videoId) {
         try {
            if (!this.apiKey || this.apiKey.includes('tu_api_key')) return null;
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

    // Función de respaldo para cuando falla la API o no hay Key
    getMockVideos(location, query, count) {
        const mocks = [];
        for(let i=0; i<count; i++) {
            mocks.push({
                id: demo_${location}_${i},
                title: Video Demo en ${location} ${query} #${i+1},
                description: "Este es un video de prueba porque no hay API Key.",
                channelTitle: Canal ${location},
                publishedAt: new Date().toISOString(),
                thumbnail: https://picsum.photos/seed/${location}${i}/320/180,
                viewCount: '1000',
                likeCount: '50'
            });
        }
        return mocks;
    }
}

module.exports = new YouTubeController();
