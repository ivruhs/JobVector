// utils/cleanParsedText.js
export const cleanParsedText = (text) => {
  if (!text) return "";

  let cleanedText = text
    // Remove excessive whitespace and normalize
    .replace(/\s+/g, " ")
    .trim()

    // Add line breaks before major sections
    .replace(
      /(PROFESSIONAL SUMMARY|TECHNICAL SKILLS|PROFESSIONAL EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|OTHER DETAILS|SKILLS|EXPERIENCE|SUMMARY)/gi,
      "\n\n$1"
    )

    // Add line breaks before contact info patterns
    .replace(
      /(Name:|Phone:|Email:|LinkedIn:|GitHub:|Portfolio:|Location:)/gi,
      "\n$1"
    )

    // Add line breaks before job titles and companies
    .replace(
      /([a-zA-Z\s]+)\s+([A-Z][a-zA-Z\s&.,]+(?:Pvt\.?\s*Ltd\.?|Inc\.?|Corp\.?|LLC|Solutions|Technologies|Systems|Software|Services))/g,
      "\n\n$1\n$2"
    )

    // Add line breaks before dates (common resume date patterns)
    .replace(
      /\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s+(\d{4}|\d{1,2}\/\d{4}|Present)/gi,
      "\n$1 $2"
    )

    // Add line breaks before bullet points
    .replace(/\s*•\s*/g, "\n• ")
    .replace(/\s*-\s*([A-Z])/g, "\n- $1")

    // Add line breaks before degree/education info
    .replace(
      /(Bachelor|Master|PhD|B\.Tech|M\.Tech|B\.E|M\.E|BCA|MCA|B\.Sc|M\.Sc)/gi,
      "\n\n$1"
    )

    // Add line breaks before years in parentheses (usually education years)
    .replace(/\s+\((\d{4}\s*[-–]\s*\d{4})\)/g, "\n($1)")

    // Add line breaks before CGPA/GPA
    .replace(/\s+(CGPA|GPA):/gi, "\n$1:")

    // Add line breaks before project numbers
    .replace(/\s+(\d+\.\s*[A-Z])/g, "\n\n$1")

    // Add line breaks before Stack: or Technologies:
    .replace(/\s+(Stack:|Technologies:|Features:|GitHub:)/gi, "\n$1")

    // Clean up multiple consecutive line breaks
    .replace(/\n{3,}/g, "\n\n")

    // Clean up spaces before line breaks
    .replace(/\s+\n/g, "\n")

    // Ensure sections are properly spaced
    .replace(/\n([A-Z\s]{3,})\n/g, "\n\n$1\n")

    .trim();

  // Post-processing: ensure key sections start on new lines
  const keywordBreaks = [
    "PROFESSIONAL SUMMARY",
    "TECHNICAL SKILLS",
    "PROFESSIONAL EXPERIENCE",
    "EDUCATION",
    "PROJECTS",
    "CERTIFICATIONS",
    "OTHER DETAILS",
  ];

  keywordBreaks.forEach((keyword) => {
    const regex = new RegExp(`(.+)(${keyword})`, "gi");
    cleanedText = cleanedText.replace(regex, "$1\n\n$2");
  });

  return cleanedText;
};
