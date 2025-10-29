import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
console.log("✅ Config loaded:", {
  PORT: process.env.PORT,
  DB: process.env.DB ? "defined" : "undefined",
});
