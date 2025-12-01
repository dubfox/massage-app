#!/bin/bash

# Build and run the Nantika massage app container on a specified host port.
# Usage:
#   ./docker-build-run.sh             # uses default host port 3000 (detached)
#   ./docker-build-run.sh 8080        # maps host 8080 -> container 3000 (detached)

set -e

IMAGE_NAME="nantika-massage-app"
HOST_PORT="${1:-3000}"
CONTAINER_PORT=3000

echo "Building Docker image: ${IMAGE_NAME}"

cd "$(dirname "$0")"

docker build -t "${IMAGE_NAME}" .

echo
echo "Running container from image '${IMAGE_NAME}' on host port ${HOST_PORT}..."
echo "(host:${HOST_PORT} -> container:${CONTAINER_PORT})"

docker run -d --rm -p "${HOST_PORT}:${CONTAINER_PORT}" --name "${IMAGE_NAME}" "${IMAGE_NAME}"

echo
echo "Container '${IMAGE_NAME}' is running in the background."
echo "Stop it with: docker stop ${IMAGE_NAME}"


