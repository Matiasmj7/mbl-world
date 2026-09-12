export default async function handler(req, res) {
  const { id } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /facebookexternalhit|whatsapp|twitterbot|pinterest|googlebot|linkedinbot/i.test(userAgent);

  const defaultMeta = {
    title: 'MBL Arg | La Arena del Kage',
    description: 'Torneos, ligas y comunidad de Mobile Legends en Argentina.',
    image: 'https://mblarg.vercel.app/logo-mblarg.webp',
    url: 'https://mblarg.vercel.app/'
  };

  if (!isBot) {
    res.writeHead(302, { Location: `/#torneos` });
    return res.end();
  }

  let tournamentTitle = defaultMeta.title;
  let tournamentDesc = defaultMeta.description;

  if (id) {
    try {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/mblarg-94390/databases/(default)/documents/torneos/${id}`;
      const response = await fetch(firestoreUrl);
      if (response.ok) {
        const doc = await response.json();
        const fields = doc.fields || {};
        const name = fields.nombre?.stringValue;
        const premio = fields.premio?.stringValue;
        const formato = fields.formato?.stringValue;
        if (name) {
          tournamentTitle = `${name} | MBL Arg`;
          tournamentDesc = `Formato: ${formato ? formato.toUpperCase() : 'Competitivo'} | Premio: ${premio || 'Gloria y Puntos'}. ¡Sumate a la Arena!`;
        }
      }
    } catch (e) {
      console.error('Error fetching tournament meta:', e);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${tournamentTitle}</title>
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MBL Arg">
  <meta property="og:title" content="${tournamentTitle}">
  <meta property="og:description" content="${tournamentDesc}">
  <meta property="og:image" content="${defaultMeta.image}">
  <meta property="og:url" content="${defaultMeta.url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${tournamentTitle}">
  <meta name="twitter:description" content="${tournamentDesc}">
  <meta name="twitter:image" content="${defaultMeta.image}">
</head>
<body>
  <h1>${tournamentTitle}</h1>
  <p>${tournamentDesc}</p>
  <script>window.location.href = "/#torneos";</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
