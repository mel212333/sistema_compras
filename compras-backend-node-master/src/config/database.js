const { Sequelize } = require("sequelize");

const commonOptions = {
  dialect: "postgres",
  logging: false,
};

const sslOptions = {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

const isLocalHost = (host) => ["localhost", "127.0.0.1"].includes(host);
const urlRequiresSsl = (url) => /sslmode=require/i.test(String(url || ""));
const useSsl =
  process.env.DB_SSL === "true" ||
  (process.env.DATABASE_URL && urlRequiresSsl(process.env.DATABASE_URL));

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      ...commonOptions,
      ...(useSsl ? sslOptions : {}),
    })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
      ...commonOptions,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      ...(!isLocalHost(process.env.DB_HOST) && useSsl ? sslOptions : {}),
    });

module.exports = sequelize;
