#!/bin/bash

# Build and run the Nantika massage app container on a specified host port.
# Usage:
#   ./docker-build-run.sh                   # build + run on port 3000 (detached)
#   ./docker-build-run.sh 8080              # build + run on port 8080 (detached)
#   ./docker-build-run.sh 8080 --no-build   # restart container on port 8080 without rebuilding

set -e

IMAGE_NAME="nantika-massage-app"
HOST_PORT="${1:-3000}"
SKIP_BUILD=false

if [ "$2" = "--no-build" ]; then
  SKIP_BUILD=true
fi
CONTAINER_PORT=3000

cd "$(dirname "$0")"

if [ "$SKIP_BUILD" = false ]; then
  echo "Building Docker image: ${IMAGE_NAME}"
  docker build -t "${IMAGE_NAME}" .
else
  echo "Skipping build. Using existing image: ${IMAGE_NAME}"
fi

echo
echo "Running container from image '${IMAGE_NAME}' on host port ${HOST_PORT}..."
echo "(host:${HOST_PORT} -> container:${CONTAINER_PORT})"

# Stop any existing container with this name
docker stop "${IMAGE_NAME}" >/dev/null 2>&1 || true

docker run -d --rm -p "${HOST_PORT}:${CONTAINER_PORT}" --name "${IMAGE_NAME}" "${IMAGE_NAME}"

echo
echo "Container '${IMAGE_NAME}' is running in the background."
echo "Stop it with: docker stop ${IMAGE_NAME}"


