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
            'puebla': { lat: 19.0414, lng: -98.2063, radius: '50km' },
            'monterrey': { lat: 25.6866, lng: -100.3161, radius: '50km' },
            'guadalajara': { lat: 20.6597, lng: -103.3496, radius: '50km' },
            
            // Mundo
            'japon': { lat: 36.2048, lng: 138.2529, radius: '500km' },
            'tokio': { lat: 35.6762, lng: 139.6503, radius: '100km' },
            'china': { lat: 35.8617, lng: 104.1954, radius: '1000km' },
            'españa': { lat: 40.4637, lng: -3.7492, radius: '500km' },
            'usa': { lat: 37.0902, lng: -95.7129, radius: '1000km' },
            'argentina': { lat: -38.4161, lng: -63.6167, radius: '1000km' },
            'brasil': { lat: -14.2350, lng: -51.9253, radius: '1000km' }
        };

        const normalizedLocation = locationName.toLowerCase().trim();
        return locations[normalizedLocation] || locations['oaxaca'];
    }

    async searchVideos(location, searchQuery = '', maxResults = 10) {
        try {
            console.log(🎬 Buscando: "${location}" - "${searchQuery}");

            // Validación de API Key
            if (!this.apiKey || this.apiKey === 'tu_api_key_de_youtube_aqui') {
                console.log('⚠️ Sin API Key: Enviando Mock Data');
                return this.getMockVideos(location, searchQuery, maxResults);
            }

            const locationCoords = this.getLocationCoordinates(location);
            
            // Estrategia de búsqueda limpia
            let q = searchQuery ? searchQuery : vlog ${location};

            const params = {
                part: 'snippet',
                type: 'video',
                maxResults: maxResults,
                key: this.apiKey,
                q: q,
                location: ${locationCoords.lat},${locationCoords.lng},
                locationRadius: locationCoords.radius
            };

            const response = await axios.get(${this.baseURL}/search, { params });
            
            if (response.data.items && response.data.items.length > 0) {
                return this.formatVideos(response.data.items);
            }
            // Si YouTube no devuelve nada, mandamos Mocks en lugar de vacío
            return this.getMockVideos(location, searchQuery, maxResults);

        } catch (error) {
            console.error('❌ Error Controller:', error.message);
            // En caso de error, SIEMPRE devolvemos array (Mocks) para no romper el front
            return this.getMockVideos(location, searchQuery, maxResults);
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
            thumbnail: video.snippet.thumbnails.medium.url,
            viewCount: '1M', // Placeholder si search no da vistas
            likeCount: '50K'
        }));
    }

    getMockVideos(location, searchQuery, maxResults = 10) {
        const mocks = [];
        for(let i=0; i<maxResults; i++) {
            mocks.push({
                id: demo_${i},
                title: Video Demo ${location} ${searchQuery} #${i+1},
                description: "Este es un video de prueba.",
                channelTitle: Canal ${location},
                publishedAt: new Date().toISOString(),
                thumbnail: https://picsum.photos/seed/${location}${i}/320/180,
                viewCount: '1000', likeCount: '100'
            });
        }
        return mocks;
    }
}

module.exports = new YouTubeController();
