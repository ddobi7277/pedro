// API Configuration with intelligent fallback for localhost:3000
class ApiConfig {
    constructor() {
        // Detectar si estamos en desarrollo (localhost:3000)
        this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // URLs base
        this.PRODUCTION_URL = 'https://cubaunify.uk';
        this.DEVELOPMENT_URL = 'http://localhost:8000';

        // Cargar preferencia del usuario desde localStorage
        this.testMode = localStorage.getItem('testMode') === 'true';

        // Estado de conectividad y fallback
        this.lastWorkingUrl = localStorage.getItem('lastWorkingUrl') || null;
        this.serverError = false;
        this.urlStatus = {
            [this.DEVELOPMENT_URL]: null,
            [this.PRODUCTION_URL]: null
        };

        // URL actual basada en la lógica de fallback
        this.currentBaseUrl = this.getBaseUrl();

        // Configuración de frecuencia de verificación (en milisegundos)
        // 10 minutos = 600000, 20 minutos = 1200000, 30 minutos = 1800000
        this.checkInterval = parseInt(localStorage.getItem('serverCheckInterval')) || 1200000; // 20 minutos por defecto
    }

    // Verificar si el usuario actual es admin
    isUserAdmin() {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('access_token');
            if (!token) return false;

            // Verificar por username almacenado o token
            const username = localStorage.getItem('username');
            return username === 'pedro' || username === 'admin';
        } catch (error) {
            return false;
        }
    }

    getBaseUrl() {
        // Si testMode está activado desde localhost:3000, ir directo a localhost:8000 (CUALQUIER USUARIO)
        if (this.isDevelopment && this.testMode) {
            return this.DEVELOPMENT_URL;
        }

        // Si el usuario no es admin, siempre ir a producción (cubaunify.uk)
        if (!this.isUserAdmin()) {
            return this.PRODUCTION_URL;
        }

        // Si estamos en localhost:3000, seguir la secuencia: cubaunify.uk -> localhost:8000
        if (this.isDevelopment) {
            return this.lastWorkingUrl || this.PRODUCTION_URL; // Intentar cubaunify primero
        }

        // Si estamos en producción, usar solo producción
        return this.PRODUCTION_URL;
    }

    // Verificar conectividad de un endpoint
    async checkConnectivity(baseUrl, timeout = 8000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`${baseUrl}/docs`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'text/html,application/json',
                }
            });

            clearTimeout(timeoutId);

            // Solo considerar como online si la respuesta es específicamente 200 OK
            if (response.status === 200 && response.ok) {
                console.log(`✅ Server ${baseUrl} responded with status 200 OK`);
                // NO cambiar automáticamente a 'online' si ya está marcado como 'offline'
                // Solo establecer como 'online' si no hay estado previo o si no estaba marcado como offline
                if (!this.urlStatus[baseUrl] || this.urlStatus[baseUrl] !== 'offline') {
                    this.urlStatus[baseUrl] = 'online';
                }
                return true;
            }

            // Cualquier status que NO sea 200 se considera como servidor no disponible
            console.log(`❌ Server ${baseUrl} responded with status ${response.status} (not 200 OK)`);
            this.urlStatus[baseUrl] = 'offline';
            return false;
        } catch (error) {
            console.log(`❌ Server ${baseUrl} connection failed:`, error.message);
            this.urlStatus[baseUrl] = 'offline';
            return false;
        }
    }

    // Verificar conectividad sin modificar el estado visual (para uso interno)
    async checkConnectivityOnly(baseUrl, timeout = 8000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`${baseUrl}/docs`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'text/html,application/json',
                }
            });

            clearTimeout(timeoutId);
            // Solo considerar como disponible si la respuesta es específicamente 200 OK
            return response.status === 200 && response.ok;
        } catch (error) {
            return false;
        }
    }

    // Obtener URL con fallback automático inteligente
    async getUrlWithFallback(endpoint = '') {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

        // Si estamos en producción, solo usar la URL de producción
        if (!this.isDevelopment) {
            return `${this.PRODUCTION_URL}/${cleanEndpoint}`;
        }

        // Lógica especial para localhost:3000
        let urlsToTry = [];

        // Si el usuario no es admin, solo intentar cubaunify.uk
        if (!this.isUserAdmin()) {
            urlsToTry = [this.PRODUCTION_URL];
        } else if (this.testMode) {
            // Modo test: ir directo a localhost:8000
            urlsToTry = [this.DEVELOPMENT_URL];
        } else {
            // Modo normal: cubaunify.uk primero, luego localhost:8000
            urlsToTry = [this.PRODUCTION_URL, this.DEVELOPMENT_URL];
        }        // Intentar cada URL en orden
        for (const baseUrl of urlsToTry) {
            try {
                const isOnline = await this.checkConnectivity(baseUrl);
                if (isOnline) {
                    this.lastWorkingUrl = baseUrl;
                    localStorage.setItem('lastWorkingUrl', baseUrl);
                    this.currentBaseUrl = baseUrl;
                    this.serverError = false;

                    // Actualizar modo test basado en el servidor que funciona
                    if (this.isUserAdmin() && this.isDevelopment) {
                        const shouldBeTestMode = baseUrl === this.DEVELOPMENT_URL;
                        if (this.testMode !== shouldBeTestMode) {
                            this.testMode = shouldBeTestMode;
                            localStorage.setItem('testMode', shouldBeTestMode.toString());
                            console.log(`🔄 Auto-updated testMode to ${shouldBeTestMode} (using ${baseUrl})`);
                        }
                    }

                    return `${baseUrl}/${cleanEndpoint}`;
                }
            } catch (error) {
                console.log(`Failed to connect to ${baseUrl}:`, error);
                continue;
            }
        }

        // Si llegamos aquí, todos los servidores fallaron
        this.serverError = true;
        throw new Error('SERVER_ERROR');
    }

    // Realizar fetch con fallback automático y manejo de errores
    async fetchWithFallback(endpoint, options = {}) {
        try {
            const url = await this.getUrlWithFallback(endpoint);
            const response = await fetch(url, options);

            // Si la respuesta es exitosa, marcar la URL como working
            if (response.ok) {
                const baseUrl = new URL(url).origin;
                this.urlStatus[baseUrl] = 'online';
                this.lastWorkingUrl = baseUrl;
                localStorage.setItem('lastWorkingUrl', baseUrl);
                this.serverError = false;
                return response;
            } else {
                // Si hay error HTTP (404, 500, etc.), marcar como offline
                const baseUrl = new URL(url).origin;
                this.urlStatus[baseUrl] = 'offline';

                // Si es un usuario admin y estamos en desarrollo, intentar cambio automático
                if (this.isUserAdmin() && this.isDevelopment) {
                    const switched = await this.handleServerFailure(baseUrl);

                    // Si se cambió exitosamente, intentar el request con el nuevo servidor
                    if (switched) {
                        try {
                            const newUrl = await this.getUrlWithFallback(endpoint);
                            const newResponse = await fetch(newUrl, options);

                            if (newResponse.ok) {
                                console.log('✅ Request successful after automatic server switch');
                                return newResponse;
                            }
                        } catch (retryError) {
                            console.log('❌ Retry after server switch also failed:', retryError);
                        }
                    }
                }

                return response; // Retornar response original para que el componente maneje el error
            }
        } catch (error) {
            // Error de red (servidor no disponible)
            if (this.isUserAdmin() && this.isDevelopment) {
                const switched = await this.handleServerFailure(this.currentBaseUrl);

                // Si se cambió exitosamente, intentar el request con el nuevo servidor
                if (switched) {
                    try {
                        const newUrl = await this.getUrlWithFallback(endpoint);
                        const newResponse = await fetch(newUrl, options);
                        console.log('✅ Request successful after automatic server switch');
                        return newResponse;
                    } catch (retryError) {
                        console.log('❌ Retry after server switch also failed:', retryError);
                    }
                }
            }

            if (error.message === 'SERVER_ERROR') {
                throw error; // Re-lanzar el error del servidor para manejo especial
            }
            throw new Error('NETWORK_ERROR');
        }
    }

    // Manejar fallo de servidor y cambio automático
    async handleServerFailure(failedUrl) {
        try {
            // Si falló cubaunify.uk, cambiar a modo test (localhost:8000)
            if (failedUrl === this.PRODUCTION_URL && !this.testMode) {
                console.log('🔄 Cubaunify.uk no disponible, cambiando automáticamente a localhost:8000');

                // Verificar si localhost:8000 está disponible usando checkConnectivityOnly
                // para no cambiar su estado visual si ya estaba marcado como offline
                const localAvailable = await this.checkConnectivityOnly(this.DEVELOPMENT_URL);

                // Solo cambiar si localhost:8000 está disponible Y no está marcado como offline manualmente
                if (localAvailable && this.urlStatus[this.DEVELOPMENT_URL] !== 'offline') {
                    this.testMode = true;
                    localStorage.setItem('testMode', 'true');
                    this.currentBaseUrl = this.DEVELOPMENT_URL;
                    this.urlStatus[this.DEVELOPMENT_URL] = 'online';

                    // Disparar evento para actualizar UI
                    window.dispatchEvent(new CustomEvent('serverSwitched', {
                        detail: { newServer: this.DEVELOPMENT_URL, testMode: true }
                    }));

                    return true; // Cambio exitoso
                } else {
                    if (!localAvailable) {
                        console.log('❌ Localhost:8000 no está disponible');
                    } else {
                        console.log('❌ Localhost:8000 está marcado como offline manualmente');
                    }
                    return false;
                }
            }
            // Si falló localhost:8000, intentar cambiar a cubaunify.uk
            else if (failedUrl === this.DEVELOPMENT_URL && this.testMode) {
                console.log('🔄 Localhost:8000 no disponible, cambiando automáticamente a cubaunify.uk');

                // Verificar si cubaunify.uk está disponible usando checkConnectivityOnly
                const prodAvailable = await this.checkConnectivityOnly(this.PRODUCTION_URL);

                // Solo cambiar si cubaunify.uk está disponible Y no está marcado como offline manualmente
                if (prodAvailable && this.urlStatus[this.PRODUCTION_URL] !== 'offline') {
                    this.testMode = false;
                    localStorage.setItem('testMode', 'false');
                    this.currentBaseUrl = this.PRODUCTION_URL;
                    this.urlStatus[this.PRODUCTION_URL] = 'online';

                    // Disparar evento para actualizar UI
                    window.dispatchEvent(new CustomEvent('serverSwitched', {
                        detail: { newServer: this.PRODUCTION_URL, testMode: false }
                    }));

                    return true; // Cambio exitoso
                } else {
                    if (!prodAvailable) {
                        console.log('❌ Cubaunify.uk no está disponible');
                    } else {
                        console.log('❌ Cubaunify.uk está marcado como offline manualmente');
                    }
                    return false;
                }
            }

            return false; // No se pudo hacer cambio automático
        } catch (error) {
            console.error('Error during automatic server switching:', error);
            return false;
        }
    }

    // Verificar estado de todos los servidores
    async checkAllServersStatus() {
        if (this.isUserAdmin() && this.isDevelopment) {
            // Usar checkConnectivityOnly para NO modificar el estado visual
            const prodStatus = await this.checkConnectivityOnly(this.PRODUCTION_URL);
            const devStatus = await this.checkConnectivityOnly(this.DEVELOPMENT_URL);

            // Solo marcar como offline si no están disponibles
            // NUNCA cambiar automáticamente a online
            if (!prodStatus && this.urlStatus[this.PRODUCTION_URL] !== 'offline') {
                this.urlStatus[this.PRODUCTION_URL] = 'offline';
            }
            if (!devStatus && this.urlStatus[this.DEVELOPMENT_URL] !== 'offline') {
                this.urlStatus[this.DEVELOPMENT_URL] = 'offline';
            }

            // Solo cambiar automáticamente si el servidor ACTUAL no funciona
            // y hay una alternativa disponible QUE NO ESTÉ MARCADA COMO OFFLINE
            if (!this.testMode && !prodStatus && devStatus && this.urlStatus[this.DEVELOPMENT_URL] !== 'offline') {
                console.log('🔄 Auto-switching to localhost:8000 - cubaunify.uk not available');
                this.testMode = true;
                localStorage.setItem('testMode', 'true');
                this.currentBaseUrl = this.DEVELOPMENT_URL;
                // Solo marcar como online el servidor al que cambiamos automáticamente
                this.urlStatus[this.DEVELOPMENT_URL] = 'online';
            } else if (this.testMode && !devStatus && prodStatus && this.urlStatus[this.PRODUCTION_URL] !== 'offline') {
                console.log('🔄 Auto-switching to cubaunify.uk - localhost:8000 not available');
                this.testMode = false;
                localStorage.setItem('testMode', 'false');
                this.currentBaseUrl = this.PRODUCTION_URL;
                // Solo marcar como online el servidor al que cambiamos automáticamente
                this.urlStatus[this.PRODUCTION_URL] = 'online';
            }
        }
    }    // Alternar modo test
    toggleTestMode() {
        this.testMode = !this.testMode;
        localStorage.setItem('testMode', this.testMode.toString());
        this.currentBaseUrl = this.getBaseUrl();

        // Resetear el estado del servidor al que estamos cambiando
        const targetUrl = this.getBaseUrl();
        if (this.urlStatus[targetUrl] === 'offline') {
            delete this.urlStatus[targetUrl]; // Permitir nueva verificación
        }

        // No recargar automáticamente para que el usuario vea el cambio
        console.log(`Modo test ${this.testMode ? 'activado' : 'desactivado'}. URL actual: ${this.currentBaseUrl}`);
    }

    // Cambiar a un servidor específico y resetear su estado
    async switchToServer(isTestMode) {
        // Guardar la URL del servidor anterior para verificar su estado
        const previousServerUrl = this.currentBaseUrl;
        const previousTestMode = this.testMode;

        this.testMode = isTestMode;
        localStorage.setItem('testMode', isTestMode.toString());
        this.currentBaseUrl = this.getBaseUrl();

        // Resetear el estado del servidor al que estamos cambiando para permitir nueva verificación
        if (this.urlStatus[this.currentBaseUrl] === 'offline') {
            delete this.urlStatus[this.currentBaseUrl];
        }

        // Verificar inmediatamente la conectividad del nuevo servidor
        const isOnline = await this.checkConnectivity(this.currentBaseUrl);

        // Si el nuevo servidor no funciona
        if (!isOnline) {
            console.log(`❌ Target server ${this.currentBaseUrl} is not available`);

            // Marcar como offline
            this.urlStatus[this.currentBaseUrl] = 'offline';

            // Verificar si el servidor anterior está disponible para fallback automático
            if (previousServerUrl !== this.currentBaseUrl) {
                console.log(`🔍 Checking if previous server ${previousServerUrl} is available for fallback...`);
                const previousServerOnline = await this.checkConnectivityOnly(previousServerUrl);

                if (previousServerOnline) {
                    console.log(`🔄 Automatic fallback to ${previousServerUrl} - target server unavailable`);
                    // Revertir al servidor anterior
                    this.testMode = previousTestMode;
                    localStorage.setItem('testMode', this.testMode.toString());
                    this.currentBaseUrl = previousServerUrl;
                    this.urlStatus[previousServerUrl] = 'online';

                    // Disparar evento de cambio automático
                    window.dispatchEvent(new CustomEvent('serverSwitched', {
                        detail: {
                            newServer: previousServerUrl,
                            testMode: previousTestMode,
                            reason: 'automatic_fallback'
                        }
                    }));

                    return false; // Indicar que el cambio solicitado falló, pero hay fallback
                } else {
                    console.log(`❌ Previous server ${previousServerUrl} is also offline`);
                    this.urlStatus[previousServerUrl] = 'offline';
                }
            }

            return false; // Cambio falló
        }

        // Si el nuevo servidor funciona, marcar como online
        this.urlStatus[this.currentBaseUrl] = 'online';
        console.log(`✅ Successfully switched to ${isTestMode ? 'localhost:8000' : 'cubaunify.uk'}`);

        return true; // Cambio exitoso
    }

    // Verificar y actualizar estado de un servidor específico (para clicks manuales)
    async verifyServerStatus(serverUrl) {
        try {
            const isOnline = await this.checkConnectivityOnly(serverUrl);
            this.urlStatus[serverUrl] = isOnline ? 'online' : 'offline';

            const serverName = serverUrl === this.DEVELOPMENT_URL ? 'localhost:8000' : 'cubaunify.uk';
            console.log(`🔍 Manual verification: ${serverName} is ${isOnline ? 'online' : 'offline'}`);

            return isOnline;
        } catch (error) {
            console.error(`Error verifying ${serverUrl}:`, error);
            this.urlStatus[serverUrl] = 'offline';
            return false;
        }
    }

    // Obtener URL completa para un endpoint (versión síncrona para compatibilidad)
    getUrl(endpoint = '') {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return cleanEndpoint ? `${this.currentBaseUrl}/${cleanEndpoint}` : this.currentBaseUrl;
    }

    // Obtener estado actual
    getStatus() {
        return {
            isDevelopment: this.isDevelopment,
            testMode: this.testMode,
            currentBaseUrl: this.currentBaseUrl,
            lastWorkingUrl: this.lastWorkingUrl,
            serverError: this.serverError,
            urlStatus: this.urlStatus,
            isUsingDevelopmentServer: this.currentBaseUrl === this.DEVELOPMENT_URL,
            fallbackSequence: this.isDevelopment
                ? (this.testMode ? ['localhost:8000'] : ['cubaunify.uk', 'localhost:8000'])
                : ['cubaunify.uk']
        };
    }

    // Resetear estado de conectividad
    resetConnectivityStatus() {
        this.urlStatus = {
            [this.DEVELOPMENT_URL]: null,
            [this.PRODUCTION_URL]: null
        };
        this.serverError = false;
        localStorage.removeItem('lastWorkingUrl');
        this.lastWorkingUrl = null;
    }

    // Reintentar conexión
    async retryConnection() {
        this.resetConnectivityStatus();
        this.currentBaseUrl = this.getBaseUrl();
        try {
            await this.getUrlWithFallback('');
            return true;
        } catch (error) {
            return false;
        }
    }

    // Configurar intervalo de verificación de servidores
    setCheckInterval(minutes) {
        const intervalMs = minutes * 60 * 1000; // Convertir minutos a milisegundos
        this.checkInterval = intervalMs;
        localStorage.setItem('serverCheckInterval', intervalMs.toString());
        console.log(`🕐 Server check interval set to ${minutes} minutes`);
    }

    // Obtener intervalo de verificación actual (en minutos)
    getCheckIntervalMinutes() {
        return this.checkInterval / (60 * 1000);
    }

    // Obtener configuraciones predefinidas de intervalo
    getIntervalOptions() {
        return [
            { label: '10 minutos', value: 10, ms: 600000 },
            { label: '20 minutos', value: 20, ms: 1200000 },
            { label: '30 minutos', value: 30, ms: 1800000 },
            { label: '1 hora', value: 60, ms: 3600000 }
        ];
    }
}// Exportar instancia singleton
export const apiConfig = new ApiConfig();

// Funciones de conveniencia
export const getApiUrl = (endpoint) => apiConfig.getUrl(endpoint);
export const getApiUrlWithFallback = (endpoint) => apiConfig.getUrlWithFallback(endpoint);
export const fetchWithFallback = (endpoint, options) => apiConfig.fetchWithFallback(endpoint, options);
export const toggleTestMode = () => apiConfig.toggleTestMode();
export const getApiStatus = () => apiConfig.getStatus();
export const resetConnectivity = () => apiConfig.resetConnectivityStatus();