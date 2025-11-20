// src/models/Docente.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Docente = sequelize.define('Docente', {

    idDocente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    Nombres: {
        type: DataTypes.STRING(150),
        allowNull: false
    },

    Apellidos: {
        type: DataTypes.STRING(150),
        allowNull: false
    },

    DPI: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },

    Telefono: {
        type: DataTypes.STRING(20),
        allowNull: true
    },

    Email: {
        type: DataTypes.STRING(120),
        allowNull: true
    },

    Direccion: {
        type: DataTypes.STRING(200),
        allowNull: true
    },

    Estado: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1
    },

    CreadoPor: {
        type: DataTypes.STRING(50),
        allowNull: true
    },

    FechaCreado: {
        type: DataTypes.DATE,
        allowNull: true
    },

    ModificadoPor: {
        type: DataTypes.STRING(50),
        allowNull: true
    },

    FechaModificado: {
        type: DataTypes.DATE,
        allowNull: true
    }

}, {
    tableName: 'docentes',
    timestamps: false
});

module.exports = Docente;
