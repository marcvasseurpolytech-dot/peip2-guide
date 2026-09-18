const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const { password, closed, modules } = req.body;

    const hash = crypto.createHash('sha256').update(password || '').digest('hex');
    if (hash !== process.env.ADMIN_PASSWORD_HASH) {
      res.status(401).send('Mot de passe incorrect');
      return;
    }

    if (typeof closed !== 'boolean' || typeof modules !== 'object' || modules === null) {
      res.status(400).send('Payload invalide');
      return;
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO; // "marcvasseurpolytech-dot/peip2-guide"
    const filePath = 'access.json';

    const getResp = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' }
    });
    if (!getResp.ok) {
      res.status(500).send('Impossible de lire access.json sur GitHub');
      return;
    }
    const getData = await getResp.json();
    const sha = getData.sha;

    const newAccess = { closed, modules };
    const content = Buffer.from(JSON.stringify(newAccess, null, 2)).toString('base64');

    const putResp = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update access.json via admin panel',
        content,
        sha
      })
    });

    if (!putResp.ok) {
      const errText = await putResp.text();
      res.status(500).send('Échec de la mise à jour GitHub : ' + errText);
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).send('Erreur serveur : ' + err.message);
  }
};
