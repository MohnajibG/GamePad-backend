const express = require("express");
const User = require("../Models/User");

const router = express.Router();

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

// Route de signup
router.post("/user/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérification des paramètres
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    // Vérification de l'email déjà existant
    const userEmail = await User.findOne({ email });
    if (userEmail) {
      return res.status(409).json({ message: "Email already in database" });
    }

    // Vérification de la longueur du mot de passe
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Génération du hash et du salt
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);

    // Génération du token
    const token = uid2(16);

    // Création du nouvel utilisateur
    const newUser = new User({
      username,
      email,
      token,
      hash,
      salt,
    });

    console.log(newUser);

    // Sauvegarde du nouvel utilisateur
    await newUser.save();

    return res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});

// Route de login
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérification des paramètres
    if (!email || !password) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    // Recherche de l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validation du mot de passe
    const hash = SHA256(password + user.salt).toString(encBase64);
    if (hash !== user.hash) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Renvoi du token et du nom d'utilisateur
    return res.status(200).json({ token: user.token, username: user.username });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
