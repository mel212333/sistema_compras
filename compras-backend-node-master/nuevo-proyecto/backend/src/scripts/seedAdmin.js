import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';

export async function seedAdmin() {
  const [user, created] = await User.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      username: 'admin',
      passwordHash: hashPassword('sistemas'),
      fullName: 'Administrador',
      role: 'admin',
      active: true
    }
  });

  if (!created && !user.active) {
    await user.update({ active: true });
  }
}
