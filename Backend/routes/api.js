const express = require('express');
const router = express.Router();
// Asegúrate de que la ruta al controller sea correcta
const youtubeController = require('../controllers/youtubeController');

// Ruta de búsqueda
router.get('/videos', async (req, res) => {
    try {
        const { location, search } = req.query;
        // Llamamos al controlador
        const videos = await youtubeController.searchVideos(location, search);
        // IMPORTANTE: Enviamos el array de videos directamente o dentro de un objeto
        // Para asegurar compatibilidad, lo enviamos como objeto { videos: [...] }
        res.json({ videos: videos }); 
    } catch (error) {
        console.error("Error en ruta /videos:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta de detalles de un video (para Reproduccion.html)
router.get('/video-info', async (req, res) => {
    try {
        const { v } = req.query;
        if (!v) return res.status(400).json({ error: 'Falta ID de video' });

        const video = await youtubeController.getVideoDetails(v);
        if (video) {
            res.json({ success: true, video });
        } else {
            res.status(404).json({ success: false, error: 'Video no encontrado' });
        }
    } catch (error) {
        console.error("Error en ruta /video-info:", error);
        res.status(500).json({ error: 'Error al obtener detalles' });
    }
});

module.exports = router;
