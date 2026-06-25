const express = require("express");
const bcrypt = require("bcryptjs");
const { QueryTypes } = require("sequelize");
const auth = require("../middleware/auth");
const sequelize = require("../config/database");
const { User, Sector } = require("../models");

const router = express.Router();

const ROLES = ["ADMIN", "USER", "APROBADOR_N1", "APROBADOR_N2", "COMPRAS"];

const ensureActivoColumn = async () => {
  await sequelize.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE
  `);
};

const requireAdmin = (req, res, next) => {
  if (req.user?.rol !== "ADMIN") {
    return res.status(403).json({ error: "Solo ADMIN puede administrar usuarios" });
  }
  next();
};

router.use(auth, requireAdmin);

router.get("/", async (_req, res) => {
  try {
    await ensureActivoColumn();

    const usuarios = await User.findAll({
      attributes: ["id", "name", "email", "rol", "sector_id", "activo", "createdAt", "updatedAt"],
      include: [{ model: Sector, as: "sector", attributes: ["id", "nombre"] }],
      order: [["id", "ASC"]],
    });

    return res.json(usuarios);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return res.status(500).json({ error: "Error al listar usuarios" });
  }
});

router.post("/", async (req, res) => {
  try {
    await ensureActivoColumn();

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const rol = String(req.body.rol || "USER").trim();
    const sector_id = req.body.sector_id ? Number(req.body.sector_id) : null;

    if (!name) return res.status(400).json({ error: "Falta nombre" });
    if (!email) return res.status(400).json({ error: "Falta email" });
    if (!password || password.length < 4) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
    }
    if (!ROLES.includes(rol)) return res.status(400).json({ error: "Rol invalido" });

    const existe = await User.findOne({ where: { email } });
    if (existe) return res.status(400).json({ error: "Ya existe un usuario con ese email" });

    const hash = await bcrypt.hash(password, 10);
    const usuario = await User.create({
      name,
      email,
      password: hash,
      rol,
      sector_id,
      activo: true,
    });

    const creado = await User.findByPk(usuario.id, {
      attributes: ["id", "name", "email", "rol", "sector_id", "activo", "createdAt", "updatedAt"],
      include: [{ model: Sector, as: "sector", attributes: ["id", "nombre"] }],
    });

    return res.status(201).json(creado);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({ error: "Error al crear usuario" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    await ensureActivoColumn();

    const usuario = await User.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const rol = String(req.body.rol || "").trim();
    const sector_id = req.body.sector_id ? Number(req.body.sector_id) : null;
    const password = String(req.body.password || "");

    if (!name) return res.status(400).json({ error: "Falta nombre" });
    if (!email) return res.status(400).json({ error: "Falta email" });
    if (!ROLES.includes(rol)) return res.status(400).json({ error: "Rol invalido" });

    const duplicado = await User.findOne({
      where: { email },
      attributes: ["id"],
    });
    if (duplicado && Number(duplicado.id) !== Number(usuario.id)) {
      return res.status(400).json({ error: "Ya existe un usuario con ese email" });
    }

    usuario.name = name;
    usuario.email = email;
    usuario.rol = rol;
    usuario.sector_id = sector_id;

    if (password) {
      if (password.length < 4) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
      }
      usuario.password = await bcrypt.hash(password, 10);
    }

    await usuario.save();

    const actualizado = await User.findByPk(usuario.id, {
      attributes: ["id", "name", "email", "rol", "sector_id", "activo", "createdAt", "updatedAt"],
      include: [{ model: Sector, as: "sector", attributes: ["id", "nombre"] }],
    });

    return res.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

router.patch("/:id/estado", async (req, res) => {
  try {
    await ensureActivoColumn();

    const usuario = await User.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const activo = Boolean(req.body.activo);

    if (Number(usuario.id) === Number(req.user.id) && !activo) {
      return res.status(400).json({ error: "No podes darte de baja a vos misma" });
    }

    await sequelize.query(
      "UPDATE users SET activo = :activo, \"updatedAt\" = NOW() WHERE id = :id",
      {
        replacements: { activo, id: usuario.id },
        type: QueryTypes.UPDATE,
      }
    );

    const actualizado = await User.findByPk(usuario.id, {
      attributes: ["id", "name", "email", "rol", "sector_id", "activo", "createdAt", "updatedAt"],
      include: [{ model: Sector, as: "sector", attributes: ["id", "nombre"] }],
    });

    return res.json(actualizado);
  } catch (error) {
    console.error("Error al cambiar estado de usuario:", error);
    return res.status(500).json({ error: "Error al cambiar estado de usuario" });
  }
});

module.exports = router;
