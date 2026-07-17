import { openrouter, getAIModel } from "@/lib/openrouter";
import { ResumeDocumentSchema, type ResumeDocument } from "@/lib/validations/resume.schema";

export const USER_ID_PLACEHOLDER = "__profile_placeholder__";

export async function parseResumeWithVision(
  pdfBuffer: Buffer,
): Promise<ResumeDocument | null> {
  const base64 = pdfBuffer.toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  const systemPrompt = `You are a resume parser. You extract structured JSON from PDF resumes. Follow the JSON template below exactly — fill in the values, keep the structure.

Rules:
- Extract ALL text verbatim — do not summarize or rewrite bullet points
- Preserve original wording of summaries and descriptions
- Capture dates exactly as shown (MMM YYYY format)
- Assign priority 1 to every bullet
- Generate a unique id (cuid-like string) for each array entry
- Group skills into categories (e.g. "Languages", "Frameworks & Libraries", "Tools", "Cloud & DevOps")
- For empty sections, use [] — never omit array fields
- For missing optional single-value fields, use null — never omit them
- matchMeta: matchScore null, empty arrays for keywords, 0 for counts

Return ONLY the JSON object — no markdown, no code fences, no explanation.

JSON template:
{
  "personalInfo": {
    "name": "Full name",
    "email": "email@example.com",
    "phone": "+1 234 567 890",
    "location": "City, State" or null,
    "linkedin": "https://linkedin.com/in/username" or null,
    "github": "https://github.com/username" or null,
    "websiteUrl": "https://example.com" or null,
    "twitter": null
  },
  "summary": "Full professional summary text from the resume or empty string",
  "experience": [
    {
      "id": "unique_id_1",
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, State" or null,
      "startDate": "Jan 2020",
      "endDate": "Mar 2023" or null,
      "current": false,
      "bullets": [
        { "id": "bullet_1", "text": "Full bullet point text", "priority": 1 }
      ]
    }
  ],
  "projects": [
    {
      "id": "proj_1",
      "name": "Project Name",
      "link": "https://..." or null,
      "bullets": [
        { "id": "proj_bullet_1", "text": "Description of work", "priority": 1 }
      ]
    }
  ],
  "education": [
    {
      "id": "edu_1",
      "institution": "University Name",
      "degree": "Bachelor of Science in Computer Science",
      "startDate": "Aug 2016",
      "endDate": "May 2020"
    }
  ],
  "skills": {
    "categories": [
      { "name": "Languages", "items": ["TypeScript", "Python"] }
    ]
  },
  "certifications": [
    {
      "id": "cert_1",
      "name": "Certification Name",
      "issuer": "Issuing Organization" or null,
      "date": "Jun 2022" or null
    }
  ],
  "languages": [
    {
      "id": "lang_1",
      "name": "Language Name",
      "proficiency": "Native" or null
    }
  ],
  "matchMeta": {
    "matchScore": null,
    "addedKeywords": [],
    "missingKeywords": [],
    "requiredSkillsMatched": 0,
    "requiredSkillsTotal": 0,
    "preferredSkillsMatched": 0,
    "preferredSkillsTotal": 0
  }
}`;

  const userPrompt = `Parse this PDF resume into the JSON template shown above. Extract every section you can find, preserving original wording.`;

  try {
    console.log("[parseResumeWithVision] Sending PDF to AI, base64 size:", (base64.length / 1024).toFixed(0), "KB");
    const completion = await openrouter.chat.completions.create({
      model: getAIModel(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text" as const, text: userPrompt },
            {
              type: "file" as const,
              file: {
                filename: "resume.pdf",
                file_data: dataUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    if (!raw) {
      console.error("[parseResumeWithVision] Empty response from AI");
      return null;
    }
    return parseAndValidate(raw);
  } catch (err) {
    console.error("[parseResumeWithVision] AI call failed:", err);
    return null;
  }
}

function parseAndValidate(raw: string): ResumeDocument | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    const doc = {
      ...parsed,
      profileId: USER_ID_PLACEHOLDER,
      resumeVersionId: null,
      applicationId: null,
      sourceType: "uploaded" as const,
      generatedAt: new Date().toISOString(),
    };

    const result = ResumeDocumentSchema.safeParse(doc);
    if (!result.success) {
      console.error("[parseAndValidate] Schema validation failed:", result.error.format());
      return null;
    }
    return result.data as ResumeDocument;
  } catch (err) {
    console.error("[parseAndValidate] JSON parsing failed:", err, "\nRaw AI response:", raw);
    return null;
  }
}
