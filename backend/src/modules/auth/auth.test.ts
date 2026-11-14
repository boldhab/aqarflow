import request from 'supertest';
import { app } from '../../app';

const integration = process.env.RUN_OPERATIONS_INTEGRATION === '1' ? describe : describe.skip;

integration('Auth Module Integration Tests', () => {
  let adminCookie = '';
  let agentCookie = '';

  it('Admin login succeeds, sets an httpOnly cookie, and returns user profile without password or token in body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'Admin@AqarFlow.com', // test case-insensitivity
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@aqarflow.com');
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.user.agency).toBeDefined();
    expect(res.body.data.user.agency.slug).toBe('demo-agency');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.token).toBeUndefined();

    // Verify cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = Array.isArray(cookies)
      ? cookies.find((c) => c.startsWith('aqarflow_token='))
      : cookies;
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toMatch(/HttpOnly/i);

    adminCookie = (tokenCookie as string).split(';')[0];
  });

  it('Wrong password returns 401 with generic "Invalid email or password"', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@aqarflow.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('Unknown email returns 401 with the same generic message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'unknown@aqarflow.com',
        password: 'password123',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('Inactive user returns 401 with the same generic message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'inactive@aqarflow.com',
        password: 'password123',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('GET /me with the cookie returns 200 and the correct agency', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@aqarflow.com');
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.user.agency.slug).toBe('demo-agency');
  });

  it('GET /me without a cookie returns 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Agent calling /admin-check returns 403; Admin returns 200', async () => {
    // 1. Login as Agent
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'agent@aqarflow.com',
        password: 'password123',
      });

    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers['set-cookie'];
    const tokenCookie = Array.isArray(cookies)
      ? cookies.find((c) => c.startsWith('aqarflow_token='))
      : cookies;
    agentCookie = (tokenCookie as string).split(';')[0];

    // 2. Agent calling /admin-check -> 403
    const agentRes = await request(app)
      .get('/api/v1/auth/admin-check')
      .set('Cookie', agentCookie);

    expect(agentRes.status).toBe(403);
    expect(agentRes.body.success).toBe(false);

    // 3. Admin calling /admin-check -> 200
    const adminRes = await request(app)
      .get('/api/v1/auth/admin-check')
      .set('Cookie', adminCookie);

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(adminRes.body.message).toBe('Admin access confirmed');
  });

  it('Logout clears the cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(204);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = Array.isArray(cookies)
      ? cookies.find((c) => c.startsWith('aqarflow_token='))
      : cookies;
    expect(tokenCookie).toBeDefined();
    // Clearing cookie sets it empty or expired (e.g. Max-Age=0 or Expires in past)
    expect(tokenCookie).toMatch(/aqarflow_token=;|(?:Max-Age=0)|(?:expires=Thu, 01 Jan 1970)/i);
  });
});
