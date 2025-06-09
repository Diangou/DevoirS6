import express from "express";
import multer from "multer";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();  // Charge les variables d’environnement depuis .env
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);  // Pour vérifier

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());

const supabaseUrl = process.env.SUPABASE_URL;              // Ta variable d'env
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;  // Ta variable d'env
const supabase = createClient(supabaseUrl, supabaseKey);

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const gameName = req.body.game_name;

    if (!file || !gameName) {
      return res.status(400).json({ error: "Fichier ou nom du jeu manquant." });
    }

    const fileName = file.originalname;
    const fileBuffer = file.buffer;
    const bucketName = "jaquettes";

    const filePath = `${gameName}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.mimetype,
      });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    const { error: dbError } = await supabase
      .from("game_covers")
      .insert([
        {
          game_name: gameName,
          file_name: fileName,
          file_url: publicUrl,
        },
      ]);

    if (dbError) {
      return res.status(500).json({ error: dbError.message });
    }

    res.json({ message: "Upload réussi", url: publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(3000, () => {
  console.log("Serveur démarré sur http://localhost:3000");
});

app.get("/list-jaquettes", async (req, res) => {
  try {
    const bucketName = "jaquettes";
    const { data: folders, error: listError } = await supabase.storage.from(bucketName).list("", {
      limit: 100,
    });

    if (listError) {
      return res.status(500).json({ error: listError.message });
    }

    const allFiles = [];

    for (const folder of folders) {
      if (folder.name && !folder.name.includes(".")) {
        const { data: filesInFolder, error: folderError } = await supabase.storage.from(bucketName).list(folder.name);

        if (folderError) {
          console.error("Erreur dans le dossier", folder.name, folderError.message);
          continue;
        }

        for (const file of filesInFolder) {
          const filePath = `${folder.name}/${file.name}`;
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

          allFiles.push({
            name: folder.name, // <= correspond à version.name de la pokeAPI
            url: urlData.publicUrl,
          });
        }
      }
    }

    res.json(allFiles);
  } catch (err) {
    console.error("Erreur dans /list-jaquettes :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});