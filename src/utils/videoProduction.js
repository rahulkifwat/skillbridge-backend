const env = require("../config/env");
const { buildLayout } = require("./videoLayoutEngine");

function productionFlags() {
  return {
    heygen: Boolean(env.videoProduction.heygenKey),
    synthesia: Boolean(env.videoProduction.synthesiaKey),
    elevenlabs: Boolean(env.videoProduction.elevenLabsKey),
    assetBucket: Boolean(env.videoProduction.assetBucket),
    openai: Boolean(env.ai.openaiKey),
    claude: Boolean(env.ai.anthropicKey),
    monthlyBudgetUsd: env.ai.monthlyBudgetUsd,
  };
}

function resolveProducedSrc(video) {
  const bucket = String(env.videoProduction.assetBucket || "").replace(/\/$/, "");
  if (bucket && video?.bucketKey) return `${bucket}/${video.bucketKey}`;
  if (video?.src) return video.src;
  return null;
}

function publicLesson(video) {
  const layout = buildLayout(video);
  const flags = productionFlags();
  const producedSrc = resolveProducedSrc(video);
  return {
    ...video,
    src: producedSrc,
    layout,
    pipeline: {
      visual: flags.heygen ? "heygen" : flags.synthesia ? "synthesia" : "loop-core",
      audio: flags.elevenlabs ? "elevenlabs" : "browser-neural-tts",
      producedAsset: Boolean(producedSrc),
    },
  };
}

module.exports = { productionFlags, resolveProducedSrc, publicLesson };
