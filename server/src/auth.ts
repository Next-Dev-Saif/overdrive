import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-overdrive-key';

// Middleware to parse JSON
router.use(require('express').json());

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] }
        });

        if (existingUser) {
            return res.status(409).json({ error: "Username or email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create User, Stats, and Wallet in one transaction
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                stats: { create: {} },
                wallet: { create: {} }
            },
            include: { stats: true, wallet: true }
        });

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, stats: user.stats, wallet: user.wallet } });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const user = await prisma.user.findUnique({
            where: { username },
            include: { stats: true, wallet: true }
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, username: user.username, email: user.email, stats: user.stats, wallet: user.wallet } });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
