#!/usr/bin/env node

/**
 * File Conflict Validator
 * 
 * This script checks for potential file conflicts between the root project
 * and Documents/disco-agent-saas to prevent accidental file mixing.
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkExists(filepath) {
    return fs.existsSync(filepath);
}

function validateProjectSeparation() {
    log('\n🔍 Validating project separation...', 'yellow');
    
    const checks = [
        {
            name: 'Root .gitignore exists',
            path: '.gitignore',
            required: true
        },
        {
            name: 'Root tsconfig.json exists',
            path: 'tsconfig.json',
            required: true
        },
        {
            name: 'Root package.json exists',
            path: 'package.json',
            required: true
        },
        {
            name: 'disco-agent-saas tsconfig.json exists',
            path: 'Documents/disco-agent-saas/tsconfig.json',
            required: true
        },
        {
            name: 'disco-agent-saas package.json exists',
            path: 'Documents/disco-agent-saas/package.json',
            required: true
        },
        {
            name: 'disco-agent-saas README.md exists',
            path: 'Documents/disco-agent-saas/README.md',
            required: true
        },
        {
            name: 'Root .npmrc exists',
            path: '.npmrc',
            required: true
        }
    ];

    let passed = 0;
    let failed = 0;

    checks.forEach(check => {
        const exists = checkExists(check.path);
        if (exists) {
            log(`✅ ${check.name}`, 'green');
            passed++;
        } else {
            if (check.required) {
                log(`❌ ${check.name} - MISSING`, 'red');
                failed++;
            } else {
                log(`⚠️  ${check.name} - not found (optional)`, 'yellow');
            }
        }
    });

    return { passed, failed };
}

function checkPathAliasConflicts() {
    log('\n🔍 Checking path alias conflicts...', 'yellow');
    
    try {
        const rootTsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
        const discoTsConfig = JSON.parse(fs.readFileSync('Documents/disco-agent-saas/tsconfig.json', 'utf8'));

        const rootAlias = rootTsConfig.compilerOptions?.paths?.['@/*'];
        const discoAlias = discoTsConfig.compilerOptions?.paths?.['@/*'];

        if (rootAlias && discoAlias) {
            if (JSON.stringify(rootAlias) !== JSON.stringify(discoAlias)) {
                log('✅ Path aliases are different (good - prevents conflicts)', 'green');
                log(`   Root: @/* → ${rootAlias.join(', ')}`, 'green');
                log(`   disco-agent-saas: @/* → ${discoAlias.join(', ')}`, 'green');
            } else {
                log('⚠️  Path aliases are the same - this could cause confusion', 'yellow');
                return false;
            }
        } else {
            log('⚠️  Could not read path aliases', 'yellow');
            return false;
        }

        // Check that Documents is excluded from root tsconfig
        const rootExclude = rootTsConfig.exclude || [];
        if (rootExclude.includes('Documents') || rootExclude.includes('Documents/')) {
            log('✅ Documents directory excluded from root tsconfig', 'green');
            return true;
        } else {
            log('⚠️  Documents directory not excluded from root tsconfig', 'yellow');
            log('   Add "Documents" to exclude array in tsconfig.json', 'yellow');
            return false;
        }
    } catch (error) {
        log(`❌ Error reading tsconfig files: ${error.message}`, 'red');
        return false;
    }
}

function checkBuildOutputs() {
    log('\n🔍 Checking build output isolation...', 'yellow');
    
    const rootNextExists = checkExists('.next');
    const discoNextExists = checkExists('Documents/disco-agent-saas/.next');

    if (rootNextExists && discoNextExists) {
        log('⚠️  Both projects have .next directories - ensure they are gitignored', 'yellow');
    } else if (rootNextExists) {
        log('✅ Root .next directory exists', 'green');
    } else if (discoNextExists) {
        log('✅ disco-agent-saas .next directory exists', 'green');
    } else {
        log('ℹ️  No build outputs found (clean state)', 'reset');
    }

    // Check gitignore
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    const hasRootNext = gitignore.includes('.next');
    const hasDiscoNext = gitignore.includes('Documents/disco-agent-saas/.next');

    if (hasRootNext && hasDiscoNext) {
        log('✅ Both .next directories are in .gitignore', 'green');
        return true;
    } else if (hasRootNext && !hasDiscoNext) {
        log('⚠️  disco-agent-saas .next not explicitly in .gitignore', 'yellow');
        return false;
    } else {
        log('❌ Build outputs not properly gitignored', 'red');
        return false;
    }
}

function checkDependencySeparation() {
    log('\n🔍 Checking dependency separation...', 'yellow');
    
    const rootNodeModules = checkExists('node_modules');
    const discoNodeModules = checkExists('Documents/disco-agent-saas/node_modules');

    if (rootNodeModules && discoNodeModules) {
        log('✅ Both projects have separate node_modules', 'green');
        return true;
    } else if (!rootNodeModules && !discoNodeModules) {
        log('ℹ️  No node_modules found - run npm install in each project', 'reset');
        return true;
    } else {
        log('⚠️  Only one project has node_modules installed', 'yellow');
        return false;
    }
}

function main() {
    log('\n═══════════════════════════════════════════════════', 'yellow');
    log('  File Conflict Validator', 'yellow');
    log('  Marketing Cognition System + disco-agent-saas', 'yellow');
    log('═══════════════════════════════════════════════════\n', 'yellow');

    const { passed, failed } = validateProjectSeparation();
    const aliasesOk = checkPathAliasConflicts();
    const buildsOk = checkBuildOutputs();
    const depsOk = checkDependencySeparation();

    log('\n═══════════════════════════════════════════════════', 'yellow');
    log('  Summary', 'yellow');
    log('═══════════════════════════════════════════════════', 'yellow');
    log(`Validation checks passed: ${passed}`, passed > 0 ? 'green' : 'reset');
    log(`Validation checks failed: ${failed}`, failed > 0 ? 'red' : 'reset');

    if (failed === 0 && aliasesOk && buildsOk) {
        log('\n✅ All safeguards are properly configured!', 'green');
        log('   Your files should not get mixed up.\n', 'green');
        process.exit(0);
    } else {
        log('\n⚠️  Some issues were found. Review the output above.', 'yellow');
        log('   Files might get mixed up without proper safeguards.\n', 'yellow');
        process.exit(1);
    }
}

main();
