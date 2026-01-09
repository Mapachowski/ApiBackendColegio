-- Tabla para gestión de solicitudes de reapertura de unidades cerradas
-- Sistema simplificado: docente solicita, admin aprueba/rechaza

CREATE TABLE IF NOT EXISTS solicitudes_reapertura (
  IdSolicitud INT PRIMARY KEY AUTO_INCREMENT,
  IdUnidad INT NOT NULL,
  SolicitadoPor INT NOT NULL COMMENT 'IdDocente que solicita reapertura',
  Motivo TEXT NOT NULL,
  Estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
  AprobadoPor INT COMMENT 'IdUsuario del admin que procesó la solicitud',
  ObservacionesAprobacion TEXT,
  FechaSolicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
  FechaAprobacion DATETIME,

  -- Claves foráneas
  FOREIGN KEY (IdUnidad) REFERENCES unidades(IdUnidad) ON DELETE CASCADE,
  FOREIGN KEY (SolicitadoPor) REFERENCES docentes(idDocente) ON DELETE CASCADE,
  FOREIGN KEY (AprobadoPor) REFERENCES usuarios(IdUsuario) ON DELETE SET NULL,

  -- Índices para mejorar rendimiento de consultas
  INDEX idx_estado (Estado),
  INDEX idx_unidad (IdUnidad),
  INDEX idx_solicitante (SolicitadoPor),
  INDEX idx_fecha (FechaSolicitud)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios de tabla
ALTER TABLE solicitudes_reapertura
COMMENT = 'Sistema de solicitudes de reapertura de unidades cerradas. Flujo: Docente solicita → Admin aprueba/rechaza';
