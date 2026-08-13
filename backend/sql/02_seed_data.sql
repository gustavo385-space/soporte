-- ============================================================================
-- Datos de demostración (migrados desde backend/db.json)
-- Ejecutar DESPUÉS de 01_schema.sql
-- ============================================================================

-- USERS
insert into users (id, email, name, role, empresa_id, contacto, telefono, plan, especialidad) values ('usr_empresa_1', 'contacto@techcorp.com', 'TechCorp Logistics S.A.', 'empresa', 'emp_1', 'Ing. Carlos Mendoza', '+52 55 1234 5678', 'Enterprise VIP', NULL) on conflict (id) do nothing;
insert into users (id, email, name, role, empresa_id, contacto, telefono, plan, especialidad) values ('usr_empresa_2', 'soporte@innovatech.io', 'InnovaTech Solutions', 'empresa', 'emp_2', 'Dra. Sofía Ramírez', '+52 55 9876 5432', 'Business Pro', NULL) on conflict (id) do nothing;
insert into users (id, email, name, role, empresa_id, contacto, telefono, plan, especialidad) values ('usr_tech_1', 'admin@soporte.com', 'Alex Rivera (Lead DevOps & Support)', 'admin', NULL, NULL, '+52 55 5555 0101', NULL, 'Redes & Servidores Cloud') on conflict (id) do nothing;
insert into users (id, email, name, role, empresa_id, contacto, telefono, plan, especialidad) values ('usr_tech_2', 'tecnico@soporte.com', 'Roberto Silva (Senior Field Tech)', 'tecnico', NULL, NULL, '+52 55 5555 0202', NULL, 'Mantenimiento Hardware & Licenciamiento') on conflict (id) do nothing;

-- TICKETS
insert into tickets (id, empresa_id, empresa_nombre, titulo, descripcion, categoria, prioridad, estado, tecnico_asignado, fecha_creacion, fecha_actualizacion) values ('TCK-8901', 'emp_1', 'TechCorp Logistics S.A.', 'Fallo crítico en servidor de base de datos principal', 'El servidor SQL principal no responde a las peticiones del sistema ERP desde las 08:30 hrs. Error de timeout de conexión.', 'Servidores', 'critico', 'en_proceso', 'Alex Rivera (Lead DevOps & Support)', '2026-08-03T09:15:00Z', '2026-08-03T10:45:00Z') on conflict (id) do nothing;
insert into tickets (id, empresa_id, empresa_nombre, titulo, descripcion, categoria, prioridad, estado, tecnico_asignado, fecha_creacion, fecha_actualizacion) values ('TCK-8902', 'emp_1', 'TechCorp Logistics S.A.', 'Solicitud de renovación de 25 licencias Microsoft 365 E5', 'Se requiere renovar el lote anual de licencias Office 365 para el departamento de finanzas y operaciones.', 'Licencias', 'media', 'pendiente', 'Sin Asignar', '2026-08-02T14:20:00Z', '2026-08-02T14:20:00Z') on conflict (id) do nothing;
insert into tickets (id, empresa_id, empresa_nombre, titulo, descripcion, categoria, prioridad, estado, tecnico_asignado, fecha_creacion, fecha_actualizacion) values ('TCK-8903', 'emp_2', 'InnovaTech Solutions', 'Mantenimiento preventivo programado para 15 Laptops Dell XPS', 'Limpieza física de disipadores, pasta térmica y actualización de parches de seguridad de firmware.', 'Mantenimiento', 'baja', 'resuelto', 'Roberto Silva (Senior Field Tech)', '2026-07-28T11:00:00Z', '2026-07-30T16:00:00Z') on conflict (id) do nothing;

-- TICKET MESSAGES
insert into ticket_messages (ticket_id, autor, rol, mensaje, fecha) values ('TCK-8901', 'Ing. Carlos Mendoza', 'empresa', 'Requerimos asistencia urgente, las operaciones de almacén están detenidas.', '2026-08-03T09:15:00Z');
insert into ticket_messages (ticket_id, autor, rol, mensaje, fecha) values ('TCK-8901', 'Alex Rivera', 'admin', 'Hola Carlos, estamos realizando diagnóstico remoto del pool de memoria de la BD y reiniciando servicios de cluster.', '2026-08-03T09:40:00Z');
insert into ticket_messages (ticket_id, autor, rol, mensaje, fecha) values ('TCK-8902', 'Ing. Carlos Mendoza', 'empresa', 'Adjunto requerimiento firmado por contabilidad para facturación.', '2026-08-02T14:20:00Z');
insert into ticket_messages (ticket_id, autor, rol, mensaje, fecha) values ('TCK-8903', 'Roberto Silva', 'tecnico', 'Mantenimiento completado satisfactoriamente en las instalaciones del cliente. Reporte de diagnóstico entregado.', '2026-07-30T16:00:00Z');

-- LICENSES CATALOG
insert into licenses_catalog (id, nombre, tipo, fabricante, precio_unitario, incluye, icono) values ('lic_1', 'Microsoft 365 Enterprise E5', 'Suscripción Anual', 'Microsoft', '$38.00 /usuario/mes', 'Word, Excel, Teams, Defender Endpoint, PowerBI Pro', 'logo-microsoft') on conflict (id) do nothing;
insert into licenses_catalog (id, nombre, tipo, fabricante, precio_unitario, incluye, icono) values ('lic_2', 'Kaspersky Endpoint Security Cloud Plus', 'Antivirus & Firewall', 'Kaspersky Lab', '$24.50 /dispositivo/año', 'Protección contra Ransomware, Control Web, EDR Cloud', 'shield-checkmark-outline') on conflict (id) do nothing;
insert into licenses_catalog (id, nombre, tipo, fabricante, precio_unitario, incluye, icono) values ('lic_3', 'Windows Server 2025 Datacenter', 'Licencia Perpetua Por Cores', 'Microsoft', '$6,150.00 /16 Cores', 'Máquinas virtuales ilimitadas, Storage Spaces Direct, Shielded VMs', 'server-outline') on conflict (id) do nothing;
insert into licenses_catalog (id, nombre, tipo, fabricante, precio_unitario, incluye, icono) values ('lic_4', 'Autodesk AutoCAD Architecture 2026', 'Suscripción Anual', 'Autodesk', '$1,975.00 /año', 'Diseño 2D/3D especializado, Cloud Rendering, Mobile App Access', 'cube-outline') on conflict (id) do nothing;

-- ACTIVE LICENSES
insert into active_licenses (id, empresa_id, nombre, cantidad, clave_licencia, fecha_vencimiento, estado) values ('act_lic_101', 'emp_1', 'Microsoft 365 Enterprise E5', 25, 'XXXXX-MW982-PL019-KJS88-39201', '2026-09-15', 'Activa') on conflict (id) do nothing;
insert into active_licenses (id, empresa_id, nombre, cantidad, clave_licencia, fecha_vencimiento, estado) values ('act_lic_102', 'emp_1', 'Kaspersky Endpoint Security', 40, 'KASP-99201-EC911-PRO88', '2026-12-01', 'Activa') on conflict (id) do nothing;

-- EQUIPMENT
insert into equipment (id, empresa_id, codigo_activo, tipo, marca_modelo, ubicacion, especificaciones, ultimo_mantenimiento, proximo_mantenimiento, estado) values ('eq_01', 'emp_1', 'EQ-SRV-01', 'Servidor Rack 2U', 'Dell PowerEdge R750', 'Rack A-04 (Data Center Principal)', '2x Xeon Gold 6330 / 128GB RAM / 4x 1.92TB NVMe SSD', '2026-06-15', '2026-12-15', 'Operativo') on conflict (id) do nothing;
insert into equipment (id, empresa_id, codigo_activo, tipo, marca_modelo, ubicacion, especificaciones, ultimo_mantenimiento, proximo_mantenimiento, estado) values ('eq_02', 'emp_1', 'EQ-SW-02', 'Switch Gestionable Layer 3', 'Cisco Catalyst 9300 48-Port PoE+', 'Rack B-01 (Piso 2 Oficinas)', '48 puertos Gigabit + 4x 10G Uplinks / Stackwise', '2026-05-10', '2026-11-10', 'Operativo') on conflict (id) do nothing;
insert into equipment (id, empresa_id, codigo_activo, tipo, marca_modelo, ubicacion, especificaciones, ultimo_mantenimiento, proximo_mantenimiento, estado) values ('eq_03', 'emp_1', 'EQ-UPS-01', 'Sistema de Respaldos UPS 6kVA', 'APC Smart-UPS RT 6000VA', 'Cuarto de Comunicaciones', 'Banco de baterías externo / Módulo SNMP', '2026-07-01', '2026-10-01', 'Atención Requerida') on conflict (id) do nothing;
