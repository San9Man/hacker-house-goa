import formidable from "formidable";
import fs from "node:fs/promises";

export const config = {
  api: {
    bodyParser: false
  }
};

function parseForm(req) {
  const form = formidable({
    maxFileSize: 4 * 1024 * 1024,
    maxFiles: 1
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { fields, files } = await parseForm(req);

    const photo = Array.isArray(files.photo)
      ? files.photo[0]
      : files.photo;

    if (!photo) {
      return res.status(400).json({
        error: "Please upload a photo first."
      });
    }

    const style = Array.isArray(fields.style)
      ? fields.style[0]
      : fields.style || "Goa Matchbox";

    const twist = Array.isArray(fields.twist)
      ? fields.twist[0]
      : fields.twist || "";

    const imageBuffer = await fs.readFile(photo.filepath);

    const formData = new FormData();

    formData.append("model", "gpt-image-1");
    formData.append(
      "prompt",
      `
Transform this person into a Hacker House Goa 2026 alter-ego.

Visual direction: ${style}.
Optional detail: ${twist}.

Preserve the person's recognisable facial identity, pose and overall expression.
Create a friendly, high-quality portrait suitable for a social-event builder card.
Use a Goa-inspired palette: tropical green, sunshine yellow, cream and vibrant pink.
Do not add text, logos, watermarks, badges, frames or extra people.
      `.trim()
    );

    formData.append(
      "image",
      new Blob([imageBuffer], {
        type: photo.mimetype || "image/png"
      }),
      photo.originalFilename || "photo.png"
    );

    formData.append("size", "1024x1024");
    formData.append("output_format", "png");

    const response = await fetch(
      "https://api.openai.com/v1/images/edits",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(result);

      return res.status(response.status).json({
        error: result?.error?.message || "Image generation failed."
      });
    }

    const base64Image = result?.data?.[0]?.b64_json;

    if (!base64Image) {
      return res.status(500).json({
        error: "The image service returned no image."
      });
    }

    return res.status(200).json({
      image: `data:image/png;base64,${base64Image}`
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Could not create your Goa Alter-Ego."
    });
  }
}