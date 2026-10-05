# syntax=docker/dockerfile:1.7
# OmniRoute-MS — ModelScope Studio wrapper.
# Uses the OFFICIAL prebuilt image (source build needs >8GB and fails on the
# free Studio builder). Pinned for reproducibility; bump deliberately.
# Source-level compat notes live in Dockerfile.source-build.bak + README.
FROM diegosouzapw/omniroute:3.8.51

# ModelScope Docker Studio contract: serve 0.0.0.0:7860, persist under /mnt/workspace.
ENV PORT=7860
ENV HOSTNAME=0.0.0.0
ENV DATA_DIR=/mnt/workspace/omniroute-data
ENV OMNIROUTE_ALLOW_DEFAULT_DATA_DIR=0

EXPOSE 7860

# Proven-pattern keep-alive (random 30min-15h, local activity, heartbeat file).
# Runs as the image's default (non-root) user; keeps upstream ENTRYPOINT intact.
COPY --chmod=755 keep-alive.sh /app/keep-alive.sh
CMD ["bash", "-c", "./keep-alive.sh >/dev/null 2>&1 & exec node dev/run-standalone.mjs"]
