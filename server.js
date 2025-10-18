import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

// Read these from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Basic guard
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Simple health
app.get("/", (_, res) => res.send({ status: "ok", model: "y = 4x + 2" }));

// POST /predict { size: number }
app.post("/predict", async (req, res) => {
  try {
    const { size } = req.body;
    const x = Number(size);
    if (Number.isNaN(x)) return res.status(400).json({ error: "size must be a number" });

    // The linear model y = 4x + 2
    const prediction = 4 * x + 2;

    // Insert into Supabase table "predictions"
    const { data, error } = await supabase
      .from("predictions")
      .insert({
        input_size: x,
        prediction: prediction
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      // still return prediction but include error info
      return res.status(500).json({ error: "db_error", details: error.message });
    }

    return res.json({
      input_size: x,
      prediction,
      stored: data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
