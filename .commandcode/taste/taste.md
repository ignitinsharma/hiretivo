# Workflow
- Present analysis and plan before implementing changes — investigate root cause, confirm against actual code, then propose fix. Confidence: 0.85
- Consult DESIGN.md for button and component styling decisions before making UI changes. Confidence: 0.80

# Architecture
- Use `@react-pdf/renderer`'s `<Link>` component for clickable hyperlinks in PDF exports — displays visible URL text for ATS readability while creating real PDF URI annotations. Confidence: 0.70

# Dependencies
- For drag-and-drop in React: use @dnd-kit/core + @dnd-kit/sortable. Avoid react-beautiful-dnd (unmaintained, React 18 strict mode issues). Confidence: 0.65

[cmd]: https://commandcode.ai/

