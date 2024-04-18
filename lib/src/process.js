"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectCoverage = void 0;
const util_1 = require("./util");
const DUMMY_MODULE = {
    packages: [],
    counters: [],
};
/* eslint-disable @typescript-eslint/no-explicit-any */
function getProjectCoverage(reports, baseReports, changedFiles) {
    var _a;
    const moduleCoverages = [];
    const modules = getModulesFromReports(reports);
    const baseModules = getModulesFromReports(baseReports);
    for (const module of modules) {
        const baseModule = (_a = baseModules.find(m => m.name === module.name)) !== null && _a !== void 0 ? _a : DUMMY_MODULE;
        const files = getFileCoverageFromPackages([].concat(...module.packages), [].concat(...baseModule.packages), changedFiles);
        if (files.length !== 0) {
            const moduleCoverage = getModuleCoverage(module.root);
            const baseModuleCoverage = getModuleCoverage(module.root);
            const changedMissed = files
                .map(file => file.changed.missed)
                .reduce(sumReducer, 0.0);
            const changedCovered = files
                .map(file => file.changed.covered)
                .reduce(sumReducer, 0.0);
            moduleCoverages.push({
                name: module.name,
                files,
                overall: {
                    percentage: moduleCoverage.percentage,
                    covered: moduleCoverage.covered,
                    missed: moduleCoverage.missed,
                },
                base: {
                    percentage: baseModuleCoverage.percentage,
                    covered: baseModuleCoverage.covered,
                    missed: baseModuleCoverage.missed,
                },
                changed: {
                    covered: changedCovered,
                    missed: changedMissed,
                    percentage: calculatePercentage(changedCovered, changedMissed),
                },
            });
        }
    }
    moduleCoverages.sort((a, b) => { var _a, _b; return ((_a = b.overall.percentage) !== null && _a !== void 0 ? _a : 0) - ((_b = a.overall.percentage) !== null && _b !== void 0 ? _b : 0); });
    const totalFiles = moduleCoverages.flatMap(module => {
        return module.files;
    });
    const changedMissed = moduleCoverages
        .map(module => module.changed.missed)
        .reduce(sumReducer, 0.0);
    const changedCovered = moduleCoverages
        .map(module => module.changed.covered)
        .reduce(sumReducer, 0.0);
    const projectCoverage = getOverallProjectCoverage(reports);
    const baseProjectCoverage = getOverallProjectCoverage(baseReports);
    const totalPercentage = getTotalPercentage(totalFiles);
    return {
        modules: moduleCoverages,
        isMultiModule: reports.length > 1 || modules.length > 1,
        overall: {
            covered: projectCoverage.covered,
            missed: projectCoverage.missed,
            percentage: projectCoverage.percentage,
        },
        base: {
            covered: baseProjectCoverage.covered,
            missed: baseProjectCoverage.missed,
            percentage: baseProjectCoverage.percentage,
        },
        changed: {
            covered: changedCovered,
            missed: changedMissed,
            percentage: calculatePercentage(changedCovered, changedMissed),
        },
        'coverage-changed-files': totalPercentage !== null && totalPercentage !== void 0 ? totalPercentage : 100,
    };
}
exports.getProjectCoverage = getProjectCoverage;
function sumReducer(total, value) {
    return total + value;
}
function toFloat(value) {
    return parseFloat(value.toFixed(2));
}
function getModulesFromReports(reports) {
    const modules = [];
    for (const report of reports) {
        const groupTag = report[util_1.TAG.GROUP];
        if (groupTag) {
            const groups = groupTag.filter((group) => group !== undefined);
            for (const group of groups) {
                const module = getModuleFromParent(group);
                modules.push(module);
            }
        }
        const module = getModuleFromParent(report);
        if (module) {
            modules.push(module);
        }
    }
    return modules;
}
function getModuleFromParent(parent) {
    const packageTag = parent[util_1.TAG.PACKAGE];
    if (packageTag) {
        const packages = packageTag.filter((pacage) => pacage !== undefined);
        if (packages.length !== 0) {
            return {
                name: parent['$'].name,
                packages,
                root: parent, // TODO just pass array of 'counters'
            };
        }
    }
    return null;
}
function getFileCoverageFromPackages(packages, basePackages, files) {
    var _a, _b;
    const resultFiles = [];
    const jacocoFiles = (0, util_1.getFilesWithCoverage)(packages);
    const baseJacocoFiles = (0, util_1.getFilesWithCoverage)(basePackages);
    for (const jacocoFile of jacocoFiles) {
        const name = jacocoFile.name;
        const packageName = jacocoFile.packageName;
        const githubFile = files.find(function (f) {
            return f.filePath.endsWith(`${packageName}/${name}`);
        });
        const baseJacocoFile = baseJacocoFiles === null || baseJacocoFiles === void 0 ? void 0 : baseJacocoFiles.find(function (f) {
            return (f.packageName === jacocoFile.packageName && f.name === jacocoFile.name);
        });
        if (githubFile) {
            const instruction = jacocoFile.counters.find(counter => counter.name === 'instruction');
            if (instruction) {
                const baseInstruction = baseJacocoFile === null || baseJacocoFile === void 0 ? void 0 : baseJacocoFile.counters.find(counter => counter.name === 'instruction');
                const missed = instruction.missed;
                const covered = instruction.covered;
                const baseMissed = (_a = baseInstruction === null || baseInstruction === void 0 ? void 0 : baseInstruction.missed) !== null && _a !== void 0 ? _a : 0;
                const baseCovered = (_b = baseInstruction === null || baseInstruction === void 0 ? void 0 : baseInstruction.covered) !== null && _b !== void 0 ? _b : 0;
                const lines = [];
                for (const lineNumber of githubFile.lines) {
                    const jacocoLine = jacocoFile.lines.find(line => line.number === lineNumber);
                    if (jacocoLine) {
                        lines.push(Object.assign({}, jacocoLine));
                    }
                }
                const changedMissed = lines
                    .map(line => toFloat(line.instruction.missed))
                    .reduce(sumReducer, 0.0);
                const changedCovered = lines
                    .map(line => toFloat(line.instruction.covered))
                    .reduce(sumReducer, 0.0);
                resultFiles.push({
                    name,
                    url: githubFile.url,
                    overall: {
                        missed,
                        covered,
                        percentage: calculatePercentage(covered, missed),
                    },
                    base: {
                        missed: baseMissed,
                        covered: baseCovered,
                        percentage: calculatePercentage(baseCovered, baseMissed),
                    },
                    changed: {
                        missed: changedMissed,
                        covered: changedCovered,
                        percentage: calculatePercentage(changedCovered, changedMissed),
                    },
                    lines,
                });
            }
        }
    }
    resultFiles.sort((a, b) => { var _a, _b; return ((_a = b.overall.percentage) !== null && _a !== void 0 ? _a : 0) - ((_b = a.overall.percentage) !== null && _b !== void 0 ? _b : 0); });
    return resultFiles;
}
function calculatePercentage(covered, missed) {
    const total = covered + missed;
    if (total !== 0) {
        return parseFloat(((covered / total) * 100).toFixed(2));
    }
    else {
        return undefined;
    }
}
function getTotalPercentage(files) {
    let missed = 0;
    let covered = 0;
    if (files.length !== 0) {
        for (const file of files) {
            missed += file.overall.missed;
            covered += file.overall.covered;
        }
        return parseFloat(((covered / (covered + missed)) * 100).toFixed(2));
    }
    else {
        return null;
    }
}
function getModuleCoverage(report) {
    const counters = report['counter'];
    return getDetailedCoverage(counters, 'INSTRUCTION');
}
function getOverallProjectCoverage(reports) {
    const coverages = reports.map(report => getDetailedCoverage(report['counter'], 'INSTRUCTION'));
    const covered = coverages.reduce((acc, coverage) => acc + coverage.covered, 0);
    const missed = coverages.reduce((acc, coverage) => acc + coverage.missed, 0);
    return {
        covered,
        missed,
        percentage: parseFloat(((covered / (covered + missed)) * 100).toFixed(2)),
    };
}
function getDetailedCoverage(counters, type) {
    const counterTag = counters.find(counter => counter[util_1.TAG.SELF].type === type);
    if (counterTag) {
        const attr = counterTag[util_1.TAG.SELF];
        const missed = parseFloat(attr.missed);
        const covered = parseFloat(attr.covered);
        return {
            missed,
            covered,
            percentage: parseFloat(((covered / (covered + missed)) * 100).toFixed(2)),
        };
    }
    return { missed: 0, covered: 0, percentage: 100 };
}
