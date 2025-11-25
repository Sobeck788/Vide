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
            'oaxaca': { lat: 17.0732, lng: -96.7266, radius: '100km', defaultSearch: 'Guelaguetza' },
            'ciudad de mexico': { lat: 19.4326, lng: -99.1332, radius: '100km', defaultSearch: 'Zócalo' },
            'cdmx': { lat: 19.4326, lng: -99.1332, radius: '100km', defaultSearch: 'Museo Soumaya' },
            'mexico city': { lat: 19.4326, lng: -99.1332, radius: '100km', defaultSearch: 'Reforma' },
            'guadalajara': { lat: 20.6597, lng: -103.3496, radius: '100km', defaultSearch: 'Mariachi' },
            'monterrey': { lat: 25.6866, lng: -100.3161, radius: '100km', defaultSearch: 'Cerro de la Silla' },
            'puebla': { lat: 19.0414, lng: -98.2063, radius: '100km', defaultSearch: 'Talavera' },
            
            // Países
            'china': { lat: 35.8617, lng: 104.1954, radius: '500km', defaultSearch: 'Great Wall' },
            'estados unidos': { lat: 37.0902, lng: -95.7129, radius: '1000km', defaultSearch: 'National Parks' },
            'usa': { lat: 37.0902, lng: -95.7129, radius: '1000km', defaultSearch: 'Tech News' },
            'españa': { lat: 40.4637, lng: -3.7492, radius: '500km', defaultSearch: 'Tapas' },
            'japón': { lat: 36.2048, lng: 138.2529, radius: '500km', defaultSearch: 'Tokyo Travel' },
            'argentina': { lat: -38.4161, lng: -63.6167, radius: '1000km', defaultSearch: 'Tango' },
            'brasil': { lat: -14.2350, lng: -51.9253, radius: '1000km', defaultSearch: 'Carnaval' },
            'global': { lat: 0, lng: 0, radius: '10000km', defaultSearch: 'Tendencias' } // Global para /video-info
        };

        const normalizedLocation = locationName.toLowerCase().trim();
        // Devuelve la ubicación si existe, si no, usa Oaxaca.
        return locations[normalizedLocation] || locations['oaxaca'];
    }

    async searchVideos(location, searchQuery = '', maxResults = 10) {
        try {
            console.log(🎬 Buscando: "${location}" - "${searchQuery}");

            // 1. Usar datos de prueba si la API Key no está configurada.
            const hasValidAPIKey = this.apiKey && this.apiKey !== 'tu_api_key_de_youtube_aqui';
            
            if (!hasValidAPIKey) {
                console.log('📹 Usando datos de ejemplo (API Key no válida o ausente)');
                return this.getMockVideos(location, searchQuery, maxResults);
            }

            console.log('🔑 Usando API Key real de YouTube');
            const locationData = this.getLocationCoordinates(location);
            
            const params = {
                part: 'snippet',
                type: 'video',
                maxResults: maxResults,
                key: this.apiKey,
                // Si hay búsqueda, usa el query. Si no, usa el tema por defecto de la región.
                q: searchQuery || locationData.defaultSearch
            };

            // Solo usar parámetros de ubicación geográfica si no es la búsqueda 'global'
            if (location.toLowerCase() !== 'global') {
                params.location = ${locationData.lat},${locationData.lng};
                params.locationRadius = locationData.radius;
                // Si no hay búsqueda específica, solo buscamos por la ubicación.
                if (!searchQuery) {
                    // Para evitar mezclar regiones, hacemos la búsqueda más específica con el nombre de la locación.
                    params.q = ${locationData.defaultSearch} ${location}; 
                }
            } else {
                // Si es global y no hay búsqueda, buscar algo de tendencia general
                if (!searchQuery) params.q = 'tendencias hoy';
            }


            const response = await axios.get(${this.baseURL}/search, {  
                params,
                timeout: 15000 // Tiempo de espera aumentado a 15s
            });
            
            // 2. Si la API devolvió resultados, devolverlos.
            if (response.data.items && response.data.items.length > 0) {
                console.log(✅ Encontrados ${response.data.items.length} videos reales);
                return this.formatVideos(response.data.items);
            } else {
                 // 3. Si la API devolvió cero resultados, usar datos de prueba.
                console.log('⚠️ API devolvió cero resultados. Usando datos de ejemplo.');
                return this.getMockVideos(location, searchQuery, maxResults);
            }
        } catch (error) {
            // 4. Si la API falló (ej. error 403, 500, timeout), usar datos de prueba.
            console.error('❌ Error en búsqueda (usando mock data):', error.message);
            return this.getMockVideos(location, searchQuery, maxResults);
        }
    }

    // NUEVO MÉTODO para obtener detalles de un video específico por ID
    async getVideoDetails(videoId) {
        const hasValidAPIKey = this.apiKey && this.apiKey !== 'tu_api_key_de_youtube_aqui';
        if (!hasValidAPIKey) {
            console.log('📹 Usando datos de ejemplo para detalles de video');
            // Devuelve un objeto de video de prueba
            return {
                id: videoId,
                title: 'Detalles de Video de Prueba (Offline)',
                description: 'Esta es la descripción del video de prueba. Los detalles completos no están disponibles sin una API Key válida.',
                channelTitle: 'Canal de Pruebas',
                publishedAt: new Date().toISOString(),
                viewCount: '99999',
                likeCount: '4999',
                thumbnail: 'https://via.placeholder.com/320x180/7B76F4/white?text=Detalle+Prueba'
            };
        }

        try {
            const response = await axios.get(${this.baseURL}/videos, {
                params: {
                    part: 'snippet,statistics',
                    id: videoId,
                    key: this.apiKey
                }
            });

            const item = response.data.items[0];

            if (item) {
                return {
                    id: item.id,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    channelTitle: item.snippet.channelTitle,
                    publishedAt: item.snippet.publishedAt,
                    viewCount: item.statistics?.viewCount || 'N/A',
                    likeCount: item.statistics?.likeCount || 'N/A',
                    thumbnail: item.snippet.thumbnails.medium.url,
                    liveBroadcastContent: item.snippet.liveBroadcastContent || 'none'
                };
            }
            throw new Error('Video no encontrado en YouTube');

        } catch (error) {
            console.error(❌ Error al obtener detalles del video ${videoId}:, error.message);
            // Fallback en caso de error de API
            return {
                id: videoId,
                title: 'Error al Cargar Video',
                description: 'No fue posible obtener la información real del video. Verifica tu API Key o la disponibilidad de YouTube.',
                channelTitle: 'VideITO',
                publishedAt: new Date().toISOString(),
                viewCount: '0',
                likeCount: '0',
                thumbnail: 'https://via.placeholder.com/320x180/FF0000/white?text=ERROR+API'
            };
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
            // Los campos statistics solo vienen en la ruta /videos, no en /search.
            // Los llenamos con valores aleatorios o nulos para que el Frontend no falle.
            viewCount: video.statistics?.viewCount || Math.floor(Math.random() * 1000000).toString(),
            likeCount: video.statistics?.likeCount || Math.floor(Math.random() * 50000).toString()
        }));
    }

    getMockVideos(location, searchQuery, maxResults = 10) {
        console.log(🎭 Generando ${maxResults} videos de ejemplo para: ${location} - "${searchQuery}");
        
        const safeLocation = location.charAt(0).toUpperCase() + location.slice(1); // Capitaliza

        const baseVideos = [
            {
                id: 'tUrVwCBPUpY',
                title: ${safeLocation} de Juárez en 4 días: guía de viaje completa 🇲🇽🫔🌽 - ${searchQuery || safeLocation},
                description: Descubre ${safeLocation} en 4 días | Guía completa de viaje.,
                channelTitle: Turismo ${safeLocation},
                publishedAt: new Date().toISOString(),
                thumbnail: https://via.placeholder.com/320x180/ff6b6b/white?text=${encodeURIComponent(safeLocation)},
                viewCount: '15420',
                likeCount: '843',
                liveBroadcastContent: 'none'
            },
            {
                id: 'GWQUkTZNv8U',
                title: TOP 10 Lugares Increíbles en ${safeLocation} que Tienes que Visitar,
                description: ${safeLocation} es un destino que deslumbra con su riqueza cultural, histórica y natural.,
                channelTitle: Viajes ${safeLocation},
                publishedAt: new Date(Date.now() - 86400000).toISOString(),
                thumbnail: https://via.placeholder.com/320x180/4ecdc4/white?text=Lugares+${encodeURIComponent(safeLocation)},
                viewCount: '8920',
                likeCount: '521',
                liveBroadcastContent: 'none'
            },
            {
                id: '66xt4fGrIMg',
                title: Música y Cultura de ${safeLocation} - ${searchQuery || 'Tradiciones'},
                description: Disfruta de la riqueza musical y cultural de ${safeLocation}.,
                channelTitle: Cultura ${safeLocation},
                publishedAt: new Date(Date.now() - 172800000).toISOString(),
                thumbnail: https://via.placeholder.com/320x180/45b7d1/white?text=Música+${encodeURIComponent(safeLocation)},
                viewCount: '12350',
                likeCount: '678',
                liveBroadcastContent: 'none'
            },
            {
                id: '4G1GhYLNaWM',
                title: Gastronomía ${safeLocation} - ${searchQuery || 'Platillos Típicos'},
                description: Los mejores platillos y restaurantes de ${safeLocation}.,
                channelTitle: Sabores ${safeLocation},
                publishedAt: new Date(Date.now() - 259200000).toISOString(),
                thumbnail: https://via.placeholder.com/320x180/96ceb4/white?text=Comida+${encodeURIComponent(safeLocation)},
                viewCount: '7650',
                likeCount: '432',
                liveBroadcastContent: 'none'
            }
        ];

        // Generar más videos si se necesitan, rotando el ID para que no parezca repetido.
        const mockVideos = [...baseVideos];
        while (mockVideos.length < maxResults) {
            const index = mockVideos.length % baseVideos.length;
            mockVideos.push({
                ...baseVideos[index],
                id: 'mock_' + Math.random().toString(36).substr(2, 9), // Nuevo ID aleatorio
                title: baseVideos[index].title + ' (extra)',
                thumbnail: baseVideos[index].thumbnail.replace('320x180', '320x181') // Ligeramente diferente para evitar cache
            });
        }

        return mockVideos.slice(0, maxResults);
    }
}

module.exports = new YouTubeController();
