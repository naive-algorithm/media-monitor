INSERT INTO sources (
    name,
    url,
    collector_type,
    is_enabled
)
VALUES
(
    'BBC News',
    'https://feeds.bbci.co.uk/news/rss.xml',
    'rss',
    true
),
(
    'The Guardian',
    'https://www.theguardian.com/world/rss',
    'rss',
    true
),
(
    'NYT',
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    'rss',
    true
),
(
    'NASA',
    'https://www.nasa.gov/feed/',
    'rss',
    true
),
(
    'NPR News',
    'https://feeds.npr.org/1001/rss.xml',
    'rss',
    true
),
(
    'Le Monde — International (EN)',
    'https://www.lemonde.fr/en/international/rss_full.xml',
    'rss',
    true
);
