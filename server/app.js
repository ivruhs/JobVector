// api/index.js
import app from "../server/index.js";

export default function handler(req, res) {
  return app(req, res);
}
