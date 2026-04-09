# 310 - Meta TRIBE v2: Brain Prediction Model for Content Optimization

**Source:** @fuckgrowth on X (via ZOE inbox, Apr 8 2026)
**URL:** https://x.com/fuckgrowth/status/2041580077826371733
**Category:** AI Tools / Content Creation / Neuroscience
**Date:** 2026-04-08

## Summary

Meta's FAIR team open-sourced TRIBE v2 - a model trained on 1,000+ hours of fMRI brain scans from 720 volunteers watching videos, listening to audio, and reading text. It predicts how 70,000 brain points respond to any media input. A creator used it to re-edit a video based on neural engagement predictions and got 221,100 views (significantly above their baseline).

## How TRIBE v2 Works

1. **Training data:** fMRI recordings from 720 people consuming various media (movies, podcasts, text)
2. **What it predicts:** Neural response at 70,000 brain points for any new video/audio/text
3. **Key claim:** Predictions are more accurate than a single real brain scan (model strips noise from heartbeats, movement, device artifacts)
4. **Cost:** Free, fully open-source

## Setup (No Code Required)

1. Open Meta's Google Colab notebook (linked in TRIBE v2 repo)
2. Set runtime to T4 GPU
3. Run pip install, restart environment
4. Create Hugging Face account, generate read-access token
5. Request access to Llama model on HF (~1 hour approval)
6. Add HF_TOKEN to Colab secrets
7. Run cells - includes sample video for immediate testing

## The Experiment

- Took a creator's already-edited video
- Ran through TRIBE v2 to see engagement heatmap per second
- Re-edited: moved high-engagement moments earlier, cut dead zones, restructured pacing
- Result: 221,100 views vs. much lower baseline for previous videos

## Relevance to ZAO OS

**Music content optimization:**
- Could analyze music video content before posting to Farcaster
- Predict which segments of live Spaces recordings would make the best clips
- Optimize newsletter/social content previews

**Artist tools potential:**
- Help ZAO artists optimize their content before posting
- A/B test video thumbnails, intros, hooks using brain engagement predictions
- Could integrate into a future "content studio" feature

**Caution:**
- The post is from a growth marketing account promoting their own platform
- The 221K views claim is a single data point - not rigorous proof
- The model predicts brain response, not virality (many factors affect reach)
- Worth evaluating the actual paper/model independently before building on it

## References

- Meta TRIBE v2 paper (linked in original post)
- Google Colab demo notebook (in Meta's repo)
- Hugging Face model access required
