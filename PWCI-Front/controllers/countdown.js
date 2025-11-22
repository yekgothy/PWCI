(function () {
    const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';
    let countdownTimer = null;

    function getStartDate(worldCup) {
        if (worldCup.fechaInicio) {
            const parsed = new Date(`${worldCup.fechaInicio}T00:00:00`);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
        }

        if (worldCup.anio) {
            const year = parseInt(worldCup.anio, 10);
            if (!Number.isNaN(year)) {
                // Usamos el 1 de junio como aproximación cuando no hay fecha exacta.
                return new Date(year, 5, 1);
            }
        }

        return null;
    }

    function formatStartDate(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    async function fetchNextWorldCup() {
        try {
            const response = await fetch(`${API_BASE_URL}/mundiales`);
            const payload = await response.json();
            const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

            if (!Array.isArray(list) || list.length === 0) {
                return null;
            }

            const enriched = list
                .map((wc) => ({ ...wc, startDate: getStartDate(wc) }))
                .filter((wc) => wc.startDate instanceof Date && !Number.isNaN(wc.startDate.getTime()));

            if (enriched.length === 0) {
                return null;
            }

            const now = new Date();

            const futureByStatus = enriched
                .filter((wc) => wc.estado === 'proximo' && wc.startDate.getTime() > now.getTime())
                .sort((a, b) => a.startDate - b.startDate);

            if (futureByStatus.length > 0) {
                return futureByStatus[0];
            }

            const futureByDate = enriched
                .filter((wc) => wc.startDate.getTime() > now.getTime())
                .sort((a, b) => a.startDate - b.startDate);

            if (futureByDate.length > 0) {
                return futureByDate[0];
            }

            // Si no hay futuros, buscamos el marcado como "proximo" aunque ya haya iniciado.
            const fallbackProximo = enriched
                .filter((wc) => wc.estado === 'proximo')
                .sort((a, b) => a.startDate - b.startDate);

            if (fallbackProximo.length > 0) {
                return fallbackProximo[0];
            }

            return null;
        } catch (error) {
            console.error('Error obteniendo mundiales para countdown:', error);
            return null;
        }
    }

    function setCountdownNumbers(elements, values) {
        const { daysEl, hoursEl, minutesEl, secondsEl } = elements;
        if (daysEl) daysEl.textContent = values.days;
        if (hoursEl) hoursEl.textContent = values.hours;
        if (minutesEl) minutesEl.textContent = values.minutes;
        if (secondsEl) secondsEl.textContent = values.seconds;
    }

    function clearExistingTimer() {
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
    }

    function startCountdown(targetDate, elements) {
        clearExistingTimer();

        function update() {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                clearExistingTimer();
                setCountdownNumbers(elements, { days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setCountdownNumbers(elements, { days, hours, minutes, seconds });
        }

        update();
        countdownTimer = setInterval(update, 1000);
    }

    function setFallbackState(elements) {
        if (elements.nameEl) {
            elements.nameEl.textContent = 'Sin mundial programado';
        }
        if (elements.dateEl) {
            elements.dateEl.textContent = '';
        }
        setCountdownNumbers(elements, { days: 0, hours: 0, minutes: 0, seconds: 0 });
    }

    async function initCountdown() {
        const nameEl = document.getElementById('nextWorldCupName');
        const dateEl = document.getElementById('nextWorldCupDate');
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (!nameEl || !dateEl || !daysEl || !hoursEl || !minutesEl || !secondsEl) {
            return;
        }

        nameEl.textContent = 'Buscando...';
        dateEl.textContent = '—';
        setCountdownNumbers({ daysEl, hoursEl, minutesEl, secondsEl }, { days: 0, hours: 0, minutes: 0, seconds: 0 });

        const nextWorldCup = await fetchNextWorldCup();

        if (!nextWorldCup || !nextWorldCup.startDate) {
            setFallbackState({ nameEl, dateEl, daysEl, hoursEl, minutesEl, secondsEl });
            return;
        }

        if (nameEl) {
            const nameParts = [nextWorldCup.nombreOficial || null, `${nextWorldCup.paisSede || ''} ${nextWorldCup.anio || ''}`.trim()];
            const formattedName = nameParts.find((part) => part && part.length > 0);
            nameEl.textContent = formattedName || 'Mundial confirmado';
        }

        if (dateEl) {
            dateEl.textContent = formatStartDate(nextWorldCup.startDate);
        }

        startCountdown(nextWorldCup.startDate, { nameEl, dateEl, daysEl, hoursEl, minutesEl, secondsEl });
    }

    window.PWCI = window.PWCI || {};
    window.PWCI.countdown = {
        init: initCountdown
    };
})();
