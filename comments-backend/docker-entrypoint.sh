#!/bin/sh

# Wait for MongoDB to be ready
echo "Waiting for MongoDB..."
while ! nc -z mongodb 27017; do
  sleep 0.5
done

echo "Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 0.5
done

npm run build

npm run seed

npm run start