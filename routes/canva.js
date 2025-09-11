const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');

// Canva API Configuration
const CANVA_CONFIG = {
  API_BASE_URL: process.env.CANVA_API_BASE_URL || 'https://api.canva.com',
  CLIENT_ID: process.env.CANVA_CLIENT_ID || '',
  CLIENT_SECRET: process.env.CANVA_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.CANVA_REDIRECT_URI || 'http://localhost:3000/canva/callback',
};

// Get Canva access token (OAuth flow)
async function getCanvaAccessToken(userId) {
  try {
    // This would implement the OAuth flow to get Canva access token
    // For now, return a mock token
    return `mock_canva_token_${userId}`;
  } catch (error) {
    console.error('Failed to get Canva access token:', error);
    throw error;
  }
}

// POST /api/canva/designs/create
router.post('/designs/create', auth, async (req, res) => {
  try {
    const { templateId, userId } = req.body;
    const user = req.user;
    
    // Check user plan
    if (user.plan === 'Free') {
      return res.status(403).json({ 
        message: 'Canva access requires Premium or Ultra-Premium plan' 
      });
    }
    
    // Get Canva access token
    const accessToken = await getCanvaAccessToken(userId);
    
    // Create design in Canva
    const canvaResponse = await axios.post(
      `${CANVA_CONFIG.API_BASE_URL}/v1/designs`,
      {
        template_id: templateId,
        brand_kit_id: null, // Will be applied later if available
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    const designData = canvaResponse.data;
    
    res.json({
      success: true,
      design: {
        id: designData.id,
        templateId: templateId,
        status: designData.status,
        editUrl: designData.edit_url,
        previewUrl: designData.preview_url,
      }
    });
    
  } catch (error) {
    console.error('Failed to create Canva design:', error);
    res.status(500).json({ 
      message: 'Failed to create design',
      error: error.message 
    });
  }
});

// POST /api/canva/designs/export
router.post('/designs/export', auth, async (req, res) => {
  try {
    const { designId, format, userId } = req.body;
    const user = req.user;
    
    // Check user plan for PDF export
    if (format === 'PDF' && user.plan !== 'Ultra-Premium') {
      return res.status(403).json({ 
        message: 'PDF export requires Ultra-Premium plan' 
      });
    }
    
    // Get Canva access token
    const accessToken = await getCanvaAccessToken(userId);
    
    // Export design from Canva
    const canvaResponse = await axios.post(
      `${CANVA_CONFIG.API_BASE_URL}/v1/designs/${designId}/export`,
      {
        format: format.toLowerCase(),
        quality: 'high',
        size: 'original',
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    const exportData = canvaResponse.data;
    
    res.json({
      success: true,
      export: {
        id: exportData.id,
        status: exportData.status,
        downloadUrl: exportData.download_url,
        expiresAt: exportData.expires_at,
      }
    });
    
  } catch (error) {
    console.error('Failed to export Canva design:', error);
    res.status(500).json({ 
      message: 'Failed to export design',
      error: error.message 
    });
  }
});

// POST /api/canva/designs/brand-kit
router.post('/designs/brand-kit', auth, async (req, res) => {
  try {
    const { designId, brandKitId, userId } = req.body;
    const user = req.user;
    
    // Check user plan
    if (user.plan === 'Free') {
      return res.status(403).json({ 
        message: 'Brand kit access requires Premium or Ultra-Premium plan' 
      });
    }
    
    // Get Canva access token
    const accessToken = await getCanvaAccessToken(userId);
    
    // Apply brand kit to design
    const canvaResponse = await axios.post(
      `${CANVA_CONFIG.API_BASE_URL}/v1/designs/${designId}/brand-kit`,
      {
        brand_kit_id: brandKitId,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    res.json({
      success: true,
      message: 'Brand kit applied successfully',
      designId: designId,
      brandKitId: brandKitId,
    });
    
  } catch (error) {
    console.error('Failed to apply brand kit:', error);
    res.status(500).json({ 
      message: 'Failed to apply brand kit',
      error: error.message 
    });
  }
});

// GET /api/canva/templates
router.get('/templates', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Check user plan
    if (user.plan === 'Free') {
      return res.status(403).json({ 
        message: 'Template access requires Premium or Ultra-Premium plan' 
      });
    }
    
    // Get Canva access token
    const accessToken = await getCanvaAccessToken(user.id);
    
    // Fetch templates from Canva
    const canvaResponse = await axios.get(
      `${CANVA_CONFIG.API_BASE_URL}/v1/templates`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          category: 'real-estate',
          limit: 50,
        }
      }
    );
    
    const templates = canvaResponse.data.templates.map(template => ({
      id: template.id,
      name: template.name,
      type: template.type,
      thumbnail: template.thumbnail_url,
      category: template.category,
      description: template.description,
      canvaTemplateId: template.id,
    }));
    
    res.json({
      success: true,
      templates: templates,
    });
    
  } catch (error) {
    console.error('Failed to fetch Canva templates:', error);
    res.status(500).json({ 
      message: 'Failed to fetch templates',
      error: error.message 
    });
  }
});

// GET /api/canva/brand-kits
router.get('/brand-kits', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Check user plan
    if (user.plan === 'Free') {
      return res.status(403).json({ 
        message: 'Brand kit access requires Premium or Ultra-Premium plan' 
      });
    }
    
    // Get Canva access token
    const accessToken = await getCanvaAccessToken(user.id);
    
    // Fetch brand kits from Canva
    const canvaResponse = await axios.get(
      `${CANVA_CONFIG.API_BASE_URL}/v1/brand-kits`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );
    
    const brandKits = canvaResponse.data.brand_kits.map(kit => ({
      id: kit.id,
      name: kit.name,
      logo: kit.logo_url,
      colors: kit.colors,
      fonts: kit.fonts,
    }));
    
    res.json({
      success: true,
      brandKits: brandKits,
    });
    
  } catch (error) {
    console.error('Failed to fetch Canva brand kits:', error);
    res.status(500).json({ 
      message: 'Failed to fetch brand kits',
      error: error.message 
    });
  }
});

// POST /api/canva/auth/callback
router.post('/auth/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      `${CANVA_CONFIG.API_BASE_URL}/oauth/token`,
      {
        grant_type: 'authorization_code',
        client_id: CANVA_CONFIG.CLIENT_ID,
        client_secret: CANVA_CONFIG.CLIENT_SECRET,
        code: code,
        redirect_uri: CANVA_CONFIG.REDIRECT_URI,
      }
    );
    
    const tokenData = tokenResponse.data;
    
    // Store tokens securely (in production, use secure storage)
    // For now, return the tokens
    res.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    });
    
  } catch (error) {
    console.error('Failed to complete OAuth flow:', error);
    res.status(500).json({ 
      message: 'Failed to complete authentication',
      error: error.message 
    });
  }
});

// GET /api/canva/auth/url
router.get('/auth/url', auth, (req, res) => {
  try {
    const user = req.user;
    
    // Check user plan
    if (user.plan === 'Free') {
      return res.status(403).json({ 
        message: 'Canva access requires Premium or Ultra-Premium plan' 
      });
    }
    
    // Generate OAuth URL
    const authUrl = `${CANVA_CONFIG.API_BASE_URL}/oauth/authorize?` +
      `client_id=${CANVA_CONFIG.CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(CANVA_CONFIG.REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=designs:read designs:write brand_kit:read brand_kit:write&` +
      `state=${user.id}`;
    
    res.json({
      success: true,
      authUrl: authUrl,
    });
    
  } catch (error) {
    console.error('Failed to generate auth URL:', error);
    res.status(500).json({ 
      message: 'Failed to generate auth URL',
      error: error.message 
    });
  }
});

module.exports = router;
