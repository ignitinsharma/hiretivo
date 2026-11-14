import { AiProvider } from "@/generated/prisma/enums";

import { WIKI, type Instruction } from "./instructions";

// The setup guide's AI step (E21-2): what people care about first, then one
// or two providers for it, each with what it costs, where the data goes and
// the steps to a key. Gemini's free tier is offered with its data use and rate
// limits spelled out; Mistral's says it may train, and OpenRouter's free
// models can go to providers that do. Resumes don't belong in the free tier
// (decided 5 November 2026).

export type AiPriority = "private" | "writing" | "cost" | "other";

export const AI_PRIORITIES: readonly { value: AiPriority; name: string; description: string }[] = [
  {
    value: "private",
    name: "Free and private",
    description: "AI that runs on your own computer: nothing leaves it, and it costs nothing. It needs a recent computer, and writing takes minutes rather than seconds.",
  },
  { value: "writing", name: "Best writing", description: "The best-known AI companies. You buy a little credit, and pay for what you use." },
  { value: "cost", name: "Lowest cost", description: "Gemini and Groq have free API plans with limits; Mistral offers smaller paid models." },
  { value: "other", name: "Something else", description: "OpenRouter, which reaches many companies' models with one key, or an AI server you already have." },
];

export type AiChoiceId = "lmstudio" | "ollama" | "openai" | "anthropic" | "gemini" | "groq" | "mistral" | "openrouter";

export type AiChoice = {
  id: AiChoiceId;
  priority: AiPriority;
  name: string;
  /** Who's behind it, or what it is, in a few words. */
  about: string;
  provider: AiProvider;
  /** A hosted one's address; a local one is looked for on this computer instead (LOCAL_ADDRESSES). */
  baseUrl: string;
  /** Models in the order Hiretivo would pick them; the first one the account has is used. Empty for a local one, whose models are the user's. */
  models: readonly string[];
  cost: string;
  data: string;
  /** For a local one: what the computer needs. */
  needs?: string;
  steps: readonly Instruction[];
  /** The key to paste, if any. */
  key: { label: string; startsWith?: string } | null;
  help: string;
};

const OPENROUTER_KEYS = "https://openrouter.ai/keys";

export const AI_CHOICES: readonly AiChoice[] = [
  {
    id: "lmstudio",
    priority: "private",
    name: "LM Studio",
    about: "An app that runs AI models on your computer, with no typing of commands.",
    provider: AiProvider.LMSTUDIO,
    baseUrl: "",
    models: [],
    cost: "Free.",
    data: "Nothing leaves your computer.",
    needs: "16 GB of memory or more works best; on Windows, a graphics card with 4 GB of its own memory helps a lot. Apple computers need an M-series chip.",
    steps: [
      { text: "Download LM Studio and install it.", link: { href: "https://lmstudio.ai/download", label: "LM Studio's download page" } },
      { text: "Open its **Discover** tab, search for **Qwen**, and download a 7B model. It's a download of a few gigabytes." },
      { text: "Open the **Developer** tab and switch the server on at the top. Leave LM Studio open." },
      { text: "If Hiretivo runs on another computer in your home, turn on **Serve on Local Network** in the server's settings." },
      { text: "Press **Find LM Studio** below." },
    ],
    key: null,
    help: `${WIKI}/Choosing-an-AI-provider#lm-studio`,
  },
  {
    id: "ollama",
    priority: "private",
    name: "Ollama",
    about: "Runs AI models on your computer. Getting a model takes one typed command.",
    provider: AiProvider.LOCAL,
    baseUrl: "",
    models: [],
    cost: "Free.",
    data: "Nothing leaves your computer, as long as you use a model that runs on it. Models whose names end in “cloud” run on Ollama's servers instead.",
    needs: "A recent computer: models are a download of several gigabytes, and they're slow without a strong graphics card. On a Mac, macOS Sonoma or newer.",
    steps: [
      { text: "Download Ollama and install it.", link: { href: "https://ollama.com/download", label: "Ollama's download page" } },
      { text: "Open a terminal (on Windows, **PowerShell**), type **ollama pull qwen2.5:7b** and press Enter. It downloads about 5 GB." },
      { text: "Leave Ollama running, then press **Find Ollama** below." },
    ],
    key: null,
    help: `${WIKI}/Choosing-an-AI-provider#local-model-with-ollama`,
  },
  {
    id: "openai",
    priority: "writing",
    name: "OpenAI",
    about: "The company behind ChatGPT.",
    provider: AiProvider.OPENAI,
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-6.1-terra", "gpt-6-luna"],
    cost: "You buy credit first, at least $5, and each resume or letter uses a little of it. A ChatGPT Plus subscription doesn't cover it.",
    data: "Your profile without your contact details, and the postings you add, go to OpenAI. It doesn't train its models on them unless you choose to share them.",
    steps: [
      { text: "Sign up or sign in on OpenAI's developer platform.", link: { href: "https://platform.openai.com/", label: "OpenAI's platform" } },
      { text: "Under **Billing**, add a card and buy at least $5 of credit. Auto-reload is switched on unless you switch it off." },
      {
        text: "Open **API keys** and press **Create new secret key**. For your first key, OpenAI sends a code to your phone by text message or WhatsApp.",
        link: { href: "https://platform.openai.com/api-keys", label: "OpenAI's API keys" },
      },
      { text: "Copy the key right away: it's shown only once. Paste it below." },
    ],
    key: { label: "OpenAI API key", startsWith: "sk-" },
    help: `${WIKI}/Choosing-an-AI-provider#openai`,
  },
  {
    id: "anthropic",
    priority: "writing",
    name: "Claude",
    about: "Anthropic's AI.",
    provider: AiProvider.ANTHROPIC,
    baseUrl: "https://api.anthropic.com",
    models: ["claude-sonnet-5-5", "claude-haiku-5-5"],
    cost: "You buy credit first, and each resume or letter uses a little of it. A Claude Pro subscription doesn't cover it.",
    data: "Your profile without your contact details, and the postings you add, go to Anthropic. It doesn't train its models on them by default.",
    steps: [
      { text: "Sign up or sign in on Claude's developer platform.", link: { href: "https://platform.claude.com/", label: "Claude's platform" } },
      { text: "Open **Billing**, press **Buy credits** and choose an amount.", link: { href: "https://platform.claude.com/settings/billing", label: "Billing" } },
      {
        text: "Open **API keys** and press **Create key**. Choose a workspace (the default one is fine) and set it to **Never** expire: that can't be changed later.",
        link: { href: "https://platform.claude.com/settings/keys", label: "Claude's API keys" },
      },
      { text: "Copy the key, which starts with sk-ant-. It's shown only once. Paste it below." },
    ],
    key: { label: "Claude API key", startsWith: "sk-ant-" },
    help: `${WIKI}/Choosing-an-AI-provider#anthropic`,
  },
  {
    id: "gemini",
    priority: "cost",
    name: "Gemini",
    about: "Google's AI, through Google AI Studio, with a free tier.",
    provider: AiProvider.GEMINI,
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: ["gemini-3.5-flash-lite", "gemini-3.8-flash"],
    cost: "A free tier with rate limits. Higher limits need billing in Google Cloud, and a Google AI subscription doesn't cover it.",
    data: "Your profile without your contact details, and the postings you add, go to Google. On the free tier Google may use them to improve its products, and people may review them. Billing changes the data terms.",
    steps: [
      { text: "Sign in to Google AI Studio with your Google account and accept its terms.", link: { href: "https://aistudio.google.com/", label: "Google AI Studio" } },
      {
        text: "On the **API keys** page, press **Create API key**. The free tier needs no card; set up billing there later for higher limits.",
        link: { href: "https://aistudio.google.com/api-keys", label: "AI Studio's API keys" },
      },
      { text: "Copy the key and paste it below." },
    ],
    key: { label: "Gemini API key" },
    help: `${WIKI}/Choosing-an-AI-provider#gemini`,
  },
  {
    id: "groq",
    priority: "cost",
    name: "Groq",
    about: "Fast hosted models with a free API plan and rate limits.",
    provider: AiProvider.GROQ,
    baseUrl: "https://api.groq.com/openai/v1",
    models: ["openai/gpt-oss-20b"],
    cost: "Groq offers a free API plan with model-specific limits. Paid plans are separate.",
    data: "The task data needed for AI work goes to Groq. Check Groq's account privacy and retention settings before sending a resume.",
    steps: [
      { text: "Create a Groq Console account.", link: { href: "https://console.groq.com/", label: "Groq Console" } },
      { text: "Create an API key and paste it below.", link: { href: "https://console.groq.com/keys", label: "Groq API keys" } },
      { text: "Review the limits for the model you select.", link: { href: "https://console.groq.com/docs/rate-limits", label: "Groq rate limits" } },
    ],
    key: { label: "Groq API key" },
    help: `${WIKI}/Choosing-an-AI-provider#openai-compatible-servers`,
  },
  {
    id: "mistral",
    priority: "cost",
    name: "Mistral",
    about: "A French AI company.",
    provider: AiProvider.MISTRAL,
    baseUrl: "https://api.mistral.ai/v1",
    models: ["mistral-small-2603", "mistral-small-latest"],
    cost: "You turn on pay-as-you-go and add credit first. Mistral's Pro subscription includes a little API credit each month.",
    data: "Your profile without your contact details, and the postings you add, go to Mistral. It may use them to improve its models until you switch that off, which is one of the steps.",
    steps: [
      { text: "Sign up or sign in on Mistral's console.", link: { href: "https://console.mistral.ai/", label: "Mistral's console" } },
      { text: "Under **Billing**, add a payment method, turn on pay-as-you-go and press **Add credits**." },
      { text: "In the **Admin Panel**, open **Privacy** and switch off **Anonymous improvement data**." },
      {
        text: "Open **API keys** and create a key. Copy it right away: it's shown only once. Paste it below.",
        link: { href: "https://console.mistral.ai/api-keys", label: "Mistral's API keys" },
      },
    ],
    key: { label: "Mistral API key" },
    help: `${WIKI}/Choosing-an-AI-provider#mistral`,
  },
  {
    id: "openrouter",
    priority: "other",
    name: "OpenRouter",
    about: "One key for many companies' models, free ones included. Hiretivo starts on a free model.",
    provider: AiProvider.OPENROUTER,
    baseUrl: "https://openrouter.ai/api/v1",
    models: ["meta-llama/llama-4.1-8b:free", "openai/gpt-6.1-terra", "google/gemini-3.8-flash"],
    cost: "Pay for what you use, plus OpenRouter's fee of about 5.5%. Some models are free, with lower limits.",
    data: "Your profile without your contact details, and the postings you add, go to OpenRouter and on to the model's company. Hiretivo asks OpenRouter to skip companies that train on what they're sent. Free models may still route to companies that train on or review it, so check the model's page before sending a resume.",
    steps: [
      { text: "Sign up or sign in on OpenRouter.", link: { href: "https://openrouter.ai/", label: "OpenRouter" } },
      { text: "Buy at least $5 of credit.", link: { href: "https://openrouter.ai/settings/credits", label: "OpenRouter's credits" } },
      { text: "In its privacy settings, don't allow providers that train on your data, for paid and free models.", link: { href: "https://openrouter.ai/settings/privacy", label: "OpenRouter's privacy settings" } },
      { text: "Create a key and give it a name. Copy it right away and paste it below.", link: { href: OPENROUTER_KEYS, label: "OpenRouter's keys" } },
    ],
    key: { label: "OpenRouter key", startsWith: "sk-or-" },
    help: `${WIKI}/Choosing-an-AI-provider#openai-compatible-servers`,
  },
];

export function aiChoice(id: AiChoiceId): AiChoice {
  return AI_CHOICES.find((choice) => choice.id === id)!;
}

/** Where a model on this computer usually answers: without Docker, from Docker on the same computer, and Compose's Ollama service. */
export const LOCAL_ADDRESSES: Record<"lmstudio" | "ollama", readonly string[]> = {
  lmstudio: ["http://localhost:1234", "http://host.docker.internal:1234"],
  ollama: ["http://localhost:11434", "http://host.docker.internal:11434", "http://ollama:11434"],
};

/** The model to use: the first of `wanted` the server lists (Gemini lists them as models/…), else the first wanted, if the list said nothing. */
export function pickModel(wanted: readonly string[], served: readonly string[]): string | null {
  const found = wanted.find((model) => served.some((id) => id === model || id === `models/${model}`));
  if (found) return found;
  return served.length === 0 ? (wanted[0] ?? null) : null;
}

/** Which of the guide's choices a saved provider and address are, if any. */
export function choiceOf(provider: AiProvider, baseUrl: string): AiChoiceId | null {
  if (provider === AiProvider.LMSTUDIO) return "lmstudio";
  if (provider === AiProvider.LOCAL) return "ollama";
  const host = URL.canParse(baseUrl) ? new URL(baseUrl).hostname : "";
  // Gemini and OpenRouter used to be saved as OpenAI-compatible, before they
  // had cards of their own.
  if (provider === AiProvider.OPENAI && host === "generativelanguage.googleapis.com") return "gemini";
  if (provider === AiProvider.OPENAI && host === "openrouter.ai") return "openrouter";
  return AI_CHOICES.find((choice) => choice.provider === provider && choice.baseUrl && new URL(choice.baseUrl).hostname === host)?.id ?? null;
}
