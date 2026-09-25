import User from '../models/User.js';
import { verifyPassword } from '../utils/password.js';

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contrasena son obligatorios.' });
  }

  const user = await User.findOne({ where: { username, active: true } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Usuario o contrasena incorrectos.' });
  }

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    }
  });
}
