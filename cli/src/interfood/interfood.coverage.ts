import { InterfoodToolError } from './interfood.error.js';
import {
  InterfoodCoverageRequirement,
  InterfoodDayCoverage,
  InterfoodOrderLine,
} from './interfood.models.js';

export function computeInterfoodCoverage(
  lines: InterfoodOrderLine[],
  requirements: InterfoodCoverageRequirement[],
): InterfoodDayCoverage[] {
  return requirements.map((requirement: InterfoodCoverageRequirement): InterfoodDayCoverage => {
    if (!Number.isInteger(requirement.expectedUnitCount) || requirement.expectedUnitCount < 1) {
      throw new InterfoodToolError(
        'MA-INTERFOOD-COVERAGE-REQUIREMENT',
        'Expected daily unit count must be a positive integer.',
        { requirement },
      );
    }
    const evidence: InterfoodOrderLine[] = lines.filter(
      (line: InterfoodOrderLine) => line.deliveryDate === requirement.date,
    );
    const orderedUnitCount: number = evidence
      .filter((line: InterfoodOrderLine) => line.state === 'active')
      .reduce((total: number, line: InterfoodOrderLine) => total + line.quantity, 0);
    return {
      date: requirement.date,
      status: orderedUnitCount === 0
        ? 'not-covered'
        : orderedUnitCount < requirement.expectedUnitCount
          ? 'partial'
          : 'covered',
      orderedUnitCount,
      expectedUnitCount: requirement.expectedUnitCount,
      evidence,
    };
  });
}
