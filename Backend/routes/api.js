const express = require('express');
const router = express.Router();

// Almacenamiento en memoria (en producción usarías una base de datos)
let userSessions = {};
let pageComments = [];

// Ruta de prueba del API
router.get('/test', (req, res) => {
    res.json({ 
        message: '✅ API de VideITO funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Middleware para manejar sesiones simples
const getSession = (req) => {
    const sessionId = req.query.sessionId || 'default';
    if (!userSessions[sessionId]) {
        userSessions[sessionId] = {
            currentRegion: 'oaxaca',
            searchHistory: [],
            watchHistory: []
        };
    }
    return { sessionId, session: userSessions[sessionId] };
};

// Ruta para buscar videos por ubicación - CORREGIDA
router.get('/videos', async (req, res) => {
    try {
        const { session } = getSession(req);
        let { location = session.currentRegion, search = '', maxResults = 10 } = req.query;
        
        // Actualizar región en sesión
        if (location && location !== session.currentRegion) {
            session.currentRegion = location;
        }
        
        console.log(`🔍 Solicitando videos: ubicación=${location}, búsqueda=${search}, región actual=${session.currentRegion}`);
        
        const youtubeController = require('../controllers/youtubeController');
        const videos = await youtubeController.searchVideos(location, search, parseInt(maxResults));

        // Guardar en historial de búsquedas si hay término de búsqueda
        if (search) {
            session.searchHistory.unshift({
                query: search,
                location: location,
                timestamp: new Date().toISOString()
            });
            // Mantener solo las últimas 10 búsquedas
            session.searchHistory = session.searchHistory.slice(0, 10);
        }

        res.json({
            success: true,
            currentRegion: session.currentRegion,
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

// Ruta para obtener información de un video específico
router.get('/video-info', async (req, res) => {
    try {
        const { v: videoId, sessionId } = req.query;
        
        if (!videoId) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere el ID del video'
            });
        }

        // Buscar información del video
        const youtubeController = require('../controllers/youtubeController');
        const videos = await youtubeController.searchVideos('global', '', 1);
        const video = videos[0] || {};

        // Agregar al historial de visualización
        if (sessionId && userSessions[sessionId]) {
            userSessions[sessionId].watchHistory.unshift({
                id: videoId,
                title: video.title || 'Video de YouTube',
                channel: video.channelTitle || 'Canal de YouTube',
                watchedAt: new Date().toISOString(),
                thumbnail: video.thumbnail || ''
            });
            // Mantener solo los últimos 20 videos vistos
            userSessions[sessionId].watchHistory = userSessions[sessionId].watchHistory.slice(0, 20);
        }

        res.json({
            success: true,
            video: {
                id: videoId,
                title: video.title || 'Video de YouTube',
                description: video.description || 'Descripción no disponible',
                channelTitle: video.channelTitle || 'Canal de YouTube',
                publishedAt: video.publishedAt || new Date().toISOString(),
                viewCount: video.viewCount || '15000',
                likeCount: video.likeCount || '500',
                thumbnail: video.thumbnail || ''
            }
        });

    } catch (error) {
        console.error('Error en /video-info:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para obtener historial ACTUALIZADA
router.get('/history', (req, res) => {
    const { session } = getSession(req);
    
    res.json({
        searches: session.searchHistory || [],
        videos: session.watchHistory || []
    });
});

// Ruta para comentarios de la página
router.get('/comments', (req, res) => {
    res.json({
        success: true,
        comments: pageComments
    });
});

router.post('/comments', (req, res) => {
    try {
        const { name, comment } = req.body;
        
        if (!name || !comment) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y comentario son requeridos'
            });
        }

        const newComment = {
            id: Date.now().toString(),
            name: name,
            comment: comment,
            timestamp: new Date().toISOString(),
            likes: 0
        };

        pageComments.unshift(newComment);
        
        res.json({
            success: true,
            comment: newComment
        });
    } catch (error) {
        console.error('Error en /comments:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para obtener región actual
router.get('/current-region', (req, res) => {
    const { session } = getSession(req);
    res.json({
        success: true,
        region: session.currentRegion
    });
});

module.exports = router;
