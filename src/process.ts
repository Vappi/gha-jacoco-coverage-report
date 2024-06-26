import {getFilesWithCoverage, TAG} from './util'
import {ChangedFile} from './models/github'
import {Coverage, File, Module, Project} from './models/project'

const DUMMY_MODULE = {
  packages: [],
  counters: [],
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getProjectCoverage(
  reports: any[],
  baseReports: any[],
  changedFiles: ChangedFile[]
): Project {
  const moduleCoverages: Module[] = []
  const modules = getModulesFromReports(reports)
  const baseModules = getModulesFromReports(baseReports)
  for (const module of modules) {
    const baseModule =
      baseModules.find(m => m.name === module.name) ?? DUMMY_MODULE

    const files = getFileCoverageFromPackages(
      [].concat(...module.packages),
      [].concat(...baseModule.packages),
      changedFiles
    )
    if (files.length !== 0) {
      const moduleCoverage = getModuleCoverage(module.root)
      const baseModuleCoverage = getModuleCoverage(module.root)
      const changedMissed = files
        .map(file => file.changed.missed)
        .reduce(sumReducer, 0.0)
      const changedCovered = files
        .map(file => file.changed.covered)
        .reduce(sumReducer, 0.0)
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
      })
    }
  }
  moduleCoverages.sort(
    (a, b) => (b.overall.percentage ?? 0) - (a.overall.percentage ?? 0)
  )
  const totalFiles = moduleCoverages.flatMap(module => {
    return module.files
  })

  const changedMissed = moduleCoverages
    .map(module => module.changed.missed)
    .reduce(sumReducer, 0.0)
  const changedCovered = moduleCoverages
    .map(module => module.changed.covered)
    .reduce(sumReducer, 0.0)

  const projectCoverage = getOverallProjectCoverage(reports)
  const baseProjectCoverage = getOverallProjectCoverage(baseReports)
  const totalPercentage = getTotalPercentage(totalFiles)
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
    'coverage-changed-files': totalPercentage ?? 100,
  }
}

function sumReducer(total: number, value: number): number {
  return total + value
}

function toFloat(value: number): number {
  return parseFloat(value.toFixed(2))
}

function getModulesFromReports(reports: any[]): any[] {
  const modules = []
  for (const report of reports) {
    const groupTag = report[TAG.GROUP]
    if (groupTag) {
      const groups = groupTag.filter((group: any) => group !== undefined)
      for (const group of groups) {
        const module = getModuleFromParent(group)
        modules.push(module)
      }
    }
    const module = getModuleFromParent(report)
    if (module) {
      modules.push(module)
    }
  }
  return modules
}

function getModuleFromParent(parent: any): any | null {
  const packageTag = parent[TAG.PACKAGE]
  if (packageTag) {
    const packages = packageTag.filter((pacage: any) => pacage !== undefined)
    if (packages.length !== 0) {
      return {
        name: parent['$'].name,
        packages,
        root: parent, // TODO just pass array of 'counters'
      }
    }
  }
  return null
}

function getFileCoverageFromPackages(
  packages: any[],
  basePackages: ChangedFile[],
  files: ChangedFile[]
): File[] {
  const resultFiles: File[] = []
  const jacocoFiles = getFilesWithCoverage(packages)
  const baseJacocoFiles = getFilesWithCoverage(basePackages)

  for (const jacocoFile of jacocoFiles) {
    const name = jacocoFile.name
    const packageName = jacocoFile.packageName
    const githubFile = files.find(function (f) {
      return f.filePath.endsWith(`${packageName}/${name}`)
    })

    const baseJacocoFile = baseJacocoFiles?.find(function (f) {
      return (
        f.packageName === jacocoFile.packageName && f.name === jacocoFile.name
      )
    })
    const instruction = jacocoFile.counters.find(
      counter => counter.name === 'instruction'
    )
    const baseInstruction = baseJacocoFile?.counters.find(
      counter => counter.name === 'instruction'
    )
    const isCoverageChanged =
      (!!instruction || !!baseInstruction) &&
      calculatePercentage(
        instruction?.covered ?? 0,
        instruction?.missed ?? 0
      ) !==
        calculatePercentage(
          baseInstruction?.covered ?? 0,
          baseInstruction?.missed ?? 0
        )

    if (githubFile || isCoverageChanged) {
      if (instruction) {
        const missed = instruction.missed
        const covered = instruction.covered
        const baseMissed = baseInstruction?.missed ?? 0
        const baseCovered = baseInstruction?.covered ?? 0

        const lines = []
        for (const lineNumber of githubFile?.lines ?? []) {
          const jacocoLine = jacocoFile.lines.find(
            line => line.number === lineNumber
          )
          if (jacocoLine) {
            lines.push({
              ...jacocoLine,
            })
          }
        }
        const changedMissed = lines
          .map(line => toFloat(line.instruction.missed))
          .reduce(sumReducer, 0.0)
        const changedCovered = lines
          .map(line => toFloat(line.instruction.covered))
          .reduce(sumReducer, 0.0)
        resultFiles.push({
          name,
          url: githubFile?.url ?? '#',
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
        })
      }
    }
  }
  resultFiles.sort(
    (a, b) => (b.overall.percentage ?? 0) - (a.overall.percentage ?? 0)
  )

  return resultFiles
}

function calculatePercentage(
  covered: number,
  missed: number
): number | undefined {
  const total = covered + missed
  if (total !== 0) {
    return parseFloat(((covered / total) * 100).toFixed(2))
  } else {
    return undefined
  }
}

function getTotalPercentage(files: File[]): number | null {
  let missed = 0
  let covered = 0
  if (files.length !== 0) {
    for (const file of files) {
      missed += file.overall.missed
      covered += file.overall.covered
    }
    return parseFloat(((covered / (covered + missed)) * 100).toFixed(2))
  } else {
    return null
  }
}

function getModuleCoverage(report: any): Coverage {
  const counters = report['counter']
  return getDetailedCoverage(counters, 'INSTRUCTION')
}

function getOverallProjectCoverage(reports: any[]): Coverage {
  const coverages = reports.map(report =>
    getDetailedCoverage(report['counter'], 'INSTRUCTION')
  )
  const covered = coverages.reduce((acc, coverage) => acc + coverage.covered, 0)
  const missed = coverages.reduce((acc, coverage) => acc + coverage.missed, 0)
  return {
    covered,
    missed,
    percentage: parseFloat(((covered / (covered + missed)) * 100).toFixed(2)),
  }
}

function getDetailedCoverage(counters: any[], type: string): Coverage {
  const counterTag = counters.find(counter => counter[TAG.SELF].type === type)
  if (counterTag) {
    const attr = counterTag[TAG.SELF]
    const missed = parseFloat(attr.missed)
    const covered = parseFloat(attr.covered)
    return {
      missed,
      covered,
      percentage: parseFloat(((covered / (covered + missed)) * 100).toFixed(2)),
    }
  }
  return {missed: 0, covered: 0, percentage: 100}
}
