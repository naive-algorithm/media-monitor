-- Generated from src/classification/taxonomy/taxonomy.json.
-- IPTC Media Topics, adapted subset; CC BY 4.0.
-- https://cv.iptc.org/newscodes/mediatopic/
-- Populate the catalog, not article topic assignments.
BEGIN;

INSERT INTO classification_topics (code, name)
VALUES
    ('medtop:20000379', 'monetary policy'),
    ('medtop:20000370', 'inflation'),
    ('medtop:20000383', 'recession'),
    ('medtop:20000368', 'government debt'),
    ('medtop:20000359', 'gross domestic product'),
    ('medtop:20000533', 'unemployment'),
    ('medtop:20000607', 'government budget'),
    ('medtop:20000620', 'taxation policy'),
    ('medtop:20000274', 'banking'),
    ('medtop:20000396', 'stocks and securities'),
    ('medtop:20000178', 'corporate earnings'),
    ('medtop:20000174', 'bankruptcy'),
    ('medtop:20000204', 'merger or acquisition'),
    ('medtop:20000189', 'layoffs and downsizing'),
    ('medtop:20000530', 'labor strike'),
    ('medtop:20000123', 'antitrust regulations'),
    ('medtop:20001243', 'oil and gas'),
    ('medtop:20000260', 'electricity'),
    ('medtop:20000257', 'renewable energy'),
    ('medtop:20000265', 'nuclear power'),
    ('medtop:20000210', 'agriculture'),
    ('medtop:20000316', 'metal and mineral mining and refining'),
    ('medtop:20000235', 'construction and property'),
    ('medtop:20000343', 'waterway and maritime transport'),
    ('medtop:20001298', 'artificial intelligence'),
    ('medtop:20000230', 'semiconductor and electronic component'),
    ('medtop:20000231', 'software and applications'),
    ('medtop:20000086', 'cyber crime'),
    ('medtop:20000223', 'pharmaceutical'),
    ('medtop:20000737', 'medical research'),
    ('medtop:20000418', 'climate change'),
    ('medtop:20000424', 'environmental pollution'),
    ('medtop:20000574', 'election'),
    ('medtop:20000598', 'national security'),
    ('medtop:20000056', 'armed conflict'),
    ('medtop:20000639', 'diplomacy'),
    ('medtop:20000642', 'economic sanction'),
    ('medtop:20000377', 'trade policy'),
    ('medtop:20000374', 'trade agreements'),
    ('medtop:20000066', 'protests and demonstrations')
ON CONFLICT (code) DO NOTHING;

COMMIT;
