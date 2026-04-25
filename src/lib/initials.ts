export function getInitials(input: {
  name?: string | null;
  companyName?: string | null;
}): string {
  const company = input.companyName?.trim();
  if (company) return company.charAt(0).toUpperCase();

  const name = input.name?.trim();
  if (!name) return "?";

  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "?";
  if (tokens.length === 1) return tokens[0].charAt(0).toUpperCase();

  const first = tokens[0].charAt(0);
  const last = tokens[tokens.length - 1].charAt(0);
  return `${first}${last}`.toUpperCase();
}
