import axios from 'axios';
import config from '../config/env.js';
import logger from '../config/logger.js';

class EvolutionService {
  constructor() {
    this.baseURL = config.EVOLUTION_API_URL || 'http://localhost:8080';
    this.apiKey = config.EVOLUTION_API_KEY;

    // Cliente axios configurado
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Log da configuração ao inicializar
    logger.info('🔧 EvolutionService inicializado', {
      baseURL: this.baseURL,
      apiKeyConfigured: !!this.apiKey,
      apiKeyPrefix: this.apiKey?.substring(0, 10)
    });
  }

  /**
   * Normaliza o nome de um contato para exibição
   * Prioriza pushName > nome formatado do número > remoteJid
   * @param {Object} contact - Objeto de contato/chat da Evolution API
   * @returns {string} Nome normalizado
   */
  normalizeContactName(contact) {
    // 1. Usar pushName se disponível (nome que o contato salvou no WhatsApp)
    if (contact.pushName && contact.pushName.trim()) {
      return contact.pushName.trim();
    }

    // 2. Usar name se disponível
    if (contact.name && contact.name.trim()) {
      return contact.name.trim();
    }

    // 3. Identificar grupos
    const jid = contact.remoteJid || contact.id || '';
    if (jid.includes('@g.us')) {
      return contact.subject || 'Grupo sem nome';
    }

    // 4. Formatar número de telefone
    const phone = jid.replace(/@s\.whatsapp\.net$/, '').replace(/@.*$/, '');

    // Formatar número brasileiro (+55 XX XXXXX-XXXX)
    if (phone.startsWith('55') && phone.length === 13) {
      const ddd = phone.substring(2, 4);
      const firstPart = phone.substring(4, 9);
      const secondPart = phone.substring(9, 13);
      return `+55 ${ddd} ${firstPart}-${secondPart}`;
    }

    // Outros países ou números não padronizados
    if (phone.length > 10) {
      return `+${phone}`;
    }

    // Fallback
    return phone || jid;
  }

  /**
   * PASSO 1: Criar instância
   * POST /instance/create
   */
  async createInstance(instanceName, options = {}) {
    logger.info('=== CRIAR INSTÂNCIA EVOLUTION API ===');
    logger.info('Timestamp:', new Date().toISOString());
    logger.info('Instance Name:', instanceName);
    logger.info('URL:', `${this.baseURL}/instance/create`);
    logger.info('API Key (primeiros 10):', this.apiKey?.substring(0, 10));

    try {
      const payload = {
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        ...options
      };

      logger.info('Payload:', JSON.stringify(payload, null, 2));

      const response = await this.client.post('/instance/create', payload);

      logger.info('✅ Instância criada:', response.data);

      return {
        success: true,
        data: response.data,
        instanceName: response.data.instance?.instanceName || instanceName
      };

    } catch (error) {
      logger.error('❌ Erro ao criar instância:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });

      throw {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * PASSO 2: Gerar QR Code
   * GET /instance/connect/{instanceName}
   */
  async generateQRCode(instanceName) {
    logger.info('=== GERAR QR CODE ===');
    logger.info('Instance Name:', instanceName);
    logger.info('URL:', `${this.baseURL}/instance/connect/${instanceName}`);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);
      const response = await this.client.get(`/instance/connect/${encodedInstanceName}`);

      logger.info('✅ QR Code Response:', {
        hasCode: !!response.data.code,
        hasPairingCode: !!response.data.pairingCode,
        count: response.data.count,
        dataKeys: Object.keys(response.data)
      });

      // Validar se o QR Code foi gerado
      if (!response.data.code && !response.data.pairingCode && response.data.count === 0) {
        logger.warn('⚠️ QR Code ainda não disponível (count: 0)');
        return {
          success: false,
          message: 'QR Code ainda não foi gerado',
          count: response.data.count,
          needsRetry: true
        };
      }

      if (!response.data.code || response.data.code === '') {
        throw new Error('QR Code vazio retornado pela Evolution API');
      }

      return {
        success: true,
        qrCode: response.data.code, // Base64 do QR Code
        pairingCode: response.data.pairingCode,
        count: response.data.count
      };

    } catch (error) {
      logger.error('❌ Erro ao gerar QR Code:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Se for erro 404, a instância não existe
      if (error.response?.status === 404) {
        throw {
          success: false,
          error: 'Instância não encontrada',
          status: 404
        };
      }

      throw {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Aguardar QR Code com retry logic
   * Tenta obter o QR Code várias vezes com intervalo
   */
  async waitForQRCode(instanceName, maxAttempts = 10, delayMs = 3000) {
    logger.info('⏳ Aguardando QR Code ser gerado...', { instanceName, maxAttempts, delayMs });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info(`📡 Tentativa ${attempt}/${maxAttempts} para obter QR Code de "${instanceName}"`);

        const result = await this.generateQRCode(instanceName);

        if (result.success && result.qrCode) {
          logger.info('✅ QR Code gerado com sucesso!', {
            instanceName,
            attempt,
            codeLength: result.qrCode?.length || 0
          });
          return result;
        }

        // Se não estiver pronto e não for a última tentativa, aguarda
        if (attempt < maxAttempts) {
          logger.info(`⏸️  QR Code ainda não disponível, aguardando ${delayMs}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

      } catch (error) {
        logger.error(`❌ Erro na tentativa ${attempt}:`, {
          message: error.message,
          status: error.status
        });

        // Se for 404, não adianta tentar novamente
        if (error.status === 404) {
          throw error;
        }

        if (attempt < maxAttempts) {
          logger.info(`🔄 Aguardando ${delayMs}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // Se chegou aqui, não conseguiu gerar o QR Code
    logger.warn('⚠️ QR Code não foi gerado no tempo esperado', { instanceName, maxAttempts, totalTime: maxAttempts * delayMs });
    return {
      success: false,
      message: 'QR Code não foi gerado no tempo esperado',
      needsRetry: true
    };
  }

  /**
   * PASSO 3: Verificar status da conexão
   * GET /instance/connectionState/{instanceName}
   */
  async getConnectionState(instanceName) {
    logger.info('=== VERIFICAR STATUS ===');
    logger.info('Instance Name:', instanceName);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);
      const response = await this.client.get(`/instance/connectionState/${encodedInstanceName}`);

      logger.info('✅ Status obtido:', response.data);

      return {
        success: true,
        state: response.data.state,
        status: response.data
      };

    } catch (error) {
      logger.error('❌ Erro ao verificar status:', error.message);

      return {
        success: false,
        state: 'close',
        error: error.message
      };
    }
  }

  /**
   * Buscar todas as instâncias
   * GET /instance/fetchInstances
   */
  async fetchInstances() {
    logger.info('=== BUSCAR INSTÂNCIAS ===');

    try {
      const response = await this.client.get('/instance/fetchInstances');

      logger.info('✅ Instâncias encontradas:', response.data?.length || 0);

      return {
        success: true,
        instances: response.data || []
      };

    } catch (error) {
      logger.error('❌ Erro ao buscar instâncias:', error.message);

      return {
        success: false,
        instances: [],
        error: error.message
      };
    }
  }

  /**
   * Deletar instância
   * DELETE /instance/delete/{instanceName}
   */
  async deleteInstance(instanceName) {
    logger.info('=== DELETAR INSTÂNCIA ===');
    logger.info('Instance Name:', instanceName);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);
      const response = await this.client.delete(`/instance/delete/${encodedInstanceName}`);

      logger.info('✅ Instância deletada:', response.data);

      return {
        success: true,
        message: 'Instância deletada com sucesso'
      };

    } catch (error) {
      logger.error('❌ Erro ao deletar instância:', error.message);

      throw {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Desconectar instância
   * DELETE /instance/logout/{instanceName}
   */
  async disconnectInstance(instanceName) {
    logger.info('=== DESCONECTAR INSTÂNCIA ===');
    logger.info('Instance Name:', instanceName);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);
      const response = await this.client.delete(`/instance/logout/${encodedInstanceName}`);

      logger.info('✅ Instância desconectada:', response.data);

      return {
        success: true,
        message: 'Instância desconectada com sucesso'
      };

    } catch (error) {
      logger.error('❌ Erro ao desconectar instância:', error.message);

      throw {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Configurar webhook
   * POST /webhook/set/{instanceName}
   */
  async setWebhook(webhookUrl, events = [], instanceName) {
    logger.info('=== CONFIGURAR WEBHOOK ===');
    logger.info('Instance Name:', instanceName);
    logger.info('Webhook URL:', webhookUrl);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);
      const payload = {
        webhook: {
          enabled: true,
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
        }
      };

      const response = await this.client.post(`/webhook/set/${encodedInstanceName}`, payload);

      logger.info('✅ Webhook configurado:', response.data);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error('❌ Erro ao configurar webhook:', error.message);

      throw {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Enviar mensagem de texto
   * POST /message/sendText/{instanceName}
   */
  async sendTextMessage(instanceName, number, text) {
    logger.info('=== ENVIAR MENSAGEM DE TEXTO ===');
    logger.info('Instance:', instanceName);
    logger.info('Number:', number);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);
      const payload = {
        number: number,
        text: text
      };

      const response = await this.client.post(`/message/sendText/${encodedInstanceName}`, payload);

      logger.info('✅ Mensagem enviada:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('❌ Erro ao enviar mensagem:', error.message);
      throw {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Enviar mídia (imagem, vídeo, áudio, documento)
   * POST /message/sendMedia/{instanceName}
   */
  async sendMediaMessage(instanceName, number, mediaUrl, caption = '', mediaType = 'image') {
    logger.info('=== ENVIAR MENSAGEM DE MÍDIA ===');
    logger.info('Instance:', instanceName);
    logger.info('Number:', number);
    logger.info('Media Type:', mediaType);
    logger.info('Media URL:', mediaUrl);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);
      const payload = {
        number: number,
        mediatype: mediaType,
        media: mediaUrl,
        caption: caption || ''
      };

      const response = await this.client.post(`/message/sendMedia/${encodedInstanceName}`, payload);

      logger.info('✅ Mídia enviada:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('❌ Erro ao enviar mídia:', error.message);
      throw {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Enviar áudio/voice (PTT - Push To Talk)
   * POST /message/sendWhatsAppAudio/{instanceName}
   */
  async sendAudioMessage(instanceName, number, audioUrl, isVoice = true) {
    logger.info('=== ENVIAR MENSAGEM DE ÁUDIO ===');
    logger.info('Instance:', instanceName);
    logger.info('Number:', number);
    logger.info('Audio URL:', audioUrl);
    logger.info('Is Voice (PTT):', isVoice);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);
      const payload = {
        number: number,
        audio: audioUrl,
        encoding: true, // Encode to opus
        ptt: isVoice // Push to talk (voice message)
      };

      const response = await this.client.post(`/message/sendWhatsAppAudio/${encodedInstanceName}`, payload);

      logger.info('✅ Áudio enviado:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('❌ Erro ao enviar áudio:', error.message);
      throw {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Enviar sticker (figurinha)
   * POST /message/sendSticker/{instanceName}
   */
  async sendStickerMessage(instanceName, number, stickerUrl) {
    logger.info('=== ENVIAR STICKER ===');
    logger.info('Instance:', instanceName);
    logger.info('Number:', number);
    logger.info('Sticker URL:', stickerUrl);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);
      const payload = {
        number: number,
        sticker: stickerUrl
      };

      const response = await this.client.post(`/message/sendSticker/${encodedInstanceName}`, payload);

      logger.info('✅ Sticker enviado:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('❌ Erro ao enviar sticker:', error.message);
      throw {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Enviar contato
   * POST /message/sendContact/{instanceName}
   */
  async sendContactMessage(instanceName, number, contactData) {
    logger.info('=== ENVIAR CONTATO ===');
    logger.info('Instance:', instanceName);
    logger.info('Number:', number);
    logger.info('Contact:', contactData.fullName);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);

      // Format: [{ fullName, wuid, phoneNumber, organization }]
      const payload = {
        number: number,
        contact: Array.isArray(contactData) ? contactData : [contactData]
      };

      const response = await this.client.post(`/message/sendContact/${encodedInstanceName}`, payload);

      logger.info('✅ Contato enviado:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('❌ Erro ao enviar contato:', error.message);
      throw {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Buscar contatos da instância
   * POST /chat/findContacts/{instanceName}
   */
  async fetchContacts(instanceName) {
    logger.info('=== BUSCAR CONTATOS ===');
    logger.info('Instance Name:', instanceName);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);

      // Evolution API v2 requires POST with optional where clause
      const response = await this.client.post(`/chat/findContacts/${encodedInstanceName}`, {
        where: {} // Empty where to get all contacts
      });

      logger.info('✅ Contatos brutos encontrados:', response.data?.length || 0);

      // Log first contact structure for debugging
      if (response.data && response.data.length > 0) {
        logger.info('📋 Exemplo de contato bruto (primeiro item):', JSON.stringify(response.data[0], null, 2));
      }

      // Processar e normalizar contatos
      const contactMap = new Map(); // Usar Map para remover duplicatas por ID

      for (const rawContact of response.data || []) {
        const contactId = rawContact.id || rawContact.remoteJid;

        // Pular se não tiver identificador
        if (!contactId) continue;

        // Pular grupos (processar apenas contatos individuais)
        if (contactId.includes('@g.us')) continue;

        // Normalizar nome do contato
        const normalizedName = this.normalizeContactName(rawContact);

        // Extrair telefone limpo
        const phone = contactId.replace(/@s\.whatsapp\.net$/, '').replace(/@.*$/, '');

        // Normalizar contato
        const normalizedContact = {
          id: contactId,
          remoteJid: contactId,
          name: normalizedName,
          pushName: rawContact.pushName || null,
          phone: phone,
          profilePicUrl: rawContact.profilePicUrl || null,
          // Dados brutos para referência
          _raw: rawContact
        };

        // Usar ID como chave única para evitar duplicatas
        contactMap.set(contactId, normalizedContact);
      }

      // Converter Map para Array e ordenar por nome
      const normalizedContacts = Array.from(contactMap.values())
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      logger.info('✅ Contatos normalizados:', normalizedContacts.length);
      logger.info('📊 Duplicatas/grupos removidos:', (response.data?.length || 0) - normalizedContacts.length);

      // Log exemplo de contato normalizado
      if (normalizedContacts.length > 0) {
        logger.info('📋 Exemplo de contato normalizado:', JSON.stringify(normalizedContacts[0], null, 2));
      }

      return {
        success: true,
        contacts: normalizedContacts
      };
    } catch (error) {
      logger.error('❌ Erro ao buscar contatos:', error.message);
      logger.error('Response:', error.response?.data);
      return {
        success: false,
        contacts: [],
        error: error.message
      };
    }
  }

  /**
   * Buscar conversas/chats da instância
   * POST /chat/findChats/{instanceName}
   */
  async fetchChats(instanceName) {
    logger.info('=== BUSCAR CHATS ===');
    logger.info('Instance Name:', instanceName);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);

      // Evolution API v2 requires POST with optional where clause
      const response = await this.client.post(`/chat/findChats/${encodedInstanceName}`, {
        where: {} // Empty where to get all chats
      });

      logger.info('✅ Chats brutos encontrados:', response.data?.length || 0);

      // Log first chat structure for debugging
      if (response.data && response.data.length > 0) {
        logger.info('📋 Exemplo de chat bruto (primeiro item):', JSON.stringify(response.data[0], null, 2));
      }

      // Processar e normalizar chats
      const chatMap = new Map(); // Usar Map para remover duplicatas por remoteJid

      for (const rawChat of response.data || []) {
        const remoteJid = rawChat.remoteJid || rawChat.id;

        // Pular se não tiver identificador
        if (!remoteJid) continue;

        // Normalizar nome do contato
        const normalizedName = this.normalizeContactName(rawChat);

        // Parsear lastMessage - campos podem vir flattened ou como objeto
        let lastMessage = null;
        if (rawChat.lastMessage) {
          // Se lastMessage já é um objeto completo
          lastMessage = {
            id: rawChat.lastMessage.key?.id || rawChat.lastMessage.id || null,
            text: rawChat.lastMessage.message?.conversation ||
                  rawChat.lastMessage.message?.extendedTextMessage?.text ||
                  rawChat.lastMessage.text || '',
            timestamp: rawChat.lastMessage.messageTimestamp || rawChat.lastMessage.timestamp || null,
            fromMe: rawChat.lastMessage.key?.fromMe || rawChat.lastMessage.fromMe || false,
            pushName: rawChat.lastMessage.pushName || null
          };
        } else if (rawChat.lastmessageid || rawChat.lastMessageId) {
          // Se os campos estão flattened
          lastMessage = {
            id: rawChat.lastmessageid || rawChat.lastMessageId || null,
            text: rawChat.lastmessagetext || rawChat.lastMessageText || '',
            timestamp: rawChat.lastmessagetimestamp || rawChat.lastMessageTimestamp || null,
            fromMe: rawChat.lastmessagefromme || rawChat.lastMessageFromMe || false,
            pushName: rawChat.lastmessagepushname || rawChat.lastMessagePushName || null
          };
        }

        // Timestamp da conversa (conversationTimestamp ou lastMessage timestamp)
        const conversationTimestamp = rawChat.conversationTimestamp ||
                                     rawChat.timestamp ||
                                     lastMessage?.timestamp ||
                                     0;

        // Normalizar chat
        const normalizedChat = {
          remoteJid: remoteJid,
          id: remoteJid,
          name: normalizedName,
          pushName: rawChat.pushName || lastMessage?.pushName || null,
          unreadCount: rawChat.unreadCount || 0,
          conversationTimestamp: conversationTimestamp,
          lastMessage: lastMessage,
          profilePicUrl: rawChat.profilePicUrl || null,
          isGroup: remoteJid.includes('@g.us'),
          // Dados brutos para referência
          _raw: rawChat
        };

        // Usar remoteJid como chave única para evitar duplicatas
        // Se já existe, manter o mais recente
        const existing = chatMap.get(remoteJid);
        if (!existing || conversationTimestamp > existing.conversationTimestamp) {
          chatMap.set(remoteJid, normalizedChat);
        }
      }

      // Converter Map para Array e ordenar por timestamp (mais recente primeiro)
      const normalizedChats = Array.from(chatMap.values())
        .sort((a, b) => (b.conversationTimestamp || 0) - (a.conversationTimestamp || 0));

      logger.info('✅ Chats normalizados:', normalizedChats.length);
      logger.info('📊 Duplicatas removidas:', (response.data?.length || 0) - normalizedChats.length);

      // Log exemplo de chat normalizado
      if (normalizedChats.length > 0) {
        logger.info('📋 Exemplo de chat normalizado:', JSON.stringify(normalizedChats[0], null, 2));
      }

      return {
        success: true,
        chats: normalizedChats
      };
    } catch (error) {
      logger.error('❌ Erro ao buscar chats:', error.message);
      logger.error('Response:', error.response?.data);
      return {
        success: false,
        chats: [],
        error: error.message
      };
    }
  }

  /**
   * Buscar mensagens de um chat
   * POST /chat/findMessages/{instanceName}
   */
  async fetchMessages(instanceName, remoteJid, limit = 100) {
    logger.info('=== BUSCAR MENSAGENS ===');
    logger.info('Instance Name:', instanceName);
    logger.info('Remote JID:', remoteJid);

    try {
      const encodedInstanceName = encodeURIComponent(instanceName);

      // Evolution API v2 requires POST with where clause
      const response = await this.client.post(`/chat/findMessages/${encodedInstanceName}`, {
        where: {
          key: {
            remoteJid: remoteJid
          }
        },
        limit: limit
      });

      logger.info('✅ Mensagens encontradas:', response.data?.length || 0);

      return {
        success: true,
        messages: response.data || []
      };
    } catch (error) {
      logger.error('❌ Erro ao buscar mensagens:', error.message);
      return {
        success: false,
        messages: [],
        error: error.message
      };
    }
  }

  /**
   * Health check da Evolution API
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}`);
      logger.info('✅ Evolution API Health Check:', response.data);
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      logger.error('❌ Evolution API health check failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar instância única (singleton)
export default new EvolutionService();
