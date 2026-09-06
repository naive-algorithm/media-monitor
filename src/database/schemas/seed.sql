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
);