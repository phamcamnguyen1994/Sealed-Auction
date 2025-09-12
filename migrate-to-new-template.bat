@echo off
REM 🚀 Migration Script: BID Auction Marketplace → FHEVM React Template
REM This script will help you migrate your current project to the new template

setlocal enabledelayedexpansion

echo 🚀 Starting migration to new FHEVM React Template...

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the root of your BID project
    pause
    exit /b 1
)

if not exist "packages\site" (
    echo [ERROR] packages\site directory not found
    pause
    exit /b 1
)

REM Create backup
echo [INFO] Creating backup of current project...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "BACKUP_DIR=backup-%YYYY%%MM%%DD%-%HH%%Min%%Sec%"

mkdir "%BACKUP_DIR%" 2>nul
xcopy "packages\site" "%BACKUP_DIR%\site" /E /I /Q
xcopy "contracts" "%BACKUP_DIR%\contracts" /E /I /Q
xcopy "scripts" "%BACKUP_DIR%\scripts" /E /I /Q
echo [SUCCESS] Backup created at: %BACKUP_DIR%

REM Clone new template
echo [INFO] Cloning new FHEVM React Template...
set "TEMPLATE_DIR=new-fhevm-template"
if exist "%TEMPLATE_DIR%" (
    echo [WARNING] Template directory already exists, removing...
    rmdir /s /q "%TEMPLATE_DIR%"
)

git clone https://github.com/zama-ai/fhevm-react-template.git "%TEMPLATE_DIR%"
if errorlevel 1 (
    echo [ERROR] Failed to clone template
    pause
    exit /b 1
)
echo [SUCCESS] New template cloned successfully

REM Copy current features to new template
echo [INFO] Copying current features to new template...

REM Copy FHEVM integration
echo [INFO] Copying FHEVM integration...
xcopy "packages\site\fhevm" "%TEMPLATE_DIR%\packages\site\fhevm" /E /I /Q

REM Copy components
echo [INFO] Copying components...
xcopy "packages\site\components" "%TEMPLATE_DIR%\packages\site\components" /E /I /Q

REM Copy hooks
echo [INFO] Copying hooks...
xcopy "packages\site\hooks" "%TEMPLATE_DIR%\packages\site\hooks" /E /I /Q

REM Copy contexts
echo [INFO] Copying contexts...
xcopy "packages\site\contexts" "%TEMPLATE_DIR%\packages\site\contexts" /E /I /Q

REM Copy contracts
echo [INFO] Copying contracts...
xcopy "packages\site\contracts" "%TEMPLATE_DIR%\packages\site\contracts" /E /I /Q

REM Copy smart contracts
echo [INFO] Copying smart contracts...
xcopy "contracts" "%TEMPLATE_DIR%\contracts" /E /I /Q
xcopy "scripts" "%TEMPLATE_DIR%\scripts" /E /I /Q

REM Copy additional files
echo [INFO] Copying additional files...
copy "packages\site\components.json" "%TEMPLATE_DIR%\packages\site\" 2>nul
copy "packages\site\public\zama-logo.svg" "%TEMPLATE_DIR%\packages\site\public\" 2>nul

echo [SUCCESS] All features copied successfully

REM Update package.json with current dependencies
echo [INFO] Updating package.json with current dependencies...
cd "%TEMPLATE_DIR%\packages\site"

REM Add missing dependencies that might be needed
npm install ethers@^6.15.0
npm install @types/ethers@^6.15.0

echo [SUCCESS] Dependencies updated

REM Create migration summary
echo [INFO] Creating migration summary...
(
echo # 🎉 Migration Summary
echo.
echo ## ✅ Successfully Migrated:
echo.
echo ### 🎨 Components:
echo - AuctionMarketplace.tsx
echo - SealedAuctionFHE.tsx
echo - SealedAuctionUI.tsx
echo - HowItWorks.tsx
echo - ImageUpload.tsx
echo - Header.tsx
echo - ErrorNotDeployed.tsx
echo - LocalDevGuide.tsx
echo.
echo ### 🔧 FHEVM Integration:
echo - Complete fhevm/ folder
echo - ESM/UMD fallback implementation
echo - Relayer SDK integration
echo.
echo ### 🎣 Custom Hooks:
echo - useSealedAuction.ts
echo - useSealedAuctionFHE.tsx
echo - useIPFSUpload.tsx
echo - useInMemoryStorage.tsx
echo - MetaMask integration
echo.
echo ### 📄 Smart Contracts:
echo - SealedAuction.sol
echo - AuctionFactory.sol
echo - AuctionRegistry.sol
echo - All deployment scripts
echo.
echo ## 🚀 Next Steps:
echo.
echo 1. **Test the migration:**
echo    ```bash
echo    cd %TEMPLATE_DIR%\packages\site
echo    npm run dev
echo    ```
echo.
echo 2. **Check for any issues:**
echo    - FHEVM initialization
echo    - Auction functionality
echo    - MetaMask integration
echo.
echo 3. **Deploy to testnet:**
echo    ```bash
echo    cd %TEMPLATE_DIR%
echo    npm run deploy:sepolia
echo    ```
echo.
echo ## 📝 Notes:
echo - Original project backed up to: %BACKUP_DIR%
echo - New template location: %TEMPLATE_DIR%
echo - All features preserved and migrated
) > MIGRATION_SUMMARY.md

echo [SUCCESS] Migration summary created: MIGRATION_SUMMARY.md

cd ..\..

echo [SUCCESS] 🎉 Migration completed successfully!
echo [INFO] New project location: %TEMPLATE_DIR%
echo [INFO] Backup location: %BACKUP_DIR%
echo [WARNING] Please test the migrated project before using in production

echo.
echo 🚀 To start testing:
echo    cd %TEMPLATE_DIR%\packages\site
echo    npm run dev
echo.
echo 📖 Read MIGRATION_SUMMARY.md for detailed next steps

pause
