export function verifyWebhookAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${process.env.CHAINHOOK_SECRET_TOKEN}`;

  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Missing authorization header' 
    });
  }

  if (authHeader !== expectedToken) {
    return res.status(403).json({ 
      error: 'Invalid authorization token' 
    });
  }

  next();
}
