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
  user: 'postgres',
  password: 'Raj@143225',
};

app.register(fastifyPostgres, dbConfig);

// Helper functions

app.get('/health', async (request, reply) => {
    try {
      const client = await app.pg.connect();
      reply.send({ message: 'Database connected successfully!' });
      client.release();
    } catch (err) {
      reply.status(500).send({ error: 'Failed to connect to database',err});
    }
  });


const generateToken = (userId: number, email: string): string => {
  const secretKey = process.env.JWT_SECRET || 'default_secret';
  return jwt.sign({ userId, email }, secretKey, { expiresIn: '1h' });
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
// app.post('/login', async (request, reply) => {
//   const { email, password } = request.body as { email: string; password: string };

//   try {
//     const client = await app.pg.connect();
//     const selectQuery = `SELECT id, password FROM userdata WHERE email = $1`;
//     const { rows } = await client.query(selectQuery, [email]);

//     if (rows.length === 0) {
//       client.release();
//       return reply.code(401).send({ error: 'Invalid credentials' });
//     }

//     const { id, password: hashedPassword } = rows[0];
//     const isValidPassword = await verifyPassword(password, hashedPassword);

//     if (!isValidPassword) {
//       client.release();
//       return reply.code(401).send({ error: 'Invalid credentials' });
//     }

//     const token = generateToken(id);
//     client.release();
//     reply.code(200).send({ token });
//   } catch (error) {
//     reply.code(500).send({ error: 'Login failed' });
//   }
// });
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

      // Pass email to the generateToken function
      const token = generateToken(id, email);
      client.release();
      reply.code(200).send({ token });
  } catch (error) {
      reply.code(500).send({ error: 'Login failed' });
  }
});


/*
app.get('/getuser', async (request, reply) => {
  // console.log(request.body, "body")
  // const {email} = request.body as {email:string}
  // console.log(email);
  const authHeader = request.headers['authorization'];
  if (!authHeader) {
    return reply.code(401).send({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return reply.code(401).send({ error: 'Invalid authorization header' });
  }

  try {
    const secretKey = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secretKey) as { userId: number , email : string };
    // console.log(decoded.userId);
    const client = await app.pg.connect();
    const selectQuery = `SELECT id, email,created_at FROM userauth WHERE email = $1`;
    const { rows } = await client.query(selectQuery, [decoded.email]);
    client.release();
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    reply.code(200).send(rows[0]);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return reply.code(401).send({ error: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return reply.code(401).send({ error: 'Invalid token' });
    } else if (error instanceof Error) {
      // Handle other errors (e.g., database-related issues)
      reply.code(500).send({ error: error.message });
    } else {
      // If the error is truly unknown, respond with a generic message
      reply.code(500).send({ error: 'Unknown error occurred' });
    }
  }
});

*/
app.get('/getuser', async (request, reply) => {
  // console.log(request.body, "body")
  // const {email} = request.body as {email:string}
  // console.log(email);
  const authHeader = request.headers['authorization'];
  if (!authHeader) {
      return reply.code(401).send({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
      return reply.code(401).send({ error: 'Invalid authorization header' });
  }

  try {
      const secretKey = process.env.JWT_SECRET || 'default_secret';
      const decoded = jwt.verify(token, secretKey) as { userId: number; email: string };

      const client = await app.pg.connect();
      const selectQuery = `SELECT id, email, created_at FROM userauth WHERE email = $1`;
      const { rows } = await client.query(selectQuery, [decoded.email]);
      // console.log(decode)
      client.release();

      if (rows.length === 0) {
          return reply.code(404).send({ error: 'User not found' });
      }

      reply.code(200).send(rows[0]);
  } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
          return reply.code(401).send({ error: 'Token expired' });
      } else if (error instanceof jwt.JsonWebTokenError) {
          return reply.code(401).send({ error: 'Invalid token' });
      } else if (error instanceof Error) {
          reply.code(500).send({ error: error.message });
      } else {
          reply.code(500).send({ error: 'Unknown error occurred' });
      }
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
