// GitHub OAuth handler for Decap CMS
export default async function handler(req, res) {
  const { code, state } = req.query;
  
  if (!code) {
    // Redirect to GitHub OAuth
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: `${process.env.VERCEL_URL || 'https://mccp-usm.vercel.app'}/api/auth/callback`,
      scope: 'repo',
      state: state || 'cms'
    });
    
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
    return;
  }
  
  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description);
    }
    
    // Set token in cookie and redirect to admin
    res.setHeader('Set-Cookie', `decap-cms-token=${tokenData.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`);
    res.redirect('/admin');
    
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
