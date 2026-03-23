#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
};

function log(message = '', color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

function logStep(message) {
    log(`\n${'='.repeat(60)}`, colors.blue);
    log(`📌 ${message}`, colors.bright);
    log(`${'='.repeat(60)}\n`, colors.blue);
}

/**
 * Percorrer diretório recursivamente e encontrar arquivos
 */
function findFilesRecursive(dir, extensions, ignore = []) {
    const files = [];

    function walk(currentDir) {
        try {
            const entries = fs.readdirSync(currentDir);

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // Pular diretórios ignorados
                    if (!ignore.some((pattern) => fullPath.includes(pattern))) {
                        walk(fullPath);
                    }
                } else if (stat.isFile()) {
                    // Verificar se a extensão está na lista
                    const ext = path.extname(entry);
                    if (extensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            // Ignorar erros de permissão
        }
    }

    walk(dir);
    return files;
}

function findEnvVariablesInCode() {
    logStep('ETAPA 1: Procurando por variáveis de ambiente no código');

    const envVarsInCode = new Set();
    const projectRoot = path.join(__dirname, '..');

    // Procurar em src/
    const srcDir = path.join(projectRoot, 'src');
    const files = findFilesRecursive(srcDir, ['.js', '.mjs', '.ts', '.vue'], ['node_modules', 'dist']);

    // Regex para encontrar process.env.VITE_* ou import.meta.env.VITE_*
    const processEnvRegex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
    const importMetaRegex = /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g;

    logInfo(`Procurando em ${files.length} arquivo(s)...\n`);

    for (const filePath of files) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            let match;

            // Limpar regex
            processEnvRegex.lastIndex = 0;
            importMetaRegex.lastIndex = 0;

            // Procurar process.env
            while ((match = processEnvRegex.exec(content)) !== null) {
                const varName = match[1];
                if (varName.includes('VITE_')) {
                    envVarsInCode.add(varName);
                }
            }

            // Procurar import.meta.env
            while ((match = importMetaRegex.exec(content)) !== null) {
                const varName = match[1];
                // Incluir apenas variáveis customizadas VITE_
                if (varName.startsWith('VITE_')) {
                    envVarsInCode.add(varName);
                }
            }
        } catch (error) {
            // Ignorar erros ao ler arquivo
        }
    }

    if (envVarsInCode.size === 0) {
        logWarning('Nenhuma variável VITE_* encontrada no código\n');
        logInfo('Nota: O projeto usa import.meta.env que é automático no Vite\n');
        return envVarsInCode;
    }

    logSuccess(`Encontradas ${envVarsInCode.size} variável(is) de ambiente\n`);
    logInfo('Variáveis encontradas:');
    Array.from(envVarsInCode)
        .sort()
        .forEach((v) => logInfo(`  • ${v}`));
    log();

    return envVarsInCode;
}

function validateEnv(requiredVars) {
    logStep('ETAPA 2: Validando Arquivo .env');

    const projectRoot = path.join(__dirname, '..');
    const envPath = path.join(projectRoot, '.env');
    const envExamplePath = path.join(projectRoot, '.env.example');

    // Verificar se arquivo .env existe
    if (!fs.existsSync(envPath)) {
        logError('Arquivo .env não encontrado!');
        logInfo('Por favor, crie o arquivo .env na raiz do projeto');

        if (fs.existsSync(envExamplePath)) {
            logInfo('Dica: Você pode copiar de .env.example como base');
        }
        return false;
    }

    logSuccess('Arquivo .env encontrado\n');

    // Ler arquivo .env
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = new Map();

    envContent
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('#'))
        .forEach((line) => {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();
            envVars.set(key.trim(), value);
        });

    let missingVars = [];
    let emptyVars = [];

    logInfo('Validando variáveis de ambiente...\n');

    // Validar variáveis encontradas no código
    if (requiredVars.size > 0) {
        for (const varName of Array.from(requiredVars).sort()) {
            if (!envVars.has(varName)) {
                missingVars.push(varName);
                logError(`  ✗ ${varName} - NÃO DEFINIDO NO .env`);
            } else {
                const value = envVars.get(varName);
                if (!value || value === '') {
                    emptyVars.push(varName);
                    logWarning(`  ⊘ ${varName} - VAZIO`);
                } else {
                    logSuccess(`  ✓ ${varName}`);
                }
            }
        }
    } else {
        logInfo('Nenhuma variável customizada definida no código\n');
    }

    log();

    if (missingVars.length > 0) {
        logError(`Variáveis não definidas no .env: ${missingVars.length}\n`);
        missingVars.forEach((v) => logError(`  - ${v}=`));
        return false;
    }

    if (emptyVars.length > 0) {
        logError(`Variáveis vazias no .env: ${emptyVars.length}\n`);
        emptyVars.forEach((v) => logError(`  - ${v}=`));
        return false;
    }

    if (requiredVars.size > 0) {
        logSuccess(`Todas as ${requiredVars.size} variável(is) estão configuradas corretamente\n`);
    } else {
        logSuccess('Arquivo .env válido\n');
    }

    return true;
}

function buildProject() {
    logStep('ETAPA 3: Compilando Projeto com Vite');

    try {
        logInfo('Executando: npm run build\n');
        execSync('npm run build', { stdio: 'inherit' });
        log();
        logSuccess('Build realizado com sucesso!\n');
        return true;
    } catch (error) {
        log();
        logError('Erro ao compilar o projeto');
        return false;
    }
}

async function main() {
    log('\n🚀 Iniciando processo de deploy...\n', colors.bright);

    // Etapa 1: Procurar variáveis de ambiente no código
    const requiredVars = findEnvVariablesInCode();

    // Etapa 2: Validar .env
    const envValid = validateEnv(requiredVars);
    if (!envValid) {
        log();
        logError('Deploy abortado: Variáveis de ambiente inválidas\n');
        process.exit(1);
    }

    // Etapa 3: Build
    const buildSuccess = buildProject();
    if (!buildSuccess) {
        log();
        logError('Deploy abortado: Erro na compilação\n');
        process.exit(1);
    }

    // Sucesso
    logStep('✅ DEPLOY REALIZADO COM SUCESSO!');
    logSuccess('Projeto compilado e pronto para produção');
    logInfo(`Distrib: ${path.join(__dirname, '..', 'dist')}\n`);
}

main().catch((error) => {
    log();
    logError('Erro inesperado durante deploy');
    console.error(error);
    process.exit(1);
});
