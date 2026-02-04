USE db_sibap;

-- Deshabilitar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar todas las tablas
DROP TABLE IF EXISTS `options`;
DROP TABLE IF EXISTS `items`;
DROP TABLE IF EXISTS `generation_configs`;
DROP TABLE IF EXISTS `logs`;
DROP TABLE IF EXISTS `exports`;
DROP TABLE IF EXISTS `documents`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `alembic_version`;

-- Rehabilitar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que no queden tablas
SHOW TABLES;
