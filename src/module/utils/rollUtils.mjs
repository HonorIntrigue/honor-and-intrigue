import { systemID } from '../constants.mjs';

/**
 * Determine the outcome of a roll.
 * @param {HonorIntrigueRoll} roll
 * @returns {String<ROLL_OUTCOME.key>} The key value of the outcome.
 */
export function determineManeuverOutcome(roll) {
  const useD10 = game.settings.get(systemID, 'd10') === true;
  const targetDC = useD10 ? 12 : 9;
  const outcomes = hi.CONFIG.ROLL_OUTCOME;
  let outcome = outcomes.Success;

  const { terms, total } = roll;
  const baseDiceTerm = terms[0];
  const [d1, d2] = baseDiceTerm.values;
  const baseTotal = baseDiceTerm.total;

  // Determine automatic crit/fail results.
  // CritFail on [1,1] or a total of 2-3 when using d10s
  // CritSuccess on [6,6] or a total of 19-20 when using d10s
  if ((d1 === d2 && d1 === 1) || (useD10 && baseTotal === 3)) {
    if (total < targetDC) outcome = outcomes.CritFailure;
    else outcome = outcomes.Failure;
  } else if ((d1 === d2 && d1 === baseDiceTerm.faces) || (useD10 && baseTotal === 19)) {
    if (total >= targetDC) outcome = outcomes.CritSuccess;
    else outcome = outcomes.Success;
  } else if (total < targetDC) {
    outcome = outcomes.Failure;
  }

  return outcome.key;
}
