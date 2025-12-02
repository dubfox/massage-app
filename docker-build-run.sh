#!/bin/bash

# Build and run the Nantika massage app container on a specified host port.
# Usage:
#   ./docker-build-run.sh                      # build + run on port 3000 (detached)
#   ./docker-build-run.sh 8080                # build + run on port 8080 (detached)
#   ./docker-build-run.sh 8080 --no-build     # restart container on port 8080 without rebuilding
#   ./docker-build-run.sh 8080 --no-cache     # force rebuild without cache (picks up all code changes)

set -e

IMAGE_NAME="nantika-massage-app"
HOST_PORT="${1:-3000}"
SKIP_BUILD=false
NO_CACHE=""

if [ "$2" = "--no-build" ]; then
  SKIP_BUILD=true
elif [ "$2" = "--no-cache" ]; then
  NO_CACHE="--no-cache"
fi
CONTAINER_PORT=3000

cd "$(dirname "$0")"

if [ "$SKIP_BUILD" = false ]; then
  if [ -n "$NO_CACHE" ]; then
    echo "Building Docker image: ${IMAGE_NAME} (without cache to pick up all changes)..."
  else
    echo "Building Docker image: ${IMAGE_NAME}"
  fi
  docker build ${NO_CACHE} -t "${IMAGE_NAME}" .
else
  echo "Skipping build. Using existing image: ${IMAGE_NAME}"
fi

echo
echo "Running container from image '${IMAGE_NAME}' on host port ${HOST_PORT}..."
echo "(host:${HOST_PORT} -> container:${CONTAINER_PORT})"

# Stop any existing container with this name
docker stop "${IMAGE_NAME}" >/dev/null 2>&1 || true

# Check if port is already in use by another container
PORT_CONFLICT=$(docker ps --format "{{.Names}}" --filter "publish=${HOST_PORT}" 2>/dev/null || true)
if [ -n "$PORT_CONFLICT" ]; then
  echo "Warning: Port ${HOST_PORT} is already in use by container(s): ${PORT_CONFLICT}"
  echo "Stopping conflicting container(s)..."
  echo "$PORT_CONFLICT" | xargs -r docker stop >/dev/null 2>&1 || true
  sleep 1
fi

docker run -d --rm -p "${HOST_PORT}:${CONTAINER_PORT}" --name "${IMAGE_NAME}" "${IMAGE_NAME}"

echo
echo "Container '${IMAGE_NAME}' is running in the background."
echo "Stop it with: docker stop ${IMAGE_NAME}"


