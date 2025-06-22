// preloadModel.js
import { pipeline } from "@xenova/transformers";

const run = async () => {
  console.log("📦 Downloading model from Xenova...");
  await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log("✅ Model downloaded and cached");
};

run();
