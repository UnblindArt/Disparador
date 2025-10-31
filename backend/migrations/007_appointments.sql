-- Migration 007: Appointments System
-- Sistema de agendamentos

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  appointment_type VARCHAR(50) DEFAULT 'meeting', -- 'meeting', 'call', 'consultation', 'follow_up', 'other'
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
  reminder_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_appointment_type CHECK (appointment_type IN ('meeting', 'call', 'consultation', 'follow_up', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_contact ON appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_status ON appointments(user_id, status) WHERE cancelled_at IS NULL;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_appointments_updated_at();

-- Comentários
COMMENT ON TABLE appointments IS 'Agendamentos e compromissos';
COMMENT ON COLUMN appointments.appointment_type IS 'Tipo de agendamento (meeting, call, consultation, etc)';
COMMENT ON COLUMN appointments.status IS 'Status do agendamento';
COMMENT ON COLUMN appointments.reminder_time IS 'Horário do lembrete (legacy, usar appointment_reminders)';
