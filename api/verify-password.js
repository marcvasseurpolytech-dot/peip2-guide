const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  try {
    const { password } = req.body;
    const hash = crypto.createHash('sha256').update(password || '').digest('hex');
    if (hash !== process.env.ADMIN_PASSWORD_HASH) {
      res.status(401).json({ ok: false });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).send('Erreur serveur : ' + err.message);
  }
};
