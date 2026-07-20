$ErrorActionPreference = "Stop"

Write-Host "Checking Node.js and npm..."
node -v
npm -v

Write-Host "Removing incomplete dependency files..."
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "Verifying npm cache..."
npm cache verify

Write-Host "Using the public npm registry..."
npm config set registry https://registry.npmjs.org/

Write-Host "Installing dependencies..."
npm install

Write-Host "Installation completed. Starting CampusFind AI..."
npm run dev
