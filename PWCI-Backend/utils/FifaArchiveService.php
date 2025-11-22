<?php
/**
 * Servicio para consumir datos del archivo abierto de la FIFA (openfootball)
 * Se encarga de descargar, cachear y transformar los datos en "noticias" utilizables por la UI.
 */
class FifaArchiveService
{
    private const BASE_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master';
    private const CACHE_TTL_SECONDS = 43200; // 12 horas
    private const DEFAULT_YEAR = 2022;

    private string $cacheDir;

    public function __construct(?string $cacheDir = null)
    {
        $baseDir = $cacheDir ?: __DIR__ . '/../assets/cache';
        $this->cacheDir = rtrim($baseDir, DIRECTORY_SEPARATOR);

        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0775, true);
        }
    }

    /**
     * Obtener colección de noticias oficiales basadas en el año indicado.
     */
    public function getNews(?int $year = null, int $limit = 3): array
    {
        $targetYear = $year ?: self::DEFAULT_YEAR;
        $data = $this->loadWorldCupData($targetYear);

        if (!$data || !isset($data['matches']) || !is_array($data['matches'])) {
            throw new RuntimeException('Datos de mundial no disponibles para el año solicitado.');
        }

        $newsItems = $this->buildNewsItems($data['matches'], $targetYear, $limit);

        return [
            'year' => $targetYear,
            'source' => 'openfootball/worldcup.json',
            'items' => $newsItems,
            'lastSync' => $this->getCacheTimestamp($targetYear)
        ];
    }

    private function loadWorldCupData(int $year): ?array
    {
        $cacheFile = $this->cacheDir . DIRECTORY_SEPARATOR . "worldcup_{$year}.json";
        $useCache = file_exists($cacheFile) && (time() - filemtime($cacheFile) < self::CACHE_TTL_SECONDS);

        if ($useCache) {
            $json = file_get_contents($cacheFile);
            return $json ? json_decode($json, true) : null;
        }

        $url = sprintf('%s/%d/worldcup.json', self::BASE_URL, $year);
        $json = $this->download($url);

        if (!$json) {
            if (file_exists($cacheFile)) {
                $json = file_get_contents($cacheFile);
                return $json ? json_decode($json, true) : null;
            }
            return null;
        }

        file_put_contents($cacheFile, $json);
        return json_decode($json, true);
    }

    private function download(string $url): ?string
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'User-Agent: PWCI-WorldCupHub/1.0'
                ],
                'timeout' => 15
            ]
        ]);

        try {
            $data = @file_get_contents($url, false, $context);
            return $data !== false ? $data : null;
        } catch (Throwable $exception) {
            return null;
        }
    }

    private function buildNewsItems(array $matches, int $year, int $limit): array
    {
        $openingMatch = $matches[0] ?? null;
        $playedMatches = array_filter($matches, function ($match) {
            return isset($match['score1']) && isset($match['score2']);
        });

        $finalMatch = $this->findFinalMatch($matches);
        $latestMatch = $this->findLatestPlayedMatch($playedMatches);
        $topScoringMatch = $this->findTopScoringMatch($playedMatches);

        $items = [];
        $usedKeys = [];

        $this->addNewsItem($items, $usedKeys, $finalMatch, 'Final del Mundial', $year);
        $this->addNewsItem($items, $usedKeys, $topScoringMatch, 'Partido con más goles', $year);
        $this->addNewsItem($items, $usedKeys, $latestMatch, 'Resultado destacado reciente', $year);
        $this->addNewsItem($items, $usedKeys, $openingMatch, 'Partido inaugural', $year);

        $items = array_values(array_filter($items));

        if ($limit > 0) {
            $items = array_slice($items, 0, $limit);
        }

        return $items;
    }

    private function addNewsItem(array &$items, array &$usedKeys, ?array $match, string $headline, int $year): void
    {
        if (!$match) {
            return;
        }

        $key = $this->buildMatchKey($match);
        if (isset($usedKeys[$key])) {
            return;
        }

        $items[] = $this->transformMatchToNews($match, $headline, $year);
        $usedKeys[$key] = true;
    }

    private function transformMatchToNews(array $match, string $headline, int $year): array
    {
        $score = $this->formatScoreline($match);
        $date = $match['date'] ?? null;
        $round = $match['round'] ?? null;
        $stadium = $match['stadium'] ?? ($match['venue'] ?? null);
        $city = $match['city'] ?? null;

        $summaryParts = [];
        if ($round) {
            $summaryParts[] = $round;
        }
        if ($stadium) {
            $summaryParts[] = $stadium;
        }
        if ($city) {
            $summaryParts[] = $city;
        }

        $summary = implode(' • ', $summaryParts);

        if ($score['display']) {
            $headline = sprintf('%s %d: %s %s %s', $headline, $year, $match['team1'] ?? 'Equipo 1', $score['display'], $match['team2'] ?? 'Equipo 2');
        } else {
            $headline = sprintf('%s %d: %s vs %s', $headline, $year, $match['team1'] ?? 'Equipo 1', $match['team2'] ?? 'Equipo 2');
        }

        return [
            'title' => $headline,
            'summary' => $summary ?: null,
            'date' => $date,
            'round' => $round,
            'teams' => [
                'home' => $match['team1'] ?? null,
                'away' => $match['team2'] ?? null
            ],
            'score' => [
                'regular' => $score['regular'],
                'extraTime' => $score['extraTime'],
                'penalties' => $score['penalties'],
                'display' => $score['display']
            ],
            'metadata' => [
                'stadium' => $stadium,
                'city' => $city
            ],
            'slug' => $this->buildMatchKey($match)
        ];
    }

    private function buildMatchKey(array $match): string
    {
        $parts = [
            $match['date'] ?? '',
            $match['round'] ?? '',
            $match['team1'] ?? '',
            $match['team2'] ?? ''
        ];

        return md5(implode('|', $parts));
    }

    private function formatScoreline(array $match): array
    {
        $score1 = isset($match['score1']) ? (int)$match['score1'] : null;
        $score2 = isset($match['score2']) ? (int)$match['score2'] : null;
        $score1et = isset($match['score1et']) ? (int)$match['score1et'] : null;
        $score2et = isset($match['score2et']) ? (int)$match['score2et'] : null;
        $score1p = isset($match['score1p']) ? (int)$match['score1p'] : null;
        $score2p = isset($match['score2p']) ? (int)$match['score2p'] : null;

        $regular = null;
        $extraTime = null;
        $penalties = null;
        $display = null;

        if ($score1 !== null && $score2 !== null) {
            $regular = sprintf('%d-%d', $score1, $score2);
            $display = $regular;
        }

        if ($score1et !== null && $score2et !== null) {
            $extraTime = sprintf('%d-%d', $score1et, $score2et);
            $display = sprintf('%s (ET %s)', $display ?? '', $extraTime);
        }

        if ($score1p !== null && $score2p !== null) {
            $penalties = sprintf('%d-%d', $score1p, $score2p);
            $display = trim(sprintf('%s (%s pen)', $display ?? '', $penalties));
        }

        return [
            'regular' => $regular,
            'extraTime' => $extraTime,
            'penalties' => $penalties,
            'display' => $display
        ];
    }

    private function findFinalMatch(array $matches): ?array
    {
        foreach ($matches as $match) {
            if (!isset($match['round'])) {
                continue;
            }

            $round = strtolower($match['round']);
            if ($round === 'final') {
                return $match;
            }
        }

        return null;
    }

    private function findLatestPlayedMatch(array $matches): ?array
    {
        $latest = null;

        foreach ($matches as $match) {
            if (!isset($match['date'])) {
                continue;
            }

            $matchTimestamp = strtotime($match['date']);
            if ($matchTimestamp === false) {
                continue;
            }

            if (!$latest || $matchTimestamp > strtotime($latest['date'] ?? '1970-01-01')) {
                $latest = $match;
            }
        }

        return $latest;
    }

    private function findTopScoringMatch(array $matches): ?array
    {
        $top = null;
        $topGoals = -1;

        foreach ($matches as $match) {
            if (!isset($match['score1']) || !isset($match['score2'])) {
                continue;
            }

            $score = (int)$match['score1'] + (int)$match['score2'];

            if ($score > $topGoals) {
                $topGoals = $score;
                $top = $match;
            }
        }

        return $top;
    }

    private function getCacheTimestamp(int $year): ?string
    {
        $cacheFile = $this->cacheDir . DIRECTORY_SEPARATOR . "worldcup_{$year}.json";
        if (!file_exists($cacheFile)) {
            return null;
        }

        return gmdate('c', filemtime($cacheFile));
    }
}
