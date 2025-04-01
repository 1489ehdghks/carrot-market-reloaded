export interface VAE {
  id: string;
  name: string;
  description: string;
}

export const VAE_OPTIONS: VAE[] = [
  {
    id: "vae-ft-mse",
    name: "VAE FT MSE",
    description: "MSE loss로 fine-tuned된 VAE"
  },
  {
    id: "vae-ft-mse-ema",
    name: "VAE FT MSE EMA",
    description: "EMA로 fine-tuned된 VAE"
  },
  {
    id: "vae-ft-mse-ema-ema",
    name: "VAE FT MSE EMA EMA",
    description: "EMA로 fine-tuned된 VAE (2차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (3차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (4차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (5차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (6차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (7차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (8차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (9차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (10차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (11차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (12차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (13차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (14차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (15차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (16차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (17차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (18차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (19차)"
  },
  {
    id: "vae-ft-mse-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema-ema",
    name: "VAE FT MSE EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA EMA",
    description: "EMA로 fine-tuned된 VAE (20차)"
  }
];

export function getDefaultVae(): VAE {
  return VAE_OPTIONS[0];
} 