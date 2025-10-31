-- Migration 009: Appointment Reminders System
-- Sistema de lembretes para agendamentos (10min, 5min, na hora)

-- Tabela de lembretes
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reminder_type VARCHAR(20) NOT NULL, -- '10_minutes', '5_minutes', 'on_time'
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_reminder_type CHECK (reminder_type IN ('10_minutes', '5_minutes', 'on_time'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_user ON appointment_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_time ON appointment_reminders(reminder_time) WHERE NOT sent;
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_pending ON appointment_reminders(sent, reminder_time) WHERE NOT sent;

-- Tabela de notificações in-app
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'appointment_reminder', 'appointment_starting', 'campaign_complete', etc
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Dados adicionais (appointment_id, contact_id, etc)
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- Notificações podem expirar
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE NOT read;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Função para criar lembretes automaticamente quando um agendamento é criado
CREATE OR REPLACE FUNCTION create_appointment_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Lembrete 10 minutos antes
  INSERT INTO appointment_reminders (appointment_id, user_id, reminder_type, reminder_time)
  VALUES (NEW.id, NEW.user_id, '10_minutes', NEW.start_time - INTERVAL '10 minutes');

  -- Lembrete 5 minutos antes
  INSERT INTO appointment_reminders (appointment_id, user_id, reminder_type, reminder_time)
  VALUES (NEW.id, NEW.user_id, '5_minutes', NEW.start_time - INTERVAL '5 minutes');

  -- Lembrete na hora
  INSERT INTO appointment_reminders (appointment_id, user_id, reminder_type, reminder_time)
  VALUES (NEW.id, NEW.user_id, 'on_time', NEW.start_time);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar lembretes automaticamente
DROP TRIGGER IF EXISTS create_appointment_reminders_trigger ON appointments;
CREATE TRIGGER create_appointment_reminders_trigger
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION create_appointment_reminders();

-- Função para atualizar lembretes quando o agendamento é alterado
CREATE OR REPLACE FUNCTION update_appointment_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o horário mudou, atualizar todos os lembretes não enviados
  IF NEW.start_time <> OLD.start_time THEN
    UPDATE appointment_reminders
    SET
      reminder_time = CASE
        WHEN reminder_type = '10_minutes' THEN NEW.start_time - INTERVAL '10 minutes'
        WHEN reminder_type = '5_minutes' THEN NEW.start_time - INTERVAL '5 minutes'
        WHEN reminder_type = 'on_time' THEN NEW.start_time
      END
    WHERE appointment_id = NEW.id
      AND NOT sent;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar lembretes
DROP TRIGGER IF EXISTS update_appointment_reminders_trigger ON appointments;
CREATE TRIGGER update_appointment_reminders_trigger
AFTER UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_appointment_reminders();

-- View para lembretes pendentes com informações do agendamento
CREATE OR REPLACE VIEW pending_reminders AS
SELECT
  ar.*,
  a.title as appointment_title,
  a.description as appointment_description,
  a.start_time as appointment_start,
  a.end_time as appointment_end,
  a.location as appointment_location,
  a.contact_id,
  c.name as contact_name,
  c.phone as contact_phone,
  u.email as user_email,
  u.name as user_name
FROM appointment_reminders ar
JOIN appointments a ON ar.appointment_id = a.id
LEFT JOIN contacts c ON a.contact_id = c.id
JOIN users u ON ar.user_id = u.id
WHERE ar.sent = FALSE
  AND ar.reminder_time <= NOW() + INTERVAL '1 minute'
  AND a.status = 'scheduled'
  AND a.cancelled_at IS NULL
ORDER BY ar.reminder_time ASC;

-- View para notificações não lidas do usuário
CREATE OR REPLACE VIEW user_unread_notifications AS
SELECT
  n.*,
  CASE
    WHEN n.expires_at IS NOT NULL AND n.expires_at < NOW() THEN TRUE
    ELSE FALSE
  END as is_expired
FROM notifications n
WHERE n.read = FALSE
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.created_at DESC;

-- Adicionar colunas para controle de notificações nos appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS app_notifications BOOLEAN DEFAULT TRUE;

-- Comentários
COMMENT ON TABLE appointment_reminders IS 'Lembretes automáticos de agendamentos';
COMMENT ON TABLE notifications IS 'Notificações in-app para usuários';
COMMENT ON COLUMN appointment_reminders.reminder_type IS 'Tipo: 10_minutes, 5_minutes, on_time';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificação para filtros e ícones';
COMMENT ON COLUMN notifications.data IS 'Dados adicionais em JSON (IDs relacionados, URLs, etc)';
