app.get("/api/geocode", async (req, res) => {
  try {
    const address = (req.query.address || "").trim();
    if (!address)
      return res.status(400).json({ message: "address is required" });
    if (!process.env.DISTANCEMATRIX_API_KEY) {
      return res
        .status(500)
        .json({ message: "Missing DISTANCEMATRIX_API_KEY in .env" });
    }
    const url = `https://api.distancematrix.ai/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${process.env.DISTANCEMATRIX_API_KEY}`;
    const r = await fetch(url);
    const data = await r.json();

    const results = data.results || data.result;
    if (data.status !== "OK" || !results?.length) {
      return res
        .status(404)
        .json({ message: "Coordinates not found", raw: data });
    }
    const loc = results[0].geometry.location;
    return res.json({ lat: loc.lat, lng: loc.lng });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Geocoding error" });
  }
});
