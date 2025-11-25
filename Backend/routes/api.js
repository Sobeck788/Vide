const express = require('express');
const router = express.Router();

// Ruta de prueba del API
router.get('/test', (req, res) => {
    res.json({ 
        message: '✅ API de VideITO funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Ruta para buscar videos por ubicación
router.get('/videos', async (req, res) => {
    try {
        const { location = 'Oaxaca', search = '', maxResults = 10 } = req.query;
        console.log(🔍 Solicitando videos: ubicación=${location}, búsqueda=${search});
        
        const youtubeController = require('../controllers/youtubeController');
        // La llamada al controlador se mantiene igual para respetar tu estructura
        const videos = await youtubeController.searchVideos(location, search, parseInt(maxResults));

        res.json({
            success: true,
            location: location,
            searchQuery: search,
            videos: videos,
            count: videos.length
        });
    } catch (error) {
        console.error('❌ Error en API /videos:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para obtener información de un video específico (ACTUALIZADA)
router.get('/video-info', async (req, res) => {
    try {
        const { v: videoId } = req.query;
        
        if (!videoId) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere el ID del video'
            });
        }

        // Obtener detalles reales del video usando el nuevo método del Controller
        const youtubeController = require('../controllers/youtubeController');
        const video = await youtubeController.getVideoDetails(videoId);

        res.json({
            success: true,
            video: video
        });

    } catch (error) {
        console.error('Error en /video-info:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para obtener historial (simulado)
router.get('/history', (req, res) => {
    const mockHistory = {
        searches: ['Dios nunca muere', 'Oaxaca música', 'Guelaguetza', 'Gastronomía oaxaqueña'],
        videos: [
            {
                id: 'dQw4w9WgXcQ',
                title: 'The Phantom of the Opera Directo desde el Macedonio Alcalá',
                channel: 'The Shows Must Go On!',
                watchedAt: new Date().toISOString(),
                thumbnail: 'https://via.placeholder.com/320x180/ff6b6b/white?text=Teatro+Oaxaca'
            },
            {
                id: 'dQw4w9WgXcR', 
                title: 'Banda de Música - Guelaguetza 2023',
                channel: 'Cultura Oaxaca',
                watchedAt: new Date(Date.now() - 86400000).toISOString(),
                thumbnail: 'https://via.placeholder.com/320x180/4ecdc4/white?text=Guelaguetza'
            }
        ]
    };

    res.json(mockHistory);
});

module.exports = router;
