import axios from 'axios';
import config from '../config/env.js';
import logger from '../config/logger.js';

const evolutionAPI = axios.create({
  baseURL: config.EVOLUTION_API_URL,
  headers: {
    'apikey': config.EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for logging
evolutionAPI.interceptors.request.use(
  (config) => {
    logger.debug('Evolution API Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
    });
    return config;
  },
  (error) => {
    logger.error('Evolution API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
evolutionAPI.interceptors.response.use(
  (response) => {
    logger.debug('Evolution API Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    logger.error('Evolution API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);

// Instance management
export async function createInstance(instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    const response = await evolutionAPI.post('/instance/create', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });

    logger.info('Instance created:', { instanceName });
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      logger.info('Instance already exists:', { instanceName });
      return await getInstanceStatus(instanceName);
    }
    throw error;
  }
}

export async function getInstanceStatus(instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    const response = await evolutionAPI.get(`/instance/connectionState/${instanceName}`);
    return response.data;
  } catch (error) {
    logger.error('Error getting instance status:', error);
    throw error;
  }
}

export async function connectInstance(instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    const response = await evolutionAPI.get(`/instance/connect/${instanceName}`);
    logger.info('Instance connection initiated:', { instanceName });
    return response.data;
  } catch (error) {
    logger.error('Error connecting instance:', error);
    throw error;
  }
}

export async function disconnectInstance(instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    const response = await evolutionAPI.delete(`/instance/logout/${instanceName}`);
    logger.info('Instance disconnected:', { instanceName });
    return response.data;
  } catch (error) {
    logger.error('Error disconnecting instance:', error);
    throw error;
  }
}

// Message operations
export async function sendTextMessage(to, message, instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    // Format phone number (remove + and spaces)
    const formattedPhone = to.replace(/[^\d]/g, '');

    const response = await evolutionAPI.post(`/message/sendText/${instanceName}`, {
      number: formattedPhone,
      text: message,
      delay: 1000,
    });

    logger.info('Text message sent:', { to: formattedPhone, instanceName });
    return response.data;
  } catch (error) {
    logger.error('Error sending text message:', error);
    throw error;
  }
}

export async function sendMediaMessage(to, mediaUrl, caption, instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    const formattedPhone = to.replace(/[^\d]/g, '');

    const response = await evolutionAPI.post(`/message/sendMedia/${instanceName}`, {
      number: formattedPhone,
      mediatype: 'image',
      media: mediaUrl,
      caption: caption || '',
      delay: 1000,
    });

    logger.info('Media message sent:', { to: formattedPhone, instanceName });
    return response.data;
  } catch (error) {
    logger.error('Error sending media message:', error);
    throw error;
  }
}

export async function checkWhatsAppNumber(phone, instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    const formattedPhone = phone.replace(/[^\d]/g, '');

    const response = await evolutionAPI.post(`/chat/whatsappNumbers/${instanceName}`, {
      numbers: [formattedPhone],
    });

    logger.debug('WhatsApp number checked:', { phone: formattedPhone });
    return response.data;
  } catch (error) {
    logger.error('Error checking WhatsApp number:', error);
    throw error;
  }
}

// Chat operations
export async function getAllChats(instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    const response = await evolutionAPI.get(`/chat/findChats/${instanceName}`);
    return response.data;
  } catch (error) {
    logger.error('Error getting chats:', error);
    throw error;
  }
}

export async function getChatMessages(chatId, instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    const response = await evolutionAPI.get(`/chat/findMessages/${instanceName}`, {
      params: { id: chatId },
    });
    return response.data;
  } catch (error) {
    logger.error('Error getting chat messages:', error);
    throw error;
  }
}

// Profile operations
export async function getProfilePicture(phone, instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    const formattedPhone = phone.replace(/[^\d]/g, '');

    const response = await evolutionAPI.post(`/chat/getProfilePicUrl/${instanceName}`, {
      number: formattedPhone,
    });

    return response.data;
  } catch (error) {
    logger.error('Error getting profile picture:', error);
    return null;
  }
}

// Webhook configuration
export async function setWebhook(webhookUrl, events = [], instanceName = config.EVOLUTION_INSTANCE_NAME) {
  try {
    const response = await evolutionAPI.post(`/webhook/set/${instanceName}`, {
      url: webhookUrl,
      webhook_by_events: true,
      webhook_base64: false,
      events: events.length > 0 ? events : [
        'QRCODE_UPDATED',
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'SEND_MESSAGE',
        'CONNECTION_UPDATE',
      ],
    });

    logger.info('Webhook configured:', { instanceName, webhookUrl });
    return response.data;
  } catch (error) {
    logger.error('Error setting webhook:', error);
    throw error;
  }
}

// Health check
export async function checkHealth() {
  try {
    const response = await axios.get(`${config.EVOLUTION_API_URL}`);
    return response.data;
  } catch (error) {
    logger.error('Evolution API health check failed:', error);
    return null;
  }
}

export default {
  createInstance,
  getInstanceStatus,
  connectInstance,
  disconnectInstance,
  sendTextMessage,
  sendMediaMessage,
  checkWhatsAppNumber,
  getAllChats,
  getChatMessages,
  getProfilePicture,
  setWebhook,
  checkHealth,
};
