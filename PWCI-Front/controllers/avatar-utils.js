(function() {
    const BLOB_API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/blob-api.php';

    function normalizeBoolean(value) {
        if (value === undefined || value === null) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value === 1;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'si';
        }
        return false;
    }

    function getAvatarUrl({ id, foto, hasBlob }, options = {}) {
        if (normalizeBoolean(hasBlob) && id !== undefined && id !== null) {
            let url = `${BLOB_API_BASE_URL}?action=download&tipo=perfil&id=${id}`;
            if (options.cacheBust) {
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}_=${Date.now()}`;
            }
            return url;
        }

        if (foto && typeof foto === 'string' && foto.trim() !== '') {
            return foto.trim();
        }

        return null;
    }

    function applyAvatar(imgElement, fallbackElement, avatarUrl) {
        if (!imgElement || !fallbackElement) {
            return;
        }

        function showFallback() {
            imgElement.classList.add('hidden');
            imgElement.removeAttribute('src');
            fallbackElement.classList.remove('hidden');
        }

        if (avatarUrl) {
            imgElement.onload = function() {
                imgElement.classList.remove('hidden');
                fallbackElement.classList.add('hidden');
            };
            imgElement.onerror = showFallback;
            imgElement.src = avatarUrl;
        } else {
            showFallback();
        }
    }

    window.PWCI = window.PWCI || {};
    window.PWCI.avatar = {
        getAvatarUrl,
        applyAvatar,
        normalizeBoolean
    };
})();
