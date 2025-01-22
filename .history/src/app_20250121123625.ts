// Import required modules
import Fastify from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
// Initialize Fastify app
const app = Fastify();

// Connect to PostgreSQL
type DBConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

const dbConfig: DBConfig = {
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'postegres',
  password: 'Raj@143225',
};

app.register(fastifyPostgres, dbConfig);

// Helper functions
// const generateToken = (userId: number): string => {
//   return jwt.sign({ userId }, '8b17f9a30f6dc65dbe3b1f9f89b3d4c6ed7b2e8421a4e42d2ff292720cbac12d', { expiresIn: '1h' });
// };
app.get('/health', async (request, reply) => {
    try {
      const client = await app.pg.connect();
      reply.send({ message: 'Database connected successfully!' });
      client.release();
    } catch (err) {
      reply.status(500).send({ error: 'Failed to connect to database', details: err.message });
    }
  });
  
const generateToken = (userId: number): string => {
    const secretKey = process.env.JWT_SECRET || 'default_secret';
    return jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
  };

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Routes
// User registration
app.post('/register', async (request, reply) => {
  const { email, password } = request.body as { email: string; password: string };

  try {
    const client = await app.pg.connect();
    const hashedPassword = await hashPassword(password);

    const insertQuery = `INSERT INTO userauth (email, password) VALUES ($1, $2)`;
    await client.query(insertQuery, [email, hashedPassword]);

    client.release();
    reply.code(201).send({ message: 'User registered successfully' });
  } catch (error) {
    reply.code(500).send({ error: 'Registration failed' });
  }
});

// User login
app.post('/login', async (request, reply) => {
  const { email, password } = request.body as { email: string; password: string };

  try {
    const client = await app.pg.connect();
    const selectQuery = `SELECT id, password FROM userauth WHERE email = $1`;
    const { rows } = await client.query(selectQuery, [email]);

    if (rows.length === 0) {
      client.release();
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const { id, password: hashedPassword } = rows[0];
    const isValidPassword = await verifyPassword(password, hashedPassword);

    if (!isValidPassword) {
      client.release();
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = generateToken(id);
    client.release();
    reply.code(200).send({ token });
  } catch (error) {
    reply.code(500).send({ error: 'Login failed' });
  }
});

// Get user details
app.get('/getuser', async (request, reply) => {
  const authHeader = request.headers['authorization'];
  if (!authHeader) {
    return reply.code(401).send({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // const decoded = jwt.verify(token, '8b17f9a30f6dc65dbe3b1f9f89b3d4c6ed7b2e8421a4e42d2ff292720cbac12d') as { userId: number };
    const secretKey = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secretKey) as { userId: number };
    const client = await app.pg.connect();
    const selectQuery = `SELECT id, email FROM user WHERE id = $1`;
    const { rows } = await client.query(selectQuery, [decoded.userId]);

    client.release();
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    reply.code(200).send(rows[0]);
  } catch (error) {
    reply.code(401).send({ error: 'Invalid token' });
  }
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: 3000 });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
