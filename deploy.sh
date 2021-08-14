# echo "Stopping..."
# pm2 stop PUML --silent

echo "Installing..."
npm install
echo "Install success"

echo "Running..."
# pm2 start server.js --name PUML
pm2 restart PUML
echo "All steps success"