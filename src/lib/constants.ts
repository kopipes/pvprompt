// Pre-configured AI tools
export const AI_TOOLS = [
    { value: "midjourney", label: "Midjourney", icon: "🎨" },
    { value: "dall-e-3", label: "DALL-E 3", icon: "🖼️" },
    { value: "dall-e-2", label: "DALL-E 2", icon: "🖼️" },
    { value: "chatgpt", label: "ChatGPT", icon: "💬" },
    { value: "stable-diffusion", label: "Stable Diffusion", icon: "🌟" },
    { value: "stable-diffusion-xl", label: "Stable Diffusion XL", icon: "🌟" },
    { value: "leonardo-ai", label: "Leonardo AI", icon: "🎭" },
    { value: "flux", label: "Flux", icon: "⚡" },
    { value: "ideogram", label: "Ideogram", icon: "✏️" },
    { value: "firefly", label: "Adobe Firefly", icon: "🔥" },
    { value: "imagen", label: "Google Imagen", icon: "🌈" },
    { value: "gemini", label: "Gemini", icon: "💎" },
    { value: "claude", label: "Claude", icon: "🤖" },
    { value: "nano-banana", label: "Nano Banana", icon: "🍌" },
    { value: "comfyui", label: "ComfyUI", icon: "🔧" },
    { value: "automatic1111", label: "Automatic1111", icon: "🔧" },
    { value: "other", label: "Other", icon: "📝" },
] as const;

export const ASPECT_RATIOS = [
    { value: "1:1", label: "1:1 (Square)" },
    { value: "4:3", label: "4:3 (Standard)" },
    { value: "3:4", label: "3:4 (Portrait)" },
    { value: "16:9", label: "16:9 (Widescreen)" },
    { value: "9:16", label: "9:16 (Vertical)" },
    { value: "3:2", label: "3:2 (Photo)" },
    { value: "2:3", label: "2:3 (Portrait Photo)" },
    { value: "21:9", label: "21:9 (Ultrawide)" },
] as const;

export const DEFAULT_CATEGORIES = [
    { name: "Character Design", color: "#ef4444", description: "Character and avatar prompts" },
    { name: "Landscape", color: "#22c55e", description: "Nature and scenery prompts" },
    { name: "Abstract", color: "#8b5cf6", description: "Abstract and artistic prompts" },
    { name: "Portrait", color: "#f59e0b", description: "Portrait and face prompts" },
    { name: "Architecture", color: "#06b6d4", description: "Building and structure prompts" },
] as const;
