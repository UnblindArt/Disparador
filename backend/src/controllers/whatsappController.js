import evolutionService from '../services/evolutionService.js';
import logger from '../config/logger.js';
import config from '../config/env.js';
import { supabaseAdmin } from '../config/database.js';

/**
 * POST /api/whatsapp/instances
 * Criar instância + Gerar QR Code
 */
export async function createWhatsAppInstance(req, res, next) {
  logger.info('\n========================================');
  logger.info('🚀 CRIAR NOVA INSTÂNCIA WHATSAPP');
  logger.info('========================================');
  logger.info('Timestamp:', new Date().toISOString());
  logger.info('Body recebido:', JSON.stringify(req.body, null, 2));
  logger.info('User:', req.user);

  try {
    const { instanceName, phoneNumber, options } = req.body;
    const userId = req.user.id;

    if (!instanceName) {
      logger.error('❌ Nome da instância não fornecido');
      return res.status(400).json({
        success: false,
        error: 'Nome da instância é obrigatório'
      });
    }

    // ============================================================
    // STEP 0: Verificar se já existe no banco
    // ============================================================
    logger.info('\n📝 STEP 0: Verificando se instância já existe no banco...');
    const { data: existingInstance } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', instanceName)
      .single();

    if (existingInstance) {
      logger.warn('⚠️ Instância já existe no banco:', { instanceName });
      return res.status(409).json({
        success: false,
        error: `Instância "${instanceName}" já existe. Por favor, escolha outro nome.`
      });
    }

    logger.info('✅ Instância não existe no banco, prosseguindo...');

    // ============================================================
    // STEP 1: Criar instância na Evolution API
    // ============================================================
    logger.info('\n📝 STEP 1: Criando instância na Evolution API...');
    const createResult = await evolutionService.createInstance(instanceName, options);

    if (!createResult.success) {
      logger.error('❌ Falha ao criar instância na Evolution API');
      return res.status(createResult.status || 500).json(createResult);
    }

    logger.info('✅ Instância criada na Evolution API com sucesso');

    // ============================================================
    // STEP 2: Salvar instância no banco de dados
    // ============================================================
    logger.info('\n📝 STEP 2: Salvando instância no banco de dados...');
    try {
      const { error: dbError } = await supabaseAdmin
        .from('whatsapp_instances')
        .insert({
          user_id: userId,
          instance_name: instanceName,
          instance_key: createResult.data.hash || createResult.data.instance?.token,
          phone: phoneNumber || null,
          status: 'connecting',
        });

      if (dbError) {
        logger.error('❌ Erro ao salvar no banco:', dbError);

        // Tentar deletar da Evolution para manter consistência
        try {
          await evolutionService.deleteInstance(instanceName);
          logger.info('🧹 Instância removida da Evolution API (rollback)');
        } catch (cleanupError) {
          logger.error('Erro ao fazer rollback:', cleanupError);
        }

        throw dbError;
      }

      logger.info('✅ Instância salva no banco de dados');
    } catch (dbSaveError) {
      logger.error('❌ Falha crítica ao salvar no banco:', dbSaveError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao salvar instância no banco de dados'
      });
    }

    // ============================================================
    // STEP 3: Configurar webhook
    // ============================================================
    logger.info('\n📝 STEP 3: Configurando webhook...');
    try {
      const webhookUrl = `${config.APP_URL}/api/webhook/evolution`;
      await evolutionService.setWebhook(webhookUrl, [
        'QRCODE_UPDATED',
        'CONNECTION_UPDATE',
        'MESSAGES_UPSERT',
      ], instanceName);
      logger.info('✅ Webhook configurado:', webhookUrl);
    } catch (webhookError) {
      logger.warn('⚠️ Webhook não configurado (continuando):', webhookError.message);
    }

    // ============================================================
    // STEP 4: Aguardar e gerar QR Code
    // ============================================================
    logger.info('\n📝 STEP 4: Aguardando Evolution gerar QR Code...');

    // Aguardar 2 segundos (workaround para bug #1768)
    logger.info('⏳ Aguardando 2 segundos antes de gerar QR Code...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Tentar obter QR Code com retry logic
    logger.info('📱 Gerando QR Code...');
    let qrcodeData = null;

    try {
      const qrResult = await evolutionService.waitForQRCode(instanceName, 5, 3000);

      if (qrResult.success && qrResult.qrCode) {
        qrcodeData = qrResult;
        logger.info('✅ QR Code gerado com sucesso!');
      } else {
        logger.warn('⚠️ QR Code não gerado imediatamente, usuário pode buscar depois');
      }
    } catch (qrcodeError) {
      logger.warn('⚠️ Não foi possível obter QR Code imediatamente:', qrcodeError);
    }

    // ============================================================
    // STEP 5: Retornar resposta
    // ============================================================
    const response = {
      success: true,
      message: qrcodeData?.qrCode
        ? 'Instância criada e QR Code gerado com sucesso!'
        : 'Instância criada. QR Code será gerado automaticamente.',
      data: {
        instance: {
          instanceName,
          instanceId: createResult.data.instance?.instanceId,
          status: createResult.data.instance?.status || 'connecting'
        },
        hash: createResult.data.hash,
        qrcode: qrcodeData ? {
          base64: qrcodeData.qrCode,
          code: qrcodeData.qrCode,
          pairingCode: qrcodeData.pairingCode,
          count: qrcodeData.count
        } : null,
        needsManualQR: !qrcodeData?.qrCode,
        phoneNumber: phoneNumber || null
      }
    };

    logger.info('\n✨ SUCESSO TOTAL!');
    logger.info('========================================\n');

    return res.status(200).json(response);

  } catch (error) {
    logger.error('\n💥 ERRO FATAL:', {
      message: error.message,
      stack: error.stack,
      status: error.status
    });
    logger.info('========================================\n');

    return res.status(error.status || 500).json({
      success: false,
      error: error.message || error.error || 'Erro ao criar instância'
    });
  }
}

/**
 * GET /api/whatsapp/instances/:instanceName/qrcode
 * Gerar QR Code para instância existente
 */
export async function getQRCode(req, res, next) {
  logger.info('\n========================================');
  logger.info('📱 BUSCAR QR CODE');
  logger.info('========================================');

  try {
    const { instanceName } = req.params;

    if (!instanceName || instanceName === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Nome da instância inválido'
      });
    }

    logger.info('Instance Name:', instanceName);

    const result = await evolutionService.generateQRCode(instanceName);

    if (!result.success) {
      if (result.needsRetry) {
        return res.status(202).json({
          success: false,
          message: result.message || 'QR Code ainda não foi gerado. Aguardando...',
          retry: true
        });
      }

      return res.status(result.status || 500).json(result);
    }

    // Atualizar status no banco
    try {
      await supabaseAdmin
        .from('whatsapp_instances')
        .update({ status: 'connecting' })
        .eq('instance_name', instanceName);
    } catch (updateError) {
      logger.warn('Failed to update instance status:', updateError.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        instance: { instanceName },
        qrcode: {
          base64: result.qrCode,
          code: result.qrCode,
          pairingCode: result.pairingCode,
          count: result.count
        }
      }
    });

  } catch (error) {
    logger.error('❌ Erro:', error.message);

    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/whatsapp/instances
 * Listar todas as instâncias
 */
export async function getAllInstances(req, res, next) {
  logger.info('📋 LISTAR INSTÂNCIAS');

  try {
    const userId = req.user.id;

    // Buscar do banco de dados
    const { data: dbInstances, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Buscar da Evolution API para obter status atualizado
    const evolutionResult = await evolutionService.fetchInstances();
    const evolutionInstances = evolutionResult.instances || [];

    // Combinar dados
    const instances = dbInstances.map(dbInstance => {
      const evolutionInstance = evolutionInstances.find(
        ei => ei.name === dbInstance.instance_name
      );

      return {
        ...dbInstance,
        connectionStatus: evolutionInstance?.connectionStatus || 'close',
        profileName: evolutionInstance?.profileName,
        number: evolutionInstance?.number || dbInstance.phone
      };
    });

    logger.info('✅ Instâncias encontradas:', instances.length);

    return res.status(200).json({
      success: true,
      data: instances
    });

  } catch (error) {
    logger.error('❌ Erro ao listar instâncias:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/whatsapp/instances/:instanceName/status
 * Verificar status da conexão
 */
export async function getInstanceStatus(req, res, next) {
  try {
    const { instanceName } = req.params;
    const result = await evolutionService.getConnectionState(instanceName);
    return res.status(200).json(result);

  } catch (error) {
    logger.error('❌ Erro:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * DELETE /api/whatsapp/instances/:instanceName
 * Deletar instância
 */
export async function deleteInstance(req, res, next) {
  logger.info('🗑️ DELETAR INSTÂNCIA');

  try {
    const { instanceName } = req.params;
    const userId = req.user.id;

    logger.info('Instance Name:', instanceName);
    logger.info('User ID:', userId);

    // Deletar da Evolution API primeiro
    try {
      await evolutionService.deleteInstance(instanceName);
      logger.info('✅ Instância deletada da Evolution API');
    } catch (evolutionError) {
      logger.warn('⚠️ Erro ao deletar da Evolution API (continuando):', evolutionError);
    }

    // Deletar do banco de dados
    const { error } = await supabaseAdmin
      .from('whatsapp_instances')
      .delete()
      .eq('instance_name', instanceName)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    logger.info('✅ Instância deletada do banco de dados');

    return res.status(200).json({
      success: true,
      message: 'Instância deletada com sucesso'
    });

  } catch (error) {
    logger.error('❌ Erro:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/whatsapp/instances/:instanceName/disconnect
 * Desconectar instância
 */
export async function disconnectInstance(req, res, next) {
  logger.info('🔌 DESCONECTAR INSTÂNCIA');

  try {
    const { instanceName } = req.params;

    const result = await evolutionService.disconnectInstance(instanceName);

    // Atualizar status no banco
    await supabaseAdmin
      .from('whatsapp_instances')
      .update({ status: 'disconnected' })
      .eq('instance_name', instanceName);

    return res.status(200).json(result);

  } catch (error) {
    logger.error('❌ Erro:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/whatsapp/test-evolution
 * Testar conexão com Evolution API
 */
export async function testEvolutionConnection(req, res, next) {
  logger.info('\n🧪 TESTE DE CONEXÃO EVOLUTION API');

  try {
    const healthCheck = await evolutionService.checkHealth();
    const instancesResult = await evolutionService.fetchInstances();

    return res.status(200).json({
      success: true,
      message: 'Conexão OK com Evolution API',
      evolution: {
        url: config.EVOLUTION_API_URL,
        apiKeyConfigured: !!config.EVOLUTION_API_KEY,
        version: healthCheck.version,
        status: healthCheck.message,
        instancesFound: instancesResult.instances?.length || 0
      }
    });

  } catch (error) {
    logger.error('❌ Erro no teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Falha na conexão com Evolution API',
      error: error.message
    });
  }
}

/**
 * POST /api/whatsapp/instances/:instanceName/configure-webhook
 * Configurar/reconfigurar webhook para instância existente
 */
export async function configureWebhook(req, res, next) {
  logger.info('\n⚙️ CONFIGURAR WEBHOOK');

  try {
    const { instanceName } = req.params;
    const userId = req.user.id;

    logger.info('Instance Name:', instanceName);
    logger.info('User ID:', userId);

    // Verificar se a instância pertence ao usuário
    const { data: instance, error: dbError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', instanceName)
      .eq('user_id', userId)
      .single();

    if (dbError || !instance) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada ou você não tem permissão'
      });
    }

    // Configurar webhook
    const webhookUrl = `${config.APP_URL}/api/webhook/evolution`;
    await evolutionService.setWebhook(webhookUrl, [
      'QRCODE_UPDATED',
      'CONNECTION_UPDATE',
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'SEND_MESSAGE',
    ], instanceName);

    logger.info('✅ Webhook configurado com sucesso:', webhookUrl);

    return res.status(200).json({
      success: true,
      message: 'Webhook configurado com sucesso',
      webhook: {
        url: webhookUrl,
        events: ['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'SEND_MESSAGE']
      }
    });

  } catch (error) {
    logger.error('❌ Erro ao configurar webhook:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/whatsapp/instances/evolution
 * Listar todas as instâncias diretamente da Evolution API
 */
export async function getEvolutionInstances(req, res, next) {
  logger.info('\n📋 LISTAR INSTÂNCIAS DA EVOLUTION API');

  try {
    const result = await evolutionService.fetchInstances();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar instâncias da Evolution API',
        error: result.error
      });
    }

    logger.info('✅ Instâncias encontradas:', result.instances.length);

    return res.status(200).json({
      success: true,
      data: result.instances.map(instance => ({
        name: instance.name,
        connectionStatus: instance.connectionStatus,
        profileName: instance.profileName,
        number: instance.number,
        integration: instance.integration,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt
      }))
    });

  } catch (error) {
    logger.error('❌ Erro ao listar instâncias:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export default {
  createWhatsAppInstance,
  getQRCode,
  getAllInstances,
  getInstanceStatus,
  deleteInstance,
  disconnectInstance,
  testEvolutionConnection,
  configureWebhook,
  getEvolutionInstances
};
