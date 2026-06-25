const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Sector } = require("../models");

exports.registerAdmin = async (req, res) => {
  const { user } = useAuthContext();
  console.log("ROL ACTUAL 👉", user?.role);


  try {
    const { name, email, password, role = "ADMIN" } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email ya existe" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      role,
    });

    res.json({ message: "Admin creado", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar admin" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Sector,
          as: "sector",
          attributes: ["id", "nombre"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.activo === false) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        nombre: user.name,
        email: user.email,
        rol: user.rol,
        sector_id: user.sector_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const userSafe = user.toJSON();
    delete userSafe.password;

    res.json({
      message: "Login OK",
      token,
      usuario: userSafe,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en login" });
  }
};
