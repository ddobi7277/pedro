// Sistema de logging inteligente para desarrollo y producción
import { apiConfig } from '../config/apiConfig';

class Logger {
    constructor() {
        this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.isTestMode = () => apiConfig.testMode;
    }

    // Verificar si debemos mostrar logs detallados
    shouldShowDetailedLogs() {
        return this.isDevelopment || this.isTestMode();
    }

    // Log importante - siempre se muestra
    info(message, data = null) {
        if (data) {
            console.log(`ℹ️ ${message}`, data);
        } else {
            console.log(`ℹ️ ${message}`);
        }
    }

    // Log de desarrollo - solo en localhost o modo test
    debug(message, data = null) {
        if (this.shouldShowDetailedLogs()) {
            if (data) {
                console.log(`🔍 [DEBUG] ${message}`, data);
            } else {
                console.log(`🔍 [DEBUG] ${message}`);
            }
        }
    }

    // Log de error - siempre se muestra
    error(message, error = null) {
        if (error) {
            console.error(`❌ ${message}`, error);
        } else {
            console.error(`❌ ${message}`);
        }
    }

    // Log de éxito - importante, siempre se muestra
    success(message, data = null) {
        if (data) {
            console.log(`✅ ${message}`, data);
        } else {
            console.log(`✅ ${message}`);
        }
    }

    // Log de advertencia - importante, siempre se muestra
    warn(message, data = null) {
        if (data) {
            console.warn(`⚠️ ${message}`, data);
        } else {
            console.warn(`⚠️ ${message}`);
        }
    }

    // Log de API calls - solo en desarrollo
    api(method, url, data = null) {
        if (this.shouldShowDetailedLogs()) {
            console.log(`🌐 [API] ${method} ${url}`, data || '');
        }
    }

    // Log de autenticación - importante pero filtrado
    auth(message, showToken = false) {
        if (showToken && this.shouldShowDetailedLogs()) {
            console.log(`🔐 [AUTH] ${message}`);
        } else {
            // Solo mostrar que la autenticación ocurrió, sin detalles
            console.log(`🔐 Authentication: ${message.split(':')[0]}`);
        }
    }

    // Log de navegación - solo en desarrollo
    nav(message, location = null) {
        if (this.shouldShowDetailedLogs()) {
            if (location) {
                console.log(`🧭 [NAV] ${message}`, location);
            } else {
                console.log(`🧭 [NAV] ${message}`);
            }
        }
    }

    // Log de datos - solo en desarrollo
    data(message, data) {
        if (this.shouldShowDetailedLogs()) {
            console.log(`📊 [DATA] ${message}`, data);
        } else {
            // Solo mostrar que se cargaron datos, sin detalles
            if (Array.isArray(data)) {
                console.log(`📊 ${message}: ${data.length} items loaded`);
            } else {
                console.log(`📊 ${message}: Data loaded`);
            }
        }
    }

    // Log del estado actual del sistema
    status() {
        console.log(`📋 System Status:`, {
            environment: this.isDevelopment ? 'Development' : 'Production',
            testMode: this.isTestMode(),
            detailedLogs: this.shouldShowDetailedLogs(),
            currentUrl: apiConfig.currentBaseUrl
        });
    }
}

// Exportar instancia singleton
export const logger = new Logger();

// Funciones de conveniencia
export const logInfo = (message, data) => logger.info(message, data);
export const logDebug = (message, data) => logger.debug(message, data);
export const logError = (message, error) => logger.error(message, error);
export const logSuccess = (message, data) => logger.success(message, data);
export const logWarn = (message, data) => logger.warn(message, data);
export const logAPI = (method, url, data) => logger.api(method, url, data);
export const logAuth = (message, showToken) => logger.auth(message, showToken);
export const logNav = (message, location) => logger.nav(message, location);
export const logData = (message, data) => logger.data(message, data);
export const logStatus = () => logger.status();